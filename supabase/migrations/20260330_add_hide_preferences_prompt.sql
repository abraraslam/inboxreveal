alter table if exists public.user_preferences
add column if not exists hide_preferences_prompt boolean not null default false;
