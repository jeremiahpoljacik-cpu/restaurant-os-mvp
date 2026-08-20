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

export default function OwnerPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const params = new URLSearchParams(window.location.search);
        const restaurantId = params.get("restaurant");

        if (!restaurantId) {
          setMessage("No restaurant was selected.");
          setLoading(false);
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setMessage(userError.message);
          setLoading(false);
          return;
        }

        if (!user) {
          setMessage("You are not signed in.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }

        if (!data) {
          setMessage("Restaurant not found.");
          setLoading(false);
          return;
        }

        setRestaurant(data);
        setLoading(false);
      } catch (err: any) {
        setMessage(err?.message || "Could not load restaurant.");
        setLoading(false);
      }
    }

    loadRestaurant();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={{ fontSize: "32px" }}>Loading workspace...</h1>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={{ fontSize: "32px" }}>Workspace unavailable</h1>

          <p style={{ color: "#94a3b8" }}>
            {message || "Restaurant not found."}
          </p>

          <button
            onClick={() => (window.location.href = "/")}
            style={primaryButtonStyle}
          >
            BACK HOME
          </button>
        </div>
      </main>
    );
  }

  const restaurantId = restaurant.id;

  const fullAddress = [
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
        <header style={topRowStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>

            <h1 style={titleStyle}>{restaurant.name}</h1>

            <div style={statusStyle}>
              WORKSPACE STATUS: {restaurant.status.toUpperCase()}
            </div>
          </div>

          <button onClick={signOut} style={secondaryButtonStyle}>
            SIGN OUT
          </button>
        </header>

        <section style={welcomeStyle}>
          <div>
            <div style={eyebrowStyle}>OWNER COMMAND CENTER</div>

            <h2 style={welcomeTitleStyle}>
              Your restaurant.
              <br />
              Your customers.
              <br />
              Your control.
            </h2>

            <p style={welcomeTextStyle}>
              Manage your website, menu, ordering, VIP customers and marketing
              from one place.
            </p>
          </div>
        </section>

        <section style={gridStyle}>
          <DashboardCard
            icon="🌐"
            title="WEBSITE"
            description="Manage branding, photos, restaurant content and your public website."
            action="MANAGE SITE"
            onClick={() =>
              (window.location.href = `/owner/website?restaurant=${restaurantId}`)
            }
          />

          <DashboardCard
            icon="🍽️"
            title="MENU"
            description="Add categories, menu items, pricing, descriptions and availability."
            action="MANAGE MENU"
            onClick={() =>
              (window.location.href = `/owner/menu?restaurant=${restaurantId}`)
            }
          />

          <DashboardCard
            icon="⭐"
            title="VIP CUSTOMERS"
            description="Build and manage your restaurant customer list."
            action="VIEW VIPS"
            onClick={() =>
              (window.location.href = `/owner/vip?restaurant=${restaurantId}`)
            }
          />

          <DashboardCard
            icon="🔥"
            title="OFFERS"
            description="Create promotions, birthday offers and customer campaigns."
            action="CREATE OFFER"
            onClick={() =>
              (window.location.href = `/owner/offers?restaurant=${restaurantId}`)
            }
          />

          <DashboardCard
            icon="🛍️"
            title="ORDERING"
            description="Manage ordering links, catering and third-party delivery."
            action="ORDERING SETTINGS"
            onClick={() =>
              (window.location.href = `/owner/settings?restaurant=${restaurantId}`)
            }
          />

          <DashboardCard
            icon="⚙️"
            title="BUSINESS SETTINGS"
            description="Update hours, phone, address and restaurant information."
            action="EDIT SETTINGS"
            onClick={() =>
              (window.location.href = `/owner/settings?restaurant=${restaurantId}`)
            }
          />
        </section>

        <section style={detailsStyle}>
          <div style={eyebrowStyle}>RESTAURANT PROFILE</div>

          <div style={detailsGridStyle}>
            <Info
              label="CUISINE"
              value={restaurant.cuisine_category || "Not set"}
            />

            <Info
              label="PHONE"
              value={restaurant.phone || "Not set"}
            />

            <Info
              label="ADDRESS"
              value={fullAddress || "Not set"}
            />

            <Info
              label="STATUS"
              value={restaurant.status.toUpperCase()}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <article style={cardStyle}>
      <div>
        <div style={iconStyle}>{icon}</div>

        <div style={cardTitleStyle}>{title}</div>

        <p style={cardTextStyle}>{description}</p>
      </div>

      <button style={primaryButtonStyle} onClick={onClick}>
        {action}
      </button>
    </article>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #08111f 0%, #0d1c2f 55%, #07101c 100%)",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  gap: "20px",
  marginBottom: "28px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(42px, 7vw, 76px)",
  lineHeight: ".94",
  margin: "10px 0",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const statusStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 800,
};

const welcomeStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "20px",
  padding: "32px",
  marginBottom: "20px",
};

const welcomeTitleStyle = {
  fontSize: "clamp(32px, 5vw, 54px)",
  lineHeight: ".96",
  margin: "12px 0 16px",
  fontWeight: 900,
  letterSpacing: "-1px",
};

const welcomeTextStyle = {
  color: "#94a3b8",
  lineHeight: 1.6,
  maxWidth: "620px",
  margin: 0,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const cardStyle = {
  minHeight: "235px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
};

const iconStyle = {
  fontSize: "30px",
  marginBottom: "18px",
};

const cardTitleStyle = {
  fontSize: "20px",
  fontWeight: 900,
};

const cardTextStyle = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.55,
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

const detailsStyle = {
  marginTop: "20px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "24px",
  marginTop: "20px",
};

const infoLabelStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "7px",
};

const infoValueStyle = {
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 700,
};
