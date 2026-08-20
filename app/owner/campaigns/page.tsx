"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Offer = {
  id: string;
  name: string;
  headline: string;
};

type Campaign = {
  id: string;
  restaurant_id: string;
  offer_id: string | null;
  name: string;
  channel: string;
  audience: string;
  message: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export default function OwnerCampaignsPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [channel, setChannel] = useState("sms");
  const [audience, setAudience] = useState("all_vips");
  const [offerId, setOfferId] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [status, setStatus] = useState("draft");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

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
      .select("id,name,slug")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);
    setRestaurantSlug(restaurant.slug);

    const [offersResult, campaignsResult] = await Promise.all([
      supabase
        .from("restaurant_vip_offers")
        .select("id,name,headline")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("restaurant_campaigns")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (offersResult.error) {
      setMessage(offersResult.error.message);
      setLoading(false);
      return;
    }

    if (campaignsResult.error) {
      setMessage(campaignsResult.error.message);
      setLoading(false);
      return;
    }

    setOffers(offersResult.data || []);
    setCampaigns(campaignsResult.data || []);
    setLoading(false);
  }

  async function createCampaign() {
    if (!name.trim()) {
      setMessage("Campaign name is required.");
      return;
    }

    const { error } = await supabase.from("restaurant_campaigns").insert({
      restaurant_id: restaurantId,
      offer_id: offerId || null,
      name: name.trim(),
      channel,
      audience,
      message: campaignMessage.trim() || null,
      status,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setName("");
    setChannel("sms");
    setAudience("all_vips");
    setOfferId("");
    setCampaignMessage("");
    setStatus("draft");
    setStartsAt("");
    setEndsAt("");
    setMessage("Campaign created.");
    await load();
  }

  async function saveCampaign(campaign: Campaign) {
    const { error } = await supabase
      .from("restaurant_campaigns")
      .update({
        offer_id: campaign.offer_id || null,
        name: campaign.name,
        channel: campaign.channel,
        audience: campaign.audience,
        message: campaign.message,
        status: campaign.status,
        starts_at: campaign.starts_at,
        ends_at: campaign.ends_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id)
      .eq("restaurant_id", restaurantId);

    setMessage(error ? error.message : "Campaign saved.");
  }

  async function deleteCampaign(campaign: Campaign) {
    if (!window.confirm(`Delete "${campaign.name}"?`)) return;

    const { error } = await supabase
      .from("restaurant_campaigns")
      .delete()
      .eq("id", campaign.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCampaigns((current) => current.filter((c) => c.id !== campaign.id));
  }

  function updateCampaign(id: string, patch: Partial<Campaign>) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === id ? { ...campaign, ...patch } : campaign
      )
    );
  }

  function getOfferLabel(id: string | null) {
    const offer = offers.find((item) => item.id === id);
    return offer?.headline || offer?.name || "No offer attached";
  }

  function campaignClaimLink(campaign: Campaign) {
    if (!restaurantSlug || !campaign.offer_id) return "";

    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://restaurant-os-mvp.vercel.app";

    return `${base}/r/${restaurantSlug}/offers/${campaign.offer_id}?campaign=${campaign.id}`;
  }

  async function copyCampaignLink(campaign: Campaign) {
    const link = campaignClaimLink(campaign);

    if (!link) {
      setMessage("Attach an offer before generating a campaign claim link.");
      return;
    }

    await navigator.clipboard.writeText(link);
    setMessage("Campaign claim link copied.");
  }

  const stats = useMemo(() => {
    return {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === "active").length,
      draft: campaigns.filter((c) => c.status === "draft").length,
      completed: campaigns.filter((c) => c.status === "completed").length,
    };
  }, [campaigns]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading campaigns...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Campaigns</h1>
            <p style={subStyle}>
              {restaurantName} — connect an audience, message and offer so every claim can be attributed.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner/campaign-results?restaurant=${restaurantId}`)
              }
            >
              VIEW RESULTS
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
          <Stat label="TOTAL" value={stats.total} />
          <Stat label="ACTIVE" value={stats.active} />
          <Stat label="DRAFT" value={stats.draft} />
          <Stat label="COMPLETED" value={stats.completed} />
        </section>

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>NEW CAMPAIGN</div>
          <h2 style={sectionTitleStyle}>Create Campaign</h2>

          <div style={formGridStyle}>
            <Field
              label="CAMPAIGN NAME"
              value={name}
              onChange={setName}
              placeholder="Tuesday Comeback SMS"
            />

            <div>
              <label style={labelStyle}>CHANNEL</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={inputStyle}
              >
                <option value="sms">SMS</option>
                <option value="email">EMAIL</option>
                <option value="sms_email">SMS + EMAIL</option>
                <option value="social">SOCIAL</option>
                <option value="website">WEBSITE</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>AUDIENCE</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={inputStyle}
              >
                <option value="all_vips">ALL VIPS</option>
                <option value="sms_opt_ins">SMS OPT-INS</option>
                <option value="email_opt_ins">EMAIL OPT-INS</option>
                <option value="birthdays">BIRTHDAYS</option>
                <option value="inactive_vips">INACTIVE VIPS</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>ATTACHED OFFER</label>
              <select
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
                style={inputStyle}
              >
                <option value="">NO OFFER</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.headline || offer.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>CAMPAIGN MESSAGE</label>
              <textarea
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                rows={4}
                placeholder="Come back this Tuesday and claim $5 off $25..."
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </div>

            <div>
              <label style={labelStyle}>STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="draft">DRAFT</option>
                <option value="active">ACTIVE</option>
                <option value="paused">PAUSED</option>
                <option value="completed">COMPLETED</option>
              </select>
            </div>

            <Field
              label="STARTS"
              value={startsAt}
              onChange={setStartsAt}
              type="datetime-local"
            />

            <Field
              label="ENDS"
              value={endsAt}
              onChange={setEndsAt}
              type="datetime-local"
            />
          </div>

          <button style={primaryButtonStyle} onClick={createCampaign}>
            + CREATE CAMPAIGN
          </button>
        </section>

        {campaigns.map((campaign) => (
          <section key={campaign.id} style={sectionStyle}>
            <div style={campaignTopStyle}>
              <div>
                <div style={campaignNameStyle}>{campaign.name}</div>
                <div style={campaignOfferStyle}>
                  {getOfferLabel(campaign.offer_id)}
                </div>
              </div>

              <div style={statusBadgeStyle}>{campaign.status.toUpperCase()}</div>
            </div>

            <div style={formGridStyle}>
              <Field
                label="CAMPAIGN NAME"
                value={campaign.name}
                onChange={(value) =>
                  updateCampaign(campaign.id, { name: value })
                }
              />

              <div>
                <label style={labelStyle}>CHANNEL</label>
                <select
                  value={campaign.channel}
                  onChange={(e) =>
                    updateCampaign(campaign.id, { channel: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="sms">SMS</option>
                  <option value="email">EMAIL</option>
                  <option value="sms_email">SMS + EMAIL</option>
                  <option value="social">SOCIAL</option>
                  <option value="website">WEBSITE</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>AUDIENCE</label>
                <select
                  value={campaign.audience}
                  onChange={(e) =>
                    updateCampaign(campaign.id, { audience: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="all_vips">ALL VIPS</option>
                  <option value="sms_opt_ins">SMS OPT-INS</option>
                  <option value="email_opt_ins">EMAIL OPT-INS</option>
                  <option value="birthdays">BIRTHDAYS</option>
                  <option value="inactive_vips">INACTIVE VIPS</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>ATTACHED OFFER</label>
                <select
                  value={campaign.offer_id || ""}
                  onChange={(e) =>
                    updateCampaign(campaign.id, {
                      offer_id: e.target.value || null,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">NO OFFER</option>
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {offer.headline || offer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>CAMPAIGN MESSAGE</label>
                <textarea
                  value={campaign.message || ""}
                  onChange={(e) =>
                    updateCampaign(campaign.id, { message: e.target.value })
                  }
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>

              <div>
                <label style={labelStyle}>STATUS</label>
                <select
                  value={campaign.status}
                  onChange={(e) =>
                    updateCampaign(campaign.id, { status: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="draft">DRAFT</option>
                  <option value="active">ACTIVE</option>
                  <option value="paused">PAUSED</option>
                  <option value="completed">COMPLETED</option>
                </select>
              </div>
            </div>

            <div style={linkPanelStyle}>
              <div style={eyebrowStyle}>CAMPAIGN CLAIM LINK</div>

              {campaign.offer_id ? (
                <>
                  <div style={linkValueStyle}>
                    {campaignClaimLink(campaign)}
                  </div>

                  <div style={buttonRowStyle}>
                    <button
                      style={primaryButtonStyle}
                      onClick={() => copyCampaignLink(campaign)}
                    >
                      COPY CLAIM LINK
                    </button>

                    <button
                      style={secondaryButtonStyle}
                      onClick={() => {
                        const link = campaignClaimLink(campaign);
                        if (link) window.open(link, "_blank");
                      }}
                    >
                      OPEN LINK
                    </button>
                  </div>
                </>
              ) : (
                <div style={linkHelpStyle}>
                  Attach an offer to this campaign to generate a trackable claim link.
                </div>
              )}
            </div>

            <div style={buttonRowStyle}>
              <button
                style={primaryButtonStyle}
                onClick={() => saveCampaign(campaign)}
              >
                SAVE CAMPAIGN
              </button>

              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/campaign-results?restaurant=${restaurantId}`)
                }
              >
                VIEW RESULTS
              </button>

              <button
                style={dangerButtonStyle}
                onClick={() => deleteCampaign(campaign)}
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

const campaignTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "18px",
};

const campaignNameStyle = {
  fontSize: "24px",
  fontWeight: 900,
};

const campaignOfferStyle = {
  color: "#94a3b8",
  marginTop: "5px",
};

const statusBadgeStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "999px",
  padding: "8px 11px",
  fontSize: "10px",
  fontWeight: 900,
};

const linkPanelStyle = {
  background: "#08111f",
  border: "1px solid #334155",
  borderRadius: "14px",
  padding: "18px",
  marginBottom: "18px",
};

const linkValueStyle = {
  background: "#0a1522",
  border: "1px solid #23364d",
  borderRadius: "10px",
  padding: "13px",
  margin: "10px 0 12px",
  color: "#cbd5e1",
  fontSize: "12px",
  lineHeight: 1.5,
  wordBreak: "break-all" as const,
};

const linkHelpStyle = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
  marginTop: "8px",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};
