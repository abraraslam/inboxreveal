import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      gmailMessageId,
      intent,
      priority,
      keywords,
      matchedPhrases,
      reason,
      summary,
      recommendedAction,
    } = body;

    if (typeof gmailMessageId !== "string" || !gmailMessageId.trim()) {
      return NextResponse.json(
        { error: "Missing gmail message id" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("email_analysis").upsert(
      {
        user_email: session.user.email,
        gmail_message_id: gmailMessageId.trim(),
        intent,
        priority,
        keywords: Array.isArray(keywords) ? keywords : [],
        matched_phrases: Array.isArray(matchedPhrases) ? matchedPhrases : [],
        reason,
        summary: summary || "",
        recommended_action: recommendedAction,
      },
      { onConflict: "user_email,gmail_message_id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Failed to save analysis",
      },
      { status: 500 }
    );
  }
}