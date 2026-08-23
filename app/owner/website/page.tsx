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
  slug: string | null;
  theme_key: string | null;
  theme_mode: string | null;
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
  hero_video_url: string;
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
  hero_video_url: "",
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


type SiteImage = {
  id: string;
  image_url: string;
  image_type: string;
  caption: string | null;
  sort_order: number;
};

type CustomRequest = {
  id: string;
  status: string;
  requested_at: string;
};

const THEME_CATEGORIES = [
  {
    key: "mexican",
    name: "Mexican / Taqueria",
    themes: [
      {
        key: "mex-jefe-bold",
        name: "Jefe Bold",
        description: "High-energy street taqueria. Massive brand moments, punchy type, late-night energy.",
        swatches: ["#0C0C0C", "#E43A2F", "#F5C242"],
      },
      {
        key: "mex-cantina-social",
        name: "Cantina Social",
        description: "Modern cantina with nightlife, margarita, event and reservation energy.",
        swatches: ["#0E342F", "#F1D7A8", "#C94B3C"],
      },
      {
        key: "mex-coastal-taco",
        name: "Coastal Taco",
        description: "Airy, lifestyle-driven, beach-club taco aesthetic with lots of photography.",
        swatches: ["#F5F0E7", "#6E9E93", "#E89B63"],
      },
      {
        key: "mex-cosmic-night",
        name: "Cosmic Night",
        description: "Editorial, dark, upscale Mexican dining with nightlife and event atmosphere.",
        swatches: ["#0A0A0D", "#A62863", "#E5B94A"],
      },
      {
        key: "mex-birria-street",
        name: "Birria Street",
        description: "Food-first, social-media-ready, bold red/orange color and oversized menu photography.",
        swatches: ["#1A0C08", "#D63A22", "#F39A2C"],
      },
    ],
  },
  {
    key: "pizza",
    name: "Pizza / Italian",
    themes: [
      {
        key: "pizza-italian",
        name: "Neighborhood Pizzeria",
        description: "Warm, rustic and neighborhood-driven with strong menu presentation.",
        swatches: ["#9F2D24", "#F5E7CE", "#163B2D"],
      },
    ],
  },
  {
    key: "bbq",
    name: "BBQ / Smokehouse",
    themes: [
      {
        key: "bbq-smokehouse",
        name: "Smokehouse",
        description: "Dark, rugged and smoky with oversized food photography.",
        swatches: ["#241A14", "#C15B2A", "#E7D5B8"],
      },
    ],
  },
  {
    key: "cafe",
    name: "Cafe / Bakery",
    themes: [
      {
        key: "cafe-bakery",
        name: "Cafe & Bakery",
        description: "Bright, welcoming and handcrafted for coffee, breakfast and baked goods.",
        swatches: ["#6B4F3A", "#F6EFE4", "#B8875B"],
      },
    ],
  },
  {
    key: "upscale",
    name: "Upscale / Fine Dining",
    themes: [
      {
        key: "upscale-dining",
        name: "Editorial Dining",
        description: "Elegant and restrained for premium dining concepts.",
        swatches: ["#111111", "#D5B46A", "#F2EEE6"],
      },
    ],
  },
  {
    key: "family",
    name: "Family / Casual",
    themes: [
      {
        key: "family-casual",
        name: "Family Casual",
        description: "Friendly, approachable and flexible for broad independent restaurant concepts.",
        swatches: ["#0B3A67", "#F4B400", "#F7F1E8"],
      },
    ],
  },
];

const THEME_LIBRARY = THEME_CATEGORIES.flatMap((category) => category.themes);


export default function WebsiteManagerPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("family-casual");
  const [themeCategory, setThemeCategory] = useState("mexican");
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [uploading, setUploading] = useState("");
  const [customRequest, setCustomRequest] = useState<CustomRequest | null>(null);
  const [customNotes, setCustomNotes] = useState("");

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
    setSelectedTheme(restaurantData.theme_key || "family-casual");
    const currentThemeKey = restaurantData.theme_key || "family-casual";
    const matchingCategory = THEME_CATEGORIES.find((category) =>
      category.themes.some((theme) => theme.key === currentThemeKey)
    );
    if (matchingCategory) setThemeCategory(matchingCategory.key);

    const [{ data: imageData }, { data: requestData }] = await Promise.all([
      supabase
        .from("restaurant_site_images")
        .select("id,image_url,image_type,caption,sort_order")
        .eq("restaurant_id", id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("restaurant_custom_site_requests")
        .select("id,status,requested_at")
        .eq("restaurant_id", id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setSiteImages((imageData || []) as SiteImage[]);
    setCustomRequest((requestData || null) as CustomRequest | null);

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
        hero_video_url: websiteData.hero_video_url || "",
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


  async function applyTheme(themeKey: string) {
    if (!restaurantId) return;
    setMessage("");

    const { error } = await supabase
      .from("restaurants")
      .update({
        theme_key: themeKey,
        theme_mode: "template",
      })
      .eq("id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSelectedTheme(themeKey);
    setRestaurant((current) =>
      current ? { ...current, theme_key: themeKey, theme_mode: "template" } : current
    );
    setMessage("Theme applied. Open the public site to review it.");
  }

  async function uploadAsset(file: File | null, kind: "logo" | "hero" | "gallery" | "video") {
    if (!file || !restaurantId) return;

    if (kind === "video") {
      if (!file.type.startsWith("video/")) {
        setMessage("Please choose a video file.");
        return;
      }

      if (file.size > 40 * 1024 * 1024) {
        setMessage("Hero video must be smaller than 40 MB.");
        return;
      }
    } else {
      if (!file.type.startsWith("image/")) {
        setMessage("Please choose an image file.");
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setMessage("Image must be smaller than 8 MB.");
        return;
      }
    }

    setUploading(kind);
    setMessage(
      `${
        kind === "gallery"
          ? "Photo"
          : kind === "logo"
          ? "Logo"
          : kind === "video"
          ? "Hero video"
          : "Hero image"
      } uploading...`
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your login session expired. Sign in again.");
      }

      const form = new FormData();
      form.append("restaurant_id", restaurantId);
      form.append("kind", kind);
      form.append("file", file);

      const response = await fetch("/api/owner/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Image upload failed.");
      }

      if (kind === "logo") {
        setSettings((current) => ({ ...current, logo_url: result.publicUrl }));
        setMessage("Logo uploaded and saved.");
      } else if (kind === "hero") {
        setSettings((current) => ({ ...current, hero_image_url: result.publicUrl }));
        setMessage("Hero image uploaded and saved.");
      } else if (kind === "video") {
        setSettings((current) => ({ ...current, hero_video_url: result.publicUrl }));
        setMessage("Hero video uploaded and saved.");
      } else if (result.image) {
        setSiteImages((current) =>
          [...current, result.image as SiteImage].sort(
            (a, b) => a.sort_order - b.sort_order
          )
        );
        setMessage("Restaurant photo uploaded.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Image upload failed."
      );
    } finally {
      setUploading("");
    }
  }

  async function removeSiteAsset(kind: "logo" | "hero" | "video") {
    if (!restaurantId) return;

    const column =
      kind === "logo"
        ? "logo_url"
        : kind === "hero"
        ? "hero_image_url"
        : "hero_video_url";

    const { error } = await supabase
      .from("restaurant_website_settings")
      .update({
        [column]: null,
        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSettings((current) => ({
      ...current,
      [
        kind === "logo"
          ? "logo_url"
          : kind === "hero"
          ? "hero_image_url"
          : "hero_video_url"
      ]: "",
    }));

    setMessage(
      kind === "logo"
        ? "Logo removed."
        : kind === "hero"
        ? "Hero image removed."
        : "Hero video removed."
    );
  }

  async function deleteGalleryImage(image: SiteImage) {
    if (!restaurantId) return;

    const { error } = await supabase
      .from("restaurant_site_images")
      .delete()
      .eq("id", image.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSiteImages((current) => current.filter((item) => item.id !== image.id));
    setMessage("Photo removed from gallery.");
  }

  async function requestCustomSite() {
    if (!restaurantId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("You are not signed in.");
      return;
    }

    if (customRequest && !["installed", "declined"].includes(customRequest.status)) {
      setMessage(`Your custom website request is already ${customRequest.status.replaceAll("_", " ")}.`);
      return;
    }

    const { data, error } = await supabase
      .from("restaurant_custom_site_requests")
      .insert({
        restaurant_id: restaurantId,
        requested_by: user.id,
        status: "requested",
        notes: customNotes.trim() || null,
        admin_notified: false,
      })
      .select("id,status,requested_at")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setCustomRequest(data as CustomRequest);
    setMessage("Custom website request submitted to Restaurant OS.");
  }


  async function setFeaturedImage(image: SiteImage) {
    setSettings((current) => ({
      ...current,
      hero_image_url: image.image_url,
    }));
    setMessage("Featured image selected. Click SAVE WEBSITE SETTINGS to finish.");
  }

  async function moveImage(image: SiteImage, direction: "up" | "down") {
    const sorted = [...siteImages].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === image.id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const target = sorted[targetIndex];

    const [{ error: firstError }, { error: secondError }] = await Promise.all([
      supabase
        .from("restaurant_site_images")
        .update({ sort_order: target.sort_order })
        .eq("id", image.id)
        .eq("restaurant_id", restaurantId),
      supabase
        .from("restaurant_site_images")
        .update({ sort_order: image.sort_order })
        .eq("id", target.id)
        .eq("restaurant_id", restaurantId),
    ]);

    if (firstError || secondError) {
      setMessage(firstError?.message || secondError?.message || "Unable to reorder images.");
      return;
    }

    const next = sorted.map((item) => {
      if (item.id === image.id) return { ...item, sort_order: target.sort_order };
      if (item.id === target.id) return { ...item, sort_order: image.sort_order };
      return item;
    }).sort((a, b) => a.sort_order - b.sort_order);

    setSiteImages(next);
    setMessage("Photo order updated.");
  }

  async function updateGalleryCaption(image: SiteImage, caption: string) {
    setSiteImages((current) =>
      current.map((item) =>
        item.id === image.id ? { ...item, caption } : item
      )
    );
  }

  async function saveGalleryCaption(image: SiteImage) {
    const current = siteImages.find((item) => item.id === image.id);
    const { error } = await supabase
      .from("restaurant_site_images")
      .update({
        caption: current?.caption || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", image.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Photo caption saved.");
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

          <div style={headerActionsStyle}>
            <button
              style={primaryOutlineButtonStyle}
              onClick={() =>
                (window.location.href = `/owner/pages?restaurant=${restaurantId}`)
              }
            >
              PAGES & SOCIALS
            </button>

            <button
              style={secondaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner?restaurant=${restaurantId}`)
              }
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={quickControlStyle}>
          <div>
            <div style={eyebrowStyle}>SITE STRUCTURE</div>
            <h2 style={quickControlTitleStyle}>Pages, Navigation & Socials</h2>
            <p style={quickControlTextStyle}>
              Add catering, locations, contact and custom pages. Control what
              appears in navigation and connect Facebook, Instagram, TikTok,
              Google Business and more.
            </p>
          </div>

          <button
            style={quickControlButtonStyle}
            onClick={() =>
              (window.location.href = `/owner/pages?restaurant=${restaurantId}`)
            }
          >
            MANAGE PAGES & SOCIALS →
          </button>
        </section>

        <section style={themeSectionStyle}>
          <div style={themeHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>DESIGN & THEME</div>
              <h2 style={quickControlTitleStyle}>Choose Your Website Style</h2>
              <p style={quickControlTextStyle}>
                Choose a restaurant category, then pick from purpose-built website themes. Mexican / Taqueria launches with five premium designs now; every top category is structured to hold five.
              </p>
            </div>

            <div style={{ display: "grid", gap: "8px", minWidth: "280px" }}>
              <select
                value={themeCategory}
                onChange={(event) => {
                  const nextCategory = event.target.value;
                  setThemeCategory(nextCategory);
                  const firstTheme = THEME_CATEGORIES.find((category) => category.key === nextCategory)?.themes[0];
                  if (firstTheme) setSelectedTheme(firstTheme.key);
                }}
                style={themeSelectStyle}
              >
                {THEME_CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTheme}
                onChange={(event) => setSelectedTheme(event.target.value)}
                style={themeSelectStyle}
              >
                {THEME_CATEGORIES.find((category) => category.key === themeCategory)?.themes.map((theme) => (
                  <option key={theme.key} value={theme.key}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={themeGridStyle}>
            {(THEME_CATEGORIES.find((category) => category.key === themeCategory)?.themes || []).map((theme) => {
              const active = selectedTheme === theme.key;
              const installed = restaurant.theme_key === theme.key && restaurant.theme_mode !== "custom";

              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setSelectedTheme(theme.key)}
                  style={{
                    ...themeCardStyle,
                    borderColor: active ? "#f5b82e" : "#2d4661",
                    background: active ? "#172d45" : "#102238",
                  }}
                >
                  <div style={swatchRowStyle}>
                    {theme.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        style={{ ...swatchStyle, background: swatch }}
                      />
                    ))}
                  </div>
                  <div style={themeNameStyle}>{theme.name}</div>
                  <div style={themeDescriptionStyle}>{theme.description}</div>
                  {installed && <div style={installedPillStyle}>CURRENT THEME</div>}
                </button>
              );
            })}
          </div>

          <div style={themeActionRowStyle}>
            <button
              style={quickControlButtonStyle}
              onClick={() => applyTheme(selectedTheme)}
            >
              APPLY SELECTED THEME
            </button>

            {restaurant.slug && (
              <button
                style={primaryOutlineButtonStyle}
                onClick={() => window.open(`/r/${restaurant.slug}`, "_blank")}
              >
                OPEN SITE PREVIEW
              </button>
            )}
          </div>

          <div style={customUpsellStyle}>
            <div>
              <div style={eyebrowStyle}>CUSTOM WEBSITE UPGRADE</div>
              <h3 style={customTitleStyle}>Want Something Built Just for You?</h3>
              <p style={quickControlTextStyle}>
                Request a custom Restaurant OS website. Our team will design a
                mockup, get your approval, then install the custom theme into your account.
              </p>
              {customRequest && (
                <div style={requestStatusStyle}>
                  REQUEST STATUS: {customRequest.status.replaceAll("_", " ").toUpperCase()}
                </div>
              )}
            </div>

            <div style={customRequestFormStyle}>
              <textarea
                value={customNotes}
                onChange={(event) => setCustomNotes(event.target.value)}
                placeholder="Tell us what you want: style, colors, examples, special sections..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
              <button style={customButtonStyle} onClick={requestCustomSite}>
                REQUEST CUSTOM SITE
              </button>
            </div>
          </div>
        </section>

        <section style={assetSectionStyle}>
          <div>
            <div style={eyebrowStyle}>SITE PHOTOS</div>
            <h2 style={quickControlTitleStyle}>Upload Your Restaurant Images</h2>
            <p style={quickControlTextStyle}>
              Add food, interior, exterior, team and atmosphere photos. Themes can
              automatically use these images throughout the site.
            </p>
          </div>

          <label style={galleryUploadStyle}>
            {uploading === "gallery" ? "UPLOADING..." : "+ ADD RESTAURANT PHOTO"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={Boolean(uploading)}
              style={{ display: "none" }}
              onChange={async (event) => {
                const files = Array.from(event.target.files || []);
                for (const file of files) {
                  await uploadAsset(file, "gallery");
                }
                event.currentTarget.value = "";
              }}
            />
          </label>

          {siteImages.length > 0 && (
            <div style={galleryGridStyle}>
              {siteImages.map((image, index) => (
                <div key={image.id} style={galleryCardStyle}>
                  <img src={image.image_url} alt={image.caption || ""} style={galleryImageStyle} />

                  <div style={galleryControlPanelStyle}>
                    <div style={galleryButtonRowStyle}>
                      <button
                        type="button"
                        style={galleryMiniButtonStyle}
                        disabled={index === 0}
                        onClick={() => moveImage(image, "up")}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        style={galleryMiniButtonStyle}
                        disabled={index === siteImages.length - 1}
                        onClick={() => moveImage(image, "down")}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        style={galleryFeatureButtonStyle}
                        onClick={() => setFeaturedImage(image)}
                      >
                        FEATURE
                      </button>
                    </div>

                    <input
                      value={image.caption || ""}
                      onChange={(event) => updateGalleryCaption(image, event.target.value)}
                      onBlur={() => saveGalleryCaption(image)}
                      placeholder="Photo caption"
                      style={galleryCaptionInputStyle}
                    />
                  </div>

                  <button
                    type="button"
                    style={galleryDeleteStyle}
                    onClick={() => deleteGalleryImage(image)}
                  >
                    REMOVE
                  </button>

                  {settings.hero_image_url === image.image_url && (
                    <div style={featuredBadgeStyle}>FEATURED</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

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

              <AssetUpload
                label="RESTAURANT LOGO"
                button={uploading === "logo" ? "UPLOADING..." : "UPLOAD LOGO"}
                imageUrl={settings.logo_url}
                disabled={Boolean(uploading)}
                onFile={(file) => uploadAsset(file, "logo")}
                onRemove={() => removeSiteAsset("logo")}
              />

              <AssetUpload
                label="HERO / COVER IMAGE"
                button={uploading === "hero" ? "UPLOADING..." : "UPLOAD HERO IMAGE"}
                imageUrl={settings.hero_image_url}
                disabled={Boolean(uploading)}
                onFile={(file) => uploadAsset(file, "hero")}
                onRemove={() => removeSiteAsset("hero")}
              />

              <VideoUpload
                videoUrl={settings.hero_video_url}
                disabled={Boolean(uploading)}
                uploading={uploading === "video"}
                onFile={(file) => uploadAsset(file, "video")}
                onRemove={() => removeSiteAsset("video")}
                onUrlChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    hero_video_url: value,
                  }))
                }
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
                    <img src={settings.logo_url} alt="" style={logoStyle} />
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
                {settings.show_menu && <div style={miniCardStyle}>🍽️ MENU</div>}
                {settings.show_ordering && (
                  <div style={miniCardStyle}>🛍️ ORDER ONLINE</div>
                )}
                {settings.show_vip && (
                  <div style={miniCardStyle}>⭐ VIP CLUB</div>
                )}
              </div>

              <div style={hintStyle}>
                Use Pages & Socials for extra pages, navigation and social
                profiles. This preview shows the core home-page content.
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


function VideoUpload({
  videoUrl,
  disabled,
  uploading,
  onFile,
  onRemove,
  onUrlChange,
}: {
  videoUrl: string;
  disabled: boolean;
  uploading: boolean;
  onFile: (file: File | null) => void;
  onRemove: () => void;
  onUrlChange: (value: string) => void;
}) {
  return (
    <div style={assetUploadCardStyle}>
      <div>
        <label style={labelStyle}>HERO VIDEO (OPTIONAL)</label>
        <div style={assetHelpStyle}>
          MP4 / MOV · up to 40 MB · muted looping background
        </div>
      </div>

      {videoUrl && (
        <video
          src={videoUrl}
          muted
          loop
          playsInline
          controls
          style={videoPreviewStyle}
        />
      )}

      <div style={assetActionRowStyle}>
        <label style={uploadButtonStyle}>
          {uploading
            ? "UPLOADING..."
            : videoUrl
            ? "REPLACE VIDEO"
            : "UPLOAD HERO VIDEO"}
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            disabled={disabled}
            style={{ display: "none" }}
            onChange={(event) => onFile(event.target.files?.[0] || null)}
          />
        </label>

        {videoUrl && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            style={removeAssetButtonStyle}
          >
            REMOVE VIDEO
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: "7px" }}>
        <label style={labelStyle}>OR USE A HOSTED VIDEO URL</label>
        <input
          value={videoUrl}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://...mp4"
          style={inputStyle}
        />
      </div>
    </div>
  );
}

function AssetUpload({
  label,
  button,
  imageUrl,
  disabled,
  onFile,
  onRemove,
}: {
  label: string;
  button: string;
  imageUrl: string;
  disabled: boolean;
  onFile: (file: File | null) => void;
  onRemove?: () => void;
}) {
  return (
    <div style={assetUploadCardStyle}>
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={assetHelpStyle}>
          JPG, PNG or WEBP · up to 8 MB
        </div>
      </div>

      {imageUrl && (
        <img src={imageUrl} alt="" style={assetPreviewStyle} />
      )}

      <div style={assetActionRowStyle}>
        <label style={uploadButtonStyle}>
          {imageUrl ? "REPLACE IMAGE" : button}
          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            style={{ display: "none" }}
            onChange={(event) => onFile(event.target.files?.[0] || null)}
          />
        </label>

        {imageUrl && onRemove && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            style={removeAssetButtonStyle}
          >
            REMOVE IMAGE
          </button>
        )}
      </div>
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

const themeSectionStyle = {
  background: "#102238",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "20px",
};

const themeHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
};

const themeSelectStyle = {
  minWidth: "250px",
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #3b5571",
  borderRadius: "10px",
  padding: "13px 14px",
  fontWeight: 800,
};

const themeGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "12px",
  marginTop: "20px",
};

const themeCardStyle = {
  position: "relative" as const,
  textAlign: "left" as const,
  color: "#ffffff",
  border: "1px solid #2d4661",
  borderRadius: "14px",
  padding: "16px",
  cursor: "pointer",
};

const swatchRowStyle = {
  display: "flex",
  gap: "6px",
  marginBottom: "14px",
};

const swatchStyle = {
  width: "34px",
  height: "18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,.18)",
};

const themeNameStyle = {
  fontWeight: 900,
  fontSize: "16px",
  marginBottom: "7px",
};

const themeDescriptionStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const installedPillStyle = {
  display: "inline-block",
  marginTop: "12px",
  color: "#f5b82e",
  border: "1px solid #f5b82e",
  borderRadius: "999px",
  padding: "5px 8px",
  fontSize: "9px",
  fontWeight: 900,
};

const themeActionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "18px",
};

const customUpsellStyle = {
  marginTop: "22px",
  padding: "22px",
  background: "linear-gradient(135deg,#07101c,#172d45)",
  border: "1px solid #37516c",
  borderLeft: "5px solid #f5b82e",
  borderRadius: "14px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};

const customTitleStyle = {
  margin: "6px 0 8px",
  fontSize: "24px",
};

const customRequestFormStyle = {
  display: "grid",
  gap: "10px",
};

const customButtonStyle = {
  border: 0,
  borderRadius: "9px",
  background: "#f5b82e",
  color: "#07101c",
  fontWeight: 900,
  padding: "13px 16px",
  cursor: "pointer",
};

const requestStatusStyle = {
  display: "inline-block",
  marginTop: "12px",
  color: "#86efac",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const assetSectionStyle = {
  background: "#102238",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "20px",
};

const galleryUploadStyle = {
  display: "inline-flex",
  marginTop: "18px",
  background: "#f5b82e",
  color: "#07101c",
  borderRadius: "9px",
  padding: "13px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const galleryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: "12px",
  marginTop: "18px",
};

const galleryCardStyle = {
  position: "relative" as const,
  minHeight: "130px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #2d4661",
};

const galleryImageStyle = {
  width: "100%",
  height: "150px",
  objectFit: "cover" as const,
  display: "block",
};

const galleryDeleteStyle = {
  position: "absolute" as const,
  right: "7px",
  bottom: "7px",
  border: 0,
  borderRadius: "999px",
  background: "rgba(0,0,0,.72)",
  color: "#ffffff",
  padding: "7px 9px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const assetActionRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
  alignItems: "center",
};

const removeAssetButtonStyle = {
  border: "1px solid #8f3e47",
  borderRadius: "9px",
  background: "#311922",
  color: "#ffd6da",
  padding: "11px 13px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const assetUploadCardStyle = {
  border: "1px dashed #3d5875",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "16px",
  display: "grid",
  gap: "12px",
};

const assetHelpStyle = {
  color: "#64748b",
  fontSize: "11px",
  marginTop: "5px",
};

const videoPreviewStyle = {
  width: "100%",
  maxHeight: "260px",
  objectFit: "cover" as const,
  borderRadius: "9px",
  background: "#02060b",
};

const assetPreviewStyle = {
  width: "100%",
  maxHeight: "180px",
  objectFit: "cover" as const,
  borderRadius: "9px",
  background: "#07101c",
};

const uploadButtonStyle = {
  display: "inline-flex",
  width: "fit-content",
  background: "#1e3650",
  border: "1px solid #3d5875",
  borderRadius: "9px",
  color: "#ffffff",
  padding: "11px 13px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const galleryControlPanelStyle = {
  display: "grid",
  gap: "8px",
  padding: "10px",
  background: "#0b1b2d",
  borderTop: "1px solid #2d4661",
};

const galleryButtonRowStyle = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap" as const,
};

const galleryMiniButtonStyle = {
  minWidth: "34px",
  border: "1px solid #3d5875",
  borderRadius: "7px",
  background: "#17314a",
  color: "#fff",
  fontWeight: 900,
  padding: "7px 9px",
  cursor: "pointer",
};

const galleryFeatureButtonStyle = {
  marginLeft: "auto",
  border: "1px solid #f5b82e",
  borderRadius: "7px",
  background: "transparent",
  color: "#f5b82e",
  fontWeight: 900,
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "9px",
};

const galleryCaptionInputStyle = {
  width: "100%",
  background: "#08111f",
  border: "1px solid #2d4661",
  borderRadius: "7px",
  color: "#fff",
  padding: "9px 10px",
  fontSize: "11px",
};

const featuredBadgeStyle = {
  position: "absolute" as const,
  left: "7px",
  top: "7px",
  background: "#f5b82e",
  color: "#07101c",
  borderRadius: "999px",
  padding: "6px 8px",
  fontSize: "8px",
  fontWeight: 900,
};

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

const headerActionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
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

const quickControlStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "wrap" as const,
};

const quickControlTitleStyle = {
  margin: "6px 0 8px",
  fontSize: "26px",
};

const quickControlTextStyle = {
  color: "#94a3b8",
  margin: 0,
  maxWidth: "760px",
  lineHeight: 1.5,
};

const quickControlButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "14px 18px",
  fontWeight: 900,
  cursor: "pointer",
};

const primaryOutlineButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
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
