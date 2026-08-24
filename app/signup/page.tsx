"use client";

import { useState } from "react";

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");

  function continueSignup() {
    setError("");

    if (
      !restaurantName.trim() ||
      !ownerName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !city.trim() ||
      !state.trim()
    ) {
      setError("Please complete all fields.");
      return;
    }

    const params = new URLSearchParams({
      restaurant_name: restaurantName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
    });

    window.location.href = `/onboarding?${params.toString()}`;
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <div style={brandStyle}>
          RESTAURANT <span style={{ color: "#e1222d" }}>OS</span>
        </div>

        <div style={gridStyle}>
          <section>
            <div style={eyebrowStyle}>ONE SYSTEM. ONE PRICE.</div>
            <h1 style={titleStyle}>
              EVERYTHING YOU NEED TO{" "}
              <span style={{ color: "#e1222d" }}>GROW.</span>
            </h1>

            <p style={leadStyle}>
              Restaurant OS gives independent restaurants the website,
              customer database, loyalty, offers, campaigns and growth tools
              in one operating system.
            </p>

            <div style={priceStyle}>
              $375 <span style={priceMetaStyle}>/ MONTH</span>
            </div>

            <div style={weeklyStyle}>ABOUT $87/WEEK</div>

            <div style={includedStyle}>
              {[
                "Restaurant website",
                "Online menu management",
                "VIP / loyalty database",
                "QR codes",
                "Coupons + offers",
                "Text campaigns",
                "Email campaigns",
                "Campaign tracking",
                "Review-growth tools",
                "Catering campaign tools",
                "Owner Command Center",
                "Growth recommendations",
              ].map((item) => (
                <div style={itemStyle} key={item}>
                  <strong style={{ color: "#e1222d" }}>✓ </strong>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={eyebrowStyle}>START RESTAURANT OS</div>
            <h2 style={cardTitleStyle}>Tell us about your restaurant.</h2>

            <Field
              label="RESTAURANT NAME"
              value={restaurantName}
              onChange={setRestaurantName}
            />
            <Field
              label="OWNER / OPERATOR"
              value={ownerName}
              onChange={setOwnerName}
            />
            <Field
              label="PHONE"
              value={phone}
              onChange={setPhone}
            />
            <Field
              label="EMAIL"
              value={email}
              onChange={setEmail}
              type="email"
            />

            <div style={twoColStyle}>
              <Field label="CITY" value={city} onChange={setCity} />
              <Field
                label="STATE"
                value={state}
                onChange={setState}
                maxLength={2}
              />
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <button style={buttonStyle} onClick={continueSignup}>
              START RESTAURANT OS →
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 85% 8%, rgba(225,34,45,.15), transparent 28%), #050505",
  color: "#ffffff",
  padding: "32px 22px 70px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const brandStyle = {
  fontSize: "19px",
  fontWeight: 900,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(340px,430px)",
  gap: "48px",
  alignItems: "start",
  marginTop: "70px",
};

const eyebrowStyle = {
  color: "#e1222d",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "10px 0 18px",
  fontSize: "clamp(54px,7vw,90px)",
  lineHeight: 0.88,
  letterSpacing: "-5px",
  fontWeight: 900,
};

const leadStyle = {
  maxWidth: "620px",
  color: "#8d8d8d",
  fontSize: "14px",
  lineHeight: 1.65,
};

const priceStyle = {
  marginTop: "30px",
  fontSize: "70px",
  lineHeight: 0.9,
  fontWeight: 900,
  letterSpacing: "-4px",
};

const priceMetaStyle = {
  fontSize: "12px",
  color: "#777777",
  letterSpacing: "0",
};

const weeklyStyle = {
  marginTop: "8px",
  color: "#e1222d",
  fontSize: "11px",
  fontWeight: 900,
};

const includedStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "9px",
  marginTop: "28px",
};

const itemStyle = {
  border: "1px solid #222222",
  borderRadius: "9px",
  padding: "12px",
  background: "#0c0c0c",
  color: "#bdbdbd",
  fontSize: "9px",
  fontWeight: 800,
};

const cardStyle = {
  border: "1px solid #282828",
  borderRadius: "16px",
  padding: "24px",
  background: "#0c0c0c",
};

const cardTitleStyle = {
  margin: "6px 0 20px",
  fontSize: "28px",
};

const fieldStyle = {
  display: "grid",
  gap: "6px",
  marginBottom: "11px",
};

const labelStyle = {
  color: "#747474",
  fontSize: "8px",
  fontWeight: 900,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #303030",
  borderRadius: "8px",
  background: "#111111",
  color: "#ffffff",
  padding: "12px 13px",
  outline: "none",
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 100px",
  gap: "9px",
};

const errorStyle = {
  border: "1px solid #58272b",
  borderRadius: "8px",
  padding: "10px",
  margin: "10px 0",
  background: "#180b0c",
  color: "#ff949b",
  fontSize: "9px",
};

const buttonStyle = {
  width: "100%",
  border: 0,
  borderRadius: "8px",
  background: "#e1222d",
  color: "#ffffff",
  padding: "14px",
  marginTop: "8px",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: "10px",
};
