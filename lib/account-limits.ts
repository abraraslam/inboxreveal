import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserPlanData, isUserInTrial } from "@/lib/plans";

export type SignInProvider = "gmail" | "outlook";

export type AccountLimitErrorCode =
  | "PlanGoogleOnly"
  | "GoogleSlotAlreadyUsed"
  | "OutlookSlotAlreadyUsed";

type ConnectedAccountsRow = {
  connected_google_account_email: string | null;
  connected_outlook_account_email: string | null;
};

export type AccountLimitDecision = {
  allowed: boolean;
  errorCode?: AccountLimitErrorCode;
};

export function normalizeSignInProvider(provider?: string): SignInProvider | null {
  const value = String(provider || "").toLowerCase();

  if (value === "google" || value === "gmail") {
    return "gmail";
  }

  if (
    value === "outlook" ||
    value === "azure-ad" ||
    value === "microsoft" ||
    value === "microsoft-entra-id"
  ) {
    return "outlook";
  }

  return null;
}

export function extractOAuthEmail(params: {
  user?: { email?: string | null };
  profile?: {
    email?: string | null;
    preferred_username?: string | null;
    upn?: string | null;
  };
}): string | null {
  const raw =
    params.user?.email ||
    params.profile?.email ||
    params.profile?.preferred_username ||
    params.profile?.upn ||
    null;

  if (!raw) {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized || null;
}

function shouldAllowTwoProviders(planTier: "basic" | "premium" | "gold", trialEndAt: string | null) {
  if (planTier === "premium" || planTier === "gold") {
    return true;
  }

  return isUserInTrial(trialEndAt);
}

async function getConnectedAccounts(
  supabase: SupabaseClient,
  email: string
): Promise<ConnectedAccountsRow> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("connected_google_account_email, connected_outlook_account_email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    connected_google_account_email: data?.connected_google_account_email ?? null,
    connected_outlook_account_email: data?.connected_outlook_account_email ?? null,
  };
}

async function persistConnectedAccounts(
  supabase: SupabaseClient,
  email: string,
  row: ConnectedAccountsRow
) {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      email,
      connected_google_account_email: row.connected_google_account_email,
      connected_outlook_account_email: row.connected_outlook_account_email,
    },
    { onConflict: "email" }
  );

  if (error) {
    throw error;
  }
}

export async function enforceAccountLimitsOnSignIn(params: {
  supabase: SupabaseClient;
  email: string;
  provider: SignInProvider;
}): Promise<AccountLimitDecision> {
  const { supabase, email, provider } = params;
  const normalizedEmail = email.trim().toLowerCase();

  const [{ planTier, trialEndAt }, connected] = await Promise.all([
    getUserPlanData(supabase, normalizedEmail),
    getConnectedAccounts(supabase, normalizedEmail),
  ]);

  const canUseTwoProviders = shouldAllowTwoProviders(planTier, trialEndAt);

  // Block cross-provider linking for all plans
  if (
    provider === "gmail" &&
    connected.connected_outlook_account_email &&
    connected.connected_outlook_account_email === normalizedEmail
  ) {
    // This email is already connected as Outlook, block Gmail
    return { allowed: false, errorCode: "GoogleSlotAlreadyUsed" };
  }
  if (
    provider === "outlook" &&
    connected.connected_google_account_email &&
    connected.connected_google_account_email === normalizedEmail
  ) {
    // This email is already connected as Gmail, block Outlook
    return { allowed: false, errorCode: "OutlookSlotAlreadyUsed" };
  }

  // Basic users can only access Gmail
  if (!canUseTwoProviders) {
    if (provider !== "gmail") {
      return { allowed: false, errorCode: "PlanGoogleOnly" };
    }

    if (
      connected.connected_google_account_email &&
      connected.connected_google_account_email !== normalizedEmail
    ) {
      return { allowed: false, errorCode: "GoogleSlotAlreadyUsed" };
    }

    await persistConnectedAccounts(supabase, normalizedEmail, {
      connected_google_account_email: normalizedEmail,
      connected_outlook_account_email: null,
    });

    return { allowed: true };
  }

  // Premium/Gold/trial: allow both, but not cross-link
  if (
    provider === "gmail" &&
    connected.connected_google_account_email &&
    connected.connected_google_account_email !== normalizedEmail
  ) {
    return { allowed: false, errorCode: "GoogleSlotAlreadyUsed" };
  }

  if (
    provider === "outlook" &&
    connected.connected_outlook_account_email &&
    connected.connected_outlook_account_email !== normalizedEmail
  ) {
    return { allowed: false, errorCode: "OutlookSlotAlreadyUsed" };
  }

  await persistConnectedAccounts(supabase, normalizedEmail, {
    connected_google_account_email:
      provider === "gmail"
        ? normalizedEmail
        : connected.connected_google_account_email,
    connected_outlook_account_email:
      provider === "outlook"
        ? normalizedEmail
        : connected.connected_outlook_account_email,
  });

  return { allowed: true };
}
