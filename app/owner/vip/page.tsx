"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type VipMember = {
  id: string;
  restaurant_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  favorite_item: string | null;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  source: string | null;
  created_at: string;
};

export default function OwnerVipPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [members, setMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sms" | "email" | "birthday">("all");

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
      setMessage("You are not signed in.");
      setLoading(false);
      return;
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);

    const { data, error } = await supabase
      .from("restaurant_vip_members")
      .select("*")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMembers(data || []);
    setLoading(false);
  }

  async function toggleMember(
    member: VipMember,
    field: "sms_opt_in" | "email_opt_in"
  ) {
    const nextValue = !member[field];

    const { error } = await supabase
      .from("restaurant_vip_members")
      .update({
        [field]: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMembers((current) =>
      current.map((m) =>
        m.id === member.id ? { ...m, [field]: nextValue } : m
      )
    );
  }

  async function deleteMember(member: VipMember) {
    const name =
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.phone ||
      member.email ||
      "this VIP";

    if (!window.confirm(`Delete ${name} from the VIP list?`)) return;

    const { error } = await supabase
      .from("restaurant_vip_members")
      .delete()
      .eq("id", member.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMembers((current) => current.filter((m) => m.id !== member.id));
  }

  function exportCsv() {
    const rows = [
      [
        "First Name",
        "Last Name",
        "Phone",
        "Email",
        "Birthday",
        "Favorite Item",
        "SMS Opt In",
        "Email Opt In",
        "Source",
        "Joined",
      ],
      ...members.map((member) => [
        member.first_name || "",
        member.last_name || "",
        member.phone || "",
        member.email || "",
        member.birthday || "",
        member.favorite_item || "",
        member.sms_opt_in ? "Yes" : "No",
        member.email_opt_in ? "Yes" : "No",
        member.source || "",
        new Date(member.created_at).toLocaleString(),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${restaurantName || "restaurant"}-vip-members.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function hasBirthdayThisMonth(member: VipMember) {
    if (!member.birthday) return false;
    const month = new Date(member.birthday + "T12:00:00").getMonth();
    return month === new Date().getMonth();
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        [
          member.first_name,
          member.last_name,
          member.phone,
          member.email,
          member.favorite_item,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "sms"
          ? member.sms_opt_in
          : filter === "email"
          ? member.email_opt_in
          : hasBirthdayThisMonth(member);

      return matchesSearch && matchesFilter;
    });
  }, [members, search, filter]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading VIP customers...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>VIP Customers</h1>
            <p style={subStyle}>
              {restaurantName} — own the customer relationship and bring them back.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button style={secondaryButtonStyle} onClick={exportCsv}>
              EXPORT CSV
            </button>

            <button
              style={secondaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner?restaurant=${restaurantId}`)
              }
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={statsGridStyle}>
          <Stat label="TOTAL VIPS" value={members.length} />
          <Stat
            label="SMS OPT-INS"
            value={members.filter((m) => m.sms_opt_in).length}
          />
          <Stat
            label="EMAIL OPT-INS"
            value={members.filter((m) => m.email_opt_in).length}
          />
          <Stat
            label="BIRTHDAYS THIS MONTH"
            value={members.filter(hasBirthdayThisMonth).length}
          />
        </section>

        <section style={controlPanelStyle}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email or favorite item..."
            style={searchInputStyle}
          />

          <div style={filterRowStyle}>
            <FilterButton label="ALL" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterButton label="SMS" active={filter === "sms"} onClick={() => setFilter("sms")} />
            <FilterButton label="EMAIL" active={filter === "email"} onClick={() => setFilter("email")} />
            <FilterButton
              label="BIRTHDAYS"
              active={filter === "birthday"}
              onClick={() => setFilter("birthday")}
            />
          </div>
        </section>

        {filteredMembers.length === 0 ? (
          <section style={emptyStyle}>
            <div style={emptyTitleStyle}>No VIP customers found.</div>
            <div style={emptyTextStyle}>
              Share the restaurant VIP signup page and new customers will appear here.
            </div>
          </section>
        ) : (
          <section style={listStyle}>
            {filteredMembers.map((member) => {
              const fullName =
                [member.first_name, member.last_name]
                  .filter(Boolean)
                  .join(" ") || "VIP Customer";

              return (
                <article key={member.id} style={memberCardStyle}>
                  <div style={memberTopStyle}>
                    <div>
                      <div style={memberNameStyle}>{fullName}</div>
                      <div style={joinedStyle}>
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {hasBirthdayThisMonth(member) && (
                      <div style={birthdayBadgeStyle}>🎂 BIRTHDAY MONTH</div>
                    )}
                  </div>

                  <div style={detailsGridStyle}>
                    <Info label="PHONE" value={member.phone || "Not provided"} />
                    <Info label="EMAIL" value={member.email || "Not provided"} />
                    <Info label="BIRTHDAY" value={member.birthday || "Not provided"} />
                    <Info
                      label="FAVORITE ITEM"
                      value={member.favorite_item || "Not provided"}
                    />
                    <Info label="SOURCE" value={member.source || "Unknown"} />
                  </div>

                  <div style={actionsStyle}>
                    <label style={toggleStyle}>
                      <input
                        type="checkbox"
                        checked={member.sms_opt_in}
                        onChange={() => toggleMember(member, "sms_opt_in")}
                      />
                      SMS OPT-IN
                    </label>

                    <label style={toggleStyle}>
                      <input
                        type="checkbox"
                        checked={member.email_opt_in}
                        onChange={() => toggleMember(member, "email_opt_in")}
                      />
                      EMAIL OPT-IN
                    </label>

                    <button
                      style={dangerButtonStyle}
                      onClick={() => deleteMember(member)}
                    >
                      DELETE
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...filterButtonStyle,
        background: active ? "#f5b82e" : "#08111f",
        color: active ? "#08111f" : "#cbd5e1",
        borderColor: active ? "#f5b82e" : "#334155",
      }}
    >
      {label}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "24px",
};

const headerActionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(42px,7vw,72px)",
  lineHeight: ".95",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const statStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "20px",
};

const statValueStyle = {
  color: "#f5b82e",
  fontSize: "34px",
  fontWeight: 900,
};

const statLabelStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const controlPanelStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "18px",
};

const searchInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "14px",
  marginBottom: "12px",
};

const filterRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const filterButtonStyle = {
  border: "1px solid",
  borderRadius: "999px",
  padding: "9px 13px",
  fontWeight: 900,
  fontSize: "11px",
  cursor: "pointer",
};

const listStyle = {
  display: "grid",
  gap: "14px",
};

const memberCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
};

const memberTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const memberNameStyle = {
  fontSize: "22px",
  fontWeight: 900,
};

const joinedStyle = {
  color: "#64748b",
  fontSize: "12px",
  marginTop: "5px",
};

const birthdayBadgeStyle = {
  background: "#3b2d08",
  border: "1px solid #7c6214",
  color: "#fde68a",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "10px",
  fontWeight: 900,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
  gap: "18px",
  marginTop: "20px",
};

const infoLabelStyle = {
  color: "#64748b",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "5px",
};

const infoValueStyle = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  wordBreak: "break-word" as const,
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  borderTop: "1px solid #23364d",
  marginTop: "20px",
  paddingTop: "16px",
};

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 900,
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle = {
  marginLeft: "auto",
  background: "#3b1118",
  color: "#fecaca",
  border: "1px solid #7f1d1d",
  borderRadius: "10px",
  padding: "10px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};

const emptyStyle = {
  background: "#0f1d2e",
  border: "1px dashed #334155",
  borderRadius: "18px",
  padding: "48px 24px",
  textAlign: "center" as const,
};

const emptyTitleStyle = {
  fontSize: "22px",
  fontWeight: 900,
};

const emptyTextStyle = {
  color: "#64748b",
  marginTop: "8px",
};
