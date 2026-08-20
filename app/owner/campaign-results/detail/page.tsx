"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Campaign = {
  id: string;
  restaurant_id: string;
  offer_id: string | null;
  name: string;
  channel: string;
  audience: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type Offer = {
  id: string;
  name: string;
  headline: string;
};

type Claim = {
  id: string;
  restaurant_id: string;
  offer_id: string;
  campaign_id: string | null;
  vip_member_id: string | null;
  first_name: string | null;
  phone: string | null;
  email: string | null;
  claim_code: string;
  status: string;
  created_at: string;
  redeemed_at: string | null;
};

export default function CampaignResultsPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

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

    const [campaignResult, offerResult, claimResult] = await Promise.all([
      supabase
        .from("restaurant_campaigns")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("restaurant_vip_offers")
        .select("id,name,headline")
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_offer_claims")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (campaignResult.error) {
      setMessage(campaignResult.error.message);
      setLoading(false);
      return;
    }

    if (offerResult.error) {
      setMessage(offerResult.error.message);
      setLoading(false);
      return;
    }

    if (claimResult.error) {
      setMessage(claimResult.error.message);
      setLoading(false);
      return;
    }

    setCampaigns(campaignResult.data || []);
    setOffers(offerResult.data || []);
    setClaims(claimResult.data || []);
    setLoading(false);
  }

  function offerLabel(offerId: string | null) {
    if (!offerId) return "No offer";
    const offer = offers.find((item) => item.id === offerId);
    return offer?.headline || offer?.name || "Offer";
  }

  const campaignRows = useMemo(() => {
    return campaigns.map((campaign) => {
      const campaignClaims = claims.filter(
        (claim) => claim.campaign_id === campaign.id
      );
      const redeemed = campaignClaims.filter(
        (claim) => claim.status === "redeemed"
      );
      const uniqueCustomers = new Set(
        campaignClaims.map(
          (claim) =>
            claim.vip_member_id ||
            claim.phone ||
            claim.email ||
            claim.id
        )
      ).size;

      const redemptionRate =
        campaignClaims.length > 0
          ? (redeemed.length / campaignClaims.length) * 100
          : 0;

      return {
        campaign,
        claims: campaignClaims.length,
        redeemed: redeemed.length,
        unredeemed: campaignClaims.length - redeemed.length,
        uniqueCustomers,
        redemptionRate,
      };
    });
  }, [campaigns, claims]);

  const visibleRows = useMemo(() => {
    if (filter === "all") return campaignRows;
    return campaignRows.filter((row) => row.campaign.status === filter);
  }, [campaignRows, filter]);

  const totals = useMemo(() => {
    const attributedClaims = claims.filter((claim) => claim.campaign_id);
    const redeemed = attributedClaims.filter(
      (claim) => claim.status === "redeemed"
    );
    const unattributed = claims.filter((claim) => !claim.campaign_id);

    return {
      campaigns: campaigns.length,
      claims: attributedClaims.length,
      redeemed: redeemed.length,
      unattributed: unattributed.length,
      rate:
        attributedClaims.length > 0
          ? (redeemed.length / attributedClaims.length) * 100
          : 0,
    };
  }, [campaigns, claims]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading campaign results...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Campaign Results</h1>
            <p style={subStyle}>
              {restaurantName} — see which campaigns actually drive claims and redemptions.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner/campaigns?restaurant=${restaurantId}`)
              }
            >
              MANAGE CAMPAIGNS
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
          <Stat label="CAMPAIGNS" value={totals.campaigns} />
          <Stat label="ATTRIBUTED CLAIMS" value={totals.claims} />
          <Stat label="REDEEMED" value={totals.redeemed} />
          <Stat label="REDEMPTION RATE" value={`${totals.rate.toFixed(1)}%`} />
          <Stat label="UNATTRIBUTED CLAIMS" value={totals.unattributed} />
        </section>

        <section style={filterPanelStyle}>
          <div style={filterRowStyle}>
            {["all", "active", "draft", "paused", "completed"].map((status) => (
              <button
                key={status}
                style={{
                  ...filterButtonStyle,
                  background: filter === status ? "#f5b82e" : "#08111f",
                  color: filter === status ? "#08111f" : "#cbd5e1",
                  borderColor: filter === status ? "#f5b82e" : "#334155",
                }}
                onClick={() => setFilter(status)}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {visibleRows.length === 0 ? (
          <section style={emptyStyle}>
            No campaigns match this filter yet.
          </section>
        ) : (
          <section style={campaignListStyle}>
            {visibleRows.map((row) => (
              <article key={row.campaign.id} style={campaignCardStyle}>
                <div style={campaignTopStyle}>
                  <div>
                    <div style={campaignNameStyle}>{row.campaign.name}</div>
                    <div style={campaignMetaStyle}>
                      {row.campaign.channel.toUpperCase()} •{" "}
                      {row.campaign.audience.replaceAll("_", " ").toUpperCase()}
                    </div>
                    <div style={offerStyle}>
                      {offerLabel(row.campaign.offer_id)}
                    </div>
                  </div>

                  <div style={statusBadgeStyle}>
                    {row.campaign.status.toUpperCase()}
                  </div>
                </div>

                <div style={metricGridStyle}>
                  <Metric label="CLAIMS" value={row.claims} />
                  <Metric label="REDEEMED" value={row.redeemed} />
                  <Metric label="UNREDEEMED" value={row.unredeemed} />
                  <Metric label="UNIQUE CUSTOMERS" value={row.uniqueCustomers} />
                  <Metric
                    label="REDEMPTION RATE"
                    value={`${row.redemptionRate.toFixed(1)}%`}
                  />
                </div>

                <div style={progressWrapStyle}>
                  <div style={progressLabelRowStyle}>
                    <span>CLAIM → REDEMPTION</span>
                    <span>{row.redemptionRate.toFixed(1)}%</span>
                  </div>

                  <div style={progressTrackStyle}>
                    <div
                      style={{
                        ...progressBarStyle,
                        width: `${Math.min(row.redemptionRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={footerRowStyle}>
                  <div style={dateStyle}>
                    Created{" "}
                    {new Date(row.campaign.created_at).toLocaleDateString()}
                  </div>

                  <button
                    style={secondaryButtonStyle}
                    onClick={() =>
                      (window.location.href =
                        `/owner/campaign-results/detail?restaurant=${restaurantId}&campaign=${row.campaign.id}`)
                    }
                  >
                    VIEW CUSTOMERS
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div style={statStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
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
  maxWidth: "1220px",
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
  gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))",
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
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const filterPanelStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "18px",
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
  fontSize: "10px",
  cursor: "pointer",
};

const campaignListStyle = {
  display: "grid",
  gap: "16px",
};

const campaignCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
};

const campaignTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap" as const,
};

const campaignNameStyle = {
  fontSize: "25px",
  fontWeight: 900,
};

const campaignMetaStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "7px",
};

const offerStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
  marginTop: "8px",
};

const statusBadgeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "10px",
  fontWeight: 900,
};

const metricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
  gap: "10px",
  marginTop: "20px",
};

const metricStyle = {
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "12px",
  padding: "16px",
};

const metricValueStyle = {
  fontSize: "26px",
  fontWeight: 900,
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const progressWrapStyle = {
  marginTop: "20px",
};

const progressLabelRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "7px",
};

const progressTrackStyle = {
  height: "10px",
  background: "#08111f",
  borderRadius: "999px",
  overflow: "hidden",
  border: "1px solid #23364d",
};

const progressBarStyle = {
  height: "100%",
  background: "#f5b82e",
  borderRadius: "999px",
};

const footerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap" as const,
  borderTop: "1px solid #23364d",
  marginTop: "20px",
  paddingTop: "16px",
};

const dateStyle = {
  color: "#64748b",
  fontSize: "11px",
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
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
  padding: "42px 24px",
  textAlign: "center" as const,
  color: "#64748b",
};
