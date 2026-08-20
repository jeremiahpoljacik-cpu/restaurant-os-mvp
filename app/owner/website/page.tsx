
6.JPEG
25.JPEG
41.JPEG
a7e5a20285700c1b3d7cdf7125318d52.JPEG
replace all photos on current site with these photos. 

Generated image


Edit


change everything to english BUT also add their flag to the top right when clicked it will change to spanish. also update all info based on their GMB profile I attached

Generated image: Vi Pollos Honduran Restaurant Homepage


Edit


Generated image: Vi Pollos Honduran Flavor Homepage


Edit


Edited image
THIS ONE!

Generated image


Edit


Generated image: Vi Pollos: Authentic Honduran Flavor


Edit


Generated image: Vi Pollos Authentic Honduran Flavor Menu


Edit


Generated image


Edit


Generated image


Edit


Wed, Aug 12 at 4:06 PM
change gears lets get this website built page by page and GO

Generated image: Honduran Restaurant Homepage Mockup


Edit


looks terrible not what we built...

Yep — that deployment is wrong. The layout code loaded, but the actual Vi Pollos image assets were never added to the repo, so the hero, logo, photo grid, and catering imagery all broke. That’s why it looks nothing like the design.

I fixed that by packaging the homepage with the exact folder structure and the image assets it needs.

Download the corrected Vi Pollos homepage build

Inside the ZIP are exactly these locations:

app/
└── vi-pollos-2/
    └── page.tsx

public/
└── vi-pollos/
    ├── logo.png
    ├── logo-square.jpg
    ├── kitchen.jpg
    ├── owner-serving.jpg
    ├── family.jpg
    └── featured-plate.png
What to do in GitHub
Replace:

app/vi-pollos-2/page.tsx
with the new page.tsx.

Then create:

public/vi-pollos/
and upload all six image files from the ZIP into that folder.

Commit it and let Vercel deploy.

Then test the same URL:

https://app.powerdial.io/vi-pollos-2

The screenshot you sent is not an acceptable final version. Once these assets are actually in the repo, the page should have the real kitchen hero, real Vi Pollos logo, real family/restaurant photos, and the blue/black/cream layout we designed.

Do this deployment first. Once Home is visually locked, we move straight to Our Story.


lets rework this page. Its a bit jumbled and not as sexy as wehat you forst did remove the hours and contact info from the middle of the page for starters and make sure ALL of the images shwo as they are cut off.

NO this is not like the mockup you showed me. I want it like what is attached

So close! Few more tweaks. Lets give a litte more emphisis on the size of the logo. LFG!

this is NOT this... same everythign but in english!

the images under featured dishes dont corelate lets clean this area up a bit. also the font here need to match this exactly

vercel passes but this is what I got

this is what I created

I fixed it

cant hardly read this font. its a bit to agressive. Lets dial this page and font type back in.




sadly the only option is to send her an email from what I see.. we dont have time for all that.





Screenshot 2026-08-12 at 6.31.45 PM.png
Screenshot 2026-08-12 at 6.32.25 PM.png
Screenshot 2026-08-12 at 6.32.35 PM.png
Screenshot 2026-08-12 at 6.32.45 PM.png
Screenshot 2026-08-12 at 6.32.55 PM.png
Screenshot 2026-08-12 at 6.33.05 PM.png
Screenshot 2026-08-12 at 6.33.14 PM.png
Screenshot 2026-08-12 at 6.33.22 PM.png
Screenshot 2026-08-12 at 6.33.31 PM.png
Screenshot 2026-08-12 at 6.33.36 PM.png
Screenshot 2026-08-12 at 6.33.44 PM.png
here are the categories and each item within along with full description and prices.



Screenshot 2026-08-12 at 6.48.31 PM.png
Screenshot 2026-08-12 at 6.48.45 PM.png

Screenshot 2026-08-12 at 6.52.15 PM.png
Screenshot 2026-08-12 at 6.52.21 PM.png
Screenshot 2026-08-12 at 6.52.29 PM.png


go where?



where do I search?


'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

type ProfileRow = Record<string, any>;

const clean = (v: any) => String(v || '').trim();
const lc = (v: any) => clean(v).toLowerCase();

function normalizeRole(profile: ProfileRow | null, email: string) {
  const role = clean(profile?.role || profile?.user_role || profile?.account_role || profile?.type)
    .toUpperCase()
    .replaceAll(' ', '_');

  if (role) return role;
  if (lc(email).includes('+rep@')) return 'REP';

  return 'OWNER';
}

function routeForRole(role: string) {
  if (role === 'REP') return '/rep';
  if (role === 'VA') return '/va-command';
  return '/home';
}

async function getDestination(email: string) {
  const normalizedEmail = lc(email);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  const role = normalizeRole((profile || null) as ProfileRow | null, normalizedEmail);
  return routeForRole(role);
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Password login is primary.');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkExistingSession() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user?.email) {
        const destination = await getDestination(user.email);
        router.replace(destination);
        return;
      }

      setChecking(false);
    }

    checkExistingSession();
  }, [router]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = lc(email);
    const pw = String(password || '');

    if (!normalizedEmail || !pw) {
      setMessage('Enter email and password.');
      return;
    }

    setLoading(true);
    setMessage('Signing in...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pw,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const loginEmail = data.user?.email || normalizedEmail;
    const destination = await getDestination(loginEmail);

    setMessage(Signed in. Sending you to ${destination}...);
    router.replace(destination);
  }

  async function sendMagicLink() {
    const normalizedEmail = lc(email);

    if (!normalizedEmail) {
      setMessage('Enter your email first.');
      return;
    }

    setLoading(true);
    setMessage('Sending backup magic link...');

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: ${window.location.origin}/,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Backup magic link sent. Check your email.');
  }

  async function forceLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
    setMessage('Logged out. Enter the correct account.');
    setLoading(false);
    setChecking(false);
  }

  if (checking) {
    return (
      <main className="loginPage">
        <section className="loginCard">
          <p>POWERDIAL.IO</p>
          <h1>Checking session...</h1>
          <span>Routing your account.</span>
        </section>

        <LoginStyles />
      </main>
    );
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <p>POWERDIAL.IO</p>
        <h1>Sign In</h1>
        <h2>Password login routes by role.</h2>

        <form onSubmit={signIn}>
          <label>Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
          />

          <label>Password</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
          />

          <button className="primary" disabled={loading} type="submit">
            {loading ? 'Working...' : 'Sign In'}
          </button>
        </form>

        <div className="message">{message}</div>

        <div className="secondaryActions">
          <button type="button" disabled={loading} onClick={sendMagicLink}>
            Send Backup Magic Link
          </button>

          <button type="button" disabled={loading} onClick={forceLogout}>
            Force Log Out
          </button>
        </div>

        <small>
          Reps should land on Field Weapon. Admin-level users land on Command Center.
        </small>
      </section>

      <LoginStyles />
    </main>
  );
}

function LoginStyles() {
  return (
    <style jsx global>{
      html,
      body {
        margin: 0;
        background: #050816;
        color: #fff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      .loginPage {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
        background:
          radial-gradient(circle at 0 0, rgba(34, 197, 94, 0.16), transparent 30%),
          radial-gradient(circle at 100% 5%, rgba(239, 68, 68, 0.16), transparent 30%),
          #050816;
      }

      .loginCard {
        width: min(100%, 520px);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.95);
        color: #020617;
        padding: 28px;
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.38);
      }

      .loginCard p {
        margin: 0 0 10px;
        color: #ef4444;
        font-size: 10px;
        letter-spacing: 6px;
        font-weight: 950;
      }

      .loginCard h1 {
        margin: 0;
        color: #020617;
        font-size: clamp(48px, 13vw, 74px);
        line-height: 0.88;
        letter-spacing: -4px;
        font-weight: 950;
      }

      .loginCard h2 {
        margin: 16px 0 22px;
        color: #64748b;
        font-size: 22px;
        line-height: 1.1;
        font-weight: 900;
      }

      form {
        display: grid;
        gap: 10px;
      }

      label {
        margin-top: 6px;
        color: #64748b;
        font-size: 10px;
        letter-spacing: 4px;
        font-weight: 950;
        text-transform: uppercase;
      }

      input {
        width: 100%;
        min-height: 58px;
        border: 2px solid #dbe3ef;
        border-radius: 20px;
        background: #f8fafc;
        color: #020617;
        padding: 0 16px;
        font: inherit;
        font-size: 16px;
        font-weight: 900;
        outline: none;
      }

      input:focus {
        border-color: #ef4444;
      }

      button {
        min-height: 58px;
        border: 0;
        border-radius: 20px;
        font: inherit;
        font-size: 16px;
        font-weight: 950;
        cursor: pointer;
      }

      button.primary {
        margin-top: 8px;
        background: #ef4444;
        color: #fff;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .message {
        margin-top: 16px;
        border: 1px solid #dbe3ef;
        border-radius: 18px;
        background: #f8fafc;
        color: #334155;
        padding: 14px;
        font-size: 14px;
        line-height: 1.25;
        font-weight: 850;
      }

      .secondaryActions {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 14px;
      }

      .secondaryActions button {
        background: #020617;
        color: #fff;
      }

      .secondaryActions button:last-child {
        background: #64748b;
      }

      small {
        display: block;
        margin-top: 16px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.35;
        font-weight: 800;
      }
    }</style>
  );
}





Screenshot 2026-08-12 at 9.24.35 PM.png
Screenshot 2026-08-12 at 9.24.45 PM.png
Screenshot 2026-08-12 at 9.24.53 PM.png



Im here what do I do?




Screenshot 2026-08-12 at 9.34.33 PM.png
Screenshot 2026-08-12 at 9.34.41 PM.png




Screenshot 2026-08-12 at 9.40.53 PM.png
Screenshot 2026-08-12 at 9.41.07 PM.png

I'm here where do I go?

how/where do i search this vi-pollos-2/menu?


Pasted text(20260813-014750).txt
Document

Screenshot 2026-08-12 at 9.49.23 PM.png
Screenshot 2026-08-12 at 9.49.34 PM.png
Screenshot 2026-08-12 at 9.49.42 PM.png
Screenshot 2026-08-12 at 9.49.49 PM.png
Screenshot 2026-08-12 at 9.49.57 PM.png

I have a open balance is my acct suspended? is that it?


Screenshot 2026-08-12 at 10.25.51 PM.png
Screenshot 2026-08-12 at 10.26.03 PM.png
Screenshot 2026-08-12 at 10.26.20 PM.png


what do I do from here?

where do I get this existing key?

I'm here what do I do?




Pin saved but doenst sent. i know some of the offer is of from what you said but for testring its ok

I'm here...

Screenshot 2026-08-12 at 11.57.16 PM.png
Screenshot 2026-08-12 at 11.57.23 PM.png
I;m here this doesnt look like it exits...

didnt work

Rmemebrs we never did the API thing?? is this party of that problem?










Screenshot 2026-08-13 at 12.18.14 AM.png
Screenshot 2026-08-13 at 12.18.22 AM.png
Go where?


Screenshot 2026-08-13 at 12.21.06 AM.png
Screenshot 2026-08-13 at 12.21.43 AM.png
need to have Missing VIP stuff and pages we just built.. this is me logged in as vivian... she is goign to want to see the whole thing tomorrow.

I'm here....



probably need to update godaddy?

I'm here


thats not correct???

I'm here...


nohting to downloand....

whats going on? you cant send me a simple download link wiht what ever code you want tme to copy/paste??

you can hardly read the blue wording. please change this font and resend new code I can paste to home page. Keep EVERYHING THE SAME excdept the blue text! Send new code


Pasted text(20260819-193206).txt
Document

perfect but mobile needs to be better.

Done up. but when sneding link to custoemr this shows up....



I'm here...

here?



I did the whole process and clicked build my restaurant 

I'm here...

I'm here...




I'm here

I'm here

where do you see signin/providers????

here now./..




Screenshot 2026-08-19 at 5.16.25 PM.png
Screenshot 2026-08-19 at 5.17.00 PM.png
went through the whole process. when it got to menu it was blank and when I pressed finish it 404'd




Perfect.

MISSION 14 — Wire the dashboard buttons
Now we make the owner dashboard actually navigate.

Replace the entire contents of:

app/owner/page.tsx

with this updated full version:

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  cuisine_category: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
};

export default function OwnerPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const params = new URLSearchParams(window.location.search);
        const restaurantId = params.get("restaurant");

        if (!restaurantId) {
          setMessage("No restaurant was selected.");
          setLoading(false);
          return;
        }

        const {
          data: { user },
Commit it.

Then refresh the owner dashboard and click:

EDIT SETTINGS

That should now take you to the settings page you just built.

After that, the next big piece is Menu Manager, because that’s one of the core reasons a restaurant owner would actually use this system.


Next. Dont past code but send downloadable link it will save up on future thread stalling between responsees. lets keep this roling I only got a few outs of non stop work before I have to go for the day. Lets knock this out warp speed!

Perfect. I already created the menu backend tables + RLS in the standalone Restaurant OS Supabase project, so this page is ready to work as soon as you add it.

NEXT — Menu Manager
Download this file:

Download Restaurant OS Menu Manager

Put it here in GitHub:

app/owner/menu/page.tsx

Commit it.

This gives you:

category creation/edit/delete

item creation/edit/delete

pricing

descriptions

category assignment

available/sold-out toggle

featured toggle

sort order

live counts for items/categories/sold out/featured

owner-only access through RLS

After Vercel deploys, click MANAGE MENU from the owner dashboard.

Then we go straight into Website Manager / site generator, which is the piece that turns this from restaurant admin software into the actual restaurant-site SaaS. 


restaurant-os-menu-manager-page.tsx
Code


Next!

Next up: Website Manager.

I already created the new restaurant_website_settings table + owner-only RLS in Supabase, so the backend is ready.

Download Restaurant OS Website Manager

Put it here:

app/owner/website/page.tsx

Commit it.

This gives the owner control over hero headline/subheadline, logo URL, hero image URL, about section, CTA buttons, section visibility, publish/draft state, and a live preview.

Once deployed, click MANAGE SITE from the dashboard.

Next after that: public restaurant site generator — the part that takes all this restaurant/menu/branding data and actually renders a customer-facing website. 


restaurant-os-website-manager-page.tsx
Code


Library
/
restaurant-os-website-manager-page.tsx


"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  cuisine_category: string | null;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

type Branding = {
  primary_color: string | null;
  secondary_color: string | null;
  tagline: string | null;
  short_description: string | null;
};

type WebsiteSettings = {
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string;
  logo_url: string;
  about_title: string;
  about_body: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  show_about: boolean;
  show_menu: boolean;
  show_ordering: boolean;
  show_vip: boolean;
  published: boolean;
};

const initialSettings: WebsiteSettings = {
  hero_headline: "",
  hero_subheadline: "",
  hero_image_url: "",
  logo_url: "",
  about_title: "",
  about_body: "",
  primary_cta_label: "ORDER ONLINE",
  secondary_cta_label: "VIEW MENU",
  show_about: true,
  show_menu: true,
  show_ordering: true,
  show_vip: true,
  published: false,
};

export default function WebsiteManagerPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant");

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not signed in.");
      setLoading(false);
      return;
    }

    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    const { data: brandingData } = await supabase
      .from("restaurant_branding")
      .select("*")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (brandingData) {
      setBranding({
        primary_color: brandingData.primary_color || null,
        secondary_color: brandingData.secondary_color || null,
        tagline: brandingData.tagline || null,
        short_description: brandingData.short_description || null,
      });
    }

    const { data: websiteData } = await supabase
      .from("restaurant_website_settings")
      .select("*")
      .eq("restaurant_id", id)
      .maybeSingle();

    if (websiteData) {
      setSettings({
        hero_headline: websiteData.hero_headline || "",
        hero_subheadline: websiteData.hero_subheadline || "",
        hero_image_url: websiteData.hero_image_url || "",
        logo_url: websiteData.logo_url || "",
        about_title: websiteData.about_title || "",
        about_body: websiteData.about_body || "",
        primary_cta_label: websiteData.primary_cta_label || "ORDER ONLINE",
        secondary_cta_label: websiteData.secondary_cta_label || "VIEW MENU",
        show_about: websiteData.show_about ?? true,
        show_menu: websiteData.show_menu ?? true,
        show_ordering: websiteData.show_ordering ?? true,
        show_vip: websiteData.show_vip ?? true,
        published: websiteData.published ?? false,
      });
    } else {
      setSettings((current) => ({
        ...current,
        hero_headline: restaurantData.name
          ? `WELCOME TO ${restaurantData.name.toUpperCase()}`
          : "",
        hero_subheadline:
          brandingData?.tagline ||
          brandingData?.short_description ||
          "Great food. Local flavor. Your table is waiting.",
        about_title: `ABOUT ${restaurantData.name.toUpperCase()}`,
        about_body:
          brandingData?.short_description ||
          "Tell your story here. Share what makes your restaurant special.",
      }));
    }

    setLoading(false);
  }

  function update<K extends keyof WebsiteSettings>(
    key: K,
    value: WebsiteSettings[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!restaurantId) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("restaurant_website_settings")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id" }
      );

    setSaving(false);
    setMessage(error ? error.message : "Website settings saved.");
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading website manager...</div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>{message || "Restaurant not found."}</div>
      </main>
    );
  }

  const primary = branding?.primary_color || "#0b3a67";
  const secondary = branding?.secondary_color || "#f5b82e";

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Website Manager</h1>
            <p style={subStyle}>
              Control the content and sections that power your restaurant site.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/owner?restaurant=${restaurantId}`)
            }
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <div style={layoutStyle}>
          <div>
            <section style={sectionStyle}>
              <SectionTitle title="Hero Section" />

              <Field
                label="HERO HEADLINE"
                value={settings.hero_headline}
                onChange={(value) => update("hero_headline", value)}
                placeholder="WELCOME TO YOUR RESTAURANT"
              />

              <Textarea
                label="HERO SUBHEADLINE"
                value={settings.hero_subheadline}
                onChange={(value) => update("hero_subheadline", value)}
                placeholder="Tell people why they should eat here."
              />

              <Field
                label="HERO IMAGE URL"
                value={settings.hero_image_url}
                onChange={(value) => update("hero_image_url", value)}
                placeholder="https://..."
              />

              <Field
                label="LOGO URL"
                value={settings.logo_url}
                onChange={(value) => update("logo_url", value)}
                placeholder="https://..."
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="About Section" />

              <Field
                label="ABOUT TITLE"
                value={settings.about_title}
                onChange={(value) => update("about_title", value)}
              />

              <Textarea
                label="ABOUT BODY"
                value={settings.about_body}
                onChange={(value) => update("about_body", value)}
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Buttons & Calls to Action" />

              <Field
                label="PRIMARY BUTTON"
                value={settings.primary_cta_label}
                onChange={(value) => update("primary_cta_label", value)}
              />

              <Field
                label="SECONDARY BUTTON"
                value={settings.secondary_cta_label}
                onChange={(value) => update("secondary_cta_label", value)}
              />
            </section>

            <section style={sectionStyle}>
              <SectionTitle title="Visible Sections" />

              <Toggle
                label="SHOW ABOUT SECTION"
                checked={settings.show_about}
                onChange={(value) => update("show_about", value)}
              />

              <Toggle
                label="SHOW MENU"
                checked={settings.show_menu}
                onChange={(value) => update("show_menu", value)}
              />

              <Toggle
                label="SHOW ORDERING"
                checked={settings.show_ordering}
                onChange={(value) => update("show_ordering", value)}
              />

              <Toggle
                label="SHOW VIP SIGNUP"
                checked={settings.show_vip}
                onChange={(value) => update("show_vip", value)}
              />

              <Toggle
                label="PUBLISH WEBSITE"
                checked={settings.published}
                onChange={(value) => update("published", value)}
              />
            </section>

            <button
              style={saveButtonStyle}
              disabled={saving}
              onClick={save}
            >
              {saving ? "SAVING..." : "SAVE WEBSITE SETTINGS"}
            </button>
          </div>

          <div>
            <div style={previewStickyStyle}>
              <div style={eyebrowStyle}>LIVE PREVIEW</div>

              <div
                style={{
                  ...previewCardStyle,
                  background: settings.hero_image_url
                    ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.72)), url("${settings.hero_image_url}") center/cover`
                    : `linear-gradient(135deg, ${primary}, #07101c)`,
                }}
              >
                <div style={previewTopStyle}>
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt=""
                      style={logoStyle}
                    />
                  ) : (
                    <div style={previewBrandStyle}>{restaurant.name}</div>
                  )}

                  <div
                    style={{
                      ...publishPillStyle,
                      borderColor: settings.published ? secondary : "#475569",
                      color: settings.published ? secondary : "#94a3b8",
                    }}
                  >
                    {settings.published ? "PUBLISHED" : "DRAFT"}
                  </div>
                </div>

                <div style={previewHeroBodyStyle}>
                  <h2 style={previewHeadlineStyle}>
                    {settings.hero_headline || restaurant.name}
                  </h2>

                  <p style={previewTextStyle}>
                    {settings.hero_subheadline ||
                      branding?.tagline ||
                      "Great food. Local flavor."}
                  </p>

                  <div style={buttonRowStyle}>
                    <button
                      style={{
                        ...previewPrimaryButtonStyle,
                        background: secondary,
                      }}
                    >
                      {settings.primary_cta_label || "ORDER ONLINE"}
                    </button>

                    <button style={previewSecondaryButtonStyle}>
                      {settings.secondary_cta_label || "VIEW MENU"}
                    </button>
                  </div>
                </div>
              </div>

              {settings.show_about && (
                <div style={previewSectionStyle}>
                  <div style={eyebrowStyle}>OUR STORY</div>
                  <h3 style={previewSectionTitleStyle}>
                    {settings.about_title || `ABOUT ${restaurant.name}`}
                  </h3>
                  <p style={previewBodyStyle}>
                    {settings.about_body ||
                      branding?.short_description ||
                      "Your restaurant story will appear here."}
                  </p>
                </div>
              )}

              <div style={miniGridStyle}>
                {settings.show_menu && (
                  <div style={miniCardStyle}>🍽️ MENU</div>
                )}
                {settings.show_ordering && (
                  <div style={miniCardStyle}>🛍️ ORDER ONLINE</div>
                )}
                {settings.show_vip && (
                  <div style={miniCardStyle}>⭐ VIP CLUB</div>
                )}
              </div>

              <div style={hintStyle}>
                This is the content manager preview. Next we connect these
                settings to the actual public restaurant-site template.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={eyebrowStyle}>SITE CONTROL</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        style={{ ...inputStyle, resize: "vertical" as const }}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={toggleRowStyle}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1260px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(42px,7vw,72px)",
  lineHeight: ".95",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.05fr) minmax(360px,.95fr)",
  gap: "22px",
  alignItems: "start",
};

const sectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  margin: "6px 0 0",
  fontSize: "27px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  color: "#cbd5e1",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "14px",
};

const toggleRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  borderBottom: "1px solid #23364d",
  padding: "14px 0",
  fontWeight: 800,
};

const saveButtonStyle = {
  width: "100%",
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "12px",
  padding: "17px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};

const previewStickyStyle = {
  position: "sticky" as const,
  top: "18px",
};

const previewCardStyle = {
  minHeight: "520px",
  borderRadius: "20px",
  border: "1px solid #2b3e55",
  padding: "24px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  overflow: "hidden",
};

const previewTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const logoStyle = {
  maxHeight: "64px",
  maxWidth: "140px",
  objectFit: "contain" as const,
};

const previewBrandStyle = {
  fontSize: "20px",
  fontWeight: 900,
};

const publishPillStyle = {
  border: "1px solid",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "1px",
};

const previewHeroBodyStyle = {
  maxWidth: "500px",
  paddingTop: "110px",
};

const previewHeadlineStyle = {
  fontSize: "clamp(38px,5vw,64px)",
  lineHeight: ".92",
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-2px",
};

const previewTextStyle = {
  color: "#e2e8f0",
  lineHeight: 1.6,
  fontSize: "16px",
  marginTop: "18px",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginTop: "22px",
};

const previewPrimaryButtonStyle = {
  color: "#08111f",
  border: 0,
  borderRadius: "9px",
  padding: "13px 16px",
  fontWeight: 900,
};

const previewSecondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,.7)",
  borderRadius: "9px",
  padding: "13px 16px",
  fontWeight: 900,
};

const previewSectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "22px",
  marginTop: "16px",
};

const previewSectionTitleStyle = {
  fontSize: "28px",
  margin: "7px 0 12px",
};

const previewBodyStyle = {
  color: "#94a3b8",
  lineHeight: 1.6,
};

const miniGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
  gap: "10px",
  marginTop: "12px",
};

const miniCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "12px",
  padding: "16px",
  fontWeight: 900,
  textAlign: "center" as const,
};

const hintStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "14px",
};
