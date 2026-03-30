import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function isUsableSupabaseKey(value?: string) {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  // Ignore common placeholder values left in local env files.
  if (/your_service_role_key|your_anon_key|your_supabase/i.test(trimmed)) {
    return false;
  }

  if (/sb_secret_your_|sb_publishable_your_/i.test(trimmed)) {
    return false;
  }

  return true;
}

function resolveSupabaseServerKey(requireServiceRole = false) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isUsableSupabaseKey(serviceRoleKey)) {
    return serviceRoleKey!.trim();
  }

  if (!requireServiceRole && isUsableSupabaseKey(anonKey)) {
    return anonKey!.trim();
  }

  if (requireServiceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or placeholder. Write operations require a valid service-role key."
    );
  }

  throw new Error(
    "Supabase key is missing or placeholder. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export function getSupabaseServerClient(options?: { requireServiceRole?: boolean }) {
  const supabaseServerKey = resolveSupabaseServerKey(
    options?.requireServiceRole === true
  );

  return createClient(supabaseUrl, supabaseServerKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}