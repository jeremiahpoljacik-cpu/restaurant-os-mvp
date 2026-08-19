"use client";

import { useState } from "react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(s + 1, 6));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08111f",
        color: "#fff",
        padding: "24px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          paddingTop: "40px",
        }}
      >
        <div
          style={{
            color: "#f5b82e",
            fontWeight: 900,
            letterSpacing: "2px",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          RESTAURANT OS
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 7vw, 68px)",
            lineHeight: ".95",
            margin: 0,
            fontWeight: 900,
            letterSpacing: "-2px",
          }}
        >
          BUILD YOUR
          <br />
          RESTAURANT SITE.
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "18px",
            lineHeight: 1.6,
            maxWidth: "700px",
            marginTop: "18px",
          }}
        >
          Tell us about your restaurant. We’ll use this information to build
          your website, menu, owner dashboard and customer engagement system.
        </p>

        <div
          style={{
            marginTop: "32px",
            background: "#0f1d2e",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "20px",
            padding: "28px",
          }}
        >
          <div
            style={{
              color: "#f5b82e",
              fontWeight: 900,
              marginBottom: "18px",
            }}
          >
            STEP {step} OF 6
          </div>

          {step === 1 && (
            <StepOne />
          )}

          {step === 2 && (
            <StepTwo />
          )}

          {step === 3 && (
            <StepThree />
          )}

          {step === 4 && (
            <StepFour />
          )}

          {step === 5 && (
            <StepFive />
          )}

          {step === 6 && (
            <StepSix />
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "28px",
            }}
          >
            <button
              onClick={back}
              disabled={step === 1}
              style={{
                padding: "14px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,.2)",
                background: "transparent",
                color: step === 1 ? "#475569" : "#fff",
                fontWeight: 800,
                cursor: step === 1 ? "default" : "pointer",
              }}
            >
              BACK
            </button>

            <button
              onClick={next}
              style={{
                padding: "14px 24px",
                borderRadius: "10px",
                border: 0,
                background: "#f5b82e",
                color: "#08111f",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {step === 6 ? "FINISH SETUP" : "CONTINUE"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 900,
          letterSpacing: ".6px",
          marginBottom: "8px",
          color: "#cbd5e1",
        }}
      >
        {label}
      </label>

      <input
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#08111f",
          color: "#fff",
          border: "1px solid #334155",
          borderRadius: "10px",
          padding: "14px",
          fontSize: "15px",
        }}
      />
    </div>
  );
}

function StepOne() {
  return (
    <>
      <h2>Restaurant Basics</h2>

      <Field
        label="RESTAURANT NAME"
        placeholder="Example: Maria's Kitchen"
      />

      <Field
        label="CUISINE / CATEGORY"
        placeholder="Mexican, Pizza, BBQ, Honduran, Coffee..."
      />

      <Field
        label="PHONE"
        placeholder="Restaurant phone number"
      />

      <Field
        label="ADDRESS"
        placeholder="Street address"
      />

      <Field
        label="CITY / STATE / ZIP"
        placeholder="Clayton, NC 27520"
      />
    </>
  );
}

function StepTwo() {
  return (
    <>
      <h2>Brand & Identity</h2>

      <Field
        label="PRIMARY BRAND COLOR"
        placeholder="#0B3A67"
      />

      <Field
        label="SECONDARY BRAND COLOR"
        placeholder="#F4B400"
      />

      <Field
        label="TAGLINE"
        placeholder="Made with pride."
      />

      <Field
        label="SHORT DESCRIPTION"
        placeholder="Tell customers what makes your restaurant special."
      />

      <p style={{ color: "#94a3b8" }}>
        Logo and photo uploads are coming in the next build.
      </p>
    </>
  );
}

function StepThree() {
  return (
    <>
      <h2>Hours & Ordering</h2>

      <Field
        label="MONDAY HOURS"
        placeholder="9:00 AM - 8:00 PM"
      />

      <Field
        label="TUESDAY HOURS"
        placeholder="9:00 AM - 8:00 PM"
      />

      <Field
        label="WEDNESDAY HOURS"
        placeholder="9:00 AM - 8:00 PM"
      />

      <Field
        label="THURSDAY HOURS"
        placeholder="9:00 AM - 8:00 PM"
      />

      <Field
        label="FRIDAY HOURS"
        placeholder="9:00 AM - 10:00 PM"
      />

      <Field
        label="SATURDAY HOURS"
        placeholder="9:00 AM - 10:00 PM"
      />

      <Field
        label="SUNDAY HOURS"
        placeholder="9:00 AM - 8:00 PM"
      />

      <Field
        label="ONLINE ORDERING LINK"
        placeholder="DoorDash, Uber Eats, direct ordering URL..."
      />
    </>
  );
}

function StepFour() {
  return (
    <>
      <h2>Menu Setup</h2>

      <Field
        label="FIRST MENU CATEGORY"
        placeholder="Breakfast, Appetizers, Chicken..."
      />

      <Field
        label="FIRST MENU ITEM"
        placeholder="Traditional Breakfast"
      />

      <Field
        label="PRICE"
        placeholder="17.95"
      />

      <Field
        label="DESCRIPTION"
        placeholder="Describe the menu item."
      />

      <p style={{ color: "#94a3b8" }}>
        Full menu importing and bulk entry will be added next.
      </p>
    </>
  );
}

function StepFive() {
  return (
    <>
      <h2>Customer Growth</h2>

      <Field
        label="VIP CLUB NAME"
        placeholder="Maria's VIP Club"
      />

      <Field
        label="SIGNUP OFFER"
        placeholder="10% off your next visit"
      />

      <Field
        label="BIRTHDAY OFFER"
        placeholder="Free dessert on your birthday"
      />

      <Field
        label="CATERING EMAIL"
        placeholder="catering@restaurant.com"
      />
    </>
  );
}

function StepSix() {
  return (
    <>
      <h2>Ready to Build</h2>

      <p
        style={{
          color: "#cbd5e1",
          fontSize: "17px",
          lineHeight: 1.6,
        }}
      >
        You’ve given us the foundation for your restaurant website, menu,
        customer engagement system and owner portal.
      </p>

      <div
        style={{
          marginTop: "20px",
          borderRadius: "12px",
          padding: "18px",
          background: "#08111f",
          border: "1px solid #334155",
        }}
      >
        Next we’ll generate your restaurant workspace and website preview.
      </div>
    </>
  );
}
