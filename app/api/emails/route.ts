import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Session data:", {
      user: session?.user?.email,
      hasAccessToken: !!session?.accessToken,
      provider: session?.provider,
      token: session?.accessToken ? "EXISTS" : "MISSING",
    });

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!session.accessToken) {
      console.error("Access token missing in session");
      return NextResponse.json(
        {
          error: "No access token in session",
          message:
            "Please sign out and sign in again to refresh your authentication",
        },
        { status: 401 }
      );
    }

    const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

    const provider = getEmailProvider({
      provider: (session.provider as "gmail" | "outlook") || "gmail",
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