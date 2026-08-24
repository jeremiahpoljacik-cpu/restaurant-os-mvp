"use client";

import { useState } from "react";

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");

  function continueSignup() {
    setError("");

    if (
      !restaurantName.trim() ||
      !ownerName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !city.trim() ||
      !state.trim()
    ) {
      setError("Please complete all fields.");
      return;
    }

    const params = new URLSearchParams({
      restaurant_name: restaurantName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
    });

    window.location.href = `/onboarding?${params.toString()}`;
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
        input, button { font: inherit; }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          color: #fff;
          background:
            radial-gradient(circle at 85% 8%, rgba(225,34,45,.15), transparent 28%),
            #050505;
          padding: 32px 22px 70px;
        }

        .shell {
          max-width: 1120px;
          margin: 0 auto;
        }

        .brand {
          font-size: 19px;
          font-weight: 1000;
          letter-spacing: -1px;
        }

        .brand span { color: #e1222d; }

        .grid {
          display: grid;
          grid-template-columns: 1fr 430px;
          gap: 48px;
          align-items: start;
          margin-top: 70px;
        }

        .eyebrow {
          color: #e1222d;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 2px;
        }

        h1 {
          margin: 10px 0 18px;
          font-size: clamp(54px,7vw,90px);
          line-height: .88;
          letter-spacing: -5px;
          font-weight: 1000;
          text-transform: uppercase;
        }

        h1 span { color: #e1222d; }

        .lead {
          max-width: 620px;
          color: #8d8d8d;
          font-size: 14px;
          line-height: 1.65;
        }

        .price {
          margin-top: 30px;
          font-size: 70px;
          line-height: .9;
          font-weight: 1000;
          letter-spacing: -4px;
        }

        .price span {
          font-size: 12px;
          color: #777;
          letter-spacing: 0;
        }

        .weekly {
          margin-top: 8px;
          color: #e1222d;
          font-size: 11px;
          font-weight: 1000;
        }

        .included {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 9px;
          margin-top: 28px;
        }

        .item {
          border: 1px solid #222;
          border-radius: 9px;
          padding: 12px;
          background: #0c0c0c;
          color: #bdbdbd;
          font-size: 9px;
          font-weight: 800;
        }

        .item strong { color: #e1222d; margin-right: 6px; }

        .card {
          border: 1px solid #282828;
          border-radius: 16px;
          padding: 24px;
          background: #0c0c0c;
          box-shadow: 0 35px 90px rgba(0,0,0,.45);
        }

        .card h2 {
          margin: 6px 0 5px;
          font-size: 28px;
        }

        .sub {
          margin: 0 0 20px;
          color: #737373;
          font-size: 10px;
          line-height: 1.5;
        }

        .field {
          display: grid;
          gap: 6px;
          margin-bottom: 11px;
        }

        label {
          color: #747474;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: .7px;
        }

        input {
          width: 100%;
          border: 1px solid #303030;
          border-radius: 8px;
          background: #111;
          color: #fff;
          padding: 12px 13px;
          outline: none;
        }

        input:focus { border-color: #e1222d; }

        .two {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 9px;
        }

        .error {
          border: 1px solid #58272b;
          border-radius: 8px;
          padding: 10px;
          margin: 10px 0;
          background: #180b0c;
          color: #ff949b;
          font-size: 9px;
        }

        button {
          width: 100%;
          border: 0;
          border-radius: 8px;
          background: #e1222d;
          color: #fff;
          padding: 14px;
          margin-top: 8px;
          cursor: pointer;
          font-weight: 1000;
          font-size: 10px;
          letter-spacing: .8px;
        }

        .fine {
          margin-top: 12px;
          color: #5e5e5e;
          font-size: 8px;
          line-height: 1.5;
        }

        @media(max-width:900px) {
          .grid { grid-template-columns: 1fr; margin-top: 45px; }
          .card { max-width: 540px; }
        }

        @media(max-width:600px) {
          h1 { letter-spacing: -3px; }
          .included { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="shell">
        <div className="brand">RESTAURANT <span>OS</span></div>

        <div className="grid">
          <section>
            <div className="eyebrow">ONE SYSTEM. ONE PRICE.</div>
            <h1>
              EVERYTHING YOU NEED TO <span>GROW.</span>
            </h1>

            <p className="lead">
              No confusing packages. No feature maze. Restaurant OS gives
              independent restaurants the website, customer database, loyalty,
              offers, campaigns and growth tools in one operating system.
            </p>

            <div className="price">
              $375 <span>/ MONTH</span>
            </div>
            <div className="weekly">ABOUT $87/WEEK</div>

            <div className="included">
              {[
                "Restaurant website",
                "Online menu management",
                "VIP / loyalty database",
                "QR codes",
                "Coupons + offers",
                "Text campaigns",
                "Email campaigns",
                "Campaign tracking",
                "Review-growth tools",
                "Catering campaign tools",
                "Owner Command Center",
                "Growth recommendations",
              ].map((item) => (
                <div className="item" key={item}>
                  <strong>✓</strong>{item}
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="eyebrow">START RESTAURANT OS</div>
            <h2>Tell us about your restaurant.</h2>
            <p className="sub">
              We&apos;ll carry this information into onboarding.
            </p>

            <div className="field">
              <label>RESTAURANT NAME</label>
              <input value={restaurantName} onChange={(e)=>setRestaurantName(e.target.value)} />
            </div>

            <div className="field">
              <label>OWNER / OPERATOR</label>
              <input value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} />
            </div>

            <div className="field">
              <label>PHONE</label>
              <input value={phone} onChange={(e)=>setPhone(e.target.value)} />
            </div>

            <div className="field">
              <label>EMAIL</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>

            <div className="two">
              <div className="field">
                <label>CITY</label>
                <input value={city} onChange={(e)=>setCity(e.target.value)} />
              </div>
              <div className="field">
                <label>STATE</label>
                <input maxLength={2} value={state} onChange={(e)=>setState(e.target.value)} />
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button onClick={continueSignup}>START RESTAURANT OS →</button>

            <div className="fine">
              $375/month. Cancel according to your Restaurant OS service terms.
              Advertising spend and third-party fees are separate where applicable.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
