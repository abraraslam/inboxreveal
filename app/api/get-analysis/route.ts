import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");

    const messageIds = (idsParam || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (messageIds.length === 0) {
      return NextResponse.json({
        analysis: {},
        totalReturned: 0,
      });
    }

    const { data, error } = await supabase
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

    if (error) {
      throw error;
    }

    const analysisByMessageId = (data || []).reduce<Record<string, any>>(
      (acc, row) => {
        acc[row.message_id] = {
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
  } catch (error: any) {
    console.error("GET /api/get-analysis error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to load saved analysis",
      },
      { status: 500 }
    );
  }
}