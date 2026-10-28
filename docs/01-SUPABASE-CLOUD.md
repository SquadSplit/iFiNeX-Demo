# 01 · Run iFiNeX on hosted Supabase (step by step, no experience needed)

**Time: ~20 minutes. Cost: free tier is enough for a household/squad.**

### Step 1 — Create the project
1. Go to https://supabase.com → *Sign in* → *New project*. Choose a name, a **strong database password** (save it in a password manager) and the region closest to you.
2. Wait until the dashboard says the project is ready.

### Step 2 — Create the database
1. Left menu → **SQL Editor** → *New query*.
2. Open `supabase/schema.sql` from this repository, copy **everything**, paste, press **Run**.
3. If it stops at `pg_cron`: Dashboard → *Database* → *Extensions* → enable `pg_cron`, run again. The script is safe to run twice.
4. Search the file for `YOUR-PROJECT-REF` and `__PUSH_SECRET__`. You only need to change them if you want browser push notifications (optional, see 09). The app works without.

### Step 3 — Make yourself the first admin
Run this in the SQL Editor (put your real e-mail and name):
```sql
insert into public.app_users (email, name, group_type, is_admin)
values (lower('you@yourmail.com'), 'Your Name', 'squad_split', true)
on conflict do nothing;
```
Only e-mail addresses listed in `app_users` can use the app; you add everyone else later inside the app (Admin → Users).

### Step 4 — Login by e-mail code
Dashboard → *Authentication* → *Providers* → **Email** enabled. Turn **off** “Confirm email” link style if you want 6-digit codes, and edit the *Magic Link* e-mail template to include `{{ .Token }}` so people receive the code. For more than a few e-mails per hour, configure **custom SMTP** (Authentication → SMTP) — the built-in sender is heavily rate limited.

### Step 5 — Copy two values
Dashboard → *Project Settings* → **API**: copy **Project URL** and the **anon / publishable key**. Never copy the `service_role` / secret key into the website.

### Step 6 — Connect the website
Either put them in GitHub repository variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the deploy workflow writes the config), or copy `web/ifinex-config.example.json` to `web/ifinex-config.json` and fill it in.

### Step 7 — Test
Open the site, enter your e-mail, type the code. You should land in the Hub. Done — continue with `06-GITHUB-PAGES.md`.

### Optional hardening (recommended)
Authentication → *Hooks* → *Before User Created* → select the function `private.hook_before_user_created` if you created it (see 08) so strangers cannot create accounts.
