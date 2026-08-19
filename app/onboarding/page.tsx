"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type FormState = {
  ownerEmail: string;
  ownerPassword: string;

  restaurantName: string;
  cuisineCategory: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  shortDescription: string;

  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  onlineOrderingUrl: string;

  vipClubName: string;
  signupOffer: string;
  birthdayOffer: string;
  cateringEmail: string;
};

const initialForm: FormState = {
  ownerEmail: "",
  ownerPassword: "",

  restaurantName: "",
  cuisineCategory: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",

  primaryColor: "#0B3A67",
  secondaryColor: "#F4B400",
  tagline: "",
  shortDescription: "",

  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
  sunday: "",
  onlineOrderingUrl: "",

  vipClubName: "",
  signupOffer: "",
  birthdayOffer: "",
  cateringEmail: "",
};

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const next = () => {
    setError("");
    setStep((s) => Math.min(s + 1, 6));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const makeSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  };

  const finishSetup = async () => {
    setError("");

    if (!form.ownerEmail || !form.ownerPassword) {
      setError("Owner email and password are required.");
      setStep(1);
      return;
    }

    if (!form.restaurantName) {
      setError("Restaurant name is required.");
      setStep(1);
      return;
    }

    if (form.ownerPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setStep(1);
      return;
    }

    setSaving(true);

    try {
      const {
        data: signupData,
        error: signupError,
      } = await supabase.auth.signUp({
        email: form.ownerEmail,
        password: form.ownerPassword,
      });

      if (signupError) {
        throw signupError;
      }

      const user = signupData.user;

      if (!user) {
        throw new Error("Owner account could not be created.");
      }

      const baseSlug = makeSlug(form.restaurantName);
      const uniqueSlug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const {
        data: restaurant,
        error: restaurantError,
      } = await supabase
        .from("restaurants")
        .insert({
          owner_user_id: user.id,
          name: form.restaurantName,
          slug: uniqueSlug,
          cuisine_category: form.cuisineCategory || null,
          phone: form.phone || null,
          address_line_1: form.address || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          status: "draft",
        })
        .select()
        .single();

      if (restaurantError) {
        throw restaurantError;
      }

      const restaurantId = restaurant.id;

      const { error: brandingError } = await supabase
        .from("restaurant_branding")
        .insert({
          restaurant_id: restaurantId,
          primary_color: form.primaryColor || null,
          secondary_color: form.secondaryColor || null,
          tagline: form.tagline || null,
          short_description: form.shortDescription || null,
        });

      if (brandingError) {
        throw brandingError;
      }

      const { error: hoursError } = await supabase
        .from("restaurant_hours")
        .insert({
          restaurant_id: restaurantId,
          monday: form.monday || null,
          tuesday: form.tuesday || null,
          wednesday: form.wednesday || null,
          thursday: form.thursday || null,
          friday: form.friday || null,
          saturday: form.saturday || null,
          sunday: form.sunday || null,
        });

      if (hoursError) {
        throw hoursError;
      }

      const { error: orderingError } = await supabase
        .from("restaurant_ordering")
        .insert({
          restaurant_id: restaurantId,
          online_ordering_url: form.onlineOrderingUrl || null,
          catering_email: form.cateringEmail || null,
        });

      if (orderingError) {
        throw orderingError;
      }

      const { error: growthError } = await supabase
        .from("restaurant_growth_settings")
        .insert({
          restaurant_id: restaurantId,
          vip_club_name: form.vipClubName || null,
          signup_offer: form.signupOffer || null,
          birthday_offer: form.birthdayOffer || null,
          sms_enabled: false,
          email_enabled: false,
        });

      if (growthError) {
        throw growthError;
      }

      router.push(`/owner?restaurant=${restaurantId}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while creating the restaurant.");
    } finally {
      setSaving(false);
    }
  };

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

          {error && (
            <div
              style={{
                background: "#3f1118",
                border: "1px solid #7f1d1d",
                color: "#fecaca",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2>Owner & Restaurant Basics</h2>

              <Field
                label="OWNER EMAIL"
                placeholder="owner@restaurant.com"
                value={form.ownerEmail}
                onChange={(value) => update("ownerEmail", value)}
              />

              <Field
                label="OWNER PASSWORD"
                placeholder="Create a password"
                type="password"
                value={form.ownerPassword}
                onChange={(value) => update("ownerPassword", value)}
              />

              <Field
                label="RESTAURANT NAME"
                placeholder="Example: Maria's Kitchen"
                value={form.restaurantName}
                onChange={(value) => update("restaurantName", value)}
              />

              <Field
                label="CUISINE / CATEGORY"
                placeholder="Mexican, Pizza, BBQ, Honduran, Coffee..."
                value={form.cuisineCategory}
                onChange={(value) => update("cuisineCategory", value)}
              />

              <Field
                label="PHONE"
                placeholder="Restaurant phone number"
                value={form.phone}
                onChange={(value) => update("phone", value)}
              />

              <Field
                label="ADDRESS"
                placeholder="Street address"
                value={form.address}
                onChange={(value) => update("address", value)}
              />

              <Field
                label="CITY"
                placeholder="Clayton"
                value={form.city}
                onChange={(value) => update("city", value)}
              />

              <Field
                label="STATE"
                placeholder="NC"
                value={form.state}
                onChange={(value) => update("state", value)}
              />

              <Field
                label="ZIP"
                placeholder="27520"
                value={form.zip}
                onChange={(value) => update("zip", value)}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2>Brand & Identity</h2>

              <Field
                label="PRIMARY BRAND COLOR"
                placeholder="#0B3A67"
                value={form.primaryColor}
                onChange={(value) => update("primaryColor", value)}
              />

              <Field
                label="SECONDARY BRAND COLOR"
                placeholder="#F4B400"
                value={form.secondaryColor}
                onChange={(value) => update("secondaryColor", value)}
              />

              <Field
                label="TAGLINE"
                placeholder="Made with pride."
                value={form.tagline}
                onChange={(value) => update("tagline", value)}
              />

              <Field
                label="SHORT DESCRIPTION"
                placeholder="Tell customers what makes your restaurant special."
                value={form.shortDescription}
                onChange={(value) => update("shortDescription", value)}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2>Hours & Ordering</h2>

              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => (
                <Field
                  key={day}
                  label={`${day.toUpperCase()} HOURS`}
                  placeholder="9:00 AM - 8:00 PM"
                  value={form[day as keyof FormState]}
                  onChange={(value) =>
                    update(day as keyof FormState, value)
                  }
                />
              ))}

              <Field
                label="ONLINE ORDERING LINK"
                placeholder="DoorDash, Uber Eats, direct ordering URL..."
                value={form.onlineOrderingUrl}
                onChange={(value) => update("onlineOrderingUrl", value)}
              />
            </>
          )}

          {step === 4 && (
            <>
              <h2>Menu Setup</h2>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.6,
                }}
              >
                Your restaurant workspace will be created first. Full menu
                categories, menu items, pricing and bulk menu import will be
                managed from the owner dashboard.
              </p>
            </>
          )}

          {step === 5 && (
            <>
              <h2>Customer Growth</h2>

              <Field
                label="VIP CLUB NAME"
                placeholder="Maria's VIP Club"
                value={form.vipClubName}
                onChange={(value) => update("vipClubName", value)}
              />

              <Field
                label="SIGNUP OFFER"
                placeholder="10% off your next visit"
                value={form.signupOffer}
                onChange={(value) => update("signupOffer", value)}
              />

              <Field
                label="BIRTHDAY OFFER"
                placeholder="Free dessert on your birthday"
                value={form.birthdayOffer}
                onChange={(value) => update("birthdayOffer", value)}
              />

              <Field
                label="CATERING EMAIL"
                placeholder="catering@restaurant.com"
                value={form.cateringEmail}
                onChange={(value) => update("cateringEmail", value)}
              />
            </>
          )}

          {step === 6 && (
            <>
              <h2>Ready to Build</h2>

              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "17px",
                  lineHeight: 1.6,
                }}
              >
                We’re ready to create the owner account, restaurant workspace,
                branding, hours, ordering settings and customer growth setup.
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
                Restaurant: <strong>{form.restaurantName || "Not entered"}</strong>
                <br />
                Owner: <strong>{form.ownerEmail || "Not entered"}</strong>
              </div>
            </>
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
              disabled={step === 1 || saving}
              style={{
                padding: "14px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,.2)",
                background: "transparent",
                color: step === 1 ? "#475569" : "#fff",
                fontWeight: 800,
                cursor:
                  step === 1 || saving ? "default" : "pointer",
              }}
            >
              BACK
            </button>

            {step < 6 ? (
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
                CONTINUE
              </button>
            ) : (
              <button
                onClick={finishSetup}
                disabled={saving}
                style={{
                  padding: "14px 24px",
                  borderRadius: "10px",
                  border: 0,
                  background: "#f5b82e",
                  color: "#08111f",
                  fontWeight: 900,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "BUILDING..." : "FINISH SETUP"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
