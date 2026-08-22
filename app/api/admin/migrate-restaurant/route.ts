import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type ListedAuthUser = {
  id: string;
  email?: string | null;
};

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
    return { error: "Missing authorization token.", status: 401 } as const;
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
    return { error: "Invalid session.", status: 401 } as const;
  }

  const admin = serviceClient();

  const { data: adminRow, error: adminError } = await admin
    .from("platform_admins")
    .select("user_id,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !adminRow) {
    return { error: "Admin access required.", status: 403 } as const;
  }

  return { user, adminRow, admin } as const;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .replace(/\.+$/, "");
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Migration API environment variables are not configured." },
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

    const { user: adminUser, admin } = auth;
    const body = await request.json();

    const restaurantName = String(body.restaurant_name || "").trim();
    const ownerEmail = String(body.owner_email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const addressLine1 = String(body.address_line_1 || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zip = String(body.zip || "").trim();
    const cuisineCategory = String(body.cuisine_category || "").trim();
    const currentWebsiteUrl = String(body.current_website_url || "").trim();
    const customDomain = String(body.custom_domain || "").trim();
    const onlineOrderingUrl = String(body.online_ordering_url || "").trim();
    const cateringEmail = String(body.catering_email || "").trim();
    const notes = String(body.notes || "").trim();

    if (!restaurantName || !ownerEmail) {
      return NextResponse.json(
        { error: "Restaurant name and owner email are required." },
        { status: 400 }
      );
    }

    // Find an existing auth user by email.
    const { data: usersPage, error: usersError } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    // Explicit cast avoids a Supabase/Next TypeScript inference issue that can
    // incorrectly infer the callback candidate as `never` during Vercel builds.
    const authUsers = (usersPage?.users || []) as unknown as ListedAuthUser[];

    const existingUser = authUsers.find(
      (candidate) =>
        (candidate.email || "").trim().toLowerCase() === ownerEmail
    );

    let ownerUserId = existingUser?.id || null;
    let temporaryPassword: string | null = null;
    let createdOwner = false;

    if (!ownerUserId) {
      temporaryPassword = `ROS-${crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 14)}!`;

      const { data: createdUser, error: createUserError } =
        await admin.auth.admin.createUser({
          email: ownerEmail,
          password: temporaryPassword,
          email_confirm: true,
        });

      if (createUserError || !createdUser.user) {
        return NextResponse.json(
          {
            error:
              createUserError?.message ||
              "Unable to create owner account.",
          },
          { status: 500 }
        );
      }

      ownerUserId = createdUser.user.id;
      createdOwner = true;
    }

    const baseSlug = slugify(restaurantName) || "restaurant";
    let slug = baseSlug;

    for (let attempt = 0; attempt < 20; attempt++) {
      const { data: slugMatch, error: slugError } = await admin
        .from("restaurants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugError) {
        return NextResponse.json(
          { error: slugError.message },
          { status: 500 }
        );
      }

      if (!slugMatch) break;
      slug = `${baseSlug}-${attempt + 2}`;
    }

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .insert({
        owner_user_id: ownerUserId,
        name: restaurantName,
        slug,
        cuisine_category: cuisineCategory || null,
        phone: phone || null,
        address_line_1: addressLine1 || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        status: "draft",
        admin_suspended: false,
        admin_support_status: "needs_attention",
      })
      .select("id,name,slug")
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: restaurantError?.message || "Unable to create restaurant." },
        { status: 500 }
      );
    }

    const restaurantId = restaurant.id;

    const [
      brandingResult,
      websiteResult,
      orderingResult,
      growthResult,
      subscriptionResult,
    ] = await Promise.all([
      admin.from("restaurant_branding").insert({
        restaurant_id: restaurantId,
        tagline: "",
        short_description: "",
      }),

      admin.from("restaurant_website_settings").insert({
        restaurant_id: restaurantId,
        published: false,
        show_menu: true,
        show_vip: true,
        about_title: "",
        about_body: "",
      }),

      admin.from("restaurant_ordering").insert({
        restaurant_id: restaurantId,
        online_ordering_url: onlineOrderingUrl || null,
        catering_email: cateringEmail || null,
      }),

      admin.from("restaurant_growth_settings").insert({
        restaurant_id: restaurantId,
        vip_club_name: "VIP Club",
        signup_offer: "",
      }),

      admin.from("restaurant_subscriptions").insert({
        restaurant_id: restaurantId,
        plan: "founder",
        status: "trial",
        trial_ends_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
    ]);

    const seedErrors = [
      brandingResult.error,
      websiteResult.error,
      orderingResult.error,
      growthResult.error,
      subscriptionResult.error,
    ].filter(Boolean);

    if (seedErrors.length > 0) {
      return NextResponse.json(
        {
          error: `Restaurant created, but starter setup failed: ${
            seedErrors[0]?.message || "Unknown seed error"
          }`,
          restaurant_id: restaurantId,
        },
        { status: 500 }
      );
    }

    if (customDomain) {
      const normalizedDomain = normalizeDomain(customDomain);

      const { error: domainError } = await admin
        .from("restaurant_domains")
        .insert({
          restaurant_id: restaurantId,
          domain: normalizedDomain,
          is_primary: true,
          verification_status: "pending",
          dns_status: "pending",
          ssl_status: "pending",
          provider: "vercel",
        });

      if (domainError) {
        return NextResponse.json(
          {
            error: `Restaurant created, but domain staging failed: ${domainError.message}`,
            restaurant_id: restaurantId,
          },
          { status: 500 }
        );
      }
    }

    const migrationNoteParts = [
      "Existing restaurant migration created.",
      currentWebsiteUrl ? `Current website: ${currentWebsiteUrl}` : null,
      customDomain ? `Custom domain: ${normalizeDomain(customDomain)}` : null,
      onlineOrderingUrl ? `Online ordering: ${onlineOrderingUrl}` : null,
      notes ? `Migration notes: ${notes}` : null,
    ].filter((value): value is string => Boolean(value));

    const { error: noteError } = await admin
      .from("restaurant_admin_notes")
      .insert({
        restaurant_id: restaurantId,
        admin_user_id: adminUser.id,
        note: migrationNoteParts.join("\n"),
      });

    if (noteError) {
      return NextResponse.json(
        {
          error: `Restaurant created, but migration note failed: ${noteError.message}`,
          restaurant_id: restaurantId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      restaurant_id: restaurantId,
      restaurant_slug: restaurant.slug,
      owner_user_id: ownerUserId,
      owner_created: createdOwner,
      temporary_password: temporaryPassword,
      message: createdOwner
        ? `${restaurant.name} created. Owner login was created with a temporary password.`
        : `${restaurant.name} created and linked to the existing owner account.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create restaurant migration.",
      },
      { status: 500 }
    );
  }
}
