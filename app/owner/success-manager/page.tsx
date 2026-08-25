"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  owner_user_id: string | null;
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

export default function OwnerSuccessManagerPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [senderRole, setSenderRole] = useState<
    "owner" | "success_manager" | "platform_admin"
  >("owner");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant");

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCurrentUserId(user.id);

    const { data: owned } = await supabase
      .from("restaurants")
      .select("id,name,owner_user_id")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    let restaurantData = owned as Restaurant | null;
    let role: "owner" | "success_manager" | "platform_admin" = "owner";

    const { data: assignmentData } = await supabase
      .from("restaurant_success_manager_assignments")
      .select("*")
      .eq("restaurant_id", id)
      .eq("active", true)
      .maybeSingle();

    if (!restaurantData) {
      if (assignmentData?.manager_user_id === user.id) {
        const { data: managerRestaurant } = await supabase
          .from("restaurants")
          .select("id,name,owner_user_id")
          .eq("id", id)
          .maybeSingle();

        restaurantData = managerRestaurant as Restaurant | null;
        role = "success_manager";
      } else {
        const { data: adminRow } = await supabase
          .from("platform_admins")
          .select("user_id,active")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (adminRow) {
          const { data: adminRestaurant } = await supabase
            .from("restaurants")
            .select("id,name,owner_user_id")
            .eq("id", id)
            .maybeSingle();

          restaurantData = adminRestaurant as Restaurant | null;
          role = "platform_admin";
        }
      }
    }

    if (!restaurantData) {
      setMessage("Restaurant not found or access denied.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);
    setAssignment((assignmentData || null) as Assignment | null);
    setSenderRole(role);

    const { data: thread, error: threadError } = await supabase
      .from("restaurant_success_messages")
      .select("*")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: true });

    if (threadError) {
      setMessage(threadError.message);
      setMessages([]);
    } else {
      setMessages((thread || []) as MessageRow[]);
    }

    setLoading(false);
  }

  async function sendMessage() {
    const clean = draft.trim();

    if (!clean || !restaurantId || !currentUserId) return;

    setSending(true);
    setMessage("");

    const { data, error } = await supabase
      .from("restaurant_success_messages")
      .insert({
        restaurant_id: restaurantId,
        assignment_id: assignment?.id || null,
        sender_user_id: currentUserId,
        sender_role: senderRole,
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

  const managerName = assignment?.manager_name || "Restaurant OS Success Team";
  const initials = useMemo(() => {
    return managerName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "OS";
  }, [managerName]);

  const bookingUrl =
    assignment?.booking_url && /^https?:\/\//i.test(assignment.booking_url)
      ? assignment.booking_url
      : "";

  function back() {
    window.location.href = `/owner?restaurant=${restaurantId}`;
  }

  if (loading) {
    return (
      <main className="page">
        <Styles />
        <div className="shell loading">Loading your Success Manager...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="page">
        <Styles />
        <div className="shell loading">{message || "Restaurant not found."}</div>
      </main>
    );
  }

  return (
    <main className="page">
      <Styles />

      <div className="shell">
        <header className="top">
          <div>
            <div className="brandline">
              RESTAURANT <span>OS</span> · HUMAN GROWTH SUPPORT
            </div>
            <h1>YOUR SUCCESS MANAGER</h1>
            <p>
              Strategy, campaigns, offers, reviews and growth support — one
              conversation tied directly to {restaurant.name}.
            </p>
          </div>

          <button onClick={back}>BACK TO COMMAND CENTER</button>
        </header>

        {message && <div className="notice">{message}</div>}

        <section className="managerHero">
          <div className="identity">
            {assignment?.manager_photo_url ? (
              <img
                className="avatar image"
                src={assignment.manager_photo_url}
                alt={managerName}
              />
            ) : (
              <div className="avatar">{initials}</div>
            )}

            <div>
              <div className="kicker">YOUR GROWTH PARTNER</div>
              <h2>{managerName}</h2>
              <div className="status">
                <span className="dot" />
                ASSIGNED TO {restaurant.name.toUpperCase()}
              </div>
              <p>
                Use this channel for campaign ideas, promotions, customer
                growth, review strategy, catering pushes or anything that helps
                move the restaurant forward.
              </p>
            </div>
          </div>

          <div className="managerActions">
            <a className="primaryAction" href="#conversation">
              MESSAGE MANAGER →
            </a>

            {bookingUrl ? (
              <a
                className="secondaryAction"
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
              >
                BOOK STRATEGY CALL ↗
              </a>
            ) : (
              <button className="secondaryAction disabled" disabled>
                STRATEGY CALL LINK COMING SOON
              </button>
            )}

            <div className="expectation">
              <strong>RESPONSE STANDARD</strong>
              <span>Messages are handled during normal business hours.</span>
            </div>
          </div>
        </section>

        <section className="conversation" id="conversation">
          <div className="conversationHead">
            <div>
              <div className="kicker">PRIVATE RESTAURANT THREAD</div>
              <h2>GROWTH CONVERSATION</h2>
            </div>
            <button onClick={load}>REFRESH THREAD</button>
          </div>

          <div className="thread">
            {messages.length === 0 ? (
              <div className="empty">
                <strong>Start the conversation.</strong>
                <span>
                  Ask for an offer idea, campaign help, review strategy or the
                  next best move for your restaurant.
                </span>
              </div>
            ) : (
              messages.map((row) => {
                const mine = row.sender_user_id === currentUserId;
                const roleLabel =
                  row.sender_role === "owner"
                    ? "RESTAURANT"
                    : row.sender_role === "success_manager"
                    ? "SUCCESS MANAGER"
                    : "RESTAURANT OS TEAM";

                return (
                  <div
                    key={row.id}
                    className={`messageRow ${mine ? "mine" : "theirs"}`}
                  >
                    <div className="bubble">
                      <div className="bubbleMeta">
                        <span>{roleLabel}</span>
                        <span>
                          {new Date(row.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bubbleText">{row.message}</div>
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
              placeholder="Message your Success Manager..."
              maxLength={4000}
              rows={5}
            />
            <div className="composerFoot">
              <span>{draft.length}/4000</span>
              <button
                className="send"
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
              >
                {sending ? "SENDING..." : "SEND TO SUCCESS MANAGER →"}
              </button>
            </div>
          </div>
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
      button, textarea { font: inherit; }

      .page {
        min-height: 100vh;
        padding: 30px;
        color: #fff;
        font-family: Arial, Helvetica, sans-serif;
        background:
          radial-gradient(circle at 86% 0%, rgba(225,34,45,.16), transparent 26%),
          linear-gradient(180deg,#070707,#030303);
      }

      .shell { max-width: 1240px; margin: 0 auto; }
      .loading { padding-top: 80px; color: #999; }

      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        flex-wrap: wrap;
        padding-bottom: 22px;
        margin-bottom: 20px;
        border-bottom: 1px solid #1e1e1e;
      }

      .brandline, .kicker {
        color: #ee2a35;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1.8px;
      }

      .brandline span { color: #fff; }

      .top h1 {
        margin: 9px 0 9px;
        font-size: clamp(44px,6vw,76px);
        line-height: .9;
        letter-spacing: -4px;
        font-weight: 1000;
      }

      .top p {
        margin: 0;
        max-width: 720px;
        color: #888;
        font-size: 13px;
        line-height: 1.55;
      }

      button, .primaryAction, .secondaryAction {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
        padding: 12px 14px;
        border: 1px solid #343434;
        background: #101010;
        color: #fff;
        text-decoration: none;
        cursor: pointer;
        font-size: 9px;
        font-weight: 1000;
        letter-spacing: .7px;
      }

      .notice {
        margin-bottom: 16px;
        padding: 12px 14px;
        border: 1px solid #5a252a;
        border-radius: 10px;
        background: #190b0d;
        color: #ff9298;
        font-size: 11px;
      }

      .managerHero {
        display: grid;
        grid-template-columns: minmax(0,1.3fr) minmax(300px,.7fr);
        gap: 22px;
        padding: 26px;
        border: 1px solid #382126;
        border-left: 3px solid #e1222d;
        border-radius: 16px;
        background:
          radial-gradient(circle at 80% 20%, rgba(225,34,45,.12), transparent 30%),
          linear-gradient(145deg,#121212,#090909);
        box-shadow: 0 20px 60px rgba(0,0,0,.28);
      }

      .identity {
        display: flex;
        gap: 20px;
        align-items: flex-start;
      }

      .avatar {
        width: 82px;
        height: 82px;
        flex: 0 0 82px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: linear-gradient(145deg,#e1222d,#7f1018);
        color: #fff;
        font-size: 26px;
        font-weight: 1000;
        border: 1px solid #ef4c55;
        object-fit: cover;
      }

      .avatar.image { display: block; }

      .identity h2 {
        margin: 7px 0 8px;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -1.4px;
      }

      .identity p {
        color: #858585;
        line-height: 1.55;
        max-width: 680px;
        font-size: 12px;
        margin: 13px 0 0;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #81d99f;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1.2px;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #4ed17c;
        box-shadow: 0 0 0 4px rgba(78,209,124,.08);
      }

      .managerActions {
        display: grid;
        align-content: start;
        gap: 10px;
      }

      .primaryAction {
        border-color: #e1222d;
        background: #e1222d;
        color: #fff;
        box-shadow: 0 12px 28px rgba(225,34,45,.17);
      }

      .secondaryAction {
        border-color: #5a252a;
        background: #16090b;
        color: #ff777f;
      }

      .disabled {
        opacity: .45;
        cursor: default;
      }

      .expectation {
        margin-top: 5px;
        padding: 13px;
        border: 1px solid #272727;
        border-radius: 10px;
        background: #090909;
      }

      .expectation strong {
        display: block;
        color: #aaa;
        font-size: 8px;
        letter-spacing: 1.2px;
      }

      .expectation span {
        display: block;
        margin-top: 5px;
        color: #666;
        font-size: 10px;
        line-height: 1.45;
      }

      .conversation {
        margin-top: 18px;
        border: 1px solid #282828;
        border-radius: 16px;
        overflow: hidden;
        background: #090909;
      }

      .conversationHead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        padding: 20px 22px;
        border-bottom: 1px solid #242424;
        background: #0d0d0d;
      }

      .conversationHead h2 {
        margin: 5px 0 0;
        font-size: 26px;
        letter-spacing: -1px;
      }

      .thread {
        min-height: 380px;
        max-height: 600px;
        overflow-y: auto;
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background:
          radial-gradient(circle at 78% 5%, rgba(225,34,45,.045), transparent 30%),
          #070707;
      }

      .empty {
        margin: auto;
        max-width: 440px;
        text-align: center;
        color: #666;
      }

      .empty strong {
        display: block;
        color: #fff;
        font-size: 20px;
        margin-bottom: 7px;
      }

      .empty span {
        font-size: 11px;
        line-height: 1.55;
      }

      .messageRow { display: flex; }
      .messageRow.mine { justify-content: flex-end; }
      .messageRow.theirs { justify-content: flex-start; }

      .bubble {
        width: min(76%, 680px);
        padding: 13px 14px;
        border-radius: 12px;
        border: 1px solid #292929;
        background: #111;
      }

      .mine .bubble {
        border-color: #64272c;
        background: #1a0b0d;
      }

      .bubbleMeta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: #666;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: 1px;
        margin-bottom: 7px;
      }

      .mine .bubbleMeta span:first-child { color: #ff727a; }

      .bubbleText {
        white-space: pre-wrap;
        color: #e9e9e9;
        font-size: 12px;
        line-height: 1.55;
      }

      .composer {
        padding: 18px;
        border-top: 1px solid #242424;
        background: #0c0c0c;
      }

      textarea {
        width: 100%;
        resize: vertical;
        min-height: 118px;
        border: 1px solid #333;
        border-radius: 11px;
        background: #070707;
        color: #fff;
        padding: 14px;
        outline: none;
        font-size: 13px;
        line-height: 1.5;
      }

      textarea:focus { border-color: #6d292f; }

      .composerFoot {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        align-items: center;
        margin-top: 10px;
      }

      .composerFoot > span {
        color: #555;
        font-size: 9px;
      }

      .send {
        border-color: #e1222d;
        background: #e1222d;
        color: #fff;
      }

      @media (max-width: 800px) {
        .page { padding: 18px; }
        .managerHero { grid-template-columns: 1fr; }
        .identity { flex-direction: column; }
        .bubble { width: 92%; }
        .top h1 { letter-spacing: -2.8px; }
      }
    `}</style>
  );
}
