"use client";

import { useMemo, useState } from "react";

type ScoreKey =
  | "visibility"
  | "reviews"
  | "capture"
  | "followup"
  | "offers"
  | "catering";

type Answers = Record<ScoreKey, boolean | null>;

const INITIAL: Answers = {
  visibility: null,
  reviews: null,
  capture: null,
  followup: null,
  offers: null,
  catering: null,
};

const QUESTIONS: Array<{
  key: ScoreKey;
  title: string;
  help: string;
}> = [
  {
    key: "visibility",
    title: "Can hungry customers easily find you online?",
    help: "Website, Google, Apple Maps, menu, hours and ordering links.",
  },
  {
    key: "reviews",
    title: "Do you have a repeatable system for generating reviews?",
    help: "Not hoping for reviews — actively generating them.",
  },
  {
    key: "capture",
    title: "Are you building a customer list you actually own?",
    help: "VIP signups, email addresses and mobile numbers.",
  },
  {
    key: "followup",
    title: "Do you send text or email campaigns every month?",
    help: "Slow-day offers, events, specials and repeat-visit campaigns.",
  },
  {
    key: "offers",
    title: "Do you regularly promote trackable offers?",
    help: "Coupons, specials and promotions customers can claim.",
  },
  {
    key: "catering",
    title: "Do you actively market catering and group orders?",
    help: "Schools, churches, offices, teams and local organizations.",
  },
];

const plans = [
  {
    name: "STARTER",
    setup: "$150",
    monthly: "$99",
    weekly: "ABOUT $23/WEEK",
    headline: "Own the foundation.",
    featured: false,
    items: [
      "Restaurant website",
      "Online menu management",
      "VIP / loyalty database",
      "Coupons + digital offers",
      "QR codes for reviews, VIP + offers",
      "Ordering links + location info",
      "Owner dashboard",
    ],
  },
  {
    name: "GROWTH",
    setup: "$895",
    monthly: "$375",
    weekly: "ABOUT $87/WEEK",
    headline: "Turn the system into a growth engine.",
    featured: true,
    items: [
      "Everything in Starter",
      "TEXT MESSAGE CAMPAIGNS",
      "EMAIL CAMPAIGNS",
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
    name: "DOMINATE",
    setup: "$1,495",
    monthly: "$995",
    weekly: "ABOUT $230/WEEK",
    headline: "Build a serious local growth machine.",
    featured: false,
    items: [
      "Everything in Growth",
      "Advanced SEO + content strategy",
      "Multiple growth campaigns",
      "Catering + event campaigns",
      "Retargeting strategy",
      "PR / press release support",
      "Video content support",
      "Menu engineering",
      "Food-cost + inventory consulting",
      "Concept revitalization",
      "Merch + promotional creative",
      "Priority strategy support",
    ],
  },
];

export default function HomePage() {
  const [answers, setAnswers] = useState<Answers>(INITIAL);
  const [revealed, setRevealed] = useState(false);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null).length,
    [answers]
  );

  const score = useMemo(() => {
    const yes = Object.values(answers).filter((v) => v === true).length;
    return Math.round((yes / QUESTIONS.length) * 100);
  }, [answers]);

  const resultCopy =
    score >= 84
      ? "Your foundation is strong. Your biggest upside is consistency, campaign execution and deeper local-market growth."
      : score >= 60
      ? "You have some strong pieces, but your restaurant is still leaking opportunity through customer follow-up, visibility or repeat business."
      : score >= 35
      ? "There are several obvious growth leaks. Fixing the right systems could create more repeat visits, better reviews and stronger slow-day traffic."
      : "Too much of your growth is being left to chance. The good news: these are system problems — and system problems can be fixed.";

  function selectAnswer(key: ScoreKey, value: boolean) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setRevealed(false);
  }

  function goToSignup(plan?: string) {
    const query = plan ? `?plan=${encodeURIComponent(plan.toLowerCase())}` : "";
    window.location.href = `/signup${query}`;
  }

  function showScore() {
    if (answeredCount !== QUESTIONS.length) return;
    setRevealed(true);
    window.setTimeout(() => {
      document
        .getElementById("score-result")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }

  return (
    <main className="page">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        html, body { margin: 0; padding: 0; background: #040404; }
        body { font-family: Arial, Helvetica, sans-serif; }
        button, input { font: inherit; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          color: #fff;
          background:
            radial-gradient(circle at 88% 10%, rgba(225, 34, 45, .17), transparent 26%),
            radial-gradient(circle at 12% 56%, rgba(225, 34, 45, .08), transparent 24%),
            #040404;
          overflow: hidden;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 72px;
          padding: 0 5vw;
          border-bottom: 1px solid #171717;
          background: rgba(4, 4, 4, .90);
          backdrop-filter: blur(18px);
        }

        .brand {
          font-size: 20px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span { color: #e1222d; }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 26px;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: .9px;
          text-transform: uppercase;
        }

        .navButton,
        .primary,
        .secondary,
        .gold {
          border: 0;
          border-radius: 7px;
          padding: 15px 19px;
          cursor: pointer;
          font-weight: 1000;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .navButton,
        .primary {
          background: #e1222d;
          color: #fff;
          box-shadow: 0 15px 38px rgba(225, 34, 45, .21);
        }

        .secondary {
          border: 1px solid #303030;
          background: #101010;
          color: #fff;
        }

        .gold {
          background: #f0b63c;
          color: #080808;
        }

        .hero {
          position: relative;
          max-width: 1500px;
          min-height: 820px;
          margin: 0 auto;
          padding: 104px 6vw 88px;
          display: grid;
          grid-template-columns: 1.08fr .92fr;
          gap: 54px;
          align-items: center;
        }

        .heroGlow {
          position: absolute;
          width: 680px;
          height: 680px;
          right: -110px;
          top: 18px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(225,34,45,.22), transparent 63%);
          filter: blur(10px);
          pointer-events: none;
        }

        .heroCopy,
        .heroPanel { position: relative; z-index: 2; }

        .eyebrow {
          margin-bottom: 18px;
          color: #e1222d;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 0;
          max-width: 890px;
          font-size: clamp(62px, 7.6vw, 120px);
          line-height: .83;
          letter-spacing: -7px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .hero h1 span { color: #e1222d; }

        .heroLead {
          max-width: 720px;
          margin: 30px 0 0;
          color: #b6b6b6;
          font-size: 17px;
          line-height: 1.68;
          font-weight: 600;
        }

        .heroLead strong { color: #fff; }

        .heroActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 31px;
        }

        .microProof {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 22px;
          color: #707070;
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: .6px;
          text-transform: uppercase;
        }

        .heroPanel {
          max-width: 560px;
          margin-left: auto;
          padding: 27px;
          border: 1px solid #292929;
          border-radius: 20px;
          background:
            linear-gradient(145deg, rgba(18,18,18,.98), rgba(8,8,8,.98));
          box-shadow: 0 45px 100px rgba(0,0,0,.62);
        }

        .panelTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .panelTitle {
          font-size: 13px;
          font-weight: 1000;
          letter-spacing: 1px;
        }

        .freeBadge {
          border: 1px solid #e1222d;
          border-radius: 999px;
          padding: 7px 10px;
          color: #ff6972;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: 1px;
        }

        .fakeScore {
          margin-top: 27px;
          font-size: 112px;
          line-height: .78;
          letter-spacing: -8px;
          font-weight: 1000;
          color: #e1222d;
        }

        .fakeScore span {
          color: #666;
          font-size: 32px;
          letter-spacing: -2px;
        }

        .barGrid {
          display: grid;
          gap: 11px;
          margin-top: 28px;
        }

        .barLabel {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #8a8a8a;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: .7px;
          margin-bottom: 5px;
        }

        .barTrack {
          height: 7px;
          border-radius: 999px;
          background: #252525;
          overflow: hidden;
        }

        .barFill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #e1222d, #ff6a73);
        }

        .band {
          border-top: 1px solid #171717;
          border-bottom: 1px solid #171717;
          background: #080808;
        }

        .section {
          max-width: 1500px;
          margin: 0 auto;
          padding: 98px 6vw;
        }

        .sectionHead {
          max-width: 1000px;
          margin-bottom: 46px;
        }

        .sectionHead h2 {
          margin: 0;
          font-size: clamp(50px, 6.2vw, 90px);
          line-height: .9;
          letter-spacing: -4.5px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .sectionHead h2 span { color: #e1222d; }

        .sectionHead p {
          max-width: 800px;
          margin: 21px 0 0;
          color: #929292;
          font-size: 14px;
          line-height: 1.72;
          font-weight: 600;
        }

        .painGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 12px;
        }

        .painCard {
          min-height: 224px;
          padding: 24px;
          border: 1px solid #1f1f1f;
          border-radius: 14px;
          background: linear-gradient(145deg, #0f0f0f, #090909);
        }

        .painNum {
          color: #e1222d;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }

        .painCard h3 {
          margin: 23px 0 11px;
          font-size: 23px;
          line-height: 1;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .painCard p {
          margin: 0;
          color: #848484;
          font-size: 11px;
          line-height: 1.65;
        }

        .painStatement {
          margin-top: 34px;
          padding: 22px 24px;
          border-left: 5px solid #e1222d;
          background: #0d0d0d;
          color: #d5d5d5;
          font-size: 20px;
          line-height: 1.45;
          font-weight: 900;
        }

        .ownershipGrid {
          display: grid;
          grid-template-columns: .88fr 1.12fr;
          gap: 56px;
          align-items: center;
        }

        .bigStatement {
          font-size: clamp(58px, 7vw, 108px);
          line-height: .83;
          letter-spacing: -6px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .bigStatement span { color: #e1222d; }

        .systemList {
          display: grid;
          gap: 10px;
        }

        .systemItem {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 15px;
          align-items: center;
          padding: 16px;
          border: 1px solid #202020;
          border-radius: 11px;
          background: #0d0d0d;
        }

        .systemNumber {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #e1222d;
          font-size: 16px;
          font-weight: 1000;
        }

        .systemItem strong {
          display: block;
          font-size: 13px;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        .systemItem span {
          display: block;
          margin-top: 4px;
          color: #7c7c7c;
          font-size: 10px;
          line-height: 1.5;
        }

        .ownershipStrip {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 10px;
        }

        .ownershipCard {
          border: 1px solid #202020;
          border-radius: 10px;
          padding: 18px;
          background: #0b0b0b;
        }

        .ownershipCard strong {
          display: block;
          color: #fff;
          font-size: 12px;
          text-transform: uppercase;
        }

        .ownershipCard span {
          display: block;
          margin-top: 6px;
          color: #707070;
          font-size: 9px;
          line-height: 1.45;
        }

        .scoreSection {
          background:
            radial-gradient(circle at 12% 8%, rgba(225,34,45,.14), transparent 28%),
            #090909;
          border-top: 1px solid #1b1b1b;
          border-bottom: 1px solid #1b1b1b;
        }

        .scoreShell {
          display: grid;
          grid-template-columns: .84fr 1.16fr;
          gap: 44px;
          align-items: start;
        }

        .scorePitch h2 {
          margin: 0;
          font-size: clamp(48px, 5.4vw, 80px);
          line-height: .89;
          letter-spacing: -4px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .scorePitch h2 span { color: #e1222d; }

        .scorePitch p {
          max-width: 540px;
          color: #929292;
          font-size: 13px;
          line-height: 1.7;
        }

        .quiz {
          padding: 22px;
          border: 1px solid #242424;
          border-radius: 15px;
          background: #0c0c0c;
        }

        .question {
          padding: 15px 0;
          border-bottom: 1px solid #1c1c1c;
        }

        .question:last-child { border-bottom: 0; }

        .questionRow {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
        }

        .questionTitle {
          font-size: 11px;
          line-height: 1.4;
          font-weight: 900;
        }

        .questionHelp {
          margin-top: 4px;
          color: #676767;
          font-size: 8px;
          line-height: 1.45;
        }

        .answerGroup {
          display: flex;
          gap: 6px;
          flex: 0 0 auto;
        }

        .answer {
          width: 54px;
          padding: 8px 0;
          border: 1px solid #303030;
          border-radius: 6px;
          background: #151515;
          color: #8e8e8e;
          cursor: pointer;
          font-size: 8px;
          font-weight: 1000;
        }

        .answer.yes {
          border-color: #2d8555;
          background: #12301f;
          color: #8ce9ae;
        }

        .answer.no {
          border-color: #99323b;
          background: #321417;
          color: #ff8c93;
        }

        .quizFooter {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .progress {
          color: #696969;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: .7px;
        }

        .result {
          margin-top: 18px;
          padding: 22px;
          border: 1px solid #552026;
          border-radius: 13px;
          background: #13090a;
        }

        .resultScore {
          color: #e1222d;
          font-size: 64px;
          line-height: .9;
          letter-spacing: -4px;
          font-weight: 1000;
        }

        .resultScore span {
          color: #6d6d6d;
          font-size: 18px;
        }

        .resultTitle {
          margin-top: 9px;
          font-size: 17px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .resultText {
          margin-top: 8px;
          color: #929292;
          font-size: 10px;
          line-height: 1.6;
        }

        .planGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 14px;
          align-items: stretch;
        }

        .plan {
          position: relative;
          overflow: hidden;
          padding: 25px;
          border: 1px solid #252525;
          border-radius: 16px;
          background: #0c0c0c;
        }

        .plan.featured {
          border: 2px solid #e1222d;
          box-shadow: 0 25px 70px rgba(225,34,45,.14);
          transform: translateY(-10px);
        }

        .popular {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 28px;
          display: grid;
          place-items: center;
          background: #e1222d;
          color: #fff;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .planInner { padding-top: 7px; }
        .featured .planInner { padding-top: 30px; }

        .planName {
          font-size: 28px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .planHeadline {
          min-height: 40px;
          margin-top: 8px;
          color: #777;
          font-size: 10px;
          line-height: 1.45;
          font-weight: 800;
        }

        .priceRow {
          display: flex;
          align-items: flex-end;
          gap: 7px;
          margin-top: 14px;
        }

        .price {
          color: #fff;
          font-size: 48px;
          line-height: .9;
          letter-spacing: -3px;
          font-weight: 1000;
        }

        .monthly {
          margin-bottom: 5px;
          color: #737373;
          font-size: 8px;
          font-weight: 1000;
        }

        .weekly {
          margin-top: 8px;
          color: #e1222d;
          font-size: 10px;
          font-weight: 1000;
        }

        .setup {
          margin-top: 4px;
          color: #6e6e6e;
          font-size: 9px;
          font-weight: 800;
        }

        .featureList {
          display: grid;
          gap: 8px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #222;
        }

        .feature {
          display: flex;
          gap: 8px;
          color: #c2c2c2;
          font-size: 9px;
          line-height: 1.38;
          font-weight: 600;
        }

        .check {
          color: #e1222d;
          font-weight: 1000;
          flex: 0 0 auto;
        }

        .planButton {
          width: 100%;
          margin-top: 20px;
        }

        .final {
          padding: 110px 6vw 120px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 0%, rgba(225,34,45,.18), transparent 34%),
            #050505;
        }

        .final h2 {
          max-width: 1100px;
          margin: 0 auto;
          font-size: clamp(54px, 7vw, 102px);
          line-height: .87;
          letter-spacing: -5px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .final h2 span { color: #e1222d; }

        .final p {
          max-width: 700px;
          margin: 24px auto 0;
          color: #8b8b8b;
          font-size: 13px;
          line-height: 1.7;
        }

        .finalButtons {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .footer {
          padding: 28px 6vw 40px;
          border-top: 1px solid #171717;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          color: #555;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        @media (max-width: 1000px) {
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .heroPanel { margin: 0; }
          .painGrid, .planGrid { grid-template-columns: 1fr; }
          .plan.featured { transform: none; }
          .ownershipGrid, .scoreShell { grid-template-columns: 1fr; }
          .ownershipStrip { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .navLinks a { display: none; }
        }

        @media (max-width: 650px) {
          .nav { padding: 0 18px; }
          .hero, .section, .final { padding-left: 20px; padding-right: 20px; }
          .hero { padding-top: 72px; }
          .hero h1 { letter-spacing: -3.5px; }
          .sectionHead h2,
          .bigStatement,
          .scorePitch h2,
          .final h2 { letter-spacing: -2.5px; }
          .ownershipStrip { grid-template-columns: 1fr; }
          .questionRow { align-items: flex-start; flex-direction: column; }
          .answerGroup { width: 100%; }
          .answer { flex: 1; }
          .quizFooter { align-items: stretch; flex-direction: column; }
          .quizFooter button { width: 100%; }
          .heroActions button { width: 100%; }
          .navButton { padding: 10px 11px; }
          .brand { font-size: 17px; }
          .heroPanel { padding: 20px; }
          .fakeScore { font-size: 88px; }
        }
      `}</style>

      <nav className="nav">
        <a className="brand" href="#">
          RESTAURANT <span>OS</span>
        </a>

        <div className="navLinks">
          <a href="#problem">Why It Matters</a>
          <a href="#system">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="/login">Login</a>
          <button className="navButton" onClick={() => goToSignup()}>
            Start Restaurant OS
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="heroGlow" />

        <div className="heroCopy">
          <div className="eyebrow">
            THE GROWTH OPERATING SYSTEM FOR INDEPENDENT RESTAURANTS
          </div>

          <h1>
            STOP RENTING YOUR GROWTH.
            <br />
            <span>OWN THE SYSTEM.</span>
          </h1>

          <p className="heroLead">
            Your website. Your customer list. Your offers. Your loyalty. Your
            reviews. Your campaigns. Your data.
            <br />
            <strong>One Restaurant OS built to help you grow.</strong>
          </p>

          <div className="heroActions">
            <a href="#growth-score">
              <button className="primary">GET MY FREE GROWTH SCORE →</button>
            </a>
            <a href="#pricing">
              <button className="secondary">SEE THE PLANS</button>
            </a>
          </div>

          <div className="microProof">
            <span>✓ Built for independent restaurants</span>
            <span>✓ Start at $99/month</span>
            <span>✓ Your customer data stays yours</span>
          </div>
        </div>

        <div className="heroPanel">
          <div className="panelTop">
            <div className="panelTitle">RESTAURANT GROWTH SCORE™</div>
            <div className="freeBadge">FREE</div>
          </div>

          <div className="fakeScore">
            46<span>/100</span>
          </div>

          <div className="barGrid">
            {[
              ["LOCAL VISIBILITY", 71],
              ["REVIEWS", 64],
              ["CUSTOMER CAPTURE", 39],
              ["FOLLOW-UP", 20],
              ["OFFERS", 48],
              ["CATERING", 32],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <div className="barLabel">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="band" id="problem">
        <section className="section">
          <div className="sectionHead">
            <div className="eyebrow">THE HIDDEN COST OF DISCONNECTED GROWTH</div>
            <h2>
              YOU CAN HAVE GREAT FOOD AND STILL <span>LOSE EVERY WEEK.</span>
            </h2>
            <p>
              Restaurants do not need another pile of marketing tools. They need
              a system that captures attention, turns guests into contacts,
              brings customers back and creates more ways to generate revenue.
            </p>
          </div>

          <div className="painGrid">
            {[
              [
                "01",
                "ONE-TIME GUESTS",
                "A customer visits once, enjoys the meal and disappears. If you did not capture them, every future visit is left to memory and luck.",
              ],
              [
                "02",
                "SLOW DAYS STAY SLOW",
                "Tuesday is dead, but there is no customer list or campaign ready to create traffic when you actually need it.",
              ],
              [
                "03",
                "MISSED CATERING",
                "Churches, schools, offices, teams and local organizations are ordering somewhere. If you are not in front of them, a competitor is.",
              ],
              [
                "04",
                "WEAK LOCAL VISIBILITY",
                "Bad listings, stale menus, inconsistent hours, weak reviews and poor search presence quietly send high-intent customers elsewhere.",
              ],
              [
                "05",
                "NO FOLLOW-UP ENGINE",
                "Most restaurants work incredibly hard for the first visit and then do almost nothing systematic to create the second, third and tenth.",
              ],
              [
                "06",
                "OWNER OVERLOAD",
                "Marketing becomes another full-time responsibility piled onto staffing, payroll, vendors, food cost, operations and guest experience.",
              ],
            ].map(([number, title, text]) => (
              <article className="painCard" key={number}>
                <div className="painNum">{number}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="painStatement">
            The problem is bigger than &quot;marketing.&quot; It is lost repeat
            business, missed catering revenue, unpredictable traffic, wasted
            opportunity and an owner forced to start from zero every day.
          </div>
        </section>
      </div>

      <section className="section" id="system">
        <div className="ownershipGrid">
          <div>
            <div className="eyebrow">THE GOOD NEWS: THIS IS FIXABLE</div>
            <div className="bigStatement">
              OWN YOUR AUDIENCE.
              <br />
              OWN YOUR DATA.
              <br />
              <span>OWN YOUR GROWTH.</span>
            </div>
          </div>

          <div className="systemList">
            {[
              [
                "01",
                "ATTRACT",
                "A professional website, stronger local visibility, offers and campaigns help more people discover your restaurant.",
              ],
              [
                "02",
                "CAPTURE",
                "VIP signups, QR codes, coupons and loyalty tools turn anonymous guests into customers you can reach again.",
              ],
              [
                "03",
                "FOLLOW UP",
                "Growth and Dominate add text + email campaigns so your restaurant can create traffic instead of waiting for it.",
              ],
              [
                "04",
                "BRING THEM BACK",
                "Promotions, loyalty, reviews and repeat-visit campaigns create more reasons for customers to return.",
              ],
              [
                "05",
                "GROW",
                "Catering, local partnerships, SEO, content and strategy create additional revenue channels around the core restaurant.",
              ],
            ].map(([number, title, text]) => (
              <div className="systemItem" key={number}>
                <div className="systemNumber">{number}</div>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ownershipStrip">
          {[
            ["YOUR WEBSITE", "A restaurant site you control and can update."],
            ["YOUR CUSTOMERS", "Build a VIP database instead of starting over."],
            ["YOUR OFFERS", "Create promotions designed to drive action."],
            ["YOUR GROWTH DATA", "See what is happening and what to do next."],
          ].map(([title, text]) => (
            <div className="ownershipCard" key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="scoreSection" id="growth-score">
        <section className="section">
          <div className="scoreShell">
            <div className="scorePitch">
              <div className="eyebrow">FREE RESTAURANT GROWTH SCORE™</div>
              <h2>
                SEE WHERE YOUR RESTAURANT IS <span>LEAKING GROWTH.</span>
              </h2>
              <p>
                Answer six fast questions and get an instant score across the
                areas that matter most: local visibility, reviews, customer
                capture, follow-up, offers and catering.
              </p>
              <p>
                No long discovery call. No generic &quot;free audit.&quot; Just
                a fast diagnostic that tells you where your growth system is
                strong — and where it is not.
              </p>
            </div>

            <div>
              <div className="quiz">
                {QUESTIONS.map((question) => (
                  <div className="question" key={question.key}>
                    <div className="questionRow">
                      <div>
                        <div className="questionTitle">{question.title}</div>
                        <div className="questionHelp">{question.help}</div>
                      </div>

                      <div className="answerGroup">
                        <button
                          className={`answer ${
                            answers[question.key] === true ? "yes" : ""
                          }`}
                          onClick={() => selectAnswer(question.key, true)}
                        >
                          YES
                        </button>
                        <button
                          className={`answer ${
                            answers[question.key] === false ? "no" : ""
                          }`}
                          onClick={() => selectAnswer(question.key, false)}
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="quizFooter">
                  <div className="progress">
                    {answeredCount}/{QUESTIONS.length} ANSWERED
                  </div>
                  <button
                    className="primary"
                    onClick={showScore}
                    disabled={answeredCount !== QUESTIONS.length}
                    style={{
                      opacity: answeredCount === QUESTIONS.length ? 1 : 0.35,
                      cursor:
                        answeredCount === QUESTIONS.length
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    SHOW MY SCORE
                  </button>
                </div>
              </div>

              {revealed && (
                <div className="result" id="score-result">
                  <div className="resultScore">
                    {score}<span>/100</span>
                  </div>
                  <div className="resultTitle">YOUR RESTAURANT GROWTH SCORE</div>
                  <div className="resultText">{resultCopy}</div>

                  <button
                    className="primary"
                    style={{ marginTop: 16 }}
                    onClick={() => goToSignup("growth")}
                  >
                    BUILD MY GROWTH SYSTEM →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="section" id="pricing">
        <div className="sectionHead">
          <div className="eyebrow">ONE PLATFORM. THREE LEVELS OF FIREPOWER.</div>
          <h2>
            CHOOSE HOW HARD YOU WANT TO <span>PUSH GROWTH.</span>
          </h2>
          <p>
            Starter gives you the operating system. Growth adds the campaigns and
            local growth execution. Dominate adds deeper strategy, content,
            consulting and market-building support.
          </p>
        </div>

        <div className="planGrid">
          {plans.map((plan) => (
            <article
              className={`plan ${plan.featured ? "featured" : ""}`}
              key={plan.name}
            >
              {plan.featured && <div className="popular">MOST POPULAR</div>}

              <div className="planInner">
                <div className="planName">{plan.name}</div>
                <div className="planHeadline">{plan.headline}</div>

                <div className="priceRow">
                  <div className="price">{plan.monthly}</div>
                  <div className="monthly">/ MONTH</div>
                </div>

                <div className="weekly">{plan.weekly}</div>
                <div className="setup">{plan.setup} one-time</div>

                <div className="featureList">
                  {plan.items.map((item) => {
                    const highlighted =
                      item === "TEXT MESSAGE CAMPAIGNS" ||
                      item === "EMAIL CAMPAIGNS";

                    return (
                      <div className="feature" key={item}>
                        <span className="check">✓</span>
                        <span
                          style={{
                            color: highlighted ? "#fff" : undefined,
                            fontWeight: highlighted ? 1000 : undefined,
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  className={`planButton ${
                    plan.featured
                      ? "primary"
                      : plan.name === "DOMINATE"
                      ? "gold"
                      : "secondary"
                  }`}
                  onClick={() => goToSignup(plan.name)}
                >
                  CHOOSE {plan.name}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            color: "#5f5f5f",
            fontSize: 8,
            lineHeight: 1.55,
          }}
        >
          Advertising media spend, printing, postage and third-party platform
          fees are separate unless specifically included in writing.
        </div>
      </section>

      <section className="final">
        <div className="eyebrow">STOP STARTING FROM ZERO EVERY DAY</div>
        <h2>
          BUILD A RESTAURANT THAT <span>REMEMBERS ITS CUSTOMERS.</span>
        </h2>
        <p>
          Restaurant OS gives independent restaurants one place to manage the
          website, menu, customer database, loyalty, offers, reviews, campaigns
          and growth tools that bring people back.
        </p>

        <div className="finalButtons">
          <a href="#growth-score">
            <button className="primary">GET MY FREE GROWTH SCORE</button>
          </a>
          <button className="secondary" onClick={() => goToSignup()}>
            START RESTAURANT OS
          </button>
        </div>
      </section>

      <footer className="footer">
        <div>© 2026 Restaurant OS</div>
        <div>The Growth Operating System for Independent Restaurants</div>
        <div>
          <a href="/login">Owner Login</a>
        </div>
      </footer>
    </main>
  );
}
