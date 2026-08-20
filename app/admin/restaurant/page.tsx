
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




no go

Cant add/manage additional pages
Need a plug for Socials and links on site that point to socials 


ang on.. where am I supposeed to see these changes??

Screenshot 2026-08-20 at 12.25.51 PM.png
Screenshot 2026-08-20 at 12.26.00 PM.png
got it but how do I get here from there?

didnt pass

Yep — I see it. The failure is just the Supabase import path on the new nested detail page.

I removed that fragile relative import entirely and made this page initialize Supabase directly.

Download FIXED Campaign Detail Page

Replace:

app/owner/campaign-results/detail/page.tsx

Commit it.

That should clear the:

Module not found: Can't resolve ...lib/supabase

build error.

Do only that one replacement and let Vercel run again. 


restaurant-os-campaign-detail-attribution-FIXED.tsx
Code


This is my existing account? Just add create account or create organizaion?

ok? where from here?

ok I'm here....


Now here?

where in VERCEL?



I'm here

I'm here...

I'm here...

it just is spinning and says opening checkout

flashed and nothing opens.

is that part of my problem?


Screenshot 2026-08-20 at 2.21.09 PM.png
BOOM NEXT

Screenshot 2026-08-20 at 2.41.34 PM.png
woah we need to backup 2 dep;oyments...

Screenshot 2026-08-20 at 2.43.14 PM.png
and now the last one too....

Screenshot 2026-08-20 at 4.00.06 PM.png

Screenshot 2026-08-20 at 4.01.27 PM.png
nothign charnged

Generated image: 802 Pizza: Mountain-Inspired Hospitality


Edit


Screenshot 2026-08-20 at 4.20.28 PM.png
Screenshot 2026-08-20 at 4.20.37 PM.png
https://worcester.americanflatbread.com/
https://worcester.americanflatbread.com/food-menu 
can you get me close to this one? I like this the best? 

Screenshot 2026-08-20 at 4.26.48 PM.png
How can we improve that space?

Screenshot 2026-08-20 at 4.29.20 PM.png
still looks like crap... I gave you a perfect example.

Screenshot 2026-08-20 at 4.33.07 PM.png
147563C3-0856-470E-B5D2-C572EF8FEDB9_1_105_c.jpeg
BE5BEA1E-E682-466D-B01C-60C2E6B20978_1_102_o.jpeg
E5EBBBB3-66AF-4CC3-B106-CEF6C86067D8_1_102_a.jpeg
C9CAB622-3912-4124-A986-2B3DB752FE4C_1_102_o.jpeg
D4E034B4-ACA9-4A48-94E9-542FDE553C48_1_102_o.jpeg
7598E459-9C18-487B-9904-20D7942C3A82_1_102_o.jpeg
1907A56B-CE96-49D4-A89B-A63432D5B34C_1_102_a.jpeg
09420523-1B4E-4163-B444-CC9B38C7F1E4_1_105_c.jpeg
66C49B0F-5BEC-4FF0-AF13-E35F340BD7D3_1_105_c.jpeg
39F31871-4506-43BC-B088-81B3F9D125B5_1_105_c.jpeg
415442D1-4F33-4CEE-918C-C17E7C90313C_4_5005_c.jpeg
A7AFF9E4-9163-41BD-B94F-5E76F5E16808_1_105_c.jpeg
32DDECFB-C4F8-4806-BE89-0D4507C38DF4_1_105_c.jpeg
E72CAC4D-1C75-47ED-9AE4-F118B92A65DB_1_105_c.jpeg
1D5BEA1D-4A1B-42E5-9630-A3C4A25C7701_1_105_c.jpeg
ok so close. where the dead space is put this pic in the dead space with text overlay if need be

Yes — this is the version I wanted to get to: real 802 photos, fewer of them, stronger brand story, no random stock-photo chaos.

Download the new 802 site code

Replace:

app/r/[slug]/page.tsx

This version uses the actual 802 images you uploaded and keeps it tight:

Storefront as the hero background with dark overlay and text

actual 802 logo in nav and hero

actual chalkboard/bar scene for the story

only 3 featured food images:

pepperoni pizza

calamari

steak salad

full menu remains data-driven from Restaurant OS

hours, phone, ordering, offers, VIP all stay live

You also need these 6 image files in:

public/802/

Download and add them with these exact filenames:

802 Logo
Storefront
Pepperoni
Calamari
Steak Salad
Chalkboard

Rename them inside GitHub to:

logo.webp
storefront.webp
pepperoni.webp
calamari.webp
steak-salad.webp
chalkboard.webp

So the final structure is:

public/802/logo.webp
public/802/storefront.webp
public/802/pepperoni.webp
public/802/calamari.webp
public/802/steak-salad.webp
public/802/chalkboard.webp

This should finally feel like 802 Pizza, not a generic restaurant template. 


restaurant-os-802-REAL-PHOTOS.tsx
Code


BOOM — Super Admin is now actionable, not just view-only.

Download Super Admin with Actions Wired

Replace:

app/admin/page.tsx

Commit it.

This wires the command center to the admin actions API so you can now:

SUSPEND

REACTIVATE

EXTEND TRIAL

set SUPPORT STATUS

add internal ADMIN NOTES

keep OPEN / SITE / BILLING / QA shortcuts

The actions open in modals and refresh the dashboard after completion.

Important: suspension is intentionally separate from Stripe cancellation. It blocks platform access without automatically touching billing.

Next build should be the Admin Restaurant Detail page so clicking one restaurant opens a full account profile with billing, notes, metrics, readiness, and support history in one place. 


restaurant-os-super-admin-ACTIONS-WIRED.tsx
Code


next

BOOM — next piece is the secure restaurant detail API for Super Admin.

Download Admin Restaurant Detail API

Put it here:

app/api/admin/restaurant/route.ts

Commit it.

This gives the upcoming detail page everything it needs in one call:

restaurant profile

subscription / Stripe state

website publish state

branding

ordering + catering

VIP settings

readiness %

menu count

VIP count

offers

campaigns

claims

redemptions

attributed claims

recent claims

internal admin notes

Next build is the actual:

/admin/restaurant?restaurant=...

full account detail screen with billing, metrics, notes, support actions, and quick links. 


restaurant-os-admin-restaurant-detail-route.ts
Code


next

BOOM — the full Super Admin restaurant account screen is ready.

Download Admin Restaurant Detail Page

Put it here:

app/admin/restaurant/page.tsx

Commit it.

This gives you one account-level command screen with billing, readiness, menu/VIP/campaign metrics, website status, support status, suspend/reactivate, trial extension, internal notes, claims/redemptions, and quick links into the owner tools.

Next we should update the main /admin OPEN button so it goes to this new detail page instead of dropping straight into the owner dashboard. 


restaurant-os-admin-restaurant-detail-page.tsx
Code


Library
/
restaurant-os-admin-restaurant-detail-page.tsx


"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  owner_user_id: string;
  phone: string | null;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string | null;
  created_at: string;
  admin_suspended: boolean;
  admin_support_status: string;
};

type Subscription = {
  plan: string | null;
  status: string | null;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DetailPayload = {
  admin_role: string;
  restaurant: Restaurant;
  subscription: Subscription | null;
  website: {
    published: boolean | null;
    hero_headline: string | null;
    about_body: string | null;
  } | null;
  branding: {
    primary_color: string | null;
    secondary_color: string | null;
    tagline: string | null;
    short_description: string | null;
  } | null;
  ordering: {
    online_ordering_url: string | null;
    catering_email: string | null;
  } | null;
  growth: {
    vip_club_name: string | null;
    signup_offer: string | null;
  } | null;
  metrics: {
    readiness_percent: number;
    menu_count: number;
    vip_count: number;
    offer_count: number;
    campaign_count: number;
    claim_count: number;
    redeemed_count: number;
    attributed_claim_count: number;
  };
  recent_claims: {
    id: string;
    status: string | null;
    campaign_id: string | null;
    claimed_at: string | null;
    redeemed_at: string | null;
  }[];
  notes: {
    id: string;
    admin_user_id: string;
    note: string;
    created_at: string;
  }[];
};

export default function AdminRestaurantDetailPage() {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [trialDays, setTrialDays] = useState(14);
  const [supportStatus, setSupportStatus] = useState("normal");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    loadDetail();
  }, []);

  async function getRestaurantId() {
    return new URLSearchParams(window.location.search).get("restaurant");
  }

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return null;
    }

    return session.access_token;
  }

  async function loadDetail() {
    setLoading(true);
    setMessage("");

    const restaurantId = await getRestaurantId();

    if (!restaurantId) {
      setMessage("No restaurant was selected.");
      setLoading(false);
      return;
    }

    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch(
      `/api/admin/restaurant?restaurant_id=${encodeURIComponent(restaurantId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to load restaurant.");
      setLoading(false);
      return;
    }

    setDetail(data);
    setSupportStatus(data.restaurant.admin_support_status || "normal");
    setLoading(false);
  }

  async function runAction(
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    if (!detail) return;

    setActionLoading(true);
    setActionMessage("");

    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: detail.restaurant.id,
        action,
        ...extra,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setActionMessage(data.error || "Admin action failed.");
      setActionLoading(false);
      return;
    }

    setActionMessage(data.message || "Action completed.");
    setNote("");
    await loadDetail();
    setActionLoading(false);
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  if (loading) {
    return <main style={pageStyle}><div style={shellStyle}>Loading account...</div></main>;
  }

  if (message || !detail) {
    return (
      <main style={pageStyle}>
        <div style={errorCardStyle}>
          <div style={eyebrowStyle}>RESTAURANT OS</div>
          <h1 style={errorTitleStyle}>Account Detail</h1>
          <p style={mutedStyle}>{message || "Restaurant not found."}</p>
          <button style={secondaryButtonStyle} onClick={() => (window.location.href = "/admin")}>
            BACK TO ADMIN
          </button>
        </div>
      </main>
    );
  }

  const { restaurant, subscription, metrics } = detail;
  const address = [
    restaurant.address_line_1,
    restaurant.city,
    restaurant.state,
    restaurant.zip,
  ].filter(Boolean).join(", ");

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <button style={backButtonStyle} onClick={() => (window.location.href = "/admin")}>
              ← SUPER ADMIN
            </button>
            <div style={eyebrowStyle}>RESTAURANT ACCOUNT</div>
            <h1 style={titleStyle}>{restaurant.name}</h1>
            <div style={metaLineStyle}>
              {address || "No address"} {restaurant.phone ? ` • ${restaurant.phone}` : ""}
            </div>
          </div>

          <div style={headerActionsStyle}>
            {restaurant.slug && (
              <button
                style={secondaryButtonStyle}
                onClick={() => window.open(`/r/${restaurant.slug}`, "_blank")}
              >
                VIEW SITE
              </button>
            )}
            <button
              style={primaryButtonStyle}
              onClick={() =>
                (window.location.href = `/owner?restaurant=${restaurant.id}`)
              }
            >
              OPEN OWNER
            </button>
          </div>
        </header>

        {actionMessage && (
          <div style={actionMessageStyle}>{actionMessage}</div>
        )}

        <section style={statsGridStyle}>
          <Metric label="READINESS" value={`${metrics.readiness_percent}%`} />
          <Metric label="MENU ITEMS" value={metrics.menu_count} />
          <Metric label="VIP MEMBERS" value={metrics.vip_count} />
          <Metric label="OFFERS" value={metrics.offer_count} />
          <Metric label="CAMPAIGNS" value={metrics.campaign_count} />
          <Metric label="CLAIMS" value={metrics.claim_count} />
          <Metric label="REDEEMED" value={metrics.redeemed_count} />
          <Metric label="ATTRIBUTED" value={metrics.attributed_claim_count} />
        </section>

        <section style={twoColumnStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>ACCOUNT STATUS</div>
            <h2 style={cardTitleStyle}>Platform Access</h2>

            <InfoRow label="Support Status" value={restaurant.admin_support_status.replace("_", " ")} />
            <InfoRow label="Suspended" value={restaurant.admin_suspended ? "YES" : "NO"} />
            <InfoRow label="Site Status" value={detail.website?.published ? "LIVE" : "DRAFT"} />
            <InfoRow label="Restaurant Status" value={restaurant.status || "—"} />

            <div style={fieldBlockStyle}>
              <label style={fieldLabelStyle}>SUPPORT STATUS</label>
              <select
                value={supportStatus}
                onChange={(event) => setSupportStatus(event.target.value)}
                style={inputStyle}
              >
                <option value="normal">Normal</option>
                <option value="watch">Watch</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                style={secondaryFullButtonStyle}
                disabled={actionLoading}
                onClick={() =>
                  runAction("set_support_status", { status: supportStatus })
                }
              >
                SAVE SUPPORT STATUS
              </button>
            </div>

            <div style={buttonRowStyle}>
              {restaurant.admin_suspended ? (
                <button
                  style={successButtonStyle}
                  disabled={actionLoading}
                  onClick={() => runAction("reactivate")}
                >
                  REACTIVATE
                </button>
              ) : (
                <button
                  style={dangerButtonStyle}
                  disabled={actionLoading}
                  onClick={() => runAction("suspend")}
                >
                  SUSPEND
                </button>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>BILLING</div>
            <h2 style={cardTitleStyle}>$99 / Location</h2>

            <InfoRow label="Plan" value={subscription?.plan || "No plan"} />
            <InfoRow label="Status" value={subscription?.status || "No subscription"} />
            <InfoRow label="Provider" value={subscription?.provider || "—"} />
            <InfoRow label="Trial Ends" value={formatDate(subscription?.trial_ends_at)} />
            <InfoRow label="Period Ends" value={formatDate(subscription?.current_period_end)} />
            <InfoRow label="Stripe Customer" value={subscription?.provider_customer_id || "—"} />
            <InfoRow label="Stripe Subscription" value={subscription?.provider_subscription_id || "—"} />

            <div style={trialBoxStyle}>
              <label style={fieldLabelStyle}>EXTEND TRIAL</label>
              <div style={trialRowStyle}>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={trialDays}
                  onChange={(event) =>
                    setTrialDays(
                      Math.max(1, Math.min(90, Number(event.target.value) || 1))
                    )
                  }
                  style={inputStyle}
                />
                <button
                  style={primaryButtonStyle}
                  disabled={actionLoading}
                  onClick={() => runAction("extend_trial", { days: trialDays })}
                >
                  ADD DAYS
                </button>
              </div>
            </div>

            <button
              style={secondaryFullButtonStyle}
              onClick={() =>
                (window.location.href = `/owner/billing?restaurant=${restaurant.id}`)
              }
            >
              OPEN BILLING
            </button>
          </div>
        </section>

        <section style={twoColumnStyle}>
          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>BUSINESS + WEBSITE</div>
            <h2 style={cardTitleStyle}>Launch Readiness</h2>

            <InfoRow label="Address" value={address || "Missing"} />
            <InfoRow label="Phone" value={restaurant.phone || "Missing"} />
            <InfoRow label="Hero Headline" value={detail.website?.hero_headline || "Missing"} />
            <InfoRow label="Tagline" value={detail.branding?.tagline || "Missing"} />
            <InfoRow label="Online Ordering" value={detail.ordering?.online_ordering_url ? "CONNECTED" : "Missing"} />
            <InfoRow label="Catering Email" value={detail.ordering?.catering_email || "Missing"} />
            <InfoRow label="VIP Club" value={detail.growth?.vip_club_name || "Missing"} />

            <div style={buttonRowStyle}>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/qa?restaurant=${restaurant.id}`)
                }
              >
                OPEN QA
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/website?restaurant=${restaurant.id}`)
                }
              >
                WEBSITE
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() =>
                  (window.location.href = `/owner/menu?restaurant=${restaurant.id}`)
                }
              >
                MENU
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardEyebrowStyle}>INTERNAL SUPPORT</div>
            <h2 style={cardTitleStyle}>Admin Notes</h2>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add an internal note..."
              style={textareaStyle}
            />

            <button
              style={primaryFullButtonStyle}
              disabled={actionLoading || !note.trim()}
              onClick={() => runAction("add_note", { note })}
            >
              {actionLoading ? "SAVING..." : "ADD NOTE"}
            </button>

            <div style={notesListStyle}>
              {detail.notes.length === 0 ? (
                <div style={emptyStyle}>No admin notes yet.</div>
              ) : (
                detail.notes.map((item) => (
                  <div key={item.id} style={noteCardStyle}>
                    <div style={noteDateStyle}>{formatDate(item.created_at)}</div>
                    <div style={noteTextStyle}>{item.note}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={cardEyebrowStyle}>RECENT ACTIVITY</div>
          <h2 style={cardTitleStyle}>Offer Claims</h2>

          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Status</Th>
                  <Th>Campaign</Th>
                  <Th>Claimed</Th>
                  <Th>Redeemed</Th>
                </tr>
              </thead>
              <tbody>
                {detail.recent_claims.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={emptyTdStyle}>No claims yet.</td>
                  </tr>
                ) : (
                  detail.recent_claims.map((claim) => (
                    <tr key={claim.id}>
                      <Td>{claim.status || "—"}</Td>
                      <Td>{claim.campaign_id ? "Attributed" : "Direct / Unknown"}</Td>
                      <Td>{formatDate(claim.claimed_at)}</Td>
                      <Td>{formatDate(claim.redeemed_at)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#fff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = { maxWidth: 1450, margin: "0 auto" };

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap" as const,
  marginBottom: 24,
};

const backButtonStyle = {
  background: "transparent",
  border: 0,
  color: "#94a3b8",
  padding: "0 0 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 2,
};

const titleStyle = {
  margin: "7px 0 10px",
  fontSize: "clamp(48px,7vw,82px)",
  lineHeight: .9,
  letterSpacing: -4,
};

const metaLineStyle = { color: "#94a3b8", fontSize: 14 };

const headerActionsStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))",
  gap: 10,
  marginBottom: 18,
};

const metricCardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: 14,
  padding: 17,
};

const metricValueStyle = {
  color: "#f5b82e",
  fontSize: 28,
  fontWeight: 900,
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1,
  marginTop: 4,
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: 16,
  marginBottom: 16,
};

const cardStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
};

const cardEyebrowStyle = {
  color: "#f5b82e",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1.5,
};

const cardTitleStyle = {
  margin: "6px 0 18px",
  fontSize: 28,
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns: "145px 1fr",
  gap: 14,
  padding: "11px 0",
  borderBottom: "1px solid #1d2b3a",
};

const infoLabelStyle = {
  color: "#64748b",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase" as const,
};

const infoValueStyle = {
  color: "#e2e8f0",
  fontSize: 12,
  wordBreak: "break-word" as const,
};

const fieldBlockStyle = { marginTop: 18 };

const fieldLabelStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1,
  marginBottom: 7,
};

const inputStyle = {
  width: "100%",
  background: "#08111f",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: 11,
};

const textareaStyle = {
  width: "100%",
  minHeight: 120,
  background: "#08111f",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: 12,
  resize: "vertical" as const,
  lineHeight: 1.5,
};

const buttonRowStyle = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap" as const,
  marginTop: 16,
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryFullButtonStyle = {
  ...secondaryButtonStyle,
  width: "100%",
  marginTop: 10,
};

const primaryFullButtonStyle = {
  ...primaryButtonStyle,
  width: "100%",
  marginTop: 10,
};

const dangerButtonStyle = {
  background: "#7f1d1d",
  color: "#fff",
  border: "1px solid #b91c1c",
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const successButtonStyle = {
  background: "#14532d",
  color: "#dcfce7",
  border: "1px solid #166534",
  borderRadius: 9,
  padding: "11px 14px",
  fontSize: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const trialBoxStyle = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid #23364d",
};

const trialRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 9,
};

const notesListStyle = {
  display: "grid",
  gap: 8,
  marginTop: 15,
  maxHeight: 420,
  overflowY: "auto" as const,
};

const noteCardStyle = {
  background: "#08111f",
  border: "1px solid #23364d",
  borderRadius: 10,
  padding: 12,
};

const noteDateStyle = { color: "#64748b", fontSize: 9, marginBottom: 6 };
const noteTextStyle = { color: "#e2e8f0", fontSize: 12, lineHeight: 1.5 };

const actionMessageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  color: "#dbeafe",
  borderRadius: 10,
  padding: 12,
  marginBottom: 16,
  fontSize: 12,
};

const tableScrollStyle = { overflowX: "auto" as const };
const tableStyle = {
  width: "100%",
  minWidth: 700,
  borderCollapse: "collapse" as const,
};

const thStyle = {
  textAlign: "left" as const,
  color: "#64748b",
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 1,
  padding: "10px 12px",
  borderBottom: "1px solid #23364d",
};

const tdStyle = {
  color: "#cbd5e1",
  fontSize: 11,
  padding: "12px",
  borderBottom: "1px solid #1d2b3a",
};

const emptyStyle = { color: "#64748b", fontSize: 12 };
const emptyTdStyle = { ...tdStyle, textAlign: "center" as const };
const mutedStyle = { color: "#94a3b8" };

const errorCardStyle = {
  maxWidth: 560,
  margin: "100px auto",
  background: "#0f1d2e",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: 24,
};

const errorTitleStyle = { fontSize: 36, margin: "8px 0" };
