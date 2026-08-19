export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #08111f 0%, #10243d 55%, #0b0f16 100%)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1100px",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: "28px",
          padding: "56px",
          background: "rgba(7, 13, 22, .82)",
          boxShadow: "0 30px 80px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            color: "#f5b82e",
            fontWeight: 900,
            letterSpacing: "2px",
            fontSize: "13px",
            marginBottom: "18px",
          }}
        >
          RESTAURANT OS
        </div>

        <h1
          style={{
            fontSize: "clamp(52px, 8vw, 96px)",
            lineHeight: ".92",
            margin: 0,
            maxWidth: "900px",
            fontWeight: 900,
            letterSpacing: "-4px",
          }}
        >
          OWN YOUR SITE.
          <br />
          OWN YOUR MENU.
          <br />
          OWN YOUR CUSTOMERS.
        </h1>

        <p
          style={{
            maxWidth: "720px",
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#cbd5e1",
            marginTop: "28px",
          }}
        >
          A restaurant website, menu manager, VIP system, offers engine and owner
          portal — built for independent restaurants.
        </p>

        <div
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            marginTop: "34px",
          }}
        >
          <button
            style={{
              background: "#f5b82e",
              color: "#08111f",
              border: 0,
              borderRadius: "12px",
              padding: "16px 24px",
              fontWeight: 900,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            BUILD MY RESTAURANT SITE
          </button>

          <button
            style={{
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,.3)",
              borderRadius: "12px",
              padding: "16px 24px",
              fontWeight: 900,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            OWNER LOGIN
          </button>
        </div>

        <div
          style={{
            marginTop: "54px",
            borderTop: "1px solid rgba(255,255,255,.1)",
            paddingTop: "22px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Donation-supported software. Hosting, domains, messaging and third-party
          services are separate.
        </div>
      </section>
    </main>
  );
}
