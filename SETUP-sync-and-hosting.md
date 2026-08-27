# Command Tower — Standalone App with Sync

This turns the tracker into a real, installable app — custom icon, splash screen, no browser address bar — that syncs across everyone's phones. Two one-time steps: set up a free sync backend (Supabase), then host the files. ~15–20 minutes total.

**You now have a small bundle of files, not just one.** Keep this exact structure — it's what makes the app icon, splash screen, and offline shell work:

```
index.html
manifest.json
sw.js
icons/
  icon-192.png
  icon-512.png
  icon-maskable-192.png
  icon-maskable-512.png
  apple-touch-icon.png
  favicon-32.png
  favicon-16.png
```

---

## Part 1 — Set up sync (Supabase, free, no card)

1. Go to **supabase.com** and create a free account.
2. Click **New project**. Give it any name, set a database password (save it somewhere), pick the closest region, and create it. Wait ~2 minutes for it to finish provisioning.
3. In the left sidebar open **SQL Editor** → **New query**, paste the block below, and click **Run**. This creates the tiny table the app uses and lets your players read/write it.

   ```sql
   create table if not exists rooms_kv (
     k text primary key,
     v text,
     updated_at timestamptz default now()
   );

   alter table rooms_kv enable row level security;

   create policy "anyone can use rooms"
     on rooms_kv for all
     using (true)
     with check (true);
   ```

4. In the left sidebar open **Project Settings** (gear icon) → **API**. Copy two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

5. Open `index.html` in any text editor. Near the top of the `<script>` section you'll see:

   ```js
   const SUPABASE_URL = "";
   const SUPABASE_ANON_KEY = "";
   ```

   Paste your two values between the quotes, save the file. Done — sync is now live.

> Note on the anon key: it's designed to be public (it ships in the app). Anyone with your app link can create/join game rooms, which is exactly what you want for a playgroup. It cannot touch anything else in your Supabase project.

---

## Part 2 — Host it as a website

Pick any one of these. All are free. The key thing: **upload the whole folder together**, so `manifest.json`, `sw.js`, and the `icons/` folder all sit next to `index.html` at the same level.

**Easiest — Netlify Drop**
1. Go to **app.netlify.com/drop**.
2. Drag the entire folder (containing `index.html`, `manifest.json`, `sw.js`, `icons/`) onto the page — not just the one file.
3. You get a live link instantly. Share it.

**GitHub Pages**
1. Create a repo. On the empty repo page, click **"uploading an existing file,"** then drag in all the files *and* the `icons` folder together (GitHub preserves folder structure when you drop a folder in).
2. Repo **Settings → Pages →** deploy from `main` branch, folder `/ (root)`.
3. Your link appears at `https://yourname.github.io/reponame/`.

**Cloudflare Pages / Vercel** — same idea; upload the whole folder, get a URL.

---

## Part 3 — Install it like a real app

Once hosted, open the link on your phone:
- **iPhone (Safari):** Share button → **Add to Home Screen**.
- **Android (Chrome):** you should see an **"Install app"** prompt, or ⋮ menu → **Install app**.

With the manifest and service worker in place, this now installs with your custom icon, opens full-screen with no browser bar, and the app shell loads even with a flaky connection (live game data still needs a connection to sync, but the app itself will open).

To play a synced game: one person taps **Host a synced game**, shares the room code — or the **Show QR** button for a scannable invite — and everyone else taps **Join**. Each phone controls its own life, poison, mana, commander damage, and triggers; the turn/round, monarch, dice, and chime stay in sync for the table.

---

## Good to know

- **Pass-and-play** always works with zero setup, even before you touch Supabase.
- **Free tier limits** are far beyond what a playgroup needs. If a Supabase project sits unused for a long stretch it can pause; just log in and unpause it.
- **Old rooms** pile up as rows in the table but are tiny. To wipe them, run `delete from rooms_kv;` in the SQL editor anytime.
- **Phones sleeping:** a locked phone may pause the app, so the turn chime can lag until the screen wakes. Keeping the app open on the table works best.
- **Updating the app later:** the service worker caches the app shell so it opens instantly and works offline, but it always checks the network first when you have a connection — so a fresh upload should show up immediately. If a device ever seems stuck on an old version, closing and reopening the app (or a hard-refresh in the browser) clears it.

