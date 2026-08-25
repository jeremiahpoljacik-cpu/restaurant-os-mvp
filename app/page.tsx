\"use client\";

export default function HomePage() {
  function goSignup() {
    window.location.href = "/signup";
  }

  function goLogin() {
    window.location.href = "/login";
  }

  return (
    <main className="page">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background: #050505;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        button {
          font: inherit;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 78% 12%, rgba(173, 16, 27, 0.22), transparent 28%),
            radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.03), transparent 18%),
            #050505;
        }

        .shell {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px 90px;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 0 10px;
        }

        .brand {
          font-size: 22px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span {
          color: #e31d2c;
        }

        .navActions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ghostBtn,
        .primaryBtn,
        .secondaryBtn {
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .ghostBtn {
          background: rgba(255, 255, 255, 0.02);
          color: #ffffff;
          border: 1px solid #2e2e2e;
        }

        .ghostBtn:hover {
          border-color: #525252;
          transform: translateY(-1px);
        }

        .primaryBtn {
          background: #e31d2c;
          color: #ffffff;
          border: 1px solid #e31d2c;
          box-shadow: 0 14px 40px rgba(227, 29, 44, 0.22);
        }

        .primaryBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 44px rgba(227, 29, 44, 0.3);
        }

        .secondaryBtn {
          background: transparent;
          color: #ffffff;
          border: 1px solid #343434;
        }

        .secondaryBtn:hover {
          border-color: #5b5b5b;
          transform: translateY(-1px);
        }

        .hero {
          position: relative;
          min-height: 760px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 26px;
          background:
            linear-gradient(90deg, rgba(5, 5, 5, 0.95) 0%, rgba(5, 5, 5, 0.88) 34%, rgba(5, 5, 5, 0.56) 70%, rgba(5, 5, 5, 0.78) 100%),
            linear-gradient(180deg, rgba(227, 29, 44, 0.08), transparent 30%);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.4);
          margin-top: 18px;
        }

        .heroContent {
          position: relative;
          z-index: 3;
          max-width: 640px;
          padding: 92px 54px 84px;
        }

        .eyebrow {
          color: #ff4250;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 14px 0 18px;
          font-size: clamp(66px, 9vw, 118px);
          line-height: 0.88;
          letter-spacing: -6px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .hero h1 span {
          color: #e31d2c;
        }

        .heroLead {
          max-width: 560px;
          margin: 0;
          color: #c9c9c9;
          font-size: 20px;
          line-height: 1.55;
        }

        .heroSub {
          max-width: 580px;
          margin: 18px 0 0;
          color: #8f8f8f;
          font-size: 13px;
          line-height: 1.7;
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .barScene {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .barGlow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 72% 24%, rgba(191, 24, 34, 0.24), transparent 22%),
            radial-gradient(circle at 76% 60%, rgba(255, 255, 255, 0.05), transparent 20%),
            radial-gradient(circle at 84% 18%, rgba(246, 194, 78, 0.08), transparent 10%);
        }

        .barTop {
          position: absolute;
          left: 52%;
          right: 0;
          top: 11%;
          height: 45%;
          background:
            linear-gradient(180deg, rgba(45, 0, 4, 0.45), rgba(9, 9, 9, 0.05)),
            linear-gradient(90deg, rgba(11, 11, 11, 0.25), rgba(31, 0, 3, 0.22));
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%);
          filter: blur(0.1px);
        }

        .shelf {
          position: absolute;
          left: 58%;
          right: 3%;
          height: 14px;
          background: rgba(18, 18, 18, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .shelfOne {
          top: 24%;
        }

        .shelfTwo {
          top: 36%;
        }

        .shelfThree {
          top: 48%;
        }

        .bottle {
          position: absolute;
          bottom: 14px;
          width: 18px;
          border-radius: 5px 5px 2px 2px;
          background: linear-gradient(180deg, rgba(33, 33, 33, 0.95), rgba(8, 8, 8, 0.95));
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }

        .bottle:before {
          content: "";
          position: absolute;
          top: -9px;
          left: 5px;
          width: 8px;
          height: 9px;
          border-radius: 2px 2px 0 0;
          background: rgba(26, 26, 26, 0.95);
        }

        .bottle.red:after,
        .bottle.gold:after {
          content: "";
          position: absolute;
          left: 2px;
          right: 2px;
          top: 14px;
          height: 28px;
          border-radius: 4px;
          opacity: 0.8;
        }

        .bottle.red:after {
          background: rgba(227, 29, 44, 0.24);
        }

        .bottle.gold:after {
          background: rgba(245, 187, 74, 0.18);
        }

        .light {
          position: absolute;
          width: 4px;
          background: rgba(60, 60, 60, 0.95);
          top: 0;
          height: 115px;
        }

        .light:after {
          content: "";
          position: absolute;
          left: -26px;
          top: 110px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 191, 83, 0.4), rgba(245, 191, 83, 0.12) 38%, transparent 70%);
          box-shadow: 0 0 90px rgba(245, 191, 83, 0.16);
        }

        .counter {
          position: absolute;
          left: 45%;
          right: -3%;
          bottom: 7%;
          height: 104px;
          background:
            linear-gradient(180deg, rgba(46, 18, 10, 0.88), rgba(12, 12, 12, 0.98)),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03), transparent 25%);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.35);
        }

        .counterFront {
          position: absolute;
          left: 52%;
          right: 0;
          bottom: 0;
          height: 130px;
          background:
            linear-gradient(180deg, rgba(16, 16, 16, 0.2), rgba(7, 7, 7, 0.95)),
            linear-gradient(90deg, rgba(67, 19, 23, 0.44), rgba(18, 18, 18, 0.82));
        }

        .guest {
          position: absolute;
          bottom: 104px;
          width: 116px;
          height: 230px;
          background: linear-gradient(180deg, rgba(20, 20, 20, 0.98), rgba(7, 7, 7, 0.98));
          clip-path: polygon(40% 0, 62% 0, 74% 10%, 80% 24%, 78% 38%, 72% 52%, 70% 74%, 100% 100%, 0 100%, 28% 76%, 24% 56%, 18% 40%, 22% 24%, 28% 10%);
          opacity: 0.9;
          filter: blur(0.3px);
        }

        .guest:before {
          content: "";
          position: absolute;
          top: -28px;
          left: 33px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(12, 12, 12, 0.98);
        }

        .glass {
          position: absolute;
          bottom: 120px;
          width: 84px;
          height: 120px;
          opacity: 0.28;
        }

        .glass:before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          margin: auto;
          top: 0;
          width: 84px;
          height: 54px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: 0;
          clip-path: polygon(0 0, 100% 0, 62% 100%, 38% 100%);
        }

        .glass:after {
          content: "";
          position: absolute;
          left: 40px;
          top: 54px;
          width: 3px;
          height: 44px;
          background: rgba(255, 255, 255, 0.16);
          box-shadow: 0 48px 0 18px rgba(255, 255, 255, 0.04);
        }

        .valueStrip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          margin-top: 16px;
          border: 1px solid #1f1f1f;
          border-radius: 18px;
          overflow: hidden;
          background: #0b0b0b;
        }

        .valueItem {
          padding: 24px 18px;
          border-right: 1px solid #1f1f1f;
          text-align: center;
        }

        .valueItem:last-child {
          border-right: 0;
        }

        .valueItem strong {
          display: block;
          color: #ffffff;
          font-size: 13px;
          margin-top: 8px;
          line-height: 1.3;
        }

        .valueItem span {
          display: block;
          color: #7f7f7f;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-transform: uppercase;
        }

        .valueIcon {
          color: #e31d2c;
          font-size: 21px;
          line-height: 1;
        }

        .section {
          padding-top: 88px;
        }

        .sectionTitle {
          margin: 12px 0 14px;
          font-size: clamp(40px, 6vw, 76px);
          line-height: 0.96;
          letter-spacing: -4px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .sectionTitle.tight {
          max-width: 1000px;
        }

        .sectionLead {
          max-width: 820px;
          color: #8e8e8e;
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
        }

        .problemGrid,
        .stepsGrid,
        .featureGrid {
          display: grid;
          gap: 14px;
          margin-top: 28px;
        }

        .problemGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .stepsGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .featureGrid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .card {
          border: 1px solid #212121;
          border-radius: 16px;
          background: linear-gradient(180deg, #0b0b0b, #090909);
          padding: 22px;
          min-height: 190px;
        }

        .card .num {
          color: #e31d2c;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1px;
        }

        .card h3 {
          margin: 12px 0 10px;
          font-size: 28px;
          line-height: 1.02;
          letter-spacing: -1px;
        }

        .card p {
          margin: 0;
          color: #7f7f7f;
          font-size: 13px;
          line-height: 1.65;
        }

        .feature {
          border: 1px solid #212121;
          border-radius: 14px;
          background: #0b0b0b;
          padding: 18px 16px;
        }

        .feature strong {
          display: block;
          color: #ffffff;
          font-size: 15px;
          margin-bottom: 8px;
        }

        .feature p {
          margin: 0;
          color: #757575;
          font-size: 12px;
          line-height: 1.6;
        }

        .reveal {
          margin-top: 34px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          align-items: stretch;
        }

        .revealCopy,
        .revealPrice {
          border-radius: 22px;
          padding: 30px;
        }

        .revealCopy {
          border: 1px solid #232323;
          background: linear-gradient(180deg, #0c0c0c, #090909);
        }

        .revealCopy h3 {
          margin: 10px 0 12px;
          font-size: 42px;
          line-height: 0.96;
          letter-spacing: -2px;
          text-transform: uppercase;
        }

        .revealCopy p {
          margin: 0;
          color: #8a8a8a;
          font-size: 14px;
          line-height: 1.7;
        }

        .bulletList {
          margin: 20px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
        }

        .bulletList li {
          color: #d2d2d2;
          font-size: 13px;
          line-height: 1.5;
          display: flex;
          gap: 10px;
        }

        .bulletList li:before {
          content: "✓";
          color: #e31d2c;
          font-weight: 1000;
        }

        .revealPrice {
          border: 1px solid rgba(227, 29, 44, 0.35);
          background:
            radial-gradient(circle at 80% 10%, rgba(227, 29, 44, 0.18), transparent 28%),
            linear-gradient(145deg, #15090b, #090909 68%);
          box-shadow: 0 30px 90px rgba(227, 29, 44, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .revealPrice .label {
          color: #ff7680;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .revealPrice .money {
          margin-top: 10px;
          font-size: 108px;
          line-height: 0.9;
          letter-spacing: -7px;
          font-weight: 1000;
        }

        .revealPrice .money span {
          font-size: 14px;
          letter-spacing: 0;
          color: #8e8e8e;
        }

        .revealPrice .week {
          margin-top: 8px;
          color: #e31d2c;
          font-size: 14px;
          font-weight: 1000;
        }

        .revealPrice p {
          margin: 16px 0 0;
          color: #8f8f8f;
          font-size: 13px;
          line-height: 1.65;
        }

        .revealPrice button {
          margin-top: 20px;
        }

        .footerCTA {
          margin-top: 84px;
          border: 1px solid #252525;
          border-radius: 24px;
          padding: 36px 24px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 0%, rgba(227, 29, 44, 0.12), transparent 40%),
            linear-gradient(180deg, #0c0c0c, #090909);
        }

        .footerCTA h2 {
          margin: 10px auto 12px;
          max-width: 940px;
          font-size: clamp(42px, 5.8vw, 76px);
          line-height: 0.95;
          letter-spacing: -4px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .footerCTA p {
          max-width: 780px;
          margin: 0 auto;
          color: #8b8b8b;
          font-size: 14px;
          line-height: 1.7;
        }

        .footerCTA .actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        @media (max-width: 1100px) {
          .problemGrid,
          .stepsGrid {
            grid-template-columns: 1fr;
          }

          .featureGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .reveal {
            grid-template-columns: 1fr;
          }

          .heroContent {
            padding: 78px 28px 72px;
            max-width: 640px;
          }

          .barTop,
          .counter,
          .counterFront,
          .shelf,
          .light,
          .guest,
          .glass {
            opacity: 0.7;
          }
        }

        @media (max-width: 860px) {
          .valueStrip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .valueItem:nth-child(2) {
            border-right: 0;
          }

          .valueItem:nth-child(1),
          .valueItem:nth-child(2) {
            border-bottom: 1px solid #1f1f1f;
          }

          .hero {
            min-height: 680px;
          }

          .heroLead {
            font-size: 18px;
          }

          .barTop {
            left: 48%;
          }

          .counter,
          .counterFront {
            left: 35%;
          }
        }

        @media (max-width: 680px) {
          .shell {
            padding: 0 16px 72px;
          }

          .nav {
            flex-direction: column;
            align-items: flex-start;
          }

          .navActions {
            width: 100%;
          }

          .navActions button {
            flex: 1;
          }

          .hero {
            min-height: 640px;
          }

          .heroContent {
            padding: 72px 18px 48px;
          }

          .hero h1 {
            font-size: 58px;
            letter-spacing: -4px;
          }

          .valueStrip,
          .featureGrid {
            grid-template-columns: 1fr;
          }

          .valueItem {
            border-right: 0;
            border-bottom: 1px solid #1f1f1f;
          }

          .valueItem:last-child {
            border-bottom: 0;
          }

          .card h3 {
            font-size: 24px;
          }

          .sectionTitle {
            letter-spacing: -2px;
          }

          .revealPrice .money {
            font-size: 82px;
            letter-spacing: -5px;
          }

          .barTop,
          .shelf,
          .light,
          .counter,
          .counterFront,
          .guest,
          .glass {
            display: none;
          }
        }
      `}</style>

      <div className="shell">
        <nav className="nav">
          <div className="brand">
            RESTAURANT <span>OS</span>
          </div>

          <div className="navActions">
            <button className="ghostBtn" onClick={goLogin}>
              OWNER LOGIN
            </button>
            <button className="primaryBtn" onClick={goSignup}>
              START RESTAURANT OS
            </button>
          </div>
        </nav>

        <section className="hero">
          <div className="barScene">
            <div className="barGlow" />
            <div className="barTop" />

            <div className="shelf shelfOne">
              <div className="bottle red" style={{ left: "6%" }} />
              <div className="bottle gold" style={{ left: "15%" }} />
              <div className="bottle red" style={{ left: "26%", height: "68px" }} />
              <div className="bottle gold" style={{ left: "37%", width: "24px", height: "74px" }} />
              <div className="bottle red" style={{ left: "49%" }} />
              <div className="bottle gold" style={{ left: "61%", height: "72px" }} />
              <div className="bottle red" style={{ left: "73%" }} />
              <div className="bottle gold" style={{ left: "85%", width: "22px", height: "66px" }} />
            </div>

            <div className="shelf shelfTwo">
              <div className="bottle gold" style={{ left: "10%" }} />
              <div className="bottle red" style={{ left: "22%", width: "22px", height: "74px" }} />
              <div className="bottle gold" style={{ left: "35%" }} />
              <div className="bottle red" style={{ left: "46%" }} />
              <div className="bottle gold" style={{ left: "58%", width: "24px", height: "76px" }} />
              <div className="bottle red" style={{ left: "71%" }} />
              <div className="bottle gold" style={{ left: "84%" }} />
            </div>

            <div className="shelf shelfThree">
              <div className="bottle red" style={{ left: "8%", width: "22px", height: "78px" }} />
              <div className="bottle gold" style={{ left: "21%" }} />
              <div className="bottle red" style={{ left: "33%" }} />
              <div className="bottle gold" style={{ left: "47%" }} />
              <div className="bottle red" style={{ left: "60%", width: "24px", height: "74px" }} />
              <div className="bottle gold" style={{ left: "73%" }} />
              <div className="bottle red" style={{ left: "86%" }} />
            </div>

            <div className="light" style={{ left: "63%" }} />
            <div className="light" style={{ left: "76%" }} />
            <div className="light" style={{ left: "89%" }} />

            <div className="glass" style={{ right: "16%", bottom: "220px" }} />
            <div className="glass" style={{ right: "28%", bottom: "158px", transform: "scale(0.84)" }} />

            <div className="guest" style={{ right: "31%", height: "244px", width: "124px" }} />
            <div className="guest" style={{ right: "11%", height: "252px", width: "130px" }} />
            <div className="guest" style={{ right: "47%", height: "208px", width: "108px" }} />

            <div className="counter" />
            <div className="counterFront" />
          </div>

          <div className="heroContent">
            <div className="eyebrow">A SMARTER GROWTH SYSTEM FOR INDEPENDENT RESTAURANTS</div>
            <h1>
              TURN SLOW NIGHTS INTO <span>FULL TABLES.</span>
            </h1>
            <p className="heroLead">
              Restaurant OS helps restaurants attract more guests, capture customer
              data, launch better offers, grow repeat business, and finally operate
              from one command center instead of ten disconnected tools.
            </p>
            <p className="heroSub">
              Websites. VIP growth. QR offers. Loyalty. Text and email campaigns.
              Review growth. Performance tracking. Built to help local restaurants
              win more often — without tech chaos.
            </p>

            <div className="heroActions">
              <button className="primaryBtn" onClick={goSignup}>
                START RESTAURANT OS →
              </button>
              <button
                className="secondaryBtn"
                onClick={() =>
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                SEE HOW IT WORKS
              </button>
            </div>
          </div>
        </section>

        <section className="valueStrip">
          <div className="valueItem">
            <div className="valueIcon">🍸</div>
            <strong>Fill slower nights</strong>
            <span>Campaigns + offers that move traffic</span>
          </div>
          <div className="valueItem">
            <div className="valueIcon">📲</div>
            <strong>Own your audience</strong>
            <span>Build a real VIP customer list</span>
          </div>
          <div className="valueItem">
            <div className="valueIcon">🎯</div>
            <strong>Bring guests back</strong>
            <span>Text + email follow-up built in</span>
          </div>
          <div className="valueItem">
            <div className="valueIcon">📈</div>
            <strong>Know what is working</strong>
            <span>Track claims, redemptions and growth</span>
          </div>
        </section>

        <section className="section">
          <div className="eyebrow">THE REAL PROBLEM</div>
          <h2 className="sectionTitle tight">
            Most restaurants don't have a food problem. They have a growth system problem.
          </h2>
          <p className="sectionLead">
            Great food alone does not guarantee full dining rooms. Owners fight empty seats
            on slow nights, one-time guests who never return, scattered marketing tools,
            weak follow-up, poor data visibility, and no real customer retention machine.
            That creates stress, inconsistent revenue, wasted ad spend and too much guessing.
          </p>

          <div className="problemGrid">
            <div className="card">
              <div className="num">01</div>
              <h3>One-time guests</h3>
              <p>
                Too many people visit once, enjoy the food, then disappear because there is
                no structured system to capture them and bring them back.
              </p>
            </div>

            <div className="card">
              <div className="num">02</div>
              <h3>Slow night pain</h3>
              <p>
                Monday, Tuesday and mid-afternoon traffic gaps quietly eat profit. Empty tables
                still cost rent, labor, utilities and opportunity.
              </p>
            </div>

            <div className="card">
              <div className="num">03</div>
              <h3>Tool overload</h3>
              <p>
                Website on one platform. Offers somewhere else. Reviews somewhere else. Email,
                texting and analytics all separate. Owners end up managing tools instead of growth.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="eyebrow">THE SOLUTION</div>
          <h2 className="sectionTitle">One operating system. One playbook. One place to run growth.</h2>
          <p className="sectionLead">
            Restaurant OS pulls the critical growth pieces under one roof, so owners can focus on
            offers, follow-up, repeat business and smarter execution instead of patching together
            apps and vendors.
          </p>

          <div className="featureGrid">
            <div className="feature">
              <strong>Restaurant Website</strong>
              <p>Modern public site with menus, offers, calls-to-action and customer-facing pages.</p>
            </div>
            <div className="feature">
              <strong>VIP / Loyalty Database</strong>
              <p>Capture guest info and build an audience you actually own.</p>
            </div>
            <div className="feature">
              <strong>QR + Offer Engine</strong>
              <p>Promote offers, track claims, and drive traffic without complicated systems.</p>
            </div>
            <div className="feature">
              <strong>Text + Email Campaigns</strong>
              <p>Stay in touch with customers and drive repeat visits from one dashboard.</p>
            </div>
            <div className="feature">
              <strong>Review Growth Tools</strong>
              <p>Generate more customer reviews and strengthen local reputation.</p>
            </div>
            <div className="feature">
              <strong>Owner Command Center</strong>
              <p>See the score, track what matters and know your next best move.</p>
            </div>
            <div className="feature">
              <strong>Catering Campaign Tools</strong>
              <p>Promote larger tickets and special-event opportunities from the same system.</p>
            </div>
            <div className="feature">
              <strong>Simple Execution</strong>
              <p>Less confusion. Less vendor sprawl. More consistent local growth.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="eyebrow">HOW RESTAURANT OS HELPS</div>
          <h2 className="sectionTitle">Attract. Capture. Follow up. Bring them back.</h2>

          <div className="stepsGrid">
            <div className="card">
              <div className="num">STEP 01</div>
              <h3>Attract attention</h3>
              <p>
                Use a stronger website, better offers, local campaign tools and review growth to
                get more eyes on the restaurant.
              </p>
            </div>

            <div className="card">
              <div className="num">STEP 02</div>
              <h3>Capture customers</h3>
              <p>
                Turn foot traffic and visits into VIP customers by using QR tools, offers and
                loyalty capture instead of hoping people come back on their own.
              </p>
            </div>

            <div className="card">
              <div className="num">STEP 03</div>
              <h3>Drive repeat business</h3>
              <p>
                Follow up through text and email, launch promotions intentionally, and track what
                gets claimed and redeemed so you can keep improving.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="eyebrow">THE OFFER</div>
          <h2 className="sectionTitle">Simple pricing after the value is clear.</h2>

          <div className="reveal">
            <div className="revealCopy">
              <div className="eyebrow">WHAT YOU GET</div>
              <h3>Everything in one system.</h3>
              <p>
                No confusing package ladder. No “good / better / best” maze. Restaurant OS is one
                straightforward platform designed to help independent restaurants grow smarter.
              </p>

              <ul className="bulletList">
                <li>Restaurant website + public pages</li>
                <li>Menu management + customer-facing menu</li>
                <li>VIP / loyalty capture tools</li>
                <li>Digital coupons + QR code offers</li>
                <li>Text message campaigns</li>
                <li>Email campaigns</li>
                <li>Review-growth tools</li>
                <li>Catering and local promotion support tools</li>
                <li>Owner Command Center dashboard</li>
              </ul>
            </div>

            <div className="revealPrice">
              <div className="label">ONE SIMPLE MONTHLY PRICE</div>
              <div className="money">
                $375 <span>/ MONTH</span>
              </div>
              <div className="week">ABOUT $87 / WEEK</div>
              <p>
                One low monthly price to run the growth system. Clean, simple and built for serious
                operators who want a real platform instead of another patchwork stack.
              </p>
              <button className="primaryBtn" onClick={goSignup}>
                START RESTAURANT OS →
              </button>
            </div>
          </div>
        </section>

        <section className="footerCTA">
          <div className="eyebrow">READY TO GROW SMARTER?</div>
          <h2>Own your customers. Own your offers. Own your growth.</h2>
          <p>
            Restaurant OS gives local restaurants the system to operate stronger, market smarter and
            build repeat business with more consistency.
          </p>
          <div className="actions">
            <button className="primaryBtn" onClick={goSignup}>
              START RESTAURANT OS →
            </button>
            <button className="secondaryBtn" onClick={goLogin}>
              OWNER LOGIN
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
