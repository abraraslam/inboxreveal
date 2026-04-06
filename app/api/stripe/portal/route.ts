import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getBaseAppUrl, getStripeServerClient } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const appUrl = getBaseAppUrl();

    if (!session?.user?.email) {
      return NextResponse.redirect(`${appUrl}/?login=true`, 303);
    }

    const email = session.user.email;
    const supabase = getSupabaseServerClient({ requireServiceRole: true });

    const { data, error } = await supabase
      .from("user_preferences")
      .select("stripe_customer_id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const customerId = data?.stripe_customer_id?.trim() || "";

    if (!customerId) {
      return NextResponse.redirect(`${appUrl}/pricing?billing=no-customer`, 303);
    }

    const stripe = getStripeServerClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard?billing=portal-return`,
    });

    if (!portal.url) {
      throw new Error("Stripe portal did not return a redirect URL.");
    }

    return NextResponse.redirect(portal.url, 303);
  } catch (error) {
    console.error("Stripe portal error:", error);

    return NextResponse.json(
      {
        error: "Unable to open billing portal",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
