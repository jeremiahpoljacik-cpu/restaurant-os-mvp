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
    () => items.filter((item) => item.featured).slice(0, 3),
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
          <p style={{ color: "#777" }}>
            This restaurant website has not been published yet.
          </p>
        </div>
      </main>
    );
  }

  const cream = "#f0e5d2";
  const ink = "#101417";
  const deep = branding?.primary_color || "#0f2530";
  const accent = branding?.secondary_color || "#d98a18";

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const navPages = pages.filter((page) => page.show_in_nav);

  const heroPhoto =
    website.hero_image_url ||
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1800&q=85";

  const lodgePhoto =
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=85";

  const foodPhoto =
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=85";

  const barPhoto =
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=85";

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
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .story-grid { grid-template-columns: 1fr !important; }
          .menu-grid { grid-template-columns: 1fr !important; }
          .visit-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .hero-copy { padding: 58px 22px !important; }
          .hero-title { font-size: clamp(60px, 18vw, 100px) !important; }
        }
      `}</style>

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <button style={brandButtonStyle} onClick={() => scrollTo("top")}>
            <div style={brandMarkStyle}>{restaurant.name}</div>
            <div style={brandSubStyle}>
              {restaurant.cuisine_category || "MOUNTAIN KITCHEN"}
            </div>
          </button>

          <nav className="desktop-nav" style={navStyle}>
            <button style={navLinkStyle} onClick={() => scrollTo("story")}>
              OUR STORY
            </button>
            <button style={navLinkStyle} onClick={() => scrollTo("menu")}>
              MENU
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
          <div style={heroKickerStyle}>WOOD • FIRE • MOUNTAIN</div>
          <h1 className="hero-title" style={heroTitleStyle}>
            {website.hero_headline || "COME HUNGRY. STAY AWHILE."}
          </h1>
          <p style={heroTextStyle}>
            {website.hero_subheadline ||
              branding?.tagline ||
              "A warm mountain-lodge restaurant built around bold food, cold drinks, and a room people actually want to hang out in."}
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
            <button style={heroSecondaryStyle} onClick={() => scrollTo("menu")}>
              VIEW MENU
            </button>
          </div>
        </div>

        <div
          style={{
            ...heroImageStyle,
            background: `url("${heroPhoto}") center/cover`,
          }}
        />
      </section>

      <section style={lodgeStripStyle}>
        <div style={lodgeStripInnerStyle}>
          <span>WOOD-FIRED</span>
          <span>•</span>
          <span>SCRATCH KITCHEN</span>
          <span>•</span>
          <span>LOCAL BEER</span>
          <span>•</span>
          <span>APRÈS ENERGY</span>
        </div>
      </section>

      <section id="story" className="story-grid" style={storyGridStyle}>
        <div
          style={{
            ...storyImageStyle,
            background: `url("${lodgePhoto}") center/cover`,
          }}
        />

        <div style={storyCopyStyle}>
          <div style={eyebrowStyle}>THE VIBE</div>
          <h2 style={storyTitleStyle}>
            {website.about_title || "A PLACE WITH SOME SOUL."}
          </h2>
          <p style={storyTextStyle}>
            {website.about_body ||
              branding?.short_description ||
              "Think old timber, a real bar, mountain-town energy and food that can hold its own. 802 Pizza is built to feel like the kind of place you discover once and keep coming back to."}
          </p>

          <div style={storyStatsStyle}>
            <div>
              <div style={statNumberStyle}>01</div>
              <div style={statLabelStyle}>WOOD-FIRED FAVORITES</div>
            </div>
            <div>
              <div style={statNumberStyle}>02</div>
              <div style={statLabelStyle}>BURGERS • WINGS • PASTA</div>
            </div>
            <div>
              <div style={statNumberStyle}>03</div>
              <div style={statLabelStyle}>BEER • COCKTAILS • GOOD TIMES</div>
            </div>
          </div>
        </div>
      </section>

      {featuredItems.length > 0 && (
        <section style={featureSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>FEATURED FROM THE KITCHEN</div>
            <div style={sectionHeaderRowStyle}>
              <h2 style={sectionTitleStyle}>NOT JUST PIZZA.</h2>
              <button style={textButtonStyle} onClick={() => scrollTo("menu")}>
                VIEW FULL MENU →
              </button>
            </div>

            <div className="feature-grid" style={featureGridStyle}>
              {featuredItems.map((item, index) => (
                <article key={item.id} style={featureCardStyle}>
                  <div
                    style={{
                      ...featurePhotoStyle,
                      background:
                        index === 0
                          ? `url("${foodPhoto}") center/cover`
                          : index === 1
                          ? `url("${barPhoto}") center/cover`
                          : `url("${heroPhoto}") center/cover`,
                    }}
                  />

                  <div style={featureBodyStyle}>
                    <div style={featureLabelStyle}>FEATURED</div>
                    <h3 style={featureTitleStyle}>{item.name}</h3>
                    {item.description && (
                      <p style={featureTextStyle}>{item.description}</p>
                    )}
                    {item.price !== null && (
                      <div style={featurePriceStyle}>
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

      <section style={{ ...barSceneStyle, background: deep }}>
        <div
          style={{
            ...barSceneImageStyle,
            background: `url("${barPhoto}") center/cover`,
          }}
        />

        <div style={barSceneCopyStyle}>
          <div style={barEyebrowStyle}>THE BAR</div>
          <h2 style={barTitleStyle}>POUR SOMETHING GOOD.</h2>
          <p style={barTextStyle}>
            Cold beer, warm wood, easy conversation. Build out a real bar
            program and this becomes part of the experience, not an afterthought.
          </p>
        </div>
      </section>

      {website.show_menu && (
        <section id="menu" style={menuSectionStyle}>
          <div style={contentStyle}>
            <div style={eyebrowStyle}>MENU</div>
            <h2 style={menuTitleStyle}>COME HUNGRY.</h2>

            <div className="menu-grid" style={menuGridStyle}>
              {menuGroups.map((category) => (
                <article key={category.id} style={menuCategoryStyle}>
                  <h3 style={menuCategoryTitleStyle}>{category.name}</h3>

                  {category.items.map((item) => (
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
        <section style={{ ...vipSectionStyle, background: accent }}>
          <div style={vipInnerStyle}>
            <div>
              <div style={vipEyebrowStyle}>REWARDS + OFFERS</div>
              <h2 style={vipTitleStyle}>
                {growth?.vip_club_name || "JOIN THE 802 CLUB"}
              </h2>
              <p style={vipTextStyle}>
                {growth?.signup_offer ||
                  "Get restaurant news, offers and member-only perks without the spam."}
              </p>
            </div>

            <a
              href={`/r/${restaurant.slug}/vip`}
              style={vipButtonStyle}
            >
              JOIN NOW
            </a>
          </div>
        </section>
      )}

      <section id="visit" className="visit-grid" style={visitGridStyle}>
        <div style={visitMainStyle}>
          <div style={eyebrowStyle}>COME SEE US</div>
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

      <footer style={footerStyle}>
        <div className="footer-grid" style={footerGridStyle}>
          <div>
            <div style={footerBrandStyle}>{restaurant.name}</div>
            <div style={footerSmallStyle}>
              {restaurant.cuisine_category || "MOUNTAIN KITCHEN"}
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
  background: "#f0e5d2",
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
  color: "#b77410",
};

const headerStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 30,
  background: "#0c1216",
  borderBottom: "1px solid #2b3135",
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

const brandButtonStyle = {
  border: 0,
  background: "transparent",
  color: "#fff",
  padding: 0,
  cursor: "pointer",
  textAlign: "left" as const,
};

const brandMarkStyle = {
  fontSize: "29px",
  fontWeight: 1000,
  letterSpacing: "-1.5px",
  textTransform: "uppercase" as const,
};

const brandSubStyle = {
  color: "#d6a24d",
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
  color: "#fff",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const navAnchorStyle = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const orderButtonStyle = {
  color: "#101417",
  textDecoration: "none",
  padding: "13px 16px",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const heroGridStyle = {
  minHeight: "700px",
  display: "grid",
  gridTemplateColumns: "0.9fr 1.1fr",
};

const heroCopyStyle = {
  color: "#fff",
  padding: "90px 7vw",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const heroKickerStyle = {
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2.5px",
  marginBottom: "24px",
  color: "#e9b151",
};

const heroTitleStyle = {
  fontSize: "clamp(72px, 9vw, 138px)",
  lineHeight: ".8",
  fontWeight: 1000,
  letterSpacing: "-7px",
  textTransform: "uppercase" as const,
  margin: "0 0 30px",
};

const heroTextStyle = {
  fontSize: "19px",
  lineHeight: 1.55,
  maxWidth: "560px",
  marginBottom: "28px",
};

const heroActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const heroPrimaryStyle = {
  color: "#101417",
  padding: "15px 20px",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
};

const heroSecondaryStyle = {
  color: "#fff",
  background: "transparent",
  border: "1px solid #fff",
  padding: "15px 20px",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
};

const heroImageStyle = {
  minHeight: "620px",
};

const lodgeStripStyle = {
  background: "#111",
  color: "#fff",
};

const lodgeStripInnerStyle = {
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

const storyGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  minHeight: "560px",
};

const storyImageStyle = {
  minHeight: "500px",
};

const storyCopyStyle = {
  background: "#eadfce",
  padding: "80px 7vw",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const storyTitleStyle = {
  fontSize: "clamp(56px,7vw,96px)",
  lineHeight: ".86",
  letterSpacing: "-4px",
  margin: "10px 0 24px",
};

const storyTextStyle = {
  maxWidth: "670px",
  fontSize: "19px",
  lineHeight: 1.65,
};

const storyStatsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "16px",
  marginTop: "30px",
};

const statNumberStyle = {
  fontSize: "22px",
  fontWeight: 900,
  color: "#b77410",
};

const statLabelStyle = {
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "4px",
};

const contentStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "82px 24px",
};

const featureSectionStyle = {
  background: "#f0e5d2",
};

const sectionHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "32px",
};

const sectionTitleStyle = {
  fontSize: "clamp(54px,7vw,92px)",
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

const featureGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "18px",
};

const featureCardStyle = {
  background: "#fff",
  border: "1px solid #c8baa6",
};

const featurePhotoStyle = {
  minHeight: "240px",
};

const featureBodyStyle = {
  padding: "20px",
};

const featureLabelStyle = {
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.4px",
  color: "#b77410",
};

const featureTitleStyle = {
  fontSize: "27px",
  lineHeight: 1,
  margin: "8px 0 10px",
};

const featureTextStyle = {
  color: "#555",
  lineHeight: 1.5,
  fontSize: "13px",
};

const featurePriceStyle = {
  marginTop: "14px",
  fontWeight: 900,
};

const barSceneStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr .8fr",
  color: "#fff",
};

const barSceneImageStyle = {
  minHeight: "420px",
};

const barSceneCopyStyle = {
  padding: "60px 6vw",
  display: "flex",
  justifyContent: "center",
  flexDirection: "column" as const,
};

const barEyebrowStyle = {
  color: "#e9b151",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const barTitleStyle = {
  fontSize: "clamp(48px,6vw,82px)",
  lineHeight: ".9",
  letterSpacing: "-3px",
  margin: "8px 0 18px",
};

const barTextStyle = {
  color: "#dbe3e6",
  fontSize: "17px",
  lineHeight: 1.6,
};

const menuSectionStyle = {
  background: "#f0e5d2",
};

const menuTitleStyle = {
  fontSize: "clamp(58px,8vw,104px)",
  lineHeight: ".86",
  letterSpacing: "-5px",
  margin: "10px 0 42px",
};

const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: "0 56px",
};

const menuCategoryStyle = {
  padding: "24px 0 16px",
  borderTop: "3px solid #111",
};

const menuCategoryTitleStyle = {
  fontSize: "25px",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
};

const menuItemStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "20px",
  padding: "15px 0",
  borderTop: "1px solid #bbae9a",
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
  color: "#101417",
};

const vipInnerStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "65px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "28px",
  flexWrap: "wrap" as const,
};

const vipEyebrowStyle = {
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const vipTitleStyle = {
  fontSize: "clamp(44px,6vw,80px)",
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
  background: "#101417",
  padding: "15px 20px",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
};

const visitGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr .8fr",
};

const visitMainStyle = {
  padding: "78px 8vw",
  background: "#efe4d1",
};

const visitTitleStyle = {
  fontSize: "clamp(52px,7vw,94px)",
  lineHeight: ".9",
  letterSpacing: "-4px",
  margin: "10px 0 22px",
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
  padding: "78px 7vw",
  background: "#ded0bc",
};

const hoursTitleStyle = {
  fontSize: "25px",
  fontWeight: 900,
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

const footerStyle = {
  background: "#0c1216",
  color: "#fff",
  padding: "60px 24px 24px",
};

const footerGridStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr .8fr",
  gap: "50px",
};

const footerBrandStyle = {
  fontSize: "38px",
  fontWeight: 1000,
  textTransform: "uppercase" as const,
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
  margin: "50px auto 0",
  paddingTop: "18px",
  borderTop: "1px solid #333",
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap" as const,
  color: "#777",
  fontSize: "10px",
};
