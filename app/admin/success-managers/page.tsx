"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  owner_user_id: string | null;
  status: string;
};

type Assignment = {
  id: string;
  restaurant_id: string;
  manager_user_id: string | null;
  manager_name: string;
  manager_email: string | null;
  manager_photo_url: string | null;
  booking_url: string | null;
  active: boolean;
};

type MessageRow = {
  id: string;
  restaurant_id: string;
  assignment_id: string | null;
  sender_user_id: string;
  sender_role: "owner" | "success_manager" | "platform_admin";
  message: string;
  created_at: string;
  read_at: string | null;
};

export default function AdminSuccessManagerInboxPage() {
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [managerName, setManagerName] = useState("Restaurant OS Success Team");
  const [managerEmail, setManagerEmail] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id,active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (!adminRow) {
      setMessage("Platform admin access required.");
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    const [restaurantResult, assignmentResult, messageResult] =
      await Promise.all([
        supabase
          .from("restaurants")
          .select("id,name,owner_user_id,status")
          .order("name", { ascending: true }),
        supabase
          .from("restaurant_success_manager_assignments")
          .select("*")
          .eq("active", true),
        supabase
          .from("restaurant_success_messages")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

    if (restaurantResult.error) {
      setMessage(restaurantResult.error.message);
      setLoading(false);
      return;
    }

    if (assignmentResult.error) {
      setMessage(assignmentResult.error.message);
      setLoading(false);
      return;
    }

    if (messageResult.error) {
      setMessage(messageResult.error.message);
      setLoading(false);
      return;
    }

    const restaurantRows = (restaurantResult.data || []) as Restaurant[];
    const assignmentRows = (assignmentResult.data || []) as Assignment[];
    const messageRows = (messageResult.data || []) as MessageRow[];

    setRestaurants(restaurantRows);
    setAssignments(assignmentRows);
    setMessages(messageRows);

    const params = new URLSearchParams(window.location.search);
    const requested = params.get("restaurant");
    const initial =
      requested && restaurantRows.some((row) => row.id === requested)
        ? requested
        : restaurantRows[0]?.id || "";

    setSelectedId(initial);
    hydrateAssignment(initial, assignmentRows, user.email || "");
    setLoading(false);
  }

  function hydrateAssignment(
    restaurantId: string,
    rows = assignments,
    fallbackEmail = userEmail
  ) {
    const a = rows.find((row) => row.restaurant_id === restaurantId);
    setManagerName(a?.manager_name || "Restaurant OS Success Team");
    setManagerEmail(a?.manager_email || fallbackEmail || "");
    setBookingUrl(a?.booking_url || "");
  }

  function selectRestaurant(id: string) {
    setSelectedId(id);
    setDraft("");
    setMessage("");
    hydrateAssignment(id);
    const url = new URL(window.location.href);
    url.searchParams.set("restaurant", id);
    window.history.replaceState({}, "", url.toString());
  }

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((row) => row.name.toLowerCase().includes(q));
  }, [restaurants, search]);

  const selectedRestaurant =
    restaurants.find((row) => row.id === selectedId) || null;

  const selectedAssignment =
    assignments.find((row) => row.restaurant_id === selectedId) || null;

  const selectedMessages = messages.filter(
    (row) => row.restaurant_id === selectedId
  );

  function lastActivity(restaurantId: string) {
    const row = [...messages]
      .reverse()
      .find((item) => item.restaurant_id === restaurantId);
    return row?.created_at || "";
  }

  function customerMessageCount(restaurantId: string) {
    return messages.filter(
      (row) => row.restaurant_id === restaurantId && row.sender_role === "owner"
    ).length;
  }

  async function saveAssignment(assignToMe = false) {
    if (!selectedAssignment || !selectedId) return;

    setSavingAssignment(true);
    setMessage("");

    const payload = {
      manager_user_id: assignToMe
        ? userId
        : selectedAssignment.manager_user_id,
      manager_name: managerName.trim() || "Restaurant OS Success Team",
      manager_email: managerEmail.trim() || null,
      booking_url: bookingUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("restaurant_success_manager_assignments")
      .update(payload)
      .eq("id", selectedAssignment.id)
      .select("*")
      .single();

    setSavingAssignment(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setAssignments((current) =>
      current.map((row) => (row.id === data.id ? (data as Assignment) : row))
    );

    setMessage(
      assignToMe
        ? "Success Manager assigned to this restaurant."
        : "Success Manager profile updated."
    );
  }

  async function sendReply() {
    const clean = draft.trim();
    if (!clean || !selectedRestaurant || !userId) return;

    setSending(true);
    setMessage("");

    const role =
      selectedAssignment?.manager_user_id === userId
        ? "success_manager"
        : "platform_admin";

    const { data, error } = await supabase
      .from("restaurant_success_messages")
      .insert({
        restaurant_id: selectedRestaurant.id,
        assignment_id: selectedAssignment?.id || null,
        sender_user_id: userId,
        sender_role: role,
        message: clean,
      })
      .select("*")
      .single();

    setSending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessages((current) => [...current, data as MessageRow]);
    setDraft("");
  }

  if (loading) {
    return (
      <main className="page">
        <Styles />
        <div className="loading">Loading Success Manager Inbox...</div>
      </main>
    );
  }

  return (
    <main className="page">
      <Styles />

      <header className="top">
        <div>
          <div className="brandline">RESTAURANT OS · SUCCESS MANAGER COMMAND</div>
          <h1>GROWTH PARTNER INBOX</h1>
          <p>
            One place to manage restaurant conversations, assigned managers and
            strategy-call access.
          </p>
        </div>

        <button onClick={() => (window.location.href = "/admin")}>
          BACK TO ADMIN
        </button>
      </header>

      {message && <div className="notice">{message}</div>}

      <div className="workspace">
        <aside className="queue">
          <div className="queueHead">
            <div>
              <span>RESTAURANTS</span>
              <strong>{restaurants.length}</strong>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurant..."
            />
          </div>

          <div className="queueList">
            {filteredRestaurants.map((restaurant) => {
              const assignment = assignments.find(
                (row) => row.restaurant_id === restaurant.id
              );
              const last = lastActivity(restaurant.id);
              const count = customerMessageCount(restaurant.id);

              return (
                <button
                  key={restaurant.id}
                  className={`queueItem ${
                    selectedId === restaurant.id ? "active" : ""
                  }`}
                  onClick={() => selectRestaurant(restaurant.id)}
                >
                  <div className="queueTop">
                    <strong>{restaurant.name}</strong>
                    <span>{count}</span>
                  </div>
                  <div className="queueMeta">
                    {assignment?.manager_user_id
                      ? assignment.manager_name
                      : "UNASSIGNED"}
                  </div>
                  <div className="queueTime">
                    {last
                      ? `Last activity ${new Date(last).toLocaleDateString()}`
                      : "No conversation yet"}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="main">
          {!selectedRestaurant ? (
            <div className="empty">Select a restaurant.</div>
          ) : (
            <>
              <section className="assignmentPanel">
                <div className="assignmentHead">
                  <div>
                    <div className="kicker">DEDICATED SUCCESS MANAGER</div>
                    <h2>{selectedRestaurant.name}</h2>
                  </div>
                  <button
                    className="assignMe"
                    onClick={() => saveAssignment(true)}
                    disabled={savingAssignment}
                  >
                    {savingAssignment ? "SAVING..." : "ASSIGN ME"}
                  </button>
                </div>

                <div className="assignmentGrid">
                  <label>
                    <span>MANAGER NAME</span>
                    <input
                      value={managerName}
                      onChange={(event) => setManagerName(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>MANAGER EMAIL</span>
                    <input
                      value={managerEmail}
                      onChange={(event) => setManagerEmail(event.target.value)}
                    />
                  </label>
                  <label className="wide">
                    <span>STRATEGY CALL BOOKING URL</span>
                    <input
                      value={bookingUrl}
                      onChange={(event) => setBookingUrl(event.target.value)}
                      placeholder="https://calendar.google.com/... or Calendly link"
                    />
                  </label>
                </div>

                <div className="assignmentActions">
                  <button
                    onClick={() => saveAssignment(false)}
                    disabled={savingAssignment}
                  >
                    SAVE MANAGER PROFILE
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `/owner/success-manager?restaurant=${selectedRestaurant.id}`,
                        "_blank"
                      )
                    }
                  >
                    OPEN CUSTOMER VIEW ↗
                  </button>
                </div>
              </section>

              <section className="threadPanel">
                <div className="threadHead">
                  <div>
                    <div className="kicker">RESTAURANT THREAD</div>
                    <h2>MESSAGE HISTORY</h2>
                  </div>
                  <span>{selectedMessages.length} MESSAGES</span>
                </div>

                <div className="thread">
                  {selectedMessages.length === 0 ? (
                    <div className="empty">
                      No conversation yet. The restaurant can initiate from its
                      Command Center.
                    </div>
                  ) : (
                    selectedMessages.map((row) => {
                      const owner = row.sender_role === "owner";
                      return (
                        <div
                          key={row.id}
                          className={`messageRow ${owner ? "owner" : "team"}`}
                        >
                          <div className="bubble">
                            <div className="meta">
                              <span>
                                {owner
                                  ? "RESTAURANT OWNER"
                                  : row.sender_role === "success_manager"
                                  ? "SUCCESS MANAGER"
                                  : "RESTAURANT OS TEAM"}
                              </span>
                              <span>
                                {new Date(row.created_at).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div>{row.message}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="composer">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Reply to ${selectedRestaurant.name}...`}
                    maxLength={4000}
                    rows={4}
                  />
                  <div className="composerFoot">
                    <span>{draft.length}/4000</span>
                    <button
                      className="send"
                      disabled={sending || !draft.trim()}
                      onClick={sendReply}
                    >
                      {sending ? "SENDING..." : "SEND REPLY →"}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; }
      html, body { margin: 0; background: #050505; }
      button, input, textarea { font: inherit; }

      .page {
        min-height: 100vh;
        padding: 28px;
        color: #fff;
        font-family: Arial, Helvetica, sans-serif;
        background:
          radial-gradient(circle at 86% 0%, rgba(225,34,45,.14), transparent 25%),
          #050505;
      }

      .loading { max-width: 1400px; margin: 70px auto; color: #888; }

      .top {
        max-width: 1500px;
        margin: 0 auto 18px;
        padding-bottom: 20px;
        border-bottom: 1px solid #222;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .brandline, .kicker {
        color: #ee2a35;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1.8px;
      }

      .top h1 {
        margin: 8px 0 8px;
        font-size: clamp(40px,5.5vw,70px);
        line-height: .9;
        letter-spacing: -3.8px;
      }

      .top p { margin: 0; color: #777; font-size: 12px; }

      button {
        border: 1px solid #333;
        border-radius: 8px;
        background: #111;
        color: #fff;
        padding: 11px 13px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 1000;
        letter-spacing: .65px;
      }

      .notice {
        max-width: 1500px;
        margin: 0 auto 14px;
        border: 1px solid #5d252a;
        border-radius: 9px;
        padding: 11px 13px;
        background: #180b0d;
        color: #ff959a;
        font-size: 11px;
      }

      .workspace {
        max-width: 1500px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 330px minmax(0,1fr);
        gap: 14px;
      }

      .queue, .assignmentPanel, .threadPanel {
        border: 1px solid #282828;
        border-radius: 14px;
        background: #0b0b0b;
        overflow: hidden;
      }

      .queue { min-height: 760px; }

      .queueHead {
        padding: 16px;
        border-bottom: 1px solid #242424;
      }

      .queueHead > div {
        display: flex;
        justify-content: space-between;
        color: #777;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .queueHead strong { color: #fff; }

      input, textarea {
        width: 100%;
        background: #070707;
        color: #fff;
        border: 1px solid #333;
        border-radius: 8px;
        outline: none;
      }

      .queueHead input {
        margin-top: 10px;
        padding: 10px 11px;
        font-size: 11px;
      }

      .queueList {
        display: grid;
        max-height: 700px;
        overflow-y: auto;
      }

      .queueItem {
        border: 0;
        border-bottom: 1px solid #1f1f1f;
        border-radius: 0;
        padding: 14px 15px;
        text-align: left;
        background: #0b0b0b;
      }

      .queueItem.active {
        background: #1a0b0d;
        box-shadow: inset 3px 0 0 #e1222d;
      }

      .queueTop {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .queueTop strong { font-size: 12px; }
      .queueTop span {
        min-width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: #1c1c1c;
        color: #ff737b;
        font-size: 8px;
      }

      .queueMeta {
        margin-top: 5px;
        color: #d84b54;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .queueTime {
        margin-top: 5px;
        color: #555;
        font-size: 8px;
      }

      .main { display: grid; gap: 14px; align-content: start; }

      .assignmentPanel { padding: 20px; }

      .assignmentHead {
        display: flex;
        justify-content: space-between;
        gap: 15px;
        align-items: flex-start;
      }

      .assignmentHead h2 {
        margin: 6px 0 0;
        font-size: 28px;
        letter-spacing: -1.2px;
      }

      .assignMe {
        background: #e1222d;
        border-color: #e1222d;
      }

      .assignmentGrid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 11px;
      }

      .assignmentGrid label { display: grid; gap: 6px; }
      .assignmentGrid label.wide { grid-column: 1 / -1; }

      .assignmentGrid label span {
        color: #666;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .assignmentGrid input { padding: 11px 12px; font-size: 11px; }

      .assignmentActions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .threadPanel { overflow: hidden; }

      .threadHead {
        padding: 18px 20px;
        border-bottom: 1px solid #242424;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
      }

      .threadHead h2 {
        margin: 5px 0 0;
        font-size: 24px;
        letter-spacing: -1px;
      }

      .threadHead > span {
        color: #666;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .thread {
        min-height: 340px;
        max-height: 500px;
        overflow-y: auto;
        padding: 18px;
        background: #070707;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .empty {
        margin: auto;
        color: #666;
        font-size: 11px;
        text-align: center;
        line-height: 1.5;
      }

      .messageRow { display: flex; }
      .messageRow.owner { justify-content: flex-start; }
      .messageRow.team { justify-content: flex-end; }

      .bubble {
        width: min(76%, 700px);
        padding: 12px 13px;
        border: 1px solid #292929;
        border-radius: 11px;
        background: #111;
        font-size: 11px;
        line-height: 1.55;
      }

      .team .bubble {
        border-color: #64272c;
        background: #190b0d;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
        color: #666;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .team .meta span:first-child { color: #ff757d; }

      .composer {
        padding: 15px;
        border-top: 1px solid #242424;
      }

      textarea {
        padding: 12px;
        min-height: 105px;
        resize: vertical;
        font-size: 11px;
        line-height: 1.5;
      }

      .composerFoot {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }

      .composerFoot span { color: #555; font-size: 8px; }

      .send {
        background: #e1222d;
        border-color: #e1222d;
      }

      @media (max-width: 900px) {
        .page { padding: 16px; }
        .workspace { grid-template-columns: 1fr; }
        .queue { min-height: auto; }
        .queueList { max-height: 300px; }
        .assignmentGrid { grid-template-columns: 1fr; }
        .assignmentGrid label.wide { grid-column: auto; }
        .bubble { width: 92%; }
      }
    `}</style>
  );
}
