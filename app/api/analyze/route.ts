import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { applyRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getPlanCapabilities, getUserPlanTier } from "@/lib/plans";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type AnalyzeResponse = {
  intent:
    | "complaint"
    | "refund_request"
    | "cancellation_risk"
    | "sales_opportunity"
    | "urgent"
    | "general";
  priority: "high" | "medium" | "low";
  keywords: string[];
  matchedPhrases: string[];
  reason: string;
  summary: string;
  recommendedAction: string;
  shouldAlert: boolean;
  alertReason: string;
};

const FALLBACK_RESPONSE: AnalyzeResponse = {
  intent: "general",
  priority: "low",
  keywords: [],
  matchedPhrases: [],
  reason: "No important issue detected in the email body.",
  summary: "General email with no urgent business signal detected.",
  recommendedAction: "Review normally.",
  shouldAlert: false,
  alertReason: "",
};

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeIntent(value: unknown): AnalyzeResponse["intent"] {
  const allowed: AnalyzeResponse["intent"][] = [
    "complaint",
    "refund_request",
    "cancellation_risk",
    "sales_opportunity",
    "urgent",
    "general",
  ];

  return allowed.includes(value as AnalyzeResponse["intent"])
    ? (value as AnalyzeResponse["intent"])
    : "general";
}

function normalizePriority(value: unknown): AnalyzeResponse["priority"] {
  const allowed: AnalyzeResponse["priority"][] = ["high", "medium", "low"];
  return allowed.includes(value as AnalyzeResponse["priority"])
    ? (value as AnalyzeResponse["priority"])
    : "low";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMatchedKeywordPhrases(
  text: string,
  keywords: string[]
): { matchedKeywords: string[]; matchedPhrases: string[] } {
  const normalizedText = text || "";
  const lowerText = normalizedText.toLowerCase();

  const matchedKeywords = keywords.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );

  const matchedPhrases = matchedKeywords.map((keyword) => {
    const regex = new RegExp(`(.{0,30}${escapeRegExp(keyword)}.{0,30})`, "i");
    const match = normalizedText.match(regex);
    return match ? match[1].trim() : keyword;
  });

  return {
    matchedKeywords: [...new Set(matchedKeywords)],
    matchedPhrases: [...new Set(matchedPhrases)].slice(0, 5),
  };
}

function buildAlertDecision(
  intent: AnalyzeResponse["intent"],
  priority: AnalyzeResponse["priority"],
  matchedKeywords: string[]
): { shouldAlert: boolean; alertReason: string } {
  if (priority === "high" && intent === "refund_request") {
    return {
      shouldAlert: true,
      alertReason: "High-priority refund request detected.",
    };
  }

  if (priority === "high" && intent === "cancellation_risk") {
    return {
      shouldAlert: true,
      alertReason: "High-risk cancellation signal detected.",
    };
  }

  if (priority === "high" && intent === "complaint") {
    return {
      shouldAlert: true,
      alertReason: "High-priority complaint detected.",
    };
  }

  if (intent === "urgent") {
    return {
      shouldAlert: true,
      alertReason: "Urgent email requires attention.",
    };
  }

  if (priority === "high") {
    return {
      shouldAlert: true,
      alertReason: "High-priority email detected.",
    };
  }

  if (matchedKeywords.length > 0) {
    return {
      shouldAlert: true,
      alertReason: `Matched custom keywords: ${matchedKeywords.join(", ")}`,
    };
  }

  return {
    shouldAlert: false,
    alertReason: "",
  };
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = applyRateLimit({
      key: buildRateLimitKey(req, session.user.email, "analyze"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many analysis requests",
          message: `Try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const { messageId, text, customKeywords = [] } = await req.json();

    const emailText = typeof text === "string" ? text.trim().slice(0, 12000) : "";
    const safeMessageId =
      typeof messageId === "string" ? messageId.trim() : "";

    const planTier = await getUserPlanTier(supabase, session.user.email);
    const capabilities = getPlanCapabilities(planTier);

    if (capabilities.analyzeMonthlyLimit !== null) {
      let hasExistingRecord = false;

      if (safeMessageId) {
        const { data: existingRecord } = await supabase
          .from("email_analysis")
          .select("gmail_message_id")
          .eq("user_email", session.user.email)
          .eq("gmail_message_id", safeMessageId)
          .maybeSingle();

        hasExistingRecord = Boolean(existingRecord);
      }

      if (!hasExistingRecord) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("email_analysis")
          .select("*", { head: true, count: "exact" })
          .eq("user_email", session.user.email)
          .gte("analyzed_at", monthStart.toISOString());

        if ((count || 0) >= capabilities.analyzeMonthlyLimit) {
          return NextResponse.json(
            {
              error: `Monthly analysis limit reached for ${planTier} plan.`,
              requiredPlan: planTier === "basic" ? "premium" : "gold",
            },
            { status: 403 }
          );
        }
      }
    }

    if (!emailText) {
      return NextResponse.json(FALLBACK_RESPONSE);
    }

    const cleanedCustomKeywords = capabilities.canUseSmartAlerts
      ? safeStringArray(customKeywords)
      : [];

    const { matchedKeywords, matchedPhrases } = extractMatchedKeywordPhrases(
      emailText,
      cleanedCustomKeywords
    );

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You analyze email BODY content for InboxReveal.

Return valid JSON only with this exact shape:
{
  "intent": "complaint" | "refund_request" | "cancellation_risk" | "sales_opportunity" | "urgent" | "general",
  "priority": "high" | "medium" | "low",
  "keywords": string[],
  "matchedPhrases": string[],
  "reason": string,
  "summary": string,
  "recommendedAction": string
}

Rules:
- Analyze BODY content only, not subject.
- Be concise and practical.
- "reason" must be under 20 words.
- "summary" should be one short sentence.
- "recommendedAction" should be one short sentence.
- "matchedPhrases" should contain short exact or near-exact phrases from the body when possible.
- Use "general" if no strong signal exists.
- Use "high" for urgent/refund/cancellation cases when clearly time-sensitive or negative.
- Use "sales_opportunity" for pricing, demo, quote, proposal, interest, partnership, or buying signals.
- Use "complaint" for dissatisfaction, frustration, poor experience, or service/product issues.
- Use "refund_request" for refund, reimbursement, chargeback, return-money style requests.
- Use "cancellation_risk" for cancel, churn, terminate, unsubscribe, stop service, leave, or downgrade intent.
- Use "urgent" for immediate response needs, deadlines, severe operational problems, or escalation.
`,
        },
        {
          role: "user",
          content: JSON.stringify({
            body: emailText,
            customKeywords: cleanedCustomKeywords,
            alreadyMatchedCustomKeywords: matchedKeywords,
            alreadyMatchedPhrases: matchedPhrases,
          }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const aiKeywords = safeStringArray(parsed.keywords);
    const aiMatchedPhrases = safeStringArray(parsed.matchedPhrases);

    const mergedKeywords = [...new Set([...aiKeywords, ...matchedKeywords])].slice(
      0,
      8
    );

    const mergedMatchedPhrases = [
      ...new Set([...aiMatchedPhrases, ...matchedPhrases]),
    ].slice(0, 5);

    const normalizedIntent = normalizeIntent(parsed.intent);
    const normalizedPriority = normalizePriority(parsed.priority);

    const alertDecision = buildAlertDecision(
      normalizedIntent,
      normalizedPriority,
      matchedKeywords
    );

    const finalResponse: AnalyzeResponse = {
      intent: normalizedIntent,
      priority: normalizedPriority,
      keywords: mergedKeywords,
      matchedPhrases: mergedMatchedPhrases,
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim().slice(0, 120)
          : FALLBACK_RESPONSE.reason,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim().slice(0, 220)
          : FALLBACK_RESPONSE.summary,
      recommendedAction:
        typeof parsed.recommendedAction === "string" &&
        parsed.recommendedAction.trim()
          ? parsed.recommendedAction.trim().slice(0, 220)
          : FALLBACK_RESPONSE.recommendedAction,
      shouldAlert: alertDecision.shouldAlert,
      alertReason: alertDecision.alertReason,
    };

    if (safeMessageId) {
      const scopedSave = await supabase.from("email_analysis").upsert(
        {
          user_email: session.user.email,
          gmail_message_id: safeMessageId,
          message_id: safeMessageId,
          intent: finalResponse.intent,
          priority: finalResponse.priority,
          keywords: finalResponse.keywords,
          matched_phrases: finalResponse.matchedPhrases,
          reason: finalResponse.reason,
          summary: finalResponse.summary,
          recommended_action: finalResponse.recommendedAction,
          should_alert: finalResponse.shouldAlert,
          alert_reason: finalResponse.alertReason,
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: "user_email,gmail_message_id" }
      );

      let saveError = scopedSave.error;

      if (saveError && /user_email|gmail_message_id/i.test(saveError.message || "")) {
        const legacySave = await supabase.from("email_analysis").upsert(
          {
            message_id: safeMessageId,
            intent: finalResponse.intent,
            priority: finalResponse.priority,
            keywords: finalResponse.keywords,
            matched_phrases: finalResponse.matchedPhrases,
            reason: finalResponse.reason,
            summary: finalResponse.summary,
            recommended_action: finalResponse.recommendedAction,
            should_alert: finalResponse.shouldAlert,
            alert_reason: finalResponse.alertReason,
            analyzed_at: new Date().toISOString(),
          },
          { onConflict: "message_id" }
        );

        saveError = legacySave.error;
      }

      if (saveError) {
        console.error("Supabase save analysis error:", saveError);
      }
    }

    return NextResponse.json(finalResponse);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to analyze email",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}