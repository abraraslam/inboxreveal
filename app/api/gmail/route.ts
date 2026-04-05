import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

    const result = await getEmailProvider({
      provider: session.provider || "gmail",
      accessToken: session.accessToken,
    }).listEmails({
      pageToken,
      maxResults: 20,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GMAIL API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load Gmail messages",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}