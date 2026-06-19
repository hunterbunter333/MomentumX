-- ── Daily Journal Entries ─────────────────────────────────────────────────────
-- Stores user progress notes + AI coaching tips, one entry per user per day.
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

create table if not exists journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  entry_date    date not null,
  note          text not null default '',
  ai_suggestion text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, entry_date)
);

-- Row Level Security
alter table journal_entries enable row level security;

create policy "Users can read own journal entries"
  on journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
  on journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
  on journal_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on journal_entries for delete
  using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists journal_entries_user_date
  on journal_entries(user_id, entry_date desc);
