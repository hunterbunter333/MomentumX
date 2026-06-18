-- ═══════════════════════════════════════════════════════════════
-- MomentumX — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run — drops existing policies/triggers before recreating.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Profiles ─────────────────────────────────────────────────

create table if not exists profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  email            text not null,
  plan             text not null default 'free',
  stripe_customer_id text,
  created_at       timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ── 2. Goals ────────────────────────────────────────────────────

create table if not exists goals (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  goal_text  text not null,
  plan       jsonb,
  is_active  boolean default true,
  created_at timestamptz default now()
);

alter table goals enable row level security;

drop policy if exists "Users can read own goals" on goals;
drop policy if exists "Users can insert own goals" on goals;
drop policy if exists "Users can update own goals" on goals;
drop policy if exists "Users can delete own goals" on goals;

create policy "Users can read own goals"
  on goals for select using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on goals for insert with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on goals for update using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on goals for delete using (auth.uid() = user_id);

-- ── 3. Daily Advice ─────────────────────────────────────────────

create table if not exists daily_advice (
  id          uuid default gen_random_uuid() primary key,
  goal_id     uuid references goals(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  advice      text not null,
  advice_date date not null default current_date,
  created_at  timestamptz default now(),
  unique(goal_id, advice_date)
);

alter table daily_advice enable row level security;

drop policy if exists "Users can read own advice" on daily_advice;

create policy "Users can read own advice"
  on daily_advice for select using (auth.uid() = user_id);

-- ── 4. Auto-create profile on signup ────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 5. Onboarding columns (run this migration after initial setup) ───────────

alter table profiles
  add column if not exists onboarding_done        boolean default false,
  add column if not exists onboarding_goal_type   text,
  add column if not exists onboarding_daily_time  text,
  add column if not exists onboarding_challenge   text,
  add column if not exists onboarding_motivation  text;
