"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Offer = {
  id: string;
  restaurant_id: string;
  name: string;
  headline: string;
  description: string | null;
  terms: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

export default function OwnerOffersPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [terms, setTerms] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);

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

    const { data, error } = await supabase
      .from("restaurant_vip_offers")
      .select("*")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setOffers(data || []);
    setLoading(false);
  }

  async function createOffer() {
    if (!name.trim() || !headline.trim()) {
      setMessage("Offer name and headline are required.");
      return;
    }

    const { error } = await supabase.from("restaurant_vip_offers").insert({
      restaurant_id: restaurantId,
      name: name.trim(),
      headline: headline.trim(),
      description: description.trim() || null,
      terms: terms.trim() || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setName("");
    setHeadline("");
    setDescription("");
    setTerms("");
    setExpiresAt("");
    setActive(true);
    setMessage("Offer created.");
    await load();
  }

  async function saveOffer(offer: Offer) {
    const { error } = await supabase
      .from("restaurant_vip_offers")
      .update({
        name: offer.name,
        headline: offer.headline,
        description: offer.description,
        terms: offer.terms,
        expires_at: offer.expires_at,
        active: offer.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.id)
      .eq("restaurant_id", restaurantId);

    setMessage(error ? error.message : "Offer saved.");
  }

  async function deleteOffer(offer: Offer) {
    if (!window.confirm(`Delete "${offer.name}"?`)) return;

    const { error } = await supabase
      .from("restaurant_vip_offers")
      .delete()
      .eq("id", offer.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setOffers((current) => current.filter((o) => o.id !== offer.id));
  }

  const stats = useMemo(() => {
    const now = Date.now();

    const activeOffers = offers.filter((offer) => {
      if (!offer.active) return false;
      if (!offer.expires_at) return true;
      return new Date(offer.expires_at).getTime() > now;
    }).length;

    const expiredOffers = offers.filter((offer) => {
      if (!offer.expires_at) return false;
      return new Date(offer.expires_at).getTime() <= now;
    }).length;

    return {
      total: offers.length,
      active: activeOffers,
      expired: expiredOffers,
    };
  }, [offers]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading offers...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Offers</h1>
            <p style={subStyle}>
              {restaurantName} — create promotions for your VIP customers.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner/redeem?restaurant=${restaurantId}`)
              }
            >
              REDEMPTION CENTER
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

        <section style={statsGridStyle}>
          <Stat label="TOTAL OFFERS" value={stats.total} />
          <Stat label="ACTIVE" value={stats.active} />
          <Stat label="EXPIRED" value={stats.expired} />
        </section>

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>NEW OFFER</div>
          <h2 style={sectionTitleStyle}>Create Promotion</h2>

          <div style={formGridStyle}>
            <Field
              label="INTERNAL OFFER NAME"
              value={name}
              onChange={setName}
              placeholder="Tuesday Comeback Offer"
            />

            <Field
              label="CUSTOMER HEADLINE"
              value={headline}
              onChange={setHeadline}
              placeholder="$5 OFF YOUR NEXT VISIT"
            />

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Come back this week and save on your next meal."
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>TERMS / FINE PRINT</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="One per table. Cannot be combined with other offers."
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </div>

            <Field
              label="EXPIRATION DATE"
              value={expiresAt}
              onChange={setExpiresAt}
              type="datetime-local"
            />

            <label style={toggleStyle}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              ACTIVE
            </label>
          </div>

          <button style={primaryButtonStyle} onClick={createOffer}>
            + CREATE OFFER
          </button>
        </section>

        {offers.length === 0 ? (
          <section style={emptyStyle}>
            <div style={emptyTitleStyle}>No offers yet.</div>
            <div style={emptyTextStyle}>
              Create your first promotion above.
            </div>
          </section>
        ) : (
          <section style={listStyle}>
            {offers.map((offer) => (
              <article key={offer.id} style={offerCardStyle}>
                <div style={offerTopStyle}>
                  <div>
                    <div style={offerNameStyle}>{offer.name}</div>
                    <div style={offerHeadlineStyle}>{offer.headline}</div>
                  </div>

                  <div
                    style={{
                      ...statusBadgeStyle,
                      background: offer.active ? "#12351f" : "#262d37",
                      color: offer.active ? "#86efac" : "#94a3b8",
                    }}
                  >
                    {offer.active ? "ACTIVE" : "PAUSED"}
                  </div>
                </div>

                <div style={formGridStyle}>
                  <Field
                    label="OFFER NAME"
                    value={offer.name}
                    onChange={(value) =>
                      setOffers((current) =>
                        current.map((o) =>
                          o.id === offer.id ? { ...o, name: value } : o
                        )
                      )
                    }
                  />

                  <Field
                    label="HEADLINE"
                    value={offer.headline}
                    onChange={(value) =>
                      setOffers((current) =>
                        current.map((o) =>
                          o.id === offer.id ? { ...o, headline: value } : o
                        )
                      )
                    }
                  />

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>DESCRIPTION</label>
                    <textarea
                      value={offer.description || ""}
                      onChange={(e) =>
                        setOffers((current) =>
                          current.map((o) =>
                            o.id === offer.id
                              ? { ...o, description: e.target.value }
                              : o
                          )
                        )
                      }
                      rows={4}
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>TERMS</label>
                    <textarea
                      value={offer.terms || ""}
                      onChange={(e) =>
                        setOffers((current) =>
                          current.map((o) =>
                            o.id === offer.id
                              ? { ...o, terms: e.target.value }
                              : o
                          )
                        )
                      }
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </div>

                  <Field
                    label="EXPIRES"
                    value={
                      offer.expires_at
                        ? new Date(offer.expires_at)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                    onChange={(value) =>
                      setOffers((current) =>
                        current.map((o) =>
                          o.id === offer.id
                            ? {
                                ...o,
                                expires_at: value
                                  ? new Date(value).toISOString()
                                  : null,
                              }
                            : o
                        )
                      )
                    }
                    type="datetime-local"
                  />

                  <label style={toggleStyle}>
                    <input
                      type="checkbox"
                      checked={offer.active}
                      onChange={(e) =>
                        setOffers((current) =>
                          current.map((o) =>
                            o.id === offer.id
                              ? { ...o, active: e.target.checked }
                              : o
                          )
                        )
                      }
                    />
                    ACTIVE
                  </label>
                </div>

                <div style={buttonRowStyle}>
                  <button
                    style={primaryButtonStyle}
                    onClick={() => saveOffer(offer)}
                  >
                    SAVE OFFER
                  </button>

                  <button
                    style={dangerButtonStyle}
                    onClick={() => deleteOffer(offer)}
                  >
                    DELETE
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const statStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "20px",
};

const statValueStyle = {
  color: "#f5b82e",
  fontSize: "34px",
  fontWeight: 900,
};

const statLabelStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
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

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 900,
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

const listStyle = {
  display: "grid",
  gap: "14px",
};

const offerCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
};

const offerTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap" as const,
  marginBottom: "18px",
};

const offerNameStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const offerHeadlineStyle = {
  fontSize: "24px",
  fontWeight: 900,
  marginTop: "5px",
};

const statusBadgeStyle = {
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "10px",
  fontWeight: 900,
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const emptyStyle = {
  background: "#0f1d2e",
  border: "1px dashed #334155",
  borderRadius: "18px",
  padding: "48px 24px",
  textAlign: "center" as const,
};

const emptyTitleStyle = {
  fontSize: "22px",
  fontWeight: 900,
};

const emptyTextStyle = {
  color: "#64748b",
  marginTop: "8px",
};
