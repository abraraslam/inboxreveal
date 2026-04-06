import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { normalizePlanTier } from "@/lib/plans";

type PreferencePayload = {
  email: string;
  keywords: string[];
  alert_urgent: boolean;
  alert_complaint: boolean;
  alert_sales: boolean;
  hide_preferences_prompt?: boolean;
  plan_tier?: "basic" | "premium" | "gold";
};

function getDefaultPreferencePayload(email: string): PreferencePayload {
  return {
    email,
    keywords: [],
    alert_urgent: false,
    alert_complaint: false,
    alert_sales: false,
    hide_preferences_prompt: false,
    plan_tier: "basic",
  };
}

function isSchemaMismatchError(message: string) {
  return /hide_preferences_prompt|plan_tier/i.test(message || "");
}

function isUpsertConflictError(message: string) {
  return /42P10|no unique|ON CONFLICT|conflict specification/i.test(
    message || ""
  );
}

async function saveWithoutUpsert(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  payload: PreferencePayload
) {
  const updateResult = await supabase
    .from("user_preferences")
    .update(payload)
    .eq("email", payload.email)
    .select("email")
    .limit(1);

  if (updateResult.error) {
    return updateResult.error;
  }

  if ((updateResult.data || []).length > 0) {
    return null;
  }

  const insertResult = await supabase.from("user_preferences").insert(payload);
  return insertResult.error;
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown };

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }

    if (typeof maybeError.details === "string" && maybeError.details.trim()) {
      return maybeError.details;
    }

    if (typeof maybeError.hint === "string" && maybeError.hint.trim()) {
      return maybeError.hint;
    }
  }

  return fallback;
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient({ requireServiceRole: true });
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      keywords,
      alertUrgent,
      alertComplaint,
      alertSales,
      hidePreferencesPrompt,
      planTier,
    } = body;

    const email = session.user.email;

    const safeKeywords = Array.isArray(keywords)
      ? keywords
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 25)
      : [];

    const payload: PreferencePayload = {
      email,
      keywords: safeKeywords,
      alert_urgent: Boolean(alertUrgent),
      alert_complaint: Boolean(alertComplaint),
      alert_sales: Boolean(alertSales),
      hide_preferences_prompt: Boolean(hidePreferencesPrompt),
      plan_tier: normalizePlanTier(planTier),
    };

    const legacyPayload: PreferencePayload = {
      email,
      keywords: safeKeywords,
      alert_urgent: Boolean(alertUrgent),
      alert_complaint: Boolean(alertComplaint),
      alert_sales: Boolean(alertSales),
    };

    let fallbackPayload = payload;

    let { error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "email" });

    // Support databases that have not run one or more preference migrations yet.
    if (error && isSchemaMismatchError(error.message || "")) {
      fallbackPayload = legacyPayload;
      ({ error } = await supabase
        .from("user_preferences")
        .upsert(legacyPayload, { onConflict: "email" }));
    }

    // Support databases where `email` is not yet constrained for onConflict upserts.
    if (error && isUpsertConflictError(error.message || "")) {
      error = await saveWithoutUpsert(supabase, fallbackPayload);
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = toErrorMessage(error, "Failed to save preferences");

    if (/row-level security policy/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Supabase service-role key is required for saving preferences. Update SUPABASE_SERVICE_ROLE_KEY in .env.local.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient({ requireServiceRole: true });
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    let { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    // Ensure every authenticated user has a preference row so database defaults
    // (including trial_end_at) are applied on first login.
    if (!data) {
      const payload = getDefaultPreferencePayload(email);
      const legacyPayload = {
        email,
        keywords: payload.keywords,
        alert_urgent: payload.alert_urgent,
        alert_complaint: payload.alert_complaint,
        alert_sales: payload.alert_sales,
      };

      let createError = await supabase
        .from("user_preferences")
        .upsert(payload, { onConflict: "email" })
        .then((result) => result.error);

      if (createError && isSchemaMismatchError(createError.message || "")) {
        createError = await supabase
          .from("user_preferences")
          .upsert(legacyPayload, { onConflict: "email" })
          .then((result) => result.error);
      }

      if (createError && isUpsertConflictError(createError.message || "")) {
        createError = await saveWithoutUpsert(supabase, payload);
      }

      if (createError) throw createError;

      const refetch = await supabase
        .from("user_preferences")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (refetch.error) throw refetch.error;
      data = refetch.data;
    }

    return NextResponse.json(data || null);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Failed to load preferences") },
      { status: 500 }
    );
  }
}
