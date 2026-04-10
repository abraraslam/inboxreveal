-- Persist linked email-provider accounts for plan-based access control.
ALTER TABLE IF EXISTS public.user_preferences
  ADD COLUMN IF NOT EXISTS connected_google_account_email text,
  ADD COLUMN IF NOT EXISTS connected_outlook_account_email text;

-- Keep the values in a normalized (lowercase) shape.
UPDATE public.user_preferences
SET
  connected_google_account_email = lower(connected_google_account_email),
  connected_outlook_account_email = lower(connected_outlook_account_email)
WHERE connected_google_account_email IS NOT NULL
   OR connected_outlook_account_email IS NOT NULL;
