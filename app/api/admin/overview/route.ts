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

  return {
    user,
    adminRow,
    admin,
  };
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

    const { admin, adminRow } = auth;

    const { data: restaurants, error: restaurantError } = await admin
      .from("restaurants")
      .select(
        "id,name,slug,owner_user_id,phone,city,state,status,created_at,admin_suspended,admin_support_status"
      )
      .order("created_at", { ascending: false });

    if (restaurantError) {
      return NextResponse.json(
        { error: restaurantError.message },
        { status: 500 }
      );
    }

    const restaurantIds = (restaurants || []).map((restaurant) => restaurant.id);

    const [
      subscriptionsResult,
      websitesResult,
      menuResult,
      vipResult,
      campaignsResult,
      claimsResult,
    ] = await Promise.all([
      admin
        .from("restaurant_subscriptions")
        .select(
          "restaurant_id,plan,status,provider_customer_id,provider_subscription_id,trial_ends_at,current_period_end"
        )
        .in("restaurant_id", restaurantIds.length ? restaurantIds : ["00000000-0000-0000-0000-000000000000"]),

      admin
        .from("restaurant_website_settings")
        .select("restaurant_id,published,hero_headline,about_body")
        .in("restaurant_id", restaurantIds.length ? restaurantIds : ["00000000-0000-0000-0000-000000000000"]),

      admin
        .from("restaurant_menu_items")
        .select("restaurant_id")
        .in("restaurant_id", restaurantIds.length ? restaurantIds : ["00000000-0000-0000-0000-000000000000"]),

      admin
        .from("restaurant_vip_members")
        .select("restaurant_id")
        .in("restaurant_id", restaurantIds.length ? restaurantIds : ["00000000-0000-0000-0000-000000000000"]),

      admin
        .from("restaurant_campaigns")
        .select("restaurant_id")
        .in("restaurant_id", restaurantIds.length ? restaurantIds : ["00000000-0000-0000-0000-000000000000"]),

      admin
        .from("restaurant_offer_claims")
        .select("restaurant_id,status")
        .in("restaurant_id", restaurantIds.length ? restaurantIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const subscriptions = subscriptionsResult.data || [];
    const websites = websitesResult.data || [];
    const menuRows = menuResult.data || [];
    const vipRows = vipResult.data || [];
    const campaignRows = campaignsResult.data || [];
    const claimRows = claimsResult.data || [];

    const subscriptionMap = new Map(
      subscriptions.map((row) => [row.restaurant_id, row])
    );

    const websiteMap = new Map(
      websites.map((row) => [row.restaurant_id, row])
    );

    function countFor(rows: { restaurant_id: string }[], restaurantId: string) {
      return rows.filter((row) => row.restaurant_id === restaurantId).length;
    }

    const enriched = (restaurants || []).map((restaurant) => {
      const subscription = subscriptionMap.get(restaurant.id) || null;
      const website = websiteMap.get(restaurant.id) || null;

      const menuCount = countFor(menuRows, restaurant.id);
      const vipCount = countFor(vipRows, restaurant.id);
      const campaignCount = countFor(campaignRows, restaurant.id);
      const claims = claimRows.filter(
        (row) => row.restaurant_id === restaurant.id
      );
      const redeemedCount = claims.filter(
        (row) => row.status === "redeemed"
      ).length;

      const accessHealthy =
        subscription?.status === "active" ||
        (subscription?.status === "trial" &&
          (!subscription.trial_ends_at ||
            new Date(subscription.trial_ends_at).getTime() > Date.now()));

      const readinessChecks = [
        Boolean(restaurant.phone && restaurant.city && restaurant.state),
        Boolean(website?.hero_headline && website?.about_body),
        Boolean(website?.published),
        menuCount > 0,
        Boolean(accessHealthy),
      ];

      const readinessPercent = Math.round(
        (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100
      );

      return {
        ...restaurant,
        subscription,
        website,
        metrics: {
          menu_count: menuCount,
          vip_count: vipCount,
          campaign_count: campaignCount,
          claim_count: claims.length,
          redeemed_count: redeemedCount,
        },
        readiness_percent: readinessPercent,
      };
    });

    const activePaid = subscriptions.filter(
      (row) => row.status === "active"
    ).length;

    const trials = subscriptions.filter(
      (row) => row.status === "trial"
    ).length;

    const pastDue = subscriptions.filter(
      (row) => row.status === "past_due"
    ).length;

    const canceled = subscriptions.filter(
      (row) => row.status === "canceled"
    ).length;

    const suspended = (restaurants || []).filter(
      (row) => row.admin_suspended
    ).length;

    const mrr = activePaid * 99;

    return NextResponse.json({
      admin_role: adminRow.role,
      summary: {
        total_restaurants: restaurants?.length || 0,
        active_paid: activePaid,
        trials,
        past_due: pastDue,
        canceled,
        suspended,
        estimated_mrr: mrr,
      },
      restaurants: enriched,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load admin overview.",
      },
      { status: 500 }
    );
  }
}
