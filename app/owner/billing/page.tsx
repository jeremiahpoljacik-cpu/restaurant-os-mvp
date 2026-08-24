"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Subscription = {
  id: string;
  restaurant_id: string;
  plan: string;
  status: string;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
};

export default function OwnerBillingPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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

    if (params.get("checkout") === "success") {
      setMessage("Payment completed. Confirming Restaurant OS access...");
    } else if (params.get("checkout") === "canceled") {
      setMessage("Checkout canceled. No billing change was made.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id,name")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!restaurant) {
      setMessage("Restaurant not found or access denied.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);

    const { data: sub, error } = await supabase
      .from("restaurant_subscriptions")
      .select("*")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    } else {
      setSubscription(sub);
    }

    setLoading(false);
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || "Unable to open checkout.");
      }

      window.location.assign(data.checkout_url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start checkout."
      );
      setCheckoutLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.portal_url) {
        throw new Error(data.error || "Unable to open billing portal.");
      }

      window.location.assign(data.portal_url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open billing."
      );
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading billing...</div>
      </main>
    );
  }

  const status = String(subscription?.status || "inactive").toUpperCase();
  const active = subscription?.status === "active";
  const hasCustomer = Boolean(subscription?.provider_customer_id);

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Billing</h1>
            <p style={subStyle}>{restaurantName}</p>
          </div>

          <button
            style={secondaryStyle}
            onClick={() =>
              (window.location.href = `/owner?restaurant=${restaurantId}`)
            }
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={noticeStyle}>{message}</div>}

        <section style={statusCardStyle}>
          <div>
            <div style={eyebrowStyle}>CURRENT ACCESS</div>
            <div style={statusTitleStyle}>
              {active ? "ACTIVE" : status}
            </div>
            <p style={copyStyle}>
              {active
                ? "Restaurant OS is active and ready to use."
                : "Activate Restaurant OS to unlock your full growth operating system."}
            </p>
          </div>

          <div style={badgeStyle}>{status}</div>
        </section>

        <section style={planCardStyle}>
          <div>
            <div style={eyebrowStyle}>ONE SIMPLE PLAN</div>
            <h2 style={planTitleStyle}>Restaurant OS</h2>
            <p style={copyStyle}>
              Website, menu, VIP database, loyalty, offers, QR codes, text and
              email campaigns, campaign tracking, reviews, catering tools and
              the Owner Command Center.
            </p>
          </div>

          <div style={priceWrapStyle}>
            <div style={priceStyle}>$375</div>
            <div style={priceMetaStyle}>/ MONTH</div>
            <div style={weeklyStyle}>ABOUT $87/WEEK</div>
          </div>

          <button
            style={primaryStyle}
            disabled={checkoutLoading || portalLoading}
            onClick={hasCustomer ? openPortal : startCheckout}
          >
            {hasCustomer
              ? portalLoading
                ? "OPENING..."
                : "MANAGE BILLING"
              : checkoutLoading
              ? "OPENING CHECKOUT..."
              : "ACTIVATE RESTAURANT OS"}
          </button>
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#050505",
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
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#e1222d",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1.8px",
};

const titleStyle = {
  fontSize: "60px",
  margin: "8px 0",
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#777777",
};

const secondaryStyle = {
  border: "1px solid #303030",
  borderRadius: "8px",
  background: "#111111",
  color: "#ffffff",
  padding: "11px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const noticeStyle = {
  border: "1px solid #54272a",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "14px",
  background: "#16090a",
  color: "#ff969c",
};

const statusCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "center",
  flexWrap: "wrap" as const,
  border: "1px solid #252525",
  borderRadius: "14px",
  padding: "22px",
  background: "#0c0c0c",
};

const statusTitleStyle = {
  fontSize: "34px",
  fontWeight: 900,
  marginTop: "6px",
};

const copyStyle = {
  color: "#888888",
  lineHeight: 1.55,
  maxWidth: "650px",
};

const badgeStyle = {
  border: "1px solid #444444",
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "10px",
  fontWeight: 900,
};

const planCardStyle = {
  marginTop: "14px",
  border: "1px solid #6a262c",
  borderRadius: "16px",
  padding: "26px",
  background: "linear-gradient(135deg,#17090a,#0c0c0c)",
};

const planTitleStyle = {
  fontSize: "36px",
  margin: "7px 0 5px",
};

const priceWrapStyle = {
  margin: "24px 0",
};

const priceStyle = {
  fontSize: "66px",
  fontWeight: 900,
  letterSpacing: "-4px",
};

const priceMetaStyle = {
  color: "#777777",
  fontSize: "10px",
  fontWeight: 900,
};

const weeklyStyle = {
  color: "#e1222d",
  fontSize: "10px",
  fontWeight: 900,
  marginTop: "7px",
};

const primaryStyle = {
  width: "100%",
  border: 0,
  borderRadius: "9px",
  background: "#e1222d",
  color: "#ffffff",
  padding: "14px",
  fontWeight: 900,
  cursor: "pointer",
};
