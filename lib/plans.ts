import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanTier = "basic" | "premium" | "gold";

type PlanCapabilities = {
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
