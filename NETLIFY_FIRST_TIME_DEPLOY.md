# First-Time Netlify Deploy Guide for BD Home Hunt

This guide is written for someone who has **never used Netlify before**. It walks through everything step by step.

## What We're Doing

You have two parts:
- **Frontend** (the website): `index.html`, `manifest.json`, CSS/JS inside the HTML, etc. This is static.
- **Backend logic** (the "Analyze with Grok" feature): The file at `netlify/functions/analyze-listing.js`. This is a serverless function that runs on Netlify's servers.

Netlify will host both the static files **and** the serverless function for free.

## Prerequisites (do these first)

1. Your code must be in a GitHub repository.
   - The folder `home-hunt-supabase` (or whatever you named it) should be the root of the repo, or you will point Netlify to the correct subfolder.
   - Make sure `index.html` and the `netlify/functions/` folder are present.
   - Your `index.html` must already have the correct Supabase values filled in (SUPABASE_URL, SUPABASE_ANON_KEY / publishable key, and HUNT_ID).

2. You need an xAI API key for Grok.
   - Go to https://console.x.ai/
   - Create an account / log in.
   - Generate an API key. Copy it somewhere safe (you'll only see it once).

3. You should already have your Supabase project set up (table `hunt_properties`, RLS policy, etc.).

## Step-by-Step: Deploy on Netlify

### Step 1: Create a Netlify account and connect GitHub

1. Go to https://app.netlify.com/
2. Click **Sign up** (or Log in).
3. Choose **Sign up with GitHub** (recommended, since you want to link GitHub).
4. GitHub will ask you to authorize Netlify. Click **Authorize**.
5. You may be asked to choose which repositories Netlify can access.
   - Choose **Only select repositories** → select the repo that contains your `home-hunt-supabase` code.
   - Or choose all if you're comfortable.
6. Finish the signup. You should land on the Netlify dashboard ("Sites" or "Overview").

### Step 2: Create a new site from Git

1. In the Netlify dashboard, click the big green **"Add new site"** button (top right).
2. Choose **"Import an existing project"**.
3. Under "Deploy with Git", click the **GitHub** button.
4. You will see a list of your GitHub repos. Find the one with your house hunt code and click it.
5. Netlify will now show the "Configure site and deploy" screen.

### Step 3: Configure the build settings (very important for first-timers)

This is where most new users get confused. Read carefully.

**Critical: Repository structure**

Your GitHub repo should have `index.html` and the `netlify/` folder at the level you want Netlify to see.

Recommended (easiest):
- Push so that the contents of your `home-hunt-supabase` folder are at the **root** of the GitHub repo.
  That means the repo directly contains:
  - index.html
  - manifest.json
  - netlify/functions/analyze-listing.js
  - etc.

If instead your repo has a folder called `home-hunt-supabase` inside it, you will need to use "Base directory".

Now the fields:

- **Owner**: Your account or team (usually just your name).
- **Branch to deploy**: Usually `main` or `master`. Leave the default.
- **Base directory**:
  - If `index.html` is directly in the repo root (recommended), leave this **blank**.
  - If your code lives inside a subfolder named `home-hunt-supabase`, type `home-hunt-supabase` here.
- **Build command**: Leave this **completely empty**. 
  - We have no build step. Pure static files + serverless function.
- **Publish directory**:
  - Leave blank or set to `.` (Netlify will serve from the root / base directory).

Click **"Deploy site"**.

Netlify will now clone your repo, build (nothing), and deploy. This usually takes 30–90 seconds.

### Step 4: Add the required environment variable (XAI_API_KEY) — do this in the configure screen if possible

**Yes — you can (and should) add the environment variables right there in the "Configure site and deploy" screen** before clicking Deploy site. This is actually better because your very first deploy will have the key available, and the "Analyze with Grok" feature will work immediately.

Look for the **"Environment variables"** section on that same configure page (it's usually near the bottom).

Add these:

- **Key**: `XAI_API_KEY`
- **Value**: Paste your actual xAI / Grok API key (the long string starting with `xai-...` from https://console.x.ai/)

- (Optional but recommended) 
  - **Key**: `GROK_MODEL`
  - **Value**: `grok-4.3`   (or `grok-4.3-latest` if you prefer)

Leave "Scopes" as the default (all deploys).

Then click **"Deploy site"**.

If you already clicked Deploy before adding the variables, no problem — just go to the site after it deploys, go to **Site configuration → Environment variables**, add them there, then trigger a new deploy from the Deploys tab.

This environment variable is **critical** for the "Analyze with Grok" (direct URL) feature to work. The key never touches the browser — it only lives on Netlify's servers for the function.

### Step 5: Find your live URL and check the function

- In the site dashboard, at the very top you will see something like:
  `https://your-site-name.netlify.app`
- Or it might say "Site is live at ..." with a button to open it.

This is your permanent public link. Open it on your phone right now.

**Verify the serverless function is working:**

1. Go to your site in Netlify.
2. In the left menu click **"Functions"**.
3. You should see `analyze-listing` listed.
4. Click it — you can see logs here later when you use the "Analyze with Grok" button in the app.

If you don't see the Functions tab or the function, double-check that the folder `netlify/functions/analyze-listing.js` exists in what Netlify published.

### Step 6: Test the new "paste URL" feature

1. Open your deployed site.
2. Click **"+ Add Listing"**.
3. In the new section "Or paste a realtor.ca URL", paste any realtor.ca listing URL.
4. Click the teal button **"Analyze with Grok & Add"**.
5. Wait 10–25 seconds (it fetches the page + calls Grok).
6. The property should appear in the grid, with the AI analysis filled in.

If it fails with "Analysis failed: Unexpected token '<', \"<!DOCTYPE\"... is not valid JSON":

This error means the frontend tried to do `res.json()` but got HTML (a <!DOCTYPE page) instead of JSON from the function.

**Most common causes on first deploy:**
- The `netlify/functions/analyze-listing.js` was not included because Base directory / Publish directory was set incorrectly.
- You haven't set the `XAI_API_KEY` environment variable yet (or didn't redeploy after setting it).
- This is still the initial deploy and functions haven't been built yet.

**Fix:**
1. In Netlify dashboard for the site, go to **Site configuration → General** and verify:
   - Base directory (blank if index.html is at repo root, or `home-hunt-supabase` if it's a subfolder)
   - Publish directory (usually `.` or blank)
2. Make sure `XAI_API_KEY` is added under **Environment variables**, then click **Deploys** tab → "Trigger deploy" → "Deploy site".
3. After deploy, go to the **Functions** tab (left sidebar). You should see `analyze-listing`. Click it — this shows the real logs and errors from the function. This is the best place to debug.

**Do I need to add tokens/credits to my xAI account first?**

**Yes, almost always.**

The xAI Grok API requires you to have added a payment method and purchased credits at https://console.x.ai/ .

Many people sign up and generate a key, but until you add billing, API calls return errors (401/403/402). The function now gives clearer messages about this.

Even with a valid key, if there are no credits the call fails.

After adding credits on console.x.ai, redeploy the site and try again.

### Step 7: Add to Home Screen on iPhone (makes it feel like an app)

1. On your iPhone, open the Netlify URL in Safari.
2. Tap the Share icon (square with arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Give it a short name (e.g. "BD Hunt") and tap Add.
5. You now have an app icon. It will open full-screen and feel native.

### Optional but nice later

- Custom domain (Settings → Domain management).
- Connect a real GitHub repo properly so every push auto-deploys (you are already doing the linking step).
- In Netlify, you can see function logs, deploy previews, etc.

## Common First-Time Gotchas

- "My site shows a blank page or old version": Make sure you set the Publish directory correctly and triggered a new deploy after setting env vars.
- "Analyze URL button does nothing or errors": Almost always the `XAI_API_KEY` is missing or wrong. Check the function logs.
- "Functions not found": Make sure the folder structure has `netlify/functions/analyze-listing.js` at the root of what Netlify is publishing.
- "Still seeing the old local version": You're probably still opening the file from your computer instead of the netlify.app URL.

## After This Deploy

You now have a real public link that:
- Works on any phone from anywhere.
- Stays live as long as you keep the Netlify site.
- Uses your Supabase for data (so changes sync between you and your partner instantly).
- Can use the direct "paste realtor.ca URL" feature with Grok doing the work in the background.

If you want a more "professional" setup later (proper repo structure, branch previews, custom domain, etc.), just ask and we can refine it.

You're doing great — this is exactly the kind of thing that feels confusing the first time but becomes second nature quickly. 

Let me know what you see when you try the deploy or when you test the Analyze button!