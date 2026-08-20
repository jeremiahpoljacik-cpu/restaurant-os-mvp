"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

type SubscriptionRow = {
  status: "trial" | "active" | "past_due" | "canceled" | "paused";
  trial_ends_at: string | null;
};

export default function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [pathname, searchParams]);

  async function checkAccess() {
    setChecking(true);
    setAllowed(false);

    const restaurantId = searchParams.get("restaurant");

    if (!restaurantId) {
      setAllowed(true);
      setChecking(false);
      return;
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
      .select("id")
      .eq("id", restaurantId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      window.location.href = "/login";
      return;
    }

    // Billing must always remain accessible so owners can activate,
    // repair payment, or manage a canceled/past-due subscription.
    if (pathname === "/owner/billing") {
      setAllowed(true);
      setChecking(false);
      return;
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("restaurant_subscriptions")
      .select("status,trial_ends_at")
      .eq("restaurant_id", restaurantId)
      .maybeSingle<SubscriptionRow>();

    if (subscriptionError) {
      window.location.href = `/owner/billing?restaurant=${restaurantId}&access=required`;
      return;
    }

    if (!subscription) {
      window.location.href = `/owner/billing?restaurant=${restaurantId}&access=required`;
      return;
    }

    if (subscription.status === "active") {
      setAllowed(true);
      setChecking(false);
      return;
    }

    if (subscription.status === "trial") {
      if (!subscription.trial_ends_at) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      const trialEnd = new Date(subscription.trial_ends_at).getTime();

      if (trialEnd > Date.now()) {
        setAllowed(true);
        setChecking(false);
        return;
      }
    }

    window.location.href = `/owner/billing?restaurant=${restaurantId}&access=required`;
  }

  if (checking) {
    return (
      <main style={loadingPageStyle}>
        <div style={loadingCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <div style={loadingTitleStyle}>Checking access...</div>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}

const loadingPageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "28px",
  minWidth: "280px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const loadingTitleStyle = {
  fontSize: "24px",
  fontWeight: 900,
  marginTop: "8px",
};
