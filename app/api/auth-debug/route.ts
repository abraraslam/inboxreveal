import { NextResponse } from "next/server";

function isConfigured(value?: string) {
  const normalized = value?.trim();

  if (!normalized) return false;
  if (/^your_/i.test(normalized)) return false;
  if (/placeholder/i.test(normalized)) return false;

  return true;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  return NextResponse.json({
    host: url.host,
    origin: url.origin,
    env: {
      NEXTAUTH_URL: nextAuthUrl || null,
      GOOGLE_CLIENT_ID_set: isConfigured(googleClientId),
      GOOGLE_CLIENT_SECRET_set: isConfigured(googleClientSecret),
      NEXTAUTH_SECRET_set: isConfigured(nextAuthSecret),
      GOOGLE_CLIENT_ID_length: googleClientId?.length || 0,
      GOOGLE_CLIENT_SECRET_length: googleClientSecret?.length || 0,
      NEXTAUTH_SECRET_length: nextAuthSecret?.length || 0,
    },
  });
}
