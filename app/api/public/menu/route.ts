import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function canPreviewDraft(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return false;
  }

  const token = authorization.slice(7);

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return false;
  }

  const admin = getAdminClient();

  const { data: adminRow } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  return Boolean(adminRow);
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server configuration is incomplete." },
      { status: 500 }
    );
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim() || "";

  if (!slug) {
    return NextResponse.json(
      { error: "slug is required." },
      { status: 400 }
    );
  }

  try {
    const admin = getAdminClient();

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id,name,slug,phone,address_line_1,city,state,zip")
      .eq("slug", slug)
      .maybeSingle();

    if (restaurantError) {
      return NextResponse.json(
        { error: restaurantError.message },
        { status: 500 }
      );
    }

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    const [
      websiteResult,
      orderingResult,
      categoriesResult,
      itemsResult,
    ] = await Promise.all([
      admin
        .from("restaurant_website_settings")
        .select("published")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle(),

      admin
        .from("restaurant_ordering")
        .select("online_ordering_url")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle(),

      admin
        .from("restaurant_menu_categories")
        .select("id,name,sort_order")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true }),

      admin
        .from("restaurant_menu_items")
        .select(
          "id,category_id,name,description,price,featured,sort_order"
        )
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true }),
    ]);

    if (websiteResult.error) {
      return NextResponse.json(
        { error: websiteResult.error.message },
        { status: 500 }
      );
    }

    if (orderingResult.error) {
      return NextResponse.json(
        { error: orderingResult.error.message },
        { status: 500 }
      );
    }

    if (categoriesResult.error) {
      return NextResponse.json(
        { error: categoriesResult.error.message },
        { status: 500 }
      );
    }

    if (itemsResult.error) {
      return NextResponse.json(
        { error: itemsResult.error.message },
        { status: 500 }
      );
    }

    const published = Boolean(websiteResult.data?.published);

    if (!published) {
      const previewAllowed = await canPreviewDraft(request);

      if (!previewAllowed) {
        return NextResponse.json(
          { error: "Restaurant menu is not published." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        published,
      },
      ordering: orderingResult.data || null,
      categories: categoriesResult.data || [],
      items: itemsResult.data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load restaurant menu.",
      },
      { status: 500 }
    );
  }
}

