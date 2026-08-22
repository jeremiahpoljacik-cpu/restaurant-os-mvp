"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminMigrateRestaurantPage() {
  const [form, setForm] = useState({
    restaurant_name: "",
    owner_email: "",
    phone: "",
    address_line_1: "",
    city: "",
    state: "",
    zip: "",
    cuisine_category: "",
    current_website_url: "",
    custom_domain: "",
    online_ordering_url: "",
    catering_email: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/admin/login";
      return null;
    }

    return session.access_token;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setCreatedId(null);

    const token = await getToken();
    if (!token) return;

    const response = await fetch("/api/admin/migrate-restaurant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to create restaurant migration.");
      setLoading(false);
      return;
    }

    setMessage(data.message || "Restaurant migration created.");
    setCreatedId(data.restaurant_id || null);
    setLoading(false);
  }

  function setField(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <button
              style={backButtonStyle}
              onClick={() => (window.location.href = "/admin")}
            >
              ← SUPER ADMIN
            </button>

            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Migrate Existing Restaurant</h1>
            <p style={subStyle}>
              Create a real customer account, preserve their current web presence,
              and stage the Restaurant OS cutover before touching their live domain.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} style={formGridStyle}>
          <section style={cardStyle}>
            <div style={cardEyebrowStyle}>RESTAURANT</div>
            <h2 style={cardTitleStyle}>Business Information</h2>

            <Field
              label="RESTAURANT NAME"
              value={form.restaurant_name}
              onChange={(v) => setField("restaurant_name", v)}
              required
            />

            <Field
              label="OWNER EMAIL"
              type="email"
              value={form.owner_email}
              onChange={(v) => setField("owner_email", v)}
              required
            />

            <Field
              label="PHONE"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
            />

            <Field
              label="CUISINE / CATEGORY"
              value={form.cuisine_category}
              onChange={(v) => setField("cuisine_category", v)}
            />

            <Field
              label="STREET ADDRESS"
              value={form.address_line_1}
              onChange={(v) => setField("address_line_1", v)}
            />

            <div style={threeColStyle}>
              <Field
                label="CITY"
                value={form.city}
                onChange={(v) => setField("city", v)}
              />
              <Field
                label="STATE"
                value={form.state}
                onChange={(v) => setField("state", v)}
              />
              <Field
                label="ZIP"
                value={form.zip}
                onChange={(v) => setField("zip", v)}
              />
            </div>
          </section>

          <section style={cardStyle}>
            <div style={cardEyebrowStyle}>MIGRATION</div>
            <h2 style={cardTitleStyle}>Current Digital Setup</h2>

            <Field
              label="CURRENT WEBSITE URL"
              value={form.current_website_url}
              onChange={(v) => setField("current_website_url", v)}
              placeholder="https://..."
            />

            <Field
              label="CUSTOM DOMAIN"
              value={form.custom_domain}
              onChange={(v) => setField("custom_domain", v)}
              placeholder="example.com"
            />

            <Field
              label="ONLINE ORDERING URL"
              value={form.online_ordering_url}
              onChange={(v) => setField("online_ordering_url", v)}
              placeholder="https://..."
            />

            <Field
              label="CATERING EMAIL"
              type="email"
              value={form.catering_email}
              onChange={(v) => setField("catering_email", v)}
            />

            <label style={fieldWrapStyle}>
              <span style={labelStyle}>INTERNAL MIGRATION NOTES</span>
              <textarea
                value={form.notes}
                onChange={(event) => setField("notes", event.target.value)}
                style={textareaStyle}
                placeholder="Current vendor, menu status, domain registrar, special migration notes..."
              />
            </label>
          </section>

          <section style={submitCardStyle}>
            <div>
              <div style={cardEyebrowStyle}>SAFE CUTOVER</div>
              <h2 style={submitTitleStyle}>Create Migration Account</h2>
              <p style={submitTextStyle}>
                This creates the restaurant inside Restaurant OS first. Their live
                custom domain stays untouched until the new site is ready and verified.
              </p>
            </div>

            {message && <div style={messageStyle}>{message}</div>}

            <button
              type="submit"
              disabled={loading}
              style={primaryButtonStyle}
            >
              {loading ? "CREATING..." : "CREATE RESTAURANT MIGRATION"}
            </button>

            {createdId && (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/admin/restaurant?restaurant=${createdId}`)
                }
              >
                OPEN RESTAURANT ACCOUNT
              </button>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
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
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle = {
  marginBottom: "22px",
};

const backButtonStyle = {
  background: "transparent",
  border: 0,
  color: "#94a3b8",
  padding: "0 0 14px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "8px 0",
  fontSize: "clamp(46px,7vw,76px)",
  lineHeight: ".92",
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  maxWidth: "760px",
  lineHeight: 1.6,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: "16px",
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "22px",
};

const submitCardStyle = {
  ...cardStyle,
  gridColumn: "1 / -1",
};

const cardEyebrowStyle = {
  color: "#f5b82e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.4px",
};

const cardTitleStyle = {
  margin: "6px 0 18px",
  fontSize: "26px",
};

const submitTitleStyle = {
  margin: "6px 0 8px",
  fontSize: "30px",
};

const submitTextStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.55,
  maxWidth: "760px",
};

const fieldWrapStyle = {
  display: "grid",
  gap: "7px",
  marginBottom: "14px",
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const inputStyle = {
  width: "100%",
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "14px",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "130px",
  resize: "vertical" as const,
  lineHeight: 1.5,
};

const threeColStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr .7fr .8fr",
  gap: "10px",
};

const primaryButtonStyle = {
  width: "100%",
  marginTop: "14px",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "14px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  width: "100%",
  marginTop: "10px",
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  marginTop: "14px",
  background: "#13263b",
  color: "#dbeafe",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
};

