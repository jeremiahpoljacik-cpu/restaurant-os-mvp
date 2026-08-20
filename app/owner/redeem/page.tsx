"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Claim = {
  id: string;
  restaurant_id: string;
  offer_id: string;
  first_name: string | null;
  phone: string | null;
  email: string | null;
  claim_code: string;
  status: string;
  claimed_at: string | null;
  redeemed_at: string | null;
  created_at: string;
};

type Offer = {
  id: string;
  name: string;
  headline: string;
};

export default function OwnerRedeemPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");

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

    const [claimsResult, offersResult] = await Promise.all([
      supabase
        .from("restaurant_offer_claims")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("restaurant_vip_offers")
        .select("id,name,headline")
        .eq("restaurant_id", id),
    ]);

    if (claimsResult.error) {
      setMessage(claimsResult.error.message);
      setLoading(false);
      return;
    }

    if (offersResult.error) {
      setMessage(offersResult.error.message);
      setLoading(false);
      return;
    }

    setClaims(claimsResult.data || []);
    setOffers(offersResult.data || []);
    setLoading(false);
  }

  function offerName(offerId: string) {
    const offer = offers.find((o) => o.id === offerId);
    return offer?.headline || offer?.name || "Offer";
  }

  async function redeemClaim(claim: Claim) {
    if (claim.status === "redeemed") {
      setMessage("This code has already been redeemed.");
      return;
    }

    const { error } = await supabase
      .from("restaurant_offer_claims")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", claim.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setClaims((current) =>
      current.map((c) =>
        c.id === claim.id
          ? {
              ...c,
              status: "redeemed",
              redeemed_at: new Date().toISOString(),
            }
          : c
      )
    );

    setMessage(`Redeemed ${claim.claim_code}.`);
  }

  function findByCode() {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      setMessage("Enter a redemption code.");
      return;
    }

    const claim = claims.find(
      (item) => item.claim_code.toUpperCase() === normalized
    );

    if (!claim) {
      setMessage("Code not found.");
      return;
    }

    if (claim.status === "redeemed") {
      setMessage("This code has already been redeemed.");
      return;
    }

    redeemClaim(claim);
    setCode("");
  }

  const stats = useMemo(() => {
    const redeemed = claims.filter((c) => c.status === "redeemed").length;
    return {
      total: claims.length,
      claimed: claims.length - redeemed,
      redeemed,
    };
  }, [claims]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading redemption center...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Redemption Center</h1>
            <p style={subStyle}>
              {restaurantName} — enter a customer code and mark the offer redeemed.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/owner?restaurant=${restaurantId}`)
            }
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={redeemPanelStyle}>
          <div>
            <div style={eyebrowStyle}>REDEEM OFFER</div>
            <h2 style={redeemTitleStyle}>Enter Customer Code</h2>
          </div>

          <div style={redeemRowStyle}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") findByCode();
              }}
              placeholder="ABCD1234"
              maxLength={8}
              style={codeInputStyle}
            />

            <button style={primaryButtonStyle} onClick={findByCode}>
              REDEEM
            </button>
          </div>
        </section>

        <section style={statsGridStyle}>
          <Stat label="TOTAL CLAIMS" value={stats.total} />
          <Stat label="UNREDEEMED" value={stats.claimed} />
          <Stat label="REDEEMED" value={stats.redeemed} />
        </section>

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>RECENT CLAIMS</div>
          <h2 style={sectionTitleStyle}>Offer Activity</h2>

          {claims.length === 0 ? (
            <div style={emptyStyle}>No offer claims yet.</div>
          ) : (
            <div style={claimListStyle}>
              {claims.map((claim) => (
                <article key={claim.id} style={claimCardStyle}>
                  <div style={claimTopStyle}>
                    <div>
                      <div style={codeStyle}>{claim.claim_code}</div>
                      <div style={offerStyle}>{offerName(claim.offer_id)}</div>
                    </div>

                    <div
                      style={{
                        ...statusStyle,
                        background:
                          claim.status === "redeemed" ? "#12351f" : "#3b2d08",
                        color:
                          claim.status === "redeemed" ? "#86efac" : "#fde68a",
                      }}
                    >
                      {claim.status === "redeemed" ? "REDEEMED" : "CLAIMED"}
                    </div>
                  </div>

                  <div style={detailsGridStyle}>
                    <Info label="CUSTOMER" value={claim.first_name || "VIP Customer"} />
                    <Info label="PHONE" value={claim.phone || "Not provided"} />
                    <Info label="EMAIL" value={claim.email || "Not provided"} />
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
                  </div>

                  {claim.status !== "redeemed" && (
                    <button
                      style={primaryButtonStyle}
                      onClick={() => redeemClaim(claim)}
                    >
                      MARK REDEEMED
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
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

const redeemPanelStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "20px",
};

const redeemTitleStyle = {
  fontSize: "30px",
  margin: "6px 0 18px",
};

const redeemRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "12px",
};

const codeInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#08111f",
  color: "#ffffff",
  border: "2px solid #f5b82e",
  borderRadius: "12px",
  padding: "17px",
  fontSize: "24px",
  fontWeight: 900,
  letterSpacing: "5px",
  textTransform: "uppercase" as const,
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
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

const sectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
};

const sectionTitleStyle = {
  fontSize: "28px",
  margin: "6px 0 20px",
};

const claimListStyle = {
  display: "grid",
  gap: "14px",
};

const claimCardStyle = {
  background: "#0a1522",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "20px",
};

const claimTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const codeStyle = {
  color: "#f5b82e",
  fontSize: "28px",
  fontWeight: 900,
  letterSpacing: "4px",
};

const offerStyle = {
  marginTop: "6px",
  fontSize: "16px",
  fontWeight: 800,
};

const statusStyle = {
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "10px",
  fontWeight: 900,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
  gap: "16px",
  margin: "18px 0",
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
  fontWeight: 700,
  wordBreak: "break-word" as const,
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "13px 16px",
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
  color: "#64748b",
  border: "1px dashed #334155",
  borderRadius: "14px",
  padding: "30px",
  textAlign: "center" as const,
};
