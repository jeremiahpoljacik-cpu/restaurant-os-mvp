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

export default function OwnerSettingsPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding>({
    primary_color: "",
    secondary_color: "",
    tagline: "",
    short_description: "",
  });
  const [hours, setHours] = useState<Hours>({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  });
  const [ordering, setOrdering] = useState<Ordering>({
    online_ordering_url: "",
    catering_email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
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
          primary_color: brandingData.primary_color || "",
          secondary_color: brandingData.secondary_color || "",
          tagline: brandingData.tagline || "",
          short_description: brandingData.short_description || "",
        });
      }

      const { data: hoursData } = await supabase
        .from("restaurant_hours")
        .select("*")
        .eq("restaurant_id", id)
        .maybeSingle();

      if (hoursData) {
        setHours({
          monday: hoursData.monday || "",
          tuesday: hoursData.tuesday || "",
          wednesday: hoursData.wednesday || "",
          thursday: hoursData.thursday || "",
          friday: hoursData.friday || "",
          saturday: hoursData.saturday || "",
          sunday: hoursData.sunday || "",
        });
      }

      const { data: orderingData } = await supabase
        .from("restaurant_ordering")
        .select("*")
        .eq("restaurant_id", id)
        .maybeSingle();

      if (orderingData) {
        setOrdering({
          online_ordering_url: orderingData.online_ordering_url || "",
          catering_email: orderingData.catering_email || "",
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  async function saveSettings() {
    if (!restaurant || !restaurantId) return;

    setSaving(true);
    setMessage("");

    try {
      const { error: restaurantError } = await supabase
        .from("restaurants")
        .update({
          name: restaurant.name,
          cuisine_category: restaurant.cuisine_category,
          phone: restaurant.phone,
          address_line_1: restaurant.address_line_1,
          city: restaurant.city,
          state: restaurant.state,
          zip: restaurant.zip,
        })
        .eq("id", restaurantId);

      if (restaurantError) throw restaurantError;

      const { error: brandingError } = await supabase
        .from("restaurant_branding")
        .upsert({
          restaurant_id: restaurantId,
          ...branding,
        });

      if (brandingError) throw brandingError;

      const { error: hoursError } = await supabase
        .from("restaurant_hours")
        .upsert({
          restaurant_id: restaurantId,
          ...hours,
        });

      if (hoursError) throw hoursError;

      const { error: orderingError } = await supabase
        .from("restaurant_ordering")
        .upsert({
          restaurant_id: restaurantId,
          ...ordering,
        });

      if (orderingError) throw orderingError;

      setMessage("Settings saved.");
    } catch (err: any) {
      setMessage(err?.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading settings...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>{message}</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Business Settings</h1>
            <p style={subStyle}>
              Control the information that powers your restaurant website.
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
        </div>

        {message && (
          <div style={messageStyle}>{message}</div>
        )}

        <section style={sectionStyle}>
          <SectionTitle title="Restaurant Information" />

          <Field
            label="RESTAURANT NAME"
            value={restaurant.name}
            onChange={(value) =>
              setRestaurant({ ...restaurant, name: value })
            }
          />

          <Field
            label="CUISINE / CATEGORY"
            value={restaurant.cuisine_category || ""}
            onChange={(value) =>
              setRestaurant({
                ...restaurant,
                cuisine_category: value,
              })
            }
          />

          <Field
            label="PHONE"
            value={restaurant.phone || ""}
            onChange={(value) =>
              setRestaurant({ ...restaurant, phone: value })
            }
          />

          <Field
            label="ADDRESS"
            value={restaurant.address_line_1 || ""}
            onChange={(value) =>
              setRestaurant({
                ...restaurant,
                address_line_1: value,
              })
            }
          />

          <div style={threeColStyle}>
            <Field
              label="CITY"
              value={restaurant.city || ""}
              onChange={(value) =>
                setRestaurant({ ...restaurant, city: value })
              }
            />

            <Field
              label="STATE"
              value={restaurant.state || ""}
              onChange={(value) =>
                setRestaurant({ ...restaurant, state: value })
              }
            />

            <Field
              label="ZIP"
              value={restaurant.zip || ""}
              onChange={(value) =>
                setRestaurant({ ...restaurant, zip: value })
              }
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <SectionTitle title="Brand & Website" />

          <div style={twoColStyle}>
            <Field
              label="PRIMARY COLOR"
              value={branding.primary_color || ""}
              onChange={(value) =>
                setBranding({
                  ...branding,
                  primary_color: value,
                })
              }
            />

            <Field
              label="SECONDARY COLOR"
              value={branding.secondary_color || ""}
              onChange={(value) =>
                setBranding({
                  ...branding,
                  secondary_color: value,
                })
              }
            />
          </div>

          <Field
            label="TAGLINE"
            value={branding.tagline || ""}
            onChange={(value) =>
              setBranding({
                ...branding,
                tagline: value,
              })
            }
          />

          <Field
            label="SHORT DESCRIPTION"
            value={branding.short_description || ""}
            onChange={(value) =>
              setBranding({
                ...branding,
                short_description: value,
              })
            }
          />
        </section>

        <section style={sectionStyle}>
          <SectionTitle title="Restaurant Hours" />

          {Object.keys(hours).map((day) => (
            <Field
              key={day}
              label={day.toUpperCase()}
              value={hours[day as keyof Hours] || ""}
              onChange={(value) =>
                setHours({
                  ...hours,
                  [day]: value,
                })
              }
            />
          ))}
        </section>

        <section style={sectionStyle}>
          <SectionTitle title="Ordering & Catering" />

          <Field
            label="ONLINE ORDERING URL"
            value={ordering.online_ordering_url || ""}
            onChange={(value) =>
              setOrdering({
                ...ordering,
                online_ordering_url: value,
              })
            }
          />

          <Field
            label="CATERING EMAIL"
            value={ordering.catering_email || ""}
            onChange={(value) =>
              setOrdering({
                ...ordering,
                catering_email: value,
              })
            }
          />
        </section>

        <button
          style={saveButtonStyle}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? "SAVING..." : "SAVE ALL SETTINGS"}
        </button>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={eyebrowStyle}>OWNER CONTROL</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={labelStyle}>{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
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
  maxWidth: "1000px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "28px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(42px, 7vw, 72px)",
  margin: "8px 0",
  lineHeight: ".95",
  fontWeight: 900,
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const sectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "26px",
  marginBottom: "20px",
};

const sectionTitleStyle = {
  fontSize: "28px",
  margin: "8px 0 0",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 900,
  color: "#cbd5e1",
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
  padding: "14px",
  fontSize: "15px",
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "16px",
};

const threeColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: "16px",
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

const saveButtonStyle = {
  width: "100%",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "12px",
  padding: "17px",
  fontWeight: 900,
  fontSize: "15px",
  cursor: "pointer",
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};

