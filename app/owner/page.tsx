"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  cuisine_category: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
};

export default function OwnerDashboardPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [setupPercent, setSetupPercent] = useState(0);
  const [setupReady, setSetupReady] = useState(false);
  const [restaurantCount, setRestaurantCount] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
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

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      setMessage(error?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurant(data);

    const { count: ownerRestaurantCount } = await supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id);

    setRestaurantCount(ownerRestaurantCount || 1);

    const [
      brandingResult,
      hoursResult,
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
      data.phone &&
        data.address_line_1 &&
        data.city &&
        data.state &&
        data.zip
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

    const website = websiteResult.data;
    const websiteComplete = Boolean(
      website?.hero_headline && website?.about_body
    );

    const menuComplete = Boolean(menuResult.data?.length);

    const subscription = subscriptionResult.data;
    const subscriptionComplete = Boolean(
      subscription &&
        (subscription.status === "active" ||
          (subscription.status === "trial" &&
            (!subscription.trial_ends_at ||
              new Date(subscription.trial_ends_at).getTime() > Date.now())))
    );

    const checks = [
      businessComplete,
      brandingComplete,
      hoursComplete,
      websiteComplete,
      menuComplete,
      subscriptionComplete,
      Boolean(website?.published),
    ];

    const completeCount = checks.filter(Boolean).length;
    const percent = Math.round((completeCount / checks.length) * 100);

    setSetupPercent(percent);
    setSetupReady(completeCount === checks.length);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function go(path: string) {
    window.location.href = `${path}?restaurant=${restaurantId}`;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading owner command center...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>{message || "Restaurant not found."}</div>
      </main>
    );
  }

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Owner Command Center</h1>
            <p style={subStyle}>
              Run the restaurant website, menu, VIP growth and campaign engine from one place.
            </p>
          </div>

          <div style={headerButtonGroupStyle}>
            {restaurantCount > 1 && (
              <button
                style={secondaryButtonStyle}
                onClick={() => {
                  window.location.href = "/owner/restaurants";
                }}
              >
                SWITCH RESTAURANT
              </button>
            )}

            <button
              style={secondaryButtonStyle}
              onClick={() => go("/owner/qa")}
            >
              SYSTEM CHECK
            </button>

            <button style={secondaryButtonStyle} onClick={signOut}>
              SIGN OUT
            </button>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={restaurantPanelStyle}>
          <div>
            <div style={restaurantNameStyle}>{restaurant.name}</div>
            <div style={restaurantMetaStyle}>
              {restaurant.cuisine_category || "RESTAURANT"}
            </div>
          </div>

          <div style={restaurantDetailsStyle}>
            {restaurant.phone && <span>{restaurant.phone}</span>}
            {address && <span>{address}</span>}
            <span style={statusPillStyle}>
              {restaurant.status.toUpperCase()}
            </span>
          </div>
        </section>

        <section style={launchPanelStyle}>
          <div>
            <div style={eyebrowStyle}>LAUNCH STATUS</div>
            <div style={launchTitleStyle}>
              {setupReady ? "READY TO OPERATE" : `${setupPercent}% COMPLETE`}
            </div>
            <p style={launchTextStyle}>
              {setupReady
                ? "Core Restaurant OS setup is complete."
                : "Finish the remaining setup items before launch."}
            </p>
          </div>

          <div style={launchActionsStyle}>
            <div style={launchProgressTrackStyle}>
              <div
                style={{
                  ...launchProgressBarStyle,
                  width: `${setupPercent}%`,
                }}
              />
            </div>

            <button
              style={setupButtonStyle}
              onClick={() => go("/owner/setup")}
            >
              {setupReady ? "VIEW CHECKLIST" : "CONTINUE SETUP"}
            </button>
          </div>
        </section>

        <section style={sectionHeadingStyle}>
          <div>
            <div style={eyebrowStyle}>CORE OPERATIONS</div>
            <h2 style={sectionTitleStyle}>Manage the Business</h2>
          </div>
        </section>

        <section style={cardGridStyle}>
          <DashboardCard
            kicker="WEBSITE"
            title="Website Manager"
            text="Hero, branding, page visibility and public site controls."
            button="MANAGE SITE"
            onClick={() => go("/owner/website")}
          />

          <DashboardCard
            kicker="MENU"
            title="Menu Manager"
            text="Categories, items, pricing, availability and featured dishes."
            button="MANAGE MENU"
            onClick={() => go("/owner/menu")}
          />

          <DashboardCard
            kicker="VIP CUSTOMERS"
            title="Customer List"
            text="Search VIPs, filter opt-ins, birthdays and export customer data."
            button="VIEW VIPS"
            onClick={() => go("/owner/vip")}
          />

          <DashboardCard
            kicker="OFFERS"
            title="Offer Manager"
            text="Create promotions, expiration rules and customer-facing offers."
            button="CREATE OFFER"
            onClick={() => go("/owner/offers")}
          />

          <DashboardCard
            kicker="ORDERING"
            title="Ordering Settings"
            text="Online ordering, delivery links and catering contact settings."
            button="ORDERING SETTINGS"
            onClick={() => go("/owner/settings")}
          />

          <DashboardCard
            kicker="BUSINESS SETTINGS"
            title="Restaurant Settings"
            text="Business details, hours, branding and restaurant profile."
            button="EDIT SETTINGS"
            onClick={() => go("/owner/settings")}
          />

          <DashboardCard
            kicker="BILLING"
            title="Subscription"
            text="Manage Restaurant OS billing, trial access and payment settings."
            button="MANAGE BILLING"
            onClick={() => go("/owner/billing")}
          />

          <DashboardCard
            kicker="FOUNDER QA"
            title="System Check"
            text="Run automated checks across setup, billing, website, growth tools and attribution."
            button="RUN SYSTEM CHECK"
            onClick={() => go("/owner/qa")}
          />
        </section>

        <section style={growthHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>GROWTH ENGINE</div>
            <h2 style={sectionTitleStyle}>Campaigns & Attribution</h2>
            <p style={growthTextStyle}>
              Build the promotion, send the trackable link, capture the claim and measure the redemption.
            </p>
          </div>
        </section>

        <section style={growthGridStyle}>
          <GrowthCard
            number="01"
            title="Campaigns"
            text="Create campaigns by channel and audience, attach an offer and generate a trackable claim link."
            button="MANAGE CAMPAIGNS"
            onClick={() => go("/owner/campaigns")}
          />

          <GrowthCard
            number="02"
            title="Campaign Results"
            text="See claims, redemptions, unique customers and redemption rate by campaign."
            button="VIEW RESULTS"
            onClick={() => go("/owner/campaign-results")}
          />

          <GrowthCard
            number="03"
            title="Redemption Center"
            text="Enter a customer's unique code and mark the offer redeemed at the restaurant."
            button="REDEEM OFFERS"
            onClick={() => go("/owner/redeem")}
          />
        </section>

        <section style={flowPanelStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS GROWTH LOOP</div>
          <div style={flowStyle}>
            <FlowStep number="1" text="CREATE CAMPAIGN" />
            <FlowArrow />
            <FlowStep number="2" text="ATTACH OFFER" />
            <FlowArrow />
            <FlowStep number="3" text="SEND TRACKABLE LINK" />
            <FlowArrow />
            <FlowStep number="4" text="CUSTOMER CLAIMS" />
            <FlowArrow />
            <FlowStep number="5" text="REDEEM & MEASURE" />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  kicker,
  title,
  text,
  button,
  onClick,
}: {
  kicker: string;
  title: string;
  text: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <article style={cardStyle}>
      <div style={eyebrowStyle}>{kicker}</div>
      <h3 style={cardTitleStyle}>{title}</h3>
      <p style={cardTextStyle}>{text}</p>
      <button style={primaryButtonStyle} onClick={onClick}>
        {button}
      </button>
    </article>
  );
}

function GrowthCard({
  number,
  title,
  text,
  button,
  onClick,
}: {
  number: string;
  title: string;
  text: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <article style={growthCardStyle}>
      <div style={growthNumberStyle}>{number}</div>
      <h3 style={growthCardTitleStyle}>{title}</h3>
      <p style={cardTextStyle}>{text}</p>
      <button style={growthButtonStyle} onClick={onClick}>
        {button}
      </button>
    </article>
  );
}

function FlowStep({ number, text }: { number: string; text: string }) {
  return (
    <div style={flowStepStyle}>
      <span style={flowNumberStyle}>{number}</span>
      <span>{text}</span>
    </div>
  );
}

function FlowArrow() {
  return <div style={flowArrowStyle}>→</div>;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1240px",
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
  fontSize: "clamp(46px,7vw,78px)",
  lineHeight: ".92",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
  maxWidth: "760px",
  lineHeight: 1.5,
};

const restaurantPanelStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "28px",
};

const restaurantNameStyle = {
  fontSize: "28px",
  fontWeight: 900,
};

const restaurantMetaStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const restaurantDetailsStyle = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  flexWrap: "wrap" as const,
  color: "#94a3b8",
  fontSize: "13px",
};

const statusPillStyle = {
  border: "1px solid #334155",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "10px",
  fontWeight: 900,
  color: "#cbd5e1",
};

const headerButtonGroupStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const launchPanelStyle = {
  background: "linear-gradient(135deg,#13263b,#0f1d2e)",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "22px",
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(280px,.6fr)",
  gap: "24px",
  alignItems: "center",
  marginBottom: "28px",
};

const launchTitleStyle = {
  fontSize: "32px",
  fontWeight: 900,
  marginTop: "6px",
};

const launchTextStyle = {
  color: "#94a3b8",
  margin: "8px 0 0",
};

const launchActionsStyle = {
  display: "grid",
  gap: "12px",
};

const launchProgressTrackStyle = {
  height: "12px",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "999px",
  overflow: "hidden",
};

const launchProgressBarStyle = {
  height: "100%",
  background: "#f5b82e",
  borderRadius: "999px",
};

const setupButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const sectionHeadingStyle = {
  margin: "6px 0 14px",
};

const sectionTitleStyle = {
  fontSize: "32px",
  margin: "6px 0 0",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: "16px",
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  minHeight: "220px",
  display: "flex",
  flexDirection: "column" as const,
};

const cardTitleStyle = {
  fontSize: "24px",
  margin: "8px 0 10px",
};

const cardTextStyle = {
  color: "#94a3b8",
  lineHeight: 1.55,
  margin: "0 0 20px",
};

const primaryButtonStyle = {
  marginTop: "auto",
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
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const growthHeaderStyle = {
  background: "linear-gradient(135deg,#13263b,#0f1d2e)",
  border: "1px solid #2d4661",
  borderRadius: "18px 18px 0 0",
  padding: "24px",
  marginTop: "30px",
};

const growthTextStyle = {
  color: "#94a3b8",
  maxWidth: "780px",
  lineHeight: 1.5,
  marginBottom: 0,
};

const growthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: "0",
  borderLeft: "1px solid #2d4661",
  borderRight: "1px solid #2d4661",
  borderBottom: "1px solid #2d4661",
  borderRadius: "0 0 18px 18px",
  overflow: "hidden",
};

const growthCardStyle = {
  background: "#0a1522",
  padding: "24px",
  minHeight: "250px",
  display: "flex",
  flexDirection: "column" as const,
  borderRight: "1px solid #23364d",
};

const growthNumberStyle = {
  color: "#f5b82e",
  fontSize: "14px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const growthCardTitleStyle = {
  fontSize: "28px",
  margin: "9px 0 10px",
};

const growthButtonStyle = {
  marginTop: "auto",
  background: "transparent",
  color: "#f5b82e",
  border: "1px solid #f5b82e",
  borderRadius: "10px",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const flowPanelStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  marginTop: "22px",
};

const flowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "14px",
};

const flowStepStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "11px",
  fontWeight: 900,
};

const flowNumberStyle = {
  color: "#f5b82e",
};

const flowArrowStyle = {
  color: "#64748b",
  fontWeight: 900,
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};
