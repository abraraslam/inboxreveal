import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  getPlanForPriceId,
  getStripeServerClient,
  getStripeWebhookSecret,
} from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const body = await req.text();
    const stripe = getStripeServerClient();
    const webhookSecret = getStripeWebhookSecret();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid webhook signature",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        await syncCheckoutSession(checkout);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription) {
  const firstPriceId = subscription.items.data[0]?.price?.id;
  const mappedPlan = getPlanForPriceId(firstPriceId);

  if (!mappedPlan) {
    return "basic" as const;
  }

  // Basic is always available: if subscription is not active/trialing,
  // user falls back to Basic.
  if (subscription.status === "active" || subscription.status === "trialing") {
    return mappedPlan;
  }

  return "basic" as const;
}

async function syncCheckoutSession(checkout: Stripe.Checkout.Session) {
  const mode = checkout.mode;
  if (mode !== "subscription") return;

  const customerId =
    typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id;
  const subscriptionId =
    typeof checkout.subscription === "string"
      ? checkout.subscription
      : checkout.subscription?.id;
  const email = checkout.customer_details?.email || checkout.metadata?.email || "";

  if (!email) {
    return;
  }

  const supabase = getSupabaseServerClient({ requireServiceRole: true });

  const { error } = await supabase.from("user_preferences").upsert(
    {
      email,
      plan_tier: "basic",
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      subscription_status: "checkout_completed",
    },
    { onConflict: "email" }
  );

  if (error) {
    throw error;
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return;

  const planTier = resolvePlanFromSubscription(subscription);
  const periodEndIso = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const supabase = getSupabaseServerClient({ requireServiceRole: true });

  const { error } = await supabase
    .from("user_preferences")
    .update({
      plan_tier: planTier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: periodEndIso,
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    throw error;
  }
}
