import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function adminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function authenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
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

  return user || null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const form = await request.formData();
    const restaurantId = String(form.get("restaurant_id") || "");
    const kind = String(form.get("kind") || "gallery");
    const file = form.get("file");

    if (!restaurantId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Restaurant and image are required." },
        { status: 400 }
      );
    }

    if (!["gallery", "logo", "hero"].includes(kind)) {
      return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be smaller than 8 MB." }, { status: 400 });
    }

    const admin = adminClient();

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("id,owner_user_id")
      .eq("id", restaurantId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "You do not own this restaurant." },
        { status: 403 }
      );
    }

    const originalExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = originalExtension.replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${restaurantId}/${kind}-${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("restaurant-assets")
      .upload(path, bytes, {
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const publicUrl = admin.storage
      .from("restaurant-assets")
      .getPublicUrl(path).data.publicUrl;

    if (kind === "logo" || kind === "hero") {
      const column = kind === "logo" ? "logo_url" : "hero_image_url";

      const { data: existing } = await admin
        .from("restaurant_website_settings")
        .select("restaurant_id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (existing) {
        const { error } = await admin
          .from("restaurant_website_settings")
          .update({
            [column]: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("restaurant_id", restaurantId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        const { error } = await admin
          .from("restaurant_website_settings")
          .insert({
            restaurant_id: restaurantId,
            [column]: publicUrl,
            published: false,
          });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true, publicUrl, kind });
    }

    const { count } = await admin
      .from("restaurant_site_images")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId);

    const { data: row, error: insertError } = await admin
      .from("restaurant_site_images")
      .insert({
        restaurant_id: restaurantId,
        image_url: publicUrl,
        image_type: "gallery",
        sort_order: count || 0,
        active: true,
      })
      .select("id,image_url,image_type,caption,sort_order")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, publicUrl, kind, image: row });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to upload image.",
      },
      { status: 500 }
    );
  }
}
