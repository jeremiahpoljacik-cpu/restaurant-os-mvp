"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Check = {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  action: string;
  path: string;
};

export default function OwnerSetupPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
      window.location.href = "/login";
      return;
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name,phone,address_line_1,city,state,zip")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);

    const [
      brandingResult,
      hoursResult,
      orderingResult,
      growthResult,
      websiteResult,
      menuResult,
      subscriptionResult,
    ] = await Promise.all([
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
        .select("online_ordering_url,catering_email")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_growth_settings")
        .select("vip_club_name,signup_offer")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_website_settings")
        .select("hero_headline,about_body,published")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_menu_items")
        .select("id")
        .eq("restaurant_id", id)
        .limit(1),

      supabase
        .from("restaurant_subscriptions")
        .select("status,trial_ends_at")
        .eq("restaurant_id", id)
        .maybeSingle(),
    ]);

    const businessComplete = Boolean(
      restaurant.phone &&
        restaurant.address_line_1 &&
        restaurant.city &&
        restaurant.state &&
        restaurant.zip
    );

    const branding = brandingResult.data;
    const brandingComplete = Boolean(
      branding?.primary_color &&
        branding?.secondary_color &&
        (branding?.tagline || branding?.short_description)
    );

    const hours = hoursResult.data;
    const hoursComplete = Boolean(
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

    const ordering = orderingResult.data;
    const orderingComplete = Boolean(
      ordering?.online_ordering_url || ordering?.catering_email
    );

    const growth = growthResult.data;
    const growthComplete = Boolean(
      growth?.vip_club_name || growth?.signup_offer
    );

    const website = websiteResult.data;
    const websiteComplete = Boolean(
      website?.hero_headline && website?.about_body
    );

    const menuComplete = Boolean(menuResult.data?.length);

    const subscription = subscriptionResult.data;
    const subscriptionComplete = Boolean(
      subscription &&
        (subscription.status === "active" ||
          subscription.status === "trial")
    );

    setChecks([
      {
        key: "business",
        label: "Business Profile",
        description: "Phone, address and restaurant contact details.",
        complete: businessComplete,
        action: "EDIT BUSINESS",
        path: "/owner/settings",
      },
      {
        key: "branding",
        label: "Branding",
        description: "Colors, tagline and restaurant identity.",
        complete: brandingComplete,
        action: "EDIT BRANDING",
        path: "/owner/settings",
      },
      {
        key: "hours",
        label: "Hours",
        description: "Restaurant operating hours are entered.",
        complete: hoursComplete,
        action: "SET HOURS",
        path: "/owner/settings",
      },
      {
        key: "menu",
        label: "Menu",
        description: "At least one menu item has been added.",
        complete: menuComplete,
        action: "BUILD MENU",
        path: "/owner/menu",
      },
      {
        key: "website",
        label: "Website Content",
        description: "Hero and restaurant story are ready.",
        complete: websiteComplete,
        action: "MANAGE SITE",
        path: "/owner/website",
      },
      {
        key: "ordering",
        label: "Ordering / Catering",
        description: "Ordering or catering destination is connected.",
        complete: orderingComplete,
        action: "ADD ORDERING",
        path: "/owner/settings",
      },
      {
        key: "vip",
        label: "VIP Growth",
        description: "VIP club or signup offer is configured.",
        complete: growthComplete,
        action: "SETUP VIP",
        path: "/owner/settings",
      },
      {
        key: "billing",
        label: "Subscription Access",
        description: "Restaurant OS trial or paid subscription is active.",
        complete: subscriptionComplete,
        action: "VIEW BILLING",
        path: "/owner/billing",
      },
      {
        key: "publish",
        label: "Publish Website",
        description: "Public restaurant website is live.",
        complete: Boolean(website?.published),
        action: "PUBLISH SITE",
        path: "/owner/website",
      },
    ]);

    setLoading(false);
  }

  const completeCount = useMemo(
    () => checks.filter((check) => check.complete).length,
    [checks]
  );

  const percent = checks.length
    ? Math.round((completeCount / checks.length) * 100)
    : 0;

  const ready = checks.length > 0 && completeCount === checks.length;

  function go(path: string) {
    window.location.href = `${path}?restaurant=${restaurantId}`;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading setup status...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Launch Checklist</h1>
            <p style={subStyle}>
              {restaurantName} — finish the essentials and get the restaurant ready to operate.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => go("/owner")}
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={progressCardStyle}>
          <div style={progressTopStyle}>
            <div>
              <div style={eyebrowStyle}>SETUP PROGRESS</div>
              <div style={progressValueStyle}>{percent}%</div>
            </div>

            <div
              style={{
                ...statusBadgeStyle,
                background: ready ? "#12351f" : "#3b2d08",
                color: ready ? "#86efac" : "#fde68a",
              }}
            >
              {ready ? "READY TO OPERATE" : `${completeCount}/${checks.length} COMPLETE`}
            </div>
          </div>

          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressBarStyle,
                width: `${percent}%`,
              }}
            />
          </div>
        </section>

        <section style={checkListStyle}>
          {checks.map((check, index) => (
            <article key={check.key} style={checkCardStyle}>
              <div style={numberStyle}>
                {String(index + 1).padStart(2, "0")}
              </div>

              <div style={checkBodyStyle}>
                <div style={checkTopStyle}>
                  <div>
                    <h2 style={checkTitleStyle}>{check.label}</h2>
                    <p style={checkTextStyle}>{check.description}</p>
                  </div>

                  <div
                    style={{
                      ...checkBadgeStyle,
                      background: check.complete ? "#12351f" : "#261f10",
                      color: check.complete ? "#86efac" : "#fde68a",
                    }}
                  >
                    {check.complete ? "✓ COMPLETE" : "NEEDS ATTENTION"}
                  </div>
                </div>

                {!check.complete && (
                  <button
                    style={primaryButtonStyle}
                    onClick={() => go(check.path)}
                  >
                    {check.action}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>

        {ready && (
          <section style={readyCardStyle}>
            <div style={eyebrowStyle}>READY</div>
            <h2 style={readyTitleStyle}>Restaurant OS setup is complete.</h2>
            <p style={readyTextStyle}>
              The core restaurant profile, website, menu, growth tools and access are configured.
            </p>

            <button
              style={primaryButtonStyle}
              onClick={() => go("/owner")}
            >
              OPEN OWNER COMMAND CENTER
            </button>
          </section>
        )}
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
  maxWidth: "1080px",
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
  fontSize: "clamp(44px,7vw,76px)",
  lineHeight: ".94",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
  maxWidth: "760px",
};

const progressCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "18px",
};

const progressTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const progressValueStyle = {
  fontSize: "54px",
  fontWeight: 900,
  marginTop: "5px",
};

const statusBadgeStyle = {
  borderRadius: "999px",
  padding: "10px 14px",
  fontSize: "10px",
  fontWeight: 900,
};

const progressTrackStyle = {
  marginTop: "18px",
  height: "12px",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressBarStyle = {
  height: "100%",
  background: "#f5b82e",
  borderRadius: "999px",
};

const checkListStyle = {
  display: "grid",
  gap: "12px",
};

const checkCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "20px",
  display: "grid",
  gridTemplateColumns: "54px 1fr",
  gap: "18px",
};

const numberStyle = {
  color: "#f5b82e",
  fontSize: "20px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const checkBodyStyle = {
  minWidth: 0,
};

const checkTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap" as const,
};

const checkTitleStyle = {
  fontSize: "22px",
  margin: 0,
};

const checkTextStyle = {
  color: "#94a3b8",
  margin: "6px 0 14px",
  lineHeight: 1.5,
};

const checkBadgeStyle = {
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "9px",
  fontWeight: 900,
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "11px 14px",
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

const readyCardStyle = {
  background: "#12351f",
  border: "1px solid #245b35",
  borderRadius: "18px",
  padding: "26px",
  marginTop: "18px",
};

const readyTitleStyle = {
  fontSize: "30px",
  margin: "7px 0 10px",
};

const readyTextStyle = {
  color: "#bbf7d0",
  lineHeight: 1.5,
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};
