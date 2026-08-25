"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  owner_user_id: string;
};

type QrRow = {
  id: string;
  restaurant_id: string;
  qr_type: "vip" | "review";
  label: string;
  destination_url: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function qrImageUrl(destination: string, size = 520) {
  const params = new URLSearchParams({
    text: destination,
    size: String(size),
    margin: "4",
    format: "png",
    ecLevel: "H",
    dark: "111111",
    light: "ffffff",
  });
  return `https://quickchart.io/qr?${params.toString()}`;
}

function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "restaurant-qr"
  );
}

export default function OwnerQrCodesPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [rows, setRows] = useState<QrRow[]>([]);
  const [type, setType] = useState<"vip" | "review">("vip");
  const [label, setLabel] = useState("VIP Club");
  const [reviewUrl, setReviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [message, setMessage] = useState("");

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
      window.location.href = "/login";
      return;
    }

    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name,slug,owner_user_id")
      .eq("id", id)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    if (restaurantData.owner_user_id !== user.id) {
      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("user_id,active")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (!adminRow) {
        setMessage("Restaurant access denied.");
        setLoading(false);
        return;
      }
    }

    setRestaurant(restaurantData as Restaurant);

    const { data: qrRows, error: qrError } = await supabase
      .from("restaurant_qr_codes")
      .select("*")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false });

    if (qrError) {
      setMessage(qrError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const loaded = (qrRows || []) as QrRow[];
    setRows(loaded);

    const lastReview = loaded.find((row) => row.qr_type === "review");
    if (lastReview) {
      setReviewUrl(lastReview.destination_url);
    }

    setLoading(false);
  }

  const vipUrl = useMemo(() => {
    if (!restaurant?.slug || typeof window === "undefined") return "";
    return `${window.location.origin}/r/${restaurant.slug}/vip`;
  }, [restaurant?.slug]);

  const destination = type === "vip" ? vipUrl : reviewUrl.trim();

  const previewUrl = useMemo(() => {
    return destination ? qrImageUrl(destination) : "";
  }, [destination]);

  function changeType(next: "vip" | "review") {
    setType(next);
    setLabel(next === "vip" ? "VIP Club" : "Google Reviews");
    setMessage("");
  }

  function validHttpUrl(value: string) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function saveQr() {
    if (!restaurantId || !restaurant) return;

    if (!label.trim()) {
      setMessage("Give this QR code a label.");
      return;
    }

    if (!destination) {
      setMessage(
        type === "vip"
          ? "This restaurant needs a public slug before a VIP QR can be generated."
          : "Paste the restaurant's Google review link first."
      );
      return;
    }

    if (!validHttpUrl(destination)) {
      setMessage("Enter a valid destination URL beginning with http:// or https://.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("restaurant_qr_codes")
      .insert({
        restaurant_id: restaurantId,
        qr_type: type,
        label: label.trim(),
        destination_url: destination,
        active: true,
      })
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRows((current) => [data as QrRow, ...current]);
    setMessage(
      type === "vip"
        ? "VIP QR saved. Scan-test it, then download for tables, menus, receipts or takeout bags."
        : "Review QR saved. Scan-test it and confirm it opens the correct Google review page."
    );
  }

  async function downloadQr(row: Pick<QrRow, "id" | "label" | "destination_url">) {
    setDownloading(row.id);
    setMessage("");

    try {
      const response = await fetch(qrImageUrl(row.destination_url, 1200));

      if (!response.ok) {
        throw new Error("QR image could not be generated.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${safeFileName(`${restaurant?.name || "restaurant"}-${row.label}`)}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "QR download failed. Open the QR image and save it manually."
      );
    } finally {
      setDownloading("");
    }
  }

  async function downloadCurrent() {
    if (!destination) {
      setMessage("Create a destination first.");
      return;
    }

    await downloadQr({
      id: "preview",
      label: label.trim() || type,
      destination_url: destination,
    });
  }

  async function copyDestination(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Destination link copied.");
    } catch {
      setMessage("Could not copy automatically. Select the link and copy it.");
    }
  }

  async function deleteQr(row: QrRow) {
    if (!window.confirm(`Delete "${row.label}"?`)) return;

    const { error } = await supabase
      .from("restaurant_qr_codes")
      .delete()
      .eq("id", row.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRows((current) => current.filter((item) => item.id !== row.id));
    setMessage("QR code removed.");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading QR Code Generator...</div>
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

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS · GROWTH TOOLS</div>
            <h1 style={titleStyle}>QR Code Generator</h1>
            <p style={subStyle}>
              {restaurant.name} — turn foot traffic into VIP customers and more reviews.
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

        <section style={purposeGridStyle}>
          <button
            type="button"
            onClick={() => changeType("vip")}
            style={{
              ...purposeCardStyle,
              ...(type === "vip" ? purposeCardActiveStyle : {}),
            }}
          >
            <div style={purposeNumberStyle}>01</div>
            <div style={purposeTitleStyle}>Grow My VIP List</div>
            <div style={purposeTextStyle}>
              Send guests directly to this restaurant's VIP signup page. Every signup
              flows into the existing customer database.
            </div>
            <div style={purposePillStyle}>VIP CAPTURE</div>
          </button>

          <button
            type="button"
            onClick={() => changeType("review")}
            style={{
              ...purposeCardStyle,
              ...(type === "review" ? purposeCardActiveStyle : {}),
            }}
          >
            <div style={purposeNumberStyle}>02</div>
            <div style={purposeTitleStyle}>Get More Reviews</div>
            <div style={purposeTextStyle}>
              Send guests straight to the restaurant's Google review page.
            </div>
            <div style={purposePillStyle}>REPUTATION</div>
          </button>
        </section>

        <section style={builderGridStyle}>
          <div style={builderCardStyle}>
            <div style={eyebrowStyle}>
              {type === "vip" ? "VIP QR" : "REVIEW QR"}
            </div>
            <h2 style={sectionTitleStyle}>
              {type === "vip" ? "Build Your VIP Capture Code" : "Build Your Review Code"}
            </h2>

            <label style={labelStyle}>QR CODE LABEL</label>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              style={inputStyle}
              placeholder={type === "vip" ? "Front Counter VIP" : "Receipt Review QR"}
            />

            {type === "review" ? (
              <>
                <label style={labelStyle}>GOOGLE REVIEW LINK</label>
                <input
                  value={reviewUrl}
                  onChange={(event) => setReviewUrl(event.target.value)}
                  style={inputStyle}
                  placeholder="https://g.page/r/.../review"
                />
                <div style={helpStyle}>
                  Paste the direct Google review URL for this restaurant. We intentionally
                  keep V1 to one review destination.
                </div>
              </>
            ) : (
              <>
                <label style={labelStyle}>VIP SIGNUP DESTINATION</label>
                <div style={readonlyStyle}>
                  {vipUrl || "Restaurant slug is missing."}
                </div>
                <div style={helpStyle}>
                  This uses the public VIP signup flow already connected to the restaurant's
                  customer database.
                </div>
              </>
            )}

            <div style={actionRowStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={saveQr}
                disabled={saving}
              >
                {saving ? "SAVING..." : "SAVE QR CODE"}
              </button>

              <button
                type="button"
                style={outlineButtonStyle}
                onClick={downloadCurrent}
                disabled={!destination || downloading === "preview"}
              >
                {downloading === "preview" ? "DOWNLOADING..." : "DOWNLOAD PNG"}
              </button>
            </div>
          </div>

          <div style={previewCardStyle}>
            <div style={eyebrowStyle}>LIVE QR PREVIEW</div>

            {previewUrl ? (
              <>
                <div style={qrFrameStyle}>
                  <img
                    src={previewUrl}
                    alt={`${label || "Restaurant"} QR code`}
                    style={qrImageStyle}
                  />
                </div>

                <div style={previewLabelStyle}>{label || "Untitled QR"}</div>
                <div style={destinationStyle}>{destination}</div>

                <div style={actionRowStyle}>
                  <button
                    type="button"
                    style={outlineButtonStyle}
                    onClick={() => copyDestination(destination)}
                  >
                    COPY LINK
                  </button>
                  <button
                    type="button"
                    style={outlineButtonStyle}
                    onClick={() =>
                      window.open(destination, "_blank", "noopener,noreferrer")
                    }
                  >
                    TEST DESTINATION ↗
                  </button>
                </div>
              </>
            ) : (
              <div style={emptyPreviewStyle}>
                {type === "review"
                  ? "Paste a Google review link to generate the QR."
                  : "A public restaurant slug is required to generate the VIP QR."}
              </div>
            )}

            <div style={scanWarningStyle}>
              ALWAYS SCAN-TEST BEFORE PRINTING
            </div>
          </div>
        </section>

        <section style={savedSectionStyle}>
          <div>
            <div style={eyebrowStyle}>SAVED QR CODES</div>
            <h2 style={sectionTitleStyle}>Restaurant QR Library</h2>
            <p style={subStyle}>
              Keep separate codes for tables, menus, receipts, takeout bags or other placements.
            </p>
          </div>

          {rows.length === 0 ? (
            <div style={emptyLibraryStyle}>No saved QR codes yet.</div>
          ) : (
            <div style={savedGridStyle}>
              {rows.map((row) => (
                <article key={row.id} style={savedCardStyle}>
                  <img
                    src={qrImageUrl(row.destination_url, 260)}
                    alt={`${row.label} QR`}
                    style={savedQrStyle}
                  />

                  <div style={savedBodyStyle}>
                    <div style={savedTypeStyle}>
                      {row.qr_type === "vip" ? "VIP CAPTURE" : "GOOGLE REVIEWS"}
                    </div>
                    <h3 style={savedTitleStyle}>{row.label}</h3>
                    <div style={savedUrlStyle}>{row.destination_url}</div>

                    <div style={savedActionRowStyle}>
                      <button
                        style={smallButtonStyle}
                        onClick={() => downloadQr(row)}
                      >
                        {downloading === row.id ? "DOWNLOADING..." : "DOWNLOAD"}
                      </button>
                      <button
                        style={smallButtonStyle}
                        onClick={() => copyDestination(row.destination_url)}
                      >
                        COPY LINK
                      </button>
                      <button
                        style={smallDangerButtonStyle}
                        onClick={() => deleteQr(row)}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
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
  maxWidth: "1240px",
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
  fontSize: "clamp(44px,7vw,76px)",
  lineHeight: ".94",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "15px",
  lineHeight: 1.55,
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
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

const purposeGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const purposeCardStyle = {
  textAlign: "left" as const,
  background: "#0f1d2e",
  color: "#ffffff",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  cursor: "pointer",
};

const purposeCardActiveStyle = {
  border: "1px solid #f5b82e",
  background: "#13263b",
  boxShadow: "0 0 0 1px rgba(245,184,46,.08)",
};

const purposeNumberStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const purposeTitleStyle = {
  fontSize: "26px",
  fontWeight: 900,
  marginTop: "8px",
};

const purposeTextStyle = {
  color: "#94a3b8",
  lineHeight: 1.55,
  marginTop: "8px",
  minHeight: "50px",
};

const purposePillStyle = {
  display: "inline-block",
  marginTop: "14px",
  border: "1px solid #37516c",
  borderRadius: "999px",
  padding: "6px 9px",
  color: "#cbd5e1",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const builderGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(340px,.8fr)",
  gap: "20px",
  alignItems: "start",
};

const builderCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
};

const previewCardStyle = {
  background: "#102238",
  border: "1px solid #2d4661",
  borderRadius: "18px",
  padding: "24px",
  position: "sticky" as const,
  top: "18px",
};

const sectionTitleStyle = {
  fontSize: "30px",
  margin: "7px 0 20px",
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  color: "#cbd5e1",
  fontWeight: 900,
  letterSpacing: "1px",
  margin: "17px 0 7px",
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

const readonlyStyle = {
  background: "#08111f",
  color: "#cbd5e1",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "13px",
  overflowWrap: "anywhere" as const,
};

const helpStyle = {
  color: "#64748b",
  fontSize: "11px",
  lineHeight: 1.55,
  marginTop: "7px",
};

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "20px",
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const outlineButtonStyle = {
  background: "transparent",
  color: "#f5b82e",
  border: "1px solid #f5b82e",
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const qrFrameStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "18px",
  marginTop: "16px",
  display: "grid",
  placeItems: "center",
};

const qrImageStyle = {
  width: "100%",
  maxWidth: "360px",
  aspectRatio: "1 / 1",
  objectFit: "contain" as const,
};

const previewLabelStyle = {
  fontSize: "22px",
  fontWeight: 900,
  marginTop: "16px",
};

const destinationStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: 1.5,
  overflowWrap: "anywhere" as const,
  marginTop: "7px",
};

const emptyPreviewStyle = {
  minHeight: "360px",
  display: "grid",
  placeItems: "center",
  textAlign: "center" as const,
  color: "#64748b",
  border: "1px dashed #334155",
  borderRadius: "14px",
  padding: "24px",
  marginTop: "16px",
};

const scanWarningStyle = {
  marginTop: "18px",
  padding: "12px",
  borderRadius: "10px",
  background: "#261f10",
  color: "#fde68a",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
  textAlign: "center" as const,
};

const savedSectionStyle = {
  marginTop: "24px",
  background: "#0a1522",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
};

const emptyLibraryStyle = {
  marginTop: "18px",
  padding: "24px",
  color: "#64748b",
  border: "1px dashed #334155",
  borderRadius: "12px",
  textAlign: "center" as const,
};

const savedGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: "14px",
  marginTop: "18px",
};

const savedCardStyle = {
  display: "grid",
  gridTemplateColumns: "128px minmax(0,1fr)",
  gap: "16px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "14px",
  padding: "14px",
  alignItems: "center",
};

const savedQrStyle = {
  width: "128px",
  height: "128px",
  objectFit: "contain" as const,
  background: "#ffffff",
  borderRadius: "10px",
};

const savedBodyStyle = {
  minWidth: 0,
};

const savedTypeStyle = {
  color: "#f5b82e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1.3px",
};

const savedTitleStyle = {
  fontSize: "20px",
  margin: "6px 0",
};

const savedUrlStyle = {
  color: "#64748b",
  fontSize: "10px",
  overflowWrap: "anywhere" as const,
  lineHeight: 1.5,
};

const savedActionRowStyle = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap" as const,
  marginTop: "12px",
};

const smallButtonStyle = {
  background: "#172d45",
  color: "#ffffff",
  border: "1px solid #37516c",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
};

const smallDangerButtonStyle = {
  ...smallButtonStyle,
  color: "#fca5a5",
  border: "1px solid #7f1d1d",
};
