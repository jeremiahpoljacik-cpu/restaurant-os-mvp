"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Subscription = {
  id: string;
  restaurant_id: string;
  plan: string;
  status: "trial" | "active" | "past_due" | "canceled" | "paused";
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

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);

    const { data: existing, error: subscriptionError } = await supabase
      .from("restaurant_subscriptions")
      .select("*")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (subscriptionError) {
      setMessage(subscriptionError.message);
      setLoading(false);
      return;
    }

    if (existing) {
      setSubscription(existing);
      setLoading(false);
      return;
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { data: created, error: createError } = await supabase
      .from("restaurant_subscriptions")
      .insert({
        restaurant_id: id,
        plan: "founder",
        status: "trial",
        trial_ends_at: trialEnd.toISOString(),
      })
      .select("*")
      .single();

    if (createError) {
      setMessage(createError.message);
      setLoading(false);
      return;
    }

    setSubscription(created);
    setLoading(false);
  }

  async function startCheckout() {
    if (!restaurantId) return;

    setCheckoutLoading(true);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setCheckoutLoading(false);
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
      setMessage(data.error || "Unable to start checkout.");
      setCheckoutLoading(false);
      return;
    }

    window.location.href = data.checkout_url;
  }

  function daysLeft() {
    if (!subscription?.trial_ends_at) return null;

    const diff =
      new Date(subscription.trial_ends_at).getTime() - new Date().getTime();

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const statusLabel = subscription?.status?.replace("_", " ").toUpperCase();

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading billing...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Billing</h1>
            <p style={subStyle}>
              {restaurantName} — manage your Restaurant OS subscription.
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

        <section style={statusPanelStyle}>
          <div>
            <div style={eyebrowStyle}>CURRENT ACCESS</div>
            <h2 style={statusTitleStyle}>
              {statusLabel || "NOT ACTIVE"}
            </h2>

            {subscription?.status === "trial" && (
              <p style={statusTextStyle}>
                Your founder trial has {daysLeft()} day
                {daysLeft() === 1 ? "" : "s"} remaining.
              </p>
            )}

            {subscription?.status === "active" && (
              <p style={statusTextStyle}>
                Your Restaurant OS subscription is active.
              </p>
            )}

            {subscription?.status === "past_due" && (
              <p style={statusTextStyle}>
                Payment is past due. Update billing to keep your account active.
              </p>
            )}
          </div>

          <div style={statusBadgeStyle}>{statusLabel}</div>
        </section>

        <section style={planCardStyle}>
          <div style={planTopStyle}>
            <div>
              <div style={eyebrowStyle}>PLAN</div>
              <h2 style={planTitleStyle}>Founder Plan</h2>
              <p style={planTextStyle}>
                Website, menu, VIP customers, offers, campaigns, attribution,
                redemption tracking and Restaurant OS owner tools.
              </p>
            </div>

            <div style={priceBlockStyle}>
              <div style={priceStyle}>$99</div>
              <div style={priceMetaStyle}>/ MONTH</div>
            </div>
          </div>

          <div style={featuresGridStyle}>
            <Feature text="Restaurant website" />
            <Feature text="Menu manager" />
            <Feature text="VIP customer database" />
            <Feature text="Offers & redemptions" />
            <Feature text="Campaign tracking" />
            <Feature text="Campaign attribution" />
            <Feature text="Owner dashboard" />
            <Feature text="Founder access" />
          </div>

          <button
            style={primaryButtonStyle}
            onClick={startCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading
              ? "OPENING CHECKOUT..."
              : subscription?.status === "active"
              ? "MANAGE SUBSCRIPTION"
              : "ACTIVATE FOUNDER PLAN"}
          </button>
        </section>

        <section style={noticeStyle}>
          <div style={eyebrowStyle}>NEXT BILLING STEP</div>
          <div style={noticeTitleStyle}>
            Connect secure checkout + automatic subscription status.
          </div>
          <p style={noticeTextStyle}>
            Checkout is now connected. The next build is the Stripe webhook
            that writes successful billing status back into Restaurant OS
            automatically.
          </p>
        </section>
      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div style={featureStyle}>
      <span style={checkStyle}>✓</span>
      <span>{text}</span>
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
  fontSize: "clamp(42px,7vw,72px)",
  lineHeight: ".95",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const statusPanelStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
  marginBottom: "18px",
};

const statusTitleStyle = {
  fontSize: "34px",
  margin: "6px 0 8px",
};

const statusTextStyle = {
  color: "#94a3b8",
  margin: 0,
};

const statusBadgeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "999px",
  padding: "10px 14px",
  fontSize: "11px",
  fontWeight: 900,
  color: "#f5b82e",
};

const planCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "26px",
};

const planTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  flexWrap: "wrap" as const,
};

const planTitleStyle = {
  fontSize: "36px",
  margin: "7px 0 10px",
};

const planTextStyle = {
  color: "#94a3b8",
  maxWidth: "650px",
  lineHeight: 1.55,
};

const priceBlockStyle = {
  textAlign: "right" as const,
};

const priceStyle = {
  fontSize: "52px",
  fontWeight: 900,
};

const priceMetaStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const featuresGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "10px",
  margin: "24px 0",
};

const featureStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "10px",
  padding: "12px",
  color: "#cbd5e1",
  fontSize: "13px",
};

const checkStyle = {
  color: "#f5b82e",
  fontWeight: 900,
};

const primaryButtonStyle = {
  width: "100%",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "15px",
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

const noticeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "22px",
  marginTop: "18px",
};

const noticeTitleStyle = {
  fontSize: "22px",
  fontWeight: 900,
  marginTop: "6px",
};

const noticeTextStyle = {
  color: "#94a3b8",
  lineHeight: 1.55,
  marginBottom: 0,
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};
