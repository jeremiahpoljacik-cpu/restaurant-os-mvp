import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function serviceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function authorizeAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) {
    return { error: "Missing authorization token.", status: 401 };
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
    return { error: "Invalid session.", status: 401 };
  }

  const admin = serviceClient();

  const { data: adminRow, error: adminError } = await admin
    .from("platform_admins")
    .select("user_id,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !adminRow) {
    return { error: "Admin access required.", status: 403 };
  }

  return { user, adminRow, admin };
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Admin API environment variables are not configured." },
        { status: 500 }
      );
    }

    const auth = await authorizeAdmin(request);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const restaurantId = request.nextUrl.searchParams.get("restaurant_id");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurant_id is required." },
        { status: 400 }
      );
    }

    const { admin, adminRow } = auth;

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select(
        "id,name,slug,owner_user_id,phone,address_line_1,city,state,zip,status,created_at,admin_suspended,admin_support_status"
      )
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: restaurantError?.message || "Restaurant not found." },
        { status: 404 }
      );
    }

    const [
      subscriptionResult,
      websiteResult,
      brandingResult,
      orderingResult,
      growthResult,
      menuResult,
      vipResult,
      offersResult,
      campaignsResult,
      claimsResult,
      notesResult,
    ] = await Promise.all([
      admin
        .from("restaurant_subscriptions")
        .select(
          "plan,status,provider,provider_customer_id,provider_subscription_id,trial_ends_at,current_period_end,created_at,updated_at"
        )
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      admin
        .from("restaurant_website_settings")
        .select("published,hero_headline,about_body")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      admin
        .from("restaurant_branding")
        .select("primary_color,secondary_color,tagline,short_description")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      admin
        .from("restaurant_ordering")
        .select("online_ordering_url,catering_email")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      admin
        .from("restaurant_growth_settings")
        .select("vip_club_name,signup_offer")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),

      admin
        .from("restaurant_menu_items")
        .select("id", { count: "exact" })
        .eq("restaurant_id", restaurantId),

      admin
        .from("restaurant_vip_members")
        .select("id", { count: "exact" })
        .eq("restaurant_id", restaurantId),

      admin
        .from("restaurant_vip_offers")
        .select("id", { count: "exact" })
        .eq("restaurant_id", restaurantId),

      admin
        .from("restaurant_campaigns")
        .select("id", { count: "exact" })
        .eq("restaurant_id", restaurantId),

      admin
        .from("restaurant_offer_claims")
        .select("id,status,campaign_id,claimed_at,redeemed_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false }),

      admin
        .from("restaurant_admin_notes")
        .select("id,admin_user_id,note,created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const subscription = subscriptionResult.data || null;
    const website = websiteResult.data || null;
    const claims = claimsResult.data || [];

    const accessHealthy =
      subscription?.status === "active" ||
      (subscription?.status === "trial" &&
        (!subscription.trial_ends_at ||
          new Date(subscription.trial_ends_at).getTime() > Date.now()));

    const readinessChecks = [
      Boolean(
        restaurant.phone &&
          restaurant.address_line_1 &&
          restaurant.city &&
          restaurant.state &&
          restaurant.zip
      ),
      Boolean(brandingResult.data),
      Boolean(website?.hero_headline && website?.about_body),
      Boolean(website?.published),
      (menuResult.count || 0) > 0,
      Boolean(accessHealthy),
    ];

    const readinessPercent = Math.round(
      (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100
    );

    const redeemedCount = claims.filter(
      (claim) => claim.status === "redeemed"
    ).length;

    const attributedCount = claims.filter(
      (claim) => Boolean(claim.campaign_id)
    ).length;

    return NextResponse.json({
      admin_role: adminRow.role,
      restaurant,
      subscription,
      website,
      branding: brandingResult.data || null,
      ordering: orderingResult.data || null,
      growth: growthResult.data || null,
      metrics: {
        readiness_percent: readinessPercent,
        menu_count: menuResult.count || 0,
        vip_count: vipResult.count || 0,
        offer_count: offersResult.count || 0,
        campaign_count: campaignsResult.count || 0,
        claim_count: claims.length,
        redeemed_count: redeemedCount,
        attributed_claim_count: attributedCount,
      },
      recent_claims: claims.slice(0, 20),
      notes: notesResult.data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load admin restaurant detail.",
      },
      { status: 500 }
    );
  }
}
