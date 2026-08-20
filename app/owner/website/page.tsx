"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
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
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string;
  logo_url: string;
  about_title: string;
  about_body: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  show_about: boolean;
  show_menu: boolean;
  show_ordering: boolean;
  show_vip: boolean;
  published: boolean;
};

const initialSettings: WebsiteSettings = {
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
};

export default function WebsiteManagerPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant");

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not signed in.");
      setLoading(false);
      return;
    }

    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    const { data: brandingData } = await supabase
      .from("restaurant_branding")
      .select("*")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (brandingData) {
      setBranding({
        primary_color: brandingData.primary_color || null,
        secondary_color: brandingData.secondary_color || null,
        tagline: brandingData.tagline || null,
        short_description: brandingData.short_description || null,
      });
    }

    const { data: websiteData } = await supabase
      .from("restaurant_website_settings")
      .select("*")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (websiteData) {
      setSettings({
        hero_headline: websiteData.hero_headline || "",
        hero_subheadline: websiteData.hero_subheadline || "",
        hero_image_url: websiteData.hero_image_url || "",
        logo_url: websiteData.logo_url || "",
        about_title: websiteData.about_title || "",
        about_body: websiteData.about_body || "",
        primary_cta_label: websiteData.primary_cta_label || "ORDER ONLINE",
        secondary_cta_label: websiteData.secondary_cta_label || "VIEW MENU",
        show_about: websiteData.show_about ?? true,
        show_menu: websiteData.show_menu ?? true,
        show_ordering: websiteData.show_ordering ?? true,
        show_vip: websiteData.show_vip ?? true,
        published: websiteData.published ?? false,
      });
    } else {
      setSettings((current) => ({
        ...current,
        hero_headline: restaurantData.name
          ? `WELCOME TO ${restaurantData.name.toUpperCase()}`
          : "",
        hero_subheadline:
          brandingData?.tagline ||
          brandingData?.short_description ||
          "Great food. Local flavor. Your table is waiting.",
        about_title: `ABOUT ${restaurantData.name.toUpperCase()}`,
        about_body:
          brandingData?.short_description ||
          "Tell your story here. Share what makes your restaurant special.",
      }));
    }

    setLoading(false);
  }

  function update<K extends keyof WebsiteSettings>(
    key: K,
    value: WebsiteSettings[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!restaurantId) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("restaurant_website_settings")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id" }
      );

    setSaving(false);
    setMessage(error ? error.message : "Website settings saved.");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading website manager...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>{message || "Restaurant not found."}</div>
      </main>
    );
  }

  const primary = branding?.primary_color || "#0b3a67";
  const secondary = branding?.secondary_color || "#f5b82e";

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Website Manager</h1>
            <p style={subStyle}>
              Control the content and sections that power your restaurant site.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/owner?restaurant=${restaurantId}`)
            }
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <div style={layoutStyle}>
          <div>
            <section style={sectionStyle}>
              <SectionTitle title="Hero Section" />

              <Field
                label="HERO HEADLINE"
                value={settings.hero_headline}
                onChange={(value) => update("hero_headline", value)}
                placeholder="WELCOME TO YOUR RESTAURANT"
              />

              <Textarea
                label="HERO SUBHEADLINE"
                value={settings.hero_subheadline}
                onChange={(value) => update("hero_subheadline", value)}
                placeholder="Tell people why they should eat here."
              />

              <Field
                label="HERO IMAGE URL"
                value={settings.hero_image_url}
                onChange={(value) => update("hero_image_url", value)}
                placeholder="https://..."
              />

              <Field
                label="LOGO URL"
                value={settings.logo_url}
                onChange={(value) => update("logo_url", value)}
                placeholder="https://..."
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="About Section" />

              <Field
                label="ABOUT TITLE"
                value={settings.about_title}
                onChange={(value) => update("about_title", value)}
              />

              <Textarea
                label="ABOUT BODY"
                value={settings.about_body}
                onChange={(value) => update("about_body", value)}
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Buttons & Calls to Action" />

              <Field
                label="PRIMARY BUTTON"
                value={settings.primary_cta_label}
                onChange={(value) => update("primary_cta_label", value)}
              />

              <Field
                label="SECONDARY BUTTON"
                value={settings.secondary_cta_label}
                onChange={(value) => update("secondary_cta_label", value)}
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Visible Sections" />

              <Toggle
                label="SHOW ABOUT SECTION"
                checked={settings.show_about}
                onChange={(value) => update("show_about", value)}
              />

              <Toggle
                label="SHOW MENU"
                checked={settings.show_menu}
                onChange={(value) => update("show_menu", value)}
              />

              <Toggle
                label="SHOW ORDERING"
                checked={settings.show_ordering}
                onChange={(value) => update("show_ordering", value)}
              />

              <Toggle
                label="SHOW VIP SIGNUP"
                checked={settings.show_vip}
                onChange={(value) => update("show_vip", value)}
              />

              <Toggle
                label="PUBLISH WEBSITE"
                checked={settings.published}
                onChange={(value) => update("published", value)}
              />
            </section>

            <button
              style={saveButtonStyle}
              disabled={saving}
              onClick={save}
            >
              {saving ? "SAVING..." : "SAVE WEBSITE SETTINGS"}
            </button>
          </div>

          <div>
            <div style={previewStickyStyle}>
              <div style={eyebrowStyle}>LIVE PREVIEW</div>

              <div
                style={{
                  ...previewCardStyle,
                  background: settings.hero_image_url
                    ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.72)), url("${settings.hero_image_url}") center/cover`
                    : `linear-gradient(135deg, ${primary}, #07101c)`,
                }}
              >
                <div style={previewTopStyle}>
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt=""
                      style={logoStyle}
                    />
                  ) : (
                    <div style={previewBrandStyle}>{restaurant.name}</div>
                  )}

                  <div
                    style={{
                      ...publishPillStyle,
                      borderColor: settings.published ? secondary : "#475569",
                      color: settings.published ? secondary : "#94a3b8",
                    }}
                  >
                    {settings.published ? "PUBLISHED" : "DRAFT"}
                  </div>
                </div>

                <div style={previewHeroBodyStyle}>
                  <h2 style={previewHeadlineStyle}>
                    {settings.hero_headline || restaurant.name}
                  </h2>

                  <p style={previewTextStyle}>
                    {settings.hero_subheadline ||
                      branding?.tagline ||
                      "Great food. Local flavor."}
                  </p>

                  <div style={buttonRowStyle}>
                    <button
                      style={{
                        ...previewPrimaryButtonStyle,
                        background: secondary,
                      }}
                    >
                      {settings.primary_cta_label || "ORDER ONLINE"}
                    </button>

                    <button style={previewSecondaryButtonStyle}>
                      {settings.secondary_cta_label || "VIEW MENU"}
                    </button>
                  </div>
                </div>
              </div>

              {settings.show_about && (
                <div style={previewSectionStyle}>
                  <div style={eyebrowStyle}>OUR STORY</div>
                  <h3 style={previewSectionTitleStyle}>
                    {settings.about_title || `ABOUT ${restaurant.name}`}
                  </h3>
                  <p style={previewBodyStyle}>
                    {settings.about_body ||
                      branding?.short_description ||
                      "Your restaurant story will appear here."}
                  </p>
                </div>
              )}

              <div style={miniGridStyle}>
                {settings.show_menu && (
                  <div style={miniCardStyle}>🍽️ MENU</div>
                )}
                {settings.show_ordering && (
                  <div style={miniCardStyle}>🛍️ ORDER ONLINE</div>
                )}
                {settings.show_vip && (
                  <div style={miniCardStyle}>⭐ VIP CLUB</div>
                )}
              </div>

              <div style={hintStyle}>
                This is the content manager preview. Next we connect these
                settings to the actual public restaurant-site template.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={eyebrowStyle}>SITE CONTROL</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        style={{ ...inputStyle, resize: "vertical" as const }}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={toggleRowStyle}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1260px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(42px,7vw,72px)",
  lineHeight: ".95",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.05fr) minmax(360px,.95fr)",
  gap: "22px",
  alignItems: "start",
};

const sectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  margin: "6px 0 0",
  fontSize: "27px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: "#cbd5e1",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "14px",
};

const toggleRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  borderBottom: "1px solid #23364d",
  padding: "14px 0",
  fontWeight: 800,
};

const saveButtonStyle = {
  width: "100%",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "12px",
  padding: "17px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};

const previewStickyStyle = {
  position: "sticky" as const,
  top: "18px",
};

const previewCardStyle = {
  minHeight: "520px",
  borderRadius: "20px",
  border: "1px solid #2b3e55",
  padding: "24px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  overflow: "hidden",
};

const previewTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const logoStyle = {
  maxHeight: "64px",
  maxWidth: "140px",
  objectFit: "contain" as const,
};

const previewBrandStyle = {
  fontSize: "20px",
  fontWeight: 900,
};

const publishPillStyle = {
  border: "1px solid",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const previewHeroBodyStyle = {
  maxWidth: "500px",
  paddingTop: "110px",
};

const previewHeadlineStyle = {
  fontSize: "clamp(38px,5vw,64px)",
  lineHeight: ".92",
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-2px",
};

const previewTextStyle = {
  color: "#e2e8f0",
  lineHeight: 1.6,
  fontSize: "16px",
  marginTop: "18px",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "22px",
};

const previewPrimaryButtonStyle = {
  color: "#08111f",
  border: 0,
  borderRadius: "9px",
  padding: "13px 16px",
  fontWeight: 900,
};

const previewSecondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,.7)",
  borderRadius: "9px",
  padding: "13px 16px",
  fontWeight: 900,
};

const previewSectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  marginTop: "16px",
};

const previewSectionTitleStyle = {
  fontSize: "28px",
  margin: "7px 0 12px",
};

const previewBodyStyle = {
  color: "#94a3b8",
  lineHeight: 1.6,
};

const miniGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
  gap: "10px",
  marginTop: "12px",
};

const miniCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "12px",
  padding: "16px",
  fontWeight: 900,
  textAlign: "center" as const,
};

const hintStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "14px",
};
