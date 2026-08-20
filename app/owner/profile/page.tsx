"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export default function OwnerProfilePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address_line_1: "",
    city: "",
    state: "",
    zip: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [businessMessage, setBusinessMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setAccountEmail(session.user.email || "");

    const requestedRestaurantId = new URLSearchParams(
      window.location.search
    ).get("restaurant");

    let query = supabase
      .from("restaurants")
      .select("id,name,phone,address_line_1,city,state,zip")
      .eq("owner_user_id", session.user.id);

    if (requestedRestaurantId) {
      query = query.eq("id", requestedRestaurantId);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      setBusinessMessage(
        error?.message || "No restaurant profile was found for this account."
      );
      setLoading(false);
      return;
    }

    setRestaurant(data);
    setForm({
      name: data.name || "",
      phone: data.phone || "",
      address_line_1: data.address_line_1 || "",
      city: data.city || "",
      state: data.state || "",
      zip: data.zip || "",
    });

    setLoading(false);
  }

  async function saveBusinessProfile(event: React.FormEvent) {
    event.preventDefault();

    if (!restaurant) return;

    setSavingBusiness(true);
    setBusinessMessage("");

    const { error } = await supabase
      .from("restaurants")
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address_line_1: form.address_line_1.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
      })
      .eq("id", restaurant.id);

    if (error) {
      setBusinessMessage(error.message);
      setSavingBusiness(false);
      return;
    }

    setBusinessMessage("Restaurant profile updated.");
    setSavingBusiness(false);
  }

  async function saveAccountEmail(event: React.FormEvent) {
    event.preventDefault();

    const nextEmail = accountEmail.trim().toLowerCase();

    if (!nextEmail) {
      setEmailMessage("Enter an email address.");
      return;
    }

    setSavingEmail(true);
    setEmailMessage("");

    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      email: nextEmail,
    });

    if (error) {
      setEmailMessage(error.message);
      setSavingEmail(false);
      return;
    }

    if (user?.email === nextEmail) {
      setEmailMessage("Account email updated.");
    } else {
      setEmailMessage(
        "Email change submitted. Check the new email address if Supabase requests confirmation."
      );
    }

    setSavingEmail(false);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading profile...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Profile & Account</h1>
            <p style={subStyle}>
              Update the restaurant information customers see and the email used
              to sign into Restaurant OS.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => {
              const suffix = restaurant
                ? `?restaurant=${restaurant.id}`
                : "";
              window.location.href = `/owner${suffix}`;
            }}
          >
            BACK TO DASHBOARD
          </button>
        </header>

        <section style={gridStyle}>
          <form onSubmit={saveBusinessProfile} style={cardStyle}>
            <div style={cardEyebrowStyle}>RESTAURANT PROFILE</div>
            <h2 style={cardTitleStyle}>Business Information</h2>

            <Field
              label="RESTAURANT NAME"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
            />

            <Field
              label="PHONE"
              value={form.phone}
              onChange={(value) => setForm({ ...form, phone: value })}
            />

            <Field
              label="STREET ADDRESS"
              value={form.address_line_1}
              onChange={(value) =>
                setForm({ ...form, address_line_1: value })
              }
            />

            <div style={threeColumnStyle}>
              <Field
                label="CITY"
                value={form.city}
                onChange={(value) => setForm({ ...form, city: value })}
              />

              <Field
                label="STATE"
                value={form.state}
                onChange={(value) => setForm({ ...form, state: value })}
              />

              <Field
                label="ZIP"
                value={form.zip}
                onChange={(value) => setForm({ ...form, zip: value })}
              />
            </div>

            {businessMessage && (
              <div style={messageStyle}>{businessMessage}</div>
            )}

            <button
              type="submit"
              disabled={savingBusiness}
              style={primaryButtonStyle}
            >
              {savingBusiness ? "SAVING..." : "SAVE RESTAURANT PROFILE"}
            </button>
          </form>

          <form onSubmit={saveAccountEmail} style={cardStyle}>
            <div style={cardEyebrowStyle}>OWNER ACCOUNT</div>
            <h2 style={cardTitleStyle}>Login Email</h2>

            <p style={helpStyle}>
              This is the email used to log into the Restaurant OS owner
              dashboard.
            </p>

            <Field
              label="ACCOUNT EMAIL"
              type="email"
              value={accountEmail}
              onChange={setAccountEmail}
            />

            {emailMessage && (
              <div style={messageStyle}>{emailMessage}</div>
            )}

            <button
              type="submit"
              disabled={savingEmail}
              style={primaryButtonStyle}
            >
              {savingEmail ? "UPDATING..." : "UPDATE LOGIN EMAIL"}
            </button>

            <div style={securityBoxStyle}>
              <div style={securityTitleStyle}>ACCOUNT SECURITY</div>
              <div style={securityTextStyle}>
                Password changes can continue through Supabase authentication.
                We can add a dedicated Change Password control here next.
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fa",
  color: "#111827",
  padding: "30px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1180px",
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
  color: "#0b513e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "7px 0 8px",
  fontSize: "clamp(42px,6vw,68px)",
  lineHeight: ".95",
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#6b7280",
  maxWidth: "680px",
  lineHeight: 1.55,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: "18px",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15,23,42,.05)",
};

const cardEyebrowStyle = {
  color: "#0b513e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.5px",
};

const cardTitleStyle = {
  margin: "6px 0 18px",
  fontSize: "28px",
};

const fieldWrapStyle = {
  display: "grid",
  gap: "7px",
  marginBottom: "15px",
};

const labelStyle = {
  color: "#6b7280",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "12px 13px",
  fontSize: "14px",
  background: "#fff",
  color: "#111827",
};

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr .7fr .8fr",
  gap: "10px",
};

const primaryButtonStyle = {
  width: "100%",
  marginTop: "4px",
  background: "#0b513e",
  color: "#fff",
  border: 0,
  borderRadius: "10px",
  padding: "13px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#eef7f3",
  color: "#0b513e",
  border: "1px solid #b7dbc9",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
  marginBottom: "12px",
};

const helpStyle = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.55,
  marginBottom: "20px",
};

const securityBoxStyle = {
  marginTop: "18px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "14px",
};

const securityTitleStyle = {
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  color: "#374151",
};

const securityTextStyle = {
  marginTop: "6px",
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: 1.5,
};
