import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      keywords,
      alertUrgent,
      alertComplaint,
      alertSales,
      hidePreferencesPrompt,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const payload = {
      email,
      keywords,
      alert_urgent: alertUrgent,
      alert_complaint: alertComplaint,
      alert_sales: alertSales,
      hide_preferences_prompt: Boolean(hidePreferencesPrompt),
    };

    let { error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "email" });

    // Support databases that have not run the hide_preferences_prompt migration yet.
    if (error && /hide_preferences_prompt/i.test(error.message || "")) {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

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
