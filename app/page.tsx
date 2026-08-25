"use client";

export default function HomePage() {
  function goSignup() {
    window.location.href = "/signup";
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
        button { font: inherit; }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          color: #fff;
          background:
            radial-gradient(circle at 88% 0%, rgba(225,34,45,.15), transparent 28%),
            #050505;
          padding: 0 0 80px;
        }

        .shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 24px;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding-bottom: 40px;
        }

        .brand {
          font-size: 21px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span {
          color: #e1222d;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ghost {
          border: 1px solid #303030;
          border-radius: 8px;
          background: #111;
          color: #fff;
          padding: 10px 13px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 1000;
        }

        .primary {
          border: 0;
          border-radius: 8px;
          background: #e1222d;
          color: #fff;
          padding: 11px 15px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 1000;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          gap: 40px;
          align-items: center;
          min-height: 620px;
          padding: 70px 0 40px;
        }

        .eyebrow {
          color: #e1222d;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 2px;
        }

        h1 {
          margin: 12px 0 18px;
          font-size: clamp(58px,8vw,105px);
          line-height: .84;
          letter-spacing: -6px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        h1 span {
          color: #e1222d;
        }

        .lead {
          max-width: 720px;
          margin: 0;
          color: #929292;
          font-size: 16px;
          line-height: 1.6;
        }

        .heroActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .heroActions button {
          padding: 14px 18px;
          font-size: 10px;
        }

        .priceCard {
          border: 1px solid #6d272c;
          border-radius: 18px;
          padding: 28px;
          background:
            linear-gradient(145deg, #190a0b, #0b0b0b 70%);
          box-shadow: 0 30px 90px rgba(225,34,45,.08);
        }

        .priceLabel {
          color: #ff787f;
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }

        .price {
          margin-top: 10px;
          font-size: 88px;
          line-height: .9;
          letter-spacing: -6px;
          font-weight: 1000;
        }

        .price span {
          color: #777;
          font-size: 12px;
          letter-spacing: 0;
        }

        .weekly {
          margin-top: 8px;
          color: #e1222d;
          font-size: 11px;
          font-weight: 1000;
        }

        .priceCopy {
          margin: 20px 0 0;
          color: #8a8a8a;
          font-size: 11px;
          line-height: 1.55;
        }

        .priceCard button {
          width: 100%;
          margin-top: 20px;
          padding: 15px;
          border: 0;
          border-radius: 9px;
          background: #e1222d;
          color: #fff;
          font-size: 11px;
          font-weight: 1000;
          cursor: pointer;
        }

        .section {
          padding: 80px 0 10px;
        }

        .section h2 {
          margin: 8px 0 10px;
          font-size: clamp(36px,5vw,64px);
          line-height: .95;
          letter-spacing: -3px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        .sectionLead {
          max-width: 760px;
          color: #858585;
          font-size: 13px;
          line-height: 1.6;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 12px;
          margin-top: 28px;
        }

        .card {
          min-height: 190px;
          padding: 20px;
          border: 1px solid #242424;
          border-radius: 12px;
          background: #0c0c0c;
        }

        .num {
          color: #e1222d;
          font-size: 9px;
          font-weight: 1000;
        }

        .card h3 {
          margin: 12px 0 8px;
          font-size: 22px;
          letter-spacing: -1px;
        }

        .card p {
          margin: 0;
          color: #777;
          font-size: 10px;
          line-height: 1.5;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 9px;
          margin-top: 26px;
        }

        .feature {
          padding: 13px;
          border: 1px solid #242424;
          border-radius: 9px;
          background: #0c0c0c;
          color: #bcbcbc;
          font-size: 9px;
          font-weight: 800;
        }

        .feature strong {
          color: #e1222d;
          margin-right: 6px;
        }

        .scoreCard {
          margin-top: 22px;
          padding: 26px;
          border: 1px solid #282828;
          border-radius: 16px;
          background: linear-gradient(135deg,#101010,#090909);
        }

        .scoreCard h3 {
          margin: 7px 0 6px;
          font-size: 30px;
        }

        .scoreCard p {
          margin: 0;
          color: #7d7d7d;
          font-size: 11px;
          line-height: 1.5;
          max-width: 740px;
        }

        .scoreCard button {
          margin-top: 18px;
          border: 1px solid #6b252b;
          border-radius: 8px;
          background: #1b0b0d;
          color: #ff7e85;
          padding: 12px 14px;
          font-size: 9px;
          font-weight: 1000;
          cursor: pointer;
        }

        .final {
          margin-top: 80px;
          padding: 34px;
          border: 1px solid #6f282d;
          border-radius: 18px;
          background: linear-gradient(135deg,#1a0a0c,#0c0c0c 70%);
          text-align: center;
        }

        .final h2 {
          margin: 8px auto 12px;
          max-width: 900px;
          font-size: clamp(40px,6vw,76px);
          line-height: .92;
          letter-spacing: -4px;
          text-transform: uppercase;
        }

        .final p {
          max-width: 720px;
          margin: 0 auto;
          color: #888;
          font-size: 12px;
          line-height: 1.55;
        }

        .final button {
          margin-top: 22px;
          padding: 15px 24px;
          border: 0;
          border-radius: 9px;
          background: #e1222d;
          color: #fff;
          font-size: 10px;
          font-weight: 1000;
          cursor: pointer;
        }

        @media(max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .grid,
          .features {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }
        }

        @media(max-width: 620px) {
          .shell { padding: 20px 16px; }
          .nav {
            align-items: flex-start;
            flex-direction: column;
          }
          .navActions {
            width: 100%;
          }
          .navActions button {
            flex: 1;
          }
          h1 {
            font-size: 58px;
            letter-spacing: -4px;
          }
          .grid,
          .features {
            grid-template-columns: 1fr;
          }
          .price {
            font-size: 72px;
          }
        }
      `}</style>

      <div className="shell">
        <nav className="nav">
          <div className="brand">
            RESTAURANT <span>OS</span>
          </div>

          <div className="navActions">
            <button
              className="ghost"
              onClick={() => (window.location.href = "/login")}
            >
              OWNER LOGIN
            </button>
            <button className="primary" onClick={goSignup}>
              START RESTAURANT OS
            </button>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="eyebrow">THE OPERATING SYSTEM FOR RESTAURANT GROWTH</div>
            <h1>
              OWN YOUR <span>GROWTH.</span>
            </h1>
            <p className="lead">
              Stop piecing together websites, loyalty apps, QR codes, email tools,
              text platforms and marketing vendors. Restaurant OS gives independent
              restaurants one system to attract customers, capture them, bring them
              back and measure what works.
            </p>

            <div className="heroActions">
              <button className="primary" onClick={goSignup}>
                START RESTAURANT OS →
              </button>
              <button
                className="ghost"
                onClick={() => {
                  document
                    .getElementById("included")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                SEE WHAT'S INCLUDED
              </button>
            </div>
          </div>

          <aside className="priceCard">
            <div className="priceLabel">ONE SIMPLE PRICE</div>
            <div className="price">
              $375 <span>/ MONTH</span>
            </div>
            <div className="weekly">ABOUT $87/WEEK</div>

            <p className="priceCopy">
              Full Restaurant OS access. No feature maze. No three-tier pricing.
              No setup fee.
            </p>

            <button onClick={goSignup}>GET STARTED →</button>
          </aside>
        </section>

        <section className="section">
          <div className="eyebrow">THE PROBLEM</div>
          <h2>Most restaurants don't have a food problem. They have a system problem.</h2>
          <p className="sectionLead">
            Slow days, one-time guests, weak follow-up, too few reviews, no owned
            customer list and scattered marketing tools all create lost revenue and
            lost momentum.
          </p>

          <div className="grid">
            <div className="card">
              <div className="num">01</div>
              <h3>Too many one-time guests</h3>
              <p>
                Great customers walk out the door and the restaurant has no system
                to bring them back.
              </p>
            </div>

            <div className="card">
              <div className="num">02</div>
              <h3>No audience you own</h3>
              <p>
                Social followers are rented. Restaurant OS helps build a real VIP
                customer database.
              </p>
            </div>

            <div className="card">
              <div className="num">03</div>
              <h3>Marketing is scattered</h3>
              <p>
                Website, offers, reviews, campaigns and customer data should work
                together instead of living in separate tools.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="included">
          <div className="eyebrow">ONE SYSTEM. FULL FIREPOWER.</div>
          <h2>Everything you need to build repeat business.</h2>

          <div className="features">
            {[
              "Restaurant website",
              "Online menu management",
              "VIP / loyalty database",
              "QR codes",
              "Coupons + digital offers",
              "Text campaigns",
              "Email campaigns",
              "Campaign tracking",
              "Offer claim tracking",
              "Redemption tracking",
              "Review-growth tools",
              "Catering campaign tools",
              "Owner Command Center",
              "Growth Score",
              "Next Best Move recommendations",
            ].map((feature) => (
              <div className="feature" key={feature}>
                <strong>✓</strong>
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="eyebrow">THE RESTAURANT OS GROWTH LOOP</div>
          <h2>Attract. Capture. Follow up. Bring them back. Grow.</h2>

          <div className="grid">
            {[
              ["ATTRACT", "Use a strong website, offers, reviews and local campaigns to get attention."],
              ["CAPTURE", "Turn traffic and guests into VIP customers you can reach again."],
              ["FOLLOW UP", "Use text and email to stay connected instead of hoping they return."],
              ["BRING BACK", "Launch offers and campaigns designed to create repeat visits."],
              ["MEASURE", "Track claims, redemptions and campaign activity inside the Command Center."],
              ["IMPROVE", "Use Restaurant OS recommendations to know what to do next."],
            ].map(([title, copy], index) => (
              <div className="card" key={title}>
                <div className="num">{String(index + 1).padStart(2, "0")}</div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>

          <div className="scoreCard">
            <div className="eyebrow">FREE RESTAURANT GROWTH SCORE™</div>
            <h3>See where your growth system is leaking.</h3>
            <p>
              Quickly identify weaknesses in customer capture, repeat business,
              offers, reviews and local growth — then see what to fix first.
            </p>
            <button onClick={goSignup}>GET YOUR GROWTH SCORE →</button>
          </div>
        </section>

        <section className="final">
          <div className="eyebrow">ONE SYSTEM. ONE PRICE.</div>
          <h2>Restaurant OS. $375/month.</h2>
          <p>
            Your website. Your customers. Your VIP list. Your offers. Your loyalty.
            Your campaigns. Your data. One Restaurant OS.
          </p>
          <button onClick={goSignup}>START RESTAURANT OS →</button>
        </section>
      </div>
    </main>
  );
}
