import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";
import { applyRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = applyRateLimit({
      key: buildRateLimitKey(req, session.user?.email, "create-draft"),
      limit: 15,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many draft requests",
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

    const { to, subject, body, threadId } = await req.json();

    const safeTo = typeof to === "string" ? to.trim() : "";
    const safeBody = typeof body === "string" ? body.trim().slice(0, 20000) : "";
    const safeSubject =
      typeof subject === "string" && subject.trim()
        ? subject.trim().slice(0, 255)
        : "No subject";
    const safeThreadId = typeof threadId === "string" ? threadId.trim() : undefined;

    if (!safeTo || !safeBody) {
      return NextResponse.json(
        { error: "Missing recipient or body" },
        { status: 400 }
      );
    }

    if (!isValidEmail(safeTo)) {
      return NextResponse.json(
        { error: "Invalid recipient email" },
        { status: 400 }
      );
    }

    const provider = getEmailProvider({
      provider: session.provider || "gmail",
      accessToken: session.accessToken,
    });

    const result = await provider.createDraft({
      to: safeTo,
      subject: safeSubject,
      body: safeBody,
      threadId: safeThreadId,
    });

    return NextResponse.json({
      success: result.success,
      draftId: result.draftId || null,
      threadId: result.threadId || threadId || null,
    });
  } catch (error: unknown) {
    console.error("DRAFT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create draft",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}