"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setMessage(error?.message || "Unable to sign in.");
      setLoading(false);
      return;
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("platform_admins")
      .select("user_id,role,active")
      .eq("user_id", data.user.id)
      .eq("active", true)
      .maybeSingle();

    if (adminError || !adminRow) {
      await supabase.auth.signOut();
      setMessage("This login does not have Super Admin access.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={eyebrowStyle}>RESTAURANT OS</div>
        <h1 style={titleStyle}>Super Admin</h1>
        <p style={subStyle}>
          Platform administration only. Restaurant owner accounts cannot access this area.
        </p>

        <form onSubmit={handleLogin} style={formStyle}>
          <label style={labelStyle}>ADMIN EMAIL</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>PASSWORD</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
          />

          {message && <div style={messageStyle}>{message}</div>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "CHECKING ACCESS..." : "ENTER COMMAND CENTER"}
          </button>
        </form>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  color: "#fff",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "20px",
  padding: "30px",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "8px 0 10px",
  fontSize: "48px",
  lineHeight: ".95",
  letterSpacing: "-2px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.6,
  marginBottom: "24px",
};

const formStyle = {
  display: "grid",
  gap: "9px",
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "6px",
};

const inputStyle = {
  width: "100%",
  background: "#08111f",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "14px",
};

const messageStyle = {
  background: "#3b1d1d",
  color: "#fecaca",
  border: "1px solid #7f3333",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
  marginTop: "7px",
};

const buttonStyle = {
  marginTop: "12px",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "14px",
  fontWeight: 900,
  cursor: "pointer",
};
