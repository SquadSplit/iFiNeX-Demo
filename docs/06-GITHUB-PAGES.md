# 06 · Publish the website on GitHub Pages

1. Create a GitHub account, then **New repository** → name e.g. `ifinex` → Public → Create.
2. Upload this project (drag the folder contents into the page, or `git push`).
3. *Settings* → *Pages* → Source: **GitHub Actions**.
4. *Settings* → *Secrets and variables* → *Actions* → **Variables** → add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (public values; skip both for standalone mode).
5. *Actions* tab → **Deploy website (GitHub Pages)** → *Run workflow*. After ~1 minute the page URL appears in the run.
6. In Supabase → Authentication → URL Configuration set **Site URL** to that page URL.
Want only a public demo? Run **Deploy interactive demo** instead (fake data, no backend).
