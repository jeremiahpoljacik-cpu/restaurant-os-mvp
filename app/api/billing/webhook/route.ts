import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
) {
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestampPart || signatures.length === 0) return false;

  const timestamp = timestampPart.slice(2);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expected, "hex")
      );
    } catch {
      return false;
    }
  });
}

async function stripeRequest(secretKey: string, path: string) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Stripe request failed.");
  }

  return data;
}

function mapStripeStatus(status: string) {
  switch (status) {
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
    case "incomplete":
      return "incomplete";
    default:
      return "paused";
  }
}

async function upsertSubscription({
  supabaseUrl,
  serviceRoleKey,
  restaurantId,
  customerId,
  subscriptionId,
  status,
  periodEnd,
  trialEnd,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  restaurantId: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: string;
  periodEnd: string | null;
  trialEnd: string | null;
}) {
  const payload = {
    plan: "restaurant_os",
    provider: "stripe",
    provider_customer_id: customerId,
    provider_subscription_id: subscriptionId,
    status,
    current_period_end: periodEnd,
    trial_ends_at: trialEnd,
    updated_at: new Date().toISOString(),
  };

  const patchResponse = await fetch(
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
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (!patchResponse.ok) {
    throw new Error(
      (await patchResponse.text()) || "Subscription update failed."
    );
  }

  const rows = await patchResponse.json();

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
        ...payload,
      }),
      cache: "no-store",
    }
  );

  if (!insertResponse.ok) {
    throw new Error(
      (await insertResponse.text()) || "Subscription insert failed."
    );
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

    if (
      !signature ||
      !verifyStripeSignature(rawBody, signature, stripeWebhookSecret)
    ) {
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

    if (
      type === "checkout.session.completed" &&
      object.mode === "subscription"
    ) {
      const restaurantId =
        object.metadata?.restaurant_id || object.client_reference_id;

      const subscriptionId =
        typeof object.subscription === "string"
          ? object.subscription
          : object.subscription?.id;

      if (restaurantId && subscriptionId) {
        const subscription = await stripeRequest(
          stripeSecretKey,
          `subscriptions/${subscriptionId}`
        );

        await upsertSubscription({
          supabaseUrl,
          serviceRoleKey,
          restaurantId,
          customerId:
            typeof object.customer === "string"
              ? object.customer
              : object.customer?.id || null,
          subscriptionId: subscription.id,
          status: mapStripeStatus(subscription.status),
          periodEnd: subscription.current_period_end
            ? new Date(
                subscription.current_period_end * 1000
              ).toISOString()
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        });
      }
    }

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      const subscription = object;
      const restaurantId = subscription.metadata?.restaurant_id;

      if (restaurantId) {
        await upsertSubscription({
          supabaseUrl,
          serviceRoleKey,
          restaurantId,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id || null,
          subscriptionId: subscription.id,
          status: mapStripeStatus(subscription.status),
          periodEnd: subscription.current_period_end
            ? new Date(
                subscription.current_period_end * 1000
              ).toISOString()
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        });
      }
    }

    if (
      type === "invoice.payment_failed" ||
      type === "invoice.payment_action_required"
    ) {
      const subscriptionId =
        typeof object.subscription === "string"
          ? object.subscription
          : object.subscription?.id;

      if (subscriptionId) {
        const subscription = await stripeRequest(
          stripeSecretKey,
          `subscriptions/${subscriptionId}`
        );

        const restaurantId = subscription.metadata?.restaurant_id;

        if (restaurantId) {
          await upsertSubscription({
            supabaseUrl,
            serviceRoleKey,
            restaurantId,
            customerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer?.id || null,
            subscriptionId: subscription.id,
            status: "past_due",
            periodEnd: subscription.current_period_end
              ? new Date(
                  subscription.current_period_end * 1000
                ).toISOString()
              : null,
            trialEnd: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
