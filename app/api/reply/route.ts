import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { applyRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type ReplyMode = "positive" | "negative" | "neutral";

function getSystemPrompt(replyMode: ReplyMode) {
  if (replyMode === "positive") {
    return `
You write short, professional email replies.

The user wants a POSITIVE reply.
That means the reply should be:
- warm
- polite
- professional
- supportive
- open to helping or continuing the conversation
- action-oriented when appropriate

Rules:
- Keep it concise and natural
- Do not be overly enthusiastic
- Do not invent facts
- Do not make promises the sender did not approve
- Write only the email reply body
- Do not include a subject line
`;
  }

  if (replyMode === "negative") {
    return `
You write short, professional email replies.

The user wants a NEGATIVE reply.
That means the reply should be:
- polite
- respectful
- clear
- firm when needed
- professional
- not rude or aggressive

Rules:
- Politely decline, reject, or say no when appropriate
- Keep it concise and natural
- Do not invent facts
- Do not make promises the sender did not approve
- Write only the email reply body
- Do not include a subject line
`;
  }

  return `
You write short, professional email replies.

The user wants a NEUTRAL reply.
That means the reply should be:
- polite
- clear
- professional
- balanced
- helpful

Rules:
- Keep it concise and natural
- Do not invent facts
- Do not make promises the sender did not approve
- Write only the email reply body
- Do not include a subject line
`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = applyRateLimit({
      key: buildRateLimitKey(req, session.user.email, "reply"),
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many reply generation requests",
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

    const body = await req.json();

    const subject = typeof body.subject === "string" ? body.subject : "";
    const text = typeof body.text === "string" ? body.text.slice(0, 12000) : "";
    const replyMode: ReplyMode =
      body.replyMode === "positive" ||
      body.replyMode === "negative" ||
      body.replyMode === "neutral"
        ? body.replyMode
        : "neutral";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Missing email text" },
        { status: 400 }
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(replyMode),
        },
        {
          role: "user",
          content: `
Write a professional reply to the email below.

Reply mode: ${replyMode}
Subject: ${subject || "(no subject)"}

Original email:
${text}

Output requirements:
- Start directly with the reply
- Keep it ready to send
- Keep it short unless the email clearly needs more detail
- If the sender asks a question, answer appropriately when possible without inventing facts
- If details are missing, respond professionally without making up specifics
`,
        },
      ],
    });

    const reply = response.choices[0]?.message?.content?.trim() || "";

    if (!reply) {
      return NextResponse.json(
        { error: "Failed to generate reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reply,
      replyMode,
    });
  } catch (error: unknown) {
    console.error("Reply route error:", error);

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