import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
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
      )}&owner_user_id=eq.${encodeURIComponent(user.id)}&select=id,name`,
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

    const subscriptionResponse = await fetch(
      `${supabaseUrl}/rest/v1/restaurant_subscriptions?restaurant_id=eq.${encodeURIComponent(
        restaurantId
      )}&select=provider_customer_id,status`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!subscriptionResponse.ok) {
      const detail = await subscriptionResponse.text();
      return NextResponse.json(
        { error: detail || "Unable to load subscription." },
        { status: 400 }
      );
    }

    const subscriptions = await subscriptionResponse.json();
    const subscription = Array.isArray(subscriptions)
      ? subscriptions[0]
      : null;

    if (!subscription?.provider_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer is connected to this restaurant yet." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://restaurant-os-mvp.vercel.app";

    const params = new URLSearchParams();
    params.set("customer", subscription.provider_customer_id);
    params.set(
      "return_url",
      `${origin}/owner/billing?restaurant=${encodeURIComponent(restaurantId)}`
    );

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
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
            "Unable to create Stripe billing portal session.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      portal_url: stripeData.url,
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
