import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const vercelToken = process.env.VERCEL_TOKEN || "";
const vercelProject =
  process.env.VERCEL_PROJECT_ID ||
  process.env.VERCEL_PROJECT_NAME ||
  "restaurant-os-mvp";
const vercelTeamId = process.env.VERCEL_TEAM_ID || "";

function adminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeDomain(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

function buildVercelUrl(path: string) {
  const base = `https://api.vercel.com${path}`;
  if (!vercelTeamId) return base;

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}teamId=${encodeURIComponent(vercelTeamId)}`;
}

async function authorizeAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing authorization token.",
    };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid admin session.",
    };
  }

  const admin = adminClient();

  const { data: adminRow, error: adminError } = await admin
    .from("platform_admins")
    .select("user_id,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !adminRow) {
    return {
      ok: false as const,
      status: 403,
      error: "Platform admin access required.",
    };
  }

  return {
    ok: true as const,
    admin,
    user,
  };
}

async function getRestaurant(
  admin: ReturnType<typeof adminClient>,
  restaurantId: string
) {
  const { data, error } = await admin
    .from("restaurants")
    .select("id,name,slug")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Restaurant not found.");
  }

  return data;
}

async function upsertDomainRecord({
  admin,
  restaurantId,
  domain,
  dnsStatus,
  sslStatus,
  verificationStatus,
}: {
  admin: ReturnType<typeof adminClient>;
  restaurantId: string;
  domain: string;
  dnsStatus?: string;
  sslStatus?: string;
  verificationStatus?: string;
}) {
  const payload: Record<string, unknown> = {
    restaurant_id: restaurantId,
    domain,
    is_primary: true,
    provider: "vercel",
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (dnsStatus !== undefined) payload.dns_status = dnsStatus;
  if (sslStatus !== undefined) payload.ssl_status = sslStatus;
  if (verificationStatus !== undefined)
    payload.verification_status = verificationStatus;

  const { data: existing, error: existingError } = await admin
    .from("restaurant_domains")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_primary", true)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { data, error } = await admin
      .from("restaurant_domains")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  const { data, error } = await admin
    .from("restaurant_domains")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function addDomainToVercel(domain: string) {
  if (!vercelToken) {
    return {
      connected: false,
      status: "not_connected",
      message:
        "VERCEL_TOKEN is not configured yet. Domain was staged in Restaurant OS only.",
    };
  }

  const response = await fetch(
    buildVercelUrl(
      `/v10/projects/${encodeURIComponent(vercelProject)}/domains`
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
      }),
      cache: "no-store",
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = body?.error?.code || "";
    const message =
      body?.error?.message ||
      body?.message ||
      "Vercel rejected the custom domain.";

    // If the domain is already attached to this project, treat it as connected
    // and continue into status verification instead of making migration brittle.
    if (
      code === "domain_already_in_use" ||
      code === "domain_already_exists" ||
      /already/i.test(message)
    ) {
      return {
        connected: true,
        status: "already_added",
        message,
      };
    }

    throw new Error(message);
  }

  return {
    connected: true,
    status: "added",
    message: "Domain added to Vercel project.",
    vercel: body,
  };
}

async function getVercelDomainStatus(domain: string) {
  if (!vercelToken) {
    return {
      connected: false,
      configured: false,
      status: "not_connected",
      message: "VERCEL_TOKEN is not configured.",
    };
  }

  const projectDomainResponse = await fetch(
    buildVercelUrl(
      `/v9/projects/${encodeURIComponent(
        vercelProject
      )}/domains/${encodeURIComponent(domain)}`
    ),
    {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
      cache: "no-store",
    }
  );

  const projectDomain = await projectDomainResponse
    .json()
    .catch(() => ({}));

  const configResponse = await fetch(
    buildVercelUrl(`/v6/domains/${encodeURIComponent(domain)}/config`),
    {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
      cache: "no-store",
    }
  );

  const config = await configResponse.json().catch(() => ({}));

  if (!projectDomainResponse.ok) {
    return {
      connected: false,
      configured: false,
      status: "not_added",
      message:
        projectDomain?.error?.message ||
        "Domain is not attached to the Vercel project yet.",
      project_domain: projectDomain,
      config,
    };
  }

  const verified =
    Boolean(projectDomain?.verified) ||
    Boolean(projectDomain?.verification?.length === 0);

  const misconfigured = Boolean(config?.misconfigured);

  return {
    connected: true,
    configured: !misconfigured,
    verified,
    status:
      verified && !misconfigured
        ? "ready"
        : verified
        ? "dns_required"
        : "verification_required",
    project_domain: projectDomain,
    config,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase server environment variables are missing." },
        { status: 500 }
      );
    }

    const auth = await authorizeAdmin(request);

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const restaurantId = String(
      request.nextUrl.searchParams.get("restaurant_id") || ""
    ).trim();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurant_id is required." },
        { status: 400 }
      );
    }

    await getRestaurant(auth.admin, restaurantId);

    const { data: records, error: recordError } = await auth.admin
      .from("restaurant_domains")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("is_primary", { ascending: false });

    if (recordError) {
      throw new Error(recordError.message);
    }

    const primary = records?.[0] || null;

    if (!primary?.normalized_domain) {
      return NextResponse.json({
        ok: true,
        domain: null,
        vercel_connected: Boolean(vercelToken),
      });
    }

    const status = await getVercelDomainStatus(primary.normalized_domain);

    return NextResponse.json({
      ok: true,
      domain: primary,
      vercel_connected: Boolean(vercelToken),
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load domain status.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase server environment variables are missing." },
        { status: 500 }
      );
    }

    const auth = await authorizeAdmin(request);

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const restaurantId = String(body.restaurant_id || "").trim();
    const action = String(body.action || "").trim();

    if (!restaurantId || !action) {
      return NextResponse.json(
        { error: "restaurant_id and action are required." },
        { status: 400 }
      );
    }

    const restaurant = await getRestaurant(auth.admin, restaurantId);

    if (action === "stage") {
      const domain = normalizeDomain(body.domain);

      if (!domain || !domain.includes(".")) {
        return NextResponse.json(
          { error: "Enter a valid domain such as vi-pollo.com." },
          { status: 400 }
        );
      }

      const record = await upsertDomainRecord({
        admin: auth.admin,
        restaurantId,
        domain,
        dnsStatus: "pending",
        sslStatus: "pending",
        verificationStatus: "pending",
      });

      return NextResponse.json({
        ok: true,
        message: `${domain} staged for ${restaurant.name}. No DNS changes were made.`,
        domain: record,
      });
    }

    if (action === "connect") {
      const domain = normalizeDomain(body.domain);

      if (!domain || !domain.includes(".")) {
        return NextResponse.json(
          { error: "Enter a valid domain." },
          { status: 400 }
        );
      }

      const vercel = await addDomainToVercel(domain);

      const record = await upsertDomainRecord({
        admin: auth.admin,
        restaurantId,
        domain,
        dnsStatus: "pending",
        sslStatus: "pending",
        verificationStatus: "pending",
      });

      return NextResponse.json({
        ok: true,
        message: vercel.message,
        domain: record,
        vercel,
      });
    }

    if (action === "check") {
      const domain = normalizeDomain(body.domain);

      if (!domain) {
        return NextResponse.json(
          { error: "Domain is required." },
          { status: 400 }
        );
      }

      const status = await getVercelDomainStatus(domain);

      const record = await upsertDomainRecord({
        admin: auth.admin,
        restaurantId,
        domain,
        dnsStatus: status.configured ? "configured" : "pending",
        sslStatus:
          status.status === "ready" ? "active" : "pending",
        verificationStatus: status.verified ? "verified" : "pending",
      });

      return NextResponse.json({
        ok: true,
        domain: record,
        status,
      });
    }

    return NextResponse.json(
      { error: "Unknown domain action." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Custom domain operation failed.",
      },
      { status: 500 }
    );
  }
}
