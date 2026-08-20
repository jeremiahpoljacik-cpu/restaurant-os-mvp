"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
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
  about_title: string | null;
  about_body: string | null;
  show_menu: boolean;
  show_vip: boolean;
  published: boolean;
};

type Ordering = {
  online_ordering_url: string | null;
  catering_email: string | null;
};

type Growth = {
  vip_club_name: string | null;
  signup_offer: string | null;
};

type Hours = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  string | null
>;

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
  const [ordering, setOrdering] = useState<Ordering | null>(null);
  const [growth, setGrowth] = useState<Growth | null>(null);
  const [hours, setHours] = useState<Hours | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) load(slug);
  }, [slug]);

  async function load(siteSlug: string) {
    setLoading(true);

    const { data: restaurantData } = await supabase
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
    const rid = restaurantData.id;

    const [
      brandingResult,
      websiteResult,
      orderingResult,
      growthResult,
      hoursResult,
      categoryResult,
      itemResult,
    ] = await Promise.all([
      supabase.from("restaurant_branding").select("*").eq("restaurant_id", rid).maybeSingle(),
      supabase.from("restaurant_website_settings").select("*").eq("restaurant_id", rid).maybeSingle(),
      supabase.from("restaurant_ordering").select("*").eq("restaurant_id", rid).maybeSingle(),
      supabase.from("restaurant_growth_settings").select("*").eq("restaurant_id", rid).maybeSingle(),
      supabase.from("restaurant_hours").select("*").eq("restaurant_id", rid).maybeSingle(),
      supabase
        .from("restaurant_menu_categories")
        .select("id,name,sort_order")
        .eq("restaurant_id", rid)
        .order("sort_order", { ascending: true }),
      supabase
        .from("restaurant_menu_items")
        .select("id,category_id,name,description,price,featured,sort_order")
        .eq("restaurant_id", rid)
        .order("sort_order", { ascending: true }),
    ]);

    setBranding(brandingResult.data || null);
    setWebsite(websiteResult.data || null);
    setOrdering(orderingResult.data || null);
    setGrowth(growthResult.data || null);
    setHours(hoursResult.data || null);
    setCategories(categoryResult.data || []);
    setItems(itemResult.data || []);
    setLoading(false);
  }

  const menuGroups = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.category_id === category.id),
      })),
    [categories, items]
  );

  const featured = useMemo(
    () => items.filter((item) => item.featured).slice(0, 3),
    [items]
  );

  if (loading) return <main style={loadingStyle}>Loading 802 Pizza...</main>;

  if (!restaurant || !website?.published) {
    return <main style={loadingStyle}>This restaurant site is not published.</main>;
  }

  const forest = branding?.primary_color || "#0b513e";
  const cream = "#f5ecdc";
  const tan = "#f2c78e";
  const ink = "#111111";
  const orange = branding?.secondary_color || "#d36f32";

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const photoForFeatured = (index: number) =>
    ["/802/pepperoni.webp", "/802/calamari.webp", "/802/steak-salad.webp"][index % 3];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main style={{ background: cream, color: ink, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }

        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .info-grid,
          .story-grid,
          .visit-grid,
          .footer-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .menu-grid { grid-template-columns: 1fr !important; }
          .hero-inner { min-height: 590px !important; padding: 42px 24px !important; }
          .hero-copy { max-width: 620px !important; margin: auto !important; text-align: center !important; }
          .hero-buttons { justify-content: center !important; }
        }
      `}</style>

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <button style={brandButtonStyle} onClick={() => scrollTo("top")}>
            <img src="/802/logo.webp" alt="802 Pizza" style={navLogoStyle} />
          </button>

          <nav className="desktop-nav" style={navStyle}>
            <button style={navButtonStyle} onClick={() => scrollTo("story")}>OUR STORY</button>
            <button style={navButtonStyle} onClick={() => scrollTo("menu")}>MENU</button>

            {ordering?.catering_email && (
              <a style={navLinkStyle} href={`mailto:${ordering.catering_email}`}>
                CATERING
              </a>
            )}

            <a style={navLinkStyle} href={`/r/${restaurant.slug}/offers`}>
              OFFERS
            </a>

            {website.show_vip && (
              <a style={navLinkStyle} href={`/r/${restaurant.slug}/vip`}>
                REWARDS
              </a>
            )}

            {ordering?.online_ordering_url && (
              <a
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
                style={{ ...orderButtonStyle, background: tan }}
              >
                ORDER ONLINE
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* HERO: use the real Vermont storefront to own the formerly dead space */}
      <section
        id="top"
        style={{
          ...heroStyle,
          backgroundImage:
            "linear-gradient(90deg, rgba(4,25,19,.88) 0%, rgba(4,25,19,.72) 42%, rgba(4,25,19,.25) 72%, rgba(4,25,19,.08) 100%), url('/802/storefront.webp')",
        }}
      >
        <div className="hero-inner" style={heroInnerStyle}>
          <div className="hero-copy" style={heroCopyStyle}>
            <img src="/802/logo.webp" alt="802 Pizza" style={heroLogoStyle} />

            <div style={heroKickerStyle}>SOUTH ROYALTON ROOTS • MOUNTAIN SOUL</div>

            <h1 style={heroTitleStyle}>COME HUNGRY.<br />STAY AWHILE.</h1>

            <p style={heroTextStyle}>
              Pizza, wings, salads, cold beer and the kind of neighborhood energy
              that made 802 what it is.
            </p>

            <div className="hero-buttons" style={heroButtonsStyle}>
              {ordering?.online_ordering_url && (
                <a
                  href={ordering.online_ordering_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...primaryButtonStyle, background: tan }}
                >
                  ORDER ONLINE
                </a>
              )}
              <button style={secondaryButtonStyle} onClick={() => scrollTo("menu")}>
                VIEW MENU
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="info-grid" style={{ ...infoGridStyle, background: forest }}>
        <div>
          <div style={goldEyebrowStyle}>HOURS</div>
          <HoursList hours={hours} />
        </div>

        <div style={middleInfoStyle}>
          <div style={goldEyebrowStyle}>COME SEE US</div>
          <div style={addressStyle}>{address}</div>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} style={phoneStyle}>
              {restaurant.phone}
            </a>
          )}
        </div>

        <div style={quickActionsStyle}>
          {ordering?.online_ordering_url && (
            <a
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
              style={{ ...quickButtonStyle, background: tan }}
            >
              ORDER TAKEOUT
            </a>
          )}
          {ordering?.catering_email && (
            <a
              href={`mailto:${ordering.catering_email}`}
              style={{ ...quickButtonStyle, background: tan }}
            >
              CATERING & EVENTS
            </a>
          )}
          <a
            href={`/r/${restaurant.slug}/offers`}
            style={{ ...quickButtonStyle, background: tan }}
          >
            CURRENT OFFERS
          </a>
        </div>
      </section>

      <section id="story" className="story-grid" style={storyGridStyle}>
        <div style={storyCopyStyle}>
          <div style={eyebrowStyle}>THE 802 STORY</div>
          <h2 style={storyTitleStyle}>
            {website.about_title || "LOCAL FOOD. LOCAL BEER. A PLACE TO HANG."}
          </h2>
          <p style={storyTextStyle}>
            {website.about_body ||
              branding?.short_description ||
              "802 Pizza grew out of Vermont with a simple idea: serve food people actually want to eat, pour good local beer, keep the room relaxed, and give the community a place to gather. That spirit still drives everything we do."}
          </p>
        </div>

        <div style={storyPhotoStyle}>
          <img
            src="/802/chalkboard.webp"
            alt="802 Pizza local beer and live music chalkboard"
            style={coverStyle}
          />
        </div>
      </section>

      {featured.length > 0 && (
        <section style={featuredSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>FROM THE KITCHEN</div>
            <div style={sectionHeadingRowStyle}>
              <h2 style={sectionTitleStyle}>MORE THAN PIZZA.</h2>
              <button style={textButtonStyle} onClick={() => scrollTo("menu")}>
                VIEW FULL MENU →
              </button>
            </div>

            <div className="feature-grid" style={featureGridStyle}>
              {featured.map((item, index) => (
                <article key={item.id} style={featureCardStyle}>
                  <img
                    src={photoForFeatured(index)}
                    alt={item.name}
                    style={featureImageStyle}
                  />
                  <div style={featureBodyStyle}>
                    <div style={featureNameStyle}>{item.name}</div>
                    {item.description && (
                      <div style={featureDescriptionStyle}>{item.description}</div>
                    )}
                    {item.price !== null && (
                      <div style={featurePriceStyle}>${Number(item.price).toFixed(2)}</div>
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
            <div style={eyebrowStyle}>THE MENU</div>
            <h2 style={menuTitleStyle}>COME HUNGRY.</h2>

            <div className="menu-grid" style={menuGridStyle}>
              {menuGroups.map((group) => (
                <article key={group.id} style={menuCategoryStyle}>
                  <h3 style={menuCategoryHeadingStyle}>{group.name}</h3>

                  {group.items.map((item) => (
                    <div key={item.id} style={menuItemStyle}>
                      <div>
                        <div style={menuItemNameStyle}>{item.name}</div>
                        {item.description && (
                          <div style={menuItemDescriptionStyle}>{item.description}</div>
                        )}
                      </div>
                      {item.price !== null && (
                        <div style={menuItemPriceStyle}>${Number(item.price).toFixed(2)}</div>
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
                {growth?.signup_offer || "Get first dibs on offers, specials and events."}
              </p>
            </div>

            <a
              href={`/r/${restaurant.slug}/vip`}
              style={{ ...clubButtonStyle, background: tan }}
            >
              JOIN NOW
            </a>
          </div>
        </section>
      )}

      <section className="visit-grid" style={visitGridStyle}>
        <div style={visitCopyStyle}>
          <div style={eyebrowStyle}>802 PIZZA</div>
          <h2 style={visitTitleStyle}>GOOD FOOD.<br />GOOD PEOPLE.</h2>
          <p style={visitTextStyle}>
            Grab a table, bring the family, meet some friends, or swing through
            for takeout.
          </p>
        </div>

        <div style={{ ...visitActionStyle, background: tan }}>
          <img src="/802/logo.webp" alt="802 Pizza" style={visitLogoStyle} />
          {ordering?.online_ordering_url && (
            <a
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
              style={darkButtonStyle}
            >
              ORDER ONLINE
            </a>
          )}
        </div>
      </section>

      <footer style={footerStyle}>
        <div className="footer-grid" style={footerGridStyle}>
          <img src="/802/logo.webp" alt="802 Pizza" style={footerLogoStyle} />
          <div style={footerTextStyle}>{address}</div>
          <div style={footerTextStyle}>
            © {new Date().getFullYear()} {restaurant.name}<br />
            Powered by Restaurant OS
          </div>
        </div>
      </footer>
    </main>
  );
}

function HoursList({ hours }: { hours: Hours | null }) {
  if (!hours) return <div>Hours coming soon.</div>;

  const rows: [string, string | null][] = [
    ["MON", hours.monday],
    ["TUE", hours.tuesday],
    ["WED", hours.wednesday],
    ["THU", hours.thursday],
    ["FRI", hours.friday],
    ["SAT", hours.saturday],
    ["SUN", hours.sunday],
  ];

  return (
    <div style={{ display: "grid", gap: 7 }}>
      {rows.map(([day, value]) => (
        <div key={day} style={hourRowStyle}>
          <span>{day}</span>
          <span>{value || "CLOSED"}</span>
        </div>
      ))}
    </div>
  );
}

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#f5ecdc",
};

const headerStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
  background: "#fff9ee",
  borderBottom: "1px solid #cbbca3",
};

const headerInnerStyle = {
  maxWidth: 1320,
  margin: "0 auto",
  minHeight: 78,
  padding: "10px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 28,
};

const brandButtonStyle = {
  border: 0,
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};

const navLogoStyle = {
  width: 106,
  height: 58,
  objectFit: "contain" as const,
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: 20,
};

const navButtonStyle = {
  border: 0,
  background: "transparent",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.2,
};

const navLinkStyle = {
  color: "#111",
  textDecoration: "none",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.2,
};

const orderButtonStyle = {
  color: "#111",
  textDecoration: "none",
  padding: "13px 16px",
  fontSize: 10,
  fontWeight: 900,
};

const heroStyle = {
  minHeight: 700,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const heroInnerStyle = {
  minHeight: 700,
  maxWidth: 1320,
  margin: "0 auto",
  padding: "76px 5vw",
  display: "flex",
  alignItems: "center",
};

const heroCopyStyle = {
  width: "100%",
  maxWidth: 650,
  color: "#fff",
};

const heroLogoStyle = {
  width: 205,
  maxWidth: "65%",
  height: "auto",
  marginBottom: 25,
};

const heroKickerStyle = {
  color: "#f1c98f",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2.5,
  marginBottom: 16,
};

const heroTitleStyle = {
  fontSize: "clamp(58px,7vw,104px)",
  lineHeight: .84,
  letterSpacing: -4,
  margin: "0 0 24px",
  fontWeight: 1000,
};

const heroTextStyle = {
  maxWidth: 560,
  fontSize: 18,
  lineHeight: 1.6,
  color: "#f2eee6",
};

const heroButtonsStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap" as const,
  marginTop: 27,
};

const primaryButtonStyle = {
  color: "#111",
  textDecoration: "none",
  padding: "15px 20px",
  fontSize: 11,
  fontWeight: 900,
};

const secondaryButtonStyle = {
  background: "transparent",
  border: "1px solid #fff",
  color: "#fff",
  padding: "15px 20px",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  color: "#fff",
  padding: "66px 7vw",
  gap: 42,
};

const goldEyebrowStyle = {
  color: "#f1c98f",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.8,
  marginBottom: 15,
};

const hourRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  fontSize: 12,
};

const middleInfoStyle = {
  borderLeft: "1px solid rgba(255,255,255,.3)",
  borderRight: "1px solid rgba(255,255,255,.3)",
  textAlign: "center" as const,
  padding: "0 30px",
};

const addressStyle = {
  fontSize: 23,
  lineHeight: 1.35,
  fontWeight: 900,
};

const phoneStyle = {
  display: "inline-block",
  color: "#fff",
  marginTop: 16,
  fontWeight: 900,
};

const quickActionsStyle = {
  display: "grid",
  gap: 12,
  alignContent: "center",
};

const quickButtonStyle = {
  color: "#111",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "17px 18px",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1,
};

const storyGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: "#fff9ee",
};

const storyCopyStyle = {
  padding: "86px 7vw",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const eyebrowStyle = {
  color: "#a7562d",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2.2,
};

const storyTitleStyle = {
  fontSize: "clamp(44px,6vw,78px)",
  lineHeight: .94,
  letterSpacing: -3,
  margin: "12px 0 24px",
};

const storyTextStyle = {
  fontSize: 18,
  lineHeight: 1.7,
  maxWidth: 650,
};

const storyPhotoStyle = {
  minHeight: 540,
};

const coverStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  display: "block",
};

const featuredSectionStyle = {
  background: "#eadbc4",
};

const contentStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "76px 24px",
};

const sectionHeadingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 20,
  margin: "10px 0 30px",
};

const sectionTitleStyle = {
  fontSize: "clamp(48px,6vw,84px)",
  lineHeight: .88,
  letterSpacing: -4,
  margin: 0,
};

const textButtonStyle = {
  border: 0,
  background: "transparent",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const featureGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 18,
};

const featureCardStyle = {
  background: "#fff9ee",
  border: "1px solid #c9bba2",
};

const featureImageStyle = {
  width: "100%",
  height: 300,
  objectFit: "cover" as const,
  display: "block",
};

const featureBodyStyle = {
  padding: 18,
};

const featureNameStyle = {
  fontSize: 20,
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const featureDescriptionStyle = {
  marginTop: 7,
  fontSize: 12,
  lineHeight: 1.5,
  color: "#5f584d",
};

const featurePriceStyle = {
  marginTop: 12,
  color: "#a7562d",
  fontWeight: 900,
};

const menuSectionStyle = {
  background: "#fff9ee",
};

const menuTitleStyle = {
  fontSize: "clamp(58px,8vw,104px)",
  lineHeight: .86,
  letterSpacing: -5,
  margin: "10px 0 42px",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: "0 54px",
};

const menuCategoryStyle = {
  borderTop: "2px solid #111",
  padding: "22px 0 16px",
};

const menuCategoryHeadingStyle = {
  margin: "0 0 14px",
  fontSize: 23,
  textTransform: "uppercase" as const,
};

const menuItemStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 18,
  borderTop: "1px solid #cabba3",
  padding: "14px 0",
};

const menuItemNameStyle = {
  fontSize: 14,
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const menuItemDescriptionStyle = {
  marginTop: 5,
  fontSize: 12,
  lineHeight: 1.45,
  color: "#625b51",
};

const menuItemPriceStyle = {
  fontSize: 13,
  fontWeight: 900,
};

const clubSectionStyle = {
  color: "#fff",
};

const clubInnerStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "60px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 25,
  flexWrap: "wrap" as const,
};

const clubEyebrowStyle = {
  color: "#f1c98f",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2,
};

const clubTitleStyle = {
  fontSize: "clamp(42px,6vw,72px)",
  lineHeight: .9,
  margin: "8px 0 10px",
};

const clubTextStyle = {
  color: "#e7eee9",
  fontSize: 15,
};

const clubButtonStyle = {
  color: "#111",
  textDecoration: "none",
  padding: "16px 20px",
  fontSize: 11,
  fontWeight: 900,
};

const visitGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr .8fr",
  background: "#eadbc4",
};

const visitCopyStyle = {
  padding: "72px 7vw",
};

const visitTitleStyle = {
  fontSize: "clamp(50px,6vw,86px)",
  lineHeight: .86,
  letterSpacing: -3,
  margin: "10px 0 18px",
};

const visitTextStyle = {
  maxWidth: 560,
  fontSize: 17,
  lineHeight: 1.6,
};

const visitActionStyle = {
  minHeight: 340,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
  gap: 22,
  padding: 40,
};

const visitLogoStyle = {
  width: 190,
  maxWidth: "75%",
};

const darkButtonStyle = {
  background: "#111",
  color: "#fff",
  textDecoration: "none",
  padding: "15px 19px",
  fontSize: 10,
  fontWeight: 900,
};

const footerStyle = {
  background: "#111",
  color: "#fff",
  padding: "48px 24px 22px",
};

const footerGridStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 36,
  alignItems: "center",
};

const footerLogoStyle = {
  width: 115,
};

const footerTextStyle = {
  fontSize: 11,
  lineHeight: 1.6,
  color: "#aaa",
};
