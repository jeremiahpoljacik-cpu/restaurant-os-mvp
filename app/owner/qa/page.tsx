"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Check = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export default function OwnerQAPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    runChecks();
  }, []);

  async function runChecks() {
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

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name,slug,status")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);
    setPublicUrl(
      restaurant.slug
        ? `${window.location.origin}/r/${restaurant.slug}`
        : ""
    );

    const [
      subscriptionResult,
      brandingResult,
      hoursResult,
      orderingResult,
      growthResult,
      websiteResult,
      menuItemsResult,
      vipResult,
      offersResult,
      campaignsResult,
      claimsResult,
    ] = await Promise.all([
      supabase
        .from("restaurant_subscriptions")
        .select("status,trial_ends_at,provider_customer_id,provider_subscription_id")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_branding")
        .select("restaurant_id")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_hours")
        .select("restaurant_id")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_ordering")
        .select("restaurant_id")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_growth_settings")
        .select("restaurant_id")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_website_settings")
        .select("published,hero_headline,about_body")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_menu_items")
        .select("id", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_vip_members")
        .select("id", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_vip_offers")
        .select("id", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_campaigns")
        .select("id", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_offer_claims")
        .select("id,campaign_id,status", { count: "exact" })
        .eq("restaurant_id", id),
    ]);

    const next: Check[] = [];

    next.push({
      label: "Owner Authentication",
      status: "pass",
      detail: "Authenticated owner can access this restaurant.",
    });

    next.push({
      label: "Restaurant Record",
      status: restaurant.slug ? "pass" : "fail",
      detail: restaurant.slug
        ? `Restaurant slug is ${restaurant.slug}.`
        : "Restaurant is missing a public slug.",
    });

    const subscription = subscriptionResult.data;
    const trialValid =
      subscription?.status === "trial" &&
      (!subscription.trial_ends_at ||
        new Date(subscription.trial_ends_at).getTime() > Date.now());

    next.push({
      label: "Subscription Access",
      status:
        subscription?.status === "active" || trialValid ? "pass" : "fail",
      detail: subscription
        ? `Current subscription status: ${subscription.status}.`
        : "No subscription row found.",
    });

    next.push({
      label: "Branding Row",
      status: brandingResult.data ? "pass" : "fail",
      detail: brandingResult.data
        ? "Branding defaults exist."
        : "Missing restaurant_branding row.",
    });

    next.push({
      label: "Hours Row",
      status: hoursResult.data ? "pass" : "fail",
      detail: hoursResult.data
        ? "Hours row exists."
        : "Missing restaurant_hours row.",
    });

    next.push({
      label: "Ordering Row",
      status: orderingResult.data ? "pass" : "fail",
      detail: orderingResult.data
        ? "Ordering settings row exists."
        : "Missing restaurant_ordering row.",
    });

    next.push({
      label: "Growth Settings Row",
      status: growthResult.data ? "pass" : "fail",
      detail: growthResult.data
        ? "Growth settings row exists."
        : "Missing restaurant_growth_settings row.",
    });

    const website = websiteResult.data;
    next.push({
      label: "Website Settings",
      status: website ? "pass" : "fail",
      detail: website
        ? website.published
          ? "Website settings exist and site is published."
          : "Website settings exist; site is not published yet."
        : "Missing restaurant_website_settings row.",
    });

    const menuCount = menuItemsResult.count || 0;
    next.push({
      label: "Menu",
      status: menuCount > 0 ? "pass" : "warn",
      detail:
        menuCount > 0
          ? `${menuCount} menu item${menuCount === 1 ? "" : "s"} found.`
          : "No menu items yet.",
    });

    const vipCount = vipResult.count || 0;
    next.push({
      label: "VIP Capture",
      status: vipCount > 0 ? "pass" : "warn",
      detail:
        vipCount > 0
          ? `${vipCount} VIP member${vipCount === 1 ? "" : "s"} captured.`
          : "No VIP members yet. Public signup should be tested.",
    });

    const offerCount = offersResult.count || 0;
    next.push({
      label: "Offers",
      status: offerCount > 0 ? "pass" : "warn",
      detail:
        offerCount > 0
          ? `${offerCount} offer${offerCount === 1 ? "" : "s"} found.`
          : "No offers yet.",
    });

    const campaignCount = campaignsResult.count || 0;
    next.push({
      label: "Campaigns",
      status: campaignCount > 0 ? "pass" : "warn",
      detail:
        campaignCount > 0
          ? `${campaignCount} campaign${campaignCount === 1 ? "" : "s"} found.`
          : "No campaigns yet.",
    });

    const claims = claimsResult.data || [];
    const attributedClaims = claims.filter((claim) => claim.campaign_id).length;
    const redeemedClaims = claims.filter(
      (claim) => claim.status === "redeemed"
    ).length;

    next.push({
      label: "Offer Claims",
      status: claims.length > 0 ? "pass" : "warn",
      detail:
        claims.length > 0
          ? `${claims.length} claim${claims.length === 1 ? "" : "s"} found; ${attributedClaims} campaign-attributed; ${redeemedClaims} redeemed.`
          : "No claim yet. Public claim + redemption should be tested.",
    });

    if (subscription?.status === "active") {
      next.push({
        label: "Stripe Billing Sync",
        status:
          subscription.provider_customer_id &&
          subscription.provider_subscription_id
            ? "pass"
            : "fail",
        detail:
          subscription.provider_customer_id &&
          subscription.provider_subscription_id
            ? "Stripe customer and subscription IDs are stored."
            : "Subscription is active but Stripe IDs are missing.",
      });
    } else {
      next.push({
        label: "Stripe Billing Sync",
        status: "warn",
        detail: "Complete one real checkout to validate webhook synchronization.",
      });
    }

    setChecks(next);
    setLoading(false);
  }

  const passCount = useMemo(
    () => checks.filter((check) => check.status === "pass").length,
    [checks]
  );

  const failCount = useMemo(
    () => checks.filter((check) => check.status === "fail").length,
    [checks]
  );

  const warnCount = useMemo(
    () => checks.filter((check) => check.status === "warn").length,
    [checks]
  );

  function go(path: string) {
    window.location.href = `${path}?restaurant=${restaurantId}`;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Running Restaurant OS checks...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>FOUNDER QA</div>
            <h1 style={titleStyle}>System Check</h1>
            <p style={subStyle}>
              {restaurantName} — verify the core SaaS loop before founder launch.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button style={secondaryButtonStyle} onClick={runChecks}>
              RUN AGAIN
            </button>

            <button
              style={secondaryButtonStyle}
              onClick={() => go("/owner")}
            >
              DASHBOARD
            </button>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={statsGridStyle}>
          <Stat label="PASS" value={passCount} />
          <Stat label="WARN" value={warnCount} />
          <Stat label="FAIL" value={failCount} />
        </section>

        <section style={statusPanelStyle}>
          <div style={eyebrowStyle}>OVERALL STATUS</div>
          <div style={overallStyle}>
            {failCount === 0 ? "FOUNDER TEST READY" : "FIX REQUIRED"}
          </div>
          <p style={overallTextStyle}>
            {failCount === 0
              ? "No hard failures detected. Warnings are test items or incomplete content."
              : `${failCount} hard failure${failCount === 1 ? "" : "s"} detected. Fix those before launch.`}
          </p>

          {publicUrl && (
            <button
              style={primaryButtonStyle}
              onClick={() => window.open(publicUrl, "_blank")}
            >
              OPEN PUBLIC SITE
            </button>
          )}
        </section>

        <section style={checkGridStyle}>
          {checks.map((check) => (
            <article key={check.label} style={checkCardStyle}>
              <div
                style={{
                  ...badgeStyle,
                  ...(check.status === "pass"
                    ? passBadgeStyle
                    : check.status === "fail"
                    ? failBadgeStyle
                    : warnBadgeStyle),
                }}
              >
                {check.status.toUpperCase()}
              </div>

              <div>
                <h2 style={checkTitleStyle}>{check.label}</h2>
                <p style={checkTextStyle}>{check.detail}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCardStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
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
  maxWidth: "1100px",
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
  fontSize: "clamp(48px,8vw,82px)",
  lineHeight: ".92",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const statCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "18px",
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
};

const statusPanelStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "18px",
};

const overallStyle = {
  fontSize: "32px",
  fontWeight: 900,
  marginTop: "7px",
};

const overallTextStyle = {
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const checkGridStyle = {
  display: "grid",
  gap: "12px",
};

const checkCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "14px",
  padding: "18px",
  display: "grid",
  gridTemplateColumns: "90px 1fr",
  gap: "16px",
  alignItems: "start",
};

const badgeStyle = {
  borderRadius: "999px",
  padding: "8px 10px",
  textAlign: "center" as const,
  fontSize: "9px",
  fontWeight: 900,
};

const passBadgeStyle = {
  background: "#12351f",
  color: "#86efac",
};

const warnBadgeStyle = {
  background: "#3b2d08",
  color: "#fde68a",
};

const failBadgeStyle = {
  background: "#3b1d1d",
  color: "#fecaca",
};

const checkTitleStyle = {
  fontSize: "20px",
  margin: 0,
};

const checkTextStyle = {
  color: "#94a3b8",
  margin: "6px 0 0",
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
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

const messageStyle = {
  background: "#3b1d1d",
  border: "1px solid #7f3333",
  borderRadius: "10px",
  padding: "13px",
  marginBottom: "18px",
  color: "#fecaca",
};
