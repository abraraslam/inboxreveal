-- Ensure existing environments use a 14-day default trial period.
ALTER TABLE user_preferences
  ALTER COLUMN trial_end_at SET DEFAULT (now() + interval '14 days');
