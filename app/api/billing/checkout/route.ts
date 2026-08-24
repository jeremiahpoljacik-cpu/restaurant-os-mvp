import { NextRequest, NextResponse } from "next/server";

async function getUser(
  accessToken: string,
  supabaseUrl: string,
  anonKey: string
) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!stripeSecretKey || !supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Billing environment is not configured." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const user = await getUser(accessToken, supabaseUrl, anonKey);

    if (!user?.id) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await request.json();
    const restaurantId = String(body?.restaurant_id || "");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurant_id is required." },
        { status: 400 }
      );
    }

    const restaurantResponse = await fetch(
      `${supabaseUrl}/rest/v1/restaurants?id=eq.${encodeURIComponent(
        restaurantId
      )}&owner_user_id=eq.${encodeURIComponent(user.id)}&select=id,name`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!restaurantResponse.ok) {
      return NextResponse.json(
        { error: "Unable to verify restaurant ownership." },
        { status: 400 }
      );
    }

    const restaurants = await restaurantResponse.json();

    if (!Array.isArray(restaurants) || restaurants.length !== 1) {
      return NextResponse.json(
        { error: "Restaurant not found or access denied." },
        { status: 403 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://restaurant-os-mvp.vercel.app";

    const params = new URLSearchParams();

    params.set("mode", "subscription");
    params.set("allow_promotion_codes", "true");

    params.set("line_items[0][price_data][currency]", "usd");
    params.set(
      "line_items[0][price_data][product_data][name]",
      "Restaurant OS"
    );
    params.set("line_items[0][price_data][unit_amount]", "37500");
    params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set("line_items[0][quantity]", "1");

    params.set(
      "success_url",
      `${origin}/owner/billing?restaurant=${encodeURIComponent(
        restaurantId
      )}&checkout=success`
    );
    params.set(
      "cancel_url",
      `${origin}/owner/billing?restaurant=${encodeURIComponent(
        restaurantId
      )}&checkout=canceled`
    );

    params.set("client_reference_id", restaurantId);
    params.set("metadata[restaurant_id]", restaurantId);
    params.set("metadata[plan]", "restaurant_os");
    params.set(
      "subscription_data[metadata][restaurant_id]",
      restaurantId
    );
    params.set("subscription_data[metadata][plan]", "restaurant_os");

    if (user.email) {
      params.set("customer_email", user.email);
    }

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        cache: "no-store",
      }
    );

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return NextResponse.json(
        {
          error:
            stripeData?.error?.message ||
            "Unable to create Stripe checkout session.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      checkout_url: stripeData.url,
      session_id: stripeData.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected billing error.",
      },
      { status: 500 }
    );
  }
}
