# 08 · Security checklist (do all of it before inviting real users)

- [ ] `supabase/schema.sql` ran completely (it enables RLS on every table and moves helper functions into the non-exposed `private` schema).
- [ ] Supabase *Advisors → Security* shows no ERROR. Accepted WARNs: `poll_notifications` (anon, protected by a per-device secret), the delete_*/register_* RPCs (they check the caller inside).
- [ ] Only the **anon/publishable** key is in `ifinex-config.json`. `service_role` appears nowhere in the repo (`git grep service_role`).
- [ ] Authentication → custom **SMTP** configured; OTP expiry short; rate limits reviewed (Authentication → Rate limits).
- [ ] **Block strangers from signing up:** the app only serves e-mails in `app_users`, but stop account creation too. Create this function and enable it under Authentication → Hooks → *Before User Created*:
```sql
create schema if not exists private;
create or replace function private.hook_before_user_created(event jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.app_users where lower(email) = lower(event->'user'->>'email')) then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'This e-mail is not registered.'));
  end if;
  return '{}'::jsonb;
end $$;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.hook_before_user_created(jsonb) from authenticated, anon, public;
```
- [ ] Database backups on (Pro plan: automatic; free plan: schedule your own `pg_dump`).
- [ ] Website served over HTTPS only. Android release APK signed with your own key.
- [ ] Delete test accounts you do not use (Authentication → Users) so the user list equals `app_users`.
- [ ] Never publish a database dump with real data.
