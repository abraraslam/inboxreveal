import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getEmailProvider } from "@/lib/email/get-provider";

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getProjectIdFromMessage(message: string) {
  const match = message.match(/project\s+(\d+)/i);
  return match?.[1] || null;
}

function buildEmailLoadError(error: unknown) {
  const message = toErrorMessage(error, "Unknown error");

  if (/gmail api has not been used|gmail\.googleapis\.com\/overview/i.test(message)) {
    const projectId = getProjectIdFromMessage(message);
    const enableUrl = projectId
      ? `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${projectId}`
      : "https://console.developers.google.com/apis/api/gmail.googleapis.com/overview";

    return {
      error: "Gmail API is not enabled",
      message:
        `Enable Gmail API in your Google Cloud project, wait a few minutes, then sign out and sign in again. ${enableUrl}`,
      details: message,
    };
  }

  return {
    error: "Failed to load emails",
    message,
    details: null,
  };
}

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
  } catch (error: unknown) {
    console.error("EMAILS ERROR:", error);

    const payload = buildEmailLoadError(error);

    return NextResponse.json(
      payload,
      { status: 500 }
    );
  }
}