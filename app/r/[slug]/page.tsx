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

type PageRow = {
  id: string;
  title: string;
  slug: string;
  nav_label: string | null;
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
  const [pages, setPages] = useState<PageRow[]>([]);
  const [socials, setSocials] = useState<SocialRow[]>([]);
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
      pagesResult,
      socialsResult,
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
        .order("sort_order", { ascending: true }),
      publicSupabase
        .from("restaurant_menu_items")
        .select("id,category_id,name,description,price,featured,sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true }),
      publicSupabase
        .from("restaurant_pages")
        .select("id,title,slug,nav_label,active,show_in_nav,sort_order")
        .eq("restaurant_id", restaurantId)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      publicSupabase
        .from("restaurant_social_links")
        .select("id,platform,url,active,sort_order")
        .eq("restaurant_id", restaurantId)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
    ]);

    setWebsite(websiteResult.data || null);
    setBranding(brandingResult.data || null);
    setHours(hoursResult.data || null);
    setOrdering(orderingResult.data || null);
    setGrowth(growthResult.data || null);
    setCategories(categoriesResult.data || []);
    setItems(itemsResult.data || []);
    setPages(pagesResult.data || []);
    setSocials(socialsResult.data || []);
    setLoading(false);
  }

  const featuredItems = useMemo(
    () => items.filter((item) => item.featured).slice(0, 4),
    [items]
  );

  const menuGroups = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.category_id === category.id),
      })),
    [categories, items]
  );

  if (loading) {
    return (
      <main style={loadingPageStyle}>
        <div style={loadingCardStyle}>Loading restaurant...</div>
      </main>
    );
  }

  if (!restaurant || !website?.published) {
    return (
      <main style={loadingPageStyle}>
        <div style={loadingCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1>Site not available</h1>
          <p style={{ color: "#777" }}>
            This restaurant website has not been published yet.
          </p>
        </div>
      </main>
    );
  }

  const cream = "#f3eadc";
  const ink = "#111111";
  const accent = branding?.secondary_color || "#df3c2f";
  const deep = branding?.primary_color || "#18382f";

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const navPages = pages.filter((page) => page.show_in_nav);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main style={{ ...pageStyle, background: cream, color: ink }}>
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        * { box-sizing: border-box; }
        @media (max-width: 760px) {
          .desktop-nav { display: none !important; }
          .hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hero-copy { padding: 58px 22px !important; }
          .hero-title { font-size: clamp(64px, 20vw, 108px) !important; }
          .split-grid { grid-template-columns: 1fr !important; }
          .featured-grid { grid-template-columns: 1fr !important; }
          .menu-grid { grid-template-columns: 1fr !important; }
          .visit-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <button onClick={() => scrollTo("top")} style={logoButtonStyle}>
            {website.logo_url ? (
              <img
                src={website.logo_url}
                alt={`${restaurant.name} logo`}
                style={logoStyle}
              />
            ) : (
              <div>
                <div style={wordmarkStyle}>{restaurant.name}</div>
                <div style={wordmarkSubStyle}>
                  {restaurant.cuisine_category || "PIZZA • LOCAL • GOOD"}
                </div>
              </div>
            )}
          </button>

          <nav className="desktop-nav" style={navStyle}>
            <button style={navLinkStyle} onClick={() => scrollTo("menu")}>
              MENU
            </button>

            {website.show_about && (
              <button style={navLinkStyle} onClick={() => scrollTo("story")}>
                OUR STORY
              </button>
            )}

            {navPages.slice(0, 2).map((page) => (
              <a
                key={page.id}
                href={`/r/${restaurant.slug}/${page.slug}`}
                style={navAnchorStyle}
              >
                {(page.nav_label || page.title).toUpperCase()}
              </a>
            ))}

            {website.show_vip && (
              <a href={`/r/${restaurant.slug}/vip`} style={navAnchorStyle}>
                REWARDS
              </a>
            )}

            {ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={{ ...orderButtonStyle, background: accent }}
              >
                ORDER ONLINE
              </a>
            )}
          </nav>
        </div>
      </header>

      <section id="top" className="hero-grid" style={heroGridStyle}>
        <div className="hero-copy" style={{ ...heroCopyStyle, background: deep }}>
          <div style={heroKickerStyle}>
            {restaurant.city
              ? `${restaurant.city.toUpperCase()} • ${restaurant.state || ""}`
              : "LOCAL PIZZERIA"}
          </div>

          <h1 className="hero-title" style={heroTitleStyle}>
            {website.hero_headline || "PIZZA. DONE RIGHT."}
          </h1>

          <p style={heroTextStyle}>
            {website.hero_subheadline ||
              branding?.tagline ||
              "Big flavor, simple ingredients, and pizza built for the whole table."}
          </p>

          <div style={heroActionsStyle}>
            {ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={{ ...heroPrimaryStyle, background: accent }}
              >
                ORDER ONLINE
              </a>
            )}

            <button onClick={() => scrollTo("menu")} style={heroSecondaryStyle}>
              VIEW MENU
            </button>
          </div>
        </div>

        <div
          style={{
            ...heroImageStyle,
            background: website.hero_image_url
              ? `url("${website.hero_image_url}") center/cover`
              : `linear-gradient(135deg, #b7482e, #e6a04a 45%, #1d1d1d)`,
          }}
        >
          {!website.hero_image_url && (
            <div style={placeholderBadgeStyle}>
              ADD A FULL-BLEED PIZZA PHOTO
            </div>
          )}
        </div>
      </section>

      <section style={tickerStyle}>
        <div style={tickerInnerStyle}>
          <span>HANDCRAFTED</span>
          <span>•</span>
          <span>LOCAL</span>
          <span>•</span>
          <span>ORDER ONLINE</span>
          <span>•</span>
          <span>CATERING</span>
          <span>•</span>
          <span>GOOD PEOPLE. GOOD PIZZA.</span>
        </div>
      </section>

      {featuredItems.length > 0 && (
        <section style={featuredSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>HOUSE FAVORITES</div>
            <div style={sectionHeaderRowStyle}>
              <h2 style={bigSectionTitleStyle}>START HERE.</h2>
              <button style={textButtonStyle} onClick={() => scrollTo("menu")}>
                SEE FULL MENU →
              </button>
            </div>

            <div className="featured-grid" style={featuredGridStyle}>
              {featuredItems.map((item) => (
                <article key={item.id} style={featuredCardStyle}>
                  <div style={featuredNumberStyle}>★</div>
                  <h3 style={featuredTitleStyle}>{item.name}</h3>
                  {item.description && (
                    <p style={featuredTextStyle}>{item.description}</p>
                  )}
                  {item.price !== null && (
                    <div style={featuredPriceStyle}>
                      ${Number(item.price).toFixed(2)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {website.show_about && (
        <section id="story" className="split-grid" style={storyGridStyle}>
          <div style={storyCopyStyle}>
            <div style={eyebrowStyle}>OUR STORY</div>
            <h2 style={storyTitleStyle}>
              {website.about_title || "PIZZA PEOPLE."}
            </h2>
            <p style={storyTextStyle}>
              {website.about_body ||
                branding?.short_description ||
                "A neighborhood pizza shop built around simple food, familiar faces, and the kind of pies you want to come back for."}
            </p>
          </div>

          <div style={{ ...storyQuoteStyle, background: accent }}>
            <div style={quoteMarkStyle}>“</div>
            <p style={quoteTextStyle}>
              Great pizza should feel familiar, memorable, and worth sharing.
            </p>
            <div style={quoteSourceStyle}>{restaurant.name.toUpperCase()}</div>
          </div>
        </section>
      )}

      {website.show_menu && (
        <section id="menu" style={menuSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>MENU</div>
            <h2 style={menuTitleStyle}>WHAT ARE YOU HAVING?</h2>

            <div className="menu-grid" style={menuGridStyle}>
              {menuGroups.map((category) => (
                <article key={category.id} style={menuCategoryStyle}>
                  <h3 style={menuCategoryTitleStyle}>{category.name}</h3>

                  {category.items.map((item) => (
                    <div key={item.id} style={menuItemStyle}>
                      <div>
                        <div style={menuItemNameStyle}>
                          {item.name}
                          {item.featured && (
                            <span style={{ color: accent }}> ★</span>
                          )}
                        </div>

                        {item.description && (
                          <div style={menuDescriptionStyle}>
                            {item.description}
                          </div>
                        )}
                      </div>

                      {item.price !== null && (
                        <div style={menuPriceStyle}>
                          ${Number(item.price).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {website.show_vip && (
        <section style={{ ...vipSectionStyle, background: deep }}>
          <div style={vipInnerStyle}>
            <div>
              <div style={vipEyebrowStyle}>REWARDS + OFFERS</div>
              <h2 style={vipTitleStyle}>
                {growth?.vip_club_name || "JOIN THE 802 PIZZA CLUB"}
              </h2>
              <p style={vipTextStyle}>
                {growth?.signup_offer ||
                  "Be first in line for special offers, restaurant news, and VIP-only perks."}
              </p>
            </div>

            <a
              href={`/r/${restaurant.slug}/vip`}
              style={{ ...vipButtonStyle, background: accent }}
            >
              JOIN NOW
            </a>
          </div>
        </section>
      )}

      <section id="visit" className="visit-grid" style={visitGridStyle}>
        <div style={visitMainStyle}>
          <div style={eyebrowStyle}>VISIT US</div>
          <h2 style={visitTitleStyle}>{restaurant.name}</h2>
          {address && <p style={visitAddressStyle}>{address}</p>}

          <div style={visitLinksStyle}>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} style={visitLinkStyle}>
                CALL {restaurant.phone}
              </a>
            )}

            {ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={visitLinkStyle}
              >
                ORDER ONLINE
              </a>
            )}

            {ordering?.catering_email && (
              <a
                href={`mailto:${ordering.catering_email}`}
                style={visitLinkStyle}
              >
                CATERING
              </a>
            )}
          </div>
        </div>

        <div style={hoursPanelStyle}>
          <div style={hoursTitleStyle}>HOURS</div>
          {hours && (
            <>
              <HoursRow day="MON" value={hours.monday} />
              <HoursRow day="TUE" value={hours.tuesday} />
              <HoursRow day="WED" value={hours.wednesday} />
              <HoursRow day="THU" value={hours.thursday} />
              <HoursRow day="FRI" value={hours.friday} />
              <HoursRow day="SAT" value={hours.saturday} />
              <HoursRow day="SUN" value={hours.sunday} />
            </>
          )}
        </div>
      </section>

      <section style={newsletterStyle}>
        <div style={contentStyle}>
          <div style={newsletterGridStyle}>
            <div>
              <div style={eyebrowStyle}>STAY IN THE LOOP</div>
              <h2 style={newsletterTitleStyle}>PIZZA NEWS. ZERO SPAM.</h2>
            </div>

            <a
              href={`/r/${restaurant.slug}/vip`}
              style={{ ...newsletterButtonStyle, background: accent }}
            >
              GET OFFERS + UPDATES
            </a>
          </div>
        </div>
      </section>

      <footer style={footerStyle}>
        <div className="footer-grid" style={footerGridStyle}>
          <div>
            <div style={footerBrandStyle}>{restaurant.name}</div>
            <div style={footerSmallStyle}>
              {restaurant.cuisine_category || "LOCAL PIZZERIA"}
            </div>
          </div>

          <div style={footerLinksStyle}>
            <button style={footerLinkButtonStyle} onClick={() => scrollTo("menu")}>
              MENU
            </button>
            <a href={`/r/${restaurant.slug}/offers`} style={footerLinkStyle}>
              OFFERS
            </a>
            {website.show_vip && (
              <a href={`/r/${restaurant.slug}/vip`} style={footerLinkStyle}>
                REWARDS
              </a>
            )}
            {navPages.map((page) => (
              <a
                key={page.id}
                href={`/r/${restaurant.slug}/${page.slug}`}
                style={footerLinkStyle}
              >
                {(page.nav_label || page.title).toUpperCase()}
              </a>
            ))}
          </div>

          <div>
            <div style={footerSmallStyle}>FOLLOW</div>
            <div style={footerSocialsStyle}>
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  style={footerLinkStyle}
                >
                  {social.platform.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={footerBottomStyle}>
          <span>© {new Date().getFullYear()} {restaurant.name}</span>
          <span>Powered by Restaurant OS</span>
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
      <span>{value || "CLOSED"}</span>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingPageStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#f3eadc",
  color: "#111",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingCardStyle = {
  padding: "28px",
  border: "2px solid #111",
};

const eyebrowStyle = {
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const headerStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 30,
  background: "#f3eadc",
  borderBottom: "2px solid #111",
};

const headerInnerStyle = {
  maxWidth: "1440px",
  margin: "0 auto",
  minHeight: "84px",
  padding: "12px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
};

const logoButtonStyle = {
  border: 0,
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  textAlign: "left" as const,
};

const logoStyle = {
  maxWidth: "180px",
  maxHeight: "58px",
  objectFit: "contain" as const,
};

const wordmarkStyle = {
  fontSize: "28px",
  fontWeight: 1000,
  letterSpacing: "-1.5px",
  textTransform: "uppercase" as const,
};

const wordmarkSubStyle = {
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: "2px",
  marginTop: "2px",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
};

const navLinkStyle = {
  border: 0,
  background: "transparent",
  color: "#111",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const navAnchorStyle = {
  color: "#111",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const orderButtonStyle = {
  color: "#fff",
  textDecoration: "none",
  padding: "13px 16px",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  border: "2px solid #111",
};

const heroGridStyle = {
  minHeight: "720px",
  display: "grid",
  gridTemplateColumns: "0.92fr 1.08fr",
  borderBottom: "2px solid #111",
};

const heroCopyStyle = {
  color: "#fff",
  padding: "90px 7vw",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  borderRight: "2px solid #111",
};

const heroKickerStyle = {
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2.5px",
  marginBottom: "24px",
};

const heroTitleStyle = {
  fontSize: "clamp(72px, 9vw, 142px)",
  lineHeight: ".8",
  fontWeight: 1000,
  letterSpacing: "-7px",
  textTransform: "uppercase" as const,
  margin: "0 0 34px",
  maxWidth: "760px",
};

const heroTextStyle = {
  fontSize: "18px",
  lineHeight: 1.5,
  maxWidth: "560px",
  margin: "0 0 28px",
};

const heroActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const heroPrimaryStyle = {
  color: "#fff",
  border: "2px solid #111",
  padding: "15px 20px",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  letterSpacing: "1px",
};

const heroSecondaryStyle = {
  color: "#fff",
  background: "transparent",
  border: "2px solid #fff",
  padding: "15px 20px",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  letterSpacing: "1px",
};

const heroImageStyle = {
  minHeight: "620px",
  position: "relative" as const,
};

const placeholderBadgeStyle = {
  position: "absolute" as const,
  bottom: "24px",
  right: "24px",
  background: "#f3eadc",
  border: "2px solid #111",
  color: "#111",
  padding: "10px 12px",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const tickerStyle = {
  background: "#111",
  color: "#fff",
  overflow: "hidden",
  borderBottom: "2px solid #111",
};

const tickerInnerStyle = {
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
  padding: "10px 18px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1.5px",
};

const contentStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "82px 24px",
};

const featuredSectionStyle = {
  borderBottom: "2px solid #111",
};

const sectionHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "34px",
};

const bigSectionTitleStyle = {
  fontSize: "clamp(54px,7vw,96px)",
  lineHeight: ".86",
  letterSpacing: "-4px",
  margin: "8px 0 0",
};

const textButtonStyle = {
  border: 0,
  background: "transparent",
  padding: 0,
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
};

const featuredGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  borderTop: "2px solid #111",
  borderLeft: "2px solid #111",
};

const featuredCardStyle = {
  minHeight: "270px",
  padding: "24px",
  borderRight: "2px solid #111",
  borderBottom: "2px solid #111",
};

const featuredNumberStyle = {
  fontSize: "18px",
  marginBottom: "50px",
};

const featuredTitleStyle = {
  fontSize: "30px",
  lineHeight: 1,
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
};

const featuredTextStyle = {
  fontSize: "13px",
  lineHeight: 1.5,
  color: "#4c4c4c",
};

const featuredPriceStyle = {
  marginTop: "18px",
  fontSize: "17px",
  fontWeight: 900,
};

const storyGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.15fr .85fr",
  borderBottom: "2px solid #111",
};

const storyCopyStyle = {
  padding: "90px 8vw",
  borderRight: "2px solid #111",
};

const storyTitleStyle = {
  fontSize: "clamp(60px,8vw,110px)",
  lineHeight: ".86",
  letterSpacing: "-5px",
  margin: "12px 0 30px",
  textTransform: "uppercase" as const,
};

const storyTextStyle = {
  maxWidth: "680px",
  fontSize: "20px",
  lineHeight: 1.65,
};

const storyQuoteStyle = {
  color: "#fff",
  padding: "70px 7vw",
  display: "flex",
  justifyContent: "center",
  flexDirection: "column" as const,
};

const quoteMarkStyle = {
  fontSize: "80px",
  lineHeight: .8,
  fontWeight: 900,
};

const quoteTextStyle = {
  fontSize: "34px",
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: "-1px",
};

const quoteSourceStyle = {
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1.5px",
  marginTop: "18px",
};

const menuSectionStyle = {
  background: "#f3eadc",
  borderBottom: "2px solid #111",
};

const menuTitleStyle = {
  fontSize: "clamp(58px,8vw,106px)",
  lineHeight: ".86",
  letterSpacing: "-5px",
  margin: "10px 0 44px",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: "0 60px",
};

const menuCategoryStyle = {
  padding: "26px 0 16px",
  borderTop: "3px solid #111",
};

const menuCategoryTitleStyle = {
  fontSize: "25px",
  textTransform: "uppercase" as const,
  margin: "0 0 18px",
};

const menuItemStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "20px",
  padding: "15px 0",
  borderTop: "1px solid #aaa190",
};

const menuItemNameStyle = {
  fontSize: "15px",
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const menuDescriptionStyle = {
  marginTop: "5px",
  color: "#5d574e",
  fontSize: "12px",
  lineHeight: 1.45,
};

const menuPriceStyle = {
  fontSize: "14px",
  fontWeight: 900,
};

const vipSectionStyle = {
  color: "#fff",
  borderBottom: "2px solid #111",
};

const vipInnerStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "70px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "30px",
  flexWrap: "wrap" as const,
};

const vipEyebrowStyle = {
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const vipTitleStyle = {
  fontSize: "clamp(44px,6vw,82px)",
  lineHeight: ".9",
  letterSpacing: "-3px",
  margin: "8px 0 12px",
};

const vipTextStyle = {
  maxWidth: "680px",
  fontSize: "16px",
  lineHeight: 1.5,
};

const vipButtonStyle = {
  color: "#fff",
  border: "2px solid #111",
  padding: "16px 20px",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const visitGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr .8fr",
  borderBottom: "2px solid #111",
};

const visitMainStyle = {
  padding: "80px 8vw",
  borderRight: "2px solid #111",
};

const visitTitleStyle = {
  fontSize: "clamp(52px,7vw,96px)",
  lineHeight: ".9",
  letterSpacing: "-4px",
  margin: "10px 0 22px",
  textTransform: "uppercase" as const,
};

const visitAddressStyle = {
  fontSize: "18px",
  lineHeight: 1.6,
  maxWidth: "560px",
};

const visitLinksStyle = {
  display: "flex",
  gap: "18px",
  flexWrap: "wrap" as const,
  marginTop: "28px",
};

const visitLinkStyle = {
  color: "#111",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const hoursPanelStyle = {
  padding: "80px 7vw",
  background: "#e8decd",
};

const hoursTitleStyle = {
  fontSize: "25px",
  fontWeight: 900,
  letterSpacing: "-1px",
  marginBottom: "18px",
};

const hoursRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  padding: "12px 0",
  borderTop: "1px solid #aaa190",
  fontSize: "12px",
  fontWeight: 800,
};

const newsletterStyle = {
  background: "#fff",
  borderBottom: "2px solid #111",
};

const newsletterGridStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "wrap" as const,
};

const newsletterTitleStyle = {
  fontSize: "clamp(42px,6vw,78px)",
  lineHeight: ".9",
  letterSpacing: "-3px",
  margin: "8px 0 0",
};

const newsletterButtonStyle = {
  color: "#fff",
  border: "2px solid #111",
  padding: "16px 20px",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
};

const footerStyle = {
  background: "#111",
  color: "#fff",
  padding: "64px 24px 24px",
};

const footerGridStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr .8fr",
  gap: "60px",
};

const footerBrandStyle = {
  fontSize: "38px",
  fontWeight: 1000,
  textTransform: "uppercase" as const,
  letterSpacing: "-2px",
};

const footerSmallStyle = {
  fontSize: "9px",
  color: "#aaa",
  fontWeight: 900,
  letterSpacing: "1.5px",
  marginTop: "6px",
};

const footerLinksStyle = {
  display: "grid",
  gap: "10px",
  alignContent: "start",
};

const footerSocialsStyle = {
  display: "grid",
  gap: "10px",
  marginTop: "12px",
};

const footerLinkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
};

const footerLinkButtonStyle = {
  color: "#fff",
  border: 0,
  background: "transparent",
  padding: 0,
  textAlign: "left" as const,
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 900,
};

const footerBottomStyle = {
  maxWidth: "1240px",
  margin: "54px auto 0",
  paddingTop: "18px",
  borderTop: "1px solid #444",
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap" as const,
  color: "#777",
  fontSize: "10px",
};
