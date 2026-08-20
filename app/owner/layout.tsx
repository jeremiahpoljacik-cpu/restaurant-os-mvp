"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    checkAccess();
  }, [pathname]);

  async function checkAccess() {
    setChecking(true);
    setAllowed(false);

    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get("restaurant");

    if (!restaurantId) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    setRestaurantId(restaurantId);

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

    if (subscriptionError || !subscription) {
      window.location.href = `/owner/billing?restaurant=${restaurantId}&access=required`;
      return;
    }

    setSubscriptionStatus(subscription.status);

    if (subscription.status === "trial" && subscription.trial_ends_at) {
      const msLeft =
        new Date(subscription.trial_ends_at).getTime() - Date.now();
      setTrialDaysLeft(Math.max(0, Math.ceil(msLeft / 86400000)));
    } else {
      setTrialDaysLeft(null);
    }

    if (subscription.status === "active") {
      setAllowed(true);
      setChecking(false);
      return;
    }

    if (subscription.status === "trial") {
      if (
        !subscription.trial_ends_at ||
        new Date(subscription.trial_ends_at).getTime() > Date.now()
      ) {
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

  if (!allowed) return null;

  return (
    <>
      {pathname !== "/owner/billing" &&
        restaurantId &&
        subscriptionStatus === "trial" &&
        trialDaysLeft !== null && (
          <div style={trialBannerStyle}>
            <div style={trialBannerInnerStyle}>
              <div>
                <span style={trialLabelStyle}>FOUNDER TRIAL</span>
                <span style={trialTextStyle}>
                  {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} remaining
                </span>
              </div>

              <button
                style={trialButtonStyle}
                onClick={() => {
                  window.location.href = `/owner/billing?restaurant=${restaurantId}`;
                }}
              >
                ACTIVATE $99/MO
              </button>
            </div>
          </div>
        )}

      <style jsx global>{`
        @media (max-width: 768px) {
          html,
          body {
            overflow-x: hidden;
          }

          body {
            -webkit-text-size-adjust: 100%;
          }

          main {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          button,
          a {
            min-height: 44px;
          }

          input,
          select,
          textarea {
            font-size: 16px !important;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          table {
            display: block;
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 520px) {
          main {
            padding-top: 18px !important;
            padding-bottom: 24px !important;
          }

          h1 {
            word-break: break-word;
          }

          button {
            width: 100%;
          }
        }
      `}</style>

      {children}
    </>
  );
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


const trialBannerStyle = {
  background: "#f5b82e",
  color: "#08111f",
  borderBottom: "1px solid #c99116",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const trialBannerInnerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "10px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const trialLabelStyle = {
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1.2px",
  marginRight: "10px",
};

const trialTextStyle = {
  fontSize: "13px",
  fontWeight: 800,
};

const trialButtonStyle = {
  background: "#08111f",
  color: "#ffffff",
  border: 0,
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  minHeight: "40px",
};
