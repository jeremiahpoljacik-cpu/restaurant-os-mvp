"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<
    "checking" | "allowed" | "denied"
  >("checking");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("platform_admins")
      .select("user_id,role,active")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      setState("denied");
      return;
    }

    setState("allowed");
  }

  if (state === "checking") {
    return (
      <main style={loadingPageStyle}>
        <div style={loadingCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <div style={loadingTitleStyle}>Checking Admin Access...</div>
        </div>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main style={loadingPageStyle}>
        <div style={deniedCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={deniedTitleStyle}>Admin Access Required</h1>
          <p style={deniedTextStyle}>
            This area is restricted to authorized Restaurant OS platform administrators.
          </p>

          <button
            style={buttonStyle}
            onClick={() => {
              window.location.href = "/owner";
            }}
          >
            RETURN TO OWNER DASHBOARD
          </button>
        </div>
      </main>
    );
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
  minWidth: "320px",
};

const deniedCardStyle = {
  ...loadingCardStyle,
  maxWidth: "560px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const loadingTitleStyle = {
  marginTop: "8px",
  fontSize: "22px",
  fontWeight: 900,
};

const deniedTitleStyle = {
  margin: "8px 0 10px",
  fontSize: "36px",
};

const deniedTextStyle = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.6,
};

const buttonStyle = {
  marginTop: "16px",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};
