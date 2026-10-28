# 03 · Plain PostgreSQL (no Supabase)

The app speaks three network APIs, not SQL: **PostgREST** (tables), **GoTrue** (login), **Realtime** (live updates) plus Storage (background photos, optional). Plain Postgres alone is not enough; you add those services in front of it.

Minimal stack:
1. PostgreSQL 15+ with extensions `pgcrypto`, `uuid-ossp` (`pg_net` and `pg_cron` optional — only for push/reminders).
2. Create the roles and the `auth` pieces the schema expects: roles `anon`, `authenticated`, `service_role`; schema `auth` with functions `auth.uid()`, `auth.jwt()` (they read the JWT claims that PostgREST puts into `request.jwt.claims`); schema `storage` only if you use photos. The simplest way to get all of this correctly is to run the official Supabase Docker stack (guide 02) and connect only the services you need.
3. PostgREST pointed at schema `public`, JWT secret shared with GoTrue.
4. GoTrue (supabase/auth) for e-mail OTP login. 
5. Supabase Realtime service for `postgres_changes` (the app’s live notifications).
6. Load `supabase/schema.sql`.

If you remove Realtime the app still works but you get updates on refresh/polling only. If you cannot run these services, use **Standalone mode** (05).
