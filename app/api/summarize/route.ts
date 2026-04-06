import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { applyRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getEffectiveCapabilities, getUserPlanData } from "@/lib/plans";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const { planTier, trialEndAt } = await getUserPlanData(supabase, session.user.email);
    const capabilities = getEffectiveCapabilities(planTier, trialEndAt);

    if (!capabilities.canUseSummaries) {
      return NextResponse.json(
        {
          error: "Summaries are available on Premium and Gold plans.",
          requiredPlan: "premium",
        },
        { status: 403 }
      );
    }

    const rateLimit = applyRateLimit({
      key: buildRateLimitKey(req, session.user.email, "summarize"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many summary requests",
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

    const { text } = await req.json();
    const safeText = typeof text === "string" ? text.trim().slice(0, 12000) : "";

    if (!safeText) {
      return NextResponse.json(
        { error: "Missing text" },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize emails in 2 short sentences.",
        },
        {
          role: "user",
          content: safeText,
        },
      ],
    });

    return NextResponse.json({
      summary: response.choices[0].message.content,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Something went wrong",
      },
      { status: 500 }
    );
  }
}