import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  getBaseAppUrl,
  getPriceIdForPlan,
  getStripeServerClient,
  isPaidPlanTier,
} from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const appUrl = getBaseAppUrl();

    if (!session?.user?.email) {
      return NextResponse.redirect(`${appUrl}/?login=true`, 303);
    }

    const url = new URL(req.url);
    const requestedPlan = url.searchParams.get("plan");

    if (!isPaidPlanTier(requestedPlan)) {
      return NextResponse.redirect(`${appUrl}/pricing?billing=invalid-plan`, 303);
    }

    const email = session.user.email;
    const stripe = getStripeServerClient();
    const supabase = getSupabaseServerClient({ requireServiceRole: true });

    const existing = await supabase
      .from("user_preferences")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    let customerId = existing.data?.stripe_customer_id?.trim() || "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          email,
        },
      });

      customerId = customer.id;

      const { error: saveError } = await supabase
        .from("user_preferences")
        .upsert(
          {
            email,
            stripe_customer_id: customerId,
          },
          { onConflict: "email" }
        );

      if (saveError) {
        throw saveError;
      }
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: getPriceIdForPlan(requestedPlan),
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/pricing?billing=cancelled`,
      metadata: {
        email,
        requested_plan: requestedPlan,
      },
      subscription_data: {
        metadata: {
          email,
          requested_plan: requestedPlan,
        },
      },
    });

    if (!checkout.url) {
      throw new Error("Stripe checkout did not return a redirect URL.");
    }

    return NextResponse.redirect(checkout.url, 303);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const appUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";
    if (appUrl) {
      return NextResponse.redirect(`${appUrl}/pricing?billing=error`, 303);
    }

    return NextResponse.json(
      {
        error: "Unable to start checkout",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
