import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const allowedStatuses = new Set([
  "requested",
  "in_design",
  "mockup_sent",
  "approved",
  "installed",
  "declined",
]);

function serviceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function requireAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser(token);

  if (!user) return null;

  const admin = serviceClient();
  const { data: adminRow } = await admin
    .from("platform_admins")
    .select("user_id,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!adminRow) return null;

  return { user, admin };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    if (!auth) {
      return NextResponse.json({ error: "Admin access required." }, { status: 401 });
    }

    const { admin } = auth;

    const { data: requests, error } = await admin
      .from("restaurant_custom_site_requests")
      .select("id,restaurant_id,requested_by,status,notes,requested_at,updated_at,admin_notified")
      .order("requested_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const restaurantIds = Array.from(
      new Set((requests || []).map((row) => row.restaurant_id).filter(Boolean))
    );

    let restaurantMap = new Map<string, any>();

    if (restaurantIds.length) {
      const { data: restaurants, error: restaurantError } = await admin
        .from("restaurants")
        .select("id,name,slug,cuisine_category,phone,city,state,owner_user_id,theme_key,theme_mode")
        .in("id", restaurantIds);

      if (restaurantError) {
        return NextResponse.json({ error: restaurantError.message }, { status: 500 });
      }

      restaurantMap = new Map(
        (restaurants || []).map((restaurant) => [restaurant.id, restaurant])
      );
    }

    return NextResponse.json({
      requests: (requests || []).map((row) => ({
        ...row,
        restaurant: restaurantMap.get(row.restaurant_id) || null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load custom site requests." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    if (!auth) {
      return NextResponse.json({ error: "Admin access required." }, { status: 401 });
    }

    const { admin } = auth;
    const body = await request.json();

    const id = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();

    if (!id || !allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Valid request ID and status are required." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("restaurant_custom_site_requests")
      .update({
        status,
        admin_notified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,restaurant_id,status,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, request: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update custom site request." },
      { status: 500 }
    );
  }
}
