"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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

function FeaturedGrid({ data, cardBg, text, muted, accent, imageHeight = 210, radius = 0 }: { data: SiteData; cardBg: string; text: string; muted: string; accent: string; imageHeight?: number; radius?: number }) {
  const photos = data.images;
  return (
    <div className="ros-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
      {data.items.slice(0, 6).map((item, index) => (
        <article key={item.id} style={{ background: cardBg, color: text, borderRadius: radius, overflow: "hidden", border: "1px solid rgba(127,127,127,.16)" }}>
          {photos[index]?.image_url && <img src={photos[index].image_url} alt="" style={{ width: "100%", height: imageHeight, objectFit: "cover" }} />}
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
  const hero = website.hero_image_url || data.images[0]?.image_url;
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

        <div style={{ minHeight: 650, background: hero ? `url("${hero}") center/cover` : `linear-gradient(145deg,${red},${yellow})`, position: "relative" }}>
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
          {data.images[1]?.image_url && <img src={data.images[1].image_url} alt="" style={{ width: "100%", height: 430, objectFit: "cover", border: `8px solid ${red}` }} />}
        </div>
      </section>

      {website.show_menu && data.items.length > 0 && (
        <section style={{ background: "#111", color: "#fff", padding: "76px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: yellow, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>WHAT ARE YOU CRAVING?</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(50px,6vw,82px)", textTransform: "uppercase", lineHeight: .9, fontWeight: 400 }}>Fan Favorites</h2>
            <FeaturedGrid data={data} cardBg="#1A1A1A" text="#fff" muted="#BBB" accent={yellow} imageHeight={230} />
          </div>
        </section>
      )}

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
  const hero = website.hero_image_url || data.images[0]?.image_url;
  const green = branding?.primary_color || "#163D36";
  const coral = branding?.secondary_color || "#E15B4D";

  return (
    <main style={{ minHeight: "100vh", background: "#F3E4C9", color: "#17352F", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg={green} color="#fff" accent={coral} outline />

      <section style={{ minHeight: 650, color: "#fff", position: "relative", display: "flex", alignItems: "end", background: hero ? `linear-gradient(90deg,rgba(12,46,40,.84),rgba(12,46,40,.18)),url("${hero}") center/cover` : `linear-gradient(135deg,${green},#0D1E1A)` }}>
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
          {data.images[1]?.image_url && <img src={data.images[1].image_url} alt="" style={{ width: "100%", height: 480, objectFit: "cover", borderRadius: 180 }} />}
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
            <FeaturedGrid data={data} cardBg="#214E45" text="#fff" muted="#D1DDD8" accent="#F0D6A8" imageHeight={220} radius={18} />
          </div>
        </section>
      )}

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
  const hero = website.hero_image_url || data.images[0]?.image_url;
  const teal = branding?.primary_color || "#6B9C92";
  const peach = branding?.secondary_color || "#E39A64";

  return (
    <main style={{ minHeight: "100vh", background: "#F7F4EE", color: "#213831", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#FBF9F4" color="#213831" accent={teal} compact outline />

      <section style={{ minHeight: 720, display: "grid", placeItems: "center", textAlign: "center", padding: "80px 24px", color: "#fff", background: hero ? `linear-gradient(rgba(26,56,49,.30),rgba(26,56,49,.30)),url("${hero}") center/cover` : `linear-gradient(135deg,${teal},#B9D1CA)` }}>
        <div style={{ maxWidth: 900 }}>
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
          {data.images.slice(1,4).map((image, index) => <img key={image.id} src={image.image_url} alt="" style={{ width: "100%", height: index === 1 ? 390 : 330, objectFit: "cover", borderRadius: 180 }} />)}
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
            <FeaturedGrid data={data} cardBg="#FBF9F4" text="#213831" muted="#708079" accent={peach} imageHeight={210} radius={22} />
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
  const hero = website.hero_image_url || data.images[0]?.image_url;
  const magenta = branding?.primary_color || "#A72D68";
  const gold = branding?.secondary_color || "#DDBB63";

  return (
    <main style={{ minHeight: "100vh", background: "#09090D", color: "#F6F1E7", fontFamily: "Arial,Helvetica,sans-serif" }}>
      <SharedGlobal />
      <Header data={data} bg="#08080B" color="#fff" accent={magenta} outline />

      <section style={{ minHeight: 760, position: "relative", display: "flex", alignItems: "end", overflow: "hidden", background: hero ? `linear-gradient(0deg,rgba(8,8,11,.86),rgba(8,8,11,.16)),url("${hero}") center/cover` : `radial-gradient(circle at 70% 30%,${magenta},#09090D 48%)` }}>
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
          {data.images[1]?.image_url && <img src={data.images[1].image_url} alt="" style={{ width: "100%", height: 500, objectFit: "cover", border: `1px solid ${gold}66` }} />}
        </div>
      </section>

      {data.items.length > 0 && (
        <section style={{ background: "#15151D", padding: "80px 26px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ color: gold, fontSize: 11, fontWeight: 900, letterSpacing: 2.8 }}>FROM THE MENU</div>
            <h2 style={{ margin: "10px 0 30px", fontFamily: 'Georgia,"Times New Roman",serif', fontSize: "clamp(44px,5vw,70px)", fontWeight: 500 }}>A Little Dangerous. Very Delicious.</h2>
            <FeaturedGrid data={data} cardBg="#0E0E13" text="#F6F1E7" muted="#AAA4AA" accent={gold} imageHeight={240} />
          </div>
        </section>
      )}

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
  const hero = website.hero_image_url || data.images[0]?.image_url;
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
        <div style={{ minHeight: 680, position: "relative", background: hero ? `url("${hero}") center/cover` : `linear-gradient(145deg,${red},${orange})` }}>
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
            <FeaturedGrid data={data} cardBg="#FFF7EC" text="#23110C" muted="#6B554B" accent={red} imageHeight={250} radius={12} />
          </div>
        </section>
      )}

      <section id="story" style={{ background: "#170B08" }}>
        <div className="ros-two" style={{ maxWidth: 1180, margin: "0 auto", padding: "84px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          {data.images[2]?.image_url && <img src={data.images[2].image_url} alt="" style={{ width: "100%", height: 470, objectFit: "cover", borderRadius: 14 }} />}
          <div>
            <div style={{ color: orange, fontSize: 11, fontWeight: 950, letterSpacing: 2.4 }}>WHY PEOPLE COME BACK</div>
            <h2 style={{ margin: "10px 0 18px", fontFamily: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', fontSize: "clamp(50px,6vw,82px)", lineHeight: .9, textTransform: "uppercase", fontWeight: 400 }}>{website.about_title || "Flavor That Hits Hard."}</h2>
            <p style={{ color: "#D9BFB4", fontSize: 17, lineHeight: 1.8 }}>{website.about_body || branding?.short_description || "Big portions. Bold flavor. Fast service. The kind of food people photograph before they take the first bite."}</p>
          </div>
        </div>
      </section>

      <VisitBand data={data} bg={red} text="#fff" accent={orange} />
      <Footer data={data} bg="#080403" color="#A98C80" />
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
            <FeaturedGrid data={data} cardBg={c.surface} text={c.text} muted={c.muted} accent={primary} imageHeight={210} radius={c.radius} />
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
