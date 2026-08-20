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
  const [portalLoading, setPortalLoading] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function waitForActiveSubscription(restaurantId: string) {
    setConfirmingPayment(true);

    for (let attempt = 0; attempt < 8; attempt++) {
      const { data } = await supabase
        .from("restaurant_subscriptions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (data?.status === "active") {
        setSubscription(data);
        setMessage("Payment confirmed. Your Restaurant OS subscription is ACTIVE.");
        setConfirmingPayment(false);
        window.history.replaceState(
          {},
          "",
          `/owner/billing?restaurant=${restaurantId}`
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setMessage(
      "Payment completed, but billing confirmation is still syncing. Refresh this page in a few seconds."
    );
    setConfirmingPayment(false);
  }

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant");

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const checkoutState = params.get("checkout");
    const accessState = params.get("access");

    if (checkoutState === "success") {
      setMessage("Payment completed. Confirming your subscription with Stripe...");
    } else if (checkoutState === "canceled") {
      setMessage("Checkout was canceled. Your current access has not changed.");
    } else if (accessState === "required") {
      setMessage("Subscription access is required to continue using Restaurant OS.");
    }

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

      if (checkoutState === "success" && existing.status !== "active") {
        waitForActiveSubscription(id);
      } else if (checkoutState === "success" && existing.status === "active") {
        setMessage("Payment confirmed. Your Restaurant OS subscription is ACTIVE.");
        window.history.replaceState(
          {},
          "",
          `/owner/billing?restaurant=${id}`
        );
      }

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

    if (checkoutState === "success") {
      waitForActiveSubscription(id);
    }
  }

  async function startCheckout() {
    if (!restaurantId || checkoutLoading) return;

    setCheckoutLoading(true);
    setMessage("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

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
        signal: controller.signal,
      });

      const raw = await response.text();

      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          `Checkout endpoint returned an unexpected response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Checkout failed with status ${response.status}.`
        );
      }

      if (!data.checkout_url) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.assign(data.checkout_url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage(
          "Checkout timed out after 20 seconds. The billing API is not responding."
        );
      } else {
        setMessage(
          error instanceof Error ? error.message : "Unable to start checkout."
        );
      }
      setCheckoutLoading(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function openBillingPortal() {
    if (!restaurantId || portalLoading) return;

    setPortalLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

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
          : "Unable to open billing portal."
      );
      setPortalLoading(false);
    }
  }

  function daysLeft() {
    if (!subscription?.trial_ends_at) return null;

    const diff =
      new Date(subscription.trial_ends_at).getTime() - new Date().getTime();

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const statusLabel = subscription?.status?.replace("_", " ").toUpperCase();

  const trialExpired =
    subscription?.status === "trial" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at).getTime() <= Date.now();

  const accessTitle =
    subscription?.status === "past_due"
      ? "PAYMENT PAST DUE"
      : subscription?.status === "canceled"
      ? "SUBSCRIPTION CANCELED"
      : subscription?.status === "paused"
      ? "SUBSCRIPTION PAUSED"
      : trialExpired
      ? "TRIAL EXPIRED"
      : subscription?.status === "active"
      ? "ACTIVE"
      : "TRIAL";

  const accessText =
    subscription?.status === "past_due"
      ? "Your payment needs attention before paid Restaurant OS tools can be used."
      : subscription?.status === "canceled"
      ? "Your subscription is canceled. Reactivate to restore paid Restaurant OS tools."
      : subscription?.status === "paused"
      ? "Your subscription is paused. Resume billing to restore paid Restaurant OS tools."
      : trialExpired
      ? "Your founder trial has ended. Activate the Founder Plan to continue using Restaurant OS."
      : subscription?.status === "active"
      ? "Your Restaurant OS subscription is active."
      : `Your founder trial has ${daysLeft()} day${daysLeft() === 1 ? "" : "s"} remaining.`;

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
            <h2 style={statusTitleStyle}>{accessTitle}</h2>
            <p style={statusTextStyle}>{accessText}</p>
          </div>

          <div style={statusBadgeStyle}>{accessTitle}</div>
        </section>

        {confirmingPayment && (
          <section style={syncCardStyle}>
            <div style={syncDotStyle} />
            <div>
              <div style={syncTitleStyle}>CONFIRMING PAYMENT</div>
              <div style={syncTextStyle}>
                Stripe checkout succeeded. Restaurant OS is waiting for the billing webhook to confirm ACTIVE status.
              </div>
            </div>
          </section>
        )}

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
            onClick={
              subscription?.provider_customer_id &&
              ["active", "past_due", "canceled", "paused"].includes(subscription.status)
                ? openBillingPortal
                : startCheckout
            }
            disabled={checkoutLoading || portalLoading}
          >
            {subscription?.provider_customer_id &&
            ["active", "past_due", "canceled", "paused"].includes(subscription.status)
              ? portalLoading
                ? "OPENING BILLING PORTAL..."
                : subscription.status === "active"
                ? "MANAGE SUBSCRIPTION"
                : "FIX BILLING / REACTIVATE"
              : checkoutLoading
              ? "OPENING CHECKOUT..."
              : "ACTIVATE FOUNDER PLAN"}
          </button>
        </section>

        <section style={noticeStyle}>
          <div style={eyebrowStyle}>
            {subscription?.status === "active" ? "BILLING READY" : "ACCESS CONTROL"}
          </div>
          <div style={noticeTitleStyle}>
            {subscription?.status === "active"
              ? "Your Restaurant OS subscription is active."
              : accessTitle}
          </div>
          <p style={noticeTextStyle}>
            {subscription?.status === "active"
              ? "Use Manage Subscription to update payment methods, view invoices, or manage your Stripe subscription securely."
              : accessText}
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

const syncCardStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "18px",
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const syncDotStyle = {
  width: "12px",
  height: "12px",
  borderRadius: "999px",
  background: "#f5b82e",
  flexShrink: 0,
};

const syncTitleStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const syncTextStyle = {
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.45,
  marginTop: "4px",
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
