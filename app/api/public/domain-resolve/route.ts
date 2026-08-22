import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function normalizeHost(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server environment variables are missing." },
        { status: 500 }
      );
    }

    const rawHost =
      request.nextUrl.searchParams.get("host") ||
      request.headers.get("host") ||
      "";

    const host = normalizeHost(rawHost);

    if (!host) {
      return NextResponse.json(
        { error: "host is required." },
        { status: 400 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: domainRow, error: domainError } = await admin
      .from("restaurant_domains")
      .select(
        "restaurant_id,domain,normalized_domain,is_primary,dns_status,ssl_status,verification_status,provider"
      )
      .eq("normalized_domain", host)
      .maybeSingle();

    if (domainError) {
      throw new Error(domainError.message);
    }

    if (!domainRow) {
      return NextResponse.json(
        { found: false, host },
        { status: 404 }
      );
    }

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id,name,slug,status,admin_suspended")
      .eq("id", domainRow.restaurant_id)
      .maybeSingle();

    if (restaurantError) {
      throw new Error(restaurantError.message);
    }

    if (!restaurant) {
      return NextResponse.json(
        {
          found: false,
          host,
          error: "Restaurant record not found.",
        },
        { status: 404 }
      );
    }

    const { data: websiteSettings, error: websiteError } = await admin
      .from("restaurant_website_settings")
      .select("published")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    if (websiteError) {
      throw new Error(websiteError.message);
    }

    if (restaurant.admin_suspended) {
      return NextResponse.json(
        {
          found: true,
          routable: false,
          reason: "suspended",
          host,
          restaurant_id: restaurant.id,
        },
        { status: 403 }
      );
    }

    if (!restaurant.slug) {
      return NextResponse.json(
        {
          found: true,
          routable: false,
          reason: "missing_slug",
          host,
          restaurant_id: restaurant.id,
        },
        { status: 409 }
      );
    }

    // Custom domains should only serve restaurants whose public website
    // is explicitly published in restaurant_website_settings.
    if (!websiteSettings?.published) {
      return NextResponse.json(
        {
          found: true,
          routable: false,
          reason: "not_published",
          host,
          restaurant_id: restaurant.id,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      found: true,
      routable: true,
      host,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        published: true,
      },
      domain: {
        domain: domainRow.domain,
        normalized_domain: domainRow.normalized_domain,
        is_primary: domainRow.is_primary,
        dns_status: domainRow.dns_status,
        ssl_status: domainRow.ssl_status,
        verification_status: domainRow.verification_status,
        provider: domainRow.provider,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to resolve custom domain.",
      },
      { status: 500 }
    );
  }
}
