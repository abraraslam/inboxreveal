"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error");

  const messages: Record<string, string> = {
    OAuthSignin: "Error building the OAuth sign-in URL.",
    OAuthCallback: "Error handling the OAuth callback from Google.",
    OAuthCreateAccount: "Could not create user account.",
    Callback: "Error in OAuth callback handler.",
    OAuthAccountNotLinked: "This email is already linked to another account.",
    AccessDenied: "Access was denied. If the app is in Testing mode, make sure your Google account is added as a Test User in Google Cloud Console.",
    Verification: "Sign-in link expired or already used.",
    Configuration: "Server configuration error. NEXTAUTH_SECRET or credentials may be missing.",
    Default: "An unexpected sign-in error occurred.",
    google: "Google OAuth callback failed. This usually means NEXTAUTH_SECRET is missing in Vercel, or a state cookie mismatch. Check Vercel environment variables.",
  };

  const description = error ? (messages[error] ?? `Unknown error code: ${error}`) : "No error code provided.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-red-600">Sign-in Error</h1>
        <p className="mb-4 text-sm font-mono text-slate-500">error={error ?? "none"}</p>
        <p className="text-slate-700">{description}</p>
        <a
          href="/?login=true"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
