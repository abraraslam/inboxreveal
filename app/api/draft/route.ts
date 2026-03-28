import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, body, threadId } = await req.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing recipient or body" },
        { status: 400 }
      );
    }

    const provider = getEmailProvider({
      provider: session.provider || "gmail",
      accessToken: session.accessToken,
    });

    const result = await provider.createDraft({
      to,
      subject: subject || "No subject",
      body,
      threadId,
    });

    return NextResponse.json({
      success: result.success,
      draftId: result.draftId || null,
      threadId: result.threadId || threadId || null,
    });
  } catch (error: any) {
    console.error("DRAFT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create draft",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}