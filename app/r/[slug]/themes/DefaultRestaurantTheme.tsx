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

type ThemeConfig = {
  key: string;
  label: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  nav: string;
  heroOverlay: string;
  radius: number;
  heading: string;
  body: string;
  eyebrow: string;
  buttonRadius: number;
  heroAlign: "left" | "center";
  uppercase: boolean;
};

const THEMES: Record<string, ThemeConfig> = {
  "taqueria-street": {
    key: "taqueria-street",
    label: "Taqueria / Street Food",
    bg: "#F4E8D1",
    surface: "#FFF8EA",
    text: "#16100C",
    muted: "#6F6257",
    accent: "#A4251F",
    accent2: "#E3A82F",
    nav: "#12100D",
    heroOverlay: "linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.18))",
    radius: 4,
    heading: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    body: "Arial, Helvetica, sans-serif",
    eyebrow: "#E3A82F",
    buttonRadius: 2,
    heroAlign: "left",
    uppercase: true,
  },
  "pizza-italian": {
    key: "pizza-italian",
    label: "Pizza / Italian",
    bg: "#F3E8D5",
    surface: "#FFF9EF",
    text: "#1E201A",
    muted: "#665F53",
    accent: "#9D2F27",
    accent2: "#315A3D",
    nav: "#1B2D22",
    heroOverlay: "linear-gradient(90deg,rgba(20,24,18,.82),rgba(20,24,18,.28))",
    radius: 0,
    heading: 'Georgia, "Times New Roman", serif',
    body: "Arial, Helvetica, sans-serif",
    eyebrow: "#E7C995",
    buttonRadius: 0,
    heroAlign: "left",
    uppercase: false,
  },
  "bbq-smokehouse": {
    key: "bbq-smokehouse",
    label: "BBQ / Smokehouse",
    bg: "#1D1713",
    surface: "#2A211B",
    text: "#F2E4CE",
    muted: "#C8B69E",
    accent: "#C85C2D",
    accent2: "#D7A45F",
    nav: "#0D0B09",
    heroOverlay: "linear-gradient(90deg,rgba(0,0,0,.84),rgba(0,0,0,.35))",
    radius: 2,
    heading: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    body: "Arial, Helvetica, sans-serif",
    eyebrow: "#D7A45F",
    buttonRadius: 2,
    heroAlign: "left",
    uppercase: true,
  },
  "cafe-bakery": {
    key: "cafe-bakery",
    label: "Cafe / Bakery",
    bg: "#F4EFE8",
    surface: "#FFFDF9",
    text: "#4A392F",
    muted: "#7C6C61",
    accent: "#9A6D4B",
    accent2: "#C7A57C",
    nav: "#FFFDF9",
    heroOverlay: "linear-gradient(90deg,rgba(61,45,34,.62),rgba(61,45,34,.08))",
    radius: 22,
    heading: 'Georgia, "Times New Roman", serif',
    body: "Arial, Helvetica, sans-serif",
    eyebrow: "#B98760",
    buttonRadius: 999,
    heroAlign: "center",
    uppercase: false,
  },
  "upscale-dining": {
    key: "upscale-dining",
    label: "Upscale / Fine Dining",
    bg: "#0C0C0C",
    surface: "#151515",
    text: "#F4F0E8",
    muted: "#B9B3A9",
    accent: "#C6A35B",
    accent2: "#E4D2A3",
    nav: "#080808",
    heroOverlay: "linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.34))",
    radius: 0,
    heading: 'Georgia, "Times New Roman", serif',
    body: "Arial, Helvetica, sans-serif",
    eyebrow: "#C6A35B",
    buttonRadius: 0,
    heroAlign: "center",
    uppercase: false,
  },
  "family-casual": {
    key: "family-casual",
    label: "Family / Casual",
    bg: "#F7F1E8",
    surface: "#FFFFFF",
    text: "#0F2740",
    muted: "#607284",
    accent: "#0B5F9F",
    accent2: "#F4B400",
    nav: "#0B2037",
    heroOverlay: "linear-gradient(90deg,rgba(5,25,45,.78),rgba(5,25,45,.25))",
    radius: 16,
    heading: "Arial, Helvetica, sans-serif",
    body: "Arial, Helvetica, sans-serif",
    eyebrow: "#F4B400",
    buttonRadius: 10,
    heroAlign: "left",
    uppercase: true,
  },
};

export default function DefaultRestaurantTheme() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [ordering, setOrdering] = useState<Ordering | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function load() {
    setLoading(true);

    const { data: r } = await supabase
      .from("restaurants")
      .select("id,name,slug,theme_key,cuisine_category,phone,address_line_1,city,state,zip")
      .eq("slug", slug)
      .maybeSingle();

    if (!r) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    const [b,w,o,m,g] = await Promise.all([
      supabase.from("restaurant_branding").select("*").eq("restaurant_id", r.id).maybeSingle(),
      supabase.from("restaurant_website_settings").select("*").eq("restaurant_id", r.id).maybeSingle(),
      supabase.from("restaurant_ordering").select("online_ordering_url,catering_email").eq("restaurant_id", r.id).maybeSingle(),
      supabase.from("restaurant_menu_items").select("id,name,description,price,featured,available").eq("restaurant_id", r.id).eq("available", true).order("featured", { ascending:false }).limit(8),
      supabase.from("restaurant_site_images").select("id,image_url").eq("restaurant_id", r.id).eq("active", true).order("sort_order", { ascending:true }).limit(6),
    ]);

    setRestaurant(r as Restaurant);
    setBranding((b.data || null) as Branding | null);
    setWebsite((w.data || null) as Website | null);
    setOrdering((o.data || null) as Ordering | null);
    setItems((m.data || []) as MenuItem[]);
    setImages((g.data || []) as SiteImage[]);
    setLoading(false);
  }

  const theme = useMemo(
    () => THEMES[restaurant?.theme_key || "family-casual"] || THEMES["family-casual"],
    [restaurant?.theme_key]
  );

  if (loading) {
    return <main style={{minHeight:"100vh",background:"#08111f"}} />;
  }

  if (!restaurant || !website?.published) {
    return (
      <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#08111f",color:"#fff",fontFamily:"Arial"}}>
        This restaurant site is not published.
      </main>
    );
  }

  const primary = branding?.primary_color || theme.accent;
  const secondary = branding?.secondary_color || theme.accent2;
  const hero = website.hero_image_url || images[0]?.image_url || "";
  const gallery = images.slice(hero && images[0]?.image_url === hero ? 1 : 0, 4);
  const address = [restaurant.address_line_1,restaurant.city,restaurant.state,restaurant.zip].filter(Boolean).join(", ");
  const orderUrl = ordering?.online_ordering_url || "";
  const headingTextTransform = theme.uppercase ? "uppercase" as const : "none" as const;

  return (
    <main
      style={{
        minHeight:"100vh",
        background:theme.bg,
        color:theme.text,
        fontFamily:theme.body,
      }}
    >
      <style jsx global>{`
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0}
        a{text-decoration:none;color:inherit}
        img{display:block}
      `}</style>

      <header style={{background:theme.nav,color:theme.key==="cafe-bakery" ? theme.text : "#fff",borderBottom:`1px solid ${theme.key==="cafe-bakery" ? "#eadfd1" : "rgba(255,255,255,.09)"}`}}>
        <div style={{maxWidth:1320,margin:"0 auto",minHeight:88,padding:"0 26px",display:"flex",alignItems:"center",gap:22}}>
          <a href={`/r/${restaurant.slug}`} style={{display:"flex",alignItems:"center",minWidth:180}}>
            {website.logo_url ? (
              <img src={website.logo_url} alt={restaurant.name} style={{maxWidth:180,maxHeight:66,objectFit:"contain"}}/>
            ) : (
              <strong style={{fontFamily:theme.heading,fontSize:24,letterSpacing:theme.uppercase ? 1 : 0,textTransform:headingTextTransform}}>
                {restaurant.name}
              </strong>
            )}
          </a>

          <nav style={{marginLeft:"auto",display:"flex",gap:20,alignItems:"center",fontSize:11,fontWeight:900,letterSpacing:.5}}>
            <a href="#story">STORY</a>
            <a href={`/r/${restaurant.slug}/food-menu`}>MENU</a>
            <a href={`/r/${restaurant.slug}/offers`}>OFFERS</a>
            {website.show_vip && <a href={`/r/${restaurant.slug}/vip`}>VIP</a>}
            <a href="#visit">VISIT</a>
          </nav>

          {orderUrl && (
            <a href={orderUrl} target="_blank" rel="noreferrer" style={{
              background:primary,
              color:"#fff",
              padding:"13px 17px",
              borderRadius:theme.buttonRadius,
              fontSize:10,
              fontWeight:900,
              letterSpacing:.5
            }}>
              {website.primary_cta_label || "ORDER ONLINE"}
            </a>
          )}
        </div>
      </header>

      <section
        style={{
          minHeight:theme.heroAlign==="center" ? 640 : 610,
          position:"relative",
          display:"flex",
          alignItems:"center",
          justifyContent:theme.heroAlign==="center" ? "center" : "flex-start",
          textAlign:theme.heroAlign,
          color:"#fff",
          background:hero
            ? `${theme.heroOverlay}, url("${hero}") center/cover`
            : `linear-gradient(135deg,${theme.nav},${primary})`,
        }}
      >
        <div style={{
          width:"100%",
          maxWidth:theme.heroAlign==="center" ? 900 : 1320,
          margin:"0 auto",
          padding:"84px 34px",
        }}>
          <div style={{color:secondary,fontSize:11,fontWeight:900,letterSpacing:3,textTransform:"uppercase"}}>
            {restaurant.cuisine_category || theme.label}
          </div>
          <h1 style={{
            maxWidth:theme.heroAlign==="center" ? 900 : 850,
            margin:theme.heroAlign==="center" ? "18px auto" : "18px 0",
            fontFamily:theme.heading,
            fontSize:"clamp(58px,8vw,112px)",
            lineHeight:.9,
            letterSpacing:theme.key==="upscale-dining" ? -2 : .5,
            fontWeight:theme.key==="upscale-dining" || theme.key==="pizza-italian" || theme.key==="cafe-bakery" ? 500 : 900,
            textTransform:headingTextTransform,
          }}>
            {website.hero_headline || restaurant.name}
          </h1>
          <p style={{
            maxWidth:690,
            margin:theme.heroAlign==="center" ? "0 auto" : 0,
            fontSize:18,
            lineHeight:1.65,
            color:"#eef2f6",
          }}>
            {website.hero_subheadline || branding?.tagline || branding?.short_description || "Fresh food. Local flavor. Your table is waiting."}
          </p>

          <div style={{display:"flex",gap:12,justifyContent:theme.heroAlign==="center" ? "center" : "flex-start",flexWrap:"wrap",marginTop:28}}>
            {orderUrl && (
              <a href={orderUrl} target="_blank" rel="noreferrer" style={{
                background:secondary,
                color:theme.key==="upscale-dining" ? "#111" : theme.text,
                padding:"15px 22px",
                borderRadius:theme.buttonRadius,
                fontSize:11,
                fontWeight:900
              }}>
                {website.primary_cta_label || "ORDER ONLINE"}
              </a>
            )}
            <a href={`/r/${restaurant.slug}/food-menu`} style={{
              border:"1px solid rgba(255,255,255,.75)",
              color:"#fff",
              padding:"14px 22px",
              borderRadius:theme.buttonRadius,
              fontSize:11,
              fontWeight:900
            }}>
              {website.secondary_cta_label || "VIEW MENU"}
            </a>
          </div>
        </div>
      </section>

      {website.show_about && (
        <section id="story" style={{background:theme.surface}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"82px 28px",display:"grid",gridTemplateColumns:gallery[0] ? "1fr 1fr" : "1fr",gap:42,alignItems:"center"}}>
            <div>
              <div style={{color:primary,fontSize:11,fontWeight:900,letterSpacing:2.5,textTransform:"uppercase"}}>OUR STORY</div>
              <h2 style={{
                margin:"12px 0 18px",
                fontFamily:theme.heading,
                fontSize:"clamp(40px,5vw,68px)",
                lineHeight:.98,
                fontWeight:theme.key==="upscale-dining" || theme.key==="pizza-italian" || theme.key==="cafe-bakery" ? 500 : 900,
                textTransform:headingTextTransform,
              }}>
                {website.about_title || `About ${restaurant.name}`}
              </h2>
              <p style={{color:theme.muted,fontSize:17,lineHeight:1.8,maxWidth:720}}>
                {website.about_body || branding?.short_description || "Tell guests what makes your restaurant special."}
              </p>
            </div>
            {gallery[0] && (
              <img src={gallery[0].image_url} alt="" style={{width:"100%",height:430,objectFit:"cover",borderRadius:theme.radius}}/>
            )}
          </div>
        </section>
      )}

      {website.show_menu && items.length > 0 && (
        <section style={{background:theme.bg}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"82px 28px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:24,marginBottom:34,flexWrap:"wrap"}}>
              <div>
                <div style={{color:primary,fontSize:11,fontWeight:900,letterSpacing:2.5,textTransform:"uppercase"}}>FEATURED FAVORITES</div>
                <h2 style={{
                  margin:"10px 0 0",
                  fontFamily:theme.heading,
                  fontSize:"clamp(42px,5vw,70px)",
                  lineHeight:.95,
                  fontWeight:theme.key==="upscale-dining" || theme.key==="pizza-italian" || theme.key==="cafe-bakery" ? 500 : 900,
                  textTransform:headingTextTransform
                }}>
                  Our Menu
                </h2>
              </div>
              <a href={`/r/${restaurant.slug}/food-menu`} style={{color:primary,fontSize:11,fontWeight:900}}>VIEW FULL MENU →</a>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16}}>
              {items.slice(0,6).map((item,index) => (
                <article key={item.id} style={{
                  background:theme.surface,
                  border:`1px solid ${theme.key==="bbq-smokehouse" || theme.key==="upscale-dining" ? "#3a3029" : "#e7ddd0"}`,
                  borderRadius:theme.radius,
                  overflow:"hidden"
                }}>
                  {gallery[index+1] && (
                    <img src={gallery[index+1].image_url} alt="" style={{width:"100%",height:180,objectFit:"cover"}}/>
                  )}
                  <div style={{padding:22}}>
                    <div style={{display:"flex",gap:14,alignItems:"baseline"}}>
                      <h3 style={{margin:0,fontFamily:theme.heading,fontSize:22,fontWeight:700}}>{item.name}</h3>
                      {item.price !== null && <strong style={{marginLeft:"auto",color:primary}}>${Number(item.price).toFixed(2)}</strong>}
                    </div>
                    {item.description && <p style={{margin:"10px 0 0",color:theme.muted,lineHeight:1.55,fontSize:14}}>{item.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {gallery.length > 1 && (
        <section style={{background:theme.surface}}>
          <div style={{maxWidth:1320,margin:"0 auto",padding:"28px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
              {gallery.slice(0,3).map((image) => (
                <img key={image.id} src={image.image_url} alt="" style={{width:"100%",height:280,objectFit:"cover",borderRadius:theme.radius}}/>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="visit" style={{background:theme.nav,color:theme.key==="cafe-bakery" ? theme.text : "#fff"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"68px 28px",display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:38,alignItems:"center"}}>
          <div>
            <div style={{color:secondary,fontSize:11,fontWeight:900,letterSpacing:2.5}}>COME SEE US</div>
            <h2 style={{margin:"10px 0 12px",fontFamily:theme.heading,fontSize:"clamp(38px,5vw,62px)",lineHeight:1,textTransform:headingTextTransform}}>
              {restaurant.name}
            </h2>
            <p style={{lineHeight:1.7,opacity:.82}}>{address || "Visit us soon."}</p>
            {restaurant.phone && <a href={`tel:${restaurant.phone}`} style={{display:"inline-block",marginTop:12,color:secondary,fontWeight:900}}>{restaurant.phone}</a>}
          </div>

          <div style={{display:"grid",gap:10}}>
            {orderUrl && <a href={orderUrl} target="_blank" rel="noreferrer" style={{background:primary,color:"#fff",padding:"16px 18px",textAlign:"center",borderRadius:theme.buttonRadius,fontWeight:900,fontSize:11}}>ORDER ONLINE</a>}
            {ordering?.catering_email && <a href={`mailto:${ordering.catering_email}`} style={{border:`1px solid ${theme.key==="cafe-bakery" ? "#9d8b79" : "rgba(255,255,255,.35)"}`,padding:"15px 18px",textAlign:"center",borderRadius:theme.buttonRadius,fontWeight:900,fontSize:11}}>CATERING / EVENTS</a>}
          </div>
        </div>
      </section>

      <footer style={{background:theme.key==="cafe-bakery" ? "#E9DED2" : "#050505",color:theme.key==="cafe-bakery" ? theme.text : "#aaa",padding:"18px 28px",textAlign:"center",fontSize:10}}>
        © 2026 {restaurant.name}. Powered by Restaurant OS.
      </footer>
    </main>
  );
}
