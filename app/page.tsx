"use client";

import { useMemo, useState } from "react";

type BillingMode = "monthly" | "weekly";

const features = [
  {
    title: "Website + Online Presence",
    text: "A modern restaurant website, online menu, offers, ordering links, and location information built to convert traffic into customers.",
  },
  {
    title: "VIP + Loyalty Capture",
    text: "Capture guest information, build a customer list you own, and create a repeat-visit engine instead of hoping people come back.",
  },
  {
    title: "Text + Email Campaigns",
    text: "Promote slow nights, specials, events, catering, and timely offers directly to your customer base.",
  },
  {
    title: "Reviews + Reputation",
    text: "Generate more reviews, strengthen local credibility, and give happy customers a simple path to tell the world.",
  },
  {
    title: "Offers + Repeat Visits",
    text: "Create trackable offers, coupons, QR campaigns, and follow-up systems designed to turn first-time guests into regulars.",
  },
  {
    title: "Owner Command Center",
    text: "See customer growth, claims, redemptions, campaigns, and the next best move without living inside ten different platforms.",
  },
];

const problems = [
  {
    title: "Too many one-time guests",
    text: "You work hard to get people through the door, but most restaurants have no real system to bring those guests back.",
  },
  {
    title: "No audience you own",
    text: "Social platforms and third-party marketplaces own the relationship. Restaurant OS helps you build a customer database you control.",
  },
  {
    title: "Marketing is scattered",
    text: "Website here. Reviews there. Texting somewhere else. Too many tools, too little strategy, and no single growth system.",
  },
  {
    title: "Slow days kill momentum",
    text: "Empty tables still cost money. Restaurant OS gives you tools and execution to create demand when traffic drops.",
  },
];

const successManagerTasks = [
  "Strategy and campaign planning",
  "Campaign creation and setup",
  "Offer and promotion management",
  "Text + email campaign execution",
  "Ongoing optimization",
  "Monthly performance review",
];

export default function HomePage() {
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");

  const billing = useMemo(() => {
    if (billingMode === "weekly") {
      return {
        headline: "$87",
        cadence: "/ WEEK",
        small: "Weekly billing",
        detail: "Simple weekly billing with full Restaurant OS access.",
      };
    }

    return {
      headline: "$375",
      cadence: "/ MONTH",
      small: "About $87/week",
      detail: "One predictable monthly payment. Full Restaurant OS access.",
    };
  }, [billingMode]);

  function goSignup() {
    window.location.href = `/signup?billing=${billingMode}`;
  }

  function goLogin() {
    window.location.href = "/login";
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="page">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          background: #050505;
        }

        body {
          margin: 0;
          background: #050505;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        button,
        input {
          font: inherit;
        }

        button {
          cursor: pointer;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 72% 8%, rgba(204, 0, 20, 0.15), transparent 28%),
            radial-gradient(circle at 15% 18%, rgba(120, 0, 8, 0.08), transparent 25%),
            #050505;
        }

        .shell {
          width: min(1240px, calc(100% - 40px));
          margin: 0 auto;
        }

        .nav {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 0;
        }

        .brand {
          font-size: 23px;
          line-height: 1;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span {
          color: #ed1c2e;
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 26px;
        }

        .navLinks button {
          border: 0;
          background: transparent;
          color: #d4d4d4;
          padding: 0;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.4px;
        }

        .navLinks button:hover {
          color: #ffffff;
        }

        .navActions {
          display: flex;
          gap: 10px;
        }

        .btn {
          min-height: 46px;
          border-radius: 8px;
          padding: 0 18px;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.35px;
          transition: 0.18s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btnPrimary {
          border: 1px solid #ed1c2e;
          background: #ed1c2e;
          color: #ffffff;
          box-shadow: 0 16px 34px rgba(237, 28, 46, 0.2);
        }

        .btnSecondary {
          border: 1px solid #3d3d3d;
          background: rgba(8, 8, 8, 0.78);
          color: #ffffff;
        }

        .hero {
          position: relative;
          min-height: 720px;
          overflow: hidden;
          border: 1px solid #1d1d1d;
          border-radius: 22px;
          background:
            linear-gradient(
              90deg,
              rgba(3, 3, 3, 0.98) 0%,
              rgba(3, 3, 3, 0.93) 31%,
              rgba(3, 3, 3, 0.64) 55%,
              rgba(3, 3, 3, 0.38) 73%,
              rgba(3, 3, 3, 0.6) 100%
            ),
            radial-gradient(circle at 78% 36%, rgba(190, 8, 22, 0.18), transparent 34%),
            linear-gradient(180deg, #1a0708 0%, #080808 52%, #050505 100%);
          box-shadow: 0 32px 90px rgba(0, 0, 0, 0.5);
        }

        .heroScene {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .woodWall {
          position: absolute;
          right: 0;
          top: 0;
          width: 62%;
          height: 100%;
          opacity: 0.95;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.2), transparent 18%),
            repeating-linear-gradient(
              90deg,
              #150b08 0px,
              #150b08 72px,
              #24120c 73px,
              #130806 75px
            );
        }

        .shelves {
          position: absolute;
          right: 6%;
          top: 10%;
          width: 46%;
          height: 46%;
          border: 1px solid rgba(255, 255, 255, 0.04);
          background:
            repeating-linear-gradient(
              180deg,
              transparent 0,
              transparent 92px,
              rgba(255, 255, 255, 0.05) 93px,
              rgba(255, 255, 255, 0.05) 95px
            ),
            linear-gradient(90deg, rgba(0, 0, 0, 0.72), rgba(32, 4, 6, 0.22));
          box-shadow:
            inset 0 -18px 40px rgba(0, 0, 0, 0.8),
            0 0 60px rgba(160, 0, 12, 0.08);
        }

        .bottles {
          position: absolute;
          right: 8%;
          top: 13%;
          width: 42%;
          height: 38%;
          opacity: 0.88;
          background:
            radial-gradient(ellipse at 8% 14%, rgba(220, 160, 74, 0.34) 0 5px, transparent 6px),
            radial-gradient(ellipse at 15% 14%, rgba(130, 25, 20, 0.42) 0 6px, transparent 7px),
            radial-gradient(ellipse at 23% 14%, rgba(220, 160, 74, 0.25) 0 5px, transparent 6px),
            radial-gradient(ellipse at 34% 14%, rgba(157, 17, 26, 0.42) 0 6px, transparent 7px),
            radial-gradient(ellipse at 47% 14%, rgba(220, 160, 74, 0.3) 0 5px, transparent 6px),
            radial-gradient(ellipse at 61% 14%, rgba(147, 20, 25, 0.4) 0 6px, transparent 7px),
            radial-gradient(ellipse at 74% 14%, rgba(220, 160, 74, 0.3) 0 5px, transparent 6px),
            radial-gradient(ellipse at 88% 14%, rgba(163, 16, 22, 0.4) 0 6px, transparent 7px),
            radial-gradient(ellipse at 11% 48%, rgba(180, 34, 25, 0.36) 0 6px, transparent 7px),
            radial-gradient(ellipse at 24% 48%, rgba(220, 160, 74, 0.3) 0 5px, transparent 6px),
            radial-gradient(ellipse at 39% 48%, rgba(161, 17, 25, 0.4) 0 6px, transparent 7px),
            radial-gradient(ellipse at 53% 48%, rgba(220, 160, 74, 0.26) 0 5px, transparent 6px),
            radial-gradient(ellipse at 68% 48%, rgba(169, 25, 28, 0.4) 0 6px, transparent 7px),
            radial-gradient(ellipse at 84% 48%, rgba(220, 160, 74, 0.28) 0 5px, transparent 6px),
            radial-gradient(ellipse at 18% 83%, rgba(220, 160, 74, 0.3) 0 5px, transparent 6px),
            radial-gradient(ellipse at 35% 83%, rgba(151, 17, 24, 0.42) 0 6px, transparent 7px),
            radial-gradient(ellipse at 51% 83%, rgba(220, 160, 74, 0.28) 0 5px, transparent 6px),
            radial-gradient(ellipse at 69% 83%, rgba(153, 16, 23, 0.42) 0 6px, transparent 7px),
            radial-gradient(ellipse at 87% 83%, rgba(220, 160, 74, 0.3) 0 5px, transparent 6px);
          filter: blur(0.2px);
        }

        .pendant {
          position: absolute;
          top: -10px;
          width: 3px;
          height: 140px;
          background: #242424;
        }

        .pendant::after {
          content: "";
          position: absolute;
          left: -21px;
          bottom: -16px;
          width: 44px;
          height: 28px;
          border-radius: 50% 50% 42% 42%;
          background: #5e0b11;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 14px 34px rgba(205, 15, 28, 0.32);
        }

        .barTop {
          position: absolute;
          right: -3%;
          bottom: 10%;
          width: 60%;
          height: 126px;
          transform: perspective(700px) rotateX(56deg);
          transform-origin: bottom;
          background:
            linear-gradient(90deg, #27120b, #4a2114 38%, #2a110b 70%, #160b08),
            repeating-linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 0 1px,
              transparent 1px 75px
            );
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            inset 0 0 70px rgba(0, 0, 0, 0.45),
            0 -14px 50px rgba(150, 0, 10, 0.13);
        }

        .barFront {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 59%;
          height: 130px;
          background:
            linear-gradient(180deg, rgba(92, 9, 15, 0.8), rgba(16, 8, 7, 0.98)),
            repeating-linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.3) 0 2px,
              transparent 2px 86px
            );
          box-shadow: inset 0 14px 0 rgba(201, 16, 28, 0.2);
        }

        .redGlow {
          position: absolute;
          right: 3%;
          bottom: 17%;
          width: 56%;
          height: 4px;
          background: #c71020;
          filter: blur(2px);
          box-shadow: 0 0 28px #d10f20;
        }

        .heroContent {
          position: relative;
          z-index: 4;
          width: min(700px, 62%);
          padding: 76px 54px 68px;
        }

        .eyebrow {
          color: #ff3545;
          font-size: 13px;
          font-weight: 1000;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .heroTitle {
          margin: 14px 0 18px;
          max-width: 720px;
          font-size: clamp(64px, 7.4vw, 108px);
          line-height: 0.88;
          letter-spacing: -5px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .heroTitle span {
          color: #ed1c2e;
        }

        .heroLead {
          max-width: 620px;
          margin: 0;
          color: #f0f0f0;
          font-size: 21px;
          line-height: 1.45;
          font-weight: 700;
        }

        .heroSub {
          max-width: 610px;
          margin: 16px 0 0;
          color: #a9a9a9;
          font-size: 15px;
          line-height: 1.65;
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          margin-top: 28px;
        }

        .trustRow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 24px;
          color: #b9b9b9;
          font-size: 13px;
          font-weight: 800;
        }

        .stars {
          color: #f7c741;
          letter-spacing: 2px;
        }

        .valueStrip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .valueCard {
          min-height: 176px;
          padding: 22px;
          border: 1px solid #272727;
          border-radius: 14px;
          background:
            linear-gradient(180deg, rgba(17, 17, 17, 0.97), rgba(9, 9, 9, 0.98)),
            radial-gradient(circle at 0 0, rgba(237, 28, 46, 0.08), transparent 30%);
        }

        .valueNumber {
          color: #ed1c2e;
          font-size: 13px;
          font-weight: 1000;
        }

        .valueCard h3 {
          margin: 10px 0 9px;
          color: #ffffff;
          font-size: 23px;
          line-height: 1.08;
          letter-spacing: -0.8px;
        }

        .valueCard p {
          margin: 0;
          color: #a1a1a1;
          font-size: 14px;
          line-height: 1.52;
        }

        .section {
          padding-top: 88px;
        }

        .sectionTitle {
          max-width: 960px;
          margin: 10px 0 15px;
          color: #ffffff;
          font-size: clamp(44px, 5.6vw, 76px);
          line-height: 0.96;
          letter-spacing: -3.2px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .sectionTitle span {
          color: #ed1c2e;
        }

        .sectionLead {
          max-width: 850px;
          margin: 0;
          color: #adadad;
          font-size: 17px;
          line-height: 1.65;
        }

        .solutionGrid {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 18px;
          margin-top: 32px;
        }

        .solutionIntro,
        .dashboardCard {
          border: 1px solid #262626;
          border-radius: 18px;
          background: #0b0b0b;
        }

        .solutionIntro {
          padding: 30px;
        }

        .solutionIntro h3 {
          margin: 10px 0 12px;
          font-size: 42px;
          line-height: 0.98;
          letter-spacing: -2px;
          text-transform: uppercase;
        }

        .featureList {
          display: grid;
          gap: 0;
          margin-top: 22px;
        }

        .featureRow {
          padding: 17px 0;
          border-top: 1px solid #232323;
        }

        .featureRow:first-child {
          border-top: 0;
        }

        .featureRow strong {
          display: block;
          color: #ffffff;
          font-size: 17px;
          line-height: 1.2;
        }

        .featureRow p {
          margin: 6px 0 0;
          color: #989898;
          font-size: 14px;
          line-height: 1.55;
        }

        .dashboardCard {
          position: relative;
          overflow: hidden;
          padding: 22px;
          box-shadow:
            0 0 0 1px rgba(237, 28, 46, 0.18),
            0 0 46px rgba(237, 28, 46, 0.13);
        }

        .dashboardHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 18px;
          border-bottom: 1px solid #252525;
        }

        .dashboardBrand {
          font-size: 16px;
          font-weight: 1000;
        }

        .dashboardBrand span {
          color: #ed1c2e;
        }

        .dashboardStatus {
          color: #7e7e7e;
          font-size: 12px;
          font-weight: 800;
        }

        .metricGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .metric {
          padding: 16px;
          border: 1px solid #252525;
          border-radius: 10px;
          background: #121212;
        }

        .metric span {
          display: block;
          color: #8d8d8d;
          font-size: 11px;
          font-weight: 800;
        }

        .metric strong {
          display: block;
          margin-top: 8px;
          color: #ffffff;
          font-size: 25px;
          letter-spacing: -1px;
        }

        .metric small {
          display: block;
          margin-top: 6px;
          color: #48bd73;
          font-size: 10px;
          font-weight: 900;
        }

        .chartBox {
          position: relative;
          min-height: 260px;
          margin-top: 12px;
          overflow: hidden;
          border: 1px solid #252525;
          border-radius: 12px;
          background:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px),
            #101010;
          background-size: 48px 48px;
        }

        .chartTitle {
          position: absolute;
          left: 18px;
          top: 16px;
          z-index: 2;
          font-size: 13px;
          font-weight: 900;
        }

        .chartLine {
          position: absolute;
          left: 6%;
          right: 5%;
          bottom: 22%;
          height: 42%;
          clip-path: polygon(
            0 83%,
            7% 74%,
            14% 79%,
            22% 60%,
            30% 67%,
            38% 49%,
            46% 55%,
            55% 34%,
            63% 43%,
            71% 24%,
            78% 31%,
            87% 12%,
            94% 17%,
            100% 0,
            100% 100%,
            0 100%
          );
          background: linear-gradient(180deg, rgba(237, 28, 46, 0.58), rgba(237, 28, 46, 0.03));
          border-bottom: 2px solid #ed1c2e;
        }

        .managerSection {
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 0;
          margin-top: 88px;
          overflow: hidden;
          border: 1px solid #2b2b2b;
          border-radius: 20px;
          background:
            linear-gradient(120deg, #0b0b0b 0%, #0b0b0b 55%, #11090a 100%);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.38);
        }

        .managerVisual {
          position: relative;
          min-height: 420px;
          overflow: hidden;
          background:
            radial-gradient(circle at 52% 32%, rgba(237, 28, 46, 0.15), transparent 28%),
            linear-gradient(160deg, #1a1010, #080808 58%, #030303);
        }

        .managerDesk {
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: 14%;
          height: 95px;
          border-radius: 8px;
          background:
            linear-gradient(180deg, #3b2014, #160d09),
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,.03) 0 1px,
              transparent 1px 58px
            );
          box-shadow: 0 -12px 38px rgba(150, 0, 12, 0.1);
        }

        .managerMonitor {
          position: absolute;
          left: 19%;
          bottom: 35%;
          width: 58%;
          height: 37%;
          border: 6px solid #181818;
          border-radius: 10px;
          background:
            linear-gradient(180deg, #151515, #090909),
            #111;
          box-shadow: 0 0 45px rgba(237,28,46,.12);
        }

        .managerMonitor::before {
          content: "";
          position: absolute;
          left: 7%;
          right: 7%;
          bottom: 16%;
          height: 48%;
          background: linear-gradient(180deg, rgba(237,28,46,.45), rgba(237,28,46,.03));
          clip-path: polygon(
            0 82%,
            12% 72%,
            24% 76%,
            38% 54%,
            49% 61%,
            64% 31%,
            76% 41%,
            88% 19%,
            100% 4%,
            100% 100%,
            0 100%
          );
        }

        .managerLamp {
          position: absolute;
          right: 12%;
          top: 12%;
          width: 4px;
          height: 130px;
          background: #2a2a2a;
        }

        .managerLamp::after {
          content: "";
          position: absolute;
          left: -28px;
          bottom: -20px;
          width: 60px;
          height: 36px;
          border-radius: 50% 50% 42% 42%;
          background: #660b14;
          box-shadow: 0 18px 42px rgba(237, 28, 46, 0.28);
        }

        .managerCopy {
          padding: 42px 40px;
        }

        .managerCopy h2 {
          margin: 10px 0 14px;
          font-size: clamp(42px, 4.8vw, 68px);
          line-height: 0.94;
          letter-spacing: -3px;
          text-transform: uppercase;
        }

        .managerCopy h2 span {
          color: #ed1c2e;
        }

        .managerLead {
          margin: 0;
          max-width: 660px;
          color: #c5c5c5;
          font-size: 18px;
          line-height: 1.58;
          font-weight: 700;
        }

        .managerSub {
          margin: 12px 0 0;
          color: #919191;
          font-size: 15px;
          line-height: 1.65;
        }

        .managerTasks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .managerTask {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid #292929;
          border-radius: 9px;
          background: #0d0d0d;
          color: #d2d2d2;
          font-size: 13px;
          line-height: 1.42;
          font-weight: 800;
        }

        .check {
          color: #ed1c2e;
          font-weight: 1000;
        }

        .pricing {
          margin-top: 88px;
          padding: 36px;
          border: 1px solid #302426;
          border-radius: 20px;
          background:
            radial-gradient(circle at 72% 0%, rgba(237, 28, 46, 0.14), transparent 28%),
            linear-gradient(145deg, #0c0c0c, #090909);
        }

        .pricingTop {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          align-items: end;
        }

        .pricing h2 {
          margin: 10px 0 10px;
          font-size: clamp(42px, 5.2vw, 70px);
          line-height: 0.95;
          letter-spacing: -3px;
          text-transform: uppercase;
        }

        .pricing h2 span {
          color: #ed1c2e;
        }

        .pricingText {
          max-width: 720px;
          margin: 0;
          color: #a9a9a9;
          font-size: 16px;
          line-height: 1.65;
        }

        .billingToggle {
          display: inline-grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid #343434;
          border-radius: 10px;
          background: #080808;
        }

        .billingToggle button {
          min-width: 115px;
          min-height: 46px;
          border: 0;
          background: transparent;
          color: #a5a5a5;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 1000;
        }

        .billingToggle button.active {
          background: #ed1c2e;
          color: #ffffff;
        }

        .pricePanel {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 20px;
          align-items: center;
          margin-top: 28px;
          padding: 30px;
          border: 1px solid #302426;
          border-radius: 16px;
          background:
            linear-gradient(90deg, rgba(237,28,46,.07), transparent 38%),
            #090909;
        }

        .priceValue {
          font-size: clamp(78px, 9vw, 120px);
          line-height: 0.82;
          letter-spacing: -7px;
          font-weight: 1000;
        }

        .priceValue span {
          margin-left: 8px;
          color: #ed1c2e;
          font-size: 16px;
          letter-spacing: 0;
        }

        .priceSmall {
          margin-top: 11px;
          color: #ffffff;
          font-size: 17px;
          font-weight: 900;
        }

        .priceDetail {
          margin-top: 6px;
          color: #919191;
          font-size: 14px;
          line-height: 1.5;
        }

        .pricingBenefits {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .pricingBenefit {
          display: flex;
          gap: 10px;
          color: #d4d4d4;
          font-size: 14px;
          line-height: 1.4;
          font-weight: 800;
        }

        .priceActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .footerCta {
          margin: 88px 0 30px;
          padding: 48px 24px;
          border-top: 1px solid #1f1f1f;
          border-bottom: 1px solid #1f1f1f;
          text-align: center;
          background:
            radial-gradient(circle at 50% 0%, rgba(237, 28, 46, 0.12), transparent 36%),
            #070707;
        }

        .footerCta h2 {
          max-width: 920px;
          margin: 8px auto 12px;
          font-size: clamp(46px, 6vw, 80px);
          line-height: 0.94;
          letter-spacing: -3.6px;
          text-transform: uppercase;
        }

        .footerCta h2 span {
          color: #ed1c2e;
        }

        .footerCta p {
          max-width: 760px;
          margin: 0 auto;
          color: #aaaaaa;
          font-size: 16px;
          line-height: 1.62;
        }

        .footerActions {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        @media (max-width: 1050px) {
          .navLinks {
            display: none;
          }

          .heroContent {
            width: 72%;
          }

          .valueStrip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .solutionGrid,
          .managerSection,
          .pricePanel {
            grid-template-columns: 1fr;
          }

          .managerVisual {
            min-height: 300px;
          }

          .pricingTop {
            grid-template-columns: 1fr;
          }

          .billingToggle {
            width: max-content;
          }
        }

        @media (max-width: 720px) {
          .shell {
            width: min(100% - 28px, 1240px);
          }

          .nav {
            align-items: flex-start;
            flex-direction: column;
          }

          .navActions {
            width: 100%;
          }

          .navActions .btn {
            flex: 1;
          }

          .hero {
            min-height: 710px;
          }

          .heroContent {
            width: 100%;
            padding: 64px 24px 52px;
          }

          .heroTitle {
            font-size: 58px;
            letter-spacing: -3px;
          }

          .heroLead {
            font-size: 19px;
          }

          .woodWall,
          .shelves,
          .bottles,
          .pendant,
          .barTop,
          .barFront,
          .redGlow {
            opacity: 0.38;
          }

          .valueStrip,
          .metricGrid,
          .managerTasks,
          .pricingBenefits {
            grid-template-columns: 1fr;
          }

          .solutionIntro,
          .dashboardCard,
          .managerCopy,
          .pricing {
            padding: 22px;
          }

          .sectionTitle {
            letter-spacing: -2px;
          }

          .priceValue {
            font-size: 78px;
            letter-spacing: -5px;
          }

          .billingToggle {
            width: 100%;
          }

          .billingToggle button {
            width: 100%;
          }
        }
      `}</style>

      <div className="shell">
        <nav className="nav">
          <div className="brand">
            RESTAURANT <span>OS</span>
          </div>

          <div className="navLinks">
            <button onClick={() => scrollTo("how")}>HOW IT WORKS</button>
            <button onClick={() => scrollTo("features")}>FEATURES</button>
            <button onClick={() => scrollTo("manager")}>SUCCESS MANAGER</button>
            <button onClick={() => scrollTo("pricing")}>PRICING</button>
          </div>

          <div className="navActions">
            <button className="btn btnSecondary" onClick={goLogin}>
              OWNER LOGIN
            </button>
            <button className="btn btnPrimary" onClick={goSignup}>
              START RESTAURANT OS →
            </button>
          </div>
        </nav>

        <section className="hero">
          <div className="heroScene">
            <div className="woodWall" />
            <div className="shelves" />
            <div className="bottles" />

            <div className="pendant" style={{ right: "18%" }} />
            <div className="pendant" style={{ right: "31%", height: "112px" }} />
            <div className="pendant" style={{ right: "43%", height: "126px" }} />

            <div className="barTop" />
            <div className="barFront" />
            <div className="redGlow" />
          </div>

          <div className="heroContent">
            <div className="eyebrow">
              THE GROWTH OPERATING SYSTEM FOR INDEPENDENT RESTAURANTS
            </div>

            <h1 className="heroTitle">
              TURN MORE GUESTS INTO <span>LOYAL REGULARS.</span>
            </h1>

            <p className="heroLead">
              Restaurant OS combines the software, strategy, and hands-on execution
              independent restaurants need to attract customers, bring them back,
              and grow more consistently.
            </p>

            <p className="heroSub">
              You get the platform — plus a dedicated Marketing Success Manager who
              helps plan campaigns, build offers, run the marketing, and keep the
              system moving. You run the restaurant. We help run the growth engine.
            </p>

            <div className="heroActions">
              <button className="btn btnPrimary" onClick={goSignup}>
                GROW MY RESTAURANT →
              </button>
              <button className="btn btnSecondary" onClick={() => scrollTo("how")}>
                SEE HOW IT WORKS
              </button>
            </div>

            <div className="trustRow">
              <span className="stars">★★★★★</span>
              <span>Built for serious independent restaurant operators.</span>
            </div>
          </div>
        </section>

        <section className="valueStrip">
          {problems.map((item, index) => (
            <article className="valueCard" key={item.title}>
              <div className="valueNumber">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="section" id="how">
          <div className="eyebrow">THE SOLUTION</div>

          <h2 className="sectionTitle">
            ONE SYSTEM. REAL EXECUTION. <span>LESS GUESSWORK.</span>
          </h2>

          <p className="sectionLead">
            Restaurant OS brings the tools and the execution together. Instead of
            handing you another dashboard and wishing you luck, we give you the
            platform, the playbook, and a real person helping move the work forward.
          </p>

          <div className="solutionGrid" id="features">
            <div className="solutionIntro">
              <div className="eyebrow">EVERYTHING YOU NEED</div>
              <h3>One growth engine that actually works together.</h3>

              <div className="featureList">
                {features.map((feature) => (
                  <div className="featureRow" key={feature.title}>
                    <strong>{feature.title}</strong>
                    <p>{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboardCard">
              <div className="dashboardHead">
                <div className="dashboardBrand">
                  RESTAURANT <span>OS</span> · OWNER COMMAND CENTER
                </div>
                <div className="dashboardStatus">GROWTH AT A GLANCE</div>
              </div>

              <div className="metricGrid">
                <div className="metric">
                  <span>VIP CUSTOMERS</span>
                  <strong>1,297</strong>
                  <small>+24% THIS MONTH</small>
                </div>
                <div className="metric">
                  <span>REPEAT VISITS</span>
                  <strong>42%</strong>
                  <small>+7% TREND</small>
                </div>
                <div className="metric">
                  <span>ACTIVE OFFERS</span>
                  <strong>6</strong>
                  <small>3 CAMPAIGNS LIVE</small>
                </div>
                <div className="metric">
                  <span>REDEMPTIONS</span>
                  <strong>324</strong>
                  <small>TRACKED ACTION</small>
                </div>
              </div>

              <div className="chartBox">
                <div className="chartTitle">CUSTOMER GROWTH</div>
                <div className="chartLine" />
              </div>
            </div>
          </div>
        </section>

        <section className="managerSection" id="manager">
          <div className="managerVisual">
            <div className="managerMonitor" />
            <div className="managerDesk" />
            <div className="managerLamp" />
          </div>

          <div className="managerCopy">
            <div className="eyebrow">YOU GET MORE THAN SOFTWARE</div>

            <h2>
              A DEDICATED <span>MARKETING SUCCESS MANAGER</span> WHO DOES THE WORK
              WITH YOU.
            </h2>

            <p className="managerLead">
              This is the difference. You are not buying another piece of software
              that sits unused after two weeks.
            </p>

            <p className="managerSub">
              Your dedicated Marketing Success Manager helps turn the system into
              action — planning campaigns, setting up promotions, helping execute
              your customer marketing, reviewing performance, and keeping growth
              moving while you stay focused on running the restaurant.
            </p>

            <div className="managerTasks">
              {successManagerTasks.map((task) => (
                <div className="managerTask" key={task}>
                  <span className="check">✓</span>
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pricing" id="pricing">
          <div className="pricingTop">
            <div>
              <div className="eyebrow">ONE SIMPLE PRICE. FULL FIREPOWER.</div>
              <h2>
                SOFTWARE + STRATEGY + <span>REAL HUMAN EXECUTION.</span>
              </h2>
              <p className="pricingText">
                Everything Restaurant OS plus your dedicated Marketing Success
                Manager. Choose the billing rhythm that works best for your
                restaurant.
              </p>
            </div>

            <div className="billingToggle">
              <button
                className={billingMode === "monthly" ? "active" : ""}
                onClick={() => setBillingMode("monthly")}
              >
                MONTHLY
              </button>
              <button
                className={billingMode === "weekly" ? "active" : ""}
                onClick={() => setBillingMode("weekly")}
              >
                WEEKLY
              </button>
            </div>
          </div>

          <div className="pricePanel">
            <div>
              <div className="priceValue">
                {billing.headline}
                <span>{billing.cadence}</span>
              </div>
              <div className="priceSmall">{billing.small}</div>
              <div className="priceDetail">{billing.detail}</div>
            </div>

            <div>
              <div className="pricingBenefits">
                {[
                  "Restaurant website + online menu",
                  "VIP / loyalty customer database",
                  "Text + email campaigns",
                  "Offers + QR campaigns",
                  "Reviews + reputation tools",
                  "Owner Command Center",
                  "Dedicated Marketing Success Manager",
                  "Campaign planning + ongoing optimization",
                ].map((benefit) => (
                  <div className="pricingBenefit" key={benefit}>
                    <span className="check">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="priceActions">
                <button className="btn btnPrimary" onClick={goSignup}>
                  START RESTAURANT OS →
                </button>
                <button className="btn btnSecondary" onClick={() => scrollTo("manager")}>
                  SEE WHAT WE DO FOR YOU
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="footerCta">
          <div className="eyebrow">LESS GUESSWORK. MORE GROWTH.</div>

          <h2>
            YOU RUN THE RESTAURANT. <span>WE HELP RUN THE GROWTH ENGINE.</span>
          </h2>

          <p>
            One system. One team. One clear growth strategy — built to help turn
            more first-time guests into loyal regulars.
          </p>

          <div className="footerActions">
            <button className="btn btnPrimary" onClick={goSignup}>
              START RESTAURANT OS →
            </button>
            <button className="btn btnSecondary" onClick={goLogin}>
              OWNER LOGIN
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
