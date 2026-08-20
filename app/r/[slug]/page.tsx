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
    () => items.filter((item) => item.featured).slice(0, 5),
    [items]
  );

  if (loading) {
    return <main style={loadingStyle}>Loading 802 Pizza...</main>;
  }

  if (!restaurant || !website?.published) {
    return <main style={loadingStyle}>This restaurant site is not published.</main>;
  }

  const forest = "#104e3d";
  const cream = "#f7efdf";
  const paper = "#eadbbd";
  const tan = "#f0c485";
  const ink = "#111111";
  const rust = "#c45f2d";

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
    "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1800&q=88";

  const featurePhotos = [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=85",
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main style={{ background: cream, color: ink, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        button, a { font: inherit; }

        @media (max-width: 900px) {
          .top-nav { display: none !important; }
          .info-grid,
          .story-grid,
          .visit-grid,
          .footer-grid { grid-template-columns: 1fr !important; }
          .featured-grid { grid-template-columns: 1fr 1fr !important; }
          .menu-grid { grid-template-columns: 1fr !important; }
          .brand-lockup { transform: scale(.85); }
        }

        @media (max-width: 560px) {
          .featured-grid { grid-template-columns: 1fr !important; }
          .brand-lockup { transform: scale(.72); }
          .hanging-actions { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* TOP NAV — cream strip with centered badge */}
      <header style={navBarStyle}>
        <div className="top-nav" style={navLeftStyle}>
          <button style={navButtonStyle} onClick={() => scrollTo("story")}>OUR STORY</button>
          <button style={navButtonStyle} onClick={() => scrollTo("menu")}>MENU</button>
          {ordering?.online_ordering_url && (
            <a
              style={navLinkStyle}
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
            >
              ORDER
            </a>
          )}
        </div>

        <button style={navBadgeStyle} onClick={() => scrollTo("top")}>
          <BrandLockup compact />
        </button>

        <div className="top-nav" style={navRightStyle}>
          {ordering?.catering_email && (
            <a style={navLinkStyle} href={`mailto:${ordering.catering_email}`}>CATERING</a>
          )}
          <a style={navLinkStyle} href={`/r/${restaurant.slug}/offers`}>OFFERS</a>
          {website.show_vip && (
            <a style={navLinkStyle} href={`/r/${restaurant.slug}/vip`}>REWARDS</a>
          )}
        </div>
      </header>

      {/* BRAND HERO — much closer in proportion/composition to reference */}
      <section id="top" style={{ ...brandHeroStyle, background: paper }}>
        <div style={blueprintStyle} />
        <div className="brand-lockup" style={brandCenterStyle}>
          <BrandLockup />
          <div style={heroTagStyle}>
            {branding?.tagline || "WOOD-FIRED • NEIGHBORHOOD • GOOD"}
          </div>
        </div>
      </section>

      {/* BIG FOOD HIT */}
      <section style={foodHeroStyle}>
        <img src={heroFood} alt="802 Pizza featured food" style={coverImageStyle} />
      </section>

      {/* GREEN INFORMATION BAND */}
      <section className="info-grid" style={{ ...infoGridStyle, background: forest }}>
        <div style={infoColumnStyle}>
          <div style={goldEyebrowStyle}>HOURS OF OPERATION</div>
          <HoursList hours={hours} />
        </div>

        <div style={middleInfoStyle}>
          <div style={ornamentStyle}>╭────────╮</div>
          <div style={addressStyle}>{address || "ZEBULON, NORTH CAROLINA"}</div>
          {restaurant.phone && (
            <>
              <div style={tinyCapsStyle}>GIVE US A RING</div>
              <a href={`tel:${restaurant.phone}`} style={phoneStyle}>
                {restaurant.phone}
              </a>
            </>
          )}
          <div style={ornamentStyle}>╰────────╯</div>
        </div>

        <div className="hanging-actions" style={actionStackStyle}>
          {ordering?.catering_email && (
            <a href={`mailto:${ordering.catering_email}`} style={{ ...hangingButtonStyle, background: tan }}>
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
          <a href={`/r/${restaurant.slug}/offers`} style={{ ...hangingButtonStyle, background: tan }}>
            OFFERS
          </a>
          {website.show_vip && (
            <a href={`/r/${restaurant.slug}/vip`} style={{ ...hangingButtonStyle, background: tan }}>
              JOIN THE 802 CLUB
            </a>
          )}
        </div>
      </section>

      {/* STORY — centered, airy, like the reference */}
      <section id="story" style={storySectionStyle}>
        <div style={storyInnerStyle}>
          <div style={storyEyebrowStyle}>802 STORY</div>
          <h2 style={storyTitleStyle}>
            {website.about_title || "A NEIGHBORHOOD RESTAURANT WITH A LITTLE MOUNTAIN SOUL."}
          </h2>
          <p style={storyTextStyle}>
            {website.about_body ||
              branding?.short_description ||
              "802 Pizza is built around food worth gathering for — wood-fired pizza, sandwiches, salads, wings, cold beer and a room that feels easy to settle into. Come for dinner, stay for another round, and bring the whole crew."}
          </p>
        </div>
      </section>

      {/* FEATURED MENU — a concise visual strip, not a giant gallery */}
      {featured.length > 0 && (
        <section style={featuredSectionStyle}>
          <div style={contentStyle}>
            <div style={storyEyebrowStyle}>FROM THE KITCHEN</div>
            <div style={featuredHeadingRowStyle}>
              <h2 style={featuredHeadingStyle}>FEATURED FAVORITES</h2>
              <button style={viewMenuButtonStyle} onClick={() => scrollTo("menu")}>
                VIEW FULL MENU →
              </button>
            </div>

            <div className="featured-grid" style={featuredGridStyle}>
              {featured.map((item, index) => (
                <article key={item.id} style={featuredCardStyle}>
                  <div
                    style={{
                      ...featuredPhotoStyle,
                      backgroundImage: `url("${featurePhotos[index % featurePhotos.length]}")`,
                    }}
                  />
                  <div style={featuredBodyStyle}>
                    <div style={featuredNameStyle}>{item.name}</div>
                    {item.description && (
                      <div style={featuredDescStyle}>{item.description}</div>
                    )}
                    {item.price !== null && (
                      <div style={featuredPriceStyle}>${Number(item.price).toFixed(2)}</div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FULL MENU */}
      {website.show_menu && (
        <section id="menu" style={menuSectionStyle}>
          <div style={contentStyle}>
            <div style={storyEyebrowStyle}>MENU</div>
            <h2 style={menuHeadingStyle}>COME HUNGRY.</h2>

            <div className="menu-grid" style={menuGridStyle}>
              {menuGroups.map((group) => (
                <article key={group.id} style={menuCategoryStyle}>
                  <h3 style={menuCategoryHeadingStyle}>{group.name}</h3>

                  {group.items.map((item) => (
                    <div key={item.id} style={menuItemStyle}>
                      <div>
                        <div style={menuItemNameStyle}>{item.name}</div>
                        {item.description && (
                          <div style={menuItemDescStyle}>{item.description}</div>
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

      {/* CLUB */}
      {website.show_vip && (
        <section style={{ ...clubStyle, background: forest }}>
          <div style={clubInnerStyle}>
            <div>
              <div style={clubEyebrowStyle}>802 CLUB</div>
              <h2 style={clubHeadingStyle}>
                {growth?.vip_club_name || "JOIN THE REGULARS."}
              </h2>
              <p style={clubTextStyle}>
                {growth?.signup_offer || "Get first dibs on offers, events and restaurant news."}
              </p>
            </div>
            <a href={`/r/${restaurant.slug}/vip`} style={{ ...clubButtonStyle, background: tan }}>
              JOIN NOW
            </a>
          </div>
        </section>
      )}

      {/* VISIT */}
      <section className="visit-grid" style={visitGridStyle}>
        <div style={visitCopyStyle}>
          <div style={storyEyebrowStyle}>VISIT 802</div>
          <h2 style={visitHeadingStyle}>{restaurant.name}</h2>
          <p style={visitAddressStyle}>{address}</p>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} style={visitPhoneStyle}>
              {restaurant.phone}
            </a>
          )}
        </div>

        <div style={visitActionStyle}>
          {ordering?.online_ordering_url && (
            <a
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
              style={{ ...bigActionStyle, background: tan }}
            >
              ORDER ONLINE
            </a>
          )}
          {ordering?.catering_email && (
            <a
              href={`mailto:${ordering.catering_email}`}
              style={{ ...bigActionStyle, background: "#fff8ea" }}
            >
              CATERING & EVENTS
            </a>
          )}
        </div>
      </section>

      <footer style={footerStyle}>
        <div className="footer-grid" style={footerGridStyle}>
          <BrandLockup footer />
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

function BrandLockup({
  compact = false,
  footer = false,
}: {
  compact?: boolean;
  footer?: boolean;
}) {
  const baseColor = footer ? "#ffffff" : "#111111";
  const accent = "#c45f2d";

  return (
    <div style={{ textAlign: "center", color: baseColor, minWidth: compact ? 180 : 360 }}>
      <div style={{ fontSize: compact ? 9 : 13, letterSpacing: compact ? 6 : 9, fontWeight: 900 }}>
        MOUNTAIN MADE
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? 8 : 18, margin: compact ? "3px 0" : "10px 0" }}>
        <svg width={compact ? 34 : 72} height={compact ? 16 : 32} viewBox="0 0 80 36" aria-hidden="true">
          <line x1="3" y1="18" x2="55" y2="18" stroke={baseColor} strokeWidth="2" />
          <path d="M55 8 L76 18 L55 28 Z" fill="none" stroke={baseColor} strokeWidth="2" />
        </svg>

        <div style={{ fontSize: compact ? 34 : 82, lineHeight: .82, fontWeight: 1000, letterSpacing: compact ? -2 : -6 }}>
          802
        </div>

        <svg width={compact ? 34 : 72} height={compact ? 16 : 32} viewBox="0 0 80 36" aria-hidden="true">
          <line x1="25" y1="18" x2="77" y2="18" stroke={baseColor} strokeWidth="2" />
          <path d="M25 8 L4 18 L25 28 Z" fill="none" stroke={baseColor} strokeWidth="2" />
        </svg>
      </div>

      <div style={{ fontSize: compact ? 12 : 28, letterSpacing: compact ? 5 : 12, fontWeight: 1000, color: accent }}>
        PIZZA
      </div>

      {!compact && !footer && (
        <div style={{ marginTop: 10, fontSize: 10, letterSpacing: 3, fontWeight: 900 }}>
          ZEBULON • NORTH CAROLINA
        </div>
      )}
    </div>
  );
}

function HoursList({ hours }: { hours: Hours | null }) {
  if (!hours) return <div style={{ color: "#f6e7c8" }}>Hours coming soon.</div>;

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
    <div style={{ display: "grid", gap: 8 }}>
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
  background: "#f7efdf",
};

const navBarStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
  height: 76,
  background: "#fff8ea",
  borderBottom: "1px solid #d4c6ad",
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  padding: "0 28px",
};

const navLeftStyle = {
  display: "flex",
  gap: 18,
  justifyContent: "flex-end",
  alignItems: "center",
  paddingRight: 18,
};

const navRightStyle = {
  display: "flex",
  gap: 18,
  justifyContent: "flex-start",
  alignItems: "center",
  paddingLeft: 18,
};

const navButtonStyle = {
  background: "transparent",
  border: 0,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.2,
  cursor: "pointer",
};

const navLinkStyle = {
  color: "#111",
  textDecoration: "none",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.2,
};

const navBadgeStyle = {
  border: 0,
  background: "#fff8ea",
  borderRadius: "14px",
  padding: "14px 22px",
  marginTop: 16,
  boxShadow: "0 1px 0 rgba(0,0,0,.08)",
  cursor: "pointer",
  position: "relative" as const,
  zIndex: 4,
};

const brandHeroStyle = {
  minHeight: 520,
  position: "relative" as const,
  overflow: "hidden",
};

const blueprintStyle = {
  position: "absolute" as const,
  inset: 0,
  opacity: .45,
  backgroundImage:
    "linear-gradient(90deg, rgba(120,98,64,.19) 1px, transparent 1px), linear-gradient(rgba(120,98,64,.16) 1px, transparent 1px), repeating-linear-gradient(31deg, transparent 0 89px, rgba(120,98,64,.13) 90px 91px)",
  backgroundSize: "90px 90px, 90px 90px, auto",
};

const brandCenterStyle = {
  position: "relative" as const,
  zIndex: 2,
  minHeight: 520,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "center",
  padding: "80px 20px 60px",
};

const heroTagStyle = {
  marginTop: 28,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 3,
};

const foodHeroStyle = {
  height: 540,
  overflow: "hidden",
};

const coverImageStyle = {
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
  gap: 42,
};

const infoColumnStyle = {
  padding: "8px 20px",
};

const goldEyebrowStyle = {
  color: "#f1c98f",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 1.6,
  marginBottom: 16,
};

const hourRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  fontSize: 12,
};

const middleInfoStyle = {
  borderLeft: "1px solid rgba(255,255,255,.32)",
  borderRight: "1px solid rgba(255,255,255,.32)",
  padding: "8px 30px",
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};

const ornamentStyle = {
  color: "#f1c98f",
  fontSize: 18,
  letterSpacing: 3,
};

const addressStyle = {
  fontSize: 24,
  lineHeight: 1.3,
  fontWeight: 900,
  maxWidth: 360,
};

const tinyCapsStyle = {
  fontSize: 9,
  letterSpacing: 2,
  fontWeight: 900,
  color: "#d6e5dd",
};

const phoneStyle = {
  color: "#fff",
  fontSize: 15,
  fontWeight: 900,
};

const actionStackStyle = {
  display: "grid",
  gap: 14,
  alignContent: "center",
};

const hangingButtonStyle = {
  color: "#111",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "18px 20px",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 1.2,
  borderRadius: 4,
  boxShadow: "0 4px 0 rgba(0,0,0,.22)",
};

const storySectionStyle = {
  background: "#fff8ea",
  padding: "86px 24px",
};

const storyInnerStyle = {
  maxWidth: 950,
  margin: "0 auto",
  textAlign: "center" as const,
};

const storyEyebrowStyle = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2.2,
  color: "#a34f2a",
};

const storyTitleStyle = {
  fontSize: "clamp(38px,5vw,68px)",
  lineHeight: .98,
  letterSpacing: -2,
  margin: "14px 0 24px",
};

const storyTextStyle = {
  fontSize: 18,
  lineHeight: 1.7,
  margin: 0,
};

const featuredSectionStyle = {
  background: "#efe1ca",
};

const contentStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "76px 24px",
};

const featuredHeadingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 20,
  margin: "10px 0 30px",
};

const featuredHeadingStyle = {
  fontSize: "clamp(44px,6vw,76px)",
  lineHeight: .9,
  letterSpacing: -3,
  margin: 0,
};

const viewMenuButtonStyle = {
  border: 0,
  background: "transparent",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const featuredGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5,1fr)",
  gap: 14,
};

const featuredCardStyle = {
  background: "#fff8ea",
  border: "1px solid #cbbba1",
};

const featuredPhotoStyle = {
  height: 170,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const featuredBodyStyle = {
  padding: 14,
};

const featuredNameStyle = {
  fontSize: 16,
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const featuredDescStyle = {
  fontSize: 11,
  lineHeight: 1.45,
  color: "#5f574c",
  marginTop: 6,
};

const featuredPriceStyle = {
  color: "#a34f2a",
  fontSize: 13,
  fontWeight: 900,
  marginTop: 10,
};

const menuSectionStyle = {
  background: "#fff8ea",
};

const menuHeadingStyle = {
  fontSize: "clamp(56px,8vw,100px)",
  lineHeight: .85,
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

const menuItemDescStyle = {
  marginTop: 5,
  fontSize: 12,
  lineHeight: 1.45,
  color: "#625b51",
};

const menuItemPriceStyle = {
  fontSize: 13,
  fontWeight: 900,
};

const clubStyle = {
  color: "#fff",
};

const clubInnerStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "62px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 26,
  flexWrap: "wrap" as const,
};

const clubEyebrowStyle = {
  color: "#f1c98f",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2,
};

const clubHeadingStyle = {
  fontSize: "clamp(40px,6vw,72px)",
  lineHeight: .9,
  margin: "8px 0 10px",
};

const clubTextStyle = {
  color: "#e4efe9",
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
  background: "#efe1ca",
};

const visitCopyStyle = {
  padding: "72px 7vw",
};

const visitHeadingStyle = {
  fontSize: "clamp(46px,6vw,82px)",
  lineHeight: .9,
  margin: "10px 0 18px",
};

const visitAddressStyle = {
  fontSize: 18,
  lineHeight: 1.5,
};

const visitPhoneStyle = {
  color: "#111",
  fontWeight: 900,
};

const visitActionStyle = {
  display: "grid",
  gap: 14,
  alignContent: "center",
  padding: "50px 7vw",
};

const bigActionStyle = {
  color: "#111",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "20px",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 1,
  border: "1px solid #c6b69a",
};

const footerStyle = {
  background: "#111",
  color: "#fff",
  padding: "56px 24px 22px",
};

const footerGridStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 1fr",
  gap: 40,
  alignItems: "center",
};

const footerTextStyle = {
  fontSize: 11,
  lineHeight: 1.6,
  color: "#bfbfbf",
};
