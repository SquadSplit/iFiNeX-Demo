# 02 · Self-host the whole Supabase stack with Docker

You need a Linux server (2 vCPU / 4 GB RAM minimum), a domain with HTTPS, Docker + Docker Compose.

1. Follow the official guide: https://supabase.com/docs/guides/self-hosting/docker (clone `supabase/supabase`, copy `docker/.env.example` to `.env`).
2. **Generate your own secrets** — never keep the example values: `POSTGRES_PASSWORD`, `JWT_SECRET` (≥ 32 chars), then create `ANON_KEY` and `SERVICE_ROLE_KEY` signed with that JWT secret (the official guide has a generator). Set `SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` to your https domain.
3. Configure SMTP in `.env` (`SMTP_HOST`, `SMTP_USER`, …) so login codes can be e-mailed. Set `GOTRUE_MAILER_AUTOCONFIRM=false`.
4. `docker compose up -d`. Put a reverse proxy (Caddy / nginx / Traefik) with TLS in front of Kong (port 8000). **Do not expose Postgres (5432) to the internet.**
5. Open Studio, SQL Editor, run `supabase/schema.sql`, then the first-admin SQL from `01-SUPABASE-CLOUD.md` step 3.
6. In `web/ifinex-config.json` use `supabaseUrl` = your domain and `supabaseKey` = your generated `ANON_KEY`.
7. Back up: nightly `pg_dump` of the `postgres` database and a copy of `.env` (store it off-server, encrypted).

Realtime, Auth, REST and Storage are all part of that stack; the app uses all four.
