"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type DomainRecord = {
  id?: string;
  domain?: string | null;
  normalized_domain?: string | null;
  dns_status?: string | null;
  ssl_status?: string | null;
  verification_status?: string | null;
  provider_status?: string | null;
};

type DomainStatus = {
  connected?: boolean;
  configured?: boolean;
  verified?: boolean;
  status?: string;
  message?: string;
  config?: {
    misconfigured?: boolean;
    aValues?: string[];
    cname?: string;
    recommendedIPv4?: string[];
  };
  project_domain?: {
    verified?: boolean;
    verification?: Array<{
      type?: string;
      domain?: string;
      value?: string;
      reason?: string;
    }>;
  };
};

export default function AdminDomainControlPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState<DomainRecord | null>(null);
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [vercelConnected, setVercelConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<"" | "stage" | "connect" | "check">("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
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

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant") || "";

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const token = await getToken();
    if (!token) return;

    const [restaurantResponse, domainResponse] = await Promise.all([
      fetch(`/api/admin/restaurant?restaurant_id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/admin/domain?restaurant_id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const restaurantData = await restaurantResponse.json();
    const domainData = await domainResponse.json();

    if (restaurantResponse.ok && restaurantData.restaurant) {
      setRestaurantName(restaurantData.restaurant.name || "Restaurant");
    }

    if (!domainResponse.ok) {
      setMessage(domainData.error || "Unable to load domain status.");
      setLoading(false);
      return;
    }

    setRecord(domainData.domain || null);
    setVercelConnected(Boolean(domainData.vercel_connected));
    setStatus(domainData.status || null);

    const currentDomain =
      domainData.domain?.normalized_domain ||
      domainData.domain?.domain ||
      "";

    setDomain(currentDomain);
    setLoading(false);
  }

  async function runAction(action: "stage" | "connect" | "check") {
    if (!restaurantId) return;

    setRunning(action);
    setMessage("");

    const token = await getToken();
    if (!token) return;

    const response = await fetch("/api/admin/domain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        action,
        domain,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Domain action failed.");
      setRunning("");
      return;
    }

    if (data.domain) {
      setRecord(data.domain);
      setDomain(
        data.domain.normalized_domain ||
          data.domain.domain ||
          domain
      );
    }

    if (data.status) {
      setStatus(data.status);
    }

    setMessage(
      data.message ||
        (action === "stage"
          ? "Domain staged."
          : action === "connect"
          ? "Domain connection request sent."
          : "Domain status refreshed.")
    );

    setRunning("");
  }

  function statusTone(value?: string | null) {
    const normalized = (value || "").toLowerCase();

    if (
      normalized.includes("ready") ||
      normalized.includes("verified") ||
      normalized.includes("active") ||
      normalized.includes("configured") ||
      normalized.includes("added")
    ) {
      return "#22c55e";
    }

    if (
      normalized.includes("pending") ||
      normalized.includes("required") ||
      normalized.includes("staged")
    ) {
      return "#f59e0b";
    }

    return "#94a3b8";
  }

  const verificationRecords =
    status?.project_domain?.verification || [];

  const recommendedIps =
    status?.config?.recommendedIPv4 ||
    status?.config?.aValues ||
    [];

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading domain control...</div>
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
                (window.location.href = `/admin/restaurant?restaurant=${restaurantId}`)
              }
            >
              ← RESTAURANT ACCOUNT
            </button>

            <div style={eyebrowStyle}>SUPER ADMIN · DOMAIN CONTROL</div>
            <h1 style={titleStyle}>{restaurantName || "Restaurant"}</h1>
            <p style={subStyle}>
              Stage, connect and verify this restaurant&apos;s custom domain without
              touching DNS until you are ready for final cutover.
            </p>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={gridStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>CUSTOM DOMAIN</div>
            <h2 style={cardTitleStyle}>Domain Setup</h2>

            <label style={fieldWrapStyle}>
              <span style={labelStyle}>DOMAIN</span>
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="vi-pollo.com"
                style={inputStyle}
              />
            </label>

            <div style={buttonGridStyle}>
              <button
                style={secondaryButtonStyle}
                disabled={running !== ""}
                onClick={() => runAction("stage")}
              >
                {running === "stage" ? "STAGING..." : "1. STAGE DOMAIN"}
              </button>

              <button
                style={primaryButtonStyle}
                disabled={running !== ""}
                onClick={() => runAction("connect")}
              >
                {running === "connect"
                  ? "CONNECTING..."
                  : "2. CONNECT TO VERCEL"}
              </button>

              <button
                style={checkButtonStyle}
                disabled={running !== ""}
                onClick={() => runAction("check")}
              >
                {running === "check"
                  ? "CHECKING..."
                  : "3. CHECK DNS / SSL"}
              </button>
            </div>

            {!vercelConnected && (
              <div style={warningStyle}>
                <strong>VERCEL API NOT CONNECTED</strong>
                <div style={{ marginTop: 5 }}>
                  Add <code>VERCEL_TOKEN</code> to the Restaurant OS Vercel
                  environment before using Connect to Vercel.
                </div>
              </div>
            )}

            <div style={safeBoxStyle}>
              <div style={safeTitleStyle}>SAFE CUTOVER RULE</div>
              <div style={safeTextStyle}>
                Staging and connecting the domain here does not change the
                customer&apos;s DNS. Their current website stays live until you
                intentionally update DNS at the registrar.
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>CONNECTION STATUS</div>
            <h2 style={cardTitleStyle}>Launch Readiness</h2>

            <StatusRow
              label="DOMAIN RECORD"
              value={record?.normalized_domain || record?.domain || "NOT STAGED"}
              color={record ? "#22c55e" : "#94a3b8"}
            />

            <StatusRow
              label="VERCEL"
              value={record?.provider_status || "NOT CONNECTED"}
              color={statusTone(record?.provider_status)}
            />

            <StatusRow
              label="VERIFICATION"
              value={record?.verification_status || "PENDING"}
              color={statusTone(record?.verification_status)}
            />

            <StatusRow
              label="DNS"
              value={record?.dns_status || "PENDING"}
              color={statusTone(record?.dns_status)}
            />

            <StatusRow
              label="SSL"
              value={record?.ssl_status || "PENDING"}
              color={statusTone(record?.ssl_status)}
            />

            {status?.status && (
              <StatusRow
                label="LIVE VERCEL STATUS"
                value={status.status}
                color={statusTone(status.status)}
              />
            )}
          </div>
        </section>

        {(verificationRecords.length > 0 ||
          recommendedIps.length > 0 ||
          status?.config?.cname) && (
          <section style={dnsCardStyle}>
            <div style={cardEyebrowStyle}>DNS INSTRUCTIONS</div>
            <h2 style={cardTitleStyle}>Use These Only at Final Cutover</h2>

            <p style={helpStyle}>
              Do not change the live Vi Pollo domain yet. These are the records
              Vercel is asking for when we are ready to switch traffic.
            </p>

            {recommendedIps.length > 0 && (
              <div style={dnsGroupStyle}>
                <div style={dnsLabelStyle}>A RECORD</div>
                {recommendedIps.map((ip) => (
                  <div key={ip} style={dnsValueStyle}>
                    @ → {ip}
                  </div>
                ))}
              </div>
            )}

            {status?.config?.cname && (
              <div style={dnsGroupStyle}>
                <div style={dnsLabelStyle}>CNAME</div>
                <div style={dnsValueStyle}>
                  www → {status.config.cname}
                </div>
              </div>
            )}

            {verificationRecords.map((item, index) => (
              <div key={`${item.type}-${index}`} style={dnsGroupStyle}>
                <div style={dnsLabelStyle}>
                  {String(item.type || "VERIFICATION").toUpperCase()}
                </div>
                <div style={dnsValueStyle}>
                  {item.domain || domain} → {item.value || "See Vercel"}
                </div>
                {item.reason && (
                  <div style={dnsReasonStyle}>{item.reason}</div>
                )}
              </div>
            ))}
          </section>
        )}

        <section style={cutoverCardStyle}>
          <div>
            <div style={cardEyebrowStyle}>FINAL CUTOVER</div>
            <h2 style={cutoverTitleStyle}>Do Not Touch DNS Yet</h2>
            <p style={helpStyle}>
              We will switch Vi Pollo only after the Restaurant OS preview,
              owner edits, public menu, mobile layout and Stripe/access checks
              all pass.
            </p>
          </div>

          <div style={cutoverBadgeStyle}>
            {status?.status === "ready"
              ? "READY FOR DNS CUTOVER"
              : "PREP MODE"}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={statusRowStyle}>
      <div>
        <div style={statusLabelStyle}>{label}</div>
        <div style={statusValueStyle}>{value}</div>
      </div>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          flex: "0 0 auto",
        }}
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
  fontSize: "clamp(48px,7vw,76px)",
  lineHeight: ".92",
  letterSpacing: "-3px",
};

const subStyle = {
  color: "#94a3b8",
  maxWidth: "760px",
  lineHeight: 1.6,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))",
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
  margin: "6px 0 16px",
  fontSize: "28px",
};

const fieldWrapStyle = {
  display: "grid",
  gap: "7px",
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
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "14px",
};

const buttonGridStyle = {
  display: "grid",
  gap: "9px",
  marginTop: "13px",
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "9px",
  padding: "13px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#13263b",
  color: "#ffffff",
  border: "1px solid #36516c",
  borderRadius: "9px",
  padding: "13px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const checkButtonStyle = {
  background: "#0b513e",
  color: "#ffffff",
  border: 0,
  borderRadius: "9px",
  padding: "13px",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
};

const warningStyle = {
  marginTop: "16px",
  background: "#3a2910",
  border: "1px solid #76561c",
  color: "#f8d77d",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "11px",
  lineHeight: 1.5,
};

const safeBoxStyle = {
  marginTop: "16px",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "10px",
  padding: "13px",
};

const safeTitleStyle = {
  color: "#22c55e",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const safeTextStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: 1.5,
  marginTop: "5px",
};

const statusRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid #23364d",
};

const statusLabelStyle = {
  color: "#64748b",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const statusValueStyle = {
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 800,
  marginTop: "3px",
  textTransform: "uppercase" as const,
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

const dnsCardStyle = {
  marginTop: "16px",
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "22px",
};

const helpStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.55,
};

const dnsGroupStyle = {
  marginTop: "11px",
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: "9px",
  padding: "12px",
};

const dnsLabelStyle = {
  color: "#f5b82e",
  fontSize: "8px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const dnsValueStyle = {
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 800,
  marginTop: "4px",
  wordBreak: "break-word" as const,
};

const dnsReasonStyle = {
  color: "#94a3b8",
  fontSize: "10px",
  marginTop: "6px",
};

const cutoverCardStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap" as const,
  background: "#10253a",
  border: "1px solid #36516c",
  borderRadius: "16px",
  padding: "22px",
};

const cutoverTitleStyle = {
  margin: "6px 0 7px",
  fontSize: "30px",
};

const cutoverBadgeStyle = {
  background: "#08111f",
  color: "#f5b82e",
  border: "1px solid #36516c",
  borderRadius: "999px",
  padding: "10px 14px",
  fontSize: "9px",
  fontWeight: 900,
  letterSpacing: "1px",
};
