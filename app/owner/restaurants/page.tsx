"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  cuisine_category: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  created_at: string;
  readiness_percent?: number;
  readiness_label?: string;
};

export default function OwnerRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .select(
        "id,name,cuisine_category,phone,city,state,status,created_at"
      )
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const baseRestaurants = data || [];

    const enriched = await Promise.all(
      baseRestaurants.map(async (restaurant) => {
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
            .eq("restaurant_id", restaurant.id)
            .maybeSingle(),

          supabase
            .from("restaurant_hours")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .maybeSingle(),

          supabase
            .from("restaurant_website_settings")
            .select("hero_headline,about_body,published")
            .eq("restaurant_id", restaurant.id)
            .maybeSingle(),

          supabase
            .from("restaurant_menu_items")
            .select("id")
            .eq("restaurant_id", restaurant.id)
            .limit(1),

          supabase
            .from("restaurant_subscriptions")
            .select("status,trial_ends_at")
            .eq("restaurant_id", restaurant.id)
            .maybeSingle(),
        ]);

        const businessComplete = Boolean(
          restaurant.phone &&
            restaurant.city &&
            restaurant.state
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

        const label =
          percent === 100
            ? "READY"
            : percent >= 70
            ? "ALMOST READY"
            : percent >= 40
            ? "IN PROGRESS"
            : "NEEDS SETUP";

        return {
          ...restaurant,
          readiness_percent: percent,
          readiness_label: label,
        };
      })
    );

    setRestaurants(enriched);
    setLoading(false);
  }

  const total = restaurants.length;

  const liveCount = useMemo(
    () =>
      restaurants.filter((restaurant) =>
        ["active", "live", "published"].includes(
          (restaurant.status || "").toLowerCase()
        )
      ).length,
    [restaurants]
  );

  function openRestaurant(id: string) {
    window.location.href = `/owner?restaurant=${id}`;
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading restaurants...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Your Restaurants</h1>
            <p style={subStyle}>
              Choose the restaurant you want to manage.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = "/owner/restaurants/new")
              }
            >
              + ADD RESTAURANT
            </button>

            <button style={secondaryButtonStyle} onClick={signOut}>
              SIGN OUT
            </button>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={statsGridStyle}>
          <Stat label="RESTAURANTS" value={total} />
          <Stat label="LIVE / ACTIVE" value={liveCount} />
        </section>

        {restaurants.length === 0 ? (
          <section style={emptyStyle}>
            <div style={emptyTitleStyle}>No restaurants yet.</div>
            <p style={emptyTextStyle}>
              Create your first Restaurant OS workspace to get started.
            </p>

            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = "/owner/restaurants/new")
              }
            >
              CREATE RESTAURANT
            </button>
          </section>
        ) : (
          <section style={restaurantGridStyle}>
            {restaurants.map((restaurant, index) => {
              const location = [restaurant.city, restaurant.state]
                .filter(Boolean)
                .join(", ");

              return (
                <article key={restaurant.id} style={restaurantCardStyle}>
                  <div style={cardTopStyle}>
                    <div style={numberStyle}>
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div style={statusBadgeStyle}>
                      {(restaurant.status || "draft").toUpperCase()}
                    </div>
                  </div>

                  <div style={readinessWrapStyle}>
                    <div style={readinessTopStyle}>
                      <span style={readinessLabelStyle}>
                        {restaurant.readiness_label || "NEEDS SETUP"}
                      </span>
                      <span style={readinessPercentStyle}>
                        {restaurant.readiness_percent || 0}%
                      </span>
                    </div>

                    <div style={readinessTrackStyle}>
                      <div
                        style={{
                          ...readinessBarStyle,
                          width: `${restaurant.readiness_percent || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <h2 style={restaurantNameStyle}>{restaurant.name}</h2>

                  <div style={metaStyle}>
                    {restaurant.cuisine_category || "RESTAURANT"}
                  </div>

                  {location && (
                    <div style={detailStyle}>📍 {location}</div>
                  )}

                  {restaurant.phone && (
                    <div style={detailStyle}>☎ {restaurant.phone}</div>
                  )}

                  <div style={buttonStackStyle}>
                    <button
                      style={primaryButtonStyle}
                      onClick={() => openRestaurant(restaurant.id)}
                    >
                      OPEN COMMAND CENTER
                    </button>

                    <button
                      style={secondaryButtonStyle}
                      onClick={() =>
                        (window.location.href =
                          `/owner/setup?restaurant=${restaurant.id}`)
                      }
                    >
                      VIEW LAUNCH CHECKLIST
                    </button>

                    <button
                      style={secondaryButtonStyle}
                      onClick={() =>
                        (window.location.href =
                          `/owner/qa?restaurant=${restaurant.id}`)
                      }
                    >
                      RUN SYSTEM CHECK
                    </button>
                  </div>
                </article>
              );
            })}
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
  value: number;
}) {
  return (
    <div style={statStyle}>
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
  fontSize: "clamp(46px,7vw,78px)",
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
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const restaurantGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
  gap: "16px",
};

const restaurantCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  display: "flex",
  flexDirection: "column" as const,
  minHeight: "300px",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const numberStyle = {
  color: "#f5b82e",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const statusBadgeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "999px",
  padding: "7px 10px",
  color: "#cbd5e1",
  fontSize: "9px",
  fontWeight: 900,
};

const readinessWrapStyle = {
  marginTop: "18px",
  padding: "13px",
  background: "#0b1726",
  border: "1px solid #23364d",
  borderRadius: "12px",
};

const readinessTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "9px",
};

const readinessLabelStyle = {
  color: "#cbd5e1",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const readinessPercentStyle = {
  color: "#f5b82e",
  fontSize: "13px",
  fontWeight: 900,
};

const readinessTrackStyle = {
  height: "8px",
  background: "#08111f",
  borderRadius: "999px",
  overflow: "hidden",
};

const readinessBarStyle = {
  height: "100%",
  background: "#f5b82e",
  borderRadius: "999px",
};

const restaurantNameStyle = {
  fontSize: "30px",
  lineHeight: 1,
  margin: "22px 0 8px",
  fontWeight: 900,
  letterSpacing: "-1px",
};

const metaStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "18px",
};

const detailStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  marginBottom: "8px",
};

const buttonStackStyle = {
  display: "grid",
  gap: "10px",
  marginTop: "auto",
  paddingTop: "20px",
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

const emptyStyle = {
  background: "#0f1d2e",
  border: "1px dashed #334155",
  borderRadius: "18px",
  padding: "44px 24px",
  textAlign: "center" as const,
};

const emptyTitleStyle = {
  fontSize: "26px",
  fontWeight: 900,
};

const emptyTextStyle = {
  color: "#64748b",
  margin: "8px 0 22px",
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};
