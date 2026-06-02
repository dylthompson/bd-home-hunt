# Supabase Realtime Setup for BD Home Hunt

This turns the beautiful static dashboard into a **live collaborative app**. Changes by either of you (ratings, showings, notes, adding new listings) appear instantly for the other person.

## Important Architecture Note (this is why you were confused)

- **Supabase** = your live backend (Postgres database + realtime subscriptions + Row Level Security)
- **The dashboard** (`index.html` + `manifest.json`) = a static website (just HTML + JavaScript + CSS)

Static websites need to be **hosted** somewhere (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.).
Supabase does **not** host your frontend files.

This is why just setting up Supabase doesn't automatically give you a phone link.

## Best way to use on your phone (and share with your partner)

**Deploy the static files (30 seconds, recommended):**

1. Go to https://app.netlify.com/drop
2. Drag the entire `home-hunt-supabase` folder from Finder onto the drop zone
3. Copy the public URL it instantly gives you (e.g. `https://amazing-unicorn-123.netlify.app`)
4. Open that URL on your iPhone
5. Tap Share → "Add to Home Screen" (it will feel like a real app)

Once deployed:
- The link works from anywhere (Wi-Fi or cellular)
- Your partner can use the exact same link
- Realtime sync still works perfectly through Supabase
- You can re-drag the folder later to update

See the `LOCAL_ACCESS.txt` file in this folder for the exact same instructions.

---

## How to test locally on your computer (while developing)

You have two easy ways:

### Option A — Quickest (double-click)
1. Open Finder.
2. Navigate to the folder: `/Users/frodo/home-hunt-supabase/`
3. Double-click the file `index.html`.
4. It will open directly in your default browser (Safari, Chrome, etc.).

### Option B — Better (clean http:// URL)
Run this in Terminal:

```bash
cd /Users/frodo/home-hunt-supabase
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

Once open:
- You should see the **green "LIVE" badge** next to "BD Hunt" in the header if the Supabase connection succeeded.
- Open the browser console (right-click the page → Inspect → Console tab) and look for:
  - Green log: `[Supabase] Client initialized for hunt: bd-kincardine-2026`
  - `[Supabase Realtime] Status: SUBSCRIBED`
- The 14 Sunset Place property should be there. Try clicking stars or adding a showing — then open the same URL in a second tab/window and see if it updates live.

**Pro debugging tip:** In the browser console, type `BD_HUNT.testSupabase()` and press Enter. It will run a live query and tell you if the connection + hunt_id is working.

**Success checklist** (what you should see once everything is good):
- Green "LIVE" badge in header.
- Status pill next to stats says "Live" (green dot).
- Console shows: Client initialized, Loaded X properties, Realtime Status: SUBSCRIBED, and testSupabase reports count > 0 with no error.
- Changes made in one tab appear in another tab within seconds.

If you see a transient CHANNEL_ERROR followed by SUBSCRIBED, that's normal — the code now auto-retries.

---

# The rest of this document is for the one-time Supabase backend setup (you probably already did this)

## 1. Create a free Supabase project

1. Go to https://supabase.com and sign in (or create account with GitHub/Google).
2. Click **New Project**.
3. Name: `bd-home-hunt` (or whatever).
4. Choose a region close to you (e.g. US East or whatever is lowest latency).
5. Set a strong database password (save it somewhere safe).
6. Click **Create new project**. Wait ~1-2 minutes.

## 2. Get your project credentials

Once the project is ready:

1. In the left sidebar, go to **Project Settings** (gear icon) → **API**.
2. Copy these two values:
   - **Project URL** (looks like `https://abcdefghijklmnop.supabase.co`)
   - Under API keys, look for either:
     - The classic **anon** key (long string starting with `eyJhbGci...`)
     - Or the modern **Publishable key** (starts with `sb_publishable_...`)

   Both should work with the current dashboard code. Paste whichever you have into the `index.html` file (the one you already did is fine if it starts with sb_publishable_).

You will paste these into the `index.html` file (see the CONFIG section near the top of the `<script>`).

## 3. Create the database table + RLS (run this as ONE query)

**Best way:** Open the file `schema.sql` (in the same folder as this guide) in any text editor, copy its **entire** contents, paste it into the Supabase SQL Editor as **one single query**, and click **Run**.

This file now contains everything in the correct order (table, trigger, realtime enable, index, RLS, and policy).

If you prefer not to open the file, you can also paste this complete block below as one query:

```sql
-- 1. Create the main table
create table if not exists hunt_properties (
  id text primary key,
  hunt_id text not null,
  data jsonb not null,
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
alter publication supabase_realtime add table hunt_properties;

-- 4. Helpful index for queries filtered by hunt
create index if not exists idx_hunt_properties_hunt_id on hunt_properties(hunt_id);

-- 5. Enable Row Level Security
alter table hunt_properties enable row level security;

-- 6. Policy: full read/write access only for the matching hunt_id
-- IMPORTANT: The string below MUST exactly match the HUNT_ID constant in your index.html
create policy "Shared hunt access - full control for matching hunt_id"
on hunt_properties
for all
using (hunt_id = 'bd-kincardine-2026')
with check (hunt_id = 'bd-kincardine-2026');
```

**If you get errors** (very common after partial previous runs), especially:
- "relation "hunt_properties" is already a member of publication "supabase_realtime""
- "policy ... already exists"

Use the **safe idempotent version** below, **or** open the new `fix-schema.sql` file in the folder (I created it just for this situation), copy the whole thing, and run as one query.

(The `schema.sql` file has also been updated with the safe versions.)

Copy the whole thing below and run as **one single query**:

```sql
-- 1. Create the main table (safe)
create table if not exists hunt_properties (
  id text primary key,
  hunt_id text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Function + trigger (safe)
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

-- 3. Enable realtime - SAFE version
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

-- 5. Enable RLS (safe to re-run)
alter table hunt_properties enable row level security;

-- 6. Policy - SAFE (drops old versions first)
DROP POLICY IF EXISTS "Shared hunt access - full control for matching hunt_id" ON hunt_properties;
DROP POLICY IF EXISTS "Allow access to specific hunt" ON hunt_properties;

create policy "Shared hunt access - full control for matching hunt_id"
on hunt_properties
for all
using (hunt_id = 'bd-kincardine-2026')
with check (hunt_id = 'bd-kincardine-2026');
```

**Since you already ran the two separate blocks**, run the safe block above now. It should succeed without errors.

After re-running, run this small verification query in the SQL Editor to check everything looks good:

```sql
-- Verification query - run this after the schema
select 
  count(*) as total_properties,
  count(*) filter (where hunt_id = 'bd-kincardine-2026') as for_our_hunt
from hunt_properties;

-- Also check if realtime is enabled for the table
select * from pg_publication_tables 
where pubname = 'supabase_realtime' 
  and tablename = 'hunt_properties';
```

**Security note**: The anon/publishable key is public (it's in the client code). Security comes from:
- The hunt_id being a secret string only you and Bronwynne know.
- Not sharing the full `index.html` publicly.

For stronger security later, we can add proper Supabase Auth (magic links for each of your emails) + policies based on `auth.uid()`.

## 5. (Recommended) Add proper Auth later (optional now)

For now the shared hunt_id works great. When you want accounts:

- Go to Authentication → Providers → Enable Email.
- In the app we can add a sign-in screen.
- Update policies to be user-based (I can help upgrade the schema).

## 4. Configure the dashboard (you've mostly done this)

1. Open `index.html` in this folder.
2. Make sure the three constants near the top of the script match your Supabase project and the hunt_id you used in the policy:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY (or publishable key)
   - HUNT_ID (must exactly match the one in the policy, currently 'bd-kincardine-2026')

3. Save the file.

## 5. Open the dashboard in your browser

See the top of this file ("How to open / access the dashboard in your browser").

Use **http://localhost:8000** (the server is running) or double-click index.html.

### On your iPhone (quick local test)

1. Make sure your iPhone is on the **same Wi-Fi** as this Mac.
2. On iPhone Safari, open: **http://192.168.50.139:8000**
3. It should load the exact same dashboard (data comes from Supabase, so it's in sync with your laptop).
4. For the best experience: tap the **Share** button → **Add to Home Screen**. It will install as a standalone app with the house icon (no browser chrome).

**Limitations of local Wi-Fi access:**
- Mac must stay awake with the server running.
- Only works on the same network (not from cellular, not for your partner if she's elsewhere).
- When you're ready for real use (anywhere, for both of you), deploy it (see below).

### Deploy for real iPhone + partner use (recommended)

Once local testing (including two-tab sync) works, deploy so it has a public URL:

**Fastest for a real permanent site (via Git):**
Once your code is pushed to GitHub:

1. In Netlify, go to "Add new site" → "Import an existing project" → GitHub.
2. Select your repo.
3. On the configure screen:
   - Base directory: blank
   - Build command: blank
   - Publish directory: `.` or blank
   - **Environment variables** (on this same screen): add `XAI_API_KEY` with your key from console.x.ai (and optionally `GROK_MODEL`)
4. Deploy.

This is much better than Drop because you get proper Git integration and the env var is set from the first deploy.

This is the best way for ongoing use. Updates are just re-dragging the folder when you change something.

Reload the page after re-running the schema.

## 6. Test live sync

- Open the page in two tabs (or send the folder to Bronwynne so she opens it too).
- Make a change in one (e.g. rate the property or log a showing).
- Watch the other tab update automatically.

## 7. Seed the first property (14 Sunset Place)

The dashboard will automatically seed the example property from data.json the first time it connects to a fresh hunt.

If you want to force it, there is a commented example in the schema.sql.

## 8. Deploy for easier sharing (optional but nice)

Once everything works locally:
- The easiest is Netlify Drop: go to https://app.netlify.com/drop , drag the whole `home-hunt-supabase` folder (or at least index.html + data.json).
- You get a public URL you can both bookmark.
- Any time you change constants or want to update, just drag again.

GitHub Pages also works great (commit the folder).

## Troubleshooting / Verification

After re-running the schema:

1. In Supabase SQL Editor run the verification queries shown above (the count one and the realtime one).

2. In Supabase → Table Editor, you should see the `hunt_properties` table. If you have data, you'll see rows.

3. In the browser, after reloading http://localhost:8000 :
   - Look for the green LIVE badge.
   - Check the Console (F12) for the "Client initialized" and "SUBSCRIBED" messages.
   - If you see a red warning banner at the top of the page, the connection failed — the console will have the details.

Common issues:
- Policy hunt_id string doesn't exactly match the one in index.html.
- You copied only part of the SQL (now fixed — use the full schema.sql or the combined block).
- Using the wrong key (try the other format — publishable vs the eyJ... anon key).

## New Feature: Direct URL Analysis (no more manual prompt copying)

Once you have deployed to Netlify and set the environment variable:

In the "Add new listing" modal you will see a new option:

"Or paste a realtor.ca URL"

Just paste the listing URL and click "Analyze with Grok & Add".

What happens in the background:
- Netlify Function fetches the realtor.ca page (server-side)
- Sends the content + a specialized extraction prompt to the Grok API using your XAI_API_KEY
- Parses the response into the exact schema the app expects
- Imports it and syncs via Supabase

**Setup (one time):**
In Netlify dashboard for your site:
- Environment variables → Add
  - Key: `XAI_API_KEY`
  - Value: your key from https://console.x.ai/
- (Optional) `GROK_MODEL` = grok-4.3 (or grok-4.3-latest etc.)

Redeploy once after adding the variable.

The old manual "paste JSON" flow still works as a fallback.

This is now the primary way to add new listings. The long prompt is baked into the serverless function.

Paste the output of the verification SQL and/or the browser console messages here if it's still not showing LIVE or not loading the property, and I'll help debug the exact error.

- Open the dashboard.
- It should automatically load the seed from `data.json` on first run if the table is empty, or you can use the normal "Add Listing" flow later.
- Or run this one-time in SQL Editor (replace the JSON as needed):

```sql
insert into hunt_properties (id, hunt_id, data)
values (
  'p-29727693',
  'bd-kincardine-2026',
  'PASTE_THE_FULL_JSON_FROM_data.json_HERE'   -- the first object in the array
)
on conflict (id) do update set data = excluded.data;
```

Easier: Just open the HTML locally once — the code will upsert the seed on first load if you kept the seeding logic.

## 9. How realtime works in practice

- Open the page on two devices/browsers (logged into the same hunt).
- On one device: Go into a property → give it 5 stars as Dylan → add a showing.
- On the other device: Within a couple of seconds the stars and showing list will update automatically.
- Adding new listings via the prompt + paste JSON also syncs.

## 10. Upgrading security later (when ready)

I can provide:
- A version with Supabase Auth (magic link sign-in for each of your personal emails).
- Policies that only allow your two user IDs.
- A `hunts` table + membership.

For now this gets you instant collab with almost zero extra complexity.

## Troubleshooting

- Changes not appearing? Check the browser console (F12) for Supabase errors. Common: wrong URL/key, RLS policy blocking, or hunt_id mismatch.
- Table not found: Make sure you ran the `create table` SQL.
- Realtime not working: Make sure you added the table to the realtime publication.

## Next level ideas (we can add)

- Per-user auth + proper accounts
- "Last edited by" indicators
- Conflict resolution UI (rare with this data model)
- Image uploads to Supabase Storage for showing photos
- Price history tracking

You're now one step closer to the industry-disrupting app. Let's get the config in place and test it.

If anything in the setup is confusing, paste the error here and I'll debug with you.