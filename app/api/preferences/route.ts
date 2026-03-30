import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { normalizePlanTier } from "@/lib/plans";

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      keywords,
      alertUrgent,
      alertComplaint,
      alertSales,
      hidePreferencesPrompt,
      planTier,
    } = body;

    const email = session.user.email;

    const safeKeywords = Array.isArray(keywords)
      ? keywords
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 25)
      : [];

    const payload = {
      email,
      keywords: safeKeywords,
      alert_urgent: Boolean(alertUrgent),
      alert_complaint: Boolean(alertComplaint),
      alert_sales: Boolean(alertSales),
      hide_preferences_prompt: Boolean(hidePreferencesPrompt),
      plan_tier: normalizePlanTier(planTier),
    };

    let { error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "email" });

    // Support databases that have not run one or more preference migrations yet.
    if (
      error &&
      /hide_preferences_prompt|plan_tier/i.test(error.message || "")
    ) {
      ({ error } = await supabase.from("user_preferences").upsert(
        {
          email,
          keywords,
          alert_urgent: alertUrgent,
          alert_complaint: alertComplaint,
          alert_sales: alertSales,
        },
        { onConflict: "email" }
      ));
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Failed to save preferences") },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(data || null);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Failed to load preferences") },
      { status: 500 }
    );
  }
}
