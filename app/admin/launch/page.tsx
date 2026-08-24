"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  admin_suspended?: boolean | null;
};

type Check = {
  label: string;
  pass: boolean;
  detail: string;
  path?: string;
};

type ManualKey =
  | "mobilePublic"
  | "mobileOwner"
  | "passwordReset"
  | "checkout"
  | "domain"
  | "cleanup";

const MANUAL_LABELS: Record<ManualKey, string> = {
  mobilePublic: "Public website checked on mobile",
  mobileOwner: "Owner Command Center checked on mobile",
  passwordReset: "Forgot password / reset flow tested",
  checkout: "$375 checkout tested successfully",
  domain: "Fresh custom domain tested",
  cleanup: "Test / junk production data cleaned",
};

export default function AdminLaunchPage() {
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState<Record<ManualKey, boolean>>({
    mobilePublic: false,
    mobileOwner: false,
    passwordReset: false,
    checkout: false,
    domain: false,
    cleanup: false,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant");

    if (!id) {
      setMessage("Open this page with ?restaurant=<restaurant-id>.");
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

    const { data: admin } = await supabase
      .from("platform_admins")
      .select("user_id,active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (!admin) {
      setMessage("Super Admin access required.");
      setLoading(false);
      return;
    }

    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name,slug,status,admin_suspended")
      .eq("id", id)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData as Restaurant);

    const [
      websiteResult,
      menuResult,
      subscriptionResult,
      domainResult,
      brandingResult,
      hoursResult,
      orderingResult,
      growthResult,
    ] = await Promise.all([
      supabase
        .from("restaurant_website_settings")
        .select("published,hero_headline,about_body")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_menu_items")
        .select("id")
        .eq("restaurant_id", id)
        .limit(1),

      supabase
        .from("restaurant_subscriptions")
        .select(
          "plan,status,provider,provider_customer_id,provider_subscription_id"
        )
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_domains")
        .select("*")
        .eq("restaurant_id", id)
        .limit(1),

      supabase
        .from("restaurant_branding")
        .select("primary_color,secondary_color,tagline,short_description")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_hours")
        .select("*")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_ordering")
        .select("*")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_growth_settings")
        .select("*")
        .eq("restaurant_id", id)
        .maybeSingle(),
    ]);

    const website = websiteResult.data;
    const subscription = subscriptionResult.data as any;
    const branding = brandingResult.data;
    const hours = hoursResult.data;

    const hoursPresent = Boolean(
      hours &&
        [
          hours.monday,
          hours.tuesday,
          hours.wednesday,
          hours.thursday,
          hours.friday,
          hours.saturday,
          hours.sunday,
        ].some(Boolean)
    );

    const nextChecks: Check[] = [
      {
        label: "Restaurant Active",
        pass:
          restaurantData.status === "active" &&
          !restaurantData.admin_suspended,
        detail:
          restaurantData.status === "active" &&
          !restaurantData.admin_suspended
            ? "Restaurant is active and not suspended."
            : `Status: ${restaurantData.status}. Suspended: ${
                restaurantData.admin_suspended ? "YES" : "NO"
              }.`,
        path: `/admin/restaurant?restaurant=${id}`,
      },
      {
        label: "Public Website Published",
        pass: Boolean(website?.published),
        detail: website?.published
          ? "Website publish flag is LIVE."
          : "Website is still draft.",
        path: `/owner/website?restaurant=${id}`,
      },
      {
        label: "Public Site Route",
        pass: Boolean(restaurantData.slug),
        detail: restaurantData.slug
          ? `/r/${restaurantData.slug}`
          : "Restaurant slug missing.",
        path: restaurantData.slug ? `/r/${restaurantData.slug}` : undefined,
      },
      {
        label: "Website Content",
        pass: Boolean(website?.hero_headline && website?.about_body),
        detail:
          website?.hero_headline && website?.about_body
            ? "Hero and about content are present."
            : "Website content is incomplete.",
        path: `/owner/website?restaurant=${id}`,
      },
      {
        label: "Menu Ready",
        pass: Boolean(menuResult.data?.length),
        detail: menuResult.data?.length
          ? "At least one menu item exists."
          : "Menu is empty.",
        path: `/owner/menu?restaurant=${id}`,
      },
      {
        label: "Branding Ready",
        pass: Boolean(
          branding?.primary_color &&
            branding?.secondary_color &&
            (branding?.tagline || branding?.short_description)
        ),
        detail: branding
          ? "Branding row exists."
          : "Branding row missing.",
        path: `/owner/settings?restaurant=${id}`,
      },
      {
        label: "Hours Ready",
        pass: hoursPresent,
        detail: hoursPresent
          ? "Restaurant hours are present."
          : "Restaurant hours are incomplete.",
        path: `/owner/settings?restaurant=${id}`,
      },
      {
        label: "Ordering Settings",
        pass: Boolean(orderingResult.data),
        detail: orderingResult.data
          ? "Ordering settings row exists."
          : "Ordering settings row missing.",
        path: `/owner/settings?restaurant=${id}`,
      },
      {
        label: "Growth Settings",
        pass: Boolean(growthResult.data),
        detail: growthResult.data
          ? "Growth settings row exists."
          : "Growth settings row missing.",
        path: `/owner/settings?restaurant=${id}`,
      },
      {
        label: "$375 Restaurant OS Plan",
        pass: Boolean(
          subscription &&
            subscription.plan === "restaurant_os" &&
            ["active", "trial"].includes(subscription.status)
        ),
        detail: subscription
          ? `Plan: ${subscription.plan} · Status: ${subscription.status}.`
          : "No subscription row found.",
        path: `/owner/billing?restaurant=${id}`,
      },
      {
        label: "Stripe Connection",
        pass: Boolean(
          subscription?.provider_customer_id &&
            subscription?.provider_subscription_id
        ),
        detail:
          subscription?.provider_customer_id &&
          subscription?.provider_subscription_id
            ? "Stripe customer + subscription IDs are present."
            : "Stripe IDs not fully connected yet.",
        path: `/owner/billing?restaurant=${id}`,
      },
      {
        label: "Custom Domain Row",
        pass: Boolean(domainResult.data?.length),
        detail: domainResult.data?.length
          ? "Custom domain row exists."
          : "No custom domain row found.",
        path: `/admin/restaurant/domain?restaurant=${id}`,
      },
    ];

    setChecks(nextChecks);

    const saved = window.localStorage.getItem(
      `restaurant-os-launch-manual-${id}`
    );

    if (saved) {
      try {
        setManual({
          mobilePublic: false,
          mobileOwner: false,
          passwordReset: false,
          checkout: false,
          domain: false,
          cleanup: false,
          ...JSON.parse(saved),
        });
      } catch {}
    }

    setLoading(false);
  }

  function toggleManual(key: ManualKey) {
    setManual((current) => {
      const next = { ...current, [key]: !current[key] };
      window.localStorage.setItem(
        `restaurant-os-launch-manual-${restaurantId}`,
        JSON.stringify(next)
      );
      return next;
    });
  }

  const automatedPass = checks.filter((check) => check.pass).length;
  const manualPass = Object.values(manual).filter(Boolean).length;
  const automatedPercent = checks.length
    ? Math.round((automatedPass / checks.length) * 100)
    : 0;
  const manualPercent = Math.round(
    (manualPass / Object.keys(manual).length) * 100
  );

  const launchReady =
    checks.length > 0 &&
    automatedPass === checks.length &&
    manualPass === Object.keys(manual).length;

  const failedChecks = useMemo(
    () => checks.filter((check) => !check.pass),
    [checks]
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Running final launch certification...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS · FINAL BUILD</div>
            <h1 style={titleStyle}>FOUNDERS LAUNCH GATE</h1>
            <p style={subStyle}>
              Automated production checks + final human battlefield checks.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/admin/restaurant?restaurant=${restaurantId}`)
            }
          >
            BACK TO ADMIN
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        {restaurant && (
          <section style={restaurantStyle}>
            <div>
              <div style={restaurantNameStyle}>{restaurant.name}</div>
              <div style={restaurantMetaStyle}>
                {restaurant.slug || "NO SLUG"} · {restaurant.status.toUpperCase()}
              </div>
            </div>

            <div
              style={{
                ...readyBadgeStyle,
                borderColor: launchReady ? "#22c55e" : "#e1222d",
                color: launchReady ? "#8ef0b5" : "#ff8e95",
              }}
            >
              {launchReady ? "CLEARED FOR FOUNDERS LAUNCH" : "NOT CLEARED YET"}
            </div>
          </section>
        )}

        <section style={scoreGridStyle}>
          <ScoreCard
            label="AUTOMATED SYSTEM"
            value={`${automatedPercent}%`}
            sub={`${automatedPass}/${checks.length} checks passing`}
            good={automatedPass === checks.length}
          />
          <ScoreCard
            label="MANUAL BATTLEFIELD"
            value={`${manualPercent}%`}
            sub={`${manualPass}/${Object.keys(manual).length} checks complete`}
            good={manualPass === Object.keys(manual).length}
          />
          <ScoreCard
            label="FAILED CHECKS"
            value={failedChecks.length}
            sub={failedChecks.length ? "Fix before launch" : "Zero blockers"}
            good={failedChecks.length === 0}
          />
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadStyle}>
            <div>
              <div style={eyebrowStyle}>AUTOMATED PRODUCTION CHECKS</div>
              <h2 style={sectionTitleStyle}>SYSTEM HEALTH</h2>
            </div>

            <button style={primaryButtonStyle} onClick={load}>
              RUN CHECKS AGAIN
            </button>
          </div>

          <div style={checkGridStyle}>
            {checks.map((check) => (
              <button
                key={check.label}
                style={{
                  ...checkStyle,
                  borderColor: check.pass ? "#245e42" : "#5d262a",
                  background: check.pass ? "#0d2117" : "#1b0c0d",
                }}
                onClick={() => {
                  if (check.path) window.location.href = check.path;
                }}
              >
                <div style={checkTopStyle}>
                  <span
                    style={{
                      ...dotStyle,
                      background: check.pass ? "#22c55e" : "#e1222d",
                    }}
                  >
                    {check.pass ? "✓" : "!"}
                  </span>
                  <strong>{check.label}</strong>
                </div>

                <span style={detailStyle}>{check.detail}</span>

                {check.path && (
                  <span style={openStyle}>
                    {check.pass ? "OPEN" : "FIX THIS"} →
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadStyle}>
            <div>
              <div style={eyebrowStyle}>FINAL HUMAN QA</div>
              <h2 style={sectionTitleStyle}>BATTLEFIELD CHECKLIST</h2>
            </div>
          </div>

          <div style={manualGridStyle}>
            {(Object.keys(MANUAL_LABELS) as ManualKey[]).map((key) => (
              <button
                key={key}
                style={{
                  ...manualStyle,
                  borderColor: manual[key] ? "#245e42" : "#303030",
                  background: manual[key] ? "#0d2117" : "#0d0d0d",
                }}
                onClick={() => toggleManual(key)}
              >
                <span
                  style={{
                    ...manualBoxStyle,
                    background: manual[key] ? "#22c55e" : "#171717",
                    borderColor: manual[key] ? "#22c55e" : "#444444",
                  }}
                >
                  {manual[key] ? "✓" : ""}
                </span>
                <span>{MANUAL_LABELS[key]}</span>
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            ...finalStyle,
            borderColor: launchReady ? "#266b49" : "#76282e",
            background: launchReady
              ? "linear-gradient(135deg,#102b20,#09130e)"
              : "linear-gradient(135deg,#210d0f,#0c0c0c)",
          }}
        >
          <div>
            <div
              style={{
                ...eyebrowStyle,
                color: launchReady ? "#8ef0b5" : "#ff858d",
              }}
            >
              FINAL VERDICT
            </div>

            <div style={verdictStyle}>
              {launchReady
                ? "RESTAURANT OS IS CLEARED FOR FOUNDERS LAUNCH."
                : "FINISH THE RED ITEMS. THEN LAUNCH."}
            </div>

            <p style={finalTextStyle}>
              {launchReady
                ? "Core SaaS, billing, website, owner command center and launch QA are all cleared."
                : `${failedChecks.length} automated blocker${
                    failedChecks.length === 1 ? "" : "s"
                  } and ${
                    Object.keys(manual).length - manualPass
                  } manual check${
                    Object.keys(manual).length - manualPass === 1 ? "" : "s"
                  } remain.`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  good,
}: {
  label: string;
  value: string | number;
  sub: string;
  good: boolean;
}) {
  return (
    <div
      style={{
        ...scoreCardStyle,
        borderColor: good ? "#245e42" : "#4a2528",
      }}
    >
      <div style={eyebrowStyle}>{label}</div>
      <div style={scoreValueStyle}>{value}</div>
      <div style={scoreSubStyle}>{sub}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 90% 0%, rgba(225,34,45,.12), transparent 25%), #050505",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1380px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap" as const,
  marginBottom: "22px",
};

const eyebrowStyle = {
  color: "#e1222d",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.8px",
};

const titleStyle = {
  margin: "7px 0 6px",
  fontSize: "clamp(48px,6vw,76px)",
  lineHeight: 0.9,
  letterSpacing: "-4px",
  fontWeight: 900,
};

const subStyle = {
  color: "#777777",
  fontSize: "13px",
};

const secondaryButtonStyle = {
  border: "1px solid #303030",
  borderRadius: "8px",
  background: "#111111",
  color: "#ffffff",
  padding: "11px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const primaryButtonStyle = {
  border: 0,
  borderRadius: "8px",
  background: "#e1222d",
  color: "#ffffff",
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  padding: "12px",
  marginBottom: "14px",
  border: "1px solid #5a282c",
  borderRadius: "10px",
  background: "#180b0c",
  color: "#ff979d",
};

const restaurantStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  padding: "18px",
  border: "1px solid #252525",
  borderRadius: "14px",
  background: "#0c0c0c",
};

const restaurantNameStyle = {
  fontSize: "26px",
  fontWeight: 900,
};

const restaurantMetaStyle = {
  marginTop: "4px",
  color: "#777777",
  fontSize: "9px",
  fontWeight: 900,
};

const readyBadgeStyle = {
  border: "1px solid",
  borderRadius: "999px",
  padding: "9px 12px",
  fontSize: "9px",
  fontWeight: 900,
};

const scoreGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: "10px",
  marginTop: "14px",
};

const scoreCardStyle = {
  border: "1px solid",
  borderRadius: "13px",
  padding: "18px",
  background: "#0c0c0c",
};

const scoreValueStyle = {
  marginTop: "11px",
  fontSize: "40px",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const scoreSubStyle = {
  marginTop: "5px",
  color: "#737373",
  fontSize: "9px",
};

const sectionStyle = {
  marginTop: "30px",
};

const sectionHeadStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "end",
  flexWrap: "wrap" as const,
  marginBottom: "12px",
};

const sectionTitleStyle = {
  margin: "5px 0 0",
  fontSize: "28px",
  letterSpacing: "-1px",
};

const checkGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: "9px",
};

const checkStyle = {
  minHeight: "145px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "stretch",
  textAlign: "left" as const,
  padding: "15px",
  border: "1px solid",
  borderRadius: "11px",
  color: "#ffffff",
  cursor: "pointer",
};

const checkTopStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const dotStyle = {
  width: "25px",
  height: "25px",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 900,
  flexShrink: 0,
};

const detailStyle = {
  marginTop: "12px",
  color: "#888888",
  fontSize: "9px",
  lineHeight: 1.45,
};

const openStyle = {
  marginTop: "auto",
  paddingTop: "12px",
  color: "#ff747c",
  fontSize: "8px",
  fontWeight: 900,
};

const manualGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "8px",
};

const manualStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid",
  borderRadius: "10px",
  padding: "13px",
  color: "#ffffff",
  textAlign: "left" as const,
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 800,
};

const manualBoxStyle = {
  width: "24px",
  height: "24px",
  display: "grid",
  placeItems: "center",
  border: "1px solid",
  borderRadius: "6px",
  flexShrink: 0,
  color: "#052e16",
  fontWeight: 900,
};

const finalStyle = {
  marginTop: "26px",
  padding: "24px",
  border: "1px solid",
  borderRadius: "16px",
};

const verdictStyle = {
  marginTop: "7px",
  fontSize: "clamp(30px,4vw,48px)",
  lineHeight: 1,
  letterSpacing: "-2px",
  fontWeight: 900,
};

const finalTextStyle = {
  margin: "10px 0 0",
  color: "#8c8c8c",
  fontSize: "11px",
  lineHeight: 1.5,
};
