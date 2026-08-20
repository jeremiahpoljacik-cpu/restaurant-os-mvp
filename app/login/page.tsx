"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function OwnerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setChecking(false);
      return;
    }

    await routeOwner(user.id);
  }

  async function routeOwner(userId: string) {
    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("id,name,created_at")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setChecking(false);
      setLoading(false);
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      window.location.href = "/onboarding";
      return;
    }

    if (restaurants.length === 1) {
      window.location.href = `/owner?restaurant=${restaurants[0].id}`;
      return;
    }

    window.location.href = `/owner?restaurant=${restaurants[0].id}`;
  }

  async function login(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      setMessage(error?.message || "Login failed.");
      setLoading(false);
      return;
    }

    await routeOwner(data.user.id);
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    setLoading(true);
    setMessage("");

    const redirectTo = `${window.location.origin}/login`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password reset email sent.");
  }

  if (checking) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>Checking your session...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={heroTitleStyle}>OWNER LOGIN</h1>
          <p style={heroTextStyle}>
            Sign in to manage your restaurant website, menu, VIP customers,
            offers, and redemption activity.
          </p>
        </section>

        <form onSubmit={login} style={formCardStyle}>
          <div style={formEyebrowStyle}>WELCOME BACK</div>
          <h2 style={formTitleStyle}>Sign In</h2>

          {message && <div style={messageStyle}>{message}</div>}

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={primaryButtonStyle}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

          <button
            type="button"
            onClick={forgotPassword}
            disabled={loading}
            style={linkButtonStyle}
          >
            FORGOT PASSWORD?
          </button>

          <div style={dividerStyle} />

          <a href="/onboarding" style={secondaryButtonStyle}>
            CREATE RESTAURANT ACCOUNT
          </a>
        </form>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #16304c 0, #08111f 42%, #05090f 100%)",
  color: "#ffffff",
  padding: "32px",
  fontFamily: "Arial, Helvetica, sans-serif",
  display: "grid",
  placeItems: "center",
};

const shellStyle = {
  width: "100%",
  maxWidth: "1080px",
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(360px,.7fr)",
  gap: "54px",
  alignItems: "center",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const heroTitleStyle = {
  fontSize: "clamp(58px,9vw,108px)",
  lineHeight: ".86",
  margin: "16px 0 22px",
  fontWeight: 900,
  letterSpacing: "-4px",
};

const heroTextStyle = {
  maxWidth: "620px",
  color: "#cbd5e1",
  fontSize: "20px",
  lineHeight: 1.6,
};

const formCardStyle = {
  background: "#f3eadc",
  color: "#07101c",
  borderRadius: "20px",
  padding: "30px",
  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
};

const formEyebrowStyle = {
  color: "#9a6500",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const formTitleStyle = {
  fontSize: "36px",
  margin: "8px 0 24px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#ffffff",
  color: "#07101c",
  border: "1px solid #c7b9a5",
  borderRadius: "10px",
  padding: "14px",
  fontSize: "15px",
};

const primaryButtonStyle = {
  width: "100%",
  background: "#f5b82e",
  color: "#07101c",
  border: 0,
  borderRadius: "10px",
  padding: "15px",
  fontWeight: 900,
  cursor: "pointer",
};

const linkButtonStyle = {
  width: "100%",
  background: "transparent",
  border: 0,
  color: "#6b645b",
  padding: "13px",
  fontWeight: 900,
  cursor: "pointer",
  marginTop: "4px",
};

const dividerStyle = {
  height: "1px",
  background: "#d8cab7",
  margin: "8px 0 18px",
};

const secondaryButtonStyle = {
  display: "block",
  textAlign: "center" as const,
  textDecoration: "none",
  color: "#07101c",
  border: "1px solid #9f927e",
  borderRadius: "10px",
  padding: "14px",
  fontWeight: 900,
};

const messageStyle = {
  background: "#fff4d3",
  border: "1px solid #e7c86a",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "13px",
  marginBottom: "16px",
};

const cardStyle = {
  maxWidth: "520px",
  background: "#0f1d2e",
  border: "1px solid #2a4058",
  borderRadius: "18px",
  padding: "28px",
};
