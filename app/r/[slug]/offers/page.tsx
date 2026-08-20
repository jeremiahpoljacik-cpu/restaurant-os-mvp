"use client";

import { useEffect, useState } from "react";
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

type Offer = {
  id: string;
  name: string;
  headline: string;
  description: string | null;
  terms: string | null;
  expires_at: string | null;
  active: boolean;
};

export default function PublicOffersPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    load(slug);
  }, [slug]);

  async function load(siteSlug: string) {
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

    setRestaurant(restaurantData);

    const [brandingResult, offersResult] = await Promise.all([
      publicSupabase
        .from("restaurant_branding")
        .select("primary_color,secondary_color,tagline")
        .eq("restaurant_id", restaurantData.id)
        .maybeSingle(),

      publicSupabase
        .from("restaurant_vip_offers")
        .select("id,name,headline,description,terms,expires_at,active")
        .eq("restaurant_id", restaurantData.id)
        .eq("active", true)
        .order("created_at", { ascending: false }),
    ]);

    setBranding(brandingResult.data || null);
    setOffers(offersResult.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={messageCardStyle}>Loading offers...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={messageCardStyle}>Restaurant not found.</div>
      </main>
    );
  }

  const primary = branding?.primary_color || "#0b3a67";
  const secondary = branding?.secondary_color || "#f5b82e";

  return (
    <main
      style={{
        ...pageStyle,
        background: `linear-gradient(135deg, ${primary}, #07101c 72%)`,
      }}
    >
      <div style={shellStyle}>
        <a href={`/r/${restaurant.slug}`} style={backLinkStyle}>
          ← BACK TO {restaurant.name.toUpperCase()}
        </a>

        <div style={eyebrowStyle}>VIP OFFERS</div>

        <h1 style={titleStyle}>SPECIALS WORTH COMING BACK FOR.</h1>

        <p style={introStyle}>
          {branding?.tagline ||
            `Current offers and VIP promotions from ${restaurant.name}.`}
        </p>

        {offers.length === 0 ? (
          <section style={emptyStyle}>
            <div style={emptyTitleStyle}>No active offers right now.</div>
            <div style={emptyTextStyle}>
              Check back soon for the next drop.
            </div>

            <a
              href={`/r/${restaurant.slug}/vip`}
              style={{ ...vipButtonStyle, background: secondary }}
            >
              JOIN THE VIP CLUB
            </a>
          </section>
        ) : (
          <section style={offersGridStyle}>
            {offers.map((offer) => (
              <article key={offer.id} style={offerCardStyle}>
                <div style={offerTopRowStyle}>
                  <div style={offerLabelStyle}>VIP OFFER</div>

                  {offer.expires_at && (
                    <div style={expiresStyle}>
                      ENDS{" "}
                      {new Date(offer.expires_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>

                <h2 style={offerHeadlineStyle}>{offer.headline}</h2>

                {offer.description && (
                  <p style={descriptionStyle}>{offer.description}</p>
                )}

                {offer.terms && (
                  <div style={termsStyle}>
                    <strong>DETAILS:</strong> {offer.terms}
                  </div>
                )}

                <div style={buttonRowStyle}>
                  <a
                    href={`/r/${restaurant.slug}/vip`}
                    style={{ ...primaryButtonStyle, background: secondary }}
                  >
                    JOIN VIP CLUB
                  </a>

                  <a
                    href={`/r/${restaurant.slug}`}
                    style={secondaryButtonStyle}
                  >
                    VIEW RESTAURANT
                  </a>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
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

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  maxWidth: "900px",
  fontSize: "clamp(56px,9vw,108px)",
  lineHeight: ".86",
  fontWeight: 900,
  letterSpacing: "-4px",
  margin: "16px 0 24px",
};

const introStyle = {
  maxWidth: "650px",
  color: "#e2e8f0",
  fontSize: "20px",
  lineHeight: 1.6,
  marginBottom: "38px",
};

const offersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: "18px",
};

const offerCardStyle = {
  background: "#f3eadc",
  color: "#07101c",
  borderRadius: "20px",
  padding: "26px",
  boxShadow: "0 18px 50px rgba(0,0,0,.2)",
};

const offerTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const offerLabelStyle = {
  color: "#a46b00",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const expiresStyle = {
  color: "#6b645b",
  fontSize: "10px",
  fontWeight: 900,
};

const offerHeadlineStyle = {
  fontSize: "clamp(34px,5vw,54px)",
  lineHeight: ".95",
  letterSpacing: "-2px",
  margin: "22px 0 14px",
  fontWeight: 900,
};

const descriptionStyle = {
  fontSize: "17px",
  lineHeight: 1.6,
  marginBottom: "18px",
};

const termsStyle = {
  background: "#fffaf0",
  border: "1px solid #d9cab6",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "12px",
  lineHeight: 1.5,
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "22px",
};

const primaryButtonStyle = {
  color: "#07101c",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: 900,
};

const secondaryButtonStyle = {
  color: "#07101c",
  textDecoration: "none",
  border: "1px solid #9f927e",
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: 900,
};

const emptyStyle = {
  maxWidth: "650px",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: "20px",
  padding: "32px",
};

const emptyTitleStyle = {
  fontSize: "28px",
  fontWeight: 900,
};

const emptyTextStyle = {
  color: "#cbd5e1",
  marginTop: "8px",
  marginBottom: "22px",
};

const vipButtonStyle = {
  display: "inline-block",
  color: "#07101c",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: 900,
};

const messageCardStyle = {
  maxWidth: "520px",
  margin: "12vh auto 0",
  background: "#0f1d2e",
  border: "1px solid #2a4058",
  borderRadius: "18px",
  padding: "28px",
};

