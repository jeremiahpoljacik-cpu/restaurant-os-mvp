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

  useEffect(() => { load(); }, []);

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

    const { data: { user } } = await supabase.auth.getUser();

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
      const { data: { session } } = await supabase.auth.getSession();

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
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || "Unable to open checkout.");
      }

      window.location.assign(data.checkout_url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
      setCheckoutLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

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
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });

      const data = await response.json();

      if (!response.ok || !data.portal_url) {
        throw new Error(data.error || "Unable to open billing portal.");
      }

      window.location.assign(data.portal_url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open billing.");
      setPortalLoading(false);
    }
  }

  if (loading) {
    return <main style={page}><div style={shell}>Loading billing...</div></main>;
  }

  const status = String(subscription?.status || "inactive").toUpperCase();
  const active = subscription?.status === "active";
  const hasCustomer = Boolean(subscription?.provider_customer_id);

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>RESTAURANT OS</div>
            <h1 style={title}>Billing</h1>
            <p style={sub}>{restaurantName}</p>
          </div>

          <button
            style={secondary}
            onClick={() => window.location.href = `/owner?restaurant=${restaurantId}`}
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={notice}>{message}</div>}

        <section style={statusCard}>
          <div>
            <div style={eyebrow}>CURRENT ACCESS</div>
            <div style={statusTitle}>{active ? "ACTIVE" : status}</div>
            <p style={copy}>
              {active
                ? "Restaurant OS is active and ready to use."
                : "Activate Restaurant OS to unlock your full growth operating system."}
            </p>
          </div>
          <div style={badge}>{status}</div>
        </section>

        <section style={planCard}>
          <div>
            <div style={eyebrow}>ONE SIMPLE PLAN</div>
            <h2 style={planTitle}>Restaurant OS</h2>
            <p style={copy}>
              Website, menu, VIP database, loyalty, offers, QR codes, text and
              email campaigns, campaign tracking, reviews, catering tools and
              the Owner Command Center.
            </p>
          </div>

          <div style={priceWrap}>
            <div style={price}>$375</div>
            <div style={priceMeta}>/ MONTH</div>
            <div style={weekly}>ABOUT $87/WEEK</div>
          </div>

          <button
            style={primary}
            disabled={checkoutLoading || portalLoading}
            onClick={hasCustomer ? openPortal : startCheckout}
          >
            {hasCustomer
              ? portalLoading ? "OPENING..." : "MANAGE BILLING"
              : checkoutLoading ? "OPENING CHECKOUT..." : "ACTIVATE RESTAURANT OS"}
          </button>
        </section>
      </div>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#050505",
  color: "#fff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shell = { maxWidth: "1080px", margin: "0 auto" };
const header = { display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const, marginBottom: "24px" };
const eyebrow = { color: "#e1222d", fontSize: "10px", fontWeight: 900, letterSpacing: "1.8px" };
const title = { fontSize: "60px", margin: "8px 0", letterSpacing: "-3px" };
const sub = { color: "#777" };
const secondary = { border: "1px solid #303030", borderRadius: "8px", background: "#111", color: "#fff", padding: "11px 13px", fontWeight: 900, cursor: "pointer" };
const notice = { border: "1px solid #54272a", borderRadius: "10px", padding: "12px", marginBottom: "14px", background: "#16090a", color: "#ff969c" };
const statusCard = { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "center", flexWrap: "wrap" as const, border: "1px solid #252525", borderRadius: "14px", padding: "22px", background: "#0c0c0c" };
const statusTitle = { fontSize: "34px", fontWeight: 900, marginTop: "6px" };
const copy = { color: "#888", lineHeight: 1.55, maxWidth: "650px" };
const badge = { border: "1px solid #444", borderRadius: "999px", padding: "8px 11px", fontSize: "10px", fontWeight: 900 };
const planCard = { marginTop: "14px", border: "1px solid #6a262c", borderRadius: "16px", padding: "26px", background: "linear-gradient(135deg,#17090a,#0c0c0c)" };
const planTitle = { fontSize: "36px", margin: "7px 0 5px" };
const priceWrap = { margin: "24px 0" };
const price = { fontSize: "66px", fontWeight: 900, letterSpacing: "-4px" };
const priceMeta = { color: "#777", fontSize: "10px", fontWeight: 900 };
const weekly = { color: "#e1222d", fontSize: "10px", fontWeight: 900, marginTop: "7px" };
const primary = { width: "100%", border: 0, borderRadius: "9px", background: "#e1222d", color: "#fff", padding: "14px", fontWeight: 900, cursor: "pointer" };
