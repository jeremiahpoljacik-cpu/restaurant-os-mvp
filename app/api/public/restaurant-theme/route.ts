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

async function isPlatformAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return false;

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
  } = await userClient.auth.getUser(token);

  if (!user) return false;

  const admin = serviceClient();

  const { data } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: NextRequest) {
  try {
    const slug = (request.nextUrl.searchParams.get("slug") || "").trim();

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const admin = serviceClient();

    const { data: restaurant, error } = await admin
      .from("restaurants")
      .select("id,name,slug,theme_key,theme_mode")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    const { data: website } = await admin
      .from("restaurant_website_settings")
      .select("published")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    const published = Boolean(website?.published);

    // Public visitors only get published restaurants.
    // Logged-in platform admins may preview draft migrations safely.
    if (!published) {
      const adminPreview = await isPlatformAdmin(request);

      if (!adminPreview) {
        return NextResponse.json(
          { error: "Restaurant site is not published." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        published,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to resolve restaurant.",
      },
      { status: 500 }
    );
  }
}
