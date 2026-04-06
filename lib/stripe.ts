import Stripe from "stripe";

export type PaidPlanTier = "premium" | "gold";

let stripeClient: Stripe | null = null;

function isConfigured(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !/your_|placeholder|replace_me/i.test(trimmed);
}

export function getStripeServerClient() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!isConfigured(key)) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key!.trim());
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!isConfigured(secret)) {
    throw new Error("Stripe webhook is not configured. Set STRIPE_WEBHOOK_SECRET.");
  }

  return secret!.trim();
}

export function getBaseAppUrl() {
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!isConfigured(url)) {
    throw new Error("App URL is not configured. Set NEXTAUTH_URL.");
  }

  return url!.trim().replace(/\/$/, "");
}

export function isPaidPlanTier(value: unknown): value is PaidPlanTier {
  return value === "premium" || value === "gold";
}

export function getPriceIdForPlan(plan: PaidPlanTier) {
  if (plan === "premium") {
    const value = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
    if (!isConfigured(value)) {
      throw new Error("Set STRIPE_PRICE_PREMIUM_MONTHLY in environment variables.");
    }
    return value!.trim();
  }

  const value = process.env.STRIPE_PRICE_GOLD_MONTHLY;
  if (!isConfigured(value)) {
    throw new Error("Set STRIPE_PRICE_GOLD_MONTHLY in environment variables.");
  }
  return value!.trim();
}

export function getPlanForPriceId(priceId: string | null | undefined): PaidPlanTier | null {
  const normalized = String(priceId || "").trim();
  if (!normalized) return null;

  const premium = process.env.STRIPE_PRICE_PREMIUM_MONTHLY?.trim();
  const gold = process.env.STRIPE_PRICE_GOLD_MONTHLY?.trim();

  if (premium && normalized === premium) return "premium";
  if (gold && normalized === gold) return "gold";
  return null;
}
