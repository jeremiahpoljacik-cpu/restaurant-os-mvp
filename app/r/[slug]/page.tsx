"use client";

import { useEffect, useMemo, useState } from "react";
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
  cuisine_category: string | null;
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
  short_description: string | null;
};

type WebsiteSettings = {
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  about_title: string | null;
  about_body: string | null;
  primary_cta_label: string | null;
  secondary_cta_label: string | null;
  show_about: boolean;
  show_menu: boolean;
  show_ordering: boolean;
  show_vip: boolean;
  published: boolean;
};

type Hours = {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
};

type Ordering = {
  online_ordering_url: string | null;
  catering_email: string | null;
};

type Growth = {
  vip_club_name: string | null;
  signup_offer: string | null;
  birthday_offer: string | null;
};

type Category = {
  id: string;
  name: string;
  sort_order: number;
};

type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  featured: boolean;
  sort_order: number;
};

export default function PublicRestaurantPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [website, setWebsite] = useState<WebsiteSettings | null>(null);
  const [hours, setHours] = useState<Hours | null>(null);
  const [ordering, setOrdering] = useState<Ordering | null>(null);
  const [growth, setGrowth] = useState<Growth | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    loadSite(slug);
  }, [slug]);

  async function loadSite(siteSlug: string) {
    setLoading(true);

    const { data: restaurantData } = await publicSupabase
      .from("restaurants")
      .select("*")
      .eq("slug", siteSlug)
      .maybeSingle();

    if (!restaurantData) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    const restaurantId = restaurantData.id;

    const [
      websiteResult,
      brandingResult,
      hoursResult,
      orderingResult,
      growthResult,
      categoriesResult,
      itemsResult,
    ] = await Promise.all([
      publicSupabase
        .from("restaurant_website_settings")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_branding")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_hours")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_ordering")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_growth_settings")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      publicSupabase
        .from("restaurant_menu_categories")
        .select("id,name,sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      publicSupabase
        .from("restaurant_menu_items")
        .select("id,category_id,name,description,price,featured,sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    setWebsite(websiteResult.data || null);
    setBranding(brandingResult.data || null);
    setHours(hoursResult.data || null);
    setOrdering(orderingResult.data || null);
    setGrowth(growthResult.data || null);
    setCategories(categoriesResult.data || []);
    setItems(itemsResult.data || []);
    setLoading(false);
  }

  const menuGroups = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.category_id === category.id),
    }));
  }, [categories, items]);

  if (loading) {
    return (
      <main style={loadingStyle}>
        <div style={loadingCardStyle}>Loading restaurant...</div>
      </main>
    );
  }

  if (!restaurant || !website?.published) {
    return (
      <main style={loadingStyle}>
        <div style={loadingCardStyle}>
          <div style={smallEyebrowStyle}>RESTAURANT OS</div>
          <h1 style={{ margin: "10px 0 8px" }}>Site not available</h1>
          <p style={{ margin: 0, color: "#94a3b8" }}>
            This restaurant website has not been published yet.
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

  const heroHeadline =
    website.hero_headline || restaurant.name.toUpperCase();

  const heroSubheadline =
    website.hero_subheadline ||
    branding?.tagline ||
    branding?.short_description ||
    "Great food. Local flavor. Your table is waiting.";

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main
      style={{
        ...pageStyle,
        background: "#070b11",
        color: "#ffffff",
      }}
    >
      <header style={navStyle}>
        <div style={navInnerStyle}>
          <button
            onClick={() => scrollTo("top")}
            style={brandButtonStyle}
          >
            {website.logo_url ? (
              <img
                src={website.logo_url}
                alt={`${restaurant.name} logo`}
                style={navLogoStyle}
              />
            ) : (
              <span style={brandNameStyle}>{restaurant.name}</span>
            )}
          </button>

          <nav style={navLinksStyle}>
            {website.show_about && (
              <button style={navLinkStyle} onClick={() => scrollTo("about")}>
                OUR STORY
              </button>
            )}

            {website.show_menu && (
              <button style={navLinkStyle} onClick={() => scrollTo("menu")}>
                MENU
              </button>
            )}

            <button style={navLinkStyle} onClick={() => scrollTo("contact")}>
              CONTACT
            </button>

            {website.show_ordering && ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...navOrderStyle,
                  background: secondary,
                  color: "#07101c",
                }}
              >
                {website.primary_cta_label || "ORDER ONLINE"}
              </a>
            )}
          </nav>
        </div>
      </header>

      <section
        id="top"
        style={{
          ...heroStyle,
          background: website.hero_image_url
            ? `linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.58) 52%, rgba(0,0,0,.34) 100%), url("${website.hero_image_url}") center/cover`
            : `linear-gradient(135deg, ${primary} 0%, #07101c 70%)`,
        }}
      >
        <div style={heroInnerStyle}>
          <div style={heroKickerStyle}>
            {restaurant.cuisine_category || "LOCAL RESTAURANT"}
          </div>

          <h1 style={heroHeadlineStyle}>{heroHeadline}</h1>

          <p style={heroTextStyle}>{heroSubheadline}</p>

          <div style={heroButtonsStyle}>
            {website.show_ordering && ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...primaryCtaStyle,
                  background: secondary,
                  color: "#07101c",
                }}
              >
                {website.primary_cta_label || "ORDER ONLINE"}
              </a>
            )}

            {website.show_menu && (
              <button
                onClick={() => scrollTo("menu")}
                style={secondaryCtaStyle}
              >
                {website.secondary_cta_label || "VIEW MENU"}
              </button>
            )}
          </div>

          <div style={quickInfoStyle}>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} style={quickInfoLinkStyle}>
                ☎ {restaurant.phone}
              </a>
            )}

            {address && (
              <div style={quickInfoTextStyle}>📍 {address}</div>
            )}
          </div>
        </div>
      </section>

      {website.show_about && (
        <section id="about" style={lightSectionStyle}>
          <div style={contentInnerStyle}>
            <div style={sectionEyebrowStyle}>OUR STORY</div>

            <div style={aboutGridStyle}>
              <h2 style={sectionHeadlineStyle}>
                {website.about_title || `ABOUT ${restaurant.name.toUpperCase()}`}
              </h2>

              <p style={sectionBodyStyle}>
                {website.about_body ||
                  branding?.short_description ||
                  "Locally owned, proudly served, and built around great food and great people."}
              </p>
            </div>
          </div>
        </section>
      )}

      {website.show_menu && (
        <section id="menu" style={menuSectionStyle}>
          <div style={contentInnerStyle}>
            <div style={sectionEyebrowStyle}>OUR MENU</div>

            <h2 style={menuHeadlineStyle}>
              COME HUNGRY.
              <br />
              LEAVE HAPPY.
            </h2>

            {menuGroups.length === 0 ? (
              <div style={emptyMenuStyle}>
                Menu coming soon.
              </div>
            ) : (
              <div style={menuGridStyle}>
                {menuGroups.map((category) => (
                  <article key={category.id} style={menuCategoryStyle}>
                    <h3 style={menuCategoryTitleStyle}>{category.name}</h3>

                    {category.items.length === 0 ? (
                      <div style={menuEmptyCategoryStyle}>
                        Items coming soon.
                      </div>
                    ) : (
                      <div>
                        {category.items.map((item) => (
                          <div key={item.id} style={menuItemStyle}>
                            <div style={{ minWidth: 0 }}>
                              <div style={menuItemNameStyle}>
                                {item.name}
                                {item.featured && (
                                  <span style={featuredStyle}>★</span>
                                )}
                              </div>

                              {item.description && (
                                <p style={menuItemDescriptionStyle}>
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {item.price !== null && (
                              <div style={priceStyle}>
                                ${Number(item.price).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {website.show_vip && (
        <section
          style={{
            ...vipSectionStyle,
            background: primary,
          }}
        >
          <div style={vipInnerStyle}>
            <div>
              <div style={vipEyebrowStyle}>VIP CLUB</div>

              <h2 style={vipHeadlineStyle}>
                {growth?.vip_club_name || `JOIN THE ${restaurant.name.toUpperCase()} VIP CLUB`}
              </h2>

              <p style={vipTextStyle}>
                {growth?.signup_offer ||
                  "Get restaurant news, special offers and VIP-only perks."}
              </p>
            </div>

            <button
              style={{
                ...vipButtonStyle,
                background: secondary,
              }}
              onClick={() => alert("VIP signup form is the next module we are connecting.")}
            >
              JOIN THE VIP CLUB
            </button>
          </div>
        </section>
      )}

      <section id="contact" style={contactSectionStyle}>
        <div style={contentInnerStyle}>
          <div style={sectionEyebrowStyle}>VISIT US</div>

          <div style={contactGridStyle}>
            <div>
              <h2 style={contactHeadlineStyle}>{restaurant.name}</h2>

              {address && <p style={contactTextStyle}>{address}</p>}

              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} style={contactLinkStyle}>
                  {restaurant.phone}
                </a>
              )}

              {ordering?.catering_email && (
                <a
                  href={`mailto:${ordering.catering_email}`}
                  style={contactLinkStyle}
                >
                  {ordering.catering_email}
                </a>
              )}
            </div>

            {hours && (
              <div style={hoursCardStyle}>
                <div style={hoursTitleStyle}>HOURS</div>
                <HoursRow day="Monday" value={hours.monday} />
                <HoursRow day="Tuesday" value={hours.tuesday} />
                <HoursRow day="Wednesday" value={hours.wednesday} />
                <HoursRow day="Thursday" value={hours.thursday} />
                <HoursRow day="Friday" value={hours.friday} />
                <HoursRow day="Saturday" value={hours.saturday} />
                <HoursRow day="Sunday" value={hours.sunday} />
              </div>
            )}
          </div>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={footerInnerStyle}>
          <div style={footerBrandStyle}>{restaurant.name}</div>
          <div style={footerTextStyle}>
            Powered by Restaurant OS
          </div>
        </div>
      </footer>
    </main>
  );
}

function HoursRow({
  day,
  value,
}: {
  day: string;
  value: string | null;
}) {
  return (
    <div style={hoursRowStyle}>
      <span>{day}</span>
      <span>{value || "Closed"}</span>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
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
  width: "100%",
  maxWidth: "520px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "28px",
};

const smallEyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  letterSpacing: "2px",
  fontWeight: 900,
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

const brandButtonStyle = {
  border: 0,
  padding: 0,
  background: "transparent",
  color: "#ffffff",
  cursor: "pointer",
};

const navLogoStyle = {
  height: "54px",
  maxWidth: "150px",
  objectFit: "contain" as const,
};

const brandNameStyle = {
  fontWeight: 900,
  fontSize: "21px",
  letterSpacing: "-.5px",
};

const navLinksStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end",
};

const navLinkStyle = {
  background: "transparent",
  border: 0,
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "12px",
};

const navOrderStyle = {
  textDecoration: "none",
  padding: "12px 15px",
  borderRadius: "9px",
  fontWeight: 900,
  fontSize: "12px",
};

const heroStyle = {
  minHeight: "760px",
  display: "flex",
  alignItems: "center",
};

const heroInnerStyle = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "90px 24px",
};

const heroKickerStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
};

const heroHeadlineStyle = {
  maxWidth: "880px",
  fontSize: "clamp(58px,10vw,128px)",
  lineHeight: ".84",
  margin: "18px 0 24px",
  fontWeight: 900,
  letterSpacing: "-5px",
  textTransform: "uppercase" as const,
};

const heroTextStyle = {
  maxWidth: "650px",
  color: "#e2e8f0",
  fontSize: "clamp(18px,2vw,24px)",
  lineHeight: 1.5,
};

const heroButtonsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "12px",
  marginTop: "30px",
};

const primaryCtaStyle = {
  textDecoration: "none",
  borderRadius: "10px",
  padding: "16px 22px",
  fontWeight: 900,
};

const secondaryCtaStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,.78)",
  borderRadius: "10px",
  padding: "16px 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const quickInfoStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "18px",
  marginTop: "38px",
  color: "#cbd5e1",
};

const quickInfoLinkStyle = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
};

const quickInfoTextStyle = {
  color: "#cbd5e1",
};

const lightSectionStyle = {
  background: "#f3eadc",
  color: "#07101c",
  padding: "90px 24px",
};

const contentInnerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const sectionEyebrowStyle = {
  color: "#b57a00",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const aboutGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
  gap: "54px",
  marginTop: "16px",
  alignItems: "start",
};

const sectionHeadlineStyle = {
  fontSize: "clamp(44px,7vw,82px)",
  lineHeight: ".92",
  margin: 0,
  letterSpacing: "-3px",
  fontWeight: 900,
};

const sectionBodyStyle = {
  fontSize: "20px",
  lineHeight: 1.7,
  margin: 0,
};

const menuSectionStyle = {
  background: "#0a111a",
  color: "#ffffff",
  padding: "90px 24px",
};

const menuHeadlineStyle = {
  fontSize: "clamp(48px,8vw,92px)",
  lineHeight: ".9",
  letterSpacing: "-3px",
  fontWeight: 900,
  margin: "12px 0 46px",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: "20px",
};

const menuCategoryStyle = {
  background: "#101d2b",
  border: "1px solid #22364d",
  borderRadius: "18px",
  padding: "24px",
};

const menuCategoryTitleStyle = {
  fontSize: "26px",
  margin: "0 0 10px",
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const menuItemStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "20px",
  padding: "18px 0",
  borderTop: "1px solid #23364d",
};

const menuItemNameStyle = {
  fontSize: "17px",
  fontWeight: 900,
};

const menuItemDescriptionStyle = {
  color: "#94a3b8",
  lineHeight: 1.5,
  margin: "7px 0 0",
  fontSize: "14px",
};

const priceStyle = {
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const featuredStyle = {
  marginLeft: "8px",
  color: "#f5b82e",
};

const menuEmptyCategoryStyle = {
  color: "#64748b",
  padding: "18px 0",
};

const emptyMenuStyle = {
  color: "#94a3b8",
  border: "1px dashed #334155",
  borderRadius: "14px",
  padding: "30px",
  textAlign: "center" as const,
};

const vipSectionStyle = {
  padding: "70px 24px",
};

const vipInnerStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "30px",
  flexWrap: "wrap" as const,
};

const vipEyebrowStyle = {
  color: "#ffffff",
  opacity: .7,
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const vipHeadlineStyle = {
  maxWidth: "750px",
  fontSize: "clamp(38px,6vw,68px)",
  lineHeight: ".94",
  margin: "10px 0 14px",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const vipTextStyle = {
  color: "rgba(255,255,255,.84)",
  fontSize: "17px",
};

const vipButtonStyle = {
  color: "#07101c",
  border: 0,
  borderRadius: "10px",
  padding: "16px 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const contactSectionStyle = {
  background: "#f3eadc",
  color: "#07101c",
  padding: "90px 24px",
};

const contactGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(320px,.7fr)",
  gap: "60px",
  marginTop: "18px",
};

const contactHeadlineStyle = {
  fontSize: "clamp(42px,6vw,72px)",
  lineHeight: ".95",
  margin: "0 0 20px",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const contactTextStyle = {
  fontSize: "18px",
  lineHeight: 1.6,
};

const contactLinkStyle = {
  display: "block",
  color: "#07101c",
  marginTop: "10px",
  fontWeight: 900,
  textDecoration: "none",
};

const hoursCardStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "24px",
};

const hoursTitleStyle = {
  fontSize: "20px",
  fontWeight: 900,
  marginBottom: "12px",
};

const hoursRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  borderTop: "1px solid #e5e7eb",
  padding: "12px 0",
  fontSize: "14px",
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

const footerTextStyle = {
  color: "#64748b",
  fontSize: "12px",
};
