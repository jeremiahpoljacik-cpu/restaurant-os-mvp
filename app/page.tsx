"use client";


const problems = [
  ["Too many one-time guests", "You work hard to get people in the door, but most never come back."],
  ["No audience you own", "Relying on social and third parties means you are renting, not building."],
  ["Marketing is scattered", "Too many tools. No strategy. Wasted time, wasted money, unclear results."],
  ["Slow days kill momentum", "Inconsistent traffic and sales make it hard to grow with confidence."],
];

const services = [
  ["Website + Online Presence", "A crisp mobile-first restaurant website designed to turn visitors into customers."],
  ["Loyalty + VIP Capture", "Capture guest info, grow your customer list, and build real repeat business."],
  ["Text + Email Campaigns", "Promote events, fill slow nights, and drive repeat visits."],
  ["Reviews + QR Growth Tools", "Get more reviews, improve visibility, and capture more customer data."],
  ["Offers + Repeat-Visit Systems", "Create compelling offers and measurable follow-up that brings guests back."],
];

const managerTasks = [
  "Strategy and campaign planning",
  "Content creation and setup",
  "Offer and promotion management",
  "Text + email campaign execution",
  "Ongoing optimization",
  "Monthly performance review",
];

export default function HomePage() {
  const goSignup = () => {
    window.location.href = "/signup";
  };

  const goLogin = () => {
    window.location.href = "/login";
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="page">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; background: #050505; }
        body {
          margin: 0;
          background: #050505;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        button { font: inherit; }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 78% 12%, rgba(190, 8, 20, 0.16), transparent 30%),
            #050505;
        }

        .shell {
          width: min(1240px, calc(100% - 34px));
          margin: 0 auto;
        }

        .nav {
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          font-size: 24px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span { color: #ed1c2e; }

        .navLinks {
          display: flex;
          gap: 30px;
          align-items: center;
        }

        .navLinks button {
          border: 0;
          background: transparent;
          color: #ddd;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .35px;
          cursor: pointer;
        }

        .navActions {
          display: flex;
          gap: 10px;
        }

        .btn {
          min-height: 46px;
          border-radius: 7px;
          padding: 0 18px;
          font-size: 12px;
          font-weight: 1000;
          cursor: pointer;
        }

        .primary {
          border: 1px solid #ed1c2e;
          background: #ed1c2e;
          color: #fff;
          box-shadow: 0 12px 34px rgba(237,28,46,.22);
        }

        .secondary {
          border: 1px solid #4a4a4a;
          background: rgba(7,7,7,.88);
          color: #fff;
        }

        .hero {
          position: relative;
          overflow: hidden;
          min-height: 690px;
          border: 1px solid #1c1c1c;
          border-radius: 22px;
          background-image:
            linear-gradient(
              90deg,
              rgba(3,3,3,.99) 0%,
              rgba(3,3,3,.96) 32%,
              rgba(3,3,3,.72) 48%,
              rgba(3,3,3,.24) 73%,
              rgba(3,3,3,.38) 100%
            ),
            linear-gradient(
              180deg,
              rgba(40,0,4,.18),
              rgba(0,0,0,.18)
            ),
            url("/restaurant-os-802-bar-hero.png");
          background-size: cover;
          background-position: center 52%;
          box-shadow: 0 30px 85px rgba(0,0,0,.48);
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 77% 48%, rgba(225,0,18,.10), transparent 30%),
            linear-gradient(180deg, transparent 55%, rgba(0,0,0,.35));
        }

        .heroContent {
          position: relative;
          z-index: 2;
          width: min(640px, 56%);
          padding: 78px 50px 64px;
        }

        .eyebrow {
          color: #ff3444;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .heroTitle {
          margin: 13px 0 18px;
          font-size: clamp(68px, 7.5vw, 112px);
          line-height: .86;
          letter-spacing: -5px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .heroTitle span { color: #ed1c2e; }

        .heroLead {
          margin: 0;
          color: #f2f2f2;
          font-size: 20px;
          line-height: 1.45;
          font-weight: 700;
        }

        .heroSub {
          margin: 15px 0 0;
          color: #bebebe;
          font-size: 15px;
          line-height: 1.62;
        }

        .heroActions {
          display: flex;
          gap: 11px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .trust {
          margin-top: 23px;
          color: #d7d7d7;
          font-size: 13px;
          font-weight: 800;
        }

        .stars {
          color: #f4c638;
          letter-spacing: 2px;
          margin-right: 10px;
        }

        .problemGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .problem {
          min-height: 172px;
          padding: 22px;
          border: 1px solid #2a2a2a;
          border-radius: 13px;
          background:
            radial-gradient(circle at 0 0, rgba(237,28,46,.06), transparent 30%),
            linear-gradient(180deg, #0f0f0f, #090909);
        }

        .problemNum {
          color: #ed1c2e;
          font-size: 12px;
          font-weight: 1000;
        }

        .problem h3 {
          margin: 10px 0 9px;
          font-size: 22px;
          line-height: 1.08;
          letter-spacing: -.7px;
        }

        .problem p {
          margin: 0;
          color: #aaa;
          font-size: 14px;
          line-height: 1.52;
        }

        .section {
          padding-top: 84px;
        }

        .sectionTitle {
          margin: 10px 0 14px;
          max-width: 980px;
          font-size: clamp(48px, 5.8vw, 78px);
          line-height: .95;
          letter-spacing: -3px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .sectionTitle span { color: #ed1c2e; }

        .sectionLead {
          margin: 0;
          max-width: 860px;
          color: #b1b1b1;
          font-size: 17px;
          line-height: 1.65;
        }

        .solutionGrid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 16px;
          margin-top: 30px;
        }

        .solutionPanel,
        .dashboardPanel {
          border: 1px solid #272727;
          border-radius: 17px;
          background: #0b0b0b;
        }

        .solutionPanel { padding: 30px; }

        .solutionPanel h3 {
          margin: 8px 0 14px;
          font-size: 40px;
          line-height: .96;
          letter-spacing: -2px;
          text-transform: uppercase;
        }

        .service {
          padding: 16px 0;
          border-top: 1px solid #242424;
        }

        .service:first-of-type { border-top: 0; }

        .service strong {
          display: block;
          font-size: 17px;
        }

        .service p {
          margin: 6px 0 0;
          color: #9b9b9b;
          font-size: 14px;
          line-height: 1.55;
        }

        .dashboardPanel {
          padding: 22px;
          box-shadow:
            0 0 0 1px rgba(237,28,46,.15),
            0 0 48px rgba(237,28,46,.12);
        }

        .dashTop {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid #242424;
        }

        .dashBrand {
          font-size: 16px;
          font-weight: 1000;
        }

        .dashBrand span { color: #ed1c2e; }

        .dashStatus {
          color: #8c8c8c;
          font-size: 12px;
          font-weight: 800;
        }

        .metricGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
          margin-top: 15px;
        }

        .metric {
          padding: 15px;
          border: 1px solid #252525;
          border-radius: 9px;
          background: #121212;
        }

        .metric span {
          display: block;
          color: #909090;
          font-size: 11px;
          font-weight: 800;
        }

        .metric strong {
          display: block;
          margin-top: 8px;
          font-size: 25px;
          letter-spacing: -1px;
        }

        .metric small {
          display: block;
          margin-top: 6px;
          color: #44c273;
          font-size: 10px;
          font-weight: 900;
        }

        .chart {
          position: relative;
          min-height: 245px;
          margin-top: 12px;
          overflow: hidden;
          border: 1px solid #252525;
          border-radius: 11px;
          background:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px),
            #101010;
          background-size: 46px 46px;
        }

        .chart::before {
          content: "";
          position: absolute;
          left: 7%;
          right: 5%;
          bottom: 18%;
          height: 48%;
          clip-path: polygon(
            0 80%, 8% 71%, 15% 77%, 23% 57%, 31% 63%, 40% 45%,
            48% 53%, 57% 31%, 66% 39%, 75% 20%, 83% 29%, 91% 12%, 100% 0,
            100% 100%, 0 100%
          );
          background: linear-gradient(180deg, rgba(237,28,46,.55), rgba(237,28,46,.03));
          border-bottom: 2px solid #ed1c2e;
        }

        .manager {
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 0;
          margin-top: 84px;
          overflow: hidden;
          border: 1px solid #2a2a2a;
          border-radius: 20px;
          background: linear-gradient(120deg, #0b0b0b, #100809);
        }

        .managerPhoto {
          min-height: 430px;
          background-image:
            linear-gradient(90deg, rgba(5,5,5,.08), rgba(5,5,5,.30)),
            url("https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=86");
          background-size: cover;
          background-position: center;
          border-right: 1px solid #242424;
        }

        .managerCopy {
          padding: 42px 40px;
        }

        .managerCopy h2 {
          margin: 10px 0 14px;
          font-size: clamp(44px, 4.7vw, 68px);
          line-height: .94;
          letter-spacing: -3px;
          text-transform: uppercase;
        }

        .managerCopy h2 span { color: #ed1c2e; }

        .managerLead {
          margin: 0;
          color: #ededed;
          font-size: 19px;
          line-height: 1.52;
          font-weight: 800;
        }

        .managerSub {
          margin: 13px 0 0;
          color: #a6a6a6;
          font-size: 15px;
          line-height: 1.65;
        }

        .managerTasks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 10px;
          margin-top: 22px;
        }

        .task {
          display: flex;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid #2a2a2a;
          border-radius: 9px;
          background: #0d0d0d;
          color: #d6d6d6;
          font-size: 13px;
          line-height: 1.42;
          font-weight: 800;
        }

        .check { color: #ed1c2e; font-weight: 1000; }

        .pricing {
          margin-top: 84px;
          padding: 34px;
          border: 1px solid #302426;
          border-radius: 20px;
          background:
            radial-gradient(circle at 75% 0%, rgba(237,28,46,.13), transparent 28%),
            #0a0a0a;
        }

        .pricingTop {
          display: block;
        }

        .pricing h2 {
          margin: 10px 0 10px;
          font-size: clamp(44px, 5vw, 68px);
          line-height: .95;
          letter-spacing: -3px;
          text-transform: uppercase;
        }

        .pricing h2 span { color: #ed1c2e; }

        .pricing p {
          margin: 0;
          max-width: 760px;
          color: #aaa;
          font-size: 16px;
          line-height: 1.62;
        }

        .pricePanel {
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 22px;
          align-items: center;
          margin-top: 26px;
          padding: 29px;
          border: 1px solid #302426;
          border-radius: 15px;
          background:
            linear-gradient(90deg, rgba(237,28,46,.06), transparent 38%),
            #090909;
        }

        .money {
          font-size: clamp(82px, 8.5vw, 118px);
          line-height: .82;
          letter-spacing: -7px;
          font-weight: 1000;
        }

        .money span {
          margin-left: 7px;
          color: #ed1c2e;
          font-size: 16px;
          letter-spacing: 0;
        }

        .priceNote {
          margin-top: 11px;
          font-size: 17px;
          font-weight: 900;
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 10px;
        }

        .benefit {
          display: flex;
          gap: 10px;
          color: #d7d7d7;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.4;
        }

        .footer {
          margin: 84px 0 30px;
          padding: 44px 22px;
          text-align: center;
          border-top: 1px solid #222;
          border-bottom: 1px solid #222;
          background: radial-gradient(circle at 50% 0%, rgba(237,28,46,.10), transparent 38%);
        }

        .footer h2 {
          margin: 8px auto 12px;
          max-width: 960px;
          font-size: clamp(48px, 6vw, 80px);
          line-height: .94;
          letter-spacing: -3.5px;
          text-transform: uppercase;
        }

        .footer h2 span { color: #ed1c2e; }

        .footer p {
          margin: 0 auto;
          max-width: 760px;
          color: #aaa;
          font-size: 16px;
          line-height: 1.6;
        }

        .footerActions {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        @media (max-width: 1020px) {
          .navLinks { display: none; }
          .heroContent { width: 70%; }
          .problemGrid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .solutionGrid,
          .manager,
          .pricePanel { grid-template-columns: 1fr; }
          .managerPhoto {
            min-height: 320px;
            border-right: 0;
            border-bottom: 1px solid #242424;
          }
        }

        @media (max-width: 700px) {
          .shell { width: min(100% - 26px, 1240px); }

          .nav {
            height: auto;
            padding: 20px 0;
            flex-direction: column;
            align-items: flex-start;
          }

          .navActions { width: 100%; }
          .navActions .btn { flex: 1; }

          .hero {
            min-height: 710px;
            background-position: 62% center;
          }

          .heroContent {
            width: 100%;
            padding: 60px 23px 50px;
            background: linear-gradient(90deg, rgba(3,3,3,.98), rgba(3,3,3,.82), rgba(3,3,3,.62));
          }

          .heroTitle {
            font-size: 58px;
            letter-spacing: -3px;
          }

          .heroLead { font-size: 18px; }

          .problemGrid,
          .metricGrid,
          .managerTasks,
          .benefits {
            grid-template-columns: 1fr;
          }

          .solutionPanel,
          .dashboardPanel,
          .managerCopy,
          .pricing {
            padding: 22px;
          }

          .sectionTitle { letter-spacing: -2px; }

          .money {
            font-size: 78px;
            letter-spacing: -5px;
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
            <button className="btn secondary" onClick={goLogin}>
              OWNER LOGIN
            </button>
            <button className="btn primary" onClick={goSignup}>
              START RESTAURANT OS →
            </button>
          </div>
        </nav>

        <section className="hero">
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
              <button className="btn primary" onClick={goSignup}>
                GROW MY RESTAURANT →
              </button>
              <button className="btn secondary" onClick={() => scrollTo("how")}>
                SEE HOW IT WORKS
              </button>
            </div>

            <div className="trust">
              <span className="stars">★★★★★</span>
              Built for serious independent restaurant operators.
            </div>
          </div>
        </section>

        <section className="problemGrid">
          {problems.map(([title, text], index) => (
            <article className="problem" key={title}>
              <div className="problemNum">{String(index + 1).padStart(2, "0")}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="section" id="how">
          <div className="eyebrow">THE SOLUTION</div>

          <h2 className="sectionTitle">
            EVERYTHING YOU NEED. <span>ONE SYSTEM THAT WORKS.</span>
          </h2>

          <p className="sectionLead">
            Restaurant OS brings your marketing, customers, offers, follow-up,
            reputation, and growth dashboard into one operating system — backed by
            a real person helping execute the work.
          </p>

          <div className="solutionGrid" id="features">
            <div className="solutionPanel">
              <div className="eyebrow">ONE GROWTH ENGINE</div>
              <h3>Run your restaurant. Grow your business.</h3>

              {services.map(([title, text]) => (
                <div className="service" key={title}>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>

            <div className="dashboardPanel">
              <div className="dashTop">
                <div className="dashBrand">
                  RESTAURANT <span>OS</span> · DASHBOARD
                </div>
                <div className="dashStatus">GROWTH AT A GLANCE</div>
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

              <div className="chart" />
            </div>
          </div>
        </section>

        <section className="manager" id="manager">
          <div className="managerPhoto" />

          <div className="managerCopy">
            <div className="eyebrow">YOU GET MORE THAN SOFTWARE</div>

            <h2>
              A DEDICATED <span>MARKETING SUCCESS MANAGER</span> WHO DOES THE WORK
              WITH YOU.
            </h2>

            <p className="managerLead">
              You are not buying another piece of software that gets ignored after
              two weeks.
            </p>

            <p className="managerSub">
              Your Marketing Success Manager helps turn Restaurant OS into action —
              planning campaigns, setting up promotions, helping execute customer
              marketing, reviewing results, and keeping the growth system moving.
            </p>

            <div className="managerTasks">
              {managerTasks.map((task) => (
                <div className="task" key={task}>
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
              <p>
                Everything Restaurant OS plus your dedicated Marketing Success
                Manager. Choose weekly or monthly billing.
              </p>
            </div>

          </div>

          <div className="pricePanel">
            <div>
              <div className="money">
                $375
                <span>/ MONTH</span>
              </div>
              <div className="priceNote">About $87/week</div>
            </div>

            <div className="benefits">
              {[
                "Everything included",
                "Dedicated Marketing Success Manager",
                "Website + online menu",
                "VIP customer database",
                "Text + email campaigns",
                "Offers + QR campaigns",
                "Review-growth tools",
                "Owner Command Center",
              ].map((benefit) => (
                <div className="benefit" key={benefit}>
                  <span className="check">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}

              <button className="btn primary" onClick={goSignup}>
                START RESTAURANT OS →
              </button>
            </div>
          </div>
        </section>

        <section className="footer">
          <div className="eyebrow">LESS GUESSWORK. MORE GROWTH.</div>
          <h2>
            YOU RUN THE RESTAURANT. <span>WE HELP RUN THE GROWTH ENGINE.</span>
          </h2>
          <p>
            One system. One dedicated growth partner. One clear plan to help turn
            more first-time guests into loyal regulars.
          </p>

          <div className="footerActions">
            <button className="btn primary" onClick={goSignup}>
              START RESTAURANT OS →
            </button>
            <button className="btn secondary" onClick={goLogin}>
              OWNER LOGIN
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
