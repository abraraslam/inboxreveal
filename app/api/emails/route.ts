import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

    const provider = getEmailProvider({
      provider: session.provider || "gmail",
      accessToken: session.accessToken,
    });

    const result = await provider.listEmails({
      pageToken,
      maxResults: 20,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("EMAILS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load emails",
        message: error?.message || "Unknown error",
        details: error?.response?.data || null,
      },
      { status: 500 }
    );
  }
}