"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Subscription = {
  plan: string | null;
  status: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
};

type RestaurantRow = {
  id: string;
  name: string;
  slug: string | null;
  owner_user_id: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  created_at: string;
  admin_suspended: boolean;
  admin_support_status: string;
  readiness_percent: number;
  subscription: Subscription | null;
  website: {
    published: boolean | null;
    hero_headline: string | null;
    about_body: string | null;
  } | null;
  metrics: {
    menu_count: number;
    vip_count: number;
    campaign_count: number;
    claim_count: number;
    redeemed_count: number;
  };
};

type Summary = {
  total_restaurants: number;
  active_paid: number;
  trials: number;
  past_due: number;
  canceled: number;
  suspended: number;
  estimated_mrr: number;
};

export default function AdminCommandCenterPage() {
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [adminRole, setAdminRole] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    setLoading(true);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/admin/overview", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setMessage("Super Admin access is required.");
      } else {
        setMessage(data.error || "Unable to load admin overview.");
      }

      setLoading(false);
      return;
    }

    setSummary(data.summary);
    setRestaurants(data.restaurants || []);
    setAdminRole(data.admin_role || "");
    setLoading(false);
  }

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const subscriptionStatus = restaurant.subscription?.status || "none";

      const matchesSearch =
        !q ||
        restaurant.name.toLowerCase().includes(q) ||
        (restaurant.city || "").toLowerCase().includes(q) ||
        (restaurant.state || "").toLowerCase().includes(q) ||
        (restaurant.phone || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && subscriptionStatus === "active") ||
        (statusFilter === "trial" && subscriptionStatus === "trial") ||
        (statusFilter === "past_due" && subscriptionStatus === "past_due") ||
        (statusFilter === "canceled" && subscriptionStatus === "canceled") ||
        (statusFilter === "suspended" && restaurant.admin_suspended) ||
        (statusFilter === "attention" &&
          restaurant.admin_support_status === "needs_attention");

      return matchesSearch && matchesStatus;
    });
  }, [restaurants, search, statusFilter]);

  function openOwner(restaurantId: string) {
    window.location.href = `/owner?restaurant=${restaurantId}`;
  }

  function openPublic(slug: string | null) {
    if (!slug) return;
    window.open(`/r/${slug}`, "_blank");
  }

  function openBilling(restaurantId: string) {
    window.location.href = `/owner/billing?restaurant=${restaurantId}`;
  }

  function openQA(restaurantId: string) {
    window.location.href = `/owner/qa?restaurant=${restaurantId}`;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading Super Admin Command Center...</div>
      </main>
    );
  }

  if (message) {
    return (
      <main style={pageStyle}>
        <div style={errorCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={errorTitleStyle}>Admin Access</h1>
          <p style={errorTextStyle}>{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Super Admin</h1>
            <p style={subStyle}>
              Platform-wide command center for restaurants, billing, readiness and support.
            </p>
          </div>

          <div style={roleBadgeStyle}>
            {adminRole.replace("_", " ").toUpperCase()}
          </div>
        </header>

        {summary && (
          <section style={statsGridStyle}>
            <StatCard label="TOTAL RESTAURANTS" value={summary.total_restaurants} />
            <StatCard label="ACTIVE PAID" value={summary.active_paid} />
            <StatCard label="TRIALS" value={summary.trials} />
            <StatCard label="PAST DUE" value={summary.past_due} />
            <StatCard label="SUSPENDED" value={summary.suspended} />
            <StatCard
              label="EST. MRR"
              value={`$${summary.estimated_mrr.toLocaleString()}`}
            />
          </section>
        )}

        <section style={attentionPanelStyle}>
          <div>
            <div style={attentionEyebrowStyle}>NEEDS ATTENTION</div>
            <div style={attentionTitleStyle}>
              {restaurants.filter(
                (restaurant) =>
                  restaurant.admin_suspended ||
                  restaurant.subscription?.status === "past_due" ||
                  restaurant.subscription?.status === "canceled" ||
                  restaurant.admin_support_status === "needs_attention" ||
                  restaurant.readiness_percent < 60
              ).length}{" "}
              accounts need review
            </div>
          </div>

          <button
            style={attentionButtonStyle}
            onClick={() => setStatusFilter("attention")}
          >
            FILTER ATTENTION
          </button>
        </section>

        <section style={toolbarStyle}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search restaurant, city, state or phone..."
            style={searchStyle}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Paid</option>
            <option value="trial">Trials</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
            <option value="suspended">Suspended</option>
            <option value="attention">Needs Attention</option>
          </select>

          <button style={secondaryButtonStyle} onClick={loadAdmin}>
            REFRESH
          </button>
        </section>

        <section style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <div style={tableTitleStyle}>Restaurants</div>
              <div style={tableSubStyle}>
                Showing {filteredRestaurants.length} of {restaurants.length}
              </div>
            </div>
          </div>

          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Restaurant</Th>
                  <Th>Billing</Th>
                  <Th>Readiness</Th>
                  <Th>Site</Th>
                  <Th>Growth</Th>
                  <Th>Support</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {filteredRestaurants.map((restaurant) => {
                  const subscriptionStatus =
                    restaurant.subscription?.status || "none";

                  return (
                    <tr key={restaurant.id} style={rowStyle}>
                      <Td>
                        <div style={restaurantNameStyle}>{restaurant.name}</div>
                        <div style={metaStyle}>
                          {[restaurant.city, restaurant.state]
                            .filter(Boolean)
                            .join(", ") || "No location"}
                        </div>
                        {restaurant.phone && (
                          <div style={metaStyle}>{restaurant.phone}</div>
                        )}
                      </Td>

                      <Td>
                        <StatusBadge status={subscriptionStatus} />
                        <div style={metaStyle}>
                          {restaurant.subscription?.plan || "No plan"}
                        </div>
                      </Td>

                      <Td>
                        <div style={readinessTopStyle}>
                          <span style={readinessValueStyle}>
                            {restaurant.readiness_percent}%
                          </span>
                        </div>

                        <div style={progressTrackStyle}>
                          <div
                            style={{
                              ...progressBarStyle,
                              width: `${restaurant.readiness_percent}%`,
                            }}
                          />
                        </div>
                      </Td>

                      <Td>
                        <span
                          style={
                            restaurant.website?.published
                              ? liveBadgeStyle
                              : draftBadgeStyle
                          }
                        >
                          {restaurant.website?.published ? "LIVE" : "DRAFT"}
                        </span>
                      </Td>

                      <Td>
                        <div style={metricLineStyle}>
                          VIP {restaurant.metrics.vip_count}
                        </div>
                        <div style={metricLineStyle}>
                          CAMPAIGNS {restaurant.metrics.campaign_count}
                        </div>
                        <div style={metricLineStyle}>
                          CLAIMS {restaurant.metrics.claim_count}
                        </div>
                      </Td>

                      <Td>
                        <div
                          style={
                            restaurant.admin_suspended
                              ? suspendedBadgeStyle
                              : supportBadgeStyle
                          }
                        >
                          {restaurant.admin_suspended
                            ? "SUSPENDED"
                            : restaurant.admin_support_status
                                .replace("_", " ")
                                .toUpperCase()}
                        </div>
                      </Td>

                      <Td>
                        <div style={actionStackStyle}>
                          <button
                            style={smallPrimaryButtonStyle}
                            onClick={() => openOwner(restaurant.id)}
                          >
                            OPEN
                          </button>

                          <button
                            style={smallSecondaryButtonStyle}
                            onClick={() => openPublic(restaurant.slug)}
                          >
                            SITE
                          </button>

                          <button
                            style={smallSecondaryButtonStyle}
                            onClick={() => openBilling(restaurant.id)}
                          >
                            BILLING
                          </button>

                          <button
                            style={smallSecondaryButtonStyle}
                            onClick={() => openQA(restaurant.id)}
                          >
                            QA
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div style={statCardStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "active"
      ? activeBadgeStyle
      : status === "trial"
      ? trialBadgeStyle
      : status === "past_due"
      ? warningBadgeStyle
      : status === "canceled"
      ? dangerBadgeStyle
      : neutralBadgeStyle;

  return <span style={style}>{status.replace("_", " ").toUpperCase()}</span>;
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
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1480px",
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

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(52px,8vw,88px)",
  lineHeight: ".9",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-4px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
  maxWidth: "760px",
};

const roleBadgeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  color: "#f5b82e",
  borderRadius: "999px",
  padding: "10px 14px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const statCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "20px",
};

const statValueStyle = {
  fontSize: "34px",
  fontWeight: 900,
  color: "#f5b82e",
};

const statLabelStyle = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const attentionPanelStyle = {
  background: "#3a1717",
  border: "1px solid #7f3333",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const attentionEyebrowStyle = {
  color: "#fca5a5",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1.5px",
};

const attentionTitleStyle = {
  fontSize: "24px",
  fontWeight: 900,
  marginTop: "4px",
};

const attentionButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const toolbarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px,1fr) 210px auto",
  gap: "10px",
  marginBottom: "16px",
};

const searchStyle = {
  background: "#0f1d2e",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "14px",
};

const selectStyle = {
  background: "#0f1d2e",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "13px",
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const tableCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  overflow: "hidden",
};

const tableHeaderStyle = {
  padding: "18px 20px",
  borderBottom: "1px solid #23364d",
};

const tableTitleStyle = {
  fontSize: "24px",
  fontWeight: 900,
};

const tableSubStyle = {
  color: "#64748b",
  fontSize: "12px",
  marginTop: "4px",
};

const tableScrollStyle = {
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "1100px",
};

const thStyle = {
  textAlign: "left" as const,
  padding: "13px 15px",
  color: "#64748b",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  borderBottom: "1px solid #23364d",
};

const tdStyle = {
  padding: "16px 15px",
  verticalAlign: "top" as const,
  borderBottom: "1px solid #1d2b3a",
};

const rowStyle = {
  background: "#0f1d2e",
};

const restaurantNameStyle = {
  fontSize: "16px",
  fontWeight: 900,
};

const metaStyle = {
  color: "#64748b",
  fontSize: "11px",
  marginTop: "4px",
};

const readinessTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "7px",
};

const readinessValueStyle = {
  color: "#f5b82e",
  fontSize: "14px",
  fontWeight: 900,
};

const progressTrackStyle = {
  width: "120px",
  height: "8px",
  background: "#08111f",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressBarStyle = {
  height: "100%",
  background: "#f5b82e",
  borderRadius: "999px",
};

const metricLineStyle = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: 800,
  marginBottom: "4px",
};

const actionStackStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(70px,1fr))",
  gap: "6px",
};

const smallPrimaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const smallSecondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const activeBadgeStyle = {
  display: "inline-block",
  background: "#12351f",
  color: "#86efac",
  borderRadius: "999px",
  padding: "6px 9px",
  fontSize: "9px",
  fontWeight: 900,
};

const trialBadgeStyle = {
  ...activeBadgeStyle,
  background: "#3b2d08",
  color: "#fde68a",
};

const warningBadgeStyle = {
  ...activeBadgeStyle,
  background: "#4a3010",
  color: "#fdba74",
};

const dangerBadgeStyle = {
  ...activeBadgeStyle,
  background: "#3b1d1d",
  color: "#fecaca",
};

const neutralBadgeStyle = {
  ...activeBadgeStyle,
  background: "#1e293b",
  color: "#cbd5e1",
};

const liveBadgeStyle = {
  ...activeBadgeStyle,
  background: "#12351f",
  color: "#86efac",
};

const draftBadgeStyle = {
  ...activeBadgeStyle,
  background: "#1e293b",
  color: "#cbd5e1",
};

const supportBadgeStyle = {
  ...activeBadgeStyle,
  background: "#13263b",
  color: "#cbd5e1",
};

const suspendedBadgeStyle = {
  ...activeBadgeStyle,
  background: "#3b1d1d",
  color: "#fecaca",
};

const errorCardStyle = {
  maxWidth: "560px",
  margin: "100px auto",
  background: "#0f1d2e",
  border: "1px solid #7f3333",
  borderRadius: "18px",
  padding: "28px",
};

const errorTitleStyle = {
  fontSize: "36px",
  margin: "8px 0",
};

const errorTextStyle = {
  color: "#fecaca",
};
