alter table if exists public.user_preferences
add column if not exists plan_tier text not null default 'basic';

alter table if exists public.user_preferences
drop constraint if exists user_preferences_plan_tier_check;

alter table if exists public.user_preferences
add constraint user_preferences_plan_tier_check
check (plan_tier in ('basic', 'premium', 'gold'));
