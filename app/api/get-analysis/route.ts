import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idsParam = req.nextUrl.searchParams.get("ids");

    const messageIds = (idsParam || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 100);

    if (messageIds.length === 0) {
      return NextResponse.json({
        analysis: {},
        totalReturned: 0,
      });
    }

    let data: Array<{
      message_id?: string | null;
      gmail_message_id?: string | null;
      intent?: string | null;
      priority?: string | null;
      keywords?: unknown;
      matched_phrases?: unknown;
      reason?: string | null;
      summary?: string | null;
      recommended_action?: string | null;
      should_alert?: boolean | null;
      alert_reason?: string | null;
    }> | null = null;

    let error: Error | null = null;

    const scopedResult = await supabase
      .from("email_analysis")
      .select(
        `
        gmail_message_id,
        intent,
        priority,
        keywords,
        matched_phrases,
        reason,
        summary,
        recommended_action,
        should_alert,
        alert_reason
      `
      )
      .eq("user_email", session.user.email)
      .in("gmail_message_id", messageIds);

    if (scopedResult.error && /user_email|gmail_message_id/i.test(scopedResult.error.message || "")) {
      const legacyResult = await supabase
        .from("email_analysis")
        .select(
          `
          message_id,
          intent,
          priority,
          keywords,
          matched_phrases,
          reason,
          summary,
          recommended_action,
          should_alert,
          alert_reason
        `
        )
        .in("message_id", messageIds);

      data = legacyResult.data;
      error = legacyResult.error;
    } else {
      data = scopedResult.data;
      error = scopedResult.error;
    }

    if (error) {
      throw error;
    }

    const analysisByMessageId = (data || []).reduce<
      Record<
        string,
        {
          intent: string;
          priority: string;
          keywords: string[];
          matchedPhrases: string[];
          reason: string;
          summary: string;
          recommendedAction: string;
          shouldAlert: boolean;
          alertReason: string;
        }
      >
    >(
      (acc, row) => {
        const messageId = row.gmail_message_id || row.message_id;

        if (!messageId) {
          return acc;
        }

        acc[messageId] = {
          intent: row.intent || "general",
          priority: row.priority || "low",
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
          matchedPhrases: Array.isArray(row.matched_phrases)
            ? row.matched_phrases
            : [],
          reason: row.reason || "",
          summary: row.summary || "",
          recommendedAction: row.recommended_action || "",
          shouldAlert: row.should_alert ?? false,
          alertReason: row.alert_reason || "",
        };

        return acc;
      },
      {}
    );

    return NextResponse.json({
      analysis: analysisByMessageId,
      totalReturned: Object.keys(analysisByMessageId).length,
    });
  } catch (error: unknown) {
    console.error("GET /api/get-analysis error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Failed to load saved analysis",
      },
      { status: 500 }
    );
  }
}