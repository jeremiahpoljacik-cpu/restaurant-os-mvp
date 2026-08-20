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
  show_about: boolean;
  show_menu: boolean;
  show_ordering: boolean;
  show_vip: boolean;
  published: boolean;
};

type Hours = Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  string | null
>;

type Ordering = {
  online_ordering_url: string | null;
  catering_email: string | null;
};

type Growth = {
  vip_club_name: string | null;
  signup_offer: string | null;
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

  const navPages = pages.filter((page) => page.show_in_nav);

  const menuGroups = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.category_id === category.id),
      })),
    [categories, items]
  );

  const featured = useMemo(
    () => items.filter((item) => item.featured).slice(0, 5),
    [items]
  );

  if (loading) {
    return (
      <main style={loadingPageStyle}>
        <div>Loading restaurant...</div>
      </main>
    );
  }

  if (!restaurant || !website?.published) {
    return (
      <main style={loadingPageStyle}>
        <div style={loadingCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1>Site not available</h1>
          <p>This restaurant website has not been published yet.</p>
        </div>
      </main>
    );
  }

  const forest = branding?.primary_color || "#0d513e";
  const tan = "#f1c98f";
  const cream = "#f8f1e3";
  const ink = "#131313";
  const accent = branding?.secondary_color || "#c66b2c";

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const heroFood =
    website.hero_image_url ||
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1800&q=86";

  const secondFood =
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=84";

  const barPhoto =
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=84";

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

        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .info-grid,
          .story-grid,
          .visit-grid,
          .footer-grid { grid-template-columns: 1fr !important; }
          .featured-grid { grid-template-columns: 1fr 1fr !important; }
          .menu-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 560px) {
          .featured-grid { grid-template-columns: 1fr !important; }
          .hero-logo { font-size: clamp(62px, 20vw, 110px) !important; }
          .nav-logo { font-size: 22px !important; }
          .hang-buttons { grid-template-columns: 1fr !important; }
          .food-overlap { margin-top: -36px !important; padding: 0 14px !important; }
        }
      `}</style>

      <section id="top" style={heroStageStyle}>
        <header style={headerStyle}>
          <div style={headerInnerStyle}>
            <button onClick={() => scrollTo("top")} style={brandButtonStyle}>
              <div className="nav-logo" style={navLogoStyle}>
                802
              </div>
              <div style={navLogoSubStyle}>PIZZA</div>
            </button>

            <nav className="desktop-nav" style={navStyle}>
              <button style={navLinkStyle} onClick={() => scrollTo("menu")}>
                MENU
              </button>
              <button style={navLinkStyle} onClick={() => scrollTo("story")}>
                OUR STORY
              </button>
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
                  style={{ ...orderNavButtonStyle, background: tan }}
                >
                  ORDER
                </a>
              )}
            </nav>
          </div>
        </header>

        <div style={blueprintLayerStyle}>
          <div style={blueprintLinesStyle} />
          <div style={heroCenterStyle}>
            <div style={heroSmallStyle}>EST. IN THE MOUNTAINS</div>
            <div className="hero-logo" style={heroLogoStyle}>
              802
            </div>
            <div style={heroPizzaStyle}>PIZZA</div>
            <div style={heroTaglineStyle}>
              WOOD-FIRED • MOUNTAIN TOWN • {restaurant.city?.toUpperCase() || "LOCAL"}
            </div>

            <div style={paddleRowStyle}>
              <span style={paddleLineStyle}>━━━━━━━╾</span>
              <span style={paddleCenterStyle}>✦</span>
              <span style={paddleLineStyle}>╼━━━━━━━</span>
            </div>

            <button
              style={scrollCueStyle}
              onClick={() => scrollTo("menu")}
            >
              COME HUNGRY ↓
            </button>
          </div>
        </div>
      </section>

      <section className="food-overlap" style={foodHeroWrapStyle}>
        <div style={foodHeroStyle}>
          <img src={heroFood} alt="Featured food" style={fullImageStyle} />
        </div>
      </section>

      <section className="info-grid" style={{ ...infoGridStyle, background: forest }}>
        <div style={infoBlockStyle}>
          <div style={infoLabelStyle}>HOURS OF OPERATION</div>
          {hours && (
            <div style={hoursCompactStyle}>
              <HoursLine day="MON" value={hours.monday} />
              <HoursLine day="TUE" value={hours.tuesday} />
              <HoursLine day="WED" value={hours.wednesday} />
              <HoursLine day="THU" value={hours.thursday} />
              <HoursLine day="FRI" value={hours.friday} />
              <HoursLine day="SAT" value={hours.saturday} />
              <HoursLine day="SUN" value={hours.sunday} />
            </div>
          )}
        </div>

        <div style={centerInfoStyle}>
          <div style={wheatLineStyle}>╱╲</div>
          <div style={addressBigStyle}>{address || "COME FIND US"}</div>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} style={phoneStyle}>
              {restaurant.phone}
            </a>
          )}
          <div style={wheatLineStyle}>╲╱</div>
        </div>

        <div className="hang-buttons" style={hangButtonsStyle}>
          {ordering?.catering_email && (
            <a
              href={`mailto:${ordering.catering_email}`}
              style={{ ...hangingButtonStyle, background: tan }}
            >
              EVENT INQUIRIES
            </a>
          )}

          {ordering?.online_ordering_url && (
            <a
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
              style={{ ...hangingButtonStyle, background: tan }}
            >
              ORDER TAKEOUT
            </a>
          )}

          <a
            href={`/r/${restaurant.slug}/offers`}
            style={{ ...hangingButtonStyle, background: tan }}
          >
            OFFERS
          </a>

          {website.show_vip && (
            <a
              href={`/r/${restaurant.slug}/vip`}
              style={{ ...hangingButtonStyle, background: tan }}
            >
              JOIN THE CLUB
            </a>
          )}
        </div>
      </section>

      <section id="story" className="story-grid" style={storyGridStyle}>
        <div style={storyCopyStyle}>
          <div style={eyebrowStyle}>THE 802 STORY</div>
          <h2 style={storyTitleStyle}>
            {website.about_title || "GOOD FOOD. GOOD PEOPLE. NO PRETENSE."}
          </h2>
          <p style={storyTextStyle}>
            {website.about_body ||
              branding?.short_description ||
              "802 Pizza is a neighborhood restaurant built around wood-fired favorites, generous plates, a lively bar, and the kind of room that feels better the longer you stay."}
          </p>
        </div>

        <div style={storyPhotoWrapStyle}>
          <img src={barPhoto} alt="Restaurant bar" style={fullImageStyle} />
        </div>
      </section>

      {featured.length > 0 && (
        <section style={featuredSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>FEATURED FAVORITES</div>
            <h2 style={sectionTitleStyle}>OUR MENU</h2>

            <div className="featured-grid" style={featuredGridStyle}>
              {featured.map((item, index) => (
                <article key={item.id} style={featuredCardStyle}>
                  <div
                    style={{
                      ...featuredImageStyle,
                      backgroundImage: `url("${
                        index % 2 === 0 ? heroFood : secondFood
                      }")`,
                    }}
                  />
                  <div style={featuredBodyStyle}>
                    <div style={featuredNameStyle}>{item.name}</div>
                    {item.description && (
                      <div style={featuredDescriptionStyle}>
                        {item.description}
                      </div>
                    )}
                    {item.price !== null && (
                      <div style={featuredPriceStyle}>
                        ${Number(item.price).toFixed(2)}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {website.show_menu && (
        <section id="menu" style={menuSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>FULL MENU</div>
            <h2 style={menuTitleStyle}>COME HUNGRY.</h2>

            <div className="menu-grid" style={menuGridStyle}>
              {menuGroups.map((group) => (
                <article key={group.id} style={menuCategoryStyle}>
                  <h3 style={menuCategoryTitleStyle}>{group.name}</h3>

                  {group.items.map((item) => (
                    <div key={item.id} style={menuItemStyle}>
                      <div>
                        <div style={menuItemNameStyle}>{item.name}</div>
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
        <section style={{ ...clubSectionStyle, background: forest }}>
          <div style={clubInnerStyle}>
            <div>
              <div style={clubEyebrowStyle}>802 CLUB</div>
              <h2 style={clubTitleStyle}>
                {growth?.vip_club_name || "JOIN THE REGULARS."}
              </h2>
              <p style={clubTextStyle}>
                {growth?.signup_offer ||
                  "Get offers, restaurant news, and member-only perks."}
              </p>
            </div>

            <a href={`/r/${restaurant.slug}/vip`} style={{ ...clubButtonStyle, background: tan }}>
              JOIN NOW
            </a>
          </div>
        </section>
      )}

      <section className="visit-grid" style={visitGridStyle}>
        <div style={visitPhotoStyle}>
          <img src={secondFood} alt="Restaurant food" style={fullImageStyle} />
        </div>

        <div style={visitCopyStyle}>
          <div style={eyebrowStyle}>VISIT 802</div>
          <h2 style={visitTitleStyle}>{restaurant.name}</h2>
          <p style={visitAddressStyle}>{address}</p>

          <div style={visitButtonsStyle}>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} style={outlineButtonStyle}>
                CALL US
              </a>
            )}
            {ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={{ ...solidButtonStyle, background: accent }}
              >
                ORDER ONLINE
              </a>
            )}
          </div>
        </div>
      </section>

      <footer style={footerStyle}>
        <div className="footer-grid" style={footerGridStyle}>
          <div>
            <div style={footerLogoStyle}>802</div>
            <div style={footerLogoSubStyle}>PIZZA</div>
          </div>

          <div style={footerLinksStyle}>
            <button style={footerButtonStyle} onClick={() => scrollTo("menu")}>
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
            <div style={footerLinksStyle}>
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
          © {new Date().getFullYear()} {restaurant.name} • Powered by Restaurant OS
        </div>
      </footer>
    </main>
  );
}

function HoursLine({ day, value }: { day: string; value: string | null }) {
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
  background: "#f8f1e3",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const loadingCardStyle = {
  padding: "28px",
};

const eyebrowStyle = {
  color: "#b06a28",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const heroStageStyle = {
  background: "#f4ead7",
};

const headerStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 40,
  background: "#fffaf0",
  borderBottom: "1px solid #c8bda8",
};

const headerInnerStyle = {
  maxWidth: "1440px",
  margin: "0 auto",
  minHeight: "82px",
  padding: "10px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
};

const brandButtonStyle = {
  border: 0,
  background: "transparent",
  cursor: "pointer",
  textAlign: "left" as const,
};

const navLogoStyle = {
  fontSize: "29px",
  fontWeight: 1000,
  letterSpacing: "-2px",
  lineHeight: 0.8,
};

const navLogoSubStyle = {
  color: "#c66b2c",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "4px",
  marginTop: "5px",
};

const navStyle = {
  display: "flex",
  gap: "18px",
  alignItems: "center",
};

const navLinkStyle = {
  border: 0,
  background: "transparent",
  color: "#111",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  cursor: "pointer",
};

const navAnchorStyle = {
  color: "#111",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const orderNavButtonStyle = {
  color: "#111",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "3px",
  fontSize: "10px",
  fontWeight: 900,
};

const blueprintLayerStyle = {
  position: "relative" as const,
  minHeight: "430px",
  overflow: "hidden",
  background:
    "linear-gradient(rgba(225,209,181,.35),rgba(225,209,181,.35)), #f2e5cd",
};

const blueprintLinesStyle = {
  position: "absolute" as const,
  inset: 0,
  opacity: 0.52,
  backgroundImage:
    "linear-gradient(90deg, rgba(128,108,76,.19) 1px, transparent 1px), linear-gradient(rgba(128,108,76,.16) 1px, transparent 1px), repeating-linear-gradient(35deg, transparent 0 78px, rgba(128,108,76,.12) 79px 80px), radial-gradient(circle at 20% 30%, rgba(96,75,48,.08) 0 1px, transparent 1.5px)",
  backgroundSize: "88px 88px, 88px 88px, auto, 16px 16px",
};

const heroCenterStyle = {
  position: "relative" as const,
  zIndex: 2,
  minHeight: "430px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center" as const,
  padding: "40px 20px",
};

const heroSmallStyle = {
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "5px",
  marginBottom: "6px",
};

const heroLogoStyle = {
  fontSize: "clamp(92px, 14vw, 190px)",
  lineHeight: 0.72,
  fontWeight: 1000,
  letterSpacing: "-12px",
};

const heroPizzaStyle = {
  marginTop: "14px",
  fontSize: "24px",
  fontWeight: 1000,
  letterSpacing: "12px",
  color: "#c66b2c",
};

const heroTaglineStyle = {
  marginTop: "18px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const paddleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "14px",
  marginTop: "24px",
  color: "#8f7959",
};

const paddleLineStyle = {
  fontSize: "16px",
  letterSpacing: "2px",
};

const paddleCenterStyle = {
  fontSize: "12px",
};

const scrollCueStyle = {
  marginTop: "22px",
  border: 0,
  background: "transparent",
  color: "#4b4134",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "2px",
  cursor: "pointer",
};

const foodHeroWrapStyle = {
  position: "relative" as const,
  zIndex: 4,
  marginTop: "-72px",
  padding: "0 3vw",
};

const foodHeroStyle = {
  height: "470px",
  overflow: "hidden",
  borderRadius: "4px 4px 0 0",
  boxShadow: "0 -18px 36px rgba(50,38,22,.12)",
};

const fullImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  display: "block",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  color: "#fff",
  padding: "70px 6vw",
  gap: "34px",
};

const infoBlockStyle = {
  padding: "10px 20px",
};

const infoLabelStyle = {
  color: "#efc98f",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1.5px",
  marginBottom: "14px",
};

const hoursCompactStyle = {
  display: "grid",
  gap: "8px",
};

const hoursRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  fontSize: "12px",
};

const centerInfoStyle = {
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  borderLeft: "1px solid rgba(255,255,255,.35)",
  borderRight: "1px solid rgba(255,255,255,.35)",
  padding: "10px 24px",
};

const wheatLineStyle = {
  color: "#efc98f",
  fontSize: "24px",
};

const addressBigStyle = {
  fontSize: "22px",
  lineHeight: 1.35,
  fontWeight: 900,
  letterSpacing: "1px",
};

const phoneStyle = {
  color: "#fff",
  fontWeight: 900,
  letterSpacing: "1px",
};

const hangButtonsStyle = {
  display: "grid",
  gap: "14px",
  alignContent: "center",
};

const hangingButtonStyle = {
  color: "#111",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "17px 18px",
  borderRadius: "4px",
  boxShadow: "0 4px 0 rgba(0,0,0,.24)",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const storyGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: "#fffaf0",
};

const storyCopyStyle = {
  padding: "88px 7vw",
};

const storyTitleStyle = {
  fontSize: "clamp(46px,6vw,82px)",
  lineHeight: ".95",
  letterSpacing: "-3px",
  margin: "10px 0 24px",
};

const storyTextStyle = {
  fontSize: "18px",
  lineHeight: 1.7,
  maxWidth: "680px",
};

const storyPhotoWrapStyle = {
  minHeight: "520px",
};

const contentStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "78px 24px",
};

const featuredSectionStyle = {
  background: "#efe2cd",
};

const sectionTitleStyle = {
  fontSize: "clamp(58px,7vw,96px)",
  lineHeight: ".9",
  letterSpacing: "-4px",
  margin: "8px 0 34px",
};

const featuredGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5,1fr)",
  gap: "14px",
};

const featuredCardStyle = {
  background: "#fffaf0",
  border: "1px solid #c8bda8",
};

const featuredImageStyle = {
  height: "170px",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const featuredBodyStyle = {
  padding: "14px",
};

const featuredNameStyle = {
  fontSize: "16px",
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const featuredDescriptionStyle = {
  fontSize: "11px",
  lineHeight: 1.5,
  color: "#5f584e",
  marginTop: "6px",
};

const featuredPriceStyle = {
  fontSize: "13px",
  fontWeight: 900,
  marginTop: "10px",
  color: "#b06a28",
};

const menuSectionStyle = {
  background: "#fffaf0",
};

const menuTitleStyle = {
  fontSize: "clamp(58px,8vw,104px)",
  lineHeight: ".9",
  letterSpacing: "-4px",
  margin: "10px 0 42px",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "0 54px",
};

const menuCategoryStyle = {
  borderTop: "2px solid #111",
  padding: "22px 0 14px",
};

const menuCategoryTitleStyle = {
  fontSize: "25px",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
};

const menuItemStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "18px",
  padding: "14px 0",
  borderTop: "1px solid #c8bda8",
};

const menuItemNameStyle = {
  fontSize: "14px",
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const menuDescriptionStyle = {
  fontSize: "12px",
  lineHeight: 1.5,
  color: "#625b52",
  marginTop: "5px",
};

const menuPriceStyle = {
  fontSize: "13px",
  fontWeight: 900,
};

const clubSectionStyle = {
  color: "#fff",
};

const clubInnerStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "62px 24px",
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const clubEyebrowStyle = {
  color: "#efc98f",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const clubTitleStyle = {
  fontSize: "clamp(42px,5vw,72px)",
  lineHeight: ".9",
  margin: "8px 0 12px",
};

const clubTextStyle = {
  color: "#e5eee9",
  fontSize: "15px",
};

const clubButtonStyle = {
  color: "#111",
  textDecoration: "none",
  padding: "15px 20px",
  fontSize: "11px",
  fontWeight: 900,
};

const visitGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: "#efe2cd",
};

const visitPhotoStyle = {
  minHeight: "480px",
};

const visitCopyStyle = {
  padding: "78px 7vw",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const visitTitleStyle = {
  fontSize: "clamp(48px,6vw,82px)",
  lineHeight: ".9",
  margin: "8px 0 18px",
};

const visitAddressStyle = {
  fontSize: "17px",
  lineHeight: 1.6,
};

const visitButtonsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginTop: "22px",
};

const outlineButtonStyle = {
  color: "#111",
  textDecoration: "none",
  border: "1px solid #111",
  padding: "13px 16px",
  fontSize: "10px",
  fontWeight: 900,
};

const solidButtonStyle = {
  color: "#fff",
  textDecoration: "none",
  padding: "13px 16px",
  fontSize: "10px",
  fontWeight: 900,
};

const footerStyle = {
  background: "#111",
  color: "#fff",
  padding: "58px 24px 22px",
};

const footerGridStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr .8fr",
  gap: "40px",
};

const footerLogoStyle = {
  fontSize: "54px",
  fontWeight: 1000,
  letterSpacing: "-4px",
  lineHeight: .75,
};

const footerLogoSubStyle = {
  color: "#d78637",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "6px",
  marginTop: "8px",
};

const footerLinksStyle = {
  display: "grid",
  gap: "10px",
};

const footerSmallStyle = {
  color: "#aaa",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "10px",
};

const footerLinkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
};

const footerButtonStyle = {
  color: "#fff",
  border: 0,
  background: "transparent",
  padding: 0,
  textAlign: "left" as const,
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 900,
};

const footerBottomStyle = {
  maxWidth: "1240px",
  margin: "44px auto 0",
  paddingTop: "16px",
  borderTop: "1px solid #333",
  color: "#777",
  fontSize: "10px",
};
