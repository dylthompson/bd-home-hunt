# Push Done! Next: Connect to Netlify (Permanent Public Site)

Great! Your code is now on GitHub: https://github.com/dylthompson/bd-home-hunt

Now we connect it to Netlify so you get a real public HTTPS link (works on phone from anywhere, no more local server or 1-hour Drop limits).

## Step-by-step (your first time)

1. Open Netlify and start import:
   - Go to: https://app.netlify.com/start
   - Or directly: https://app.netlify.com/start/import

2. Choose Git provider:
   - Click "GitHub"

3. Authorize / select repo:
   - If prompted, authorize Netlify to access GitHub.
   - Find and select your repo: **bd-home-hunt**

4. Configure the site (important!):
   - **Owner**: your account
   - **Branch to deploy**: main (default)
   - **Base directory**: (leave BLANK — because index.html is at the root of the repo)
   - **Build command**: (leave completely BLANK — we don't need to build anything)
   - **Publish directory**: (leave BLANK or type `.` — Netlify will serve index.html from root)

   **Environment variables** (you can add these right here on this screen — recommended!):
   - Add `XAI_API_KEY` with your key from https://console.x.ai/
   - (Optional) Add `GROK_MODEL` = `grok-4.3`

5. Click "Deploy site"

Netlify will clone your repo and deploy. This takes 1-2 minutes.

6. After deploy:
   - You'll see a random URL like https://your-site-name.netlify.app
   - Click it to open. This is your permanent link.

7. Add your Grok API key (required for the "paste realtor.ca URL → auto analyze" feature):
   - In Netlify, click on your new site.
   - Left menu: **Site configuration** → **Environment variables**
   - Click "Add a variable"
   - Key: `XAI_API_KEY`
   - Value: paste your xAI/Grok API key (from https://console.x.ai/)
   - (Optional) Another variable:
     - Key: `GROK_MODEL`
     - Value: `grok-4.3` (or whatever model you prefer)
   - Save
   - Then go to **Deploys** tab → "Trigger deploy" → "Deploy site" (to pick up the env var)

8. Test on phone:
   - Open the netlify.app URL on your iPhone Safari.
   - It should work exactly like localhost but publicly.
   - Tap Share → "Add to Home Screen" for app-like experience (uses the manifest we added).

9. Share with partner:
   - Send them the same netlify.app URL.
   - They can also add to home screen.
   - Real-time sync via Supabase will work for both.

## Updating the site later
- Edit files locally (e.g. change something in index.html or the function)
- `git add .`
- `git commit -m "your message"`
- `git push`
- Netlify will automatically detect the push and redeploy (usually within a minute).

## Verify everything
- Open your site → click "+ Add Listing"
- Try the new "paste a realtor.ca URL" option (it should call the Netlify Function + Grok)
- Check the Functions tab in Netlify (left sidebar) to see logs if needed.

## If something looks wrong after deploy
- Check "Site configuration → General" and make sure Base directory is blank and Build command is blank.
- Make sure XAI_API_KEY is set and you redeployed.
- Functions not appearing? Double-check the repo on GitHub has a folder called `netlify/functions/analyze-listing.js`

You now have a real deployed site!

**Live URL:** https://bd-home-hunt.netlify.app/

(If you get stuck on any Netlify screen, tell me exactly what you see and I'll guide you.)

