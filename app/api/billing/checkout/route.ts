import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_FOUNDER_PRICE_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!stripeSecretKey || !stripePriceId || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Billing environment variables are not configured." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const accessToken = authHeader.slice(7).trim();

    const body = await request.json();
    const restaurantId = String(body?.restaurant_id || "").trim();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await userResponse.json();

    const restaurantResponse = await fetch(
      `${supabaseUrl}/rest/v1/restaurants?id=eq.${encodeURIComponent(
        restaurantId
      )}&owner_user_id=eq.${encodeURIComponent(
        user.id
      )}&select=id,name,owner_user_id`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!restaurantResponse.ok) {
      const detail = await restaurantResponse.text();
      return NextResponse.json(
        { error: detail || "Unable to verify restaurant ownership." },
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
    params.set("line_items[0][price]", stripePriceId);
    params.set("line_items[0][quantity]", "1");

    // Allow internal/customer promotion codes at Stripe Checkout.
    params.set("allow_promotion_codes", "true");

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
    params.set("subscription_data[metadata][restaurant_id]", restaurantId);

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
          error instanceof Error ? error.message : "Unexpected billing error.",
      },
      { status: 500 }
    );
  }
}
