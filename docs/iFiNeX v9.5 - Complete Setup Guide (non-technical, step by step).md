# iFiNeX (web v9.4 · app v2.10.0 · database v9.5) — Complete Setup Guide
Written for someone who has never set up a server. Do the steps in order. Do not skip. If a step says "expect X", and you see something else, stop and use Part 9.

## Part 0 — What you are building (2 minutes)
- **Database + login + backups server = Supabase** (free account is enough to start).
- **Website = GitHub Pages** (free). It is plain files, nothing to install.
- **Android app = the same website wrapped as an app** (built by GitHub, or by Android Studio on your PC).
- **Google Drive backup = optional**; needs a free Google Cloud "OAuth client" (Part 6).
You need: an email address, a computer, 2–3 hours the first time.

## Part 1 — Accounts (10 min)
1. Supabase: https://supabase.com → Sign up → New project. Pick the region closest to your users. Save the **database password** somewhere safe.
2. GitHub: https://github.com → Sign up.
3. (Optional) Google account for Drive backup. (Optional) Android phone.

## Part 2 — Database (20 min)
Supabase → your project → left menu **SQL Editor** → **New query**. For each file below: open the file, select all, copy, paste into the editor, click **Run**. Wait for "Success".
### 2A. NEW empty project (fresh install / clone)
1. Dashboard → Database → Extensions → switch ON: `pg_cron`, `pg_net`, `supabase_vault` (if they are not already on).
2. Run **`3 - iFiNeX v9.5 - Database FULL (no data) - clone a new DB.sql`**. It builds everything (tables, privacy rules, squads, Google Drive tables, scheduler, IO fix). The last result shows the CHECK numbers — read them (Part 9 if anything is off).
3. Point the Drive scheduler at YOUR project. Run, replacing NEWREF with your project reference (Settings → General → Reference ID):
```
select vault.update_secret(
  (select id from vault.secrets where name = 'gdrive_function_url'),
  'https://NEWREF.supabase.co/functions/v1/gdrive-backup/run-due');
```
4. Make yourself the first admin: run `SELF-HOST - first admin (run after FULL no data).sql` from the `sql` folder of the complete project (edit your email in it first).
5. Copy your project's address and key: Settings → API → **Project URL** and **anon / publishable key**. You need them in Part 3.
### 2B. Cloning WITH your data
1. On the OLD (live) project run **`6 EXPORT - run on live DB to get a with-data clone script.sql`**. You get one cell named `restore_script`. Click the cell and use **Copy** (not Export/Download as markdown or CSV: those corrupt the file) → paste into Notepad → save as `restore_data.sql`.
2. On the NEW project do 2A first, then paste `restore_data.sql` → Run. (People reconnect Google Drive and re-enable phone alerts after a clone; device and Drive secrets are deliberately not copied.)
### 2C. Your EXISTING live project (already running) — only run what is missing
Already applied: Pack A, multi-squad, Google Drive part 1 and 2. **Now run: `5 IO FIX - reduce database writes.sql`** (stops the Supabase "Disk IO Budget" warning). Still pending: Pack B (needs a new `CRON_SECRET`; ask Claude to prepare it).

## Part 3 — Website on GitHub Pages (15 min)
1. GitHub → **New repository** → name e.g. `ifinex-web` → Public → Create.
2. **Add file → Upload files** → drag everything from the `web` folder (or `WEBSITE_REPO`) → **Commit changes**.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save. After 1–2 minutes your site is `https://YOUR-USER.github.io/ifinex-web`.
4. Connect the site to Supabase: in the repo open `ifinex-config.json` (copy from `ifinex-config.example.json`), fill `supabaseUrl` and `supabaseKey` from Part 2, commit.
5. Supabase → Authentication → URL Configuration → set **Site URL** to your site address and add it to **Redirect URLs**.
6. Open the site. Log in with your email; the code arrives by email. Expect: the app opens.
Local preview on your PC (optional): in the web folder run `python3 -m http.server 8183`, open http://localhost:8183.
The pages `privacy.html` and `terms.html` must be in the repo (Google requires them). **Open them and check the contact email shown is the one you want public.**

## Part 4 — Email codes (10 min)
Supabase's built-in email is rate-limited. For real users: Supabase → Authentication → SMTP Settings → add a mail provider (e.g. Resend, Brevo). Without it, only a few login codes per hour work.

## Part 5 — Android app (30–60 min)
### Route A: GitHub builds it (no Android Studio)
1. Create a second repository `ifinex-app`. Upload the contents of `APP_REPO` / `mobile` (package.json, www, android…).
2. Create the signing key once (guide: `docs/… Signing Key & Auto-Update Guide.md`). It makes every update install over the old app.
3. Repository → Actions → run the build → download the APK from the run's Artifacts.
### Route B: Android Studio
1. Install Android Studio and Node.js (LTS).
2. In the folder that contains `package.json` open a terminal: `npm install` then `npx cap sync android`.
3. Android Studio → File → Open → the `android` folder → Build → Build APK(s).
4. Copy the APK to the phone, allow "install unknown apps", install.
Always raise the version before a new build (`tools/bump-version.sh`) or Android refuses to update.

## Part 6 — Google Drive backup (optional, 45 min)
Follow `iFiNeX Web v9.4 & Mobile App v2.10 - Google Drive Setup & User Guide.md` exactly. Short version:
1. Google Cloud Console → new project → APIs → enable **Google Drive API**.
2. OAuth consent screen: App name, support email, **privacy link** `https://YOUR-SITE/privacy.html`, **terms link** `…/terms.html`, authorized domains = your site's domain and `YOUR-REF.supabase.co`. **Do NOT upload a logo** (forces a Google review). Publishing status → **In production** (otherwise logins stop after 7 days).
3. Credentials → Create **OAuth client ID** → *Web application* → redirect URI `https://YOUR-REF.supabase.co/functions/v1/gdrive-backup/callback`. Copy Client ID and Client Secret.
4. Supabase → Edge Functions → New function `gdrive-backup` → paste `EDGE_FUNCTION/index.ts` → **Verify JWT OFF** → Deploy.
5. Edge Functions → Secrets → add: `GOOGLE_CLIENT_ID` (copy exactly, ends in `.apps.googleusercontent.com`), `GOOGLE_CLIENT_SECRET`, `GDRIVE_ENC_KEY` (a long random value — you make it yourself, e.g. run `select replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');` in the SQL editor and copy the result; keep a safe copy, losing it means everyone must reconnect), `SITE_URL` (your website address, no trailing slash).
6. In the app: Settings → Google Drive → choose account → set schedule (daily / weekly / monthly / custom). Backups start up to 1 hour after the chosen time (hourly scheduler).

## Part 7 — Keep it healthy
- Supabase → Reports → Database → **Disk IO**. After `5 IO FIX` it should stay low. If Supabase emails "running out of Disk IO Budget" again, send the email to Claude; the next step is polling every 5 minutes (app 2.11) or a larger compute plan.
- Supabase free projects pause after a week of no use; opening the dashboard and clicking Restore fixes it.
- Update routine: change files → upload to GitHub → hard refresh. App: raise version, rebuild, install over the old one.
- Back up: Google Drive schedule + occasional `6 EXPORT` file stored somewhere private. **Never put a with-data file on GitHub.**

## Part 8 — Using it (one paragraph each)
Squads: each group has its own expenses, settlements and people; admins add people and archive squads from Settings. Bill Tracker: cards, payees, plans, reminders; alerts reach Android through the background poll. Backup & Restore: the ☰ menu has export/import. Everything per person is private to that person's email.

## Part 9 — When something goes wrong
| You see | Meaning | Fix |
|---|---|---|
| SQL "unterminated dollar-quoted string" | the paste was cut off | paste the whole file again; use select-all |
| Google "Error 401: invalid_client" | wrong `GOOGLE_CLIENT_ID` secret | re-copy it, no spaces/quotes, redeploy |
| Google "Error 403: access_denied" | consent screen still *Testing* | publish to In production (Part 6.2) |
| App says "not switched on" for Drive | edge function/secrets missing | Part 6 steps 4–5 |
| "App not installed" on update | different signing key or lower version | same key + higher version, or uninstall first (data stays in the cloud) |
| Login code never arrives | built-in email limit | Part 4 |
| CHECK query shows 0 / false | a script did not finish | re-run that file; it is safe to run twice |
| Supabase "Disk IO Budget" email | too many small writes | run `5 IO FIX` |
Not tested on real hardware by Claude: the real Google sign-in, real Android devices, real email delivery. Everything else was tested against stand-ins.
