"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type RequestRow = {
  id: string;
  restaurant_id: string;
  requested_by: string;
  status: string;
  notes: string | null;
  requested_at: string;
  updated_at: string;
  restaurants?: {
    name?: string | null;
    slug?: string | null;
    owner_user_id?: string | null;
  } | null;
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
      window.location.href = "/admin/login";
      return;
    }

    const { data, error } = await supabase
      .from("restaurant_custom_site_requests")
      .select(
        "id,restaurant_id,requested_by,status,notes,requested_at,updated_at,restaurants(name,slug,owner_user_id)"
      )
      .order("requested_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setRows([]);
    } else {
      setRows((data || []) as unknown as RequestRow[]);
    }

    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("restaurant_custom_site_requests")
      .update({
        status,
        admin_notified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, status, updated_at: new Date().toISOString() }
          : row
      )
    );
    setMessage("Custom-site request updated.");
  }

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
            <div style={eyebrowStyle}>SUPER ADMIN</div>
            <h1 style={titleStyle}>Custom Site Requests</h1>
            <p style={subStyle}>
              Restaurants requesting a bespoke Restaurant OS website.
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
          <div>
            <span style={summaryLabelStyle}>OPEN REQUESTS</span>
            <strong style={summaryNumberStyle}>
              {
                rows.filter(
                  (row) => !["installed", "declined"].includes(row.status)
                ).length
              }
            </strong>
          </div>
          <div>
            <span style={summaryLabelStyle}>TOTAL REQUESTS</span>
            <strong style={summaryNumberStyle}>{rows.length}</strong>
          </div>
        </section>

        <section style={listStyle}>
          {rows.length === 0 ? (
            <div style={emptyStyle}>No custom website requests yet.</div>
          ) : (
            rows.map((row) => (
              <article key={row.id} style={cardStyle}>
                <div style={cardTopStyle}>
                  <div>
                    <div style={eyebrowStyle}>
                      {row.status.replaceAll("_", " ").toUpperCase()}
                    </div>
                    <h2 style={cardTitleStyle}>
                      {row.restaurants?.name || "Restaurant"}
                    </h2>
                    <div style={metaStyle}>
                      Requested {new Date(row.requested_at).toLocaleString()}
                    </div>
                  </div>

                  <select
                    value={row.status}
                    onChange={(event) =>
                      updateStatus(row.id, event.target.value)
                    }
                    style={selectStyle}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={notesStyle}>
                  {row.notes || "No design notes were supplied."}
                </div>

                <div style={actionsStyle}>
                  <button
                    style={primaryButtonStyle}
                    onClick={() =>
                      (window.location.href = `/admin/restaurant?restaurant=${row.restaurant_id}`)
                    }
                  >
                    OPEN RESTAURANT
                  </button>

                  {row.restaurants?.slug && (
                    <button
                      style={secondaryButtonStyle}
                      onClick={() =>
                        window.open(`/r/${row.restaurants?.slug}`, "_blank")
                      }
                    >
                      OPEN LIVE SITE
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#061426",
  color: "#ffffff",
  padding: "30px 20px 80px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 24,
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
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 14,
  marginBottom: 18,
};

const summaryLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#9fb0c3",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.2,
};

const summaryNumberStyle: React.CSSProperties = {
  display: "block",
  marginTop: 6,
  fontSize: 34,
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
};

const cardTitleStyle: React.CSSProperties = {
  margin: "6px 0 6px",
  fontSize: 26,
};

const metaStyle: React.CSSProperties = {
  color: "#8ea0b2",
  fontSize: 12,
};

const notesStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 10,
  background: "#081629",
  color: "#d7e1eb",
  lineHeight: 1.6,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
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
  border: 0,
  borderRadius: 9,
  background: "#fdbb2d",
  color: "#061426",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #3b5571",
  borderRadius: 9,
  background: "transparent",
  color: "#ffffff",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle: React.CSSProperties = {
  marginBottom: 18,
  padding: 14,
  background: "#17314a",
  border: "1px solid #315370",
  borderRadius: 10,
};

const emptyStyle: React.CSSProperties = {
  padding: 30,
  border: "1px dashed #3b5571",
  borderRadius: 14,
  color: "#9fb0c3",
  textAlign: "center",
};
