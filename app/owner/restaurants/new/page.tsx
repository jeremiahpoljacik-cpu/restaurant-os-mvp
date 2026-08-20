"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AddRestaurantPage() {
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    verifyOwner();
  }, []);

  async function verifyOwner() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setChecking(false);
  }

  function makeSlug(value: string) {
    const base = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);

    const suffix = Math.random().toString(36).slice(2, 8);

    return `${base || "restaurant"}-${suffix}`;
  }

  async function createRestaurant(event: FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Restaurant name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    const slug = makeSlug(name);

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        owner_user_id: user.id,
        name: name.trim(),
        slug,
        cuisine_category: cuisine.trim() || null,
        phone: phone.trim() || null,
        address_line_1: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (restaurantError || !restaurant) {
      setMessage(
        restaurantError?.message || "Could not create restaurant."
      );
      setSaving(false);
      return;
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const restaurantId = restaurant.id;

    const defaults = await Promise.all([
      supabase.from("restaurant_branding").insert({
        restaurant_id: restaurantId,
        primary_color: "#111827",
        secondary_color: "#f59e0b",
        tagline: null,
        short_description: null,
      }),

      supabase.from("restaurant_hours").insert({
        restaurant_id: restaurantId,
      }),

      supabase.from("restaurant_ordering").insert({
        restaurant_id: restaurantId,
        online_ordering_url: null,
        catering_email: null,
      }),

      supabase.from("restaurant_growth_settings").insert({
        restaurant_id: restaurantId,
        vip_club_name: "VIP Club",
        signup_offer: null,
      }),

      supabase.from("restaurant_website_settings").insert({
        restaurant_id: restaurantId,
        hero_headline: name.trim(),
        about_body: null,
        published: false,
      }),

      supabase.from("restaurant_subscriptions").insert({
        restaurant_id: restaurantId,
        plan: "founder",
        status: "trial",
        provider: null,
        provider_customer_id: null,
        provider_subscription_id: null,
        current_period_end: null,
        trial_ends_at: trialEnd.toISOString(),
      }),
    ]);

    const failedDefault = defaults.find((result) => result.error);

    if (failedDefault?.error) {
      setMessage(
        `Restaurant created, but default setup failed: ${failedDefault.error.message}`
      );
      setSaving(false);
      return;
    }

    window.location.href = `/owner/setup?restaurant=${restaurantId}`;
  }

  if (checking) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Checking account...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Add Restaurant</h1>
            <p style={subStyle}>
              Create another restaurant under your existing owner account.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => {
              window.location.href = "/owner/restaurants";
            }}
          >
            CANCEL
          </button>
        </header>

        <form onSubmit={createRestaurant} style={cardStyle}>
          {message && <div style={messageStyle}>{message}</div>}

          <div style={gridStyle}>
            <Field
              label="RESTAURANT NAME"
              value={name}
              onChange={setName}
              placeholder="Example: Main Street Pizza"
              required
            />

            <Field
              label="CUISINE / CATEGORY"
              value={cuisine}
              onChange={setCuisine}
              placeholder="Pizza, Mexican, BBQ..."
            />

            <Field
              label="PHONE"
              value={phone}
              onChange={setPhone}
              placeholder="919-555-0123"
            />

            <Field
              label="STREET ADDRESS"
              value={address}
              onChange={setAddress}
              placeholder="123 Main Street"
            />

            <Field
              label="CITY"
              value={city}
              onChange={setCity}
              placeholder="Raleigh"
            />

            <Field
              label="STATE"
              value={state}
              onChange={setState}
              placeholder="NC"
            />

            <Field
              label="ZIP"
              value={zip}
              onChange={setZip}
              placeholder="27601"
            />
          </div>

          <div style={noticeStyle}>
            <div style={noticeTitleStyle}>SAME OWNER ACCOUNT</div>
            <div style={noticeTextStyle}>
              No new email or password is created. This restaurant will belong
              to your current Restaurant OS login and starts with its own
              14-day trial.
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={primaryButtonStyle}
          >
            {saving ? "CREATING RESTAURANT..." : "CREATE RESTAURANT"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left,#15304b 0,#08111f 42%,#05090f 100%)",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "900px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
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
  fontSize: "clamp(48px,8vw,82px)",
  lineHeight: ".92",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "20px",
  padding: "24px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: "16px",
};

const fieldStyle = {
  display: "grid",
  gap: "7px",
};

const labelStyle = {
  color: "#cbd5e1",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "15px",
};

const noticeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "12px",
  padding: "16px",
  margin: "22px 0",
};

const noticeTitleStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const noticeTextStyle = {
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.5,
  marginTop: "6px",
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
  padding: "12px 15px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#3b1d1d",
  border: "1px solid #7f3333",
  borderRadius: "10px",
  padding: "13px",
  marginBottom: "18px",
  color: "#fecaca",
};
