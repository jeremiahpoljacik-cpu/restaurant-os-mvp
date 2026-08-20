"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

type Restaurant = {
  id: string;
  name: string;
  slug: string;
};

type Branding = {
  primary_color: string | null;
  secondary_color: string | null;
};

type Offer = {
  id: string;
  restaurant_id: string;
  headline: string;
  description: string | null;
  terms: string | null;
  expires_at: string | null;
  active: boolean;
};

export default function PublicOfferClaimPage() {
  const params = useParams<{ slug: string; offer: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const offerId = Array.isArray(params?.offer) ? params.offer[0] : params?.offer;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!slug || !offerId) return;
    load(slug, offerId);
  }, [slug, offerId]);

  async function load(siteSlug: string, id: string) {
    setLoading(true);

    const { data: restaurantData } = await publicSupabase
      .from("restaurants")
      .select("id,name,slug")
      .eq("slug", siteSlug)
      .maybeSingle();

    if (!restaurantData) {
      setLoading(false);
      return;
    }

    const [brandingResult, offerResult] = await Promise.all([
      publicSupabase
        .from("restaurant_branding")
        .select("primary_color,secondary_color")
        .eq("restaurant_id", restaurantData.id)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_vip_offers")
        .select("id,restaurant_id,headline,description,terms,expires_at,active")
        .eq("id", id)
        .eq("restaurant_id", restaurantData.id)
        .eq("active", true)
        .maybeSingle(),
    ]);

    setRestaurant(restaurantData);
    setBranding(brandingResult.data || null);
    setOffer(offerResult.data || null);
    setLoading(false);
  }

  function normalizeUsPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return value.trim();
  }

  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  async function claim(event: FormEvent) {
    event.preventDefault();

    if (!restaurant || !offer) return;

    if (!firstName.trim()) {
      setMessage("First name is required.");
      return;
    }

    if (!phone.trim() && !email.trim()) {
      setMessage("Enter a phone number or email.");
      return;
    }

    setSaving(true);
    setMessage("");

    let code = makeCode();

    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await publicSupabase
        .from("restaurant_offer_claims")
        .insert({
          restaurant_id: restaurant.id,
          offer_id: offer.id,
          first_name: firstName.trim(),
          phone: phone.trim() ? normalizeUsPhone(phone) : null,
          email: email.trim().toLowerCase() || null,
          claim_code: code,
          status: "claimed",
        });

      if (!error) {
        setClaimCode(code);
        setSaving(false);
        return;
      }

      if (error.code === "23505") {
        code = makeCode();
        continue;
      }

      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Could not create a unique claim code. Please try again.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>Loading offer...</div>
      </main>
    );
  }

  if (!restaurant || !offer) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>This offer is not available.</div>
      </main>
    );
  }

  const primary = branding?.primary_color || "#0b3a67";
  const secondary = branding?.secondary_color || "#f5b82e";

  if (claimCode) {
    return (
      <main
        style={{
          ...pageStyle,
          background: `linear-gradient(135deg, ${primary}, #07101c 72%)`,
        }}
      >
        <section style={successCardStyle}>
          <div style={eyebrowStyle}>OFFER CLAIMED</div>
          <h1 style={successTitleStyle}>SHOW THIS CODE.</h1>

          <div
            style={{
              ...codeBoxStyle,
              borderColor: secondary,
              color: secondary,
            }}
          >
            {claimCode}
          </div>

          <p style={successTextStyle}>
            Present this code at {restaurant.name} to redeem:
          </p>

          <h2 style={successOfferStyle}>{offer.headline}</h2>

          {offer.terms && <p style={termsStyle}>{offer.terms}</p>}

          <a
            href={`/r/${restaurant.slug}`}
            style={{ ...homeButtonStyle, background: secondary }}
          >
            BACK TO RESTAURANT
          </a>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        ...pageStyle,
        background: `linear-gradient(135deg, ${primary}, #07101c 72%)`,
      }}
    >
      <div style={shellStyle}>
        <a href={`/r/${restaurant.slug}/offers`} style={backLinkStyle}>
          ← BACK TO OFFERS
        </a>

        <div style={layoutStyle}>
          <section>
            <div style={eyebrowStyle}>CLAIM OFFER</div>
            <h1 style={heroTitleStyle}>{offer.headline}</h1>

            {offer.description && (
              <p style={heroTextStyle}>{offer.description}</p>
            )}

            {offer.expires_at && (
              <div style={expiresStyle}>
                Expires{" "}
                {new Date(offer.expires_at).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}

            {offer.terms && (
              <div style={termsPanelStyle}>
                <strong>DETAILS</strong>
                <div style={{ marginTop: "6px" }}>{offer.terms}</div>
              </div>
            )}
          </section>

          <form onSubmit={claim} style={formCardStyle}>
            <div style={formEyebrowStyle}>GET YOUR CODE</div>
            <h2 style={formTitleStyle}>Claim This Offer</h2>

            {message && <div style={messageStyle}>{message}</div>}

            <Field
              label="FIRST NAME"
              value={firstName}
              onChange={setFirstName}
              placeholder="First name"
            />

            <Field
              label="MOBILE PHONE"
              value={phone}
              onChange={setPhone}
              placeholder="919-555-1234"
              type="tel"
            />

            <Field
              label="EMAIL"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              type="email"
            />

            <button
              type="submit"
              disabled={saving}
              style={{ ...claimButtonStyle, background: secondary }}
            >
              {saving ? "CLAIMING..." : "CLAIM OFFER"}
            </button>

            <p style={finePrintStyle}>
              A unique redemption code will be generated for this offer.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const backLinkStyle = {
  display: "inline-block",
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  marginBottom: "42px",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(340px,.7fr)",
  gap: "54px",
  alignItems: "start",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const heroTitleStyle = {
  fontSize: "clamp(52px,8vw,96px)",
  lineHeight: ".88",
  fontWeight: 900,
  letterSpacing: "-4px",
  margin: "16px 0 24px",
};

const heroTextStyle = {
  color: "#e2e8f0",
  fontSize: "20px",
  lineHeight: 1.6,
};

const expiresStyle = {
  color: "#f5b82e",
  fontWeight: 900,
  marginTop: "18px",
};

const termsPanelStyle = {
  marginTop: "26px",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: "14px",
  padding: "18px",
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const formCardStyle = {
  background: "#f3eadc",
  color: "#07101c",
  borderRadius: "20px",
  padding: "28px",
};

const formEyebrowStyle = {
  color: "#a46b00",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const formTitleStyle = {
  fontSize: "34px",
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
  padding: "13px",
  fontSize: "15px",
};

const claimButtonStyle = {
  width: "100%",
  color: "#07101c",
  border: 0,
  borderRadius: "10px",
  padding: "16px",
  fontWeight: 900,
  cursor: "pointer",
  marginTop: "8px",
};

const finePrintStyle = {
  color: "#6b645b",
  fontSize: "11px",
  lineHeight: 1.5,
};

const messageStyle = {
  background: "#fff4d3",
  border: "1px solid #e7c86a",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "13px",
  marginBottom: "16px",
};

const successCardStyle = {
  maxWidth: "720px",
  margin: "10vh auto 0",
  background: "#0f1d2e",
  border: "1px solid #2a4058",
  borderRadius: "22px",
  padding: "38px",
  textAlign: "center" as const,
};

const successTitleStyle = {
  fontSize: "clamp(52px,9vw,96px)",
  lineHeight: ".88",
  margin: "14px 0 24px",
  fontWeight: 900,
  letterSpacing: "-4px",
};

const codeBoxStyle = {
  display: "inline-block",
  border: "3px dashed",
  borderRadius: "16px",
  padding: "18px 28px",
  fontSize: "clamp(36px,7vw,64px)",
  fontWeight: 900,
  letterSpacing: "8px",
  marginBottom: "26px",
};

const successTextStyle = {
  color: "#cbd5e1",
  fontSize: "16px",
};

const successOfferStyle = {
  fontSize: "30px",
  margin: "10px 0 18px",
};

const termsStyle = {
  color: "#94a3b8",
  lineHeight: 1.5,
};

const homeButtonStyle = {
  display: "inline-block",
  marginTop: "22px",
  color: "#07101c",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "14px 18px",
  fontWeight: 900,
};

const cardStyle = {
  maxWidth: "520px",
  margin: "12vh auto 0",
  background: "#0f1d2e",
  border: "1px solid #2a4058",
  borderRadius: "18px",
  padding: "28px",
};
