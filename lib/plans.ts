import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanTier = "basic" | "premium" | "gold";

export type PlanCapabilities = {
  analyzeMonthlyLimit: number | null;
  canUseSummaries: boolean;
  canUseSuggestedReplies: boolean;
  canUseSmartAlerts: boolean;
  canUseAiDraftReview: boolean;
};

const PLAN_CAPABILITIES: Record<PlanTier, PlanCapabilities> = {
  basic: {
    analyzeMonthlyLimit: 100,
    canUseSummaries: false,
    canUseSuggestedReplies: false,
    canUseSmartAlerts: false,
    canUseAiDraftReview: false,
  },
  premium: {
    analyzeMonthlyLimit: 2000,
    canUseSummaries: true,
    canUseSuggestedReplies: true,
    canUseSmartAlerts: true,
    canUseAiDraftReview: false,
  },
  gold: {
    analyzeMonthlyLimit: null,
    canUseSummaries: true,
    canUseSuggestedReplies: true,
    canUseSmartAlerts: true,
    canUseAiDraftReview: true,
  },
};

export function normalizePlanTier(value: unknown): PlanTier {
  if (value === "basic" || value === "premium" || value === "gold") {
    return value;
  }

  return "basic";
}

export function getPlanCapabilities(plan: PlanTier): PlanCapabilities {
  return PLAN_CAPABILITIES[plan];
}

/** Returns true when the current timestamp is still within the trial window. */
export function isUserInTrial(trialEndAt: string | null | undefined): boolean {
  if (!trialEndAt) return false;
  return new Date(trialEndAt) > new Date();
}

/**
 * Returns remaining trial days as a calendar-day countdown.
 *
 * Example: signup day shows 7, next day shows 6, and so on.
 * While still active on the final calendar day, this returns 1.
 */
export function trialDaysRemaining(trialEndAt: string | null | undefined): number {
  if (!trialEndAt) return 0;

  const now = new Date();
  const trialEnd = new Date(trialEndAt);

  if (trialEnd <= now) return 0;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTrialEndDay = new Date(trialEnd);
  startOfTrialEndDay.setHours(0, 0, 0, 0);

  const dayMs = 1000 * 60 * 60 * 24;
  const calendarDays = Math.ceil(
    (startOfTrialEndDay.getTime() - startOfToday.getTime()) / dayMs
  );

  return Math.max(1, calendarDays);
}

/**
 * Returns Gold-level capabilities during an active trial; otherwise returns
 * the capabilities for the user's actual plan tier.
 */
export function getEffectiveCapabilities(
  plan: PlanTier,
  trialEndAt: string | null | undefined
): PlanCapabilities {
  if (isUserInTrial(trialEndAt)) {
    return PLAN_CAPABILITIES["gold"];
  }
  return PLAN_CAPABILITIES[plan];
}

export async function getUserPlanTier(
  supabase: SupabaseClient,
  email: string
): Promise<PlanTier> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("plan_tier")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return "basic";
  }

  return normalizePlanTier(data?.plan_tier);
}

export type UserPlanData = {
  planTier: PlanTier;
  trialEndAt: string | null;
};

/** Fetches both plan tier and trial end date in a single query. */
export async function getUserPlanData(
  supabase: SupabaseClient,
  email: string
): Promise<UserPlanData> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("plan_tier, trial_end_at")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return { planTier: "basic", trialEndAt: null };
  }

  return {
    planTier: normalizePlanTier(data?.plan_tier),
    trialEndAt: data?.trial_end_at ?? null,
  };
}
