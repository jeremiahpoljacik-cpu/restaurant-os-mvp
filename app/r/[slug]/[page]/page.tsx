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
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

type Branding = {
  primary_color: string | null;
  secondary_color: string | null;
  tagline: string | null;
};

type WebsiteSettings = {
  logo_url: string | null;
  published: boolean;
};

type PageRow = {
  id: string;
  restaurant_id: string;
  page_type: string;
  title: string;
  slug: string;
  nav_label: string | null;
  content: string | null;
  hero_image_url: string | null;
  active: boolean;
  show_in_nav: boolean;
  sort_order: number;
};

type SocialRow = {
  id: string;
  platform: string;
  url: string;
  active: boolean;
  sort_order: number;
};

export default function PublicCustomPage() {
  const params = useParams<{ slug: string; page: string }>();

  const siteSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const pageSlug = Array.isArray(params?.page) ? params.page[0] : params?.page;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [website, setWebsite] = useState<WebsiteSettings | null>(null);
  const [page, setPage] = useState<PageRow | null>(null);
  const [navPages, setNavPages] = useState<PageRow[]>([]);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteSlug || !pageSlug) return;
    loadPage(siteSlug, pageSlug);
  }, [siteSlug, pageSlug]);

  async function loadPage(siteSlugValue: string, pageSlugValue: string) {
    setLoading(true);

    const { data: restaurantData } = await publicSupabase
      .from("restaurants")
      .select("id,name,slug,phone,address_line_1,city,state,zip")
      .eq("slug", siteSlugValue)
      .maybeSingle();

    if (!restaurantData) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    const restaurantId = restaurantData.id;

    const [
      brandingResult,
      websiteResult,
      pageResult,
      navResult,
      socialResult,
    ] = await Promise.all([
      publicSupabase
        .from("restaurant_branding")
        .select("primary_color,secondary_color,tagline")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      publicSupabase
        .from("restaurant_website_settings")
        .select("logo_url,published")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      publicSupabase
        .from("restaurant_pages")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("slug", pageSlugValue)
        .eq("active", true)
        .maybeSingle(),

      publicSupabase
        .from("restaurant_pages")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("active", true)
        .eq("show_in_nav", true)
        .order("sort_order", { ascending: true }),

      publicSupabase
        .from("restaurant_social_links")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);

    setBranding(brandingResult.data || null);
    setWebsite(websiteResult.data || null);
    setPage(pageResult.data || null);
    setNavPages(navResult.data || []);
    setSocials(socialResult.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main style={loadingStyle}>
        <div style={loadingCardStyle}>Loading page...</div>
      </main>
    );
  }

  if (!restaurant || !website?.published || !page) {
    return (
      <main style={loadingStyle}>
        <div style={loadingCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={{ margin: "10px 0 8px" }}>Page not available</h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            This page could not be found or is not currently published.
          </p>
        </div>
      </main>
    );
  }

  const primary = branding?.primary_color || "#0b3a67";
  const secondary = branding?.secondary_color || "#f5b82e";

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main style={pageStyle}>
      <header style={navStyle}>
        <div style={navInnerStyle}>
          <a href={`/r/${restaurant.slug}`} style={brandLinkStyle}>
            {website.logo_url ? (
              <img
                src={website.logo_url}
                alt={`${restaurant.name} logo`}
                style={navLogoStyle}
              />
            ) : (
              <span style={brandNameStyle}>{restaurant.name}</span>
            )}
          </a>

          <nav style={navLinksStyle}>
            <a href={`/r/${restaurant.slug}`} style={navAnchorStyle}>
              HOME
            </a>

            {navPages.map((navPage) => (
              <a
                key={navPage.id}
                href={`/r/${restaurant.slug}/${navPage.slug}`}
                style={{
                  ...navAnchorStyle,
                  color:
                    navPage.slug === page.slug ? secondary : "#ffffff",
                }}
              >
                {navPage.nav_label || navPage.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section
        style={{
          ...heroStyle,
          background: page.hero_image_url
            ? `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.4)), url("${page.hero_image_url}") center/cover`
            : `linear-gradient(135deg, ${primary}, #07101c 72%)`,
        }}
      >
        <div style={heroInnerStyle}>
          <div style={heroKickerStyle}>
            {page.page_type.toUpperCase()}
          </div>

          <h1 style={heroHeadlineStyle}>{page.title}</h1>

          {branding?.tagline && (
            <p style={heroTextStyle}>{branding.tagline}</p>
          )}
        </div>
      </section>

      <section style={contentSectionStyle}>
        <div style={contentInnerStyle}>
          <article style={articleStyle}>
            <div style={eyebrowDarkStyle}>MORE FROM {restaurant.name}</div>

            <div style={contentBodyStyle}>
              {(page.content || "Content coming soon.")
                .split("\n")
                .map((paragraph, index) =>
                  paragraph.trim() ? (
                    <p key={index} style={paragraphStyle}>
                      {paragraph}
                    </p>
                  ) : (
                    <div key={index} style={{ height: "10px" }} />
                  )
                )}
            </div>
          </article>

          <aside style={sidebarStyle}>
            <div style={sidebarLabelStyle}>VISIT US</div>

            {address && <div style={sidebarTextStyle}>{address}</div>}

            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                style={sidebarLinkStyle}
              >
                {restaurant.phone}
              </a>
            )}

            {socials.length > 0 && (
              <div style={{ marginTop: "28px" }}>
                <div style={sidebarLabelStyle}>FOLLOW US</div>

                <div style={socialListStyle}>
                  {socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...socialLinkStyle,
                        borderColor: secondary,
                      }}
                    >
                      {social.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <a
              href={`/r/${restaurant.slug}`}
              style={{
                ...homeButtonStyle,
                background: secondary,
              }}
            >
              BACK TO HOME
            </a>
          </aside>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={footerInnerStyle}>
          <div style={footerBrandStyle}>{restaurant.name}</div>

          <div style={footerNavStyle}>
            <a
              href={`/r/${restaurant.slug}`}
              style={footerLinkStyle}
            >
              Home
            </a>

            {navPages.map((navPage) => (
              <a
                key={navPage.id}
                href={`/r/${restaurant.slug}/${navPage.slug}`}
                style={footerLinkStyle}
              >
                {navPage.nav_label || navPage.title}
              </a>
            ))}
          </div>

          <div style={footerTextStyle}>Powered by Restaurant OS</div>
        </div>
      </footer>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#070b11",
  color: "#ffffff",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingStyle = {
  minHeight: "100vh",
  background: "#07101c",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingCardStyle = {
  maxWidth: "520px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "28px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const navStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
  background: "rgba(5,9,14,.94)",
  backdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(255,255,255,.08)",
};

const navInnerStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "14px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
};

const brandLinkStyle = {
  textDecoration: "none",
  color: "#ffffff",
};

const navLogoStyle = {
  height: "54px",
  maxWidth: "150px",
  objectFit: "contain" as const,
};

const brandNameStyle = {
  fontWeight: 900,
  fontSize: "21px",
};

const navLinksStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end",
};

const navAnchorStyle = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "12px",
};

const heroStyle = {
  minHeight: "520px",
  display: "flex",
  alignItems: "end",
};

const heroInnerStyle = {
  width: "100%",
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "80px 24px",
};

const heroKickerStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const heroHeadlineStyle = {
  maxWidth: "900px",
  fontSize: "clamp(56px,9vw,110px)",
  lineHeight: ".86",
  margin: "18px 0 16px",
  fontWeight: 900,
  letterSpacing: "-4px",
};

const heroTextStyle = {
  maxWidth: "650px",
  color: "#e2e8f0",
  fontSize: "20px",
  lineHeight: 1.5,
};

const contentSectionStyle = {
  background: "#f3eadc",
  color: "#07101c",
  padding: "80px 24px",
};

const contentInnerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(280px,.36fr)",
  gap: "50px",
  alignItems: "start",
};

const articleStyle = {
  minWidth: 0,
};

const eyebrowDarkStyle = {
  color: "#b57a00",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
  marginBottom: "20px",
};

const contentBodyStyle = {
  maxWidth: "780px",
};

const paragraphStyle = {
  fontSize: "20px",
  lineHeight: 1.75,
  margin: "0 0 22px",
  whiteSpace: "pre-wrap" as const,
};

const sidebarStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "24px",
  position: "sticky" as const,
  top: "92px",
};

const sidebarLabelStyle = {
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
  color: "#8b6b2d",
  marginBottom: "10px",
};

const sidebarTextStyle = {
  lineHeight: 1.5,
  marginBottom: "10px",
};

const sidebarLinkStyle = {
  color: "#07101c",
  fontWeight: 900,
  textDecoration: "none",
};

const socialListStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const socialLinkStyle = {
  color: "#07101c",
  textDecoration: "none",
  border: "1px solid",
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "12px",
  fontWeight: 900,
};

const homeButtonStyle = {
  display: "block",
  color: "#07101c",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "13px 15px",
  fontWeight: 900,
  textAlign: "center" as const,
  marginTop: "28px",
};

const footerStyle = {
  background: "#05090e",
  color: "#ffffff",
  padding: "28px 24px",
};

const footerInnerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
};

const footerBrandStyle = {
  fontWeight: 900,
};

const footerNavStyle = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap" as const,
};

const footerLinkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 800,
};

const footerTextStyle = {
  color: "#64748b",
  fontSize: "12px",
};
