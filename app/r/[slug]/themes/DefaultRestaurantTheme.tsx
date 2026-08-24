"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  theme_key: string | null;
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

type Website = {
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  hero_video_url?: string | null;
  logo_url: string | null;
  about_title: string | null;
  about_body: string | null;
  primary_cta_label: string | null;
  secondary_cta_label: string | null;
  show_about: boolean | null;
  show_menu: boolean | null;
  show_ordering: boolean | null;
  show_vip: boolean | null;
  published: boolean | null;
};

type Ordering = {
  online_ordering_url: string | null;
  catering_email: string | null;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  featured: boolean | null;
  available: boolean | null;
};

type SiteImage = {
  id: string;
  image_url: string;
};

type SiteData = {
  restaurant: Restaurant;
  branding: Branding | null;
  website: Website;
  ordering: Ordering | null;
  items: MenuItem[];
  images: SiteImage[];
};

const MEXICAN_KEYS = new Set([
  "mex-jefe-bold",
  "mex-cantina-social",
  "mex-coastal-taco",
  "mex-cosmic-night",
  "mex-birria-street",
]);

const THEME_MEDIA: Record<string, { images: string[]; video?: string }> = {
  "mex-jefe-bold": {
    images: [
      "https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=1200&q=80"
    ],
    video: "https://player.vimeo.com/external/434045526.sd.mp4?s=3d0ef4f6f9c3b65b0f59f88e66847e6fe4ed291a&profile_id=139&oauth2_token_id=57447761"
  },
  "mex-cantina-social": {
    images: [
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80"
    ],
    video: "https://player.vimeo.com/external/477844741.sd.mp4?s=7b584efb5b10a7cc8ca2cdca5e451684f8ec4102&profile_id=139&oauth2_token_id=57447761"
  },
  "mex-coastal-taco": {
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80"
    ],
    video: "https://player.vimeo.com/external/393180998.sd.mp4?s=4a0292accce44bfb95f87f5a2d7f5f42cc70d879&profile_id=139&oauth2_token_id=57447761"
  },
  "mex-cosmic-night": {
    images: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552566626-f8b1dfbcbcb9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80"
    ],
    video: "https://player.vimeo.com/external/368763162.sd.mp4?s=e4cc7195ef3cc0cc15e856d77bb957f2e4ddf3dd&profile_id=139&oauth2_token_id=57447761"
  },
  "mex-birria-street": {
    images: [
      "https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=1200&q=80"
    ],
    video: "https://player.vimeo.com/external/434045526.sd.mp4?s=3d0ef4f6f9c3b65b0f59f88e66847e6fe4ed291a&profile_id=139&oauth2_token_id=57447761"
  },
  "pizza-otto-editorial": {
    images: [
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=86"
    ]
  },
  "pizza-red-brick": {
    images: [
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=86"
    ]
  },
  "pizza-ramuntos-heritage": {
    images: [
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=86"
    ]
  },
  "pizza-napoli-modern": {
    images: [
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=86"
    ]
  },
  "pizza-slice-shop": {
    images: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1200&q=82"
    ]
  },
  "pizza-woodfire": {
    images: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=82"
    ]
  },
  "pizza-supper-club": {
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=82",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=82",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=82"
    ]
  }
};

function themeMedia(themeKey: string | null | undefined) {
  return THEME_MEDIA[themeKey || ""] || THEME_MEDIA["mex-cantina-social"];
}

function getHeroImage(data: SiteData, themeKey: string) {
  return data.website.hero_image_url || data.images[0]?.image_url || themeMedia(themeKey).images[0] || "";
}

function getThemeImage(data: SiteData, themeKey: string, index: number) {
  if (index === 0 && data.website.hero_image_url) return data.website.hero_image_url;
  return data.images[index]?.image_url || themeMedia(themeKey).images[index] || themeMedia(themeKey).images[index % Math.max(themeMedia(themeKey).images.length, 1)] || "";
}

function getHeroVideo(data: SiteData, themeKey: string) {
  return (data.website as any)?.hero_video_url || themeMedia(themeKey).video || "";
}

function PhotoMosaic({ data, themeKey, bg, cardBg, rounded = 24 }: { data: SiteData; themeKey: string; bg: string; cardBg: string; rounded?: number }) {
  const imgs = [0, 1, 2].map((i) => getThemeImage(data, themeKey, i));
  return (
    <section style={{ background: bg, padding: "26px 26px 12px" }}>
      <div className="ros-three" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr .8fr .8fr", gap: 14 }}>
        {imgs.map((src, idx) => (
          <div key={idx} style={{ background: cardBg, borderRadius: rounded, overflow: "hidden", minHeight: idx === 0 ? 380 : 280 }}>
            {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DefaultRestaurantTheme() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function load() {
    setLoading(true);

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id,name,slug,theme_key,cuisine_category,phone,address_line_1,city,state,zip")
      .eq("slug", slug)
      .maybeSingle();

    if (!restaurant) {
      setData(null);
      setLoading(false);
      return;
    }

    const [branding, website, ordering, items, images] = await Promise.all([
      supabase.from("restaurant_branding").select("*").eq("restaurant_id", restaurant.id).maybeSingle(),
      supabase.from("restaurant_website_settings").select("*").eq("restaurant_id", restaurant.id).maybeSingle(),
      supabase.from("restaurant_ordering").select("online_ordering_url,catering_email").eq("restaurant_id", restaurant.id).maybeSingle(),
      supabase.from("restaurant_menu_items").select("id,name,description,price,featured,available").eq("restaurant_id", restaurant.id).eq("available", true).order("featured", { ascending: false }).limit(10),
      supabase.from("restaurant_site_images").select("id,image_url").eq("restaurant_id", restaurant.id).eq("active", true).order("sort_order", { ascending: true }).limit(8),
    ]);

    setData({
      restaurant: restaurant as Restaurant,
      branding: (branding.data || null) as Branding | null,
      website: (website.data || {
        hero_headline: "",
        hero_subheadline: "",
        hero_image_url: "",
        logo_url: "",
        about_title: "",
        about_body: "",
        primary_cta_label: "ORDER ONLINE",
        secondary_cta_label: "VIEW MENU",
        show_about: true,
        show_menu: true,
        show_ordering: true,
        show_vip: true,
        published: false,
      }) as Website,
      ordering: (ordering.data || null) as Ordering | null,
      items: (items.data || []) as MenuItem[],
      images: (images.data || []) as SiteImage[],
    });

    setLoading(false);
  }

  if (loading) {
    return <main style={{ minHeight: "100vh", background: "#080808" }} />;
  }

  if (!data || !data.website.published) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#08111f", color: "#fff", fontFamily: "Arial" }}>
        This restaurant site is not published.
      </main>
    );
  }

  const key = data.restaurant.theme_key || "family-casual";

  if (key === "mex-jefe-bold") return <JefeBold data={data} />;
  if (key === "mex-cantina-social") return <CantinaSocial data={data} />;
  if (key === "mex-coastal-taco") return <CoastalTaco data={data} />;
  if (key === "mex-cosmic-night") return <CosmicNight data={data} />;
  if (key === "mex-birria-street") return <BirriaStreet data={data} />;

  if (key === "pizza-otto-editorial" || key === "pizza-red-brick") return <PizzaOttoEditorial data={data} />;
  if (key === "pizza-ramuntos-heritage" || key === "pizza-napoli-modern") return <PizzaRamuntosHeritage data={data} />;
  if (key === "pizza-slice-shop") return <PizzaSliceShop data={data} />;
  if (key === "pizza-woodfire") return <PizzaWoodfire data={data} />;
  if (key === "pizza-supper-club") return <PizzaSupperClub data={data} />;

  return <StandardFallback data={data} themeKey={key} />;
}

function SharedGlobal() {
  return (
    <style jsx global>{`
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; }
      a { color: inherit; text-decoration: none; }
      img { display: block; }
      button, input, textarea { font: inherit; }
      @media (max-width: 900px) {
        .ros-nav-links { display: none !important; }
        .ros-two { grid-template-columns: 1fr !important; }
        .ros-three { grid-template-columns: 1fr !important; }
        .ros-four { grid-template-columns: 1fr 1fr !important; }
      }
      @media (max-width: 620px) {
        .ros-four { grid-template-columns: 1fr !important; }
        .ros-desktop-cta { display: none !important; }
      }
    `}</style>
  );
}

function Header({
  data,
  bg,
  color,
  accent,
  compact = false,
  outline = false,
}: {
  data: SiteData;
  bg: string;
  color: string;
  accent: string;
  compact?: boolean;
  outline?: boolean;
}) {
  const { restaurant, website, ordering } = data;
  return (
    <header style={{ background: bg, color, borderBottom: outline ? `1px solid ${accent}55` : undefined }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", minHeight: compact ? 74 : 92, padding: "0 24px", display: "flex", alignItems: "center", gap: 20 }}>
        <a href={`/r/${restaurant.slug}`} style={{ minWidth: 160, display: "flex", alignItems: "center" }}>
          {website.logo_url ? (
            <img src={website.logo_url} alt={restaurant.name} style={{ maxWidth: compact ? 155 : 190, maxHeight: compact ? 54 : 68, objectFit: "contain" }} />
          ) : (
            <strong style={{ fontSize: compact ? 20 : 24, fontWeight: 950, letterSpacing: .4 }}>{restaurant.name}</strong>
          )}
        </a>

        <nav className="ros-nav-links" style={{ marginLeft: "auto", display: "flex", gap: 21, alignItems: "center", fontSize: 11, fontWeight: 900 }}>
          <a href="#story">STORY</a>
          <a href={`/r/${restaurant.slug}/food-menu`}>MENU</a>
          <a href={`/r/${restaurant.slug}/offers`}>OFFERS</a>
          {website.show_vip && <a href={`/r/${restaurant.slug}/vip`}>VIP</a>}
          <a href="#visit">VISIT</a>
        </nav>

        {ordering?.online_ordering_url && (
          <a
            className="ros-desktop-cta"
            href={ordering.online_ordering_url}
            target="_blank"
            rel="noreferrer"
            style={{ background: accent, color: "#fff", padding: "13px 17px", fontSize: 10, fontWeight: 950 }}
          >
            {website.primary_cta_label || "ORDER ONLINE"}
          </a>
        )}
      </div>
    </header>
  );
}

function HeroActions({ data, primary, secondary, darkText = false }: { data: SiteData; primary: string; secondary: string; darkText?: boolean }) {
  const { restaurant, website, ordering } = data;
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
      {ordering?.online_ordering_url && (
        <a href={ordering.online_ordering_url} target="_blank" rel="noreferrer" style={{ background: primary, color: darkText ? "#111" : "#fff", padding: "15px 22px", fontSize: 11, fontWeight: 950 }}>
          {website.primary_cta_label || "ORDER ONLINE"}
        </a>
      )}
      <a href={`/r/${restaurant.slug}/food-menu`} style={{ background: secondary, color: darkText ? "#111" : "#fff", padding: "15px 22px", fontSize: 11, fontWeight: 950 }}>
        {website.secondary_cta_label || "VIEW MENU"}
      </a>
    </div>
  );
}

function FeaturedGrid({ data, themeKey, cardBg, text, muted, accent, imageHeight = 210, radius = 0 }: { data: SiteData; themeKey: string; cardBg: string; text: string; muted: string; accent: string; imageHeight?: number; radius?: number }) {
  return (
    <div className="ros-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
      {data.items.slice(0, 6).map((item, index) => (
        <article key={item.id} style={{ background: cardBg, color: text, borderRadius: radius, overflow: "hidden", border: "1px solid rgba(127,127,127,.16)" }}>
          {getThemeImage(data, themeKey, index + 1) && <img src={getThemeImage(data, themeKey, index + 1)} alt="" style={{ width: "100%", height: imageHeight, objectFit: "cover" }} />}
          <div style={{ padding: 22 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
              <strong style={{ fontSize: 20 }}>{item.name}</strong>
              {item.price !== null && <strong style={{ marginLeft: "auto", color: accent }}>${Number(item.price).toFixed(2)}</strong>}
            </div>
            {item.description && <p style={{ color: muted, lineHeight: 1.55, fontSize: 14, marginBottom: 0 }}>{item.description}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function VisitBand({ data, bg, text, accent }: { data: SiteData; bg: string; text: string; accent: string }) {
  const { restaurant, ordering } = data;
  const address = [restaurant.address_line_1, restaurant.city, restaurant.state, restaurant.zip].filter(Boolean).join(", ");
  return (
    <section id="visit" style={{ background: bg, color: text }}>
      <div className="ros-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "62px 26px", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 40, alignItems: "center" }}>
        <div>
          <div style={{ color: accent, fontSize: 10, fontWeight: 950, letterSpacing: 2.4 }}>COME SEE US</div>
          <h2 style={{ margin: "10px 0", fontSize: "clamp(38px,5vw,62px)", lineHeight: 1 }}>{restaurant.name}</h2>
          <p style={{ opacity: .82, lineHeight: 1.7 }}>{address || "Visit us soon."}</p>
          {restaurant.phone && <a href={`tel:${restaurant.phone}`} style={{ color: accent, fontWeight: 900 }}>{restaurant.phone}</a>}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {ordering?.online_ordering_url && <a href={ordering.online_ordering_url} target="_blank" rel="noreferrer" style={{ background: accent, color: "#111", padding: "16px 18px", textAlign: "center", fontSize: 11, fontWeight: 950 }}>ORDER ONLINE</a>}
          {ordering?.catering_email && <a href={`mailto:${ordering.catering_email}`} style={{ border: "1px solid rgba(255,255,255,.35)", padding: "15px 18px", textAlign: "center", fontSize: 11, fontWeight: 950 }}>CATERING / EVENTS</a>}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. JEFE BOLD                                                               */
/* -------------------------------------------------------------------------- */

function JefeBold({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const hero = getHeroImage(data, "mex-jefe-bold");
  const heroVideo = getHeroVideo(data, "mex-jefe-bold");
  const red = branding?.primary_color || "#E43A2F";
  const yellow = branding?.secondary_color || "#F4C443";

  return (
    <main style={{ minHeight: "100vh", background: "#F5E6C8", color: "#101010", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#0A0A0A" color="#fff" accent={red} compact />

      <section style={{ minHeight: 650, position: "relative", display: "grid", gridTemplateColumns: "1.05fr .95fr", overflow: "hidden", background: "#0A0A0A", color: "#fff" }}>
        <div style={{ padding: "78px 7vw 70px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 2 }}>
          <div style={{ color: yellow, fontSize: 11, fontWeight: 950, letterSpacing: 3.2 }}>TACOS ◆ BURRITOS ◆ LATE NIGHT</div>
          <h1 style={{ margin: "16px 0 8px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(72px,9vw,132px)", lineHeight: .82, letterSpacing: .5, textTransform: "uppercase", fontWeight: 400 }}>
            {website.hero_headline || restaurant.name}
          </h1>
          <p style={{ maxWidth: 610, fontSize: 18, lineHeight: 1.65, color: "#ECECEC" }}>
            {website.hero_subheadline || branding?.tagline || "Fresh. Fast. Loud flavor. Made to order."}
          </p>
          <HeroActions data={data} primary={red} secondary={yellow} darkText />
        </div>

        <div style={{ minHeight: 650, background: hero ? `url("${hero}") center/cover` : `linear-gradient(145deg,${red},${yellow})`, position: "relative", overflow: "hidden" }}>
          {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#0A0A0A 0%,transparent 24%)" }} />
          <div style={{ position: "absolute", right: 24, bottom: 24, background: yellow, color: "#111", padding: "12px 16px", fontSize: 11, fontWeight: 950 }}>OPEN 7 DAYS A WEEK</div>
        </div>
      </section>

      <section style={{ background: yellow, color: "#111" }}>
        <div className="ros-four" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {["MENU","LOCATIONS","ORDER","VIP / REWARDS"].map((x) => <div key={x} style={{ padding: "22px 18px", borderRight: "1px solid rgba(0,0,0,.18)", textAlign: "center", fontSize: 12, fontWeight: 950 }}>{x}</div>)}
        </div>
      </section>

      <section id="story" style={{ background: "#F5E6C8" }}>
        <div className="ros-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "78px 26px", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: 45, alignItems: "center" }}>
          <div>
            <div style={{ color: red, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>¡BIENVENIDOS!</div>
            <h2 style={{ margin: "12px 0 18px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(48px,6vw,78px)", lineHeight: .9, textTransform: "uppercase", fontWeight: 400 }}>
              {website.about_title || `Who Is ${restaurant.name}?`}
            </h2>
            <p style={{ color: "#5D5448", fontSize: 17, lineHeight: 1.8 }}>
              {website.about_body || branding?.short_description || "Tell your story with personality, confidence and a reason for people to come hungry."}
            </p>
          </div>
          {getThemeImage(data, "mex-jefe-bold", 1) && <img src={getThemeImage(data, "mex-jefe-bold", 1)} alt="" style={{ width: "100%", height: 430, objectFit: "cover", border: `8px solid ${red}` }} />}
        </div>
      </section>

      {website.show_menu && data.items.length > 0 && (
        <section style={{ background: "#111", color: "#fff", padding: "76px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: yellow, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>WHAT ARE YOU CRAVING?</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(50px,6vw,82px)", textTransform: "uppercase", lineHeight: .9, fontWeight: 400 }}>Fan Favorites</h2>
            <FeaturedGrid data={data} themeKey="mex-jefe-bold" cardBg="#1A1A1A" text="#fff" muted="#BBB" accent={yellow} imageHeight={230} />
          </div>
        </section>
      )}

      <PhotoMosaic data={data} themeKey="mex-jefe-bold" bg="#F5E6C8" cardBg="#fff1" />
      <VisitBand data={data} bg={red} text="#fff" accent={yellow} />
      <Footer data={data} bg="#050505" color="#aaa" />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. CANTINA SOCIAL                                                          */
/* -------------------------------------------------------------------------- */

function CantinaSocial({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const hero = getHeroImage(data, "mex-cantina-social");
  const heroVideo = getHeroVideo(data, "mex-cantina-social");
  const green = branding?.primary_color || "#163D36";
  const coral = branding?.secondary_color || "#E15B4D";

  return (
    <main style={{ minHeight: "100vh", background: "#F3E4C9", color: "#17352F", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg={green} color="#fff" accent={coral} outline />

      <section style={{ minHeight: 650, color: "#fff", position: "relative", display: "flex", alignItems: "end", background: hero ? `linear-gradient(90deg,rgba(12,46,40,.84),rgba(12,46,40,.18)),url("${hero}") center/cover` : `linear-gradient(135deg,${green},#0D1E1A)`, overflow: "hidden" }}>
        {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .65 }} /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(12,46,40,.84),rgba(12,46,40,.20))" }} />
        <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", padding: "90px 28px 72px" }}>
          <div style={{ color: "#F2D3A2", fontSize: 11, fontWeight: 950, letterSpacing: 3 }}>TACOS · MARGARITAS · GOOD NIGHTS</div>
          <h1 style={{ maxWidth: 850, margin: "14px 0 14px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(64px,8vw,112px)", lineHeight: .92, fontWeight: 600 }}>
            {website.hero_headline || restaurant.name}
          </h1>
          <p style={{ maxWidth: 650, fontSize: 18, lineHeight: 1.7, color: "#F4F1EA" }}>{website.hero_subheadline || branding?.tagline || "Tacos, cocktails and a room that knows how to have a good time."}</p>
          <HeroActions data={data} primary={coral} secondary="#F0D6A8" darkText />
        </div>
      </section>

      <section style={{ background: coral, color: "#fff", padding: "22px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", fontWeight: 900 }}>
          <span>HAPPY HOUR</span><span>PRIVATE EVENTS</span><span>CRAFT MARGARITAS</span><span>DINNER + LATE NIGHT</span>
        </div>
      </section>

      <section id="story" style={{ background: "#F3E4C9" }}>
        <div className="ros-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 38, alignItems: "center" }}>
          {getThemeImage(data, "mex-cantina-social", 1) && <img src={getThemeImage(data, "mex-cantina-social", 1)} alt="" style={{ width: "100%", height: 480, objectFit: "cover", borderRadius: 180 }} />}
          <div>
            <div style={{ color: coral, fontSize: 11, fontWeight: 950, letterSpacing: 2.6 }}>EVERY NIGHT CAN BE TACO NIGHT</div>
            <h2 style={{ margin: "12px 0 18px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(44px,5vw,68px)", lineHeight: 1, fontWeight: 500 }}>{website.about_title || "Mexican Soul. Social Energy."}</h2>
            <p style={{ color: "#5E675F", fontSize: 17, lineHeight: 1.8 }}>{website.about_body || branding?.short_description || "Built for dinner dates, margarita nights, celebrations and the people you want at the table."}</p>
          </div>
        </div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background: green, color: "#fff", padding: "76px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: "#F0D6A8", fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>FROM THE KITCHEN</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(46px,5vw,72px)", fontWeight: 500 }}>Food Worth Gathering Around</h2>
            <FeaturedGrid data={data} themeKey="mex-cantina-social" cardBg="#214E45" text="#fff" muted="#D1DDD8" accent="#F0D6A8" imageHeight={220} radius={18} />
          </div>
        </section>
      )}

      <PhotoMosaic data={data} themeKey="mex-cantina-social" bg="#F3E4C9" cardBg="#fff4" rounded={26} />
      <VisitBand data={data} bg="#0C2823" text="#fff" accent="#F0D6A8" />
      <Footer data={data} bg="#071813" color="#B8C8C2" />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. COASTAL TACO                                                            */
/* -------------------------------------------------------------------------- */

function CoastalTaco({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const hero = getHeroImage(data, "mex-coastal-taco");
  const heroVideo = getHeroVideo(data, "mex-coastal-taco");
  const teal = branding?.primary_color || "#6B9C92";
  const peach = branding?.secondary_color || "#E39A64";

  return (
    <main style={{ minHeight: "100vh", background: "#F7F4EE", color: "#213831", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#FBF9F4" color="#213831" accent={teal} compact outline />

      <section style={{ minHeight: 720, display: "grid", placeItems: "center", textAlign: "center", padding: "80px 24px", color: "#fff", background: hero ? `linear-gradient(rgba(26,56,49,.30),rgba(26,56,49,.30)),url("${hero}") center/cover` : `linear-gradient(135deg,${teal},#B9D1CA)`, position: "relative", overflow: "hidden" }}>
        {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .65 }} /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(26,56,49,.30),rgba(26,56,49,.30))" }} />
        <div style={{ maxWidth: 900, position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: "lowercase" }}>tacos · bowls · good vibes</div>
          <h1 style={{ margin: "18px 0", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(64px,8vw,108px)", lineHeight: .95, fontWeight: 500 }}>
            {website.hero_headline || restaurant.name}
          </h1>
          <p style={{ maxWidth: 650, margin: "0 auto", fontSize: 18, lineHeight: 1.7 }}>{website.hero_subheadline || branding?.tagline || "A laid-back place for tacos, fresh flavors and good company."}</p>
          <div style={{ display: "flex", justifyContent: "center" }}><HeroActions data={data} primary={peach} secondary="#fff" darkText /></div>
        </div>
      </section>

      <section style={{ background: "#F7F4EE" }}>
        <div className="ros-three" style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 28px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[1,2,3].map((imageIndex, index) => { const src = getThemeImage(data, "mex-coastal-taco", imageIndex); return src ? <img key={imageIndex} src={src} alt="" style={{ width: "100%", height: index === 1 ? 390 : 330, objectFit: "cover", borderRadius: 180 }} /> : null; })}
        </div>
      </section>

      <section id="story" style={{ background: "#F7F4EE" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "66px 28px 80px", textAlign: "center" }}>
          <div style={{ color: peach, fontSize: 11, fontWeight: 900, letterSpacing: 2.4 }}>OUR LITTLE CORNER OF THE COAST</div>
          <h2 style={{ margin: "12px 0 18px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(44px,5vw,70px)", lineHeight: 1, fontWeight: 500 }}>{website.about_title || "Come As You Are."}</h2>
          <p style={{ color: "#718079", fontSize: 17, lineHeight: 1.85 }}>{website.about_body || branding?.short_description || "Fresh food, easy energy and a place that feels like vacation even when it’s just lunch."}</p>
        </div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background: "#DCE9E5", padding: "76px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: teal, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>FAVORITES</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(44px,5vw,68px)", fontWeight: 500 }}>Tacos + Not Tacos</h2>
            <FeaturedGrid data={data} themeKey="mex-coastal-taco" cardBg="#FBF9F4" text="#213831" muted="#708079" accent={peach} imageHeight={210} radius={22} />
          </div>
        </section>
      )}

      <VisitBand data={data} bg={teal} text="#fff" accent="#F4D6B6" />
      <Footer data={data} bg="#EDE5DA" color="#6F756E" />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. COSMIC NIGHT                                                            */
/* -------------------------------------------------------------------------- */

function CosmicNight({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const hero = getHeroImage(data, "mex-cosmic-night");
  const heroVideo = getHeroVideo(data, "mex-cosmic-night");
  const magenta = branding?.primary_color || "#A72D68";
  const gold = branding?.secondary_color || "#DDBB63";

  return (
    <main style={{ minHeight: "100vh", background: "#09090D", color: "#F6F1E7", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#08080B" color="#fff" accent={magenta} outline />

      <section style={{ minHeight: 760, position: "relative", display: "flex", alignItems: "end", overflow: "hidden", background: hero ? `linear-gradient(0deg,rgba(8,8,11,.86),rgba(8,8,11,.16)),url("${hero}") center/cover` : `radial-gradient(circle at 70% 30%,${magenta},#09090D 48%)` }}>
        {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .55 }} /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(8,8,11,.86),rgba(8,8,11,.22))" }} />
        <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", padding: "100px 28px 72px", position: "relative", zIndex: 2 }}>
          <div style={{ color: gold, fontSize: 11, fontWeight: 900, letterSpacing: 4 }}>DINNER · COCKTAILS · AFTER DARK</div>
          <h1 style={{ maxWidth: 900, margin: "16px 0", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(66px,9vw,126px)", lineHeight: .88, fontWeight: 500, letterSpacing: -2 }}>
            {website.hero_headline || restaurant.name}
          </h1>
          <p style={{ maxWidth: 640, color: "#E5DEE2", fontSize: 18, lineHeight: 1.7 }}>{website.hero_subheadline || branding?.tagline || "Modern Mexican cuisine, cocktails and atmosphere designed for the night."}</p>
          <HeroActions data={data} primary={magenta} secondary={gold} darkText />
        </div>
      </section>

      <section style={{ background: "#121219", borderTop: `1px solid ${gold}55`, borderBottom: `1px solid ${gold}55` }}>
        <div className="ros-four" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {["RESERVATIONS","PRIVATE EVENTS","COCKTAILS","LATE NIGHT"].map((x) => <div key={x} style={{ padding: "24px 18px", textAlign: "center", color: gold, fontSize: 10, letterSpacing: 2, fontWeight: 900 }}>{x}</div>)}
        </div>
      </section>

      <section id="story" style={{ background: "#09090D" }}>
        <div className="ros-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "90px 28px", display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ color: magenta, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>THE EXPERIENCE</div>
            <h2 style={{ margin: "12px 0 20px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(46px,5vw,74px)", lineHeight: .98, fontWeight: 500 }}>{website.about_title || "Come for Dinner. Stay for the Energy."}</h2>
            <p style={{ color: "#B7B0B6", fontSize: 17, lineHeight: 1.85 }}>{website.about_body || branding?.short_description || "An expressive dining room built around bold food, cocktails, music and a night worth remembering."}</p>
          </div>
          {getThemeImage(data, "mex-cosmic-night", 1) && <img src={getThemeImage(data, "mex-cosmic-night", 1)} alt="" style={{ width: "100%", height: 500, objectFit: "cover", border: `1px solid ${gold}66` }} />}
        </div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background: "#15151D", padding: "80px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: gold, fontSize: 11, fontWeight: 900, letterSpacing: 2.8 }}>FROM THE MENU</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(44px,5vw,70px)", fontWeight: 500 }}>A Little Dangerous. Very Delicious.</h2>
            <FeaturedGrid data={data} themeKey="mex-cosmic-night" cardBg="#0E0E13" text="#F6F1E7" muted="#AAA4AA" accent={gold} imageHeight={240} />
          </div>
        </section>
      )}

      <PhotoMosaic data={data} themeKey="mex-cosmic-night" bg="#09090D" cardBg="#15151D" rounded={6} />
      <VisitBand data={data} bg={magenta} text="#fff" accent={gold} />
      <Footer data={data} bg="#050506" color="#8C858B" />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. BIRRIA STREET                                                           */
/* -------------------------------------------------------------------------- */

function BirriaStreet({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const hero = getHeroImage(data, "mex-birria-street");
  const heroVideo = getHeroVideo(data, "mex-birria-street");
  const red = branding?.primary_color || "#D83D22";
  const orange = branding?.secondary_color || "#F49A2C";

  return (
    <main style={{ minHeight: "100vh", background: "#170B08", color: "#fff", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#120805" color="#fff" accent={orange} compact />

      <section className="ros-two" style={{ minHeight: 680, display: "grid", gridTemplateColumns: ".9fr 1.1fr", background: "#170B08" }}>
        <div style={{ padding: "78px 6vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ color: orange, fontSize: 11, fontWeight: 950, letterSpacing: 3 }}>DIP IT. CRUNCH IT. POST IT.</div>
          <h1 style={{ margin: "14px 0", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(70px,9vw,124px)", lineHeight: .82, textTransform: "uppercase", fontWeight: 400 }}>
            {website.hero_headline || restaurant.name}
          </h1>
          <p style={{ color: "#F2D6CB", fontSize: 18, lineHeight: 1.65 }}>{website.hero_subheadline || branding?.tagline || "Big flavor, crispy edges, molten cheese and no apologies."}</p>
          <HeroActions data={data} primary={red} secondary={orange} darkText />
        </div>
        <div style={{ minHeight: 680, position: "relative", background: hero ? `url("${hero}") center/cover` : `linear-gradient(145deg,${red},${orange})`, overflow: "hidden" }}>
          {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .82 }} /> : null}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(0,0,0,.16),rgba(0,0,0,.16))" }} />
          <div style={{ position: "absolute", left: 20, bottom: 20, background: "#fff", color: red, padding: "12px 16px", fontWeight: 950, transform: "rotate(-2deg)" }}>GET IT WHILE IT'S HOT</div>
        </div>
      </section>

      <section style={{ background: orange, color: "#160B08", padding: "18px 20px", overflow: "hidden" }}>
        <div style={{ fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: 28, letterSpacing: 2, textAlign: "center" }}>BIRRIA ◆ TACOS ◆ QUESO ◆ STREET FOOD ◆ CATERING ◆ BIRRIA ◆ TACOS ◆ QUESO</div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background: "#F4E3CE", color: "#23110C", padding: "78px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: red, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>THE FOOD IS THE CONTENT</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(52px,6vw,86px)", lineHeight: .9, textTransform: "uppercase", fontWeight: 400 }}>Built to Crave</h2>
            <FeaturedGrid data={data} themeKey="mex-birria-street" cardBg="#FFF7EC" text="#23110C" muted="#6B554B" accent={red} imageHeight={250} radius={12} />
          </div>
        </section>
      )}

      <section id="story" style={{ background: "#170B08" }}>
        <div className="ros-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "84px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          {getThemeImage(data, "mex-birria-street", 2) && <img src={getThemeImage(data, "mex-birria-street", 2)} alt="" style={{ width: "100%", height: 470, objectFit: "cover", borderRadius: 14 }} />}
          <div>
            <div style={{ color: orange, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>WHY PEOPLE COME BACK</div>
            <h2 style={{ margin: "10px 0 18px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(50px,6vw,82px)", lineHeight: .9, textTransform: "uppercase", fontWeight: 400 }}>{website.about_title || "Flavor That Hits Hard."}</h2>
            <p style={{ color: "#D9BFB4", fontSize: 17, lineHeight: 1.8 }}>{website.about_body || branding?.short_description || "Big portions. Bold flavor. Fast service. The kind of food people photograph before they take the first bite."}</p>
          </div>
        </div>
      </section>

      <PhotoMosaic data={data} themeKey="mex-birria-street" bg="#170B08" cardBg="#24100B" rounded={14} />
      <VisitBand data={data} bg={red} text="#fff" accent={orange} />
      <Footer data={data} bg="#080403" color="#A98C80" />
    </main>
  );
}


/* -------------------------------------------------------------------------- */
/* PIZZA / ITALIAN THEME FAMILY                                               */
/* -------------------------------------------------------------------------- */

function PizzaOttoEditorial({ data }: { data: SiteData }) {
  const { restaurant, branding, website, ordering } = data;
  const accent = branding?.primary_color || "#B6182B";
  const hero = getHeroImage(data, "pizza-otto-editorial") || getHeroImage(data, "pizza-red-brick");
  const heroVideo = website.hero_video_url || null;
  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ].filter(Boolean).join(", ");

  const navItems = [
    { label: "HOME", href: `/r/${restaurant.slug}` },
    { label: "MENU", href: `/r/${restaurant.slug}/food-menu` },
    { label: "OUR FOOD", href: "#food" },
    { label: "ABOUT", href: "#story" },
    { label: "OFFERS", href: `/r/${restaurant.slug}/offers` },
    ...(website.show_vip ? [{ label: "VIP CLUB", href: `/r/${restaurant.slug}/vip` }] : []),
    { label: "VISIT", href: "#visit" },
  ];

  const displayName = restaurant.name || "PIZZA";
  const heroWords = (website.hero_headline || displayName).trim();

  return (
    <main className="otto-shell">
      <SharedGlobal />
      <style jsx global>{`
        body {
          background: #050505 !important;
        }
        .otto-shell {
          min-height: 100vh;
          background: #050505;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
        }
        .otto-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 230px;
          background: #050505;
          z-index: 40;
          display: flex;
          flex-direction: column;
          padding: 28px 24px 24px;
          border-right: 1px solid rgba(255,255,255,.12);
        }
        .otto-main {
          margin-left: 230px;
          min-height: 100vh;
          background: #f2efe8;
          color: #111;
        }
        .otto-mobilebar {
          display: none;
        }
        .otto-wordmark {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 900;
          font-size: 34px;
          line-height: .9;
          letter-spacing: -1.7px;
          text-transform: uppercase;
        }
        .otto-nav {
          display: grid;
          gap: 14px;
          margin-top: 48px;
        }
        .otto-nav a {
          color: #fff;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
        .otto-nav a:hover {
          color: ${accent};
        }
        .otto-hero {
          min-height: 820px;
          position: relative;
          overflow: hidden;
          background: #222;
        }
        .otto-hero-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(1) contrast(1.08);
        }
        .otto-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.28)),
            linear-gradient(90deg, rgba(0,0,0,.2), transparent 40%);
        }
        .otto-hero-center {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 50px;
          text-align: center;
        }
        .otto-seal {
          width: min(610px, 70vw);
          aspect-ratio: 1;
          border: 18px solid #fff;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,.17);
          box-shadow: inset 0 0 0 6px rgba(255,255,255,.25);
          transform: rotate(-1.5deg);
        }
        .otto-seal-inner {
          width: 82%;
          height: 82%;
          border: 2px solid rgba(255,255,255,.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #fff;
          padding: 28px;
        }
        .otto-seal-small {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 7px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .otto-seal-title {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(54px, 8vw, 108px);
          font-weight: 900;
          line-height: .8;
          letter-spacing: -5px;
          text-transform: uppercase;
          max-width: 520px;
          overflow-wrap: anywhere;
        }
        .otto-seal-bottom {
          margin-top: 18px;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 9px;
        }
        .otto-promo {
          background: ${accent};
          color: #fff;
          padding: 16px 24px;
          text-align: center;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .otto-story {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          min-height: 620px;
        }
        .otto-story-copy {
          padding: 92px 7vw;
          background: #f2efe8;
          display: flex;
          justify-content: center;
          flex-direction: column;
        }
        .otto-eyebrow {
          color: ${accent};
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        .otto-story h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(54px, 6.7vw, 92px);
          line-height: .92;
          letter-spacing: -3px;
          margin: 13px 0 22px;
        }
        .otto-story p {
          color: #57534d;
          font-size: 18px;
          line-height: 1.8;
          max-width: 650px;
        }
        .otto-story-photo {
          min-height: 620px;
          width: 100%;
          object-fit: cover;
          filter: grayscale(.15);
        }
        .otto-marquee {
          overflow: hidden;
          white-space: nowrap;
          background: #050505;
          color: #fff;
          padding: 24px 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(26px,4vw,54px);
          font-weight: 900;
          letter-spacing: 2px;
        }
        .otto-marquee > div {
          display: inline-block;
          padding-left: 24px;
        }
        .otto-food {
          background: #f2efe8;
          padding: 90px 6vw;
        }
        .otto-food-head {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          align-items: end;
          margin-bottom: 34px;
        }
        .otto-food-head h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(56px,7vw,102px);
          line-height: .86;
          margin: 0;
          letter-spacing: -4px;
        }
        .otto-menu-link {
          border-bottom: 2px solid #111;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1.5px;
          padding-bottom: 6px;
        }
        .otto-grid {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          grid-template-rows: 330px 330px;
          gap: 12px;
        }
        .otto-grid img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .otto-grid img:first-child {
          grid-row: 1 / 3;
        }
        .otto-menu-strip {
          background: #050505;
          color: #fff;
          padding: 80px 6vw;
        }
        .otto-menu-items {
          max-width: 1100px;
          margin: 0 auto;
          border-top: 1px solid rgba(255,255,255,.24);
        }
        .otto-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          padding: 24px 0;
          border-bottom: 1px solid rgba(255,255,255,.18);
        }
        .otto-item-name {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(27px,3vw,40px);
          font-weight: 900;
          line-height: 1;
        }
        .otto-item-desc {
          color: #aaa;
          font-size: 13px;
          line-height: 1.6;
          margin-top: 8px;
          max-width: 680px;
        }
        .otto-item-price {
          color: ${accent};
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
          font-weight: 900;
        }
        .otto-visit {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: ${accent};
          color: #fff;
        }
        .otto-visit-copy {
          padding: 80px 6vw;
        }
        .otto-visit h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(50px,6vw,86px);
          line-height: .9;
          margin: 10px 0 22px;
        }
        .otto-visit-actions {
          padding: 80px 6vw;
          background: #111;
          display: flex;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
        }
        .otto-action {
          display: block;
          padding: 17px 20px;
          border: 1px solid rgba(255,255,255,.6);
          color: #fff;
          text-align: center;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1.5px;
        }
        .otto-action.primary {
          background: #fff;
          color: #111;
          border-color: #fff;
        }
        @media(max-width: 900px) {
          .otto-sidebar { display: none; }
          .otto-main { margin-left: 0; }
          .otto-mobilebar {
            display: flex;
            position: sticky;
            top: 0;
            z-index: 60;
            min-height: 70px;
            background: #050505;
            color: #fff;
            align-items: center;
            justify-content: space-between;
            padding: 12px 17px;
          }
          .otto-mobilebar .otto-wordmark {
            font-size: 22px;
            max-width: 220px;
          }
          .otto-mobile-order {
            background: ${accent};
            color: #fff;
            padding: 11px 12px;
            font-size: 9px;
            font-weight: 950;
          }
          .otto-hero { min-height: 650px; }
          .otto-seal { width: min(520px, 82vw); border-width: 12px; }
          .otto-seal-small { letter-spacing: 4px; font-size: 9px; }
          .otto-seal-title { letter-spacing: -3px; }
          .otto-seal-bottom { letter-spacing: 6px; font-size: 11px; }
          .otto-story,
          .otto-visit {
            grid-template-columns: 1fr;
          }
          .otto-story-photo { min-height: 420px; }
          .otto-grid {
            grid-template-columns: 1fr;
            grid-template-rows: 420px 280px 280px;
          }
          .otto-grid img:first-child { grid-row: auto; }
        }
        @media(max-width: 620px) {
          .otto-hero { min-height: 560px; }
          .otto-hero-center { padding: 18px; }
          .otto-seal { width: 88vw; border-width: 9px; }
          .otto-seal-inner { padding: 18px; }
          .otto-seal-title { font-size: clamp(42px,14vw,72px); }
          .otto-promo { font-size: 15px; }
          .otto-story-copy,
          .otto-food,
          .otto-menu-strip,
          .otto-visit-copy,
          .otto-visit-actions {
            padding-left: 22px;
            padding-right: 22px;
          }
          .otto-food-head {
            display: block;
          }
          .otto-menu-link {
            display: inline-block;
            margin-top: 18px;
          }
          .otto-grid {
            grid-template-rows: 310px 220px 220px;
          }
        }
      `}</style>

      <aside className="otto-sidebar">
        <a href={`/r/${restaurant.slug}`}>
          {website.logo_url ? (
            <img
              src={website.logo_url}
              alt={restaurant.name}
              style={{ width: "100%", maxHeight: 100, objectFit: "contain", filter: "grayscale(1) brightness(0) invert(1)" }}
            />
          ) : (
            <div className="otto-wordmark">{displayName}</div>
          )}
        </a>

        <nav className="otto-nav">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <div style={{ marginTop: "auto" }}>
          {ordering?.online_ordering_url && (
            <a
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                marginBottom: 20,
                color: "#fff",
                fontFamily: 'Georgia,"Times New Roman",serif',
                fontSize: 18,
                fontWeight: 900,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              ORDER ONLINE
            </a>
          )}
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} style={{ color: "#aaa", fontSize: 11, letterSpacing: 1 }}>
              {restaurant.phone}
            </a>
          )}
          <div style={{ color: "#666", fontSize: 9, lineHeight: 1.5, marginTop: 10 }}>
            {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ""}
          </div>
        </div>
      </aside>

      <div className="otto-mobilebar">
        <div className="otto-wordmark">{displayName}</div>
        {ordering?.online_ordering_url && (
          <a className="otto-mobile-order" href={ordering.online_ordering_url} target="_blank" rel="noreferrer">
            ORDER
          </a>
        )}
      </div>

      <div className="otto-main">
        <div className="otto-promo">
          {branding?.tagline || "PIZZA. PEOPLE. PLACE."}
        </div>

        <section className="otto-hero">
          {heroVideo ? (
            <video className="otto-hero-media" src={heroVideo} autoPlay muted loop playsInline />
          ) : hero ? (
            <img className="otto-hero-media" src={hero} alt="" />
          ) : null}
          <div className="otto-hero-overlay" />

          <div className="otto-hero-center">
            <div className="otto-seal">
              <div className="otto-seal-inner">
                <div className="otto-seal-small">
                  {restaurant.city || "LOCAL"}{restaurant.state ? `, ${restaurant.state}` : ""}
                </div>
                <div className="otto-seal-title">{heroWords}</div>
                <div className="otto-seal-bottom">PIZZA</div>
              </div>
            </div>
          </div>
        </section>

        <div className="otto-marquee">
          <div>
            PIZZA ◆ FAMILY ◆ NEIGHBORHOOD ◆ LATE NIGHTS ◆ GOOD PEOPLE ◆ GOOD PIZZA ◆
          </div>
        </div>

        <section className="otto-story" id="story">
          <div className="otto-story-copy">
            <div className="otto-eyebrow">OUR STORY</div>
            <h2>{website.about_title || "Pizza With A Point Of View."}</h2>
            <p>
              {website.about_body ||
                branding?.short_description ||
                "We make the kind of pizza that turns a neighborhood spot into your spot. Good dough, bold flavor, no unnecessary nonsense."}
            </p>
          </div>
          <img
            className="otto-story-photo"
            src={getThemeImage(data, "pizza-otto-editorial", 1) || getThemeImage(data, "pizza-red-brick", 1)}
            alt=""
          />
        </section>

        <section className="otto-food" id="food">
          <div className="otto-food-head">
            <div>
              <div className="otto-eyebrow">THE FOOD</div>
              <h2>Made To Be<br />Remembered.</h2>
            </div>
            <a className="otto-menu-link" href={`/r/${restaurant.slug}/food-menu`}>
              VIEW THE FULL MENU →
            </a>
          </div>

          <div className="otto-grid">
            <img src={getThemeImage(data, "pizza-otto-editorial", 0) || hero || ""} alt="" />
            <img src={getThemeImage(data, "pizza-otto-editorial", 2)} alt="" />
            <img src={getThemeImage(data, "pizza-otto-editorial", 3)} alt="" />
          </div>
        </section>

        {data.items.length > 0 && (
          <section className="otto-menu-strip">
            <div className="otto-eyebrow">HOUSE FAVORITES</div>
            <div style={{ maxWidth: 1100, margin: "12px auto 34px" }}>
              <h2 style={{
                margin: 0,
                fontFamily: 'Georgia,"Times New Roman",serif',
                fontSize: "clamp(50px,6vw,82px)",
                lineHeight: .9,
                letterSpacing: -3,
              }}>
                What We&apos;re Known For.
              </h2>
            </div>
            <div className="otto-menu-items">
              {data.items.slice(0, 6).map((item) => (
                <div className="otto-item" key={item.id}>
                  <div>
                    <div className="otto-item-name">{item.name}</div>
                    {item.description && <div className="otto-item-desc">{item.description}</div>}
                  </div>
                  {item.price !== null && (
                    <div className="otto-item-price">${Number(item.price).toFixed(2)}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="otto-visit" id="visit">
          <div className="otto-visit-copy">
            <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: 4 }}>COME FIND US</div>
            <h2>{restaurant.name}</h2>
            <p style={{ maxWidth: 540, lineHeight: 1.75, fontSize: 16 }}>
              {address || "Your neighborhood pizza place."}
            </p>
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} style={{ fontWeight: 900, textDecoration: "underline" }}>
                {restaurant.phone}
              </a>
            )}
          </div>

          <div className="otto-visit-actions">
            {ordering?.online_ordering_url && (
              <a className="otto-action primary" href={ordering.online_ordering_url} target="_blank" rel="noreferrer">
                {website.primary_cta_label || "ORDER ONLINE"}
              </a>
            )}
            <a className="otto-action" href={`/r/${restaurant.slug}/food-menu`}>
              {website.secondary_cta_label || "VIEW MENU"}
            </a>
            {ordering?.catering_email && (
              <a className="otto-action" href={`mailto:${ordering.catering_email}`}>
                CATERING / EVENTS
              </a>
            )}
          </div>
        </section>

        <footer style={{
          background: "#050505",
          color: "#777",
          padding: "30px 6vw",
          fontSize: 10,
          letterSpacing: 1.1,
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <span>© {new Date().getFullYear()} {restaurant.name}</span>
          <span>POWERED BY RESTAURANT OS</span>
        </footer>
      </div>
    </main>
  );
}

function PizzaRamuntosHeritage({ data }: { data: SiteData }) {
  const { restaurant, branding, website, ordering } = data;

  const brick = branding?.primary_color || "#7C201A";
  const cream = branding?.secondary_color || "#E8D9BA";
  const green = "#1F3529";
  const charcoal = "#211B18";
  const hero =
    getHeroImage(data, "pizza-ramuntos-heritage") ||
    getHeroImage(data, "pizza-napoli-modern");
  const heroVideo = website.hero_video_url || null;

  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const featured = data.items.slice(0, 6);

  return (
    <main className="heritage-shell">
      <SharedGlobal />

      <style jsx global>{`
        body {
          background: #f4ead8 !important;
        }

        .heritage-shell {
          min-height: 100vh;
          background: #f4ead8;
          color: #211b18;
          font-family: Arial, Helvetica, sans-serif;
        }

        .heritage-topbar {
          background: ${green};
          color: #fff;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 24px;
          text-align: center;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .heritage-header {
          background: #f4ead8;
          border-bottom: 1px solid rgba(33,27,24,.15);
          padding: 18px 26px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .heritage-left,
        .heritage-right {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }

        .heritage-right {
          justify-content: flex-end;
        }

        .heritage-logo {
          text-align: center;
          color: ${brick};
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          font-weight: 900;
          line-height: .9;
          letter-spacing: -1px;
        }

        .heritage-logo small {
          display: block;
          margin-top: 6px;
          color: #7d6f61;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          letter-spacing: 3px;
          font-weight: 900;
        }

        .heritage-order {
          background: ${brick};
          color: #fff;
          padding: 12px 15px;
          border-radius: 2px;
        }

        .heritage-hero {
          position: relative;
          min-height: 720px;
          overflow: hidden;
          display: flex;
          align-items: center;
          background: ${charcoal};
        }

        .heritage-hero-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heritage-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(24,18,15,.86) 0%, rgba(24,18,15,.52) 45%, rgba(24,18,15,.18) 72%, rgba(24,18,15,.24) 100%);
        }

        .heritage-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 80px 42px;
          color: #fff;
        }

        .heritage-kicker {
          color: ${cream};
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .heritage-hero h1 {
          max-width: 860px;
          margin: 14px 0 18px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(64px, 8vw, 116px);
          line-height: .88;
          letter-spacing: -4px;
          font-weight: 900;
        }

        .heritage-hero p {
          max-width: 620px;
          color: #efe6dc;
          font-size: 18px;
          line-height: 1.7;
        }

        .heritage-cta-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .heritage-primary,
        .heritage-secondary {
          display: inline-block;
          padding: 15px 18px;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }

        .heritage-primary {
          background: ${brick};
          color: #fff;
        }

        .heritage-secondary {
          border: 1px solid rgba(255,255,255,.65);
          color: #fff;
        }

        .heritage-ribbon {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          background: ${brick};
          color: #fff;
        }

        .heritage-ribbon > div {
          padding: 24px 18px;
          text-align: center;
          border-right: 1px solid rgba(255,255,255,.18);
        }

        .heritage-ribbon strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
        }

        .heritage-ribbon span {
          display: block;
          margin-top: 5px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: #f5d9d5;
        }

        .heritage-story {
          max-width: 1240px;
          margin: 0 auto;
          padding: 92px 30px;
          display: grid;
          grid-template-columns: .95fr 1.05fr;
          gap: 52px;
          align-items: center;
        }

        .heritage-frame {
          position: relative;
          padding: 18px;
          background: #fff;
          box-shadow: 0 16px 45px rgba(36,25,18,.14);
          transform: rotate(-1deg);
        }

        .heritage-frame img {
          width: 100%;
          height: 560px;
          object-fit: cover;
          display: block;
        }

        .heritage-story-copy h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 5.7vw, 78px);
          line-height: .95;
          letter-spacing: -2.5px;
          margin: 12px 0 20px;
        }

        .heritage-story-copy p {
          color: #6d6258;
          font-size: 17px;
          line-height: 1.85;
          max-width: 620px;
        }

        .heritage-stamp {
          display: inline-block;
          margin-top: 24px;
          border: 2px solid ${brick};
          color: ${brick};
          border-radius: 50%;
          width: 126px;
          height: 126px;
          padding: 24px 14px;
          text-align: center;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1.7px;
          line-height: 1.6;
          transform: rotate(7deg);
        }

        .heritage-menu {
          background: ${charcoal};
          color: #fff;
          padding: 88px 28px;
        }

        .heritage-menu-inner {
          max-width: 1180px;
          margin: 0 auto;
        }

        .heritage-menu-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 34px;
        }

        .heritage-menu h2 {
          margin: 9px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(50px, 6vw, 82px);
          line-height: .9;
        }

        .heritage-menu-grid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          border-top: 1px solid rgba(255,255,255,.18);
        }

        .heritage-menu-item {
          padding: 24px 22px 24px 0;
          border-bottom: 1px solid rgba(255,255,255,.16);
        }

        .heritage-menu-item:nth-child(odd) {
          border-right: 1px solid rgba(255,255,255,.16);
          padding-right: 30px;
        }

        .heritage-menu-item:nth-child(even) {
          padding-left: 30px;
        }

        .heritage-menu-name {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
          font-weight: 900;
        }

        .heritage-menu-price {
          color: ${cream};
          white-space: nowrap;
        }

        .heritage-menu-desc {
          margin-top: 8px;
          color: #afa8a1;
          font-size: 13px;
          line-height: 1.65;
        }

        .heritage-proof {
          background: ${green};
          color: #fff;
          padding: 82px 28px;
        }

        .heritage-proof-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          gap: 52px;
          align-items: center;
        }

        .heritage-proof h2 {
          margin: 8px 0 16px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(46px, 5vw, 72px);
          line-height: .95;
        }

        .heritage-proof p {
          color: #cfddd5;
          font-size: 16px;
          line-height: 1.8;
        }

        .heritage-proof-cards {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 10px;
        }

        .heritage-proof-card {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.14);
          padding: 24px;
          min-height: 150px;
        }

        .heritage-proof-card strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .heritage-proof-card span {
          color: #c5d3cb;
          font-size: 12px;
          line-height: 1.55;
        }

        .heritage-location {
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          background: #f4ead8;
        }

        .heritage-location-photo {
          min-height: 520px;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heritage-location-copy {
          padding: 70px 6vw;
          display: flex;
          justify-content: center;
          flex-direction: column;
        }

        .heritage-location-copy h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 5.6vw, 76px);
          line-height: .95;
          margin: 10px 0 18px;
        }

        .heritage-detail {
          margin-top: 10px;
          color: #6d6258;
          font-size: 14px;
          line-height: 1.7;
        }

        .heritage-footer {
          background: #120f0d;
          color: #9c938b;
          padding: 36px 28px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        @media(max-width: 900px) {
          .heritage-header {
            grid-template-columns: 1fr auto;
          }

          .heritage-left {
            display: none;
          }

          .heritage-logo {
            text-align: left;
          }

          .heritage-ribbon {
            grid-template-columns: repeat(2,1fr);
          }

          .heritage-story,
          .heritage-proof-inner,
          .heritage-location {
            grid-template-columns: 1fr;
          }

          .heritage-frame img {
            height: 430px;
          }

          .heritage-location-photo {
            min-height: 420px;
          }
        }

        @media(max-width: 640px) {
          .heritage-header {
            padding: 14px 16px;
          }

          .heritage-logo {
            font-size: 24px;
          }

          .heritage-right a:not(.heritage-order) {
            display: none;
          }

          .heritage-hero {
            min-height: 620px;
          }

          .heritage-hero-content {
            padding: 70px 22px;
          }

          .heritage-ribbon {
            grid-template-columns: 1fr 1fr;
          }

          .heritage-ribbon strong {
            font-size: 18px;
          }

          .heritage-story {
            padding: 70px 22px;
          }

          .heritage-menu-grid {
            grid-template-columns: 1fr;
          }

          .heritage-menu-item:nth-child(odd),
          .heritage-menu-item:nth-child(even) {
            border-right: 0;
            padding-left: 0;
            padding-right: 0;
          }

          .heritage-menu-head {
            display: block;
          }

          .heritage-menu-head a {
            display: inline-block;
            margin-top: 16px;
          }

          .heritage-proof-cards {
            grid-template-columns: 1fr;
          }

          .heritage-location-copy {
            padding: 60px 22px;
          }
        }
      `}</style>

      <div className="heritage-topbar">
        {branding?.tagline || "NEW YORK STYLE · BRICK OVEN · FAMILY OWNED"}
      </div>

      <header className="heritage-header">
        <nav className="heritage-left">
          <a href={`/r/${restaurant.slug}/food-menu`}>Menu</a>
          <a href="#story">Our Story</a>
          <a href="#visit">Locations</a>
        </nav>

        <a href={`/r/${restaurant.slug}`} className="heritage-logo">
          {website.logo_url ? (
            <img
              src={website.logo_url}
              alt={restaurant.name}
              style={{ maxWidth: 220, maxHeight: 72, objectFit: "contain" }}
            />
          ) : (
            <>
              {restaurant.name}
              <small>BRICK OVEN PIZZERIA</small>
            </>
          )}
        </a>

        <nav className="heritage-right">
          {restaurant.phone && <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>}
          {ordering?.online_ordering_url && (
            <a
              className="heritage-order"
              href={ordering.online_ordering_url}
              target="_blank"
              rel="noreferrer"
            >
              Order Online
            </a>
          )}
        </nav>
      </header>

      <section className="heritage-hero">
        {heroVideo ? (
          <video
            className="heritage-hero-media"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : hero ? (
          <img className="heritage-hero-media" src={hero} alt="" />
        ) : null}

        <div className="heritage-hero-overlay" />

        <div className="heritage-hero-content">
          <div className="heritage-kicker">BRICK OVEN TRADITION</div>
          <h1>{website.hero_headline || restaurant.name}</h1>
          <p>
            {website.hero_subheadline ||
              branding?.short_description ||
              "A neighborhood pizzeria built on hand-tossed dough, hot ovens, generous portions and the kind of hospitality that keeps families coming back."}
          </p>

          <div className="heritage-cta-row">
            {ordering?.online_ordering_url && (
              <a
                className="heritage-primary"
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
              >
                {website.primary_cta_label || "ORDER ONLINE"}
              </a>
            )}

            <a className="heritage-secondary" href={`/r/${restaurant.slug}/food-menu`}>
              {website.secondary_cta_label || "VIEW MENU"}
            </a>
          </div>
        </div>
      </section>

      <section className="heritage-ribbon">
        <div>
          <strong>Brick Oven</strong>
          <span>High-Heat Pizza</span>
        </div>
        <div>
          <strong>Family Style</strong>
          <span>Built For The Table</span>
        </div>
        <div>
          <strong>Local Favorite</strong>
          <span>Neighborhood Driven</span>
        </div>
        <div>
          <strong>Catering</strong>
          <span>Parties & Events</span>
        </div>
      </section>

      <section className="heritage-story" id="story">
        <div className="heritage-frame">
          <img
            src={
              getThemeImage(data, "pizza-ramuntos-heritage", 1) ||
              getThemeImage(data, "pizza-napoli-modern", 1)
            }
            alt=""
          />
        </div>

        <div className="heritage-story-copy">
          <div className="heritage-kicker" style={{ color: brick }}>
            FAMILY. DOUGH. FIRE.
          </div>
          <h2>{website.about_title || "Built The Old-Fashioned Way."}</h2>
          <p>
            {website.about_body ||
              branding?.short_description ||
              "We believe the best pizza places feel like they have always been there. The dough gets better with time, the oven stays hot, and the regulars become part of the family."}
          </p>

          <div className="heritage-stamp">
            FAMILY OWNED
            <br />
            BRICK OVEN
            <br />
            PIZZA
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="heritage-menu">
          <div className="heritage-menu-inner">
            <div className="heritage-menu-head">
              <div>
                <div className="heritage-kicker">HOUSE FAVORITES</div>
                <h2>What We&apos;re Known For.</h2>
              </div>

              <a
                href={`/r/${restaurant.slug}/food-menu`}
                style={{
                  color: cream,
                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${cream}`,
                  paddingBottom: 5,
                }}
              >
                Full Menu →
              </a>
            </div>

            <div className="heritage-menu-grid">
              {featured.map((item) => (
                <article className="heritage-menu-item" key={item.id}>
                  <div className="heritage-menu-name">
                    <span>{item.name}</span>
                    {item.price !== null && (
                      <span className="heritage-menu-price">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <div className="heritage-menu-desc">{item.description}</div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="heritage-proof">
        <div className="heritage-proof-inner">
          <div>
            <div className="heritage-kicker">MORE THAN PIZZA</div>
            <h2>A Place People Come Back To.</h2>
            <p>
              This layout is built for the established neighborhood restaurant:
              dine-in, takeout, catering, families, local events and long-term community loyalty.
            </p>
          </div>

          <div className="heritage-proof-cards">
            <div className="heritage-proof-card">
              <strong>Catering</strong>
              <span>Make office lunches, family parties and local events an obvious revenue channel.</span>
            </div>

            <div className="heritage-proof-card">
              <strong>Community</strong>
              <span>Perfect for highlighting schools, teams, fundraisers and neighborhood partnerships.</span>
            </div>

            <div className="heritage-proof-card">
              <strong>Family Meals</strong>
              <span>Position large pies, pasta, salads and group meals as the easy dinner answer.</span>
            </div>

            <div className="heritage-proof-card">
              <strong>Local Loyalty</strong>
              <span>VIP offers and restaurant campaigns plug directly into the Restaurant OS growth engine.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="heritage-location" id="visit">
        <img
          className="heritage-location-photo"
          src={
            getThemeImage(data, "pizza-ramuntos-heritage", 2) ||
            getThemeImage(data, "pizza-napoli-modern", 2)
          }
          alt=""
        />

        <div className="heritage-location-copy">
          <div className="heritage-kicker" style={{ color: brick }}>
            VISIT US
          </div>
          <h2>{restaurant.name}</h2>

          {address && <div className="heritage-detail">{address}</div>}
          {restaurant.phone && (
            <div className="heritage-detail">
              <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
            </div>
          )}

          <div className="heritage-cta-row" style={{ marginTop: 24 }}>
            {ordering?.online_ordering_url && (
              <a
                className="heritage-primary"
                href={ordering.online_ordering_url}
                target="_blank"
                rel="noreferrer"
              >
                ORDER NOW
              </a>
            )}

            {ordering?.catering_email && (
              <a
                href={`mailto:${ordering.catering_email}`}
                style={{
                  color: brick,
                  border: `1px solid ${brick}`,
                  padding: "15px 18px",
                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: 1.3,
                  textTransform: "uppercase",
                }}
              >
                CATERING
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="heritage-footer">
        <span>© {new Date().getFullYear()} {restaurant.name}</span>
        <span>Restaurant OS · Independent Restaurant Growth Platform</span>
      </footer>
    </main>
  );
}

function PizzaSliceShop({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const yellow = branding?.primary_color || "#F4C542";
  const red = branding?.secondary_color || "#E8472B";
  const hero = getHeroImage(data, "pizza-slice-shop");
  const heroVideo = getHeroVideo(data, "pizza-slice-shop");

  return (
    <main style={{ minHeight:"100vh", background:"#111", color:"#fff", fontFamily:"Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#000" color="#fff" accent={red} compact />
      <section className="ros-two" style={{ minHeight:700, display:"grid", gridTemplateColumns:"1fr 1fr", background:"#111" }}>
        <div style={{ padding:"74px 6vw", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <div style={{ color:yellow, fontSize:11, fontWeight:950, letterSpacing:3 }}>BIG SLICES · FAST ORDERS · LATE NIGHTS</div>
          <h1 style={{ margin:"14px 0", fontFamily:'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize:"clamp(76px,10vw,138px)", lineHeight:.78, textTransform:"uppercase", fontWeight:400 }}>{website.hero_headline || restaurant.name}</h1>
          <p style={{ maxWidth:600, color:"#DDD", fontSize:18, lineHeight:1.65 }}>{website.hero_subheadline || branding?.tagline || "Grab a slice. Grab the whole pie. Keep moving."}</p>
          <HeroActions data={data} primary={red} secondary={yellow} darkText />
        </div>
        <div style={{ position:"relative", minHeight:700, overflow:"hidden", background:hero ? `url("${hero}") center/cover` : red }}>
          {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} /> : null}
          <div style={{ position:"absolute", inset:0, boxShadow:"inset 0 0 0 12px #F4C542" }} />
          <div style={{ position:"absolute", left:22, bottom:22, background:red, color:"#fff", padding:"12px 16px", transform:"rotate(-2deg)", fontWeight:950 }}>SLICE OF THE DAY</div>
        </div>
      </section>

      <section style={{ background:yellow, color:"#111", padding:"18px 20px", overflow:"hidden" }}>
        <div style={{ fontFamily:'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize:28, letterSpacing:2, textAlign:"center" }}>SLICES ◆ WHOLE PIES ◆ WINGS ◆ GARLIC KNOTS ◆ DELIVERY ◆ SLICES ◆ WHOLE PIES</div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background:"#F4F0E8", color:"#111", padding:"78px 26px" }}>
          <div style={{ maxWidth:1180, margin:"0 auto" }}>
            <div style={{ color:red, fontSize:11, fontWeight:950, letterSpacing:2.4 }}>THE LINEUP</div>
            <h2 style={{ margin:"10px 0 30px", fontFamily:'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize:"clamp(54px,7vw,92px)", textTransform:"uppercase", fontWeight:400 }}>Pick Your Poison</h2>
            <FeaturedGrid data={data} themeKey="pizza-slice-shop" cardBg="#fff" text="#111" muted="#666" accent={red} imageHeight={255} radius={0} />
          </div>
        </section>
      )}

      <section id="story" style={{ background:"#111" }}>
        <div className="ros-two" style={{ maxWidth:1180, margin:"0 auto", padding:"84px 28px", display:"grid", gridTemplateColumns:"1.1fr .9fr", gap:44, alignItems:"center" }}>
          <img src={getThemeImage(data,"pizza-slice-shop",2)} alt="" style={{ width:"100%", height:470, objectFit:"cover" }} />
          <div>
            <div style={{ color:yellow, fontSize:11, fontWeight:950, letterSpacing:2.4 }}>NO BORING PIZZA</div>
            <h2 style={{ margin:"10px 0 18px", fontFamily:'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize:"clamp(52px,6vw,84px)", lineHeight:.88, textTransform:"uppercase", fontWeight:400 }}>{website.about_title || "Built For The Craving."}</h2>
            <p style={{ color:"#BEBEBE", fontSize:17, lineHeight:1.8 }}>{website.about_body || branding?.short_description || "Fast, hot, oversized and exactly what you wanted when you walked in."}</p>
          </div>
        </div>
      </section>

      <VisitBand data={data} bg={red} text="#fff" accent={yellow} />
      <Footer data={data} bg="#000" color="#888" />
    </main>
  );
}

function PizzaWoodfire({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const rust = branding?.primary_color || "#C56A3A";
  const sand = branding?.secondary_color || "#E7D7BC";
  const hero = getHeroImage(data, "pizza-woodfire");
  const heroVideo = getHeroVideo(data, "pizza-woodfire");

  return (
    <main style={{ minHeight:"100vh", background:"#E9DDC8", color:"#2B211A", fontFamily:"Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#2A211B" color="#fff" accent={rust} compact />
      <section style={{ minHeight:740, position:"relative", display:"flex", alignItems:"center", color:"#fff", overflow:"hidden", background:hero ? `url("${hero}") center/cover` : "#2A211B" }}>
        {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} /> : null}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,rgba(30,22,17,.88),rgba(30,22,17,.18))" }} />
        <div style={{ maxWidth:1180, width:"100%", margin:"0 auto", padding:"90px 28px", position:"relative", zIndex:2 }}>
          <div style={{ color:sand, fontSize:11, fontWeight:900, letterSpacing:3 }}>FERMENTED DOUGH · LIVE FIRE · SEASONAL INGREDIENTS</div>
          <h1 style={{ maxWidth:820, margin:"14px 0", fontFamily:'Georgia,"Times New Roman",serif', fontSize:"clamp(62px,8vw,108px)", lineHeight:.92, fontWeight:500 }}>{website.hero_headline || restaurant.name}</h1>
          <p style={{ maxWidth:640, color:"#EFE6D8", fontSize:18, lineHeight:1.7 }}>{website.hero_subheadline || branding?.tagline || "Fire, flour, time and a few really good ingredients."}</p>
          <HeroActions data={data} primary={rust} secondary={sand} darkText />
        </div>
      </section>

      <section id="story" style={{ background:"#E9DDC8" }}>
        <div className="ros-two" style={{ maxWidth:1180, margin:"0 auto", padding:"88px 28px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
          <div>
            <div style={{ color:rust, fontSize:11, fontWeight:950, letterSpacing:2.4 }}>THE OVEN IS THE HEART</div>
            <h2 style={{ margin:"12px 0 18px", fontFamily:'Georgia,"Times New Roman",serif', fontSize:"clamp(46px,5vw,72px)", lineHeight:.98, fontWeight:500 }}>{website.about_title || "Made By Fire."}</h2>
            <p style={{ color:"#6C5A4B", fontSize:17, lineHeight:1.85 }}>{website.about_body || branding?.short_description || "Long-fermented dough, blistered crust and ingredients chosen because they belong together."}</p>
          </div>
          <img src={getThemeImage(data,"pizza-woodfire",1)} alt="" style={{ width:"100%", height:500, objectFit:"cover", borderRadius:220 }} />
        </div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background:"#2A211B", color:"#fff", padding:"82px 26px" }}>
          <div style={{ maxWidth:1180, margin:"0 auto" }}>
            <div style={{ color:sand, fontSize:11, fontWeight:900, letterSpacing:2.6 }}>FROM THE OVEN</div>
            <h2 style={{ margin:"10px 0 30px", fontFamily:'Georgia,"Times New Roman",serif', fontSize:"clamp(46px,5vw,72px)", fontWeight:500 }}>Pies, Plates & Fire</h2>
            <FeaturedGrid data={data} themeKey="pizza-woodfire" cardBg="#3A2D24" text="#fff" muted="#D2C4B4" accent={sand} imageHeight={235} radius={14} />
          </div>
        </section>
      )}

      <PhotoMosaic data={data} themeKey="pizza-woodfire" bg="#E9DDC8" cardBg="#fff" rounded={14} />
      <VisitBand data={data} bg={rust} text="#fff" accent={sand} />
      <Footer data={data} bg="#1A1410" color="#A99989" />
    </main>
  );
}

function PizzaSupperClub({ data }: { data: SiteData }) {
  const { restaurant, branding, website } = data;
  const green = branding?.primary_color || "#102B24";
  const wine = branding?.secondary_color || "#7A2635";
  const gold = "#E7D7B4";
  const hero = getHeroImage(data, "pizza-supper-club");
  const heroVideo = getHeroVideo(data, "pizza-supper-club");

  return (
    <main style={{ minHeight:"100vh", background:"#0B1E19", color:"#F6EFE1", fontFamily:"Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#081712" color="#fff" accent={wine} outline />
      <section style={{ minHeight:780, position:"relative", display:"flex", alignItems:"end", overflow:"hidden", background:hero ? `url("${hero}") center/cover` : green }}>
        {heroVideo ? <video autoPlay muted loop playsInline src={heroVideo} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.7 }} /> : null}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(5,19,15,.92),rgba(5,19,15,.18))" }} />
        <div style={{ maxWidth:1180, width:"100%", margin:"0 auto", padding:"100px 28px 76px", position:"relative", zIndex:2 }}>
          <div style={{ color:gold, fontSize:11, fontWeight:900, letterSpacing:3.5 }}>ITALIAN DINNER · WINE · LATE EVENINGS</div>
          <h1 style={{ maxWidth:920, margin:"16px 0", fontFamily:'Georgia,"Times New Roman",serif', fontSize:"clamp(66px,9vw,118px)", lineHeight:.9, fontWeight:500 }}>{website.hero_headline || restaurant.name}</h1>
          <p style={{ maxWidth:640, color:"#EEE5D6", fontSize:18, lineHeight:1.7 }}>{website.hero_subheadline || branding?.tagline || "Pizza, pasta, wine and a room worth staying in."}</p>
          <HeroActions data={data} primary={wine} secondary={gold} darkText />
        </div>
      </section>

      <section style={{ background:wine, color:"#fff" }}>
        <div className="ros-four" style={{ maxWidth:1180, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {["DINNER","WINE","PRIVATE EVENTS","RESERVATIONS"].map((x) => <div key={x} style={{ padding:"24px 18px", textAlign:"center", fontSize:10, fontWeight:900, letterSpacing:2 }}>{x}</div>)}
        </div>
      </section>

      <section id="story" style={{ background:"#0B1E19" }}>
        <div className="ros-two" style={{ maxWidth:1180, margin:"0 auto", padding:"92px 28px", display:"grid", gridTemplateColumns:"1.15fr .85fr", gap:50, alignItems:"center" }}>
          <div>
            <div style={{ color:gold, fontSize:11, fontWeight:900, letterSpacing:2.8 }}>AT THE TABLE</div>
            <h2 style={{ margin:"12px 0 20px", fontFamily:'Georgia,"Times New Roman",serif', fontSize:"clamp(46px,5vw,74px)", lineHeight:.98, fontWeight:500 }}>{website.about_title || "An Italian Night Out."}</h2>
            <p style={{ color:"#B8C6C0", fontSize:17, lineHeight:1.85 }}>{website.about_body || branding?.short_description || "A little candlelight, a good bottle, handmade food and no reason to rush."}</p>
          </div>
          <img src={getThemeImage(data,"pizza-supper-club",1)} alt="" style={{ width:"100%", height:520, objectFit:"cover", border:`1px solid ${gold}55` }} />
        </div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background:"#132A24", padding:"82px 26px" }}>
          <div style={{ maxWidth:1180, margin:"0 auto" }}>
            <div style={{ color:gold, fontSize:11, fontWeight:900, letterSpacing:2.8 }}>DINNER MENU</div>
            <h2 style={{ margin:"10px 0 30px", fontFamily:'Georgia,"Times New Roman",serif', fontSize:"clamp(46px,5vw,72px)", fontWeight:500 }}>From Our Kitchen</h2>
            <FeaturedGrid data={data} themeKey="pizza-supper-club" cardBg="#0C1D18" text="#F6EFE1" muted="#AAB9B3" accent={gold} imageHeight={240} radius={0} />
          </div>
        </section>
      )}

      <PhotoMosaic data={data} themeKey="pizza-supper-club" bg="#0B1E19" cardBg="#132A24" rounded={0} />
      <VisitBand data={data} bg={wine} text="#fff" accent={gold} />
      <Footer data={data} bg="#06110E" color="#7D918A" />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* STANDARD FALLBACKS FOR OTHER TOP CATEGORIES                                */
/* -------------------------------------------------------------------------- */

function StandardFallback({ data, themeKey }: { data: SiteData; themeKey: string }) {
  const configs: Record<string, { bg:string; surface:string; text:string; muted:string; nav:string; accent:string; accent2:string; heading:string; radius:number }> = {
    "pizza-italian": { bg:"#F3E8D5", surface:"#FFF9EF", text:"#1E201A", muted:"#665F53", nav:"#1B2D22", accent:"#9D2F27", accent2:"#D8B98B", heading:'Georgia,"Times New Roman",serif', radius:0 },
    "bbq-smokehouse": { bg:"#1D1713", surface:"#2A211B", text:"#F2E4CE", muted:"#C8B69E", nav:"#0D0B09", accent:"#C85C2D", accent2:"#D7A45F", heading:'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', radius:2 },
    "cafe-bakery": { bg:"#F4EFE8", surface:"#FFFDF9", text:"#4A392F", muted:"#7C6C61", nav:"#FFFDF9", accent:"#9A6D4B", accent2:"#C7A57C", heading:'Georgia,"Times New Roman",serif', radius:22 },
    "upscale-dining": { bg:"#0C0C0C", surface:"#151515", text:"#F4F0E8", muted:"#B9B3A9", nav:"#080808", accent:"#C6A35B", accent2:"#E4D2A3", heading:'Georgia,"Times New Roman",serif', radius:0 },
    "family-casual": { bg:"#F7F1E8", surface:"#FFFFFF", text:"#0F2740", muted:"#607284", nav:"#0B2037", accent:"#0B5F9F", accent2:"#F4B400", heading:"Arial,Helvetica,sans-serif", radius:16 },
  };

  const c = configs[themeKey] || configs["family-casual"];
  const { restaurant, branding, website } = data;
  const hero = website.hero_image_url || data.images[0]?.image_url;
  const primary = branding?.primary_color || c.accent;
  const secondary = branding?.secondary_color || c.accent2;
  const cafe = themeKey === "cafe-bakery";

  return (
    <main style={{ minHeight:"100vh", background:c.bg, color:c.text, fontFamily:"Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg={c.nav} color={cafe ? c.text : "#fff"} accent={primary} />
      <section style={{ minHeight:620, display:"flex", alignItems:"center", color:"#fff", background:hero ? `linear-gradient(90deg,rgba(5,15,25,.76),rgba(5,15,25,.18)),url("${hero}") center/cover` : `linear-gradient(135deg,${c.nav},${primary})` }}>
        <div style={{ maxWidth:1180, width:"100%", margin:"0 auto", padding:"82px 28px" }}>
          <div style={{ color:secondary, fontSize:11, fontWeight:950, letterSpacing:3 }}>{restaurant.cuisine_category || "WELCOME"}</div>
          <h1 style={{ maxWidth:900, margin:"14px 0", fontFamily:c.heading, fontSize:"clamp(60px,8vw,108px)", lineHeight:.9 }}>{website.hero_headline || restaurant.name}</h1>
          <p style={{ maxWidth:680, fontSize:18, lineHeight:1.65 }}>{website.hero_subheadline || branding?.tagline || "Fresh food, local flavor, made for your table."}</p>
          <HeroActions data={data} primary={primary} secondary={secondary} darkText />
        </div>
      </section>
      <section id="story" style={{ background:c.surface }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"80px 28px", textAlign:"center" }}>
          <div style={{ color:primary, fontSize:11, fontWeight:950, letterSpacing:2.4 }}>OUR STORY</div>
          <h2 style={{ margin:"12px 0 18px", fontFamily:c.heading, fontSize:"clamp(44px,5vw,70px)" }}>{website.about_title || `About ${restaurant.name}`}</h2>
          <p style={{ color:c.muted, fontSize:17, lineHeight:1.8 }}>{website.about_body || branding?.short_description || "Tell guests what makes your restaurant special."}</p>
        </div>
      </section>
      {data.items.length > 0 && (
        <section style={{ background:c.bg, padding:"76px 26px" }}>
          <div style={{ maxWidth:1180, margin:"0 auto" }}>
            <div style={{ color:primary, fontSize:11, fontWeight:950, letterSpacing:2.4 }}>FEATURED FAVORITES</div>
            <h2 style={{ margin:"10px 0 30px", fontFamily:c.heading, fontSize:"clamp(44px,5vw,70px)" }}>Our Menu</h2>
            <FeaturedGrid data={data} themeKey={themeKey} cardBg={c.surface} text={c.text} muted={c.muted} accent={primary} imageHeight={210} radius={c.radius} />
          </div>
        </section>
      )}
      <VisitBand data={data} bg={c.nav} text={cafe ? c.text : "#fff"} accent={secondary} />
      <Footer data={data} bg={cafe ? "#E9DED2" : "#050505"} color={cafe ? c.text : "#999"} />
    </main>
  );
}

function Footer({ data, bg, color }: { data: SiteData; bg: string; color: string }) {
  return (
    <footer style={{ background: bg, color, padding: "18px 24px", textAlign: "center", fontSize: 10 }}>
      © 2026 {data.restaurant.name}. Powered by Restaurant OS.
    </footer>
  );
}
