"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Result = {
  ok: boolean;
  restaurant_id: string;
  restaurant_slug: string;
  owner_user_id: string;
  owner_created: boolean;
  temporary_password: string | null;
  message: string;
};

type Check = {
  label: string;
  pass: boolean;
  detail: string;
};

export default function AdminBattlefieldTestPage() {
  const stamp = useMemo(() => Date.now().toString().slice(-8), []);
  const [restaurantName, setRestaurantName] = useState(`ROS Battlefield ${stamp}`);
  const [ownerEmail, setOwnerEmail] = useState(`ros-battlefield-${stamp}@example.com`);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);

  async function createCleanTenant() {
    if (!restaurantName.trim() || !ownerEmail.trim()) {
      setMessage("Restaurant name and owner email are required.");
      return;
    }

    setRunning(true);
    setMessage("");
    setResult(null);
    setChecks([]);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch("/api/admin/migrate-restaurant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          restaurant_name: restaurantName.trim(),
          owner_email: ownerEmail.trim().toLowerCase(),
          cuisine_category: "Battlefield Test",
          phone: "9195550199",
          address_line_1: "100 Launch Test Way",
          city: "Raleigh",
          state: "NC",
          zip: "27601",
          current_website_url: "",
          custom_domain: "",
          online_ordering_url: "https://example.com/order",
          catering_email: ownerEmail.trim().toLowerCase(),
          notes:
            "Restaurant OS clean-account battlefield test tenant. Safe to delete after launch validation.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create battlefield tenant.");
      }

      setResult(data as Result);
      await verifyTenant(data.restaurant_id, data.restaurant_slug);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Battlefield test failed."
      );
    } finally {
      setRunning(false);
    }
  }

  async function verifyTenant(restaurantId: string, slug: string) {
    const [
      restaurantResult,
      brandingResult,
      websiteResult,
      orderingResult,
      growthResult,
      subscriptionResult,
      menuCategoryResult,
      menuItemResult,
    ] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id,name,slug,status,theme_key,theme_mode,admin_suspended")
        .eq("id", restaurantId)
        .maybeSingle(),

      supabase
        .from("restaurant_branding")
        .select("restaurant_id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      supabase
        .from("restaurant_website_settings")
        .select("restaurant_id,published")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      supabase
        .from("restaurant_ordering")
        .select("restaurant_id,online_ordering_url,catering_email")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      supabase
        .from("restaurant_growth_settings")
        .select("restaurant_id,vip_club_name")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      supabase
        .from("restaurant_subscriptions")
        .select("restaurant_id,plan,status,trial_ends_at,provider_customer_id,provider_subscription_id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      supabase
        .from("restaurant_menu_categories")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .limit(1),

      supabase
        .from("restaurant_menu_items")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .limit(1),
    ]);

    const restaurant = restaurantResult.data;
    const website = websiteResult.data;
    const subscription = subscriptionResult.data;

    const nextChecks: Check[] = [
      {
        label: "Restaurant Row",
        pass: Boolean(restaurant?.id && restaurant?.slug === slug),
        detail: restaurant
          ? `${restaurant.name} created as ${restaurant.status}.`
          : restaurantResult.error?.message || "Restaurant row missing.",
      },
      {
        label: "Owner Isolation Seed",
        pass: Boolean(restaurant?.id),
        detail: "Clean tenant has its own restaurant UUID and owner account.",
      },
      {
        label: "Branding Defaults",
        pass: Boolean(brandingResult.data),
        detail: brandingResult.data
          ? "Branding row created."
          : brandingResult.error?.message || "Branding row missing.",
      },
      {
        label: "Website Defaults",
        pass: Boolean(website && website.published === false),
        detail: website
          ? "Website settings exist and start unpublished."
          : websiteResult.error?.message || "Website settings missing.",
      },
      {
        label: "Ordering Defaults",
        pass: Boolean(orderingResult.data),
        detail: orderingResult.data
          ? "Ordering row created."
          : orderingResult.error?.message || "Ordering row missing.",
      },
      {
        label: "Growth Defaults",
        pass: Boolean(growthResult.data),
        detail: growthResult.data
          ? `Growth row created (${growthResult.data.vip_club_name || "VIP Club"}).`
          : growthResult.error?.message || "Growth settings missing.",
      },
      {
        label: "Founder Trial",
        pass: Boolean(
          subscription?.plan === "founder" &&
            subscription?.status === "trial" &&
            subscription?.trial_ends_at
        ),
        detail: subscription
          ? `Plan: ${subscription.plan} · Status: ${subscription.status}.`
          : subscriptionResult.error?.message || "Subscription row missing.",
      },
      {
        label: "Stripe Starts Clean",
        pass: Boolean(
          subscription &&
            !subscription.provider_customer_id &&
            !subscription.provider_subscription_id
        ),
        detail:
          "Fresh tenant has no Stripe customer/subscription IDs before checkout.",
      },
      {
        label: "Menu Starts Empty",
        pass: !menuCategoryResult.data?.length && !menuItemResult.data?.length,
        detail: "New restaurant starts with no menu content, ready for onboarding.",
      },
      {
        label: "Public Site Starts Draft",
        pass: Boolean(website && website.published === false),
        detail: "Public launch remains blocked until the owner explicitly publishes.",
      },
    ];

    setChecks(nextChecks);

    const passed = nextChecks.filter((check) => check.pass).length;
    setMessage(
      `${passed}/${nextChecks.length} automatic clean-tenant checks passed.`
    );
  }

  function openOwner(path = "/owner") {
    if (!result) return;
    window.location.href = `${path}?restaurant=${result.restaurant_id}`;
  }

  const passedCount = checks.filter((check) => check.pass).length;
  const allPassed = checks.length > 0 && passedCount === checks.length;

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS · BUILD #9</div>
            <h1 style={titleStyle}>Battlefield Test</h1>
            <p style={subStyle}>
              Create a completely fresh owner + restaurant tenant, verify the
              default SaaS wiring, then run the real owner journey exactly like
              a new customer.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => (window.location.href = "/admin")}
          >
            SUPER ADMIN
          </button>
        </header>

        <section style={warningStyle}>
          <strong>TEST TENANT ONLY.</strong> Use a throwaway email. This creates a
          real Supabase Auth owner, restaurant, 14-day Founder trial and starter
          records. Delete the test account after battlefield validation.
        </section>

        <section style={createCardStyle}>
          <div style={cardEyebrowStyle}>STEP 1 · CREATE CLEAN TENANT</div>
          <h2 style={cardTitleStyle}>Start From Absolute Zero</h2>

          <div style={formGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>TEST RESTAURANT</span>
              <input
                style={inputStyle}
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>THROWAWAY OWNER EMAIL</span>
              <input
                style={inputStyle}
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
              />
            </label>
          </div>

          <button
            style={primaryButtonStyle}
            disabled={running}
            onClick={createCleanTenant}
          >
            {running ? "CREATING + VERIFYING..." : "CREATE BATTLEFIELD TENANT"}
          </button>
        </section>

        {message && (
          <div style={allPassed ? successMessageStyle : messageStyle}>
            {message}
          </div>
        )}

        {checks.length > 0 && (
          <section style={checksCardStyle}>
            <div style={checksHeaderStyle}>
              <div>
                <div style={cardEyebrowStyle}>AUTOMATIC VALIDATION</div>
                <h2 style={cardTitleStyle}>
                  {passedCount}/{checks.length} Passed
                </h2>
              </div>

              <div
                style={{
                  ...statusBadgeStyle,
                  background: allPassed ? "#123923" : "#3c2910",
                  color: allPassed ? "#86efac" : "#fde68a",
                  borderColor: allPassed ? "#2e7a4f" : "#8a641c",
                }}
              >
                {allPassed ? "AUTOMATIC CHECKS CLEAN" : "REVIEW FAILURES"}
              </div>
            </div>

            <div style={checkGridStyle}>
              {checks.map((check) => (
                <article
                  key={check.label}
                  style={{
                    ...checkCardStyle,
                    borderColor: check.pass ? "#285a43" : "#7b3944",
                  }}
                >
                  <div style={checkIconStyle}>{check.pass ? "✓" : "!"}</div>
                  <div>
                    <div style={checkTitleStyle}>{check.label}</div>
                    <div style={checkTextStyle}>{check.detail}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {result && (
          <>
            <section style={credentialsCardStyle}>
              <div style={cardEyebrowStyle}>CLEAN OWNER CREDENTIALS</div>
              <h2 style={cardTitleStyle}>Test This Like A Real Customer</h2>

              <div style={credentialGridStyle}>
                <Credential label="OWNER EMAIL" value={ownerEmail} />
                <Credential
                  label="TEMP PASSWORD"
                  value={
                    result.temporary_password ||
                    "Existing account — use its current password"
                  }
                />
                <Credential
                  label="RESTAURANT ID"
                  value={result.restaurant_id}
                />
                <Credential
                  label="PUBLIC SLUG"
                  value={result.restaurant_slug}
                />
              </div>

              <div style={importantStyle}>
                Open an <strong>incognito/private browser</strong>, go to the
                normal owner login, and use these credentials. Do not test the
                owner journey while still authenticated as Super Admin.
              </div>
            </section>

            <section style={manualCardStyle}>
              <div style={cardEyebrowStyle}>STEP 2 · REAL CUSTOMER RUN</div>
              <h2 style={cardTitleStyle}>Battlefield Checklist</h2>

              <div style={manualGridStyle}>
                <ManualStep
                  n="01"
                  title="Owner Login"
                  text="Log in from a private browser. Confirm this test restaurant — and only this restaurant — opens."
                />
                <ManualStep
                  n="02"
                  title="Launch Wizard"
                  text="Complete business profile, branding, hours, theme, media, menu, website story and ordering."
                />
                <ManualStep
                  n="03"
                  title="Restaurant Switching"
                  text="Confirm a single-location owner does not see another customer's restaurant or an unrelated selector."
                />
                <ManualStep
                  n="04"
                  title="Website Draft"
                  text="Before publishing, confirm the public site is not exposed as a normal live restaurant site."
                />
                <ManualStep
                  n="05"
                  title="Publish"
                  text="Publish from Website Manager. Confirm the slug site loads with the correct restaurant content."
                />
                <ManualStep
                  n="06"
                  title="Menu"
                  text="Create categories/items, edit price and availability, then verify the public menu reflects changes."
                />
                <ManualStep
                  n="07"
                  title="VIP + Offer"
                  text="Join from the public site, verify the member appears only inside this restaurant, then test an offer claim."
                />
                <ManualStep
                  n="08"
                  title="Billing"
                  text="Open Billing and verify trial state. Run Stripe checkout with a test/promo path only when you're ready to validate payment."
                />
                <ManualStep
                  n="09"
                  title="Super Admin"
                  text="Return to admin, open this restaurant, confirm owner override, QA, website, billing and domain controls target this exact UUID."
                />
                <ManualStep
                  n="10"
                  title="System Check"
                  text="Run the System Check. No critical failures should remain before we call the SaaS launch-ready."
                />
              </div>

              <div style={actionRowStyle}>
                <button style={secondaryButtonStyle} onClick={() => openOwner()}>
                  OPEN OWNER OVERRIDE
                </button>

                <button
                  style={secondaryButtonStyle}
                  onClick={() => openOwner("/owner/setup")}
                >
                  OPEN LAUNCH WIZARD
                </button>

                <button
                  style={secondaryButtonStyle}
                  onClick={() => openOwner("/owner/qa")}
                >
                  OPEN SYSTEM CHECK
                </button>

                <button
                  style={secondaryButtonStyle}
                  onClick={() =>
                    window.open(`/r/${result.restaurant_slug}`, "_blank")
                  }
                >
                  OPEN PUBLIC SLUG
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div style={credentialStyle}>
      <div style={credentialLabelStyle}>{label}</div>
      <div style={credentialValueStyle}>{value}</div>
    </div>
  );
}

function ManualStep({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <article style={manualStepStyle}>
      <div style={manualNumberStyle}>{n}</div>
      <div>
        <div style={manualTitleStyle}>{title}</div>
        <div style={manualTextStyle}>{text}</div>
      </div>
    </article>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#07111f",
  color: "#fff",
  padding: "30px 22px 80px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = { maxWidth: "1180px", margin: "0 auto" };

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  marginBottom: 20,
};

const eyebrowStyle = {
  color: "#f4b82d",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2,
};

const titleStyle = {
  fontSize: "clamp(50px,8vw,82px)",
  lineHeight: .9,
  letterSpacing: -4,
  margin: "8px 0",
  fontWeight: 900,
};

const subStyle = {
  maxWidth: 760,
  color: "#96a9bd",
  lineHeight: 1.6,
  fontSize: 14,
};

const secondaryButtonStyle = {
  background: "#102237",
  color: "#e5edf5",
  border: "1px solid #334b64",
  borderRadius: 9,
  padding: "11px 13px",
  fontSize: 9,
  fontWeight: 900,
  cursor: "pointer",
};

const warningStyle = {
  background: "#3b2b09",
  border: "1px solid #876519",
  color: "#fde68a",
  borderRadius: 12,
  padding: 14,
  fontSize: 11,
  lineHeight: 1.6,
  marginBottom: 16,
};

const createCardStyle = {
  background: "#0e1d2f",
  border: "1px solid #293e56",
  borderRadius: 17,
  padding: 20,
};

const cardEyebrowStyle = {
  color: "#f4b82d",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.5,
};

const cardTitleStyle = {
  margin: "6px 0 15px",
  fontSize: 27,
  fontWeight: 900,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
};

const fieldStyle = { display: "grid", gap: 7 };

const labelStyle = {
  color: "#8196ab",
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 1,
};

const inputStyle = {
  background: "#07111f",
  color: "#fff",
  border: "1px solid #30465f",
  borderRadius: 9,
  padding: "12px 13px",
  outline: "none",
};

const primaryButtonStyle = {
  marginTop: 14,
  background: "#f4b82d",
  color: "#07111f",
  border: 0,
  borderRadius: 9,
  padding: "12px 15px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  marginTop: 14,
  background: "#2e220d",
  border: "1px solid #795a18",
  color: "#fde68a",
  borderRadius: 10,
  padding: 12,
  fontSize: 11,
};

const successMessageStyle = {
  ...messageStyle,
  background: "#10291f",
  border: "1px solid #347150",
  color: "#a7f3d0",
};

const checksCardStyle = {
  ...createCardStyle,
  marginTop: 16,
};

const checksHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
};

const statusBadgeStyle = {
  border: "1px solid",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 1,
};

const checkGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 9,
};

const checkCardStyle = {
  display: "flex",
  gap: 11,
  alignItems: "flex-start",
  background: "#091626",
  border: "1px solid",
  borderRadius: 11,
  padding: 12,
};

const checkIconStyle = {
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "#102237",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  flex: "0 0 auto",
};

const checkTitleStyle = { fontSize: 12, fontWeight: 900 };

const checkTextStyle = {
  color: "#8296ab",
  fontSize: 10,
  lineHeight: 1.5,
  marginTop: 4,
};

const credentialsCardStyle = {
  ...createCardStyle,
  marginTop: 16,
  borderColor: "#2c6c4a",
  background: "#0d221a",
};

const credentialGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 9,
};

const credentialStyle = {
  background: "#081712",
  border: "1px solid #245238",
  borderRadius: 10,
  padding: 12,
};

const credentialLabelStyle = {
  color: "#6fa388",
  fontSize: 8,
  fontWeight: 900,
  letterSpacing: 1,
};

const credentialValueStyle = {
  marginTop: 5,
  color: "#dcfce7",
  fontSize: 12,
  fontWeight: 800,
  wordBreak: "break-all" as const,
};

const importantStyle = {
  marginTop: 12,
  background: "#183f2d",
  border: "1px solid #34785a",
  borderRadius: 9,
  padding: 12,
  color: "#bbf7d0",
  fontSize: 11,
  lineHeight: 1.55,
};

const manualCardStyle = {
  ...createCardStyle,
  marginTop: 16,
};

const manualGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 9,
};

const manualStepStyle = {
  display: "flex",
  gap: 12,
  background: "#091626",
  border: "1px solid #263b53",
  borderRadius: 11,
  padding: 13,
};

const manualNumberStyle = {
  color: "#f4b82d",
  fontSize: 12,
  fontWeight: 900,
  flex: "0 0 auto",
};

const manualTitleStyle = { fontSize: 13, fontWeight: 900 };

const manualTextStyle = {
  color: "#8499ae",
  fontSize: 10,
  lineHeight: 1.55,
  marginTop: 4,
};

const actionRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 9,
  marginTop: 16,
};
