"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Campaign = {
  id: string;
  restaurant_id: string;
  offer_id: string | null;
  name: string;
  channel: string;
  audience: string;
  message: string | null;
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

export default function CampaignDetailPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "claimed" | "redeemed">("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams(window.location.search);
    const restaurant = params.get("restaurant");
    const campaignParam = params.get("campaign");

    if (!restaurant || !campaignParam) {
      setMessage("Restaurant and campaign are required.");
      setLoading(false);
      return;
    }

    setRestaurantId(restaurant);
    setCampaignId(campaignParam);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name")
      .eq("id", restaurant)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurantData.name);

    const { data: campaignData, error: campaignError } = await supabase
      .from("restaurant_campaigns")
      .select("*")
      .eq("id", campaignParam)
      .eq("restaurant_id", restaurant)
      .maybeSingle();

    if (campaignError || !campaignData) {
      setMessage(campaignError?.message || "Campaign not found.");
      setLoading(false);
      return;
    }

    setCampaign(campaignData);

    const [offerResult, claimsResult] = await Promise.all([
      campaignData.offer_id
        ? supabase
            .from("restaurant_vip_offers")
            .select("id,name,headline")
            .eq("id", campaignData.offer_id)
            .eq("restaurant_id", restaurant)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null } as any),

      supabase
        .from("restaurant_offer_claims")
        .select("*")
        .eq("restaurant_id", restaurant)
        .eq("campaign_id", campaignParam)
        .order("created_at", { ascending: false }),
    ]);

    if (offerResult.error) {
      setMessage(offerResult.error.message);
      setLoading(false);
      return;
    }

    if (claimsResult.error) {
      setMessage(claimsResult.error.message);
      setLoading(false);
      return;
    }

    setOffer(offerResult.data || null);
    setClaims(claimsResult.data || []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const redeemed = claims.filter((claim) => claim.status === "redeemed").length;
    const claimed = claims.length - redeemed;
    const uniqueCustomers = new Set(
      claims.map(
        (claim) =>
          claim.vip_member_id ||
          claim.phone ||
          claim.email ||
          claim.id
      )
    ).size;

    return {
      claims: claims.length,
      redeemed,
      claimed,
      uniqueCustomers,
      redemptionRate:
        claims.length > 0 ? (redeemed / claims.length) * 100 : 0,
    };
  }, [claims]);

  const visibleClaims = useMemo(() => {
    if (filter === "all") return claims;
    return claims.filter((claim) => claim.status === filter);
  }, [claims, filter]);

  function customerName(claim: Claim) {
    return claim.first_name || claim.phone || claim.email || "VIP Customer";
  }

  function exportCsv() {
    const rows = [
      [
        "Customer",
        "Phone",
        "Email",
        "Claim Code",
        "Status",
        "Claimed",
        "Redeemed",
      ],
      ...claims.map((claim) => [
        customerName(claim),
        claim.phone || "",
        claim.email || "",
        claim.claim_code,
        claim.status,
        new Date(claim.created_at).toLocaleString(),
        claim.redeemed_at
          ? new Date(claim.redeemed_at).toLocaleString()
          : "",
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
    link.download = `${campaign?.name || "campaign"}-results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading campaign details...</div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>{message || "Campaign not found."}</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>{campaign.name}</h1>
            <p style={subStyle}>
              {restaurantName} — inspect the exact customers, claim codes and redemptions attributed to this campaign.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button style={secondaryButtonStyle} onClick={exportCsv}>
              EXPORT CSV
            </button>

            <button
              style={secondaryButtonStyle}
              onClick={() =>
                (window.location.href =
                  `/owner/campaign-results?restaurant=${restaurantId}`)
              }
            >
              BACK TO RESULTS
            </button>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={summaryCardStyle}>
          <div>
            <div style={eyebrowStyle}>CAMPAIGN</div>
            <div style={summaryTitleStyle}>{campaign.name}</div>
            <div style={summaryMetaStyle}>
              {campaign.channel.toUpperCase()} •{" "}
              {campaign.audience.replaceAll("_", " ").toUpperCase()} •{" "}
              {campaign.status.toUpperCase()}
            </div>
          </div>

          <div style={offerPanelStyle}>
            <div style={offerLabelStyle}>ATTACHED OFFER</div>
            <div style={offerValueStyle}>
              {offer?.headline || offer?.name || "No offer attached"}
            </div>
          </div>
        </section>

        <section style={statsGridStyle}>
          <Stat label="TOTAL CLAIMS" value={stats.claims} />
          <Stat label="UNREDEEMED" value={stats.claimed} />
          <Stat label="REDEEMED" value={stats.redeemed} />
          <Stat label="UNIQUE CUSTOMERS" value={stats.uniqueCustomers} />
          <Stat
            label="REDEMPTION RATE"
            value={`${stats.redemptionRate.toFixed(1)}%`}
          />
        </section>

        <section style={filterPanelStyle}>
          <div style={filterRowStyle}>
            {[
              ["all", "ALL"],
              ["claimed", "CLAIMED"],
              ["redeemed", "REDEEMED"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as typeof filter)}
                style={{
                  ...filterButtonStyle,
                  background: filter === value ? "#f5b82e" : "#08111f",
                  color: filter === value ? "#08111f" : "#cbd5e1",
                  borderColor: filter === value ? "#f5b82e" : "#334155",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {visibleClaims.length === 0 ? (
          <section style={emptyStyle}>
            No customer claims match this filter yet.
          </section>
        ) : (
          <section style={claimListStyle}>
            {visibleClaims.map((claim) => (
              <article key={claim.id} style={claimCardStyle}>
                <div style={claimTopStyle}>
                  <div>
                    <div style={customerNameStyle}>{customerName(claim)}</div>
                    <div style={customerMetaStyle}>
                      {[claim.phone, claim.email].filter(Boolean).join(" • ") ||
                        "No phone/email"}
                    </div>
                  </div>

                  <div
                    style={{
                      ...statusBadgeStyle,
                      background:
                        claim.status === "redeemed" ? "#12351f" : "#3b2d08",
                      color:
                        claim.status === "redeemed" ? "#86efac" : "#fde68a",
                    }}
                  >
                    {claim.status.toUpperCase()}
                  </div>
                </div>

                <div style={detailsGridStyle}>
                  <Info label="CLAIM CODE" value={claim.claim_code} mono />
                  <Info
                    label="CLAIMED"
                    value={new Date(claim.created_at).toLocaleString()}
                  />
                  <Info
                    label="REDEEMED"
                    value={
                      claim.redeemed_at
                        ? new Date(claim.redeemed_at).toLocaleString()
                        : "Not yet"
                    }
                  />
                  <Info
                    label="VIP MEMBER"
                    value={claim.vip_member_id ? "MATCHED" : "NOT MATCHED"}
                  />
                </div>

                <div style={claimFooterStyle}>
                  <button
                    style={secondaryButtonStyle}
                    onClick={() =>
                      (window.location.href =
                        `/owner/redeem?restaurant=${restaurantId}`)
                    }
                  >
                    OPEN REDEMPTION CENTER
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

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>
      <div
        style={{
          ...infoValueStyle,
          ...(mono ? { letterSpacing: "3px", color: "#f5b82e" } : {}),
        }}
      >
        {value}
      </div>
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
  maxWidth: "760px",
  lineHeight: 1.5,
};

const summaryCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "20px",
};

const summaryTitleStyle = {
  fontSize: "28px",
  fontWeight: 900,
  marginTop: "6px",
};

const summaryMetaStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "8px",
};

const offerPanelStyle = {
  background: "#08111f",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "14px 16px",
  minWidth: "260px",
};

const offerLabelStyle = {
  color: "#64748b",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const offerValueStyle = {
  marginTop: "6px",
  fontWeight: 900,
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

const claimListStyle = {
  display: "grid",
  gap: "14px",
};

const claimCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
};

const claimTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap" as const,
};

const customerNameStyle = {
  fontSize: "22px",
  fontWeight: 900,
};

const customerMetaStyle = {
  color: "#64748b",
  fontSize: "12px",
  marginTop: "5px",
};

const statusBadgeStyle = {
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "10px",
  fontWeight: 900,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
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
  fontSize: "14px",
  fontWeight: 800,
  wordBreak: "break-word" as const,
};

const claimFooterStyle = {
  borderTop: "1px solid #23364d",
  marginTop: "18px",
  paddingTop: "16px",
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
