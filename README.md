# BD Home Hunt — Realtime Collaborative Version (Supabase)

This is the **live sync** edition of the beautiful Kincardine home hunt dashboard.

**Important architecture reminder:**
- Supabase = your backend (database + realtime)
- This folder = a static frontend (index.html + JS)
- You must host the static files somewhere (Netlify, GitHub Pages, etc.) to get a phone link

Changes (stars, showings, pros/cons, notes, new listings) made by either of you appear on the other person's screen within seconds — no manual export/import.

## Quick Start (after Supabase is set up)

1. The fastest way to get a real link for your phone:  
   Go to https://app.netlify.com/drop  
   Drag the entire `home-hunt-supabase` folder onto the page  
   Copy the URL it gives you and open it on your iPhone

2. For development/testing on this Mac: just double-click `index.html` or run `python3 -m http.server 8000` and open http://localhost:8000

See `LOCAL_ACCESS.txt` in this folder for the simplest phone instructions.

The UI, the prompt, the cards, the tabs — everything is the same. The only difference is the data layer talks to Supabase instead of (or in addition to) localStorage.

## Files

- `index.html` — The full app with Supabase + realtime wired in.
- `SUPABASE_SETUP.md` — Step-by-step (most important file).
- `schema.sql` — The exact SQL to paste into Supabase.
- `PROMPT.md` — Same master prompt for turning realtor.ca URLs into importable JSON.
- `data.json` — Optional seed data.

## How to Deploy This Version

Exactly the same as the static version:
- GitHub Pages
- Netlify Drop (drag the whole folder or just the html + any assets)
- Cloudflare Pages, etc.

The Supabase connection is in the client code, so the hosted version will be fully realtime for anyone who has the file (and knows the HUNT_ID secret).

## Security Note

The current setup uses the Supabase anon key + a secret `HUNT_ID`. This is appropriate for personal/couple use. The data is only as private as your `HUNT_ID` string.

When you're ready for proper per-user accounts, let me know and we'll upgrade to full Supabase Auth + user-based RLS.

## Differences from the static version

- "LIVE" badge when Supabase is connected.
- All mutations (stars, showings, adding properties, etc.) call `syncPropertyToSupabase`.
- Realtime listener merges incoming changes from the other person and refreshes the UI.
- Still has localStorage as a backup/offline layer.

Enjoy the much better house hunt. This is the version that actually feels like a modern collaborative tool.

Open `SUPABASE_SETUP.md` and let's get it connected.