"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  published: boolean;
  status: string | null;
};

type DomainRecord = {
  normalized_domain?: string | null;
  dns_status?: string | null;
  ssl_status?: string | null;
  verification_status?: string | null;
  provider_status?: string | null;
};

export default function OwnerWebsitePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [domain, setDomain] = useState<DomainRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    const restaurantId = new URLSearchParams(window.location.search).get(
      "restaurant"
    );

    if (!restaurantId) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    const { data: restaurantData, error } = await supabase
      .from("restaurants")
      .select("id,name,slug,published,status")
      .eq("id", restaurantId)
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (error || !restaurantData) {
      setMessage(error?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    const { data: domainData } = await supabase
      .from("restaurant_domains")
      .select(
        "normalized_domain,dns_status,ssl_status,verification_status,provider_status"
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_primary", true)
      .maybeSingle();

    setDomain(domainData || null);
    setLoading(false);
  }

  async function togglePublished() {
    if (!restaurant) return;

    setSaving(true);
    setMessage("");

    const nextPublished = !restaurant.published;

    const { error } = await supabase
      .from("restaurants")
      .update({
        published: nextPublished,
        status: nextPublished ? "published" : "draft",
      })
      .eq("id", restaurant.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setRestaurant({
      ...restaurant,
      published: nextPublished,
      status: nextPublished ? "published" : "draft",
    });

    setMessage(
      nextPublished
        ? "Website published. Public fallback URL is now live."
        : "Website moved back to draft."
    );

    setSaving(false);
  }

  const fallbackUrl = useMemo(() => {
    if (!restaurant?.slug) return "";
    return `/r/${restaurant.slug}`;
  }, [restaurant]);

  const domainReady =
    domain?.verification_status === "verified" &&
    domain?.dns_status === "configured" &&
    domain?.ssl_status === "active";

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading website controls...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Website Launch Control</h1>
            <p style={subStyle}>
              {restaurant?.name || "Restaurant"} — publish the Restaurant OS
              website when you are ready. Custom domain cutover is controlled
              separately by Super Admin.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/owner?restaurant=${restaurant?.id || ""}`)
            }
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={statusCardStyle}>
          <div>
            <div style={cardEyebrowStyle}>PUBLIC WEBSITE</div>
            <div style={statusTitleStyle}>
              {restaurant?.published ? "PUBLISHED" : "DRAFT"}
            </div>
            <p style={helpStyle}>
              Publishing enables the Restaurant OS public site at the fallback
              URL. It does not switch the restaurant&apos;s custom domain.
            </p>
          </div>

          <div style={statusBadgeStyle}>
            {restaurant?.published ? "LIVE" : "NOT LIVE"}
          </div>
        </section>

        <section style={gridStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>FALLBACK URL</div>
            <h2 style={cardTitleStyle}>Restaurant OS Public Link</h2>

            <div style={urlBoxStyle}>
              {fallbackUrl || "No slug configured"}
            </div>

            {fallbackUrl && (
              <button
                style={secondaryFullButtonStyle}
                onClick={() => window.open(fallbackUrl, "_blank")}
              >
                OPEN PUBLIC SITE
              </button>
            )}
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>CUSTOM DOMAIN</div>
            <h2 style={cardTitleStyle}>Domain Readiness</h2>

            <StatusRow
              label="DOMAIN"
              value={domain?.normalized_domain || "NOT STAGED"}
            />
            <StatusRow
              label="VERIFICATION"
              value={domain?.verification_status || "PENDING"}
            />
            <StatusRow
              label="DNS"
              value={domain?.dns_status || "PENDING"}
            />
            <StatusRow
              label="SSL"
              value={domain?.ssl_status || "PENDING"}
            />

            <div
              style={{
                ...readinessBoxStyle,
                borderColor: domainReady ? "#22c55e" : "#f59e0b",
                color: domainReady ? "#86efac" : "#fcd34d",
              }}
            >
              {domainReady
                ? "CUSTOM DOMAIN READY FOR CUTOVER"
                : "CUSTOM DOMAIN STILL IN PREP MODE"}
            </div>
          </div>
        </section>

        <section style={publishCardStyle}>
          <div>
            <div style={cardEyebrowStyle}>LAUNCH ACTION</div>
            <h2 style={publishTitleStyle}>
              {restaurant?.published ? "Website Is Live" : "Ready to Publish?"}
            </h2>
            <p style={helpStyle}>
              Publish only after you have reviewed the restaurant site and menu.
              Custom DNS remains untouched until Super Admin completes the final
              domain cutover.
            </p>
          </div>

          <button
            style={
              restaurant?.published
                ? unpublishButtonStyle
                : publishButtonStyle
            }
            disabled={saving || !restaurant}
            onClick={togglePublished}
          >
            {saving
              ? "SAVING..."
              : restaurant?.published
              ? "MOVE BACK TO DRAFT"
              : "PUBLISH WEBSITE"}
          </button>
        </section>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={statusRowStyle}>
      <div style={statusLabelStyle}>{label}</div>
      <div style={statusValueStyle}>{value.toUpperCase()}</div>
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
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "7px 0 8px",
  fontSize: "clamp(42px,6vw,68px)",
  lineHeight: ".95",
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  maxWidth: "760px",
  lineHeight: 1.55,
};

const secondaryButtonStyle = {
  background: "#13263b",
  color: "#ffffff",
  border: "1px solid #36516c",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  marginBottom: "16px",
  background: "#13263b",
  border: "1px solid #2d4661",
  color: "#dbeafe",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
};

const statusCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
  background: "#10253a",
  border: "1px solid #36516c",
  borderRadius: "16px",
  padding: "22px",
  marginBottom: "16px",
};

const cardEyebrowStyle = {
  color: "#f5b82e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.5px",
};

const statusTitleStyle = {
  fontSize: "34px",
  fontWeight: 900,
  marginTop: "5px",
};

const statusBadgeStyle = {
  background: "#08111f",
  color: "#f5b82e",
  border: "1px solid #36516c",
  borderRadius: "999px",
  padding: "10px 14px",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: "16px",
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "22px",
};

const cardTitleStyle = {
  margin: "6px 0 16px",
  fontSize: "28px",
};

const helpStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.55,
};

const urlBoxStyle = {
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "13px",
  wordBreak: "break-word" as const,
};

const secondaryFullButtonStyle = {
  width: "100%",
  marginTop: "12px",
  background: "#13263b",
  color: "#ffffff",
  border: "1px solid #36516c",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const statusRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid #23364d",
};

const statusLabelStyle = {
  color: "#64748b",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const statusValueStyle = {
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 900,
};

const readinessBoxStyle = {
  marginTop: "14px",
  background: "#08111f",
  border: "1px solid",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: ".5px",
};

const publishCardStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "22px",
};

const publishTitleStyle = {
  margin: "6px 0 7px",
  fontSize: "30px",
};

const publishButtonStyle = {
  background: "#22c55e",
  color: "#052e16",
  border: 0,
  borderRadius: "10px",
  padding: "14px 18px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const unpublishButtonStyle = {
  background: "#7f1d1d",
  color: "#ffffff",
  border: "1px solid #991b1b",
  borderRadius: "10px",
  padding: "14px 18px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};
