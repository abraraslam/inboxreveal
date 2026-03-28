import { NextResponse } from "next/server";
import OpenAI from "openai";

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
    const { to, subject, body, action } = (await req.json()) as {
      to?: string;
      subject?: string;
      body?: string;
      action?: ReviewAction;
    };

    if (!body || !String(body).trim()) {
      return NextResponse.json(
        { error: "Draft body is required." },
        { status: 400 }
      );
    }

    const safeAction: ReviewAction = action || "general";
    const actionInstruction = getActionInstruction(safeAction);

    const prompt = `
You are an AI email reviewer for InboxIntel.

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
${body}
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
      improvedBody: parsed.improvedBody || body,
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