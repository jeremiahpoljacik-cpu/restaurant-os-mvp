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
  tagline: string | null;
};

type Growth = {
  vip_club_name: string | null;
  signup_offer: string | null;
};

export default function PublicVipSignupPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [growth, setGrowth] = useState<Growth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favoriteItem, setFavoriteItem] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(true);

  useEffect(() => {
    if (!slug) return;
    load(slug);
  }, [slug]);

  async function load(siteSlug: string) {
    const { data: restaurantData } = await publicSupabase
      .from("restaurants")
      .select("id,name,slug")
      .eq("slug", siteSlug)
      .maybeSingle();

    if (!restaurantData) {
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    const [brandingResult, growthResult] = await Promise.all([
      publicSupabase
        .from("restaurant_branding")
        .select("primary_color,secondary_color,tagline")
        .eq("restaurant_id", restaurantData.id)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_growth_settings")
        .select("vip_club_name,signup_offer")
        .eq("restaurant_id", restaurantData.id)
        .maybeSingle(),
    ]);

    setBranding(brandingResult.data || null);
    setGrowth(growthResult.data || null);
    setLoading(false);
  }

  function normalizeUsPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return value.trim();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!restaurant) return;

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

    const { error } = await publicSupabase
      .from("restaurant_vip_members")
      .insert({
        restaurant_id: restaurant.id,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: phone.trim() ? normalizeUsPhone(phone) : null,
        email: email.trim().toLowerCase() || null,
        birthday: birthday || null,
        favorite_item: favoriteItem.trim() || null,
        sms_opt_in: Boolean(phone.trim()) && smsOptIn,
        email_opt_in: Boolean(email.trim()) && emailOptIn,
        source: "website",
      });

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        setComplete(true);
        setMessage("You are already on the VIP list.");
        return;
      }

      setMessage(error.message);
      return;
    }

    setComplete(true);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>Loading VIP Club...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>Restaurant not found.</div>
      </main>
    );
  }

  const primary = branding?.primary_color || "#0b3a67";
  const secondary = branding?.secondary_color || "#f5b82e";
  const clubName =
    growth?.vip_club_name || `${restaurant.name.toUpperCase()} VIP CLUB`;

  if (complete) {
    return (
      <main
        style={{
          ...pageStyle,
          background: `linear-gradient(135deg, ${primary}, #07101c 70%)`,
        }}
      >
        <section style={successCardStyle}>
          <div style={eyebrowStyle}>VIP ACCESS</div>
          <h1 style={successTitleStyle}>YOU'RE IN.</h1>
          <p style={successTextStyle}>
            {message ||
              `Welcome to the ${clubName}. Watch for special offers, restaurant news and VIP perks.`}
          </p>

          <a
            href={`/r/${restaurant.slug}`}
            style={{ ...homeButtonStyle, background: secondary }}
          >
            BACK TO {restaurant.name.toUpperCase()}
          </a>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        ...pageStyle,
        background: `linear-gradient(135deg, ${primary}, #07101c 70%)`,
      }}
    >
      <div style={shellStyle}>
        <a href={`/r/${restaurant.slug}`} style={backLinkStyle}>
          ← BACK TO {restaurant.name.toUpperCase()}
        </a>

        <div style={layoutStyle}>
          <section>
            <div style={eyebrowStyle}>VIP CLUB</div>
            <h1 style={heroTitleStyle}>{clubName}</h1>

            <p style={heroTextStyle}>
              {growth?.signup_offer ||
                "Join the list for special offers, birthday perks, restaurant news and VIP-only drops."}
            </p>

            <div style={benefitGridStyle}>
              <Benefit title="SPECIAL OFFERS" text="Get access to restaurant promotions and VIP deals." />
              <Benefit title="BIRTHDAY PERKS" text="Tell us your birthday so we can celebrate with you." />
              <Benefit title="FIRST TO KNOW" text="Hear about new menu items, events and updates." />
            </div>
          </section>

          <form onSubmit={submit} style={formCardStyle}>
            <div style={formEyebrowStyle}>JOIN THE CLUB</div>
            <h2 style={formTitleStyle}>Become a VIP</h2>

            {message && <div style={messageStyle}>{message}</div>}

            <div style={twoColStyle}>
              <Field
                label="FIRST NAME"
                value={firstName}
                onChange={setFirstName}
                placeholder="First name"
              />

              <Field
                label="LAST NAME"
                value={lastName}
                onChange={setLastName}
                placeholder="Last name"
              />
            </div>

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

            <Field
              label="BIRTHDAY"
              value={birthday}
              onChange={setBirthday}
              type="date"
            />

            <Field
              label="FAVORITE MENU ITEM"
              value={favoriteItem}
              onChange={setFavoriteItem}
              placeholder="What's your go-to?"
            />

            <label style={consentStyle}>
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
              />
              <span>
                Send me VIP offers and restaurant updates by text. Message and
                data rates may apply. Reply STOP to opt out.
              </span>
            </label>

            <label style={consentStyle}>
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
              />
              <span>Send me VIP offers and restaurant updates by email.</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              style={{ ...joinButtonStyle, background: secondary }}
            >
              {saving ? "JOINING..." : "JOIN VIP CLUB"}
            </button>

            <p style={finePrintStyle}>
              By joining, you agree to receive communications you selected
              above. You can opt out at any time.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div style={benefitStyle}>
      <div style={benefitTitleStyle}>{title}</div>
      <div style={benefitTextStyle}>{text}</div>
    </div>
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
  maxWidth: "1180px",
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
  gridTemplateColumns: "minmax(0,1fr) minmax(360px,.75fr)",
  gap: "60px",
  alignItems: "start",
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
  fontWeight: 900,
  letterSpacing: "-4px",
  margin: "16px 0 24px",
};

const heroTextStyle = {
  maxWidth: "650px",
  color: "#e2e8f0",
  fontSize: "21px",
  lineHeight: 1.6,
};

const benefitGridStyle = {
  display: "grid",
  gap: "12px",
  marginTop: "34px",
};

const benefitStyle = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "14px",
  padding: "18px",
};

const benefitTitleStyle = {
  fontWeight: 900,
  fontSize: "13px",
  letterSpacing: "1px",
};

const benefitTextStyle = {
  color: "#cbd5e1",
  lineHeight: 1.5,
  marginTop: "6px",
  fontSize: "14px",
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

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "12px",
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

const consentStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  fontSize: "12px",
  lineHeight: 1.5,
  margin: "14px 0",
};

const joinButtonStyle = {
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
  fontSize: "10px",
  lineHeight: 1.5,
  marginBottom: 0,
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
  maxWidth: "680px",
  margin: "12vh auto 0",
  background: "#0f1d2e",
  border: "1px solid #2a4058",
  borderRadius: "22px",
  padding: "38px",
};

const successTitleStyle = {
  fontSize: "clamp(58px,10vw,100px)",
  lineHeight: ".88",
  margin: "14px 0 22px",
  fontWeight: 900,
  letterSpacing: "-4px",
};

const successTextStyle = {
  color: "#cbd5e1",
  fontSize: "18px",
  lineHeight: 1.6,
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
