"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  cuisine_category: string | null;
};

type ProfilePreview = {
  name?: string;
  phone?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip?: string;
  cuisine_category?: string;
  hours?: Record<string, string>;
};

type MenuPreviewItem = {
  category: string;
  name: string;
  description?: string;
  price?: number | null;
};

export default function AdminRestaurantImportPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<"" | "profile" | "menu" | "apply">("");
  const [message, setMessage] = useState("");

  const [googleQuery, setGoogleQuery] = useState("");
  const [menuSourceUrl, setMenuSourceUrl] = useState("");

  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const [menuPreview, setMenuPreview] = useState<MenuPreviewItem[]>([]);
  const [selectedProfileFields, setSelectedProfileFields] = useState<Record<string, boolean>>({});
  const [selectedMenuRows, setSelectedMenuRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadRestaurant();
  }, []);

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/admin/login";
      return null;
    }

    return session.access_token;
  }

  async function loadRestaurant() {
    const restaurantId = new URLSearchParams(window.location.search).get("restaurant");

    if (!restaurantId) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    const token = await getToken();
    if (!token) return;

    const response = await fetch(
      `/api/admin/restaurant?restaurant_id=${encodeURIComponent(restaurantId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.restaurant) {
      setMessage(data.error || "Unable to load restaurant.");
      setLoading(false);
      return;
    }

    const r = data.restaurant as Restaurant;
    setRestaurant(r);

    const address = [r.address_line_1, r.city, r.state, r.zip]
      .filter(Boolean)
      .join(", ");

    setGoogleQuery(`${r.name}${address ? `, ${address}` : ""}`);

    const noteText = (data.notes || [])
      .map((note: { note?: string }) => note.note || "")
      .join("\n");

    const currentWebsiteMatch = noteText.match(/Current website:\s*(https?:\/\/\S+)/i);
    const orderingMatch = noteText.match(/Online ordering:\s*(https?:\/\/\S+)/i);

    setMenuSourceUrl(
      orderingMatch?.[1] ||
        currentWebsiteMatch?.[1] ||
        ""
    );

    setLoading(false);
  }

  async function previewProfile() {
    if (!restaurant) return;

    setRunning("profile");
    setMessage("");

    const token = await getToken();
    if (!token) return;

    const response = await fetch("/api/admin/import-restaurant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: restaurant.id,
        action: "preview_profile",
        google_query: googleQuery,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Business profile import failed.");
      setRunning("");
      return;
    }

    const preview = data.profile || {};
    setProfilePreview(preview);

    const fields: Record<string, boolean> = {};
    Object.keys(preview).forEach((key) => {
      if (key !== "hours") fields[key] = true;
    });
    if (preview.hours) fields.hours = true;

    setSelectedProfileFields(fields);
    setMessage("Business profile loaded. Review the changes below.");
    setRunning("");
  }

  async function previewMenu() {
    if (!restaurant) return;

    setRunning("menu");
    setMessage("");

    const token = await getToken();
    if (!token) return;

    const response = await fetch("/api/admin/import-restaurant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: restaurant.id,
        action: "preview_menu",
        menu_source_url: menuSourceUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Menu import failed.");
      setRunning("");
      return;
    }

    const rows = (data.menu || []) as MenuPreviewItem[];
    setMenuPreview(rows);

    const selected: Record<number, boolean> = {};
    rows.forEach((_, index) => {
      selected[index] = true;
    });

    setSelectedMenuRows(selected);
    setMessage(`Loaded ${rows.length} menu items for review.`);
    setRunning("");
  }

  async function applyChanges() {
    if (!restaurant) return;

    setRunning("apply");
    setMessage("");

    const token = await getToken();
    if (!token) return;

    const approvedProfile: Record<string, unknown> = {};

    if (profilePreview) {
      Object.entries(profilePreview).forEach(([key, value]) => {
        if (selectedProfileFields[key]) {
          approvedProfile[key] = value;
        }
      });
    }

    const approvedMenu = menuPreview.filter(
      (_, index) => selectedMenuRows[index]
    );

    const response = await fetch("/api/admin/import-restaurant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: restaurant.id,
        action: "apply",
        profile: approvedProfile,
        menu: approvedMenu,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to apply imported changes.");
      setRunning("");
      return;
    }

    setMessage(
      data.message ||
        "Approved business profile and menu changes were applied."
    );

    setRunning("");
  }

  const selectedMenuCount = useMemo(
    () =>
      Object.values(selectedMenuRows).filter(Boolean).length,
    [selectedMenuRows]
  );

  if (loading) {
    return <main style={pageStyle}><div style={shellStyle}>Loading import center...</div></main>;
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>{message || "Restaurant not found."}</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <button
              style={backButtonStyle}
              onClick={() =>
                (window.location.href = `/admin/restaurant?restaurant=${restaurant.id}`)
              }
            >
              ← RESTAURANT ACCOUNT
            </button>

            <div style={eyebrowStyle}>SUPER ADMIN IMPORT CENTER</div>
            <h1 style={titleStyle}>{restaurant.name}</h1>
            <p style={subStyle}>
              Pull source data, review it, then approve only the changes you want
              written into Restaurant OS.
            </p>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={twoColStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>BUSINESS PROFILE</div>
            <h2 style={cardTitleStyle}>Google Business Import</h2>
            <p style={helpStyle}>
              Use Google Business data for core restaurant information such as
              phone, address, category and operating hours.
            </p>

            <label style={fieldWrapStyle}>
              <span style={labelStyle}>GOOGLE BUSINESS SEARCH</span>
              <input
                value={googleQuery}
                onChange={(event) => setGoogleQuery(event.target.value)}
                style={inputStyle}
              />
            </label>

            <button
              style={primaryButtonStyle}
              disabled={running !== ""}
              onClick={previewProfile}
            >
              {running === "profile"
                ? "IMPORTING..."
                : "IMPORT BUSINESS PROFILE"}
            </button>

            {profilePreview && (
              <div style={reviewWrapStyle}>
                <div style={reviewTitleStyle}>REVIEW BUSINESS CHANGES</div>

                {Object.entries(profilePreview).map(([key, value]) => (
                  <label key={key} style={reviewRowStyle}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedProfileFields[key])}
                      onChange={(event) =>
                        setSelectedProfileFields((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    <div>
                      <div style={reviewLabelStyle}>
                        {key.replaceAll("_", " ").toUpperCase()}
                      </div>
                      <div style={reviewValueStyle}>
                        {typeof value === "object"
                          ? Object.entries(value || {})
                              .map(([day, hours]) => `${day}: ${hours}`)
                              .join(" • ")
                          : String(value || "—")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>MENU SOURCE</div>
            <h2 style={cardTitleStyle}>Import Current Menu</h2>
            <p style={helpStyle}>
              Use the restaurant's current ordering/menu source for structured
              categories, item names, descriptions and prices.
            </p>

            <label style={fieldWrapStyle}>
              <span style={labelStyle}>CURRENT MENU / ORDERING URL</span>
              <input
                value={menuSourceUrl}
                onChange={(event) => setMenuSourceUrl(event.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </label>

            <button
              style={primaryButtonStyle}
              disabled={running !== ""}
              onClick={previewMenu}
            >
              {running === "menu" ? "IMPORTING..." : "IMPORT MENU"}
            </button>

            {menuPreview.length > 0 && (
              <div style={menuReviewStyle}>
                <div style={reviewTitleStyle}>
                  REVIEW MENU · {selectedMenuCount} SELECTED
                </div>

                {menuPreview.map((item, index) => (
                  <label key={`${item.category}-${item.name}-${index}`} style={menuRowStyle}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedMenuRows[index])}
                      onChange={(event) =>
                        setSelectedMenuRows((current) => ({
                          ...current,
                          [index]: event.target.checked,
                        }))
                      }
                    />

                    <div style={{ flex: 1 }}>
                      <div style={menuCategoryStyle}>{item.category}</div>
                      <div style={menuItemLineStyle}>
                        <strong>{item.name}</strong>
                        <span>
                          {item.price === null || item.price === undefined
                            ? "—"
                            : `$${Number(item.price).toFixed(2)}`}
                        </span>
                      </div>
                      {item.description && (
                        <div style={menuDescriptionStyle}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </section>

        <section style={applyCardStyle}>
          <div>
            <div style={cardEyebrowStyle}>APPROVAL GATE</div>
            <h2 style={applyTitleStyle}>Apply Approved Changes</h2>
            <p style={helpStyle}>
              Nothing imported above changes the restaurant until you approve it
              here. This keeps migrations controlled and protects live customer data.
            </p>
          </div>

          <button
            style={applyButtonStyle}
            disabled={
              running !== "" ||
              (!profilePreview && menuPreview.length === 0)
            }
            onClick={applyChanges}
          >
            {running === "apply"
              ? "APPLYING..."
              : "APPROVE & UPDATE RESTAURANT OS"}
          </button>
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#fff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1260px",
  margin: "0 auto",
};

const headerStyle = {
  marginBottom: "20px",
};

const backButtonStyle = {
  background: "transparent",
  color: "#94a3b8",
  border: 0,
  padding: "0 0 14px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  margin: "7px 0",
  fontSize: "clamp(48px,7vw,78px)",
  lineHeight: ".92",
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  maxWidth: "760px",
  lineHeight: 1.6,
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))",
  gap: "16px",
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "22px",
};

const cardEyebrowStyle = {
  color: "#f5b82e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.5px",
};

const cardTitleStyle = {
  margin: "6px 0 10px",
  fontSize: "28px",
};

const helpStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.55,
};

const fieldWrapStyle = {
  display: "grid",
  gap: "7px",
  marginTop: "18px",
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const inputStyle = {
  width: "100%",
  background: "#08111f",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "13px",
};

const primaryButtonStyle = {
  width: "100%",
  marginTop: "12px",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "9px",
  padding: "13px",
  fontWeight: 900,
  cursor: "pointer",
};

const reviewWrapStyle = {
  marginTop: "18px",
  display: "grid",
  gap: "8px",
};

const reviewTitleStyle = {
  color: "#f5b82e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "3px",
};

const reviewRowStyle = {
  display: "grid",
  gridTemplateColumns: "20px 1fr",
  gap: "10px",
  alignItems: "start",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "9px",
  padding: "11px",
};

const reviewLabelStyle = {
  color: "#64748b",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: ".8px",
};

const reviewValueStyle = {
  color: "#e2e8f0",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "3px",
};

const menuReviewStyle = {
  marginTop: "18px",
  maxHeight: "560px",
  overflowY: "auto" as const,
  display: "grid",
  gap: "7px",
};

const menuRowStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "9px",
  padding: "11px",
};

const menuCategoryStyle = {
  color: "#f5b82e",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: ".8px",
  textTransform: "uppercase" as const,
};

const menuItemLineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  marginTop: "4px",
  fontSize: "12px",
};

const menuDescriptionStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: 1.45,
  marginTop: "5px",
};

const applyCardStyle = {
  marginTop: "16px",
  background: "#10253a",
  border: "1px solid #36516c",
  borderRadius: "16px",
  padding: "22px",
};

const applyTitleStyle = {
  margin: "6px 0 7px",
  fontSize: "30px",
};

const applyButtonStyle = {
  width: "100%",
  marginTop: "12px",
  background: "#22c55e",
  color: "#052e16",
  border: 0,
  borderRadius: "9px",
  padding: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  marginBottom: "16px",
  background: "#13263b",
  border: "1px solid #2d4661",
  color: "#dbeafe",
  borderRadius: "10px",
  padding: "11px",
  fontSize: "12px",
};
