# iFiNeX — shared expenses, bills, cards, trackers & budgets (open source)

One codebase, two ways to run:

| Mode | What it is | Needs a server? |
|---|---|---|
| **Standalone** | Everything is stored in your own browser / phone. Single user. | No |
| **Server** | Many users, e-mail-code login, live sync between website and phone app, shared Squad Split. | Yes — a Supabase backend you own |

Website = `web/` (plain HTML/JS, host anywhere static, e.g. GitHub Pages). Android/iOS = `mobile/` (Capacitor wrapper around the same website). Database = `supabase/schema.sql`.

**No real data, keys or URLs are in this repository.** You bring your own backend.

## Try it first (no setup)
`bash demo/build-demo.sh` then open `demo/dist/index.html` through any static server (`python3 -m http.server -d demo/dist 8181`). Two fictional users (website + phone) with a realtime event feed. Or enable the *Deploy interactive demo* workflow.

## Pick your path
| I want… | Read |
|---|---|
| Quickest: hosted Supabase (free tier) | `docs/01-SUPABASE-CLOUD.md` |
| Everything on my own server (Docker) | `docs/02-SUPABASE-SELF-HOSTED-DOCKER.md` |
| Plain PostgreSQL I already run | `docs/03-PLAIN-POSTGRES.md` |
| MySQL / MariaDB / SQL Server | `docs/04-MYSQL-MSSQL.md` (read this — it is an honest "not directly") |
| Single user, no server | `docs/05-STANDALONE-MODE.md` |
| Publish the website | `docs/06-GITHUB-PAGES.md` |
| Build the Android app | `docs/07-ANDROID.md` |
| Lock it down before real users | `docs/08-SECURITY-CHECKLIST.md` · `docs/09-TRAFFIC-AND-LIMITS.md` |

## Layout
```
web/       website (+ ifinex-config.example.json)
mobile/    Capacitor Android + iOS projects (mobile/www is a copy of web/, refresh with tools/sync-www.sh)
supabase/  schema.sql (tables, RLS, functions)  ·  hardening.sql (already included in schema.sql; for upgrading old installs)
demo/      interactive realtime demo
docs/      guides      .github/workflows/  deploy-web · deploy-demo · android-build
```
License: MIT (see LICENSE). Security: see SECURITY.md.
