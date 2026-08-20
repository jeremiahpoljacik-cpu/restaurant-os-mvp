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

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { user, adminRow, admin } = auth;
    const body = await request.json();

    const restaurantId = String(body.restaurant_id || "");
    const action = String(body.action || "");

    if (!restaurantId || !action) {
      return NextResponse.json(
        { error: "restaurant_id and action are required." },
        { status: 400 }
      );
    }

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id,name,admin_suspended,admin_support_status")
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: restaurantError?.message || "Restaurant not found." },
        { status: 404 }
      );
    }

    if (action === "suspend") {
      if (adminRow.role !== "super_admin") {
        return NextResponse.json(
          { error: "Super Admin permission required." },
          { status: 403 }
        );
      }

      const { error } = await admin
        .from("restaurants")
        .update({
          admin_suspended: true,
          admin_support_status: "suspended",
        })
        .eq("id", restaurantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `${restaurant.name} suspended.`,
      });
    }

    if (action === "reactivate") {
      if (adminRow.role !== "super_admin") {
        return NextResponse.json(
          { error: "Super Admin permission required." },
          { status: 403 }
        );
      }

      const { error } = await admin
        .from("restaurants")
        .update({
          admin_suspended: false,
          admin_support_status: "normal",
        })
        .eq("id", restaurantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `${restaurant.name} reactivated.`,
      });
    }

    if (action === "set_support_status") {
      const allowed = ["normal", "watch", "needs_attention", "suspended"];
      const status = String(body.status || "");

      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: "Invalid support status." },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("restaurants")
        .update({
          admin_support_status: status,
          ...(status === "suspended"
            ? { admin_suspended: true }
            : {}),
        })
        .eq("id", restaurantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `Support status updated to ${status}.`,
      });
    }

    if (action === "extend_trial") {
      if (adminRow.role !== "super_admin") {
        return NextResponse.json(
          { error: "Super Admin permission required." },
          { status: 403 }
        );
      }

      const days = Math.max(1, Math.min(90, Number(body.days || 14)));

      const { data: subscription, error: subscriptionError } = await admin
        .from("restaurant_subscriptions")
        .select("id,status,trial_ends_at")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (subscriptionError || !subscription) {
        return NextResponse.json(
          { error: subscriptionError?.message || "Subscription not found." },
          { status: 404 }
        );
      }

      const base =
        subscription.trial_ends_at &&
        new Date(subscription.trial_ends_at).getTime() > Date.now()
          ? new Date(subscription.trial_ends_at)
          : new Date();

      base.setDate(base.getDate() + days);

      const { error } = await admin
        .from("restaurant_subscriptions")
        .update({
          status: subscription.status === "active" ? "active" : "trial",
          trial_ends_at: base.toISOString(),
        })
        .eq("restaurant_id", restaurantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        trial_ends_at: base.toISOString(),
        message: `Trial extended by ${days} days.`,
      });
    }

    if (action === "add_note") {
      const note = String(body.note || "").trim();

      if (!note) {
        return NextResponse.json(
          { error: "Note cannot be empty." },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("restaurant_admin_notes")
        .insert({
          restaurant_id: restaurantId,
          admin_user_id: user.id,
          note,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Admin note added.",
      });
    }

    return NextResponse.json(
      { error: "Unsupported admin action." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Admin action failed.",
      },
      { status: 500 }
    );
  }
}
