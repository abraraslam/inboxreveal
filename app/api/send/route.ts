import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
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

    const result = await provider.sendEmail({
      to,
      subject: subject || "No subject",
      body,
      threadId,
    });

    return NextResponse.json({
      success: result.success,
      id: result.id || null,
      threadId: result.threadId || null,
    });
  } catch (error: any) {
    console.error("Send email error:", error);

    return NextResponse.json(
      {
        error: "Failed to send email",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}