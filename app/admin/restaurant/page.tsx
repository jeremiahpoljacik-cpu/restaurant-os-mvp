"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  owner_user_id: string;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string | null;
  created_at: string;
  admin_suspended: boolean;
  admin_support_status: string;
};

type Subscription = {
  plan: string | null;
  status: string | null;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DetailPayload = {
  admin_role: string;
  restaurant: Restaurant;
  subscription: Subscription | null;
  website: {
    published: boolean | null;
    hero_headline: string | null;
    about_body: string | null;
  } | null;
  branding: {
    primary_color: string | null;
    secondary_color: string | null;
    tagline: string | null;
    short_description: string | null;
  } | null;
  ordering: {
    online_ordering_url: string | null;
    catering_email: string | null;
  } | null;
  growth: {
    vip_club_name: string | null;
    signup_offer: string | null;
  } | null;
  metrics: {
    readiness_percent: number;
    menu_count: number;
    vip_count: number;
    offer_count: number;
    campaign_count: number;
    claim_count: number;
    redeemed_count: number;
    attributed_claim_count: number;
  };
  recent_claims: {
    id: string;
    status: string | null;
    campaign_id: string | null;
    claimed_at: string | null;
    redeemed_at: string | null;
  }[];
  notes: {
    id: string;
    admin_user_id: string;
    note: string;
    created_at: string;
  }[];
};

export default function AdminRestaurantDetailPage() {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [trialDays, setTrialDays] = useState(14);
  const [supportStatus, setSupportStatus] = useState("normal");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    loadDetail();
  }, []);

  async function getRestaurantId() {
    return new URLSearchParams(window.location.search).get("restaurant");
  }

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return null;
    }

    return session.access_token;
  }

  async function loadDetail() {
    setLoading(true);
    setMessage("");

    const restaurantId = await getRestaurantId();

    if (!restaurantId) {
      setMessage("No restaurant was selected.");
      setLoading(false);
      return;
    }

    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch(
      `/api/admin/restaurant?restaurant_id=${encodeURIComponent(restaurantId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to load restaurant.");
      setLoading(false);
      return;
    }

    setDetail(data);
    setSupportStatus(data.restaurant.admin_support_status || "normal");
    setLoading(false);
  }

  async function runAction(
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    if (!detail) return;

    setActionLoading(true);
    setActionMessage("");

    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: detail.restaurant.id,
        action,
        ...extra,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setActionMessage(data.error || "Admin action failed.");
      setActionLoading(false);
      return;
    }

    setActionMessage(data.message || "Action completed.");
    setNote("");
    await loadDetail();
    setActionLoading(false);
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  if (loading) {
    return <main style={pageStyle}><div style={shellStyle}>Loading account...</div></main>;
  }

  if (message || !detail) {
    return (
      <main style={pageStyle}>
        <div style={errorCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={errorTitleStyle}>Account Detail</h1>
          <p style={mutedStyle}>{message || "Restaurant not found."}</p>
          <button style={secondaryButtonStyle} onClick={() => (window.location.href = "/admin")}>
            BACK TO ADMIN
          </button>
        </div>
      </main>
    );
  }

  const { restaurant, subscription, metrics } = detail;
  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ].filter(Boolean).join(", ");

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <button style={backButtonStyle} onClick={() => (window.location.href = "/admin")}>
              ← SUPER ADMIN
            </button>
            <div style={eyebrowStyle}>RESTAURANT ACCOUNT</div>
            <h1 style={titleStyle}>{restaurant.name}</h1>
            <div style={metaLineStyle}>
              {address || "No address"} {restaurant.phone ? ` • ${restaurant.phone}` : ""}
            </div>
          </div>

          <div style={headerActionsStyle}>
            {restaurant.slug && (
              <button
                style={secondaryButtonStyle}
                onClick={() => window.open(`/r/${restaurant.slug}`, "_blank")}
              >
                VIEW SITE
              </button>
            )}

            <button
              style={domainButtonStyle}
              onClick={() =>
                (window.location.href = `/admin/restaurant/domain?restaurant=${restaurant.id}`)
              }
            >
              DOMAIN CONTROL
            </button>

            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner?restaurant=${restaurant.id}`)
              }
            >
              OPEN OWNER
            </button>
          </div>
        </header>

        {actionMessage && (
          <div style={actionMessageStyle}>{actionMessage}</div>
        )}

        <section style={commandCenterStyle}>
          <div style={commandCenterHeaderStyle}>
            <div>
              <div style={cardEyebrowStyle}>SUPER ADMIN COMMAND CENTER</div>
              <h2 style={commandCenterTitleStyle}>Operate This Restaurant</h2>
              <p style={commandCenterTextStyle}>
                One place for launch status, owner access, QA, website, billing and domain control.
              </p>
            </div>

            <div
              style={{
                ...commandStatusStyle,
                background: detail.website?.published ? "#133925" : "#3a2b08",
                color: detail.website?.published ? "#86efac" : "#fde68a",
                borderColor: detail.website?.published ? "#286846" : "#856317",
              }}
            >
              {detail.website?.published ? "PUBLIC SITE LIVE" : "PUBLIC SITE DRAFT"}
            </div>
          </div>

          <div style={commandGridStyle}>
            <button
              style={commandPrimaryStyle}
              onClick={() =>
                (window.location.href = `/owner?restaurant=${restaurant.id}`)
              }
            >
              <span style={commandLabelStyle}>OWNER OVERRIDE</span>
              <strong style={commandTitleStyle}>Open Owner Command</strong>
              <span style={commandTextStyle}>
                Enter the customer workspace as Super Admin.
              </span>
            </button>

            <button
              style={commandCardStyle}
              onClick={() =>
                (window.location.href = `/owner/setup?restaurant=${restaurant.id}`)
              }
            >
              <span style={commandLabelStyle}>LAUNCH WIZARD</span>
              <strong style={commandTitleStyle}>Setup & Launch</strong>
              <span style={commandTextStyle}>
                Review blockers and finish onboarding.
              </span>
            </button>

            <button
              style={commandCardStyle}
              onClick={() =>
                (window.location.href = `/owner/qa?restaurant=${restaurant.id}`)
              }
            >
              <span style={commandLabelStyle}>SYSTEM CHECK</span>
              <strong style={commandTitleStyle}>Run QA</strong>
              <span style={commandTextStyle}>
                Verify website, menu, billing, theme and launch readiness.
              </span>
            </button>

            <button
              style={commandCardStyle}
              onClick={() =>
                (window.location.href = `/owner/website?restaurant=${restaurant.id}`)
              }
            >
              <span style={commandLabelStyle}>WEBSITE</span>
              <strong style={commandTitleStyle}>Manage Website</strong>
              <span style={commandTextStyle}>
                Theme, media, pages and publish controls.
              </span>
            </button>

            <button
              style={commandCardStyle}
              onClick={() =>
                (window.location.href = `/owner/billing?restaurant=${restaurant.id}`)
              }
            >
              <span style={commandLabelStyle}>BILLING</span>
              <strong style={commandTitleStyle}>Subscription</strong>
              <span style={commandTextStyle}>
                Review Stripe status, trial and account access.
              </span>
            </button>

            <button
              style={commandCardStyle}
              onClick={() =>
                (window.location.href = `/admin/restaurant/domain?restaurant=${restaurant.id}`)
              }
            >
              <span style={commandLabelStyle}>DOMAIN</span>
              <strong style={commandTitleStyle}>Domain Control</strong>
              <span style={commandTextStyle}>
                Stage, connect, verify DNS and SSL.
              </span>
            </button>
          </div>

          <div style={commandHealthGridStyle}>
            <CommandHealth
              label="RESTAURANT"
              value={(restaurant.status || "unknown").toUpperCase()}
              ok={restaurant.status === "active" && !restaurant.admin_suspended}
            />
            <CommandHealth
              label="WEBSITE"
              value={detail.website?.published ? "LIVE" : "DRAFT"}
              ok={Boolean(detail.website?.published)}
            />
            <CommandHealth
              label="BILLING"
              value={(subscription?.status || "NONE").toUpperCase()}
              ok={subscription?.status === "active" || subscription?.status === "trial"}
            />
            <CommandHealth
              label="READINESS"
              value={`${metrics.readiness_percent}%`}
              ok={metrics.readiness_percent >= 80}
            />
          </div>
        </section>

        <section style={statsGridStyle}>
          <Metric label="READINESS" value={`${metrics.readiness_percent}%`} />
          <Metric label="MENU ITEMS" value={metrics.menu_count} />
          <Metric label="VIP MEMBERS" value={metrics.vip_count} />
          <Metric label="OFFERS" value={metrics.offer_count} />
          <Metric label="CAMPAIGNS" value={metrics.campaign_count} />
          <Metric label="CLAIMS" value={metrics.claim_count} />
          <Metric label="REDEEMED" value={metrics.redeemed_count} />
          <Metric label="ATTRIBUTED" value={metrics.attributed_claim_count} />
        </section>

        <section style={twoColumnStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>ACCOUNT STATUS</div>
            <h2 style={cardTitleStyle}>Platform Access</h2>

            <InfoRow label="Support Status" value={restaurant.admin_support_status.replace("_", " ")} />
            <InfoRow label="Suspended" value={restaurant.admin_suspended ? "YES" : "NO"} />
            <InfoRow label="Site Status" value={detail.website?.published ? "LIVE" : "DRAFT"} />
            <InfoRow label="Restaurant Status" value={restaurant.status || "—"} />

            <div style={fieldBlockStyle}>
              <label style={fieldLabelStyle}>SUPPORT STATUS</label>
              <select
                value={supportStatus}
                onChange={(event) => setSupportStatus(event.target.value)}
                style={inputStyle}
              >
                <option value="normal">Normal</option>
                <option value="watch">Watch</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                style={secondaryFullButtonStyle}
                disabled={actionLoading}
                onClick={() =>
                  runAction("set_support_status", { status: supportStatus })
                }
              >
                SAVE SUPPORT STATUS
              </button>
            </div>

            <div style={buttonRowStyle}>
              {restaurant.admin_suspended ? (
                <button
                  style={successButtonStyle}
                  disabled={actionLoading}
                  onClick={() => runAction("reactivate")}
                >
                  REACTIVATE
                </button>
              ) : (
                <button
                  style={dangerButtonStyle}
                  disabled={actionLoading}
                  onClick={() => runAction("suspend")}
                >
                  SUSPEND
                </button>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>BILLING</div>
            <h2 style={cardTitleStyle}>$99 / Location</h2>

            <InfoRow label="Plan" value={subscription?.plan || "No plan"} />
            <InfoRow label="Status" value={subscription?.status || "No subscription"} />
            <InfoRow label="Provider" value={subscription?.provider || "—"} />
            <InfoRow label="Trial Ends" value={formatDate(subscription?.trial_ends_at)} />
            <InfoRow label="Period Ends" value={formatDate(subscription?.current_period_end)} />
            <InfoRow label="Stripe Customer" value={subscription?.provider_customer_id || "—"} />
            <InfoRow label="Stripe Subscription" value={subscription?.provider_subscription_id || "—"} />

            <div style={trialBoxStyle}>
              <label style={fieldLabelStyle}>EXTEND TRIAL</label>
              <div style={trialRowStyle}>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={trialDays}
                  onChange={(event) =>
                    setTrialDays(
                      Math.max(1, Math.min(90, Number(event.target.value) || 1))
                    )
                  }
                  style={inputStyle}
                />
                <button
                  style={primaryButtonStyle}
                  disabled={actionLoading}
                  onClick={() => runAction("extend_trial", { days: trialDays })}
                >
                  ADD DAYS
                </button>
              </div>
            </div>

            <button
              style={secondaryFullButtonStyle}
              onClick={() =>
                (window.location.href = `/owner/billing?restaurant=${restaurant.id}`)
              }
            >
              OPEN BILLING
            </button>
          </div>
        </section>

        <section style={twoColumnStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>BUSINESS + WEBSITE</div>
            <h2 style={cardTitleStyle}>Launch Readiness</h2>

            <InfoRow label="Address" value={address || "Missing"} />
            <InfoRow label="Phone" value={restaurant.phone || "Missing"} />
            <InfoRow label="Hero Headline" value={detail.website?.hero_headline || "Missing"} />
            <InfoRow label="Tagline" value={detail.branding?.tagline || "Missing"} />
            <InfoRow label="Online Ordering" value={detail.ordering?.online_ordering_url ? "CONNECTED" : "Missing"} />
            <InfoRow label="Catering Email" value={detail.ordering?.catering_email || "Missing"} />
            <InfoRow label="VIP Club" value={detail.growth?.vip_club_name || "Missing"} />

            <div style={buttonRowStyle}>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/qa?restaurant=${restaurant.id}`)
                }
              >
                OPEN QA
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/website?restaurant=${restaurant.id}`)
                }
              >
                WEBSITE
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/menu?restaurant=${restaurant.id}`)
                }
              >
                MENU
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>INTERNAL SUPPORT</div>
            <h2 style={cardTitleStyle}>Admin Notes</h2>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add an internal note..."
              style={textareaStyle}
            />

            <button
              style={primaryFullButtonStyle}
              disabled={actionLoading || !note.trim()}
              onClick={() => runAction("add_note", { note })}
            >
              {actionLoading ? "SAVING..." : "ADD NOTE"}
            </button>

            <div style={notesListStyle}>
              {detail.notes.length === 0 ? (
                <div style={emptyStyle}>No admin notes yet.</div>
              ) : (
                detail.notes.map((item) => (
                  <div key={item.id} style={noteCardStyle}>
                    <div style={noteDateStyle}>{formatDate(item.created_at)}</div>
                    <div style={noteTextStyle}>{item.note}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={cardEyebrowStyle}>RECENT ACTIVITY</div>
          <h2 style={cardTitleStyle}>Offer Claims</h2>

          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Status</Th>
                  <Th>Campaign</Th>
                  <Th>Claimed</Th>
                  <Th>Redeemed</Th>
                </tr>
              </thead>
              <tbody>
                {detail.recent_claims.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={emptyTdStyle}>No claims yet.</td>
                  </tr>
                ) : (
                  detail.recent_claims.map((claim) => (
                    <tr key={claim.id}>
                      <Td>{claim.status || "—"}</Td>
                      <Td>{claim.campaign_id ? "Attributed" : "Direct / Unknown"}</Td>
                      <Td>{formatDate(claim.claimed_at)}</Td>
                      <Td>{formatDate(claim.redeemed_at)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function CommandHealth({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div
      style={{
        ...commandHealthStyle,
        borderColor: ok ? "#286846" : "#6b4a1a",
        background: ok ? "#0e211c" : "#251d0f",
      }}
    >
      <div style={commandHealthLabelStyle}>{label}</div>
      <div
        style={{
          ...commandHealthValueStyle,
          color: ok ? "#86efac" : "#fde68a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#fff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = { maxWidth: 1450, margin: "0 auto" };

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap" as const,
  marginBottom: 24,
};

const backButtonStyle = {
  background: "transparent",
  border: 0,
  color: "#94a3b8",
  padding: "0 0 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2,
};

const titleStyle = {
  margin: "7px 0 10px",
  fontSize: "clamp(48px,7vw,82px)",
  lineHeight: .9,
  letterSpacing: -4,
};

const metaLineStyle = { color: "#94a3b8", fontSize: 14 };

const headerActionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))",
  gap: 10,
  marginBottom: 18,
};

const metricCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: 14,
  padding: 17,
};

const metricValueStyle = {
  color: "#f5b82e",
  fontSize: 28,
  fontWeight: 900,
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1,
  marginTop: 4,
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: 16,
  marginBottom: 16,
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
};

const cardEyebrowStyle = {
  color: "#f5b82e",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.5,
};

const cardTitleStyle = {
  margin: "6px 0 18px",
  fontSize: 28,
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns: "145px 1fr",
  gap: 14,
  padding: "11px 0",
  borderBottom: "1px solid #1d2b3a",
};

const infoLabelStyle = {
  color: "#64748b",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const infoValueStyle = {
  color: "#e2e8f0",
  fontSize: 12,
  wordBreak: "break-word" as const,
};

const fieldBlockStyle = { marginTop: 18 };

const fieldLabelStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1,
  marginBottom: 7,
};

const inputStyle = {
  width: "100%",
  background: "#08111f",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: 11,
};

const textareaStyle = {
  width: "100%",
  minHeight: 120,
  background: "#08111f",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: 12,
  resize: "vertical" as const,
  lineHeight: 1.5,
};

const buttonRowStyle = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap" as const,
  marginTop: 16,
};

const domainButtonStyle = {
  background: "#2563eb",
  color: "#ffffff",
  border: "1px solid #3b82f6",
  borderRadius: "10px",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryFullButtonStyle = {
  ...secondaryButtonStyle,
  width: "100%",
  marginTop: 10,
};

const primaryFullButtonStyle = {
  ...primaryButtonStyle,
  width: "100%",
  marginTop: 10,
};

const dangerButtonStyle = {
  background: "#7f1d1d",
  color: "#fff",
  border: "1px solid #b91c1c",
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const successButtonStyle = {
  background: "#14532d",
  color: "#dcfce7",
  border: "1px solid #166534",
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const trialBoxStyle = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid #23364d",
};

const trialRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 9,
};

const notesListStyle = {
  display: "grid",
  gap: 8,
  marginTop: 15,
  maxHeight: 420,
  overflowY: "auto" as const,
};

const noteCardStyle = {
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: 10,
  padding: 12,
};

const noteDateStyle = { color: "#64748b", fontSize: 9, marginBottom: 6 };
const noteTextStyle = { color: "#e2e8f0", fontSize: 12, lineHeight: 1.5 };

const actionMessageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  color: "#dbeafe",
  borderRadius: 10,
  padding: 12,
  marginBottom: 16,
  fontSize: 12,
};

const tableScrollStyle = { overflowX: "auto" as const };
const tableStyle = {
  width: "100%",
  minWidth: 700,
  borderCollapse: "collapse" as const,
};

const thStyle = {
  textAlign: "left" as const,
  color: "#64748b",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1,
  padding: "10px 12px",
  borderBottom: "1px solid #23364d",
};

const tdStyle = {
  color: "#cbd5e1",
  fontSize: 11,
  padding: "12px",
  borderBottom: "1px solid #1d2b3a",
};

const emptyStyle = { color: "#64748b", fontSize: 12 };
const emptyTdStyle = { ...tdStyle, textAlign: "center" as const };
const mutedStyle = { color: "#94a3b8" };

const errorCardStyle = {
  maxWidth: 560,
  margin: "100px auto",
  background: "#0f1d2e",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 24,
};

const errorTitleStyle = { fontSize: 36, margin: "8px 0" };


const commandCenterStyle = {
  background: "#0b1726",
  border: "1px solid #2b4058",
  borderRadius: 18,
  padding: 20,
  marginBottom: 18,
};

const commandCenterHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  flexWrap: "wrap" as const,
  marginBottom: 16,
};

const commandCenterTitleStyle = {
  margin: "6px 0 5px",
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 900,
};

const commandCenterTextStyle = {
  color: "#8fa4ba",
  margin: 0,
  maxWidth: 680,
  fontSize: 12,
  lineHeight: 1.5,
};

const commandStatusStyle = {
  border: "1px solid",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 1,
};

const commandGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 10,
};

const commandCardStyle = {
  minHeight: 135,
  background: "#0f1d2e",
  border: "1px solid #2a4058",
  borderRadius: 13,
  padding: 15,
  textAlign: "left" as const,
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column" as const,
  gap: 7,
};

const commandPrimaryStyle = {
  ...commandCardStyle,
  background: "#f4b82d",
  color: "#07111f",
  border: "1px solid #f6ca5e",
};

const commandLabelStyle = {
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 1.2,
  opacity: .72,
};

const commandTitleStyle = {
  fontSize: 17,
  fontWeight: 900,
};

const commandTextStyle = {
  fontSize: 10,
  lineHeight: 1.45,
  opacity: .75,
};

const commandHealthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 9,
  marginTop: 12,
};

const commandHealthStyle = {
  border: "1px solid",
  borderRadius: 11,
  padding: 12,
};

const commandHealthLabelStyle = {
  color: "#7890a8",
  fontSize: 7,
  fontWeight: 900,
  letterSpacing: 1.1,
};

const commandHealthValueStyle = {
  marginTop: 5,
  fontSize: 16,
  fontWeight: 900,
};
