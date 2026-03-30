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

    let data: Array<Record<string, unknown>> | null = null;
    let error: Error | null = null;

    const scopedResult = await supabase
      .from("email_analysis")
      .select("*")
      .eq("user_email", session.user.email)
      .in("gmail_message_id", messageIds);

    if (scopedResult.error && /user_email|gmail_message_id/i.test(scopedResult.error.message || "")) {
      const legacyResult = await supabase
        .from("email_analysis")
        .select("*")
        .in("message_id", messageIds);

      data = legacyResult.data;
      error = legacyResult.error;
    } else {
      data = scopedResult.data;
      error = scopedResult.error;
    }

    if (error) {
      console.warn("GET /api/get-analysis fallback to empty response:", error);
      return NextResponse.json({
        analysis: {},
        totalReturned: 0,
      });
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
        const gmailMessageId =
          typeof row.gmail_message_id === "string" ? row.gmail_message_id : null;
        const legacyMessageId =
          typeof row.message_id === "string" ? row.message_id : null;
        const messageId = gmailMessageId || legacyMessageId;

        if (!messageId) {
          return acc;
        }

        acc[messageId] = {
          intent: typeof row.intent === "string" ? row.intent : "general",
          priority: typeof row.priority === "string" ? row.priority : "low",
          keywords: Array.isArray(row.keywords)
            ? row.keywords.filter((item): item is string => typeof item === "string")
            : [],
          matchedPhrases: Array.isArray(row.matched_phrases)
            ? row.matched_phrases.filter((item): item is string => typeof item === "string")
            : [],
          reason: typeof row.reason === "string" ? row.reason : "",
          summary: typeof row.summary === "string" ? row.summary : "",
          recommendedAction:
            typeof row.recommended_action === "string"
              ? row.recommended_action
              : "",
          shouldAlert: typeof row.should_alert === "boolean" ? row.should_alert : false,
          alertReason: typeof row.alert_reason === "string" ? row.alert_reason : "",
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