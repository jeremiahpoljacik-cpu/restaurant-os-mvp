"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Check = {
  key: string;
  label: string;
  detail: string;
  pass: boolean;
  action?: string;
  href?: string;
};

export default function OwnerQAPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    runChecks();
  }, []);

  async function runChecks() {
    setLoading(true);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    const id = new URLSearchParams(window.location.search).get("restaurant") || "";

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const [
      restaurantResult,
      brandingResult,
      websiteResult,
      orderingResult,
      menuCategoriesResult,
      menuItemsResult,
      vipResult,
      offersResult,
      campaignsResult,
      subscriptionResult,
      domainResult,
    ] = await Promise.all([
      supabase
        .from("restaurants")
        .select(
          "id,name,slug,status,phone,address_line_1,city,state,zip,owner_user_id,theme_key,theme_mode,admin_suspended"
        )
        .eq("id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_branding")
        .select("restaurant_id,tagline,primary_color,secondary_color")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_website_settings")
        .select("restaurant_id,hero_headline,about_title,about_body,published,logo_url,hero_image_url,hero_video_url")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_ordering")
        .select("restaurant_id,online_ordering_url,catering_email")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_menu_categories")
        .select("id")
        .eq("restaurant_id", id)
        .eq("active", true),

      supabase
        .from("restaurant_menu_items")
        .select("id")
        .eq("restaurant_id", id)
        .eq("available", true),

      supabase
        .from("restaurant_vip_members")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_vip_offers")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_subscriptions")
        .select("status,trial_ends_at,provider_customer_id,provider_subscription_id")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_domains")
        .select(
          "normalized_domain,dns_status,ssl_status,verification_status,provider,is_primary"
        )
        .eq("restaurant_id", id)
        .eq("is_primary", true)
        .maybeSingle(),
    ]);

    if (restaurantResult.error || !restaurantResult.data) {
      setMessage(
        restaurantResult.error?.message ||
          "Restaurant could not be loaded for QA."
      );
      setLoading(false);
      return;
    }

    const restaurant = restaurantResult.data;

    if (restaurant.owner_user_id !== session.user.id) {
      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("user_id,active")
        .eq("user_id", session.user.id)
        .eq("active", true)
        .maybeSingle();

      if (!adminRow) {
        setMessage("Restaurant access denied.");
        setLoading(false);
        return;
      }
    }

    setRestaurantName(restaurant.name || "Restaurant");

    const branding = brandingResult.data;
    const website = websiteResult.data;
    const ordering = orderingResult.data;
    const subscription = subscriptionResult.data;
    const domain = domainResult.data;

    const profileComplete = Boolean(
      restaurant.name &&
        restaurant.phone &&
        restaurant.address_line_1 &&
        restaurant.city &&
        restaurant.state &&
        restaurant.zip
    );

    const brandingComplete = Boolean(
      branding?.tagline &&
        branding?.primary_color &&
        branding?.secondary_color
    );

    const websiteComplete = Boolean(
      website?.hero_headline &&
        website?.about_title &&
        website?.about_body
    );

    const menuReady =
      (menuCategoriesResult.data?.length || 0) > 0 &&
      (menuItemsResult.data?.length || 0) > 0;

    const orderingReady = Boolean(ordering?.online_ordering_url);

    const publicPublished = Boolean(website?.published && restaurant.slug);

    const accessReady = Boolean(
      subscription &&
        (subscription.status === "active" ||
          (subscription.status === "trial" &&
            (!subscription.trial_ends_at ||
              new Date(subscription.trial_ends_at).getTime() > Date.now())))
    );

    const stripeLiveReady = Boolean(
      subscription?.status === "active" &&
        subscription?.provider_customer_id &&
        subscription?.provider_subscription_id
    );

    const domainPrepared = Boolean(domain?.normalized_domain);

    const domainLiveReady = Boolean(
      domain?.verification_status === "verified" &&
        domain?.dns_status === "configured" &&
        domain?.ssl_status === "active"
    );

    const themeReady = Boolean(
      restaurant.theme_key &&
        (restaurant.theme_mode === "template" || restaurant.theme_mode === "custom")
    );

    const restaurantOperational = Boolean(
      restaurant.status === "active" && !restaurant.admin_suspended
    );

    const nextChecks: Check[] = [
      {
        key: "owner",
        label: "Owner Account Isolation",
        detail: `${restaurant.name} is correctly loaded under this owner account.`,
        pass: true,
      },
      {
        key: "restaurant-status",
        label: "Restaurant Account Status",
        detail: restaurantOperational
          ? "Restaurant account is ACTIVE and not administratively suspended."
          : `Restaurant status is ${String(restaurant.status || "unknown").toUpperCase()}${
              restaurant.admin_suspended ? " and ADMIN SUSPENDED" : ""
            }.`,
        pass: restaurantOperational,
        action: "OPEN ADMIN",
        href: "/admin/restaurant",
      },
      {
        key: "theme",
        label: "Website Theme",
        detail: themeReady
          ? `${restaurant.theme_key} is configured in ${restaurant.theme_mode} mode.`
          : "Website theme or valid theme mode is missing.",
        pass: themeReady,
        action: "FIX THEME",
        href: "/owner/website",
      },
      {
        key: "profile",
        label: "Restaurant Profile",
        detail: profileComplete
          ? "Name, phone and full address are complete."
          : "Business profile still has missing required information.",
        pass: profileComplete,
        action: "FIX PROFILE",
        href: "/owner/profile",
      },
      {
        key: "branding",
        label: "Branding",
        detail: brandingComplete
          ? "Tagline and restaurant colors are configured."
          : "Branding setup is incomplete.",
        pass: brandingComplete,
        action: "FIX BRANDING",
        href: "/owner/settings",
      },
      {
        key: "website",
        label: "Website Content",
        detail: websiteComplete
          ? "Hero and story content are configured."
          : "Website content still needs setup.",
        pass: websiteComplete,
        action: "FIX WEBSITE",
        href: "/owner/website",
      },
      {
        key: "menu",
        label: "Live Menu",
        detail: menuReady
          ? `${menuCategoriesResult.data?.length || 0} active categories and ${
              menuItemsResult.data?.length || 0
            } available items found.`
          : "No complete live menu was found.",
        pass: menuReady,
        action: "FIX MENU",
        href: "/owner/menu",
      },
      {
        key: "ordering",
        label: "Online Ordering",
        detail: orderingReady
          ? "Online ordering link is connected."
          : "Online ordering URL is missing.",
        pass: orderingReady,
        action: "FIX ORDERING",
        href: "/owner/settings",
      },
      {
        key: "published",
        label: "Public Website",
        detail: publicPublished
          ? `Public site is published at /r/${restaurant.slug}.`
          : "Public website is still in draft.",
        pass: publicPublished,
        action: "PUBLISH SITE",
        href: "/owner/website",
      },
      {
        key: "access",
        label: "Subscription Access",
        detail: accessReady
          ? `Account access is ${String(subscription?.status || "").toUpperCase()}.`
          : "Subscription access is not currently valid.",
        pass: accessReady,
        action: "CHECK BILLING",
        href: "/owner/billing",
      },
      {
        key: "stripe",
        label: "Stripe Production Loop",
        detail: stripeLiveReady
          ? "Real Stripe customer and subscription are active."
          : "Live paid Stripe subscription has not been fully proven yet.",
        pass: stripeLiveReady,
        action: "TEST BILLING",
        href: "/owner/billing",
      },
      {
        key: "domain",
        label: "Custom Domain Staged",
        detail: domainPrepared
          ? `${domain?.normalized_domain} is staged in Restaurant OS.`
          : "No custom domain staged — optional; Restaurant OS slug URL can launch without one.",
        pass: true,
      },
      {
        key: "domain-live",
        label: "Custom Domain Live",
        detail: domainLiveReady
          ? `${domain?.normalized_domain} is verified with DNS + SSL active.`
          : "Custom domain is not fully cut over yet.",
        pass: domainPrepared ? domainLiveReady : true,
      },
      {
        key: "growth",
        label: "Growth Engine",
        detail: `${vipResult.count || 0} VIPs · ${offersResult.count || 0} offers · ${
          campaignsResult.count || 0
        } campaigns`,
        pass: true,
      },
    ];

    setChecks(nextChecks);
    setLoading(false);
  }

  function go(href?: string) {
    if (!href || !restaurantId) return;
    window.location.href = `${href}?restaurant=${restaurantId}`;
  }

  const passed = useMemo(
    () => checks.filter((check) => check.pass).length,
    [checks]
  );

  const failed = checks.length - passed;

  const percent =
    checks.length === 0 ? 0 : Math.round((passed / checks.length) * 100);

  const launchCriticalKeys = new Set([
    "owner",
    "restaurant-status",
    "profile",
    "theme",
    "website",
    "menu",
    "published",
    "access",
    "stripe",
  ]);

  const criticalFailures = checks.filter(
    (check) => launchCriticalKeys.has(check.key) && !check.pass
  );

  const founderReady = criticalFailures.length === 0;

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Running Restaurant OS launch checks...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS · SYSTEM CHECK</div>
            <h1 style={titleStyle}>System Readiness</h1>
            <p style={subStyle}>
              {restaurantName} — one screen to verify the SaaS-critical systems before launch.
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

        <section
          style={{
            ...heroStyle,
            borderColor: founderReady ? "#22c55e" : "#f59e0b",
          }}
        >
          <div>
            <div style={eyebrowStyle}>OVERALL STATUS</div>
            <div style={scoreStyle}>{percent}%</div>
            <div style={scoreMetaStyle}>
              {passed} PASSED · {failed} NEED ATTENTION
            </div>
          </div>

          <div
            style={{
              ...launchBadgeStyle,
              color: founderReady ? "#86efac" : "#fcd34d",
              borderColor: founderReady ? "#22c55e" : "#f59e0b",
            }}
          >
            {founderReady
              ? "FOUNDER LAUNCH READY"
              : `${criticalFailures.length} LAUNCH-CRITICAL ITEM${
                  criticalFailures.length === 1 ? "" : "S"
                } LEFT`}
          </div>
        </section>

        <section style={checkGridStyle}>
          {checks.map((check) => (
            <article
              key={check.key}
              style={{
                ...checkCardStyle,
                borderColor: check.pass ? "#1f5f45" : "#6b3f16",
              }}
            >
              <div style={checkTopStyle}>
                <div
                  style={{
                    ...dotStyle,
                    background: check.pass ? "#22c55e" : "#f59e0b",
                  }}
                />
                <div style={checkStatusStyle}>
                  {check.pass ? "PASS" : "NEEDS ATTENTION"}
                </div>
              </div>

              <h2 style={checkTitleStyle}>{check.label}</h2>
              <p style={checkTextStyle}>{check.detail}</p>

              {!check.pass && check.action && check.href && (
                <button
                  style={fixButtonStyle}
                  onClick={() => go(check.href)}
                >
                  {check.action}
                </button>
              )}
            </article>
          ))}
        </section>

        <section style={finalCardStyle}>
          <div>
            <div style={eyebrowStyle}>NEXT LAUNCH MOVE</div>
            <h2 style={finalTitleStyle}>
              {founderReady
                ? "Open the Founder Battlefield Test"
                : "Finish Only the Red-Line Items"}
            </h2>
            <p style={subStyle}>
              {founderReady
                ? "The core SaaS loop is proven. Start with a small founder cohort, watch real usage, and fix anything that breaks before scaling."
                : "Do not add more features. Clear the remaining launch-critical checks, then begin the controlled founder rollout."}
            </p>
          </div>

          <button
            style={rerunButtonStyle}
            onClick={runChecks}
          >
            RUN CHECKS AGAIN
          </button>
        </section>
      </div>
    </main>
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
  fontSize: "clamp(46px,7vw,78px)",
  lineHeight: ".92",
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
  background: "#3a1d1d",
  border: "1px solid #7f1d1d",
  color: "#fecaca",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
};

const heroStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
  background: "#0f1d2e",
  border: "2px solid",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "18px",
};

const scoreStyle = {
  fontSize: "56px",
  fontWeight: 900,
  lineHeight: 1,
  marginTop: "6px",
};

const scoreMetaStyle = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: 900,
  marginTop: "7px",
};

const launchBadgeStyle = {
  background: "#08111f",
  border: "1px solid",
  borderRadius: "999px",
  padding: "12px 16px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const checkGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: "14px",
};

const checkCardStyle = {
  background: "#0f1d2e",
  border: "1px solid",
  borderRadius: "15px",
  padding: "18px",
};

const checkTopStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const dotStyle = {
  width: 9,
  height: 9,
  borderRadius: 999,
};

const checkStatusStyle = {
  color: "#94a3b8",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const checkTitleStyle = {
  margin: "10px 0 7px",
  fontSize: "22px",
};

const checkTextStyle = {
  minHeight: "44px",
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const fixButtonStyle = {
  width: "100%",
  marginTop: "10px",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "9px",
  padding: "11px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const finalCardStyle = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
  background: "#10253a",
  border: "1px solid #36516c",
  borderRadius: "16px",
  padding: "22px",
};

const finalTitleStyle = {
  margin: "6px 0 7px",
  fontSize: "30px",
};

const rerunButtonStyle = {
  background: "#22c55e",
  color: "#052e16",
  border: 0,
  borderRadius: "10px",
  padding: "14px 18px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};
