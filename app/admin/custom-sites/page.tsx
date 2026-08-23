"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type RestaurantSummary = {
  id: string;
  name: string;
  slug: string | null;
  cuisine_category: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  owner_user_id: string | null;
  theme_key: string | null;
  theme_mode: string | null;
};

type RequestRow = {
  id: string;
  restaurant_id: string;
  requested_by: string;
  status: string;
  notes: string | null;
  requested_at: string;
  updated_at: string;
  admin_notified?: boolean;
  restaurant: RestaurantSummary | null;
};

const STATUSES = [
  "requested",
  "in_design",
  "mockup_sent",
  "approved",
  "installed",
  "declined",
];

export default function CustomSiteRequestsAdminPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    load();
  }, []);

  async function authHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/admin/login";
      throw new Error("Admin session required.");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function load() {
    setLoading(true);
    setMessage("");

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/admin/custom-sites", {
        headers,
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load custom site requests.");
      }

      setRows(data.requests || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load custom site requests.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setMessage("Updating request...");

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/admin/custom-sites", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update request.");
      }

      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? { ...row, status, updated_at: data.request?.updated_at || new Date().toISOString() }
            : row
        )
      );

      setMessage("Custom-site request updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update request.");
    }
  }

  const visibleRows = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "completed") {
      return rows.filter((row) => ["installed", "declined"].includes(row.status));
    }
    return rows.filter((row) => !["installed", "declined"].includes(row.status));
  }, [rows, filter]);

  const openCount = rows.filter(
    (row) => !["installed", "declined"].includes(row.status)
  ).length;

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading custom site requests...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>SUPER ADMIN · CUSTOM WEBSITE DESK</div>
            <h1 style={titleStyle}>Custom Site Requests</h1>
            <p style={subStyle}>
              Manage customer website upgrades from request through approved install.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => (window.location.href = "/admin")}
          >
            BACK TO SUPER ADMIN
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={summaryStyle}>
          <Summary label="OPEN REQUESTS" value={openCount} />
          <Summary label="TOTAL REQUESTS" value={rows.length} />
          <Summary
            label="IN DESIGN"
            value={rows.filter((row) => row.status === "in_design").length}
          />
          <Summary
            label="APPROVED / READY"
            value={rows.filter((row) => row.status === "approved").length}
          />
        </section>

        <section style={toolbarStyle}>
          <div style={filterButtonsStyle}>
            <FilterButton active={filter === "open"} onClick={() => setFilter("open")}>
              OPEN
            </FilterButton>
            <FilterButton active={filter === "completed"} onClick={() => setFilter("completed")}>
              COMPLETED
            </FilterButton>
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              ALL
            </FilterButton>
          </div>

          <button style={secondaryButtonStyle} onClick={load}>
            REFRESH
          </button>
        </section>

        <section style={listStyle}>
          {visibleRows.length === 0 ? (
            <div style={emptyStyle}>No requests in this view.</div>
          ) : (
            visibleRows.map((row) => {
              const restaurant = row.restaurant;
              const location = [restaurant?.city, restaurant?.state]
                .filter(Boolean)
                .join(", ");

              return (
                <article key={row.id} style={cardStyle}>
                  <div style={cardTopStyle}>
                    <div>
                      <div style={statusLineStyle}>
                        <span style={statusBadge(row.status)}>
                          {row.status.replaceAll("_", " ").toUpperCase()}
                        </span>
                        <span style={metaStyle}>
                          Requested {new Date(row.requested_at).toLocaleString()}
                        </span>
                      </div>

                      <h2 style={cardTitleStyle}>
                        {restaurant?.name || `Restaurant ${row.restaurant_id.slice(0, 8)}`}
                      </h2>

                      <div style={restaurantMetaStyle}>
                        {restaurant?.cuisine_category || "RESTAURANT"}
                        {location ? ` · ${location}` : ""}
                        {restaurant?.phone ? ` · ${restaurant.phone}` : ""}
                      </div>
                    </div>

                    <select
                      value={row.status}
                      onChange={(event) => updateStatus(row.id, event.target.value)}
                      style={selectStyle}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={requestGridStyle}>
                    <div style={notesStyle}>
                      <div style={smallLabelStyle}>CUSTOMER REQUEST</div>
                      <div style={{ marginTop: 8 }}>
                        {row.notes || "No design notes were supplied."}
                      </div>
                    </div>

                    <div style={detailsStyle}>
                      <div>
                        <div style={smallLabelStyle}>CURRENT THEME</div>
                        <strong>{restaurant?.theme_key || "—"}</strong>
                      </div>
                      <div>
                        <div style={smallLabelStyle}>THEME MODE</div>
                        <strong>{restaurant?.theme_mode || "—"}</strong>
                      </div>
                      <div>
                        <div style={smallLabelStyle}>REQUEST ID</div>
                        <strong>{row.id.slice(0, 8)}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={actionsStyle}>
                    <button
                      style={primaryButtonStyle}
                      onClick={() =>
                        (window.location.href = `/admin/restaurant?restaurant=${row.restaurant_id}`)
                      }
                    >
                      OPEN ADMIN ACCOUNT
                    </button>

                    <button
                      style={ownerButtonStyle}
                      onClick={() =>
                        (window.location.href = `/owner?restaurant=${row.restaurant_id}`)
                      }
                    >
                      OPEN OWNER VIEW
                    </button>

                    {restaurant?.slug && (
                      <button
                        style={secondaryButtonStyle}
                        onClick={() => window.open(`/r/${restaurant.slug}`, "_blank")}
                      >
                        OPEN SITE
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div style={summaryCardStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <strong style={summaryNumberStyle}>{value}</strong>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...filterButtonStyle,
        ...(active ? activeFilterButtonStyle : {}),
      }}
    >
      {children}
    </button>
  );
}

function statusBadge(status: string): React.CSSProperties {
  const palettes: Record<string, { bg: string; color: string; border: string }> = {
    requested: { bg: "#3a2c10", color: "#f8c451", border: "#7e621c" },
    in_design: { bg: "#102c4d", color: "#7ec8ff", border: "#245b8d" },
    mockup_sent: { bg: "#2b1b48", color: "#d0a7ff", border: "#66489a" },
    approved: { bg: "#103c29", color: "#82e6aa", border: "#287453" },
    installed: { bg: "#0d3b27", color: "#8ff0b5", border: "#27734f" },
    declined: { bg: "#3d171b", color: "#ff9ca6", border: "#7b3039" },
  };

  const p = palettes[status] || palettes.requested;

  return {
    background: p.bg,
    color: p.color,
    border: `1px solid ${p.border}`,
    borderRadius: 999,
    padding: "6px 9px",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
  };
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#061426",
  color: "#ffffff",
  padding: "30px 20px 80px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1220,
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 24,
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#fdbb2d",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 1.6,
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontSize: "clamp(46px,7vw,72px)",
  lineHeight: 0.95,
};

const subStyle: React.CSSProperties = {
  color: "#9fb0c3",
  fontSize: 16,
};

const summaryStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 12,
  marginBottom: 18,
};

const summaryCardStyle: React.CSSProperties = {
  background: "#0f2136",
  border: "1px solid #28445f",
  borderRadius: 14,
  padding: 17,
};

const summaryLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#8fa2b7",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.2,
};

const summaryNumberStyle: React.CSSProperties = {
  display: "block",
  marginTop: 7,
  fontSize: 34,
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const filterButtonsStyle: React.CSSProperties = {
  display: "flex",
  gap: 7,
};

const filterButtonStyle: React.CSSProperties = {
  background: "#0b1b2c",
  color: "#9fb0c3",
  border: "1px solid #304a66",
  borderRadius: 8,
  padding: "10px 13px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const activeFilterButtonStyle: React.CSSProperties = {
  background: "#fdbb2d",
  color: "#061426",
  borderColor: "#fdbb2d",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  background: "#102238",
  border: "1px solid #29445f",
  borderRadius: 16,
  padding: 22,
};

const cardTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const statusLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "10px 0 4px",
  fontSize: 28,
};

const metaStyle: React.CSSProperties = {
  color: "#8ea0b2",
  fontSize: 11,
};

const restaurantMetaStyle: React.CSSProperties = {
  color: "#a7b6c6",
  fontSize: 11,
  fontWeight: 700,
};

const requestGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr .8fr",
  gap: 12,
  marginTop: 18,
};

const notesStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: "#081629",
  color: "#d7e1eb",
  lineHeight: 1.6,
  minHeight: 98,
};

const detailsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 8,
  background: "#081629",
  borderRadius: 10,
  padding: 14,
  alignItems: "center",
};

const smallLabelStyle: React.CSSProperties = {
  color: "#758aa1",
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 1,
  marginBottom: 4,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 16,
};

const selectStyle: React.CSSProperties = {
  background: "#081629",
  color: "#ffffff",
  border: "1px solid #3b5571",
  borderRadius: 9,
  padding: "11px 12px",
  fontWeight: 800,
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#fdbb2d",
  color: "#071426",
  border: 0,
  borderRadius: 9,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const ownerButtonStyle: React.CSSProperties = {
  background: "#22c55e",
  color: "#062312",
  border: 0,
  borderRadius: 9,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#0b1b2c",
  color: "#ffffff",
  border: "1px solid #39516b",
  borderRadius: 9,
  padding: "10px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: 30,
  background: "#102238",
  border: "1px solid #29445f",
  borderRadius: 14,
  color: "#9fb0c3",
};

const messageStyle: React.CSSProperties = {
  marginBottom: 15,
  background: "#132d46",
  border: "1px solid #31577a",
  borderRadius: 10,
  padding: 12,
  color: "#dcecff",
};

