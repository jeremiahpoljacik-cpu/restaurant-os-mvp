import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function parseStripeSignature(header: string) {
  const parts = header.split(",");
  const parsed: Record<string, string[]> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    parsed[key] = parsed[key] || [];
    parsed[key].push(value);
  }

  return parsed;
}

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  endpointSecret: string
) {
  const parsed = parseStripeSignature(signatureHeader);
  const timestamp = parsed.t?.[0];
  const signatures = parsed.v1 || [];

  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", endpointSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const now = Math.floor(Date.now() / 1000);
  const age = Math.abs(now - Number(timestamp));

  if (!Number.isFinite(age) || age > 300) return false;

  return signatures.some((signature) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  });
}

async function stripeRequest(
  stripeSecretKey: string,
  path: string
) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || `Stripe request failed for ${path}`
    );
  }

  return data;
}

async function upsertSubscriptionRecord({
  supabaseUrl,
  serviceRoleKey,
  restaurantId,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
  currentPeriodEnd,
  trialEndsAt,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  restaurantId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
}) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/restaurant_subscriptions?restaurant_id=eq.${encodeURIComponent(
      restaurantId
    )}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        provider: "stripe",
        provider_customer_id: stripeCustomerId,
        provider_subscription_id: stripeSubscriptionId,
        status,
        current_period_end: currentPeriodEnd,
        trial_ends_at: trialEndsAt,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to update Restaurant OS subscription.");
  }

  const rows = await response.json();

  if (Array.isArray(rows) && rows.length > 0) {
    return;
  }

  const insertResponse = await fetch(
    `${supabaseUrl}/rest/v1/restaurant_subscriptions`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        plan: "founder",
        provider: "stripe",
        provider_customer_id: stripeCustomerId,
        provider_subscription_id: stripeSubscriptionId,
        status,
        current_period_end: currentPeriodEnd,
        trial_ends_at: trialEndsAt,
      }),
      cache: "no-store",
    }
  );

  if (!insertResponse.ok) {
    const detail = await insertResponse.text();
    throw new Error(detail || "Failed to create Restaurant OS subscription.");
  }
}

function mapStripeStatus(stripeStatus: string) {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trial";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "paused":
      return "paused";
    default:
      return "paused";
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !stripeSecretKey ||
      !stripeWebhookSecret ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        { error: "Webhook environment variables are not configured." },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const valid = verifyStripeSignature(
      rawBody,
      signature,
      stripeWebhookSecret
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid Stripe signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const type = event.type;
    const object = event.data?.object;

    if (!type || !object) {
      return NextResponse.json({ received: true });
    }

    if (type === "checkout.session.completed") {
      const session = object;

      if (session.mode !== "subscription") {
        return NextResponse.json({ received: true });
      }

      const restaurantId =
        session.metadata?.restaurant_id || session.client_reference_id;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!restaurantId || !subscriptionId) {
        return NextResponse.json({ received: true });
      }

      const subscription = await stripeRequest(
        stripeSecretKey,
        `subscriptions/${subscriptionId}`
      );

      await upsertSubscriptionRecord({
        supabaseUrl,
        serviceRoleKey,
        restaurantId,
        stripeCustomerId:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null,
        stripeSubscriptionId: subscription.id,
        status: mapStripeStatus(subscription.status),
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      });
    }

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      const subscription = object;
      const restaurantId = subscription.metadata?.restaurant_id;

      if (!restaurantId) {
        return NextResponse.json({ received: true });
      }

      await upsertSubscriptionRecord({
        supabaseUrl,
        serviceRoleKey,
        restaurantId,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id || null,
        stripeSubscriptionId: subscription.id,
        status: mapStripeStatus(subscription.status),
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      });
    }

    if (
      type === "invoice.payment_failed" ||
      type === "invoice.payment_action_required"
    ) {
      const invoice = object;
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!subscriptionId) {
        return NextResponse.json({ received: true });
      }

      const subscription = await stripeRequest(
        stripeSecretKey,
        `subscriptions/${subscriptionId}`
      );

      const restaurantId = subscription.metadata?.restaurant_id;

      if (!restaurantId) {
        return NextResponse.json({ received: true });
      }

      await upsertSubscriptionRecord({
        supabaseUrl,
        serviceRoleKey,
        restaurantId,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id || null,
        stripeSubscriptionId: subscription.id,
        status: "past_due",
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected webhook error.",
      },
      { status: 500 }
    );
  }
}
