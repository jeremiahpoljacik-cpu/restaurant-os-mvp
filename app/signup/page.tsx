"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type PlanKey = "starter" | "growth" | "dominate";

type Plan = {
  key: PlanKey;
  name: string;
  setup: number;
  monthly: number;
  weekly: string;
  summary: string;
  featured?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "STARTER",
    setup: 150,
    monthly: 99,
    weekly: "ABOUT $23/WEEK",
    summary: "Own the core Restaurant OS system.",
    features: [
      "Restaurant website",
      "Online menu management",
      "VIP / loyalty database",
      "Coupons + offers",
      "Review / VIP / offer QR codes",
      "Ordering links + location info",
      "Owner dashboard",
    ],
  },
  {
    key: "growth",
    name: "GROWTH",
    setup: 895,
    monthly: 375,
    weekly: "ABOUT $87/WEEK",
    summary: "Add active marketing and customer follow-up.",
    featured: true,
    features: [
      "Everything in Starter",
      "Text message campaigns",
      "Email campaigns",
      "Google Business optimization",
      "Apple Maps optimization",
      "Review-generation system",
      "Catering campaign setup",
      "Local SEO foundation",
      "Monthly local content",
      "Partnership outreach tools",
      "Monthly growth review",
    ],
  },
  {
    key: "dominate",
    name: "DOMINATE",
    setup: 1495,
    monthly: 995,
    weekly: "ABOUT $230/WEEK",
    summary: "Go all-in with deeper growth, strategy and consulting.",
    features: [
      "Everything in Growth",
      "Advanced SEO + content",
      "Multiple growth campaigns",
      "Catering + event campaigns",
      "Retargeting strategy",
      "PR / press release support",
      "Video content support",
      "Menu engineering",
      "Food-cost + inventory consulting",
      "Concept revitalization",
      "Merch + promo creative",
      "Priority strategy support",
    ],
  },
];

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function SignupPage() {
  const [selected, setSelected] = useState<PlanKey>("growth");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("plan")?.toLowerCase();

    if (
      requested === "starter" ||
      requested === "growth" ||
      requested === "dominate"
    ) {
      setSelected(requested);
    }
  }, []);

  const plan = useMemo(
    () => PLANS.find((item) => item.key === selected) || PLANS[1],
    [selected]
  );

  const canContinue =
    restaurantName.trim() &&
    ownerName.trim() &&
    phone.trim() &&
    email.trim() &&
    city.trim() &&
    state.trim();

  async function continueToAccount() {
    setError("");

    if (!canContinue) {
      setError("Please complete all restaurant and owner fields.");
      return;
    }

    setStep(3);
  }

  async function createFounderAccount() {
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams({
        plan: selected,
        restaurant_name: restaurantName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        state: state.trim(),
      });

      window.location.href = `/checkout?${params.toString()}`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to continue right now."
      );
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #050505;
          font-family: Arial, Helvetica, sans-serif;
        }
        button, input { font: inherit; }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          color: #fff;
          background:
            radial-gradient(circle at 85% 8%, rgba(225,34,45,.14), transparent 28%),
            #050505;
        }

        .topbar {
          min-height: 72px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 5vw;
          border-bottom: 1px solid #171717;
          background: rgba(5,5,5,.94);
        }

        .brand {
          font-size: 20px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span { color: #e1222d; }

        .back {
          color: #767676;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .8px;
          text-decoration: none;
          text-transform: uppercase;
        }

        .wrap {
          max-width: 1380px;
          margin: 0 auto;
          padding: 58px 5vw 90px;
        }

        .eyebrow {
          color: #e1222d;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 2.3px;
          text-transform: uppercase;
        }

        h1 {
          margin: 12px 0 0;
          max-width: 900px;
          font-size: clamp(48px, 6vw, 86px);
          line-height: .9;
          letter-spacing: -4px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        h1 span { color: #e1222d; }

        .lead {
          max-width: 760px;
          margin: 18px 0 0;
          color: #979797;
          font-size: 14px;
          line-height: 1.65;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 36px;
          max-width: 760px;
        }

        .step {
          border: 1px solid #222;
          border-radius: 8px;
          padding: 12px 14px;
          background: #0c0c0c;
          color: #686868;
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .step.active {
          border-color: #e1222d;
          color: #fff;
          background: #17090b;
        }

        .grid {
          margin-top: 38px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 24px;
          align-items: start;
        }

        .panel {
          border: 1px solid #232323;
          border-radius: 16px;
          background: #0b0b0b;
          overflow: hidden;
        }

        .panelInner { padding: 24px; }

        .panelTitle {
          font-size: 22px;
          font-weight: 1000;
          letter-spacing: -1px;
          text-transform: uppercase;
        }

        .panelSub {
          margin-top: 6px;
          color: #737373;
          font-size: 10px;
          line-height: 1.5;
        }

        .planGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .plan {
          position: relative;
          border: 1px solid #242424;
          border-radius: 12px;
          padding: 16px;
          background: #101010;
          cursor: pointer;
          min-height: 245px;
        }

        .plan.selected {
          border: 2px solid #e1222d;
          background: #15090b;
          box-shadow: 0 16px 45px rgba(225,34,45,.12);
        }

        .popular {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 999px;
          padding: 5px 9px;
          background: #e1222d;
          color: #fff;
          font-size: 7px;
          font-weight: 1000;
          letter-spacing: .8px;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .planName {
          font-size: 19px;
          font-weight: 1000;
        }

        .planMonthly {
          margin-top: 13px;
          font-size: 30px;
          font-weight: 1000;
          letter-spacing: -2px;
        }

        .planMonthly span {
          color: #707070;
          font-size: 8px;
          letter-spacing: 0;
        }

        .weekly {
          margin-top: 4px;
          color: #e1222d;
          font-size: 8px;
          font-weight: 1000;
        }

        .setup {
          margin-top: 3px;
          color: #676767;
          font-size: 8px;
        }

        .planSummary {
          margin-top: 12px;
          color: #8c8c8c;
          font-size: 9px;
          line-height: 1.45;
        }

        .checkline {
          margin-top: 14px;
          color: #fff;
          font-size: 8px;
          font-weight: 900;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
        }

        .field { display: grid; gap: 6px; }

        label {
          color: #7c7c7c;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        input {
          width: 100%;
          border: 1px solid #2b2b2b;
          border-radius: 8px;
          background: #111;
          color: #fff;
          outline: none;
          padding: 13px 14px;
          font-size: 11px;
        }

        input:focus { border-color: #e1222d; }

        .full { grid-column: 1 / -1; }

        .summary {
          position: sticky;
          top: 96px;
          border: 1px solid #292929;
          border-radius: 16px;
          background:
            linear-gradient(145deg, #101010, #080808);
          padding: 24px;
          box-shadow: 0 30px 80px rgba(0,0,0,.42);
        }

        .summaryTop {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .summaryPlan {
          font-size: 28px;
          font-weight: 1000;
        }

        .summaryBadge {
          border: 1px solid #e1222d;
          border-radius: 999px;
          padding: 6px 9px;
          color: #ff7179;
          font-size: 7px;
          font-weight: 1000;
        }

        .priceBlock {
          margin-top: 20px;
          padding: 16px 0;
          border-top: 1px solid #222;
          border-bottom: 1px solid #222;
        }

        .priceLine {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 5px 0;
          color: #8d8d8d;
          font-size: 9px;
        }

        .priceLine strong { color: #fff; }

        .totalLine {
          margin-top: 9px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-end;
        }

        .todayLabel {
          color: #777;
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 1000;
        }

        .todayPrice {
          font-size: 33px;
          font-weight: 1000;
          letter-spacing: -2px;
        }

        .recurring {
          color: #e1222d;
          font-size: 8px;
          font-weight: 1000;
        }

        .features {
          display: grid;
          gap: 8px;
          margin-top: 18px;
        }

        .feature {
          display: flex;
          gap: 8px;
          color: #bcbcbc;
          font-size: 9px;
          line-height: 1.4;
        }

        .check {
          color: #e1222d;
          font-weight: 1000;
        }

        .buttonRow {
          display: flex;
          gap: 10px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .primary, .secondary {
          border: 0;
          border-radius: 8px;
          padding: 14px 18px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .primary {
          background: #e1222d;
          color: #fff;
          box-shadow: 0 12px 32px rgba(225,34,45,.18);
        }

        .secondary {
          border: 1px solid #2b2b2b;
          background: #111;
          color: #fff;
        }

        .error {
          margin-top: 14px;
          border: 1px solid #5a252a;
          border-radius: 8px;
          padding: 10px 12px;
          background: #180a0b;
          color: #ff8e95;
          font-size: 9px;
          line-height: 1.45;
        }

        .confirm {
          margin-top: 20px;
          display: grid;
          gap: 12px;
        }

        .confirmCard {
          border: 1px solid #242424;
          border-radius: 10px;
          padding: 15px;
          background: #101010;
        }

        .confirmLabel {
          color: #707070;
          font-size: 7px;
          font-weight: 1000;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .confirmValue {
          margin-top: 5px;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .trust {
          margin-top: 18px;
          color: #666;
          font-size: 8px;
          line-height: 1.5;
        }

        @media (max-width: 980px) {
          .grid { grid-template-columns: 1fr; }
          .summary { position: static; }
          .planGrid { grid-template-columns: 1fr; }
        }

        @media (max-width: 620px) {
          .topbar, .wrap { padding-left: 18px; padding-right: 18px; }
          .formGrid { grid-template-columns: 1fr; }
          .full { grid-column: auto; }
          h1 { letter-spacing: -2.5px; }
          .steps { grid-template-columns: 1fr; }
          .buttonRow button { width: 100%; }
        }
      `}</style>

      <div className="topbar">
        <div className="brand">
          RESTAURANT <span>OS</span>
        </div>
        <a className="back" href="/">
          ← Back to Restaurant OS
        </a>
      </div>

      <div className="wrap">
        <div className="eyebrow">FOUNDING RESTAURANT ENROLLMENT</div>
        <h1>
          BUILD THE SYSTEM.
          <br />
          <span>THEN GROW WITH IT.</span>
        </h1>
        <p className="lead">
          Choose your Restaurant OS level, tell us about your restaurant and
          continue into secure checkout. Growth and Dominate include text and
          email campaigns; Starter is the core operating system.
        </p>

        <div className="steps">
          <div className={`step ${step === 1 ? "active" : ""}`}>01 · Choose Plan</div>
          <div className={`step ${step === 2 ? "active" : ""}`}>02 · Restaurant Info</div>
          <div className={`step ${step === 3 ? "active" : ""}`}>03 · Review + Checkout</div>
        </div>

        <div className="grid">
          <section className="panel">
            <div className="panelInner">
              {step === 1 && (
                <>
                  <div className="panelTitle">Choose Your Plan</div>
                  <div className="panelSub">
                    You can change packages before checkout.
                  </div>

                  <div className="planGrid">
                    {PLANS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`plan ${selected === item.key ? "selected" : ""}`}
                        onClick={() => setSelected(item.key)}
                        style={{ textAlign: "left", color: "#fff" }}
                      >
                        {item.featured && <div className="popular">Most Popular</div>}
                        <div className="planName">{item.name}</div>
                        <div className="planMonthly">
                          {money(item.monthly)} <span>/ MONTH</span>
                        </div>
                        <div className="weekly">{item.weekly}</div>
                        <div className="setup">{money(item.setup)} setup</div>
                        <div className="planSummary">{item.summary}</div>
                        <div className="checkline">
                          {selected === item.key ? "✓ SELECTED" : "SELECT PLAN"}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="buttonRow">
                    <button className="primary" onClick={() => setStep(2)}>
                      CONTINUE WITH {plan.name} →
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="panelTitle">Tell Us About Your Restaurant</div>
                  <div className="panelSub">
                    This information follows you into onboarding so you do not
                    have to enter it again.
                  </div>

                  <div className="formGrid">
                    <div className="field full">
                      <label>Restaurant Name</label>
                      <input
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="Example: Main Street Pizza"
                      />
                    </div>

                    <div className="field">
                      <label>Your Name</label>
                      <input
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Owner / operator name"
                      />
                    </div>

                    <div className="field">
                      <label>Phone</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(919) 555-0123"
                      />
                    </div>

                    <div className="field full">
                      <label>Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@restaurant.com"
                      />
                    </div>

                    <div className="field">
                      <label>City</label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Raleigh"
                      />
                    </div>

                    <div className="field">
                      <label>State</label>
                      <input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="NC"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  {error && <div className="error">{error}</div>}

                  <div className="buttonRow">
                    <button className="secondary" onClick={() => setStep(1)}>
                      ← BACK
                    </button>
                    <button className="primary" onClick={continueToAccount}>
                      REVIEW MY ENROLLMENT →
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="panelTitle">Review Your Enrollment</div>
                  <div className="panelSub">
                    Confirm your restaurant and plan. The next screen is checkout.
                  </div>

                  <div className="confirm">
                    <div className="confirmCard">
                      <div className="confirmLabel">Restaurant</div>
                      <div className="confirmValue">{restaurantName}</div>
                    </div>

                    <div className="confirmCard">
                      <div className="confirmLabel">Owner</div>
                      <div className="confirmValue">{ownerName}</div>
                    </div>

                    <div className="confirmCard">
                      <div className="confirmLabel">Contact</div>
                      <div className="confirmValue">
                        {email} · {phone}
                      </div>
                    </div>

                    <div className="confirmCard">
                      <div className="confirmLabel">Market</div>
                      <div className="confirmValue">
                        {city}, {state.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {error && <div className="error">{error}</div>}

                  <div className="buttonRow">
                    <button className="secondary" onClick={() => setStep(2)}>
                      ← EDIT INFO
                    </button>
                    <button
                      className="primary"
                      onClick={createFounderAccount}
                      disabled={loading}
                      style={{ opacity: loading ? .55 : 1 }}
                    >
                      {loading ? "CONTINUING..." : "CONTINUE TO SECURE CHECKOUT →"}
                    </button>
                  </div>

                  <div className="trust">
                    Restaurant OS will use the information above to prefill your
                    onboarding. Payment is completed on the secure checkout
                    screen.
                  </div>
                </>
              )}
            </div>
          </section>

          <aside className="summary">
            <div className="summaryTop">
              <div>
                <div className="summaryPlan">{plan.name}</div>
                <div className="panelSub">{plan.summary}</div>
              </div>
              {plan.featured && <div className="summaryBadge">MOST POPULAR</div>}
            </div>

            <div className="priceBlock">
              <div className="priceLine">
                <span>One-time setup</span>
                <strong>{money(plan.setup)}</strong>
              </div>
              <div className="priceLine">
                <span>Monthly subscription</span>
                <strong>{money(plan.monthly)}/mo</strong>
              </div>

              <div className="totalLine">
                <div>
                  <div className="todayLabel">Due at enrollment</div>
                  <div className="todayPrice">{money(plan.setup + plan.monthly)}</div>
                </div>
                <div className="recurring">
                  THEN {money(plan.monthly).toUpperCase()}/MONTH
                </div>
              </div>
            </div>

            <div className="features">
              {plan.features.map((feature) => (
                <div className="feature" key={feature}>
                  <span className="check">✓</span>
                  <span
                    style={{
                      color:
                        feature === "Text message campaigns" ||
                        feature === "Email campaigns"
                          ? "#fff"
                          : undefined,
                      fontWeight:
                        feature === "Text message campaigns" ||
                        feature === "Email campaigns"
                          ? 1000
                          : undefined,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
