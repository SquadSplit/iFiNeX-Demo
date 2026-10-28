# 04 · MySQL, MariaDB, SQL Server, Oracle…

**Straight answer: the shipped app cannot run on them as-is.**

Why: the app does not send SQL. It calls a Supabase-compatible API (`/rest/v1`, `/auth/v1`, realtime websockets) and relies on PostgreSQL features for security: Row Level Security policies, `plpgsql` functions (`SECURITY DEFINER` RPCs), JWT claims in SQL (`auth.uid()`), views and triggers. MySQL/MariaDB/SQL Server have no equivalent of Postgres RLS, and the schema file is PostgreSQL syntax.

Your real options:
1. **Use PostgreSQL** (cloud Supabase, self-hosted Supabase, or Postgres + the services in 03). This is the supported path.
2. **Keep MySQL/MSSQL for your other systems** and run a small PostgreSQL only for iFiNeX.
3. **Port it yourself (a development project, not a setting):** write a backend that implements the same HTTP contract (list below) on top of your database, with authorization enforced in code because there is no RLS, then point `supabaseUrl` at it.
   - Tables + columns: see `supabase/schema.sql`.
   - `GET/POST/PATCH/DELETE /rest/v1/<table>` with PostgREST filters used by the app: `eq`, `neq`, `ilike`, `in`, `contains`, `not.in`, `order`, `limit`, `range`, `select=*`, `Prefer: return=representation`, upsert with `on_conflict`.
   - `POST /rpc/<fn>` for: delete_owed_entry, delete_settlement_entry, delete_payee_entry, delete_payee_with_reason, register_device, unregister_device, poll_notifications, ifx_restore_rows, ifx_bulk_import.
   - Auth: `/auth/v1/otp`, `/auth/v1/verify`, `/auth/v1/token?grant_type=refresh_token`, `/auth/v1/logout`, JWT with `email` claim.
   - Realtime: Phoenix-channel websocket `postgres_changes` for `bill_notifications` INSERT filtered by `recipient_email`.
   - `demo/demo-backend.js` is a compact, readable reference of this contract (in-browser).
   Expect weeks of work and a security review. Not recommended.
