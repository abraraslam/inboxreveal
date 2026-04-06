ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_stripe_customer_id_key
ON user_preferences (stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_stripe_subscription_id_key
ON user_preferences (stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;
