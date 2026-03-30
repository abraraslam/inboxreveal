import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { applyRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getPlanCapabilities, getUserPlanTier } from "@/lib/plans";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ReviewAction =
  | "general"
  | "professional"
  | "shorter"
  | "polite"
  | "persuasive";

function getActionInstruction(action: ReviewAction) {
  switch (action) {
    case "professional":
      return "Make the email more professional, polished, and business-appropriate.";
    case "shorter":
      return "Make the email shorter and more concise while preserving the meaning.";
    case "polite":
      return "Make the email more polite, warm, and respectful.";
    case "persuasive":
      return "Make the email more persuasive and action-oriented without sounding pushy.";
    case "general":
    default:
      return "Improve grammar, tone, clarity, and professionalism.";
  }
}

function extractJson(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in response");
    }
    return JSON.parse(match[0]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const planTier = await getUserPlanTier(supabase, session.user.email);
    const capabilities = getPlanCapabilities(planTier);

    if (!capabilities.canUseAiDraftReview) {
      return NextResponse.json(
        {
          error: "AI draft review is available on the Gold plan.",
          requiredPlan: "gold",
        },
        { status: 403 }
      );
    }

    const rateLimit = applyRateLimit({
      key: buildRateLimitKey(req, session.user.email, "review-draft"),
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many draft review requests",
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

    const { to, subject, body, action } = (await req.json()) as {
      to?: string;
      subject?: string;
      body?: string;
      action?: ReviewAction;
    };

    const normalizedBody = typeof body === "string" ? body.trim().slice(0, 12000) : "";

    if (!normalizedBody) {
      return NextResponse.json(
        { error: "Draft body is required." },
        { status: 400 }
      );
    }

    const safeAction: ReviewAction = action || "general";
    const actionInstruction = getActionInstruction(safeAction);

    const prompt = `
You are an AI email reviewer for InboxReveal.

Review this email draft and improve it.

Return STRICT JSON only in this exact format:
{
  "improvedSubject": "string",
  "improvedBody": "string",
  "suggestions": ["string", "string", "string"]
}

Instructions:
- Keep the original meaning
- ${actionInstruction}
- Fix grammar and improve readability
- Do not invent facts
- Preserve names, dates, commitments, and important details unless rewriting more clearly
- Keep the result natural and ready to send
- suggestions must be short bullet-style phrases

Email draft:
To: ${to || ""}
Subject: ${subject || ""}
Body:
${normalizedBody}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || "{}";
    const parsed = extractJson(text);

    return NextResponse.json({
      improvedSubject: parsed.improvedSubject || subject || "",
      improvedBody: parsed.improvedBody || normalizedBody,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    });
  } catch (error) {
    console.error("Review draft error:", error);

    return NextResponse.json(
      { error: "Failed to review draft." },
      { status: 500 }
    );
  }
}