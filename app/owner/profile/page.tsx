"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export default function OwnerProfilePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address_line_1: "",
    city: "",
    state: "",
    zip: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessMessage, setBusinessMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setAccountEmail(session.user.email || "");

    const requestedRestaurantId = new URLSearchParams(
      window.location.search
    ).get("restaurant");

    let query = supabase
      .from("restaurants")
      .select("id,name,phone,address_line_1,city,state,zip")
      .eq("owner_user_id", session.user.id);

    if (requestedRestaurantId) {
      query = query.eq("id", requestedRestaurantId);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      setBusinessMessage(
        error?.message || "No restaurant profile was found for this account."
      );
      setLoading(false);
      return;
    }

    setRestaurant(data);
    setForm({
      name: data.name || "",
      phone: data.phone || "",
      address_line_1: data.address_line_1 || "",
      city: data.city || "",
      state: data.state || "",
      zip: data.zip || "",
    });

    setLoading(false);
  }

  async function saveBusinessProfile(event: React.FormEvent) {
    event.preventDefault();

    if (!restaurant) return;

    setSavingBusiness(true);
    setBusinessMessage("");

    const { error } = await supabase
      .from("restaurants")
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address_line_1: form.address_line_1.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
      })
      .eq("id", restaurant.id);

    if (error) {
      setBusinessMessage(error.message);
      setSavingBusiness(false);
      return;
    }

    setBusinessMessage("Restaurant profile updated.");
    setSavingBusiness(false);
  }

  async function saveAccountEmail(event: React.FormEvent) {
    event.preventDefault();

    const nextEmail = accountEmail.trim().toLowerCase();

    if (!nextEmail) {
      setEmailMessage("Enter an email address.");
      return;
    }

    setSavingEmail(true);
    setEmailMessage("");

    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      email: nextEmail,
    });

    if (error) {
      setEmailMessage(error.message);
      setSavingEmail(false);
      return;
    }

    if (user?.email === nextEmail) {
      setEmailMessage("Account email updated.");
    } else {
      setEmailMessage(
        "Email change submitted. Check the new email address if Supabase requests confirmation."
      );
    }

    setSavingEmail(false);
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();

    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage(error.message);
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated successfully.");
    setSavingPassword(false);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading profile...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS · ACCOUNT COMMAND</div>
            <h1 style={titleStyle}>PROFILE & ACCOUNT</h1>
            <p style={subStyle}>
              Control restaurant identity, owner login credentials and account security.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() => {
              const suffix = restaurant
                ? `?restaurant=${restaurant.id}`
                : "";
              window.location.href = `/owner${suffix}`;
            }}
          >
            BACK TO COMMAND CENTER
          </button>
        </header>

        <section style={gridStyle}>
          <form onSubmit={saveBusinessProfile} style={cardStyle}>
            <div style={cardEyebrowStyle}>RESTAURANT IDENTITY</div>
            <h2 style={cardTitleStyle}>Business Profile</h2>

            <Field
              label="RESTAURANT NAME"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
            />

            <Field
              label="PHONE"
              value={form.phone}
              onChange={(value) => setForm({ ...form, phone: value })}
            />

            <Field
              label="STREET ADDRESS"
              value={form.address_line_1}
              onChange={(value) =>
                setForm({ ...form, address_line_1: value })
              }
            />

            <div style={threeColumnStyle}>
              <Field
                label="CITY"
                value={form.city}
                onChange={(value) => setForm({ ...form, city: value })}
              />

              <Field
                label="STATE"
                value={form.state}
                onChange={(value) => setForm({ ...form, state: value })}
              />

              <Field
                label="ZIP"
                value={form.zip}
                onChange={(value) => setForm({ ...form, zip: value })}
              />
            </div>

            {businessMessage && (
              <div style={messageStyle}>{businessMessage}</div>
            )}

            <button
              type="submit"
              disabled={savingBusiness}
              style={primaryButtonStyle}
            >
              {savingBusiness ? "SAVING..." : "SAVE BUSINESS PROFILE"}
            </button>
          </form>

          <section style={cardStyle}>
            <div style={cardEyebrowStyle}>OWNER ACCOUNT</div>
            <h2 style={cardTitleStyle}>Login & Security</h2>

            <div style={accountStatusStyle}>
              <span style={accountStatusDotStyle} />
              <div>
                <div style={accountStatusTitleStyle}>OWNER ACCESS ACTIVE</div>
                <div style={accountStatusTextStyle}>
                  Update the email and password used to enter Restaurant OS.
                </div>
              </div>
            </div>

            <form onSubmit={saveAccountEmail} style={accountFormStyle}>
              <div style={sectionLabelStyle}>LOGIN EMAIL</div>

              <p style={helpStyle}>
                This email is your Restaurant OS username and login credential.
              </p>

              <Field
                label="ACCOUNT EMAIL"
                type="email"
                value={accountEmail}
                onChange={setAccountEmail}
              />

              {emailMessage && (
                <div style={messageStyle}>{emailMessage}</div>
              )}

              <button
                type="submit"
                disabled={savingEmail}
                style={primaryButtonStyle}
              >
                {savingEmail ? "UPDATING..." : "UPDATE LOGIN EMAIL"}
              </button>
            </form>

            <div style={securityBoxStyle}>
              <div style={securityTitleStyle}>PASSWORD SECURITY</div>
              <div style={securityTextStyle}>
                Create a new password for this owner account. Minimum 8 characters.
              </div>

              <form onSubmit={savePassword} style={passwordFormStyle}>
                <Field
                  label="NEW PASSWORD"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                />

                <Field
                  label="CONFIRM NEW PASSWORD"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />

                {passwordMessage && (
                  <div style={messageStyle}>{passwordMessage}</div>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  style={secondaryFullButtonStyle}
                >
                  {savingPassword ? "UPDATING..." : "CHANGE PASSWORD"}
                </button>
              </form>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 88% 0%, rgba(225,34,45,.15), transparent 26%), linear-gradient(180deg,#070707,#030303)",
  color: "#ffffff",
  padding: "30px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1240px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  flexWrap: "wrap" as const,
  marginBottom: "24px",
  paddingBottom: "22px",
  borderBottom: "1px solid #1f1f1f",
};

const eyebrowStyle = {
  color: "#ee2a35",
  fontSize: "9px",
  fontWeight: 1000,
  letterSpacing: "1.9px",
};

const titleStyle = {
  margin: "8px 0 9px",
  fontSize: "clamp(46px,6vw,76px)",
  lineHeight: ".9",
  letterSpacing: "-4px",
  fontWeight: 1000,
};

const subStyle = {
  color: "#858585",
  maxWidth: "680px",
  lineHeight: 1.55,
  margin: 0,
  fontWeight: 600,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))",
  gap: "18px",
  alignItems: "start",
};

const cardStyle = {
  background: "linear-gradient(155deg,#111111,#090909)",
  border: "1px solid #292929",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 16px 46px rgba(0,0,0,.22)",
};

const cardEyebrowStyle = {
  color: "#ee2a35",
  fontSize: "8px",
  fontWeight: 1000,
  letterSpacing: "1.7px",
};

const cardTitleStyle = {
  margin: "7px 0 20px",
  fontSize: "30px",
  lineHeight: 1,
  letterSpacing: "-1.2px",
};

const fieldWrapStyle = {
  display: "grid",
  gap: "7px",
  marginBottom: "15px",
};

const labelStyle = {
  color: "#7f7f7f",
  fontSize: "8px",
  fontWeight: 1000,
  letterSpacing: "1.2px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #333333",
  borderRadius: "9px",
  padding: "13px 14px",
  fontSize: "14px",
  background: "#080808",
  color: "#ffffff",
  outline: "none",
};

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr .7fr .8fr",
  gap: "10px",
};

const primaryButtonStyle = {
  width: "100%",
  marginTop: "4px",
  background: "#e1222d",
  color: "#ffffff",
  border: "1px solid #e1222d",
  borderRadius: "9px",
  padding: "13px",
  fontSize: "9px",
  fontWeight: 1000,
  letterSpacing: ".8px",
  cursor: "pointer",
  boxShadow: "0 9px 24px rgba(225,34,45,.16)",
};

const secondaryButtonStyle = {
  background: "#101010",
  color: "#ffffff",
  border: "1px solid #343434",
  borderRadius: "9px",
  padding: "11px 14px",
  fontSize: "9px",
  fontWeight: 1000,
  letterSpacing: ".7px",
  cursor: "pointer",
};

const messageStyle = {
  background: "#181011",
  color: "#ff969c",
  border: "1px solid #5d252a",
  borderRadius: "9px",
  padding: "11px",
  fontSize: "11px",
  marginBottom: "12px",
  lineHeight: 1.45,
};

const helpStyle = {
  color: "#777777",
  fontSize: "12px",
  lineHeight: 1.55,
  margin: "0 0 17px",
};

const accountStatusStyle = {
  display: "flex",
  gap: "11px",
  alignItems: "center",
  background: "#0b160f",
  border: "1px solid #21492f",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "20px",
};

const accountStatusDotStyle = {
  width: "9px",
  height: "9px",
  borderRadius: "999px",
  background: "#46c978",
  boxShadow: "0 0 0 4px rgba(70,201,120,.08)",
  flex: "0 0 auto",
};

const accountStatusTitleStyle = {
  color: "#7de3a1",
  fontSize: "8px",
  fontWeight: 1000,
  letterSpacing: "1.2px",
};

const accountStatusTextStyle = {
  color: "#779181",
  fontSize: "10px",
  marginTop: "4px",
  lineHeight: 1.4,
};

const accountFormStyle = {
  margin: 0,
};

const sectionLabelStyle = {
  color: "#b6b6b6",
  fontSize: "9px",
  fontWeight: 1000,
  letterSpacing: "1.2px",
  marginBottom: "7px",
};

const securityBoxStyle = {
  marginTop: "20px",
  background: "#0b0b0b",
  border: "1px solid #2a2a2a",
  borderLeft: "3px solid #e1222d",
  borderRadius: "11px",
  padding: "16px",
};

const securityTitleStyle = {
  fontSize: "8px",
  fontWeight: 1000,
  letterSpacing: "1.3px",
  color: "#ee2a35",
};

const securityTextStyle = {
  marginTop: "7px",
  color: "#777777",
  fontSize: "11px",
  lineHeight: 1.5,
};

const passwordFormStyle = {
  display: "grid",
  gap: "2px",
  marginTop: "15px",
};

const secondaryFullButtonStyle = {
  width: "100%",
  background: "#151515",
  color: "#ff747c",
  border: "1px solid #542329",
  borderRadius: "9px",
  padding: "12px",
  fontSize: "9px",
  fontWeight: 1000,
  letterSpacing: ".8px",
  cursor: "pointer",
};
