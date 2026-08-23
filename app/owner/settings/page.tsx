"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Row = Record<string, any>;

const DAYS = [
  "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
] as const;

export default function BusinessSettingsPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Row | null>(null);
  const [branding, setBranding] = useState<Row>({
    primary_color:"#0B3A67",
    secondary_color:"#F4B400",
    tagline:"",
    short_description:"",
  });
  const [hours, setHours] = useState<Row>({});
  const [ordering, setOrdering] = useState<Row>({});
  const [growth, setGrowth] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("restaurant") || "";
    setRestaurantId(id);
    if (!id) {
      setMessage("Restaurant ID is missing.");
      setLoading(false);
      return;
    }
    load(id);
  }, []);

  async function load(id:string) {
    setLoading(true);
    setMessage("");

    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const restaurantResult = await supabase
      .from("restaurants")
      .select("id,name,cuisine_category,phone,address_line_1,city,state,zip,owner_user_id")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantResult.error || !restaurantResult.data) {
      setMessage(restaurantResult.error?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantResult.data);

    const [b,h,o,g] = await Promise.all([
      supabase.from("restaurant_branding").select("*").eq("restaurant_id", id).maybeSingle(),
      supabase.from("restaurant_hours").select("*").eq("restaurant_id", id).maybeSingle(),
      supabase.from("restaurant_ordering").select("*").eq("restaurant_id", id).maybeSingle(),
      supabase.from("restaurant_growth_settings").select("*").eq("restaurant_id", id).maybeSingle(),
    ]);

    if (b.data) setBranding(b.data);
    if (h.data) setHours(h.data);
    if (o.data) setOrdering(o.data);
    if (g.data) setGrowth(g.data);

    setLoading(false);
  }

  async function saveSingleton(table:string, id:string, payload:Row) {
    const existing = await supabase
      .from(table)
      .select("restaurant_id")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data) {
      const result = await supabase
        .from(table)
        .update({ ...payload, updated_at:new Date().toISOString() })
        .eq("restaurant_id", id);
      if (result.error) throw result.error;
      return;
    }

    const result = await supabase
      .from(table)
      .insert({ restaurant_id:id, ...payload });
    if (result.error) throw result.error;
  }

  async function save() {
    if (!restaurant || !restaurantId || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const restaurantSave = await supabase
        .from("restaurants")
        .update({
          name: restaurant.name || "",
          cuisine_category: restaurant.cuisine_category || null,
          phone: restaurant.phone || null,
          address_line_1: restaurant.address_line_1 || null,
          city: restaurant.city || null,
          state: restaurant.state || null,
          zip: restaurant.zip || null,
        })
        .eq("id", restaurantId);

      if (restaurantSave.error) throw restaurantSave.error;

      await saveSingleton("restaurant_branding", restaurantId, {
        primary_color: branding.primary_color || "#0B3A67",
        secondary_color: branding.secondary_color || "#F4B400",
        tagline: branding.tagline || "",
        short_description: branding.short_description || "",
      });

      await saveSingleton("restaurant_hours", restaurantId,
        Object.fromEntries(DAYS.map(day => [day, hours[day] || ""]))
      );

      await saveSingleton("restaurant_ordering", restaurantId, {
        online_ordering_url: ordering.online_ordering_url || null,
        catering_email: ordering.catering_email || null,
      });

      await saveSingleton("restaurant_growth_settings", restaurantId, {
        vip_club_name: growth.vip_club_name || null,
        signup_offer: growth.signup_offer || null,
      });

      setMessage("Settings saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main style={page}><div style={shell}>Loading settings...</div></main>;
  if (!restaurant) return <main style={page}><div style={shell}>{message}</div></main>;

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>RESTAURANT OS</div>
            <h1 style={title}>Business Settings</h1>
            <p style={sub}>Control the information that powers your restaurant website.</p>
          </div>
          <button style={secondary} onClick={() => window.location.href=`/owner?restaurant=${restaurantId}`}>
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={notice}>{message}</div>}

        <Section title="Restaurant Information">
          <Field label="RESTAURANT NAME" value={restaurant.name || ""} onChange={v=>setRestaurant({...restaurant,name:v})}/>
          <Field label="CUISINE / CATEGORY" value={restaurant.cuisine_category || ""} onChange={v=>setRestaurant({...restaurant,cuisine_category:v})}/>
          <Field label="PHONE" value={restaurant.phone || ""} onChange={v=>setRestaurant({...restaurant,phone:v})}/>
          <Field label="ADDRESS" value={restaurant.address_line_1 || ""} onChange={v=>setRestaurant({...restaurant,address_line_1:v})}/>
          <div style={grid3}>
            <Field label="CITY" value={restaurant.city || ""} onChange={v=>setRestaurant({...restaurant,city:v})}/>
            <Field label="STATE" value={restaurant.state || ""} onChange={v=>setRestaurant({...restaurant,state:v})}/>
            <Field label="ZIP" value={restaurant.zip || ""} onChange={v=>setRestaurant({...restaurant,zip:v})}/>
          </div>
        </Section>

        <Section title="Brand & Website">
          <div style={grid2}>
            <Field label="PRIMARY COLOR" value={branding.primary_color || ""} onChange={v=>setBranding({...branding,primary_color:v})}/>
            <Field label="SECONDARY COLOR" value={branding.secondary_color || ""} onChange={v=>setBranding({...branding,secondary_color:v})}/>
          </div>
          <Field label="TAGLINE" value={branding.tagline || ""} onChange={v=>setBranding({...branding,tagline:v})}/>
          <TextArea label="SHORT DESCRIPTION" value={branding.short_description || ""} onChange={v=>setBranding({...branding,short_description:v})}/>
        </Section>

        <Section title="Hours">
          <div style={grid2}>
            {DAYS.map(day => (
              <Field key={day} label={day.toUpperCase()} value={hours[day] || ""} placeholder="11:00 AM - 9:00 PM" onChange={v=>setHours({...hours,[day]:v})}/>
            ))}
          </div>
        </Section>

        <Section title="Ordering & Catering">
          <Field label="ONLINE ORDERING URL" value={ordering.online_ordering_url || ""} onChange={v=>setOrdering({...ordering,online_ordering_url:v})}/>
          <Field label="CATERING EMAIL" value={ordering.catering_email || ""} onChange={v=>setOrdering({...ordering,catering_email:v})}/>
        </Section>

        <Section title="VIP Growth">
          <Field label="VIP CLUB NAME" value={growth.vip_club_name || ""} onChange={v=>setGrowth({...growth,vip_club_name:v})}/>
          <Field label="SIGNUP OFFER" value={growth.signup_offer || ""} onChange={v=>setGrowth({...growth,signup_offer:v})}/>
        </Section>

        <div style={{display:"flex",justifyContent:"flex-end",paddingTop:8}}>
          <button style={primary} disabled={saving} onClick={save}>
            {saving ? "SAVING..." : "SAVE SETTINGS"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Section({title,children}:{title:string;children:React.ReactNode}) {
  return <section style={section}>
    <div style={eyebrow}>OWNER CONTROL</div>
    <h2 style={sectionTitle}>{title}</h2>
    <div style={{display:"grid",gap:16}}>{children}</div>
  </section>;
}

function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}) {
  return <label style={field}>
    <span style={labelStyle}>{label}</span>
    <input style={input} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>
  </label>;
}

function TextArea({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) {
  return <label style={field}>
    <span style={labelStyle}>{label}</span>
    <textarea style={{...input,minHeight:105,resize:"vertical"}} value={value} onChange={e=>onChange(e.target.value)}/>
  </label>;
}

const page:React.CSSProperties={minHeight:"100vh",background:"#061426",color:"#fff",padding:"32px 18px 80px",fontFamily:"Arial,Helvetica,sans-serif"};
const shell:React.CSSProperties={maxWidth:1180,margin:"0 auto"};
const header:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:24,marginBottom:30};
const eyebrow:React.CSSProperties={color:"#fdbb2d",fontSize:11,fontWeight:900,letterSpacing:1.6};
const title:React.CSSProperties={margin:"8px 0 10px",fontSize:"clamp(48px,7vw,72px)",lineHeight:.95};
const sub:React.CSSProperties={margin:0,color:"#9fb0c3",fontSize:16};
const section:React.CSSProperties={background:"#102238",border:"1px solid #23405e",borderRadius:20,padding:26,marginBottom:18};
const sectionTitle:React.CSSProperties={margin:"8px 0 22px",fontSize:28};
const field:React.CSSProperties={display:"grid",gap:8};
const labelStyle:React.CSSProperties={fontSize:11,fontWeight:900,color:"#c7d3df",letterSpacing:.8};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",background:"#081629",border:"1px solid #35506b",borderRadius:10,color:"#fff",padding:"14px 15px",fontSize:16,outline:"none"};
const grid2:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16};
const grid3:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16};
const notice:React.CSSProperties={background:"#17314a",border:"1px solid #315370",borderRadius:10,padding:"14px 16px",marginBottom:18};
const secondary:React.CSSProperties={background:"transparent",color:"#fff",border:"1px solid #3d536c",borderRadius:10,padding:"13px 18px",fontWeight:900,cursor:"pointer"};
const primary:React.CSSProperties={background:"#fdbb2d",color:"#061426",border:0,borderRadius:10,padding:"15px 22px",fontWeight:900,cursor:"pointer",minWidth:220};
