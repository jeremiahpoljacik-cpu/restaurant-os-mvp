"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type PageRow = {
  id: string;
  restaurant_id: string;
  page_type: string;
  title: string;
  slug: string;
  nav_label: string | null;
  content: string | null;
  hero_image_url: string | null;
  active: boolean;
  show_in_nav: boolean;
  sort_order: number;
};

type SocialRow = {
  id: string;
  restaurant_id: string;
  platform: string;
  url: string;
  active: boolean;
  sort_order: number;
};

const defaultPageTypes = [
  "about",
  "menu",
  "catering",
  "contact",
  "locations",
  "custom",
];

const socialPlatforms = [
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "Google Business",
  "X / Twitter",
];

export default function PagesAndSocialsManagerPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [pages, setPages] = useState<PageRow[]>([]);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [newPageType, setNewPageType] = useState("about");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageNavLabel, setNewPageNavLabel] = useState("");

  const [newSocialPlatform, setNewSocialPlatform] = useState("Facebook");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMessage("");

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

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);

    const { data: pageData, error: pageError } = await supabase
      .from("restaurant_pages")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (pageError) {
      setMessage(pageError.message);
      setLoading(false);
      return;
    }

    const { data: socialData, error: socialError } = await supabase
      .from("restaurant_social_links")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: true })
      .order("platform", { ascending: true });

    if (socialError) {
      setMessage(socialError.message);
      setLoading(false);
      return;
    }

    setPages(pageData || []);
    setSocials(socialData || []);
    setLoading(false);
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function addPage() {
    const title = newPageTitle.trim();
    const slug = slugify(newPageSlug || newPageTitle);

    if (!restaurantId || !title || !slug) {
      setMessage("Page title and slug are required.");
      return;
    }

    const { error } = await supabase.from("restaurant_pages").insert({
      restaurant_id: restaurantId,
      page_type: newPageType,
      title,
      slug,
      nav_label: newPageNavLabel.trim() || title,
      content: "",
      active: true,
      show_in_nav: true,
      sort_order: pages.length,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewPageTitle("");
    setNewPageSlug("");
    setNewPageNavLabel("");
    await load();
  }

  async function savePage(page: PageRow) {
    const { error } = await supabase
      .from("restaurant_pages")
      .update({
        page_type: page.page_type,
        title: page.title,
        slug: slugify(page.slug),
        nav_label: page.nav_label,
        content: page.content,
        hero_image_url: page.hero_image_url,
        active: page.active,
        show_in_nav: page.show_in_nav,
        sort_order: page.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", page.id)
      .eq("restaurant_id", restaurantId);

    setMessage(error ? error.message : "Page saved.");
  }

  async function deletePage(id: string) {
    if (!window.confirm("Delete this page?")) return;

    const { error } = await supabase
      .from("restaurant_pages")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await load();
  }

  async function addSocial() {
    if (!restaurantId || !newSocialUrl.trim()) {
      setMessage("Social URL is required.");
      return;
    }

    const { error } = await supabase.from("restaurant_social_links").insert({
      restaurant_id: restaurantId,
      platform: newSocialPlatform,
      url: newSocialUrl.trim(),
      active: true,
      sort_order: socials.length,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewSocialUrl("");
    await load();
  }

  async function saveSocial(social: SocialRow) {
    const { error } = await supabase
      .from("restaurant_social_links")
      .update({
        platform: social.platform,
        url: social.url,
        active: social.active,
        sort_order: social.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", social.id)
      .eq("restaurant_id", restaurantId);

    setMessage(error ? error.message : "Social link saved.");
  }

  async function deleteSocial(id: string) {
    if (!window.confirm("Delete this social link?")) return;

    const { error } = await supabase
      .from("restaurant_social_links")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await load();
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading pages & socials...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Pages & Socials</h1>
            <p style={subStyle}>
              {restaurantName} — control navigation, additional pages and social links.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/owner/website?restaurant=${restaurantId}`)
            }
          >
            BACK TO WEBSITE MANAGER
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>SITE PAGES</div>
          <h2 style={sectionTitleStyle}>Add a Page</h2>

          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>PAGE TYPE</label>
              <select
                value={newPageType}
                onChange={(e) => setNewPageType(e.target.value)}
                style={inputStyle}
              >
                {defaultPageTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="PAGE TITLE"
              value={newPageTitle}
              onChange={(value) => {
                setNewPageTitle(value);
                if (!newPageSlug) setNewPageSlug(slugify(value));
              }}
              placeholder="Catering"
            />

            <Field
              label="URL SLUG"
              value={newPageSlug}
              onChange={setNewPageSlug}
              placeholder="catering"
            />

            <Field
              label="NAV LABEL"
              value={newPageNavLabel}
              onChange={setNewPageNavLabel}
              placeholder="CATERING"
            />
          </div>

          <button style={primaryButtonStyle} onClick={addPage}>
            + ADD PAGE
          </button>
        </section>

        {pages.map((page) => (
          <section key={page.id} style={sectionStyle}>
            <div style={pageHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>PAGE</div>
                <h2 style={sectionTitleStyle}>{page.title}</h2>
              </div>

              <button
                style={dangerButtonStyle}
                onClick={() => deletePage(page.id)}
              >
                DELETE
              </button>
            </div>

            <div style={formGridStyle}>
              <Field
                label="TITLE"
                value={page.title}
                onChange={(value) =>
                  setPages((current) =>
                    current.map((p) =>
                      p.id === page.id ? { ...p, title: value } : p
                    )
                  )
                }
              />

              <Field
                label="SLUG"
                value={page.slug}
                onChange={(value) =>
                  setPages((current) =>
                    current.map((p) =>
                      p.id === page.id ? { ...p, slug: value } : p
                    )
                  )
                }
              />

              <Field
                label="NAV LABEL"
                value={page.nav_label || ""}
                onChange={(value) =>
                  setPages((current) =>
                    current.map((p) =>
                      p.id === page.id ? { ...p, nav_label: value } : p
                    )
                  )
                }
              />

              <Field
                label="SORT ORDER"
                value={String(page.sort_order)}
                onChange={(value) =>
                  setPages((current) =>
                    current.map((p) =>
                      p.id === page.id
                        ? { ...p, sort_order: Number(value || 0) }
                        : p
                    )
                  )
                }
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <Field
                  label="HERO IMAGE URL"
                  value={page.hero_image_url || ""}
                  onChange={(value) =>
                    setPages((current) =>
                      current.map((p) =>
                        p.id === page.id ? { ...p, hero_image_url: value } : p
                      )
                    )
                  }
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>PAGE CONTENT</label>
                <textarea
                  rows={8}
                  value={page.content || ""}
                  onChange={(e) =>
                    setPages((current) =>
                      current.map((p) =>
                        p.id === page.id ? { ...p, content: e.target.value } : p
                      )
                    )
                  }
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>

            <div style={toggleRowWrapStyle}>
              <Toggle
                label="ACTIVE"
                checked={page.active}
                onChange={(checked) =>
                  setPages((current) =>
                    current.map((p) =>
                      p.id === page.id ? { ...p, active: checked } : p
                    )
                  )
                }
              />

              <Toggle
                label="SHOW IN NAV"
                checked={page.show_in_nav}
                onChange={(checked) =>
                  setPages((current) =>
                    current.map((p) =>
                      p.id === page.id ? { ...p, show_in_nav: checked } : p
                    )
                  )
                }
              />
            </div>

            <button
              style={primaryButtonStyle}
              onClick={() => savePage(page)}
            >
              SAVE PAGE
            </button>
          </section>
        ))}

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>SOCIAL LINKS</div>
          <h2 style={sectionTitleStyle}>Add Social Profile</h2>

          <div style={socialAddStyle}>
            <select
              value={newSocialPlatform}
              onChange={(e) => setNewSocialPlatform(e.target.value)}
              style={inputStyle}
            >
              {socialPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>

            <input
              value={newSocialUrl}
              onChange={(e) => setNewSocialUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />

            <button style={primaryButtonStyle} onClick={addSocial}>
              + ADD SOCIAL
            </button>
          </div>
        </section>

        {socials.map((social) => (
          <section key={social.id} style={sectionStyle}>
            <div style={socialRowStyle}>
              <select
                value={social.platform}
                onChange={(e) =>
                  setSocials((current) =>
                    current.map((s) =>
                      s.id === social.id
                        ? { ...s, platform: e.target.value }
                        : s
                    )
                  )
                }
                style={inputStyle}
              >
                {socialPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>

              <input
                value={social.url}
                onChange={(e) =>
                  setSocials((current) =>
                    current.map((s) =>
                      s.id === social.id ? { ...s, url: e.target.value } : s
                    )
                  )
                }
                style={inputStyle}
              />

              <input
                type="number"
                value={social.sort_order}
                onChange={(e) =>
                  setSocials((current) =>
                    current.map((s) =>
                      s.id === social.id
                        ? { ...s, sort_order: Number(e.target.value || 0) }
                        : s
                    )
                  )
                }
                style={smallInputStyle}
              />

              <Toggle
                label="ACTIVE"
                checked={social.active}
                onChange={(checked) =>
                  setSocials((current) =>
                    current.map((s) =>
                      s.id === social.id ? { ...s, active: checked } : s
                    )
                  )
                }
              />

              <button
                style={primaryButtonStyle}
                onClick={() => saveSocial(social)}
              >
                SAVE
              </button>

              <button
                style={dangerButtonStyle}
                onClick={() => deleteSocial(social.id)}
              >
                DELETE
              </button>
            </div>
          </section>
        ))}
      </div>
    </main>
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
    <div>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={toggleStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
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
  maxWidth: "1180px",
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

const sectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  fontSize: "28px",
  margin: "6px 0 20px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const socialAddStyle = {
  display: "grid",
  gridTemplateColumns: "220px 1fr auto",
  gap: "12px",
  alignItems: "end",
};

const socialRowStyle = {
  display: "grid",
  gridTemplateColumns: "180px 1fr 90px auto auto auto",
  gap: "10px",
  alignItems: "center",
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
};

const labelStyle = {
  display: "block",
  color: "#cbd5e1",
  fontSize: "11px",
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

const smallInputStyle = {
  ...inputStyle,
  width: "90px",
};

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 900,
};

const toggleRowWrapStyle = {
  display: "flex",
  gap: "18px",
  flexWrap: "wrap" as const,
  marginBottom: "16px",
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 16px",
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

const dangerButtonStyle = {
  background: "#3b1118",
  color: "#fecaca",
  border: "1px solid #7f1d1d",
  borderRadius: "10px",
  padding: "12px 14px",
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
