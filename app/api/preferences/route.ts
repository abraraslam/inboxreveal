import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, keywords, alertUrgent, alertComplaint, alertSales } = body;

    const { error } = await supabase.from("user_preferences").upsert(
      {
        email,
        keywords,
        alert_urgent: alertUrgent,
        alert_complaint: alertComplaint,
        alert_sales: alertSales,
      },
      { onConflict: "email" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save preferences" },
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load preferences" },
      { status: 500 }
    );
  }
}