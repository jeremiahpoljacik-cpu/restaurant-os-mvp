import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return { ok: false as const, status: 401, error: "Missing authorization token." };
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
    return { ok: false as const, status: 401, error: "Invalid session." };
  }

  const admin = serviceClient();

  const { data: adminRow, error: adminError } = await admin
    .from("platform_admins")
    .select("user_id,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !adminRow) {
    return { ok: false as const, status: 403, error: "Admin access required." };
  }

  return { ok: true as const, admin, user, adminRow };
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePrice(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeProfile(profile: Record<string, unknown>) {
  const allowed = [
    "name",
    "phone",
    "address_line_1",
    "city",
    "state",
    "zip",
    "cuisine_category",
    "hours",
  ];

  const result: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in profile) result[key] = profile[key];
  }

  return result;
}

type MenuRow = {
  category: string;
  name: string;
  description?: string;
  price?: number | null;
};

async function previewProfile(
  restaurantId: string,
  googleQuery: string,
  admin: ReturnType<typeof serviceClient>
) {
  const { data: restaurant, error } = await admin
    .from("restaurants")
    .select("id,name,phone,address_line_1,city,state,zip,cuisine_category")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error || !restaurant) {
    throw new Error(error?.message || "Restaurant not found.");
  }

  const { data: hours } = await admin
    .from("restaurant_hours")
    .select("monday,tuesday,wednesday,thursday,friday,saturday,sunday")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  /*
    MVP behavior:
    We return the best-known structured profile already stored in Restaurant OS.
    The UI is designed so we can later swap this server block for a true Google
    Business/Places lookup without changing the admin workflow.

    This prevents pretending we fetched live Google data when no Google API key
    or connector has been configured for this standalone Restaurant OS project.
  */

  return {
    source: "restaurant_os_current_profile",
    query: googleQuery,
    profile: {
      name: restaurant.name || "",
      phone: restaurant.phone || "",
      address_line_1: restaurant.address_line_1 || "",
      city: restaurant.city || "",
      state: restaurant.state || "",
      zip: restaurant.zip || "",
      cuisine_category: restaurant.cuisine_category || "",
      hours: hours || null,
    },
    warning:
      "Live Google Business import is not connected yet. This preview is showing the current Restaurant OS profile so the review/apply workflow can be tested safely.",
  };
}

async function previewMenu(
  restaurantId: string,
  menuSourceUrl: string,
  admin: ReturnType<typeof serviceClient>
) {
  const [categoriesResult, itemsResult] = await Promise.all([
    admin
      .from("restaurant_menu_categories")
      .select("id,name,sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),

    admin
      .from("restaurant_menu_items")
      .select("id,category_id,name,description,price,sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
  ]);

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message);
  }

  if (itemsResult.error) {
    throw new Error(itemsResult.error.message);
  }

  const categoryMap = new Map<string, string>(
    (categoriesResult.data || []).map((row) => [row.id, row.name])
  );

  const menu = (itemsResult.data || []).map((item) => ({
    category: item.category_id
      ? categoryMap.get(item.category_id) || "Uncategorized"
      : "Uncategorized",
    name: item.name,
    description: item.description || "",
    price: item.price === null ? null : Number(item.price),
  }));

  /*
    MVP behavior:
    Return the structured menu currently in Restaurant OS.
    Later this can be replaced with a source-specific scraper/import connector
    for DoorDash/Uber/menu feeds while keeping the same review/apply contract.
  */

  return {
    source: "restaurant_os_current_menu",
    menu_source_url: menuSourceUrl,
    menu,
    warning:
      "Live menu-source scraping is not connected yet. This preview is showing the current Restaurant OS menu so the review/apply workflow can be tested safely.",
  };
}

async function applyProfile(
  restaurantId: string,
  profile: Record<string, unknown>,
  admin: ReturnType<typeof serviceClient>
) {
  const normalized = normalizeProfile(profile);

  const restaurantUpdate: Record<string, unknown> = {};

  for (const key of [
    "name",
    "phone",
    "address_line_1",
    "city",
    "state",
    "zip",
    "cuisine_category",
  ]) {
    if (key in normalized) {
      restaurantUpdate[key] =
        typeof normalized[key] === "string"
          ? cleanText(normalized[key])
          : normalized[key];
    }
  }

  if (Object.keys(restaurantUpdate).length > 0) {
    const { error } = await admin
      .from("restaurants")
      .update(restaurantUpdate)
      .eq("id", restaurantId);

    if (error) throw new Error(error.message);
  }

  if (normalized.hours && typeof normalized.hours === "object") {
    const hours = normalized.hours as Record<string, unknown>;

    const payload = {
      restaurant_id: restaurantId,
      monday: cleanText(hours.monday) || null,
      tuesday: cleanText(hours.tuesday) || null,
      wednesday: cleanText(hours.wednesday) || null,
      thursday: cleanText(hours.thursday) || null,
      friday: cleanText(hours.friday) || null,
      saturday: cleanText(hours.saturday) || null,
      sunday: cleanText(hours.sunday) || null,
    };

    const { error } = await admin
      .from("restaurant_hours")
      .upsert(payload, { onConflict: "restaurant_id" });

    if (error) throw new Error(error.message);
  }
}

async function replaceMenu(
  restaurantId: string,
  rows: MenuRow[],
  admin: ReturnType<typeof serviceClient>
) {
  if (!rows.length) return;

  const normalizedRows = rows
    .map((row) => ({
      category: cleanText(row.category) || "Uncategorized",
      name: cleanText(row.name),
      description: cleanText(row.description),
      price: normalizePrice(row.price),
    }))
    .filter((row) => row.name);

  if (!normalizedRows.length) return;

  const categories = Array.from(
    new Set(normalizedRows.map((row) => row.category))
  );

  const { error: deleteItemsError } = await admin
    .from("restaurant_menu_items")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (deleteItemsError) throw new Error(deleteItemsError.message);

  const { error: deleteCategoriesError } = await admin
    .from("restaurant_menu_categories")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (deleteCategoriesError) throw new Error(deleteCategoriesError.message);

  const categoryRows = categories.map((name, index) => ({
    restaurant_id: restaurantId,
    name,
    sort_order: (index + 1) * 10,
  }));

  const { data: createdCategories, error: categoryError } = await admin
    .from("restaurant_menu_categories")
    .insert(categoryRows)
    .select("id,name");

  if (categoryError) throw new Error(categoryError.message);

  const categoryMap = new Map<string, string>(
    (createdCategories || []).map((row) => [row.name, row.id])
  );

  const counters = new Map<string, number>();

  const itemRows = normalizedRows.map((row) => {
    const next = (counters.get(row.category) || 0) + 1;
    counters.set(row.category, next);

    return {
      restaurant_id: restaurantId,
      category_id: categoryMap.get(row.category) || null,
      name: row.name,
      description: row.description || null,
      price: row.price,
      featured: false,
      sort_order: next * 10,
    };
  });

  const { error: itemsError } = await admin
    .from("restaurant_menu_items")
    .insert(itemRows);

  if (itemsError) throw new Error(itemsError.message);
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server environment variables are not configured." },
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

    const { admin, user } = auth;
    const body = await request.json();

    const restaurantId = cleanText(body.restaurant_id);
    const action = cleanText(body.action);

    if (!restaurantId || !action) {
      return NextResponse.json(
        { error: "restaurant_id and action are required." },
        { status: 400 }
      );
    }

    if (action === "preview_profile") {
      const result = await previewProfile(
        restaurantId,
        cleanText(body.google_query),
        admin
      );

      return NextResponse.json(result);
    }

    if (action === "preview_menu") {
      const result = await previewMenu(
        restaurantId,
        cleanText(body.menu_source_url),
        admin
      );

      return NextResponse.json(result);
    }

    if (action === "apply") {
      const profile =
        body.profile && typeof body.profile === "object"
          ? (body.profile as Record<string, unknown>)
          : {};

      const menu = Array.isArray(body.menu)
        ? (body.menu as MenuRow[])
        : [];

      await applyProfile(restaurantId, profile, admin);

      if (menu.length > 0) {
        await replaceMenu(restaurantId, menu, admin);
      }

      const summary = [
        Object.keys(profile).length > 0
          ? `profile fields: ${Object.keys(profile).length}`
          : null,
        menu.length > 0 ? `menu items: ${menu.length}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      const { error: noteError } = await admin
        .from("restaurant_admin_notes")
        .insert({
          restaurant_id: restaurantId,
          admin_user_id: user.id,
          note: `Super Admin import applied${summary ? ` (${summary})` : ""}.`,
        });

      if (noteError) {
        return NextResponse.json(
          {
            error: `Changes were applied, but admin note failed: ${noteError.message}`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Approved import changes were applied to Restaurant OS.",
      });
    }

    return NextResponse.json(
      { error: "Unknown import action." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Restaurant import failed.",
      },
      { status: 500 }
    );
  }
}
