"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Props = {
  restaurantId: string;
  slug: string;
};

type Restaurant = {
  id: string;
  name: string;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

type Website = {
  published: boolean | null;
  about_title: string | null;
  about_body: string | null;
};

type Ordering = {
  online_ordering_url: string | null;
  catering_email: string | null;
};

export default function ViPollosCustomTheme({
  restaurantId,
  slug,
}: Props) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [ordering, setOrdering] = useState<Ordering | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [restaurantResult, websiteResult, orderingResult] = await Promise.all([
        supabase
          .from("restaurants")
          .select("id,name,phone,address_line_1,city,state,zip")
          .eq("id", restaurantId)
          .maybeSingle(),

        supabase
          .from("restaurant_website_settings")
          .select("published,about_title,about_body")
          .eq("restaurant_id", restaurantId)
          .maybeSingle(),

        supabase
          .from("restaurant_ordering")
          .select("online_ordering_url,catering_email")
          .eq("restaurant_id", restaurantId)
          .maybeSingle(),
      ]);

      setRestaurant(restaurantResult.data || null);
      setWebsite(websiteResult.data || null);
      setOrdering(orderingResult.data || null);
      setLoading(false);
    }

    load();
  }, [restaurantId]);

  if (loading) {
    return <main style={centerStyle}>Loading Vi Pollos...</main>;
  }

  if (!restaurant || !website?.published) {
    return (
      <main style={centerStyle}>
        <div>
          <div style={eyebrowStyle}>VI POLLOS</div>
          <h1 style={draftTitleStyle}>Migration Site In Progress</h1>
          <p style={draftTextStyle}>
            The approved Vi Pollos design is being migrated into Restaurant OS.
            The current live website remains untouched until cutover.
          </p>
        </div>
      </main>
    );
  }

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main style={{ background: "#f4ead8", color: "#0d345a", fontFamily: "Arial, Helvetica, sans-serif" }}>
      {/* This structure intentionally mirrors the already-approved Vi Pollos site.
          Real approved photos/assets are plugged into this custom theme next. */}

      <header style={headerStyle}>
        <div style={brandStyle}>VI POLLOS</div>
        <nav style={navStyle}>
          <a href="#story" style={navLinkStyle}>OUR STORY</a>
          <a href="#menu" style={navLinkStyle}>MENU</a>
          <a href="#visit" style={navLinkStyle}>VISIT</a>
          {ordering?.online_ordering_url && (
            <a
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
              style={orderButtonStyle}
            >
              ORDER ONLINE
            </a>
          )}
        </nav>
      </header>

      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <div style={heroWhiteStyle}>MADE WITH PRIDE.</div>
          <div style={heroBlueStyle}>FLAVOR THAT<br />BRINGS US<br />TOGETHER.</div>
          <p style={heroTextStyle}>
            Authentic Honduran food made with family recipes, fresh ingredients,
            and the heart of our people.
          </p>
          <div style={heroButtonsStyle}>
            {ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={primaryButtonStyle}
              >
                ORDER ONLINE →
              </a>
            )}
            <a href="#menu" style={secondaryButtonStyle}>MENU</a>
          </div>
        </div>

        <div style={assetPlaceholderStyle}>
          APPROVED HERO PHOTO
        </div>
      </section>

      <section style={valueStripStyle}>
        <div>🐔 VOTED BEST CHICKEN</div>
        <div>🌿 FRESH INGREDIENTS</div>
        <div>♥ FAMILY RECIPES</div>
        <div>🇭🇳 PROUDLY HONDURAN</div>
      </section>

      <section id="story" style={storyGridStyle}>
        <div style={storyCopyStyle}>
          <div style={goldEyebrowStyle}>OUR STORY</div>
          <h2 style={storyTitleStyle}>
            {website.about_title || "From our roots to your table"}
          </h2>
          <p style={storyTextStyle}>
            {website.about_body ||
              "Vi Pollos was born from the dream of a Honduran family that arrived with hope and hard work. Today, we continue honoring our traditions with every plate we serve."}
          </p>
          <div style={scriptStyle}>With love,<br />The Vi Pollos Family</div>
        </div>

        <div style={assetPlaceholderLightStyle}>APPROVED FAMILY PHOTO</div>

        <div style={whyStyle}>
          <h3 style={whyTitleStyle}>WHY VI POLLOS</h3>
          <div style={whyGridStyle}>
            <ValueCard text="AUTHENTIC HONDURAN FLAVOR" />
            <ValueCard text="MADE FRESH EVERY DAY" />
            <ValueCard text="FAMILY RECIPES" />
            <ValueCard text="WARM HOSPITALITY" />
          </div>
        </div>
      </section>

      <section id="menu" style={lowerGridStyle}>
        <div style={cateringStyle}>
          <div style={goldEyebrowStyle}>FOR EVERY OCCASION</div>
          <h2 style={lowerTitleStyle}>CATERING &<br />FAMILY MEALS</h2>
          <p style={lowerTextStyle}>
            From family gatherings to special events, we bring the flavor of Honduras to your table.
          </p>
          {ordering?.catering_email && (
            <a href={`mailto:${ordering.catering_email}`} style={outlineButtonStyle}>
              PLAN YOUR EVENT →
            </a>
          )}
        </div>

        <div style={quoteStyle}>
          <div style={quoteMarkStyle}>“</div>
          <p style={quoteTextStyle}>
            The best grilled chicken I’ve had outside Honduras. It tastes like home,
            family, and our roots.
          </p>
          <div style={starsStyle}>★★★★★</div>
          <div style={guestStyle}>HAPPY VI POLLOS GUEST</div>
        </div>

        <div id="visit" style={visitStyle}>
          <h2 style={visitTitleStyle}>VISIT US</h2>
          <div style={visitTextStyle}>📍 {address}</div>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} style={visitPhoneStyle}>
              ☎ {restaurant.phone}
            </a>
          )}
        </div>
      </section>

      <footer style={footerStyle}>
        © {new Date().getFullYear()} Vi Pollos. All rights reserved.
      </footer>
    </main>
  );
}

function ValueCard({ text }: { text: string }) {
  return (
    <div style={valueCardStyle}>
      <div style={valueIconStyle}>✦</div>
      <div>{text}</div>
    </div>
  );
}

const centerStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  textAlign: "center" as const,
  padding: 30,
  background: "#071421",
  color: "#ffffff",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const eyebrowStyle = { color: "#f6b71b", fontSize: 11, fontWeight: 900, letterSpacing: 2 };
const draftTitleStyle = { fontSize: "clamp(42px,7vw,72px)", margin: "8px 0" };
const draftTextStyle = { maxWidth: 650, color: "#a9b8c7", lineHeight: 1.6 };

const headerStyle = {
  minHeight: 78,
  background: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 5vw",
  gap: 20,
  flexWrap: "wrap" as const,
};

const brandStyle = { fontSize: 26, fontWeight: 1000, letterSpacing: 1 };
const navStyle = { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const };
const navLinkStyle = { color: "#0d345a", textDecoration: "none", fontSize: 10, fontWeight: 900 };
const orderButtonStyle = { background: "#1267b2", color: "#fff", textDecoration: "none", padding: "13px 16px", fontSize: 10, fontWeight: 900 };

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1.65fr",
  minHeight: 560,
  background: "#000",
};

const heroCopyStyle = { padding: "48px 5vw", alignSelf: "center" };
const heroWhiteStyle = { color: "#fff", fontSize: "clamp(48px,6vw,76px)", lineHeight: .9, fontWeight: 1000 };
const heroBlueStyle = { color: "#1267b2", fontSize: "clamp(42px,5vw,66px)", lineHeight: .88, fontWeight: 1000, marginTop: 12 };
const heroTextStyle = { color: "#fff", maxWidth: 420, lineHeight: 1.55, marginTop: 24 };
const heroButtonsStyle = { display: "flex", gap: 12, marginTop: 22 };
const primaryButtonStyle = { background: "#1267b2", color: "#fff", textDecoration: "none", padding: "14px 18px", fontSize: 10, fontWeight: 900 };
const secondaryButtonStyle = { border: "1px solid #fff", color: "#fff", textDecoration: "none", padding: "14px 18px", fontSize: 10, fontWeight: 900 };

const assetPlaceholderStyle = {
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#4c4c4c,#1a1a1a)",
  color: "#ffffff",
  fontSize: 12,
  letterSpacing: 2,
  fontWeight: 900,
};

const valueStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  background: "#f4ead8",
  borderBottom: "1px solid #d8cab4",
};

const storyGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr .85fr 1.7fr",
  minHeight: 520,
};

const storyCopyStyle = { background: "#0d4676", color: "#fff", padding: "48px 5vw" };
const goldEyebrowStyle = { color: "#f6b71b", fontSize: 10, fontWeight: 900, letterSpacing: 1.3 };
const storyTitleStyle = { fontFamily: "Georgia, serif", fontSize: "clamp(42px,5vw,64px)", lineHeight: .96, margin: "10px 0 20px" };
const storyTextStyle = { lineHeight: 1.65, fontSize: 14 };
const scriptStyle = { color: "#f6b71b", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 20, marginTop: 22 };

const assetPlaceholderLightStyle = {
  display: "grid",
  placeItems: "center",
  background: "#d6d1c8",
  color: "#0d345a",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 1.6,
};

const whyStyle = { padding: "38px 4vw" };
const whyTitleStyle = { fontFamily: "Georgia, serif", textAlign: "center" as const, fontSize: 28, letterSpacing: 1 };
const whyGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 };
const valueCardStyle = { background: "#fffaf1", minHeight: 120, display: "flex", alignItems: "center", gap: 16, padding: 22, fontSize: 11, fontWeight: 900 };
const valueIconStyle = { width: 46, height: 46, borderRadius: "50%", border: "2px solid #1267b2", display: "grid", placeItems: "center", color: "#1267b2" };

const lowerGridStyle = { display: "grid", gridTemplateColumns: "1.15fr 1.1fr .95fr", borderTop: "3px solid #d7a41b" };
const cateringStyle = { background: "#1f140f", color: "#fff", padding: "44px 5vw" };
const lowerTitleStyle = { fontFamily: "Georgia, serif", fontSize: 36, margin: "8px 0 14px" };
const lowerTextStyle = { lineHeight: 1.5, fontSize: 13 };
const outlineButtonStyle = { display: "inline-block", marginTop: 18, color: "#fff", border: "1px solid #fff", textDecoration: "none", padding: "12px 14px", fontSize: 10, fontWeight: 900 };

const quoteStyle = { background: "#0d4676", color: "#fff", padding: "38px 5vw", textAlign: "center" as const };
const quoteMarkStyle = { color: "#f6b71b", fontSize: 48, lineHeight: 1 };
const quoteTextStyle = { fontFamily: "Georgia, serif", fontSize: 19, lineHeight: 1.45 };
const starsStyle = { color: "#f6b71b", letterSpacing: 4, marginTop: 18 };
const guestStyle = { fontSize: 9, fontWeight: 900, letterSpacing: 2, marginTop: 8 };

const visitStyle = { padding: "38px 4vw", background: "#f4ead8" };
const visitTitleStyle = { fontFamily: "Georgia, serif", fontSize: 30, margin: "0 0 18px" };
const visitTextStyle = { fontSize: 12, lineHeight: 1.6 };
const visitPhoneStyle = { display: "block", color: "#0d345a", marginTop: 10, fontWeight: 900, textDecoration: "none" };

const footerStyle = { background: "#0d4676", color: "#d7e2ec", textAlign: "center" as const, padding: 18, fontSize: 10 };
