-- ============================================
-- FIX / RE-RUN SCRIPT for BD Home Hunt
-- Use this if you got errors on the full schema
-- (especially "already a member of publication" or "policy already exists")
-- Paste and run as ONE query. Leave "Private" checked.
-- ============================================

-- 1. Table (safe)
create table if not exists hunt_properties (
  id text primary key,
  hunt_id text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. updated_at trigger (safe)
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

-- 3. Realtime - SAFE version (the one that usually fails on re-runs)
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

-- 4. Index (safe)
create index if not exists idx_hunt_properties_hunt_id on hunt_properties(hunt_id);

-- 5. RLS (safe)
alter table hunt_properties enable row level security;

-- 6. Policy - SAFE (cleans up previous policy names then creates the correct one)
DROP POLICY IF EXISTS "Shared hunt access - full control for matching hunt_id" ON hunt_properties;
DROP POLICY IF EXISTS "Allow access to specific hunt" ON hunt_properties;

create policy "Shared hunt access - full control for matching hunt_id"
on hunt_properties
for all
using (hunt_id = 'bd-kincardine-2026')
with check (hunt_id = 'bd-kincardine-2026');

-- After this succeeds, run the verification queries from SUPABASE_SETUP.md
