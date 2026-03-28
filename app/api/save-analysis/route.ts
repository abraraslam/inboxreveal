import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userEmail,
      gmailMessageId,
      intent,
      priority,
      keywords,
      matchedPhrases,
      reason,
      summary,
      recommendedAction,
    } = body;

    const { error } = await supabase.from("email_analysis").upsert(
      {
        user_email: userEmail,
        gmail_message_id: gmailMessageId,
        intent,
        priority,
        keywords,
        matched_phrases: matchedPhrases || [],
        reason,
        summary: summary || "",
        recommended_action: recommendedAction,
      },
      { onConflict: "user_email,gmail_message_id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save analysis" },
      { status: 500 }
    );
  }
}