# Setting Up GitHub + Netlify (Step by Step)

You are here because you want a persistent public link for your phone (and to share with your partner) instead of a temporary local server or Netlify Drop.

## 1. Create a GitHub Repository (do this first)

1. Go to https://github.com/new
2. Repository name: something like `bd-home-hunt` or `kincardine-home-hunt`
3. Description (optional): "Kincardine area home hunt dashboard with realtime + Grok analysis"
4. **Important**: 
   - Make it **Public** (easiest for Netlify free tier) or Private.
   - **DO NOT** check "Add a README file", "Add .gitignore", or "Choose a license". Leave everything empty.
5. Click **Create repository**.

You will land on a page that says "Quick setup" with commands like:

git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main

**Copy those commands** — we'll use them in the next step.

## 2. Push your local code to GitHub

The folder `/Users/frodo/home-hunt-supabase/` is already initialized as a git repo with an initial commit.

Run these commands **exactly** (replace YOUR_USERNAME and REPO_NAME with what you chose):

```bash
cd /Users/frodo/home-hunt-supabase
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

If it asks for login, use your GitHub credentials (or a personal access token if 2FA is on).

After this, refresh your GitHub repo page — you should see all the files (index.html, netlify/functions/, etc.).

## 3. Connect the repo to Netlify

1. Go to https://app.netlify.com (log in with the same GitHub account).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Click the **GitHub** button.
4. Find and select the repo you just created.
5. On the "Configure site and deploy" screen:
   - **Branch to deploy**: main (default)
   - **Base directory**: leave blank (or type `home-hunt-supabase` if your repo has the code inside a folder)
   - **Build command**: leave completely blank
   - **Publish directory**: leave blank or put `.`
6. Click **"Deploy site"**.

Netlify will build and deploy it. You'll get a URL like `https://something-123.netlify.app`.

## 4. Add the Grok API Key (required for "paste URL" feature)

After the first deploy:

1. In Netlify, click on your new site.
2. Left sidebar: **Site configuration** → **Environment variables**.
3. Click **Add a variable**.
4. Add:
   - Key: `XAI_API_KEY`
   - Value: your key from https://console.x.ai/
5. (Optional) Add `GROK_MODEL` = `grok-3`
6. Save.
7. Go to **Deploys** tab → click **"Trigger deploy"** → **"Deploy site"**.

This makes the "Analyze with Grok" button work.

## 5. Open on your phone

Use the public netlify.app URL on your iPhone Safari.

Tap Share → Add to Home Screen for the best experience.

## 6. Updating later

Just edit files locally, commit, and `git push`.

Netlify will automatically deploy the new version.

## Troubleshooting

- If you don't see the "Analyze with Grok" working: check Environment variables + redeploy.
- Functions not showing in Netlify: check that `netlify/functions/analyze-listing.js` is at the correct level in the repo, and Base/Publish directories are set right.
- See the full `NETLIFY_FIRST_TIME_DEPLOY.md` in the folder for even more detail.

You're now set up for real persistence!

## Important: GitHub no longer accepts your account password for git push

If you're getting "login" or authentication errors when running `git push`, it's because GitHub stopped supporting plain passwords in 2021 for security reasons.

You must use a **Personal Access Token** (PAT) instead of your password.

### How to create a PAT (do this now):

1. I just opened https://github.com/settings/tokens for you.
2. Click the green **"Generate new token"** button (top right).
3. Choose **"Generate new token (classic)"**.
4. Give it a note like "BD Home Hunt deploy".
5. Set expiration (e.g. 90 days or No expiration for convenience).
6. Under "Select scopes", check the box for **repo** (this gives full control of repositories — the main one you need).
7. Scroll down and click **"Generate token"**.
8. **Copy the token** immediately (it starts with `ghp_` or similar). You will only see it once. Paste it somewhere safe (like a password manager).

### How to push using the PAT:

In your terminal, run the push command again:

```bash
cd /Users/frodo/home-hunt-supabase
git push -u origin main
```

When it prompts:
- Username: your GitHub username (dylthompson)
- Password: **paste the PAT you just copied** (it won't show as you type — that's normal)

It should work. The credential helper we set up (osxkeychain) will remember it for future pushes.

If it still complains, you can do:

```bash
git config --global --unset credential.helper
```

and try again (but we already set it correctly).

Once push succeeds, go back to the GITHUB_SETUP.md steps for connecting to Netlify.

