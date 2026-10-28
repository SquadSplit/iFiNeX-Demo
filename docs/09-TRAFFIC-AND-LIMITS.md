# 09 · Traffic, limits and cost control

Already built in: the app polls notifications only when the tab is visible (every 2 minutes), realtime pushes instant updates, API roles have statement timeouts (anon 3 s, authenticated 8 s) and an idle-in-transaction timeout (see `supabase/hardening.sql`).

You must configure in the dashboard (these cannot be set from SQL):
- **Authentication → Rate limits**: OTP e-mails per hour, sign-in/verify per IP.
- **Custom SMTP** (built-in e-mail is ~2 per hour).
- **Network restrictions** / SSL enforcement for the database (Project Settings → Database).
- **Spend cap** on (default) so a traffic spike cannot create a bill.
- Put the website behind Cloudflare (free) if you expect scraping/abuse; GitHub Pages already caches static files.
Optional browser web-push needs an Edge Function named `send-push` that you write yourself; the native Android alerts do not need it (they use `poll_notifications`).
