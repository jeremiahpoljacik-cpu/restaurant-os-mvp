"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Restaurant = {
  id: string;
  owner_user_id?: string | null;
  name: string;
  slug: string | null;
  cuisine_category: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
};

type Blocker = {
  label: string;
  path: string;
  action: string;
};

type Metrics = {
  vipTotal: number;
  vipNewMonth: number;
  offerTotal: number;
  campaignTotal: number;
  activeCampaigns: number;
  claimTotal: number;
  claimMonth: number;
  redeemedTotal: number;
  redemptionRate: number;
  menuItems: number;
  growthScore: number;
};

const emptyMetrics: Metrics = {
  vipTotal: 0,
  vipNewMonth: 0,
  offerTotal: 0,
  campaignTotal: 0,
  activeCampaigns: 0,
  claimTotal: 0,
  claimMonth: 0,
  redeemedTotal: 0,
  redemptionRate: 0,
  menuItems: 0,
  growthScore: 0,
};

export default function OwnerDashboardPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantCount, setRestaurantCount] = useState(1);
  const [adminMode, setAdminMode] = useState(false);
  const [sitePublished, setSitePublished] = useState(false);
  const [setupPercent, setSetupPercent] = useState(0);
  const [setupReady, setSetupReady] = useState(false);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [plan, setPlan] = useState("STARTER");
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

    let restaurantData: Restaurant | null = null;
    let isAdmin = false;

    const { data: ownedRestaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (ownedRestaurant) {
      restaurantData = ownedRestaurant as Restaurant;
    } else {
      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("user_id,active")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (adminRow) {
        const { data: adminRestaurant } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (adminRestaurant) {
          restaurantData = adminRestaurant as Restaurant;
          isAdmin = true;
        }
      }
    }

    if (!restaurantData) {
      setMessage("Restaurant not found or access denied.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);
    setAdminMode(isAdmin);

    const { count: ownerCount } = await supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id);

    setRestaurantCount(ownerCount || 1);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartIso = monthStart.toISOString();

    const [
      brandingResult,
      hoursResult,
      websiteResult,
      menuResult,
      subscriptionResult,
      vipResult,
      vipMonthResult,
      offersResult,
      campaignsResult,
      claimsResult,
      claimsMonthResult,
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
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_subscriptions")
        .select("status,trial_ends_at,plan")
        .eq("restaurant_id", id)
        .maybeSingle(),

      supabase
        .from("restaurant_vip_members")
        .select("id", { count: "exact" })
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_vip_members")
        .select("id", { count: "exact" })
        .eq("restaurant_id", id)
        .gte("created_at", monthStartIso),

      supabase
        .from("restaurant_vip_offers")
        .select("*")
        .eq("restaurant_id", id),

      supabase
        .from("restaurant_campaigns")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("restaurant_offer_claims")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("restaurant_offer_claims")
        .select("id")
        .eq("restaurant_id", id)
        .gte("created_at", monthStartIso),
    ]);

    const branding = brandingResult.data;
    const hours = hoursResult.data;
    const website = websiteResult.data;
    const subscription = subscriptionResult.data as any;

    const businessComplete = Boolean(
      restaurantData.phone &&
        restaurantData.address_line_1 &&
        restaurantData.city &&
        restaurantData.state &&
        restaurantData.zip
    );

    const brandingComplete = Boolean(
      branding?.primary_color &&
        branding?.secondary_color &&
        (branding?.tagline || branding?.short_description)
    );

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

    const websiteComplete = Boolean(
      website?.hero_headline && website?.about_body
    );

    const menuItems = menuResult.data?.length || 0;
    const menuComplete = menuItems > 0;
    const published = Boolean(website?.published);
    setSitePublished(published);

    const subscriptionComplete = Boolean(
      subscription &&
        (subscription.status === "active" ||
          (subscription.status === "trial" &&
            (!subscription.trial_ends_at ||
              new Date(subscription.trial_ends_at).getTime() > Date.now())))
    );

    if (subscription?.plan) {
      setPlan(String(subscription.plan).toUpperCase());
    }

    const checks = [
      businessComplete,
      brandingComplete,
      hoursComplete,
      websiteComplete,
      menuComplete,
      subscriptionComplete,
      published,
    ];

    const completeCount = checks.filter(Boolean).length;
    const percent = Math.round((completeCount / checks.length) * 100);

    setSetupPercent(percent);
    setSetupReady(completeCount === checks.length);

    const nextBlockers: Blocker[] = [];

    if (!subscriptionComplete) {
      nextBlockers.push({
        label:
          subscription?.status === "past_due"
            ? "Billing is past due."
            : subscription?.status === "canceled"
            ? "Subscription is canceled."
            : subscription?.status === "paused"
            ? "Subscription is paused."
            : "Subscription access is not active.",
        path: "/owner/billing",
        action:
          subscription?.status === "past_due"
            ? "FIX BILLING"
            : subscription?.status === "canceled"
            ? "REACTIVATE"
            : subscription?.status === "paused"
            ? "RESUME"
            : "VIEW BILLING",
      });
    }

    if (!menuComplete) {
      nextBlockers.push({
        label: "No menu items have been added.",
        path: "/owner/menu",
        action: "BUILD MENU",
      });
    }

    if (!websiteComplete) {
      nextBlockers.push({
        label: "Website content is incomplete.",
        path: "/owner/website",
        action: "EDIT WEBSITE",
      });
    }

    if (!published) {
      nextBlockers.push({
        label: "Public website is not published.",
        path: "/owner/website",
        action: "PUBLISH SITE",
      });
    }

    if (!businessComplete) {
      nextBlockers.push({
        label: "Business profile is incomplete.",
        path: "/owner/settings",
        action: "EDIT PROFILE",
      });
    }

    setBlockers(nextBlockers);

    const campaigns = (campaignsResult.data || []) as any[];
    const claims = (claimsResult.data || []) as any[];
    const offers = (offersResult.data || []) as any[];

    const redeemed = claims.filter(
      (claim) => String(claim.status || "").toLowerCase() === "redeemed"
    ).length;

    const activeCampaigns = campaigns.filter((campaign) => {
      const status = String(campaign.status || "").toLowerCase();
      return status === "active" || status === "live" || status === "running";
    }).length;

    const vipTotal = vipResult.count ?? vipResult.data?.length ?? 0;
    const vipNewMonth =
      vipMonthResult.count ?? vipMonthResult.data?.length ?? 0;
    const claimTotal = claims.length;
    const claimMonth = claimsMonthResult.data?.length || 0;
    const redemptionRate =
      claimTotal > 0 ? Math.round((redeemed / claimTotal) * 100) : 0;

    // Founders-launch Growth Score uses only first-party Restaurant OS data.
    // No fake traffic or revenue attribution.
    const growthChecks = [
      published,
      menuComplete,
      vipTotal >= 10,
      offers.length > 0,
      campaigns.length > 0,
      redeemed > 0,
    ];

    const growthScore = Math.round(
      (growthChecks.filter(Boolean).length / growthChecks.length) * 100
    );

    setMetrics({
      vipTotal,
      vipNewMonth,
      offerTotal: offers.length,
      campaignTotal: campaigns.length,
      activeCampaigns,
      claimTotal,
      claimMonth,
      redeemedTotal: redeemed,
      redemptionRate,
      menuItems,
      growthScore,
    });

    setLoading(false);
  }

  function go(path: string) {
    window.location.href = `${path}?restaurant=${restaurantId}`;
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const nextMove = useMemo(() => {
    if (blockers.length > 0) {
      return {
        eyebrow: "SYSTEM PRIORITY",
        title: blockers[0].label,
        text: "Finish this first so Restaurant OS can operate from a clean foundation.",
        action: blockers[0].action,
        path: blockers[0].path,
      };
    }

    if (metrics.vipTotal < 10) {
      return {
        eyebrow: "NEXT BEST MOVE",
        title: "Build your customer list.",
        text: "Your most valuable growth asset is a customer audience you can reach again. Push VIP signup in-store and online.",
        action: "VIEW VIP CUSTOMERS",
        path: "/owner/vip",
      };
    }

    if (metrics.offerTotal === 0) {
      return {
        eyebrow: "NEXT BEST MOVE",
        title: "Create an offer worth claiming.",
        text: "Give customers a clear reason to act and something Restaurant OS can track.",
        action: "CREATE OFFER",
        path: "/owner/offers",
      };
    }

    if (metrics.campaignTotal === 0) {
      return {
        eyebrow: "NEXT BEST MOVE",
        title: "Launch your first campaign.",
        text: "You have the foundation. Now activate it with a trackable promotion.",
        action: "BUILD CAMPAIGN",
        path: "/owner/campaigns",
      };
    }

    if (metrics.claimTotal === 0) {
      return {
        eyebrow: "NEXT BEST MOVE",
        title: "Drive traffic to your active offer.",
        text: "Your campaign is built. Now put the offer in front of customers and start generating measurable claims.",
        action: "MANAGE CAMPAIGNS",
        path: "/owner/campaigns",
      };
    }

    if (metrics.redeemedTotal === 0) {
      return {
        eyebrow: "NEXT BEST MOVE",
        title: "Turn claims into redeemed visits.",
        text: "Customers have claimed offers. Make redemption easy at the restaurant and start closing the loop.",
        action: "OPEN REDEMPTION CENTER",
        path: "/owner/redeem",
      };
    }

    return {
      eyebrow: "NEXT BEST MOVE",
      title: "Keep the growth loop moving.",
      text: "Your system is operating. Review results, identify the strongest offer and launch the next campaign.",
      action: "VIEW CAMPAIGN RESULTS",
      path: "/owner/campaign-results",
    };
  }, [blockers, metrics]);

  if (loading) {
    return (
      <main className="page">
        <div className="shell loading">Loading Restaurant OS Command Center...</div>
        <Styles />
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="page">
        <div className="shell loading">{message || "Restaurant not found."}</div>
        <Styles />
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
    <main className="page">
      <Styles />

      <div className="shell">
        <header className="top">
          <div>
            <div className="brandline">RESTAURANT <span>OS</span></div>
            <h1>OWNER COMMAND CENTER</h1>
            <p>
              See the signal. Make the move. Drive the growth.
            </p>
          </div>

          <div className="topActions">
            {restaurantCount > 1 && (
              <button onClick={() => (window.location.href = "/owner/restaurants")}>
                SWITCH COMMAND
              </button>
            )}
            <button className="topCommand" onClick={() => go("/owner/qa")}>RUN SYSTEM CHECK</button>
            <button onClick={signOut}>SIGN OUT</button>
          </div>
        </header>

        {adminMode && (
          <div className="adminBanner">
            <span>SUPER ADMIN VIEW · {restaurant.name}</span>
            <button
              onClick={() =>
                (window.location.href = `/admin/restaurant?restaurant=${restaurant.id}`)
              }
            >
              RETURN TO ADMIN
            </button>
          </div>
        )}

        <section className="restaurantBar">
          <div>
            <div className="restaurantName">{restaurant.name}</div>
            <div className="restaurantMeta">
              {restaurant.cuisine_category || "RESTAURANT"} · {plan}
            </div>
          </div>

          <div className="restaurantRight">
            {restaurant.phone && <span>{restaurant.phone}</span>}
            {address && <span>{address}</span>}
            <span className={`status ${sitePublished ? "live" : ""}`}>
              {sitePublished ? "SITE LIVE" : "DRAFT"}
            </span>
            {sitePublished && restaurant.slug && (
              <button
                className="miniRed"
                onClick={() =>
                  window.open(`/r/${restaurant.slug}`, "_blank", "noopener,noreferrer")
                }
              >
                VIEW SITE ↗
              </button>
            )}
          </div>
        </section>

        <section className="scoreRow">
          <div className="growthScore">
            <div>
              <div className="kicker">RESTAURANT GROWTH SCORE</div>
              <div className="scoreNumber">
                {metrics.growthScore}<span>/100</span>
              </div>
            </div>

            <div className="scoreCopy">
              <strong>
                {metrics.growthScore >= 84
                  ? "YOUR GROWTH SYSTEM IS OPERATING."
                  : metrics.growthScore >= 50
                  ? "GOOD FOUNDATION. MORE FIREPOWER AVAILABLE."
                  : "BIG GROWTH OPPORTUNITY."}
              </strong>
              <span>
                Built from first-party Restaurant OS activity — not vanity metrics.
              </span>
            </div>
          </div>

          <div className="launchCard">
            <div className="kicker">SYSTEM READINESS</div>
            <div className="launchNumber">
              {setupReady ? "READY" : `${setupPercent}%`}
            </div>
            <div className="progressTrack">
              <div
                className="progressFill"
                style={{ width: `${setupPercent}%` }}
              />
            </div>
            <button onClick={() => go("/owner/setup")}>
              {setupReady ? "OPEN READINESS CHECK" : "FINISH SYSTEM SETUP"}
            </button>
          </div>
        </section>

        {blockers.length > 0 && (
          <section className="blockers">
            <div className="blockerHead">
              <div>
                <div className="kicker danger">ACTION REQUIRED</div>
                <h2>
                  {blockers.length} system blocker
                  {blockers.length === 1 ? "" : "s"}
                </h2>
              </div>
              <button onClick={() => go("/owner/setup")}>FULL CHECKLIST</button>
            </div>

            <div className="blockerList">
              {blockers.map((blocker) => (
                <button
                  key={`${blocker.path}-${blocker.label}`}
                  onClick={() => go(blocker.path)}
                >
                  <span>{blocker.label}</span>
                  <strong>{blocker.action} →</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="metricSection">
          <div className="sectionHeader">
            <div>
              <div className="kicker">COMMAND METRICS · THIS MONTH</div>
              <h2>THE NUMBERS THAT MATTER</h2>
            </div>
            <button onClick={() => go("/owner/campaign-results")}>
              OPEN PERFORMANCE REPORT →
            </button>
          </div>

          <div className="metricGrid">
            <MetricCard
              label="VIP CUSTOMERS"
              value={metrics.vipTotal}
              sub={`+${metrics.vipNewMonth} this month`}
              action={() => go("/owner/vip")}
            />
            <MetricCard
              label="ACTIVE OFFERS"
              value={metrics.offerTotal}
              sub="trackable promotions"
              action={() => go("/owner/offers")}
            />
            <MetricCard
              label="CAMPAIGNS"
              value={metrics.campaignTotal}
              sub={`${metrics.activeCampaigns} active now`}
              action={() => go("/owner/campaigns")}
            />
            <MetricCard
              label="OFFER CLAIMS"
              value={metrics.claimTotal}
              sub={`+${metrics.claimMonth} this month`}
              action={() => go("/owner/campaign-results")}
            />
            <MetricCard
              label="REDEMPTIONS"
              value={metrics.redeemedTotal}
              sub="measured visits"
              action={() => go("/owner/redeem")}
            />
            <MetricCard
              label="REDEMPTION RATE"
              value={`${metrics.redemptionRate}%`}
              sub="claims converted"
              action={() => go("/owner/campaign-results")}
            />
          </div>
        </section>

        <section className="nextMove">
          <div className="nextIcon">→</div>
          <div className="nextCopy">
            <div className="kicker">{nextMove.eyebrow}</div>
            <h2>{nextMove.title}</h2>
            <p>{nextMove.text}</p>
          </div>
          <button className="executeButton" onClick={() => go(nextMove.path)}>
            <span>EXECUTE</span>
            <strong>{nextMove.action}</strong>
            <span className="buttonArrow">→</span>
          </button>
        </section>

        <section className="twoCol">
          <div className="panel">
            <div className="panelHead">
              <div>
                <div className="kicker">CUSTOMER ENGINE</div>
                <h2>OWN THE CUSTOMER RELATIONSHIP</h2>
              </div>
              <div className="bigTiny">{metrics.vipTotal}</div>
            </div>

            <div className="miniGrid">
              <MiniStat label="TOTAL VIPS" value={metrics.vipTotal} />
              <MiniStat label="NEW THIS MONTH" value={metrics.vipNewMonth} />
              <MiniStat label="OFFER CLAIMS" value={metrics.claimTotal} />
              <MiniStat label="REDEEMED" value={metrics.redeemedTotal} />
            </div>

            <div className="panelActions">
              <button className="primary" onClick={() => go("/owner/vip")}>
                OPEN VIP COMMAND
              </button>
              <button onClick={() => go("/owner/offers")}>BUILD AN OFFER</button>
            </div>
          </div>

          <div className="panel">
            <div className="panelHead">
              <div>
                <div className="kicker">CAMPAIGN ENGINE</div>
                <h2>LAUNCH. TRACK. REDEEM. REPEAT.</h2>
              </div>
              <div className="bigTiny">{metrics.campaignTotal}</div>
            </div>

            <div className="miniGrid">
              <MiniStat label="CAMPAIGNS" value={metrics.campaignTotal} />
              <MiniStat label="ACTIVE" value={metrics.activeCampaigns} />
              <MiniStat label="CLAIMS" value={metrics.claimTotal} />
              <MiniStat label="REDEMPTION" value={`${metrics.redemptionRate}%`} />
            </div>

            <div className="panelActions">
              <button className="primary" onClick={() => go("/owner/campaigns")}>
                OPEN CAMPAIGN COMMAND
              </button>
              <button onClick={() => go("/owner/campaign-results")}>
                REVIEW PERFORMANCE
              </button>
            </div>
          </div>
        </section>

        <section className="tools">
          <div className="sectionHeader">
            <div>
              <div className="kicker">COMMAND MODULES</div>
              <h2>DEPLOY THE RESTAURANT GROWTH ENGINE</h2>
            </div>
          </div>

          <div className="toolGrid">
            <ToolCard
              title="WEBSITE"
              text="Control the live site, pages, media and publishing from one place."
              button="OPEN SITE COMMAND"
              onClick={() => go("/owner/website")}
            />
            <ToolCard
              title="MENU"
              text={`${metrics.menuItems} menu item${metrics.menuItems === 1 ? "" : "s"} live in your menu system.`}
              button="EDIT MENU"
              onClick={() => go("/owner/menu")}
            />
            <ToolCard
              title="VIP CUSTOMERS"
              text="Capture first-party customers you can reach, reward and bring back."
              button="OPEN VIP CRM"
              onClick={() => go("/owner/vip")}
            />
            <ToolCard
              title="QR CODES"
              text="Deploy scan-to-VIP and scan-to-review QR codes anywhere guests see your brand."
              button="BUILD QR CODE"
              onClick={() => go("/owner/qr")}
            />
            <ToolCard
              title="OFFERS"
              text="Create trackable reasons for customers to visit, claim and return."
              button="BUILD OFFER"
              onClick={() => go("/owner/offers")}
            />
            <ToolCard
              title="CAMPAIGNS"
              text="Put offers into market, activate your audience and track response."
              button="LAUNCH CAMPAIGN"
              onClick={() => go("/owner/campaigns")}
            />
            <ToolCard
              title="REDEMPTION"
              text="Turn claimed offers into measured restaurant visits and closed-loop results."
              button="OPEN REDEMPTION"
              onClick={() => go("/owner/redeem")}
            />
            <ToolCard
              title="SETTINGS"
              text="Control business profile, hours, branding, ordering and core restaurant details."
              button="CONFIGURE RESTAURANT"
              onClick={() => go("/owner/settings")}
            />
            <ToolCard
              title="BILLING"
              text={`Restaurant OS ${plan} plan, access and subscription controls.`}
              button="OPEN BILLING"
              onClick={() => go("/owner/billing")}
            />
          </div>
        </section>

        <section className="growthLoop">
          <div className="kicker">MISSION LOOP · REPEAT THIS FOREVER</div>
          <div className="loop">
            <LoopStep number="01" label="ATTRACT" />
            <span>→</span>
            <LoopStep number="02" label="CAPTURE" />
            <span>→</span>
            <LoopStep number="03" label="FOLLOW UP" />
            <span>→</span>
            <LoopStep number="04" label="BRING BACK" />
            <span>→</span>
            <LoopStep number="05" label="MEASURE" />
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  sub,
  action,
}: {
  label: string;
  value: string | number;
  sub: string;
  action: () => void;
}) {
  return (
    <button className="metric" onClick={action}>
      <span className="metricLabel">{label}</span>
      <strong>{value}</strong>
      <span className="metricSub">{sub}</span>
    </button>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="miniStat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ToolCard({
  title,
  text,
  button,
  onClick,
}: {
  title: string;
  text: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <article className="toolCard">
      <div className="toolTopline">
        <span>COMMAND MODULE</span>
        <span className="toolStatus">READY</span>
      </div>
      <div className="toolTitle">{title}</div>
      <p>{text}</p>
      <button onClick={onClick}>
        <span>{button}</span>
        <span className="buttonArrow">→</span>
      </button>
    </article>
  );
}

function LoopStep({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="loopStep">
      <span>{number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #050505;
        font-family: Arial, Helvetica, sans-serif;
      }
      button { font: inherit; }
      button:focus-visible { outline: 2px solid #e1222d; outline-offset: 2px; }

      .page {
        min-height: 100vh;
        background:
          radial-gradient(circle at 86% 0%, rgba(225,34,45,.16), transparent 25%),
          radial-gradient(circle at 10% 55%, rgba(130,20,28,.055), transparent 30%),
          linear-gradient(180deg, #070707 0%, #030303 100%);
        color: #fff;
        padding: 30px;
      }

      .shell {
        max-width: 1480px;
        margin: 0 auto;
      }

      .loading {
        padding: 70px 0;
        color: #999;
        font-size: 14px;
      }

      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 28px;
        margin-bottom: 24px;
        padding-bottom: 22px;
        border-bottom: 1px solid #1b1b1b;
      }

      .brandline {
        color: #fff;
        font-size: 11px;
        font-weight: 1000;
        letter-spacing: 2px;
      }

      .brandline span { color: #e1222d; }

      .top h1 {
        margin: 9px 0 10px;
        font-size: clamp(48px, 6.1vw, 82px);
        line-height: .88;
        letter-spacing: -4.6px;
        font-weight: 1000;
        text-wrap: balance;
      }

      .top p {
        margin: 0;
        color: #8c8c8c;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: .1px;
      }

      .topActions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      button {
        border: 1px solid #2b2b2b;
        border-radius: 9px;
        background: #101010;
        color: #fff;
        padding: 11px 13px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 1000;
        letter-spacing: .75px;
        transition: transform .15s ease, border-color .15s ease, background .15s ease, color .15s ease;
      }

      button:hover {
        transform: translateY(-1px);
        border-color: #6b252b;
        background: #180a0b;
        color: #ff7d84;
      }

      .topActions button {
        min-height: 38px;
        padding-inline: 15px;
      }

      .topActions .topCommand {
        border-color: #6f252b;
        background: linear-gradient(180deg, #321014, #1f0a0d);
        color: #ff858c;
      }

      .adminBanner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 14px;
        padding: 10px 12px;
        border: 1px solid #276648;
        border-radius: 10px;
        background: #102b20;
        color: #a4e8bf;
        font-size: 9px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .adminBanner button {
        background: #22c55e;
        border: 0;
        color: #052e16;
      }

      .restaurantBar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 19px 21px;
        border: 1px solid #292929;
        border-left: 3px solid #e1222d;
        border-radius: 14px;
        background: linear-gradient(90deg, #101010, #090909 72%);
        box-shadow: 0 14px 40px rgba(0,0,0,.18);
      }

      .restaurantName {
        font-size: 25px;
        font-weight: 1000;
        letter-spacing: -1px;
      }

      .restaurantMeta {
        margin-top: 4px;
        color: #e1222d;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1px;
      }

      .restaurantRight {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        color: #777;
        font-size: 10px;
      }

      .status {
        border: 1px solid #333;
        border-radius: 999px;
        padding: 6px 8px;
        color: #888;
        font-size: 8px;
        font-weight: 1000;
      }

      .status.live {
        border-color: #245e42;
        color: #77d69d;
        background: #10251a;
      }

      .miniRed {
        border-color: #7e242a;
        background: #311013;
        color: #ff8e94;
      }

      .scoreRow {
        display: grid;
        grid-template-columns: 1.3fr .7fr;
        gap: 14px;
        margin-bottom: 14px;
      }

      .growthScore,
      .launchCard {
        border: 1px solid #292929;
        border-radius: 16px;
        background: linear-gradient(145deg, #121212, #080808);
        box-shadow: 0 16px 50px rgba(0,0,0,.2);
      }

      .growthScore {
        display: grid;
        grid-template-columns: .58fr 1.42fr;
        gap: 24px;
        align-items: center;
        padding: 24px;
      }

      .kicker {
        color: #ee2a35;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: 1.85px;
      }

      .scoreNumber {
        margin-top: 10px;
        color: #e1222d;
        font-size: 78px;
        line-height: .8;
        letter-spacing: -5px;
        font-weight: 1000;
      }

      .scoreNumber span {
        color: #555;
        font-size: 19px;
        letter-spacing: -1px;
      }

      .scoreCopy strong {
        display: block;
        font-size: 23px;
        line-height: 1;
        font-weight: 1000;
      }

      .scoreCopy span {
        display: block;
        max-width: 520px;
        margin-top: 9px;
        color: #707070;
        font-size: 10px;
        line-height: 1.5;
      }

      .launchCard {
        padding: 22px;
      }

      .launchNumber {
        margin-top: 9px;
        font-size: 36px;
        font-weight: 1000;
      }

      .progressTrack {
        height: 8px;
        margin: 14px 0;
        border-radius: 999px;
        overflow: hidden;
        background: #242424;
      }

      .progressFill {
        height: 100%;
        border-radius: 999px;
        background: #e1222d;
      }

      .launchCard button {
        width: 100%;
        border: 0;
        background: #e1222d;
      }

      .blockers {
        margin-bottom: 14px;
        padding: 18px;
        border: 1px solid #6e292e;
        border-radius: 14px;
        background: #240e10;
      }

      .danger { color: #ff8b92; }

      .blockerHead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .blockerHead h2 {
        margin: 4px 0 0;
        font-size: 22px;
      }

      .blockerList {
        display: grid;
        gap: 7px;
        margin-top: 14px;
      }

      .blockerList button {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        border-color: #54272a;
        background: #190b0c;
        text-align: left;
        color: #e9b7ba;
      }

      .blockerList strong {
        color: #ff858d;
        white-space: nowrap;
      }

      .metricSection,
      .tools {
        margin-top: 34px;
      }

      .sectionHeader {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        margin-bottom: 13px;
      }

      .sectionHeader h2 {
        margin: 6px 0 0;
        font-size: clamp(27px, 3vw, 34px);
        letter-spacing: -1.35px;
        line-height: 1;
      }

      .sectionHeader > button {
        color: #ff6c74;
        border-color: #54272a;
        background: #17090a;
      }

      .metricGrid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 9px;
      }

      .metric {
        min-height: 148px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 17px;
        border: 1px solid #242424;
        border-radius: 12px;
        background: linear-gradient(160deg, #101010, #090909);
        text-align: left;
      }

      .metric:hover {
        border-color: #6f252b;
        box-shadow: inset 0 -2px 0 rgba(225,34,45,.35);
      }

      .metricLabel {
        color: #777;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: .9px;
      }

      .metric strong {
        margin-top: 19px;
        color: #fff;
        font-size: 34px;
        line-height: .9;
        letter-spacing: -2px;
      }

      .metricSub {
        margin-top: auto;
        padding-top: 12px;
        color: #666;
        font-size: 8px;
        line-height: 1.3;
      }

      .nextMove {
        display: grid;
        grid-template-columns: 62px 1fr auto;
        gap: 18px;
        align-items: center;
        margin-top: 14px;
        padding: 21px;
        border: 1px solid #77262c;
        border-radius: 15px;
        background:
          linear-gradient(110deg, #210c0e, #0c0c0c 65%);
        box-shadow: 0 20px 60px rgba(225,34,45,.08);
      }

      .nextIcon {
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: #e1222d;
        font-size: 26px;
        font-weight: 1000;
      }

      .nextCopy h2 {
        margin: 5px 0 4px;
        font-size: 25px;
        letter-spacing: -.8px;
      }

      .nextCopy p {
        margin: 0;
        max-width: 720px;
        color: #818181;
        font-size: 10px;
        line-height: 1.45;
      }

      .nextMove > button {
        border: 0;
        background: #e1222d;
        padding: 13px 15px;
      }

      .executeButton {
        min-width: 185px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 7px;
        align-items: center;
        text-align: left;
        box-shadow: 0 10px 28px rgba(225,34,45,.18);
      }

      .executeButton > span:first-child {
        font-size: 7px;
        letter-spacing: 1.4px;
        opacity: .72;
      }

      .executeButton strong {
        font-size: 9px;
        letter-spacing: .65px;
      }

      .twoCol {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 13px;
        margin-top: 14px;
      }

      .panel {
        padding: 22px;
        border: 1px solid #292929;
        border-radius: 15px;
        background: linear-gradient(155deg, #101010, #090909);
        box-shadow: 0 14px 40px rgba(0,0,0,.16);
      }

      .panelHead {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: start;
      }

      .panelHead h2 {
        margin: 6px 0 0;
        max-width: 480px;
        font-size: 23px;
        line-height: 1;
        letter-spacing: -1px;
      }

      .bigTiny {
        color: #e1222d;
        font-size: 38px;
        line-height: 1;
        font-weight: 1000;
        letter-spacing: -2px;
      }

      .miniGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 7px;
        margin-top: 19px;
      }

      .miniStat {
        padding: 12px;
        border: 1px solid #222;
        border-radius: 9px;
        background: #090909;
      }

      .miniStat span {
        display: block;
        color: #666;
        font-size: 7px;
        font-weight: 1000;
      }

      .miniStat strong {
        display: block;
        margin-top: 7px;
        font-size: 20px;
      }

      .panelActions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 17px;
      }

      .panelActions .primary {
        border: 0;
        background: #e1222d;
        color: #fff;
        box-shadow: 0 8px 22px rgba(225,34,45,.14);
      }

      .panelActions button {
        min-height: 36px;
        padding-inline: 14px;
      }

      .toolGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 11px;
      }

      .toolCard {
        min-height: 214px;
        display: flex;
        flex-direction: column;
        padding: 18px;
        border: 1px solid #262626;
        border-radius: 13px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.018), transparent 36%),
          #0b0b0b;
        position: relative;
        overflow: hidden;
        transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
      }

      .toolCard::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 3px;
        height: 100%;
        background: #2b2b2b;
        transition: background .16s ease;
      }

      .toolCard:hover {
        transform: translateY(-2px);
        border-color: #572229;
        box-shadow: 0 16px 36px rgba(0,0,0,.28);
      }

      .toolCard:hover::before {
        background: #e1222d;
      }

      .toolTopline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        color: #5f5f5f;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: 1.35px;
      }

      .toolStatus {
        color: #6fcf97;
        letter-spacing: 1px;
      }

      .toolTitle {
        color: #fff;
        font-size: 20px;
        font-weight: 1000;
        letter-spacing: -.5px;
      }

      .toolCard p {
        margin: 10px 0 22px;
        color: #777;
        font-size: 9px;
        line-height: 1.55;
      }

      .toolCard button {
        margin-top: auto;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        color: #ff747c;
        border-color: #4b2327;
        background: linear-gradient(180deg, #160a0b, #100708);
        padding: 11px 12px;
      }

      .toolCard button:hover {
        background: #e1222d;
        border-color: #e1222d;
        color: #fff;
      }

      .buttonArrow {
        font-size: 14px;
        line-height: 1;
      }

      .growthLoop {
        margin-top: 16px;
        padding: 20px;
        border: 1px solid #292929;
        border-radius: 14px;
        background: linear-gradient(90deg, #0c0c0c, #080808);
      }

      .loop {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow-x: auto;
        margin-top: 13px;
        padding-bottom: 3px;
      }

      .loop > span {
        color: #555;
        font-weight: 1000;
      }

      .loopStep {
        min-width: 155px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 12px 13px;
        border: 1px solid #292929;
        border-radius: 9px;
        background: #101010;
      }

      .loopStep span {
        color: #e1222d;
        font-size: 8px;
        font-weight: 1000;
      }

      .loopStep strong {
        font-size: 9px;
        letter-spacing: .6px;
      }

      @media (max-width: 1150px) {
        .metricGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .toolGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 850px) {
        .page { padding: 18px; }

        .top,
        .scoreRow,
        .twoCol {
          grid-template-columns: 1fr;
          display: grid;
        }

        .growthScore {
          grid-template-columns: 1fr;
        }

        .nextMove {
          grid-template-columns: 50px 1fr;
        }

        .nextMove > button {
          grid-column: 1 / -1;
          width: 100%;
        }

        .miniGrid {
          grid-template-columns: repeat(2, minmax(0,1fr));
        }
      }

      @media (max-width: 600px) {
        .top h1 {
          font-size: 45px;
          letter-spacing: -2.5px;
        }

        .topActions,
        .topActions button {
          width: 100%;
        }

        .restaurantRight {
          align-items: stretch;
          flex-direction: column;
          width: 100%;
        }

        .restaurantRight button {
          width: 100%;
        }

        .metricGrid,
        .toolGrid {
          grid-template-columns: 1fr;
        }

        .metric {
          min-height: 115px;
        }

        .scoreNumber {
          font-size: 66px;
        }

        .nextMove {
          grid-template-columns: 1fr;
        }

        .nextIcon {
          width: 44px;
          height: 44px;
        }

        .sectionHeader {
          align-items: stretch;
          flex-direction: column;
        }

        .sectionHeader > button {
          width: 100%;
        }
      }
    `}</style>
  );
}
