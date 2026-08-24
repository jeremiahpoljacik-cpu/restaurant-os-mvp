"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Step = {
  key: string;
  group: "FOUNDATION" | "WEBSITE" | "GROWTH & LAUNCH";
  label: string;
  description: string;
  complete: boolean;
  action: string;
  path: string;
  blocker?: boolean;
};

export default function OwnerSetupPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
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
      .select("id,name,phone,address_line_1,city,state,zip,theme_key,owner_user_id")
      .eq("id", id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    const isOwner = restaurant.owner_user_id === user.id;

    if (!isOwner) {
      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("user_id,active")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (!adminRow) {
        setMessage("Restaurant access denied.");
        setLoading(false);
        return;
      }
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
      mediaResult,
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
        .select("hero_headline,about_body,hero_image_url,hero_video_url,logo_url,published")
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

      supabase
        .from("restaurant_site_images")
        .select("id")
        .eq("restaurant_id", id)
        .eq("active", true)
        .limit(1),
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

    const themeComplete = Boolean(restaurant.theme_key);

    const website = websiteResult.data;
    const mediaComplete = Boolean(
      website?.logo_url ||
        website?.hero_image_url ||
        website?.hero_video_url ||
        mediaResult.data?.length
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

    const menuComplete = Boolean(menuResult.data?.length);

    const websiteComplete = Boolean(
      website?.hero_headline && website?.about_body
    );

    const ordering = orderingResult.data;
    const orderingComplete = Boolean(
      ordering?.online_ordering_url || ordering?.catering_email
    );

    const growth = growthResult.data;
    const growthComplete = Boolean(
      growth?.vip_club_name || growth?.signup_offer
    );

    const subscription = subscriptionResult.data;
    const subscriptionComplete = Boolean(
      subscription &&
        (subscription.status === "active" ||
          subscription.status === "trial")
    );

    setSteps([
      {
        key: "business",
        group: "FOUNDATION",
        label: "Business Profile",
        description: "Phone, address and restaurant contact details.",
        complete: businessComplete,
        action: "COMPLETE BUSINESS PROFILE",
        path: "/owner/settings",
        blocker: true,
      },
      {
        key: "branding",
        group: "FOUNDATION",
        label: "Brand Identity",
        description: "Colors, tagline and restaurant identity are configured.",
        complete: brandingComplete,
        action: "SET BRANDING",
        path: "/owner/settings",
      },
      {
        key: "hours",
        group: "FOUNDATION",
        label: "Restaurant Hours",
        description: "Operating hours are entered.",
        complete: hoursComplete,
        action: "SET HOURS",
        path: "/owner/settings",
      },
      {
        key: "theme",
        group: "WEBSITE",
        label: "Choose Website Design",
        description: "A Restaurant OS website theme is selected.",
        complete: themeComplete,
        action: "CHOOSE THEME",
        path: "/owner/website",
        blocker: true,
      },
      {
        key: "media",
        group: "WEBSITE",
        label: "Add Restaurant Media",
        description: "Logo, hero media or restaurant photography is loaded.",
        complete: mediaComplete,
        action: "UPLOAD MEDIA",
        path: "/owner/website",
      },
      {
        key: "menu",
        group: "WEBSITE",
        label: "Build Menu",
        description: "At least one menu item has been added.",
        complete: menuComplete,
        action: "BUILD MENU",
        path: "/owner/menu",
        blocker: true,
      },
      {
        key: "website",
        group: "WEBSITE",
        label: "Website Story & Hero",
        description: "Hero headline and restaurant story are ready.",
        complete: websiteComplete,
        action: "FINISH WEBSITE",
        path: "/owner/website",
        blocker: true,
      },
      {
        key: "ordering",
        group: "GROWTH & LAUNCH",
        label: "Ordering / Catering",
        description: "Online ordering or catering destination is connected.",
        complete: orderingComplete,
        action: "CONNECT ORDERING",
        path: "/owner/settings",
      },
      {
        key: "vip",
        group: "GROWTH & LAUNCH",
        label: "VIP Growth",
        description: "VIP club or signup offer is configured.",
        complete: growthComplete,
        action: "SETUP VIP",
        path: "/owner/settings",
      },
      {
        key: "billing",
        group: "GROWTH & LAUNCH",
        label: "Subscription Access",
        description: "Restaurant OS trial or paid subscription is active.",
        complete: subscriptionComplete,
        action: "VIEW BILLING",
        path: "/owner/billing",
        blocker: true,
      },
      {
        key: "publish",
        group: "GROWTH & LAUNCH",
        label: "Publish Website",
        description: "Your public restaurant website is live.",
        complete: Boolean(website?.published),
        action: "PUBLISH SITE",
        path: "/owner/website",
        blocker: true,
      },
    ]);

    setLoading(false);
  }

  const completeCount = useMemo(
    () => steps.filter((step) => step.complete).length,
    [steps]
  );

  const percent = steps.length
    ? Math.round((completeCount / steps.length) * 100)
    : 0;

  const blockers = useMemo(
    () => steps.filter((step) => step.blocker && !step.complete),
    [steps]
  );

  const ready = steps.length > 0 && blockers.length === 0;
  const fullyComplete = steps.length > 0 && completeCount === steps.length;

  const nextStep = useMemo(
    () => steps.find((step) => !step.complete) || null,
    [steps]
  );

  const grouped = useMemo(
    () => ({
      FOUNDATION: steps.filter((step) => step.group === "FOUNDATION"),
      WEBSITE: steps.filter((step) => step.group === "WEBSITE"),
      "GROWTH & LAUNCH": steps.filter(
        (step) => step.group === "GROWTH & LAUNCH"
      ),
    }),
    [steps]
  );

  function go(path: string) {
    window.location.href = `${path}?restaurant=${restaurantId}`;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={loadingCardStyle}>Building your launch plan...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS · LAUNCH WIZARD</div>
            <h1 style={titleStyle}>Get Live.</h1>
            <p style={subStyle}>
              {restaurantName} — finish the essentials in order and launch with confidence.
            </p>
          </div>

          <button style={secondaryButtonStyle} onClick={() => go("/owner")}>
            OWNER COMMAND CENTER
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={heroProgressStyle}>
          <div>
            <div style={progressEyebrowStyle}>OVERALL SETUP</div>
            <div style={progressNumberStyle}>{percent}%</div>
            <div style={progressCopyStyle}>
              {fullyComplete
                ? "Everything is configured."
                : ready
                ? "Launch blockers are cleared. Optional growth items remain."
                : `${blockers.length} launch blocker${blockers.length === 1 ? "" : "s"} remain.`}
            </div>
          </div>

          <div style={progressRightStyle}>
            <div style={progressTrackStyle}>
              <div style={{ ...progressBarStyle, width: `${percent}%` }} />
            </div>

            <div style={summaryGridStyle}>
              <SummaryMetric label="COMPLETE" value={`${completeCount}/${steps.length}`} />
              <SummaryMetric label="BLOCKERS" value={String(blockers.length)} />
              <SummaryMetric label="LAUNCH" value={ready ? "READY" : "NOT READY"} />
            </div>
          </div>
        </section>

        {nextStep && (
          <section style={nextStyle}>
            <div>
              <div style={nextEyebrowStyle}>NEXT BEST ACTION</div>
              <div style={nextTitleStyle}>{nextStep.label}</div>
              <div style={nextTextStyle}>{nextStep.description}</div>
            </div>

            <button
              style={nextButtonStyle}
              onClick={() => go(nextStep.path)}
            >
              {nextStep.action} →
            </button>
          </section>
        )}

        {(["FOUNDATION", "WEBSITE", "GROWTH & LAUNCH"] as const).map(
          (group, groupIndex) => {
            const groupSteps = grouped[group];
            const groupComplete = groupSteps.filter((step) => step.complete).length;

            return (
              <section key={group} style={groupStyle}>
                <div style={groupHeaderStyle}>
                  <div>
                    <div style={groupNumberStyle}>0{groupIndex + 1}</div>
                    <div style={groupTitleStyle}>{group}</div>
                  </div>

                  <div style={groupStatusStyle}>
                    {groupComplete}/{groupSteps.length} COMPLETE
                  </div>
                </div>

                <div style={stepGridStyle}>
                  {groupSteps.map((step) => (
                    <article
                      key={step.key}
                      style={{
                        ...stepCardStyle,
                        ...(step.complete
                          ? completeStepStyle
                          : step.blocker
                          ? blockerStepStyle
                          : {}),
                      }}
                    >
                      <div style={stepTopStyle}>
                        <div style={statusIconStyle}>
                          {step.complete ? "✓" : step.blocker ? "!" : "•"}
                        </div>

                        <div
                          style={{
                            ...statusPillStyle,
                            ...(step.complete
                              ? completePillStyle
                              : step.blocker
                              ? blockerPillStyle
                              : optionalPillStyle),
                          }}
                        >
                          {step.complete
                            ? "COMPLETE"
                            : step.blocker
                            ? "LAUNCH BLOCKER"
                            : "RECOMMENDED"}
                        </div>
                      </div>

                      <h2 style={stepTitleStyle}>{step.label}</h2>
                      <p style={stepTextStyle}>{step.description}</p>

                      <button
                        style={
                          step.complete
                            ? reviewButtonStyle
                            : step.blocker
                            ? blockerButtonStyle
                            : actionButtonStyle
                        }
                        onClick={() => go(step.path)}
                      >
                        {step.complete ? "REVIEW" : step.action} →
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            );
          }
        )}

        <section
          style={{
            ...launchCardStyle,
            ...(ready ? launchReadyStyle : {}),
          }}
        >
          <div>
            <div style={eyebrowStyle}>
              {ready ? "LAUNCH GATE PASSED" : "LAUNCH GATE"}
            </div>
            <h2 style={launchTitleStyle}>
              {ready
                ? "Your restaurant is ready to launch."
                : "Clear the launch blockers first."}
            </h2>
            <p style={launchTextStyle}>
              {ready
                ? fullyComplete
                  ? "Core setup and growth tools are fully configured."
                  : "The critical pieces are ready. You can launch now and finish optional growth tools afterward."
                : `${blockers.length} critical item${blockers.length === 1 ? "" : "s"} still need attention.`}
            </p>
          </div>

          <button
            style={ready ? launchButtonStyle : disabledLaunchButtonStyle}
            disabled={!ready}
            onClick={() => {
              if (ready) go("/owner");
            }}
          >
            {ready ? "OPEN OWNER COMMAND CENTER" : "NOT READY TO LAUNCH"}
          </button>
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryMetricStyle}>
      <div style={summaryMetricLabelStyle}>{label}</div>
      <div style={summaryMetricValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#07111f",
  color: "#ffffff",
  padding: "30px 22px 80px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const loadingCardStyle = {
  marginTop: "120px",
  background: "#0e1d2f",
  border: "1px solid #263b53",
  borderRadius: "18px",
  padding: "28px",
  color: "#dbeafe",
  fontWeight: 900,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  flexWrap: "wrap" as const,
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#f4b82d",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "8px 0",
  fontSize: "clamp(52px,8vw,88px)",
  lineHeight: ".88",
  letterSpacing: "-4px",
  fontWeight: 900,
};

const subStyle = {
  color: "#9aadc1",
  fontSize: "16px",
  lineHeight: 1.6,
  maxWidth: "720px",
};

const secondaryButtonStyle = {
  background: "#0e1d2f",
  color: "#ffffff",
  border: "1px solid #32475f",
  borderRadius: "10px",
  padding: "12px 14px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#3a1f25",
  border: "1px solid #7c3642",
  color: "#fecdd3",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const heroProgressStyle = {
  display: "grid",
  gridTemplateColumns: ".7fr 1.3fr",
  gap: "26px",
  background: "#0e1d2f",
  border: "1px solid #263b53",
  borderRadius: "20px",
  padding: "26px",
  marginBottom: "16px",
};

const progressEyebrowStyle = {
  color: "#7f94ab",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.6px",
};

const progressNumberStyle = {
  marginTop: "5px",
  fontSize: "68px",
  lineHeight: 1,
  fontWeight: 900,
};

const progressCopyStyle = {
  color: "#9aadc1",
  marginTop: "8px",
  fontSize: "12px",
  lineHeight: 1.6,
};

const progressRightStyle = {
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const progressTrackStyle = {
  height: "13px",
  background: "#07111f",
  border: "1px solid #263b53",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressBarStyle = {
  height: "100%",
  background: "#f4b82d",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: "10px",
  marginTop: "16px",
};

const summaryMetricStyle = {
  background: "#081526",
  border: "1px solid #22374f",
  borderRadius: "11px",
  padding: "13px",
};

const summaryMetricLabelStyle = {
  color: "#70869d",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: "1.2px",
};

const summaryMetricValueStyle = {
  marginTop: "6px",
  fontSize: "19px",
  fontWeight: 900,
};

const nextStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
  background: "#3a2b08",
  border: "1px solid #856317",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "28px",
};

const nextEyebrowStyle = {
  color: "#f8d879",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.4px",
};

const nextTitleStyle = {
  marginTop: "5px",
  fontSize: "26px",
  fontWeight: 900,
};

const nextTextStyle = {
  color: "#d9c794",
  marginTop: "5px",
  fontSize: "12px",
};

const nextButtonStyle = {
  background: "#f4b82d",
  color: "#08111f",
  border: 0,
  borderRadius: "9px",
  padding: "12px 15px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const groupStyle = {
  marginTop: "30px",
};

const groupHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
  marginBottom: "12px",
};

const groupNumberStyle = {
  color: "#f4b82d",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1.5px",
};

const groupTitleStyle = {
  marginTop: "4px",
  fontSize: "27px",
  fontWeight: 900,
};

const groupStatusStyle = {
  color: "#768ca4",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const stepGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: "12px",
};

const stepCardStyle = {
  minHeight: "235px",
  background: "#0e1d2f",
  border: "1px solid #263b53",
  borderRadius: "15px",
  padding: "18px",
  display: "flex",
  flexDirection: "column" as const,
};

const completeStepStyle = {
  border: "1px solid #285a43",
  background: "#0e211c",
};

const blockerStepStyle = {
  border: "1px solid #78404a",
  background: "#25171d",
};

const stepTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  alignItems: "center",
};

const statusIconStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "#07111f",
  border: "1px solid #32475f",
  fontWeight: 900,
};

const statusPillStyle = {
  borderRadius: "999px",
  padding: "6px 8px",
  fontSize: "7px",
  fontWeight: 900,
  letterSpacing: ".7px",
};

const completePillStyle = {
  background: "#133925",
  color: "#86efac",
};

const blockerPillStyle = {
  background: "#4b1d26",
  color: "#fecdd3",
};

const optionalPillStyle = {
  background: "#30280f",
  color: "#fde68a",
};

const stepTitleStyle = {
  margin: "20px 0 7px",
  fontSize: "21px",
  fontWeight: 900,
};

const stepTextStyle = {
  color: "#94a7bb",
  fontSize: "12px",
  lineHeight: 1.6,
  margin: 0,
};

const actionButtonStyle = {
  marginTop: "auto",
  alignSelf: "flex-start",
  background: "#f4b82d",
  color: "#08111f",
  border: 0,
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const blockerButtonStyle = {
  ...actionButtonStyle,
  background: "#ef5967",
  color: "#ffffff",
};

const reviewButtonStyle = {
  marginTop: "auto",
  alignSelf: "flex-start",
  background: "#133925",
  color: "#a7f3d0",
  border: "1px solid #286846",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const launchCardStyle = {
  marginTop: "34px",
  background: "#28191d",
  border: "1px solid #70404a",
  borderRadius: "18px",
  padding: "24px",
  display: "flex",
  justifyContent: "space-between",
  gap: "22px",
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const launchReadyStyle = {
  background: "#10291f",
  border: "1px solid #347150",
};

const launchTitleStyle = {
  margin: "7px 0",
  fontSize: "30px",
  fontWeight: 900,
};

const launchTextStyle = {
  color: "#a7b7c7",
  margin: 0,
  fontSize: "12px",
  lineHeight: 1.6,
};

const launchButtonStyle = {
  background: "#22c55e",
  color: "#052e16",
  border: 0,
  borderRadius: "9px",
  padding: "13px 16px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const disabledLaunchButtonStyle = {
  background: "#38262b",
  color: "#8f7077",
  border: "1px solid #5d3a43",
  borderRadius: "9px",
  padding: "13px 16px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "not-allowed",
};

