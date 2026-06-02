-- ============================================
-- BD Home Hunt - Supabase Schema (COMPLETE)
-- Run this ENTIRE file as ONE query in the Supabase SQL Editor
-- (New Query → paste everything below → Run)
-- ============================================

-- 1. Create the main table
create table if not exists hunt_properties (
  id text primary key,                    -- e.g. "p-29727693" or the MLS number
  hunt_id text not null,                  -- shared secret like "bd-kincardine-2026"
  data jsonb not null,                    -- the full property object (matches original data model)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Function + trigger to auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_hunt_properties_updated_at on hunt_properties;
create trigger update_hunt_properties_updated_at
before update on hunt_properties
for each row
execute function update_updated_at_column();

-- 3. Enable realtime (this makes live updates possible)
-- Safe / idempotent version
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'hunt_properties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE hunt_properties;
  END IF;
END $$;

-- 4. Helpful index for queries filtered by hunt
create index if not exists idx_hunt_properties_hunt_id on hunt_properties(hunt_id);

-- 5. Enable Row Level Security
alter table hunt_properties enable row level security;

-- 6. Policy: full read/write access only for the matching hunt_id
-- Safe version: drop old one first if it exists, then create
DROP POLICY IF EXISTS "Shared hunt access - full control for matching hunt_id" ON hunt_properties;
DROP POLICY IF EXISTS "Allow access to specific hunt" ON hunt_properties;  -- clean up old name from previous runs

-- IMPORTANT: The string below MUST exactly match the HUNT_ID constant in your index.html
create policy "Shared hunt access - full control for matching hunt_id"
on hunt_properties
for all
using (hunt_id = 'bd-kincardine-2026')
with check (hunt_id = 'bd-kincardine-2026');

-- (Optional) Uncomment the seed below only if you want to manually insert the first property right now.
-- Otherwise the dashboard will seed it automatically on first load.
-- Replace the JSON with the actual content from data.json if you use this.
/*
insert into hunt_properties (id, hunt_id, data)
values (
  'p-29727693',
  'bd-kincardine-2026',
  /* paste the full object for 14 Sunset Place here */ '...'::jsonb
)
on conflict (id) do update 
set data = excluded.data, 
    hunt_id = excluded.hunt_id;
*/
