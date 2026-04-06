-- Add trial_end_at to user_preferences.
-- New rows automatically get a 7-day trial window via the column default.
-- Existing rows are left with NULL (no trial) so current paid users are not affected.
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS trial_end_at timestamptz DEFAULT (now() + interval '7 days');
