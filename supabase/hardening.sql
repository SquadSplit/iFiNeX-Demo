-- ============================================================================
-- iFiNeX v9.1 — HARDENING  (security + performance + traffic)        2026-10-15
-- Run ONCE in Supabase Dashboard -> SQL Editor (as postgres) on the LIVE project. Safe to run again. Changes NO row data.
-- Fixes every WARN/INFO in the Supabase security + performance advisor that can be fixed from SQL:
--   security : notify_settlement_edit executable by anon/authenticated · bucket listing (user_backgrounds_read) ·
--              "Public/Signed-in can execute SECURITY DEFINER function" for the helper functions (moved to the NON-exposed schema "private") ·
--              bill_devices "RLS enabled, no policy"
--   perf     : 3 foreign keys without index · 3 duplicate indexes · multiple permissive policies (bill_card_shares, bill_plans, et_trackers)
--   traffic  : idle-in-transaction guard for API roles (statement_timeout anon 3s / authenticated 8s already exist on the live project)
-- NOT in this file (separate, optional): remove users that exist in the login system but not in the app, signup gate, pg_net move, drop old backup schemas.
-- ============================================================================

-- 0) a schema that the API does NOT expose (PostgREST only serves "public"). RLS keeps working: policies call the functions by id, not by name.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- 1) move the 9 helper functions used by RLS policies out of the API schema
do $mv$
declare r record; cfg text; newcfg text;
begin
  for r in select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) args
             from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
              and p.proname in ('my_email','is_registered','is_bill_admin','is_squad_admin','is_squad_member','is_admin_delegate','is_delegate_for','et_can','delegate_of') loop
    execute format('alter function public.%I(%s) set search_path = public, private', r.proname, r.args);
    execute format('alter function public.%I(%s) set schema private', r.proname, r.args);
  end loop;

  -- every other function that calls a moved helper by its bare name must be able to find it in "private"
  for r in select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) args, p.proconfig, p.prosrc
             from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' loop
    cfg := (select substring(c from '^search_path=(.*)$') from unnest(coalesce(r.proconfig, '{}'::text[])) c where c like 'search_path=%' limit 1);
    if cfg is not null then
      if cfg !~ 'private' then
        execute format('alter function public.%I(%s) set search_path = %s', r.proname, r.args, cfg || ', private');
      end if;
    elsif r.prosrc ~* '\m(my_email|is_registered|is_bill_admin|is_squad_admin|is_squad_member|is_admin_delegate|is_delegate_for|et_can|delegate_of)\s*\(' then
      execute format('alter function public.%I(%s) set search_path = public, extensions, private', r.proname, r.args);
    end if;
  end loop;

  -- functions that name a moved helper WITH the schema prefix ("public.is_registered()") are re-created pointing at "private"
  for r in select p.oid from pg_proc p
            where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
              and p.prosrc ~* 'public\.(my_email|is_registered|is_bill_admin|is_squad_admin|is_squad_member|is_admin_delegate|is_delegate_for|et_can|delegate_of)\s*\(' loop
    execute regexp_replace(pg_get_functiondef(r.oid), 'public\.(my_email|is_registered|is_bill_admin|is_squad_admin|is_squad_member|is_admin_delegate|is_delegate_for|et_can|delegate_of)(\s*\()', 'private.\1\2', 'gi');
  end loop;
end $mv$;

-- 2) trigger helper must not be callable from the internet (triggers keep working)
revoke all on function public.notify_settlement_edit() from public, anon, authenticated;

-- 3) background-photo bucket: nobody may LIST every file (folder names are e-mail addresses). Photos stay visible through their public link.
drop policy if exists user_backgrounds_read on storage.objects;
create policy user_backgrounds_read on storage.objects for select to authenticated
  using (bucket_id = 'user-backgrounds' and lower((storage.foldername(name))[1]) = (select private.my_email()));

-- 4) bill_devices is only reachable through register_device / unregister_device / poll_notifications -> say so explicitly
drop policy if exists bill_devices_no_direct_access on public.bill_devices;
create policy bill_devices_no_direct_access on public.bill_devices for all to anon, authenticated using (false) with check (false);

-- 5) multiple permissive policies -> ONE policy per command (same rules, evaluated once)
-- 5a) bill_card_shares
drop policy if exists bill_card_shares_owner_all on public.bill_card_shares;
drop policy if exists bill_card_shares_shared_select on public.bill_card_shares;
drop policy if exists bill_card_shares_select on public.bill_card_shares;
drop policy if exists bill_card_shares_insert on public.bill_card_shares;
drop policy if exists bill_card_shares_update on public.bill_card_shares;
drop policy if exists bill_card_shares_delete on public.bill_card_shares;
create policy bill_card_shares_select on public.bill_card_shares for select to public using (
  lower(owner_email) = (select private.my_email()) or (select private.is_delegate_for(owner_email)) or (select private.is_bill_admin())
  or lower(shared_with_email) = (select private.my_email()));
create policy bill_card_shares_insert on public.bill_card_shares for insert to public with check (
  lower(owner_email) = (select private.my_email()) or (select private.is_delegate_for(owner_email)) or (select private.is_bill_admin()));
create policy bill_card_shares_update on public.bill_card_shares for update to public using (
  lower(owner_email) = (select private.my_email()) or (select private.is_delegate_for(owner_email)) or (select private.is_bill_admin()))
  with check (lower(owner_email) = (select private.my_email()) or (select private.is_delegate_for(owner_email)) or (select private.is_bill_admin()));
create policy bill_card_shares_delete on public.bill_card_shares for delete to public using (
  lower(owner_email) = (select private.my_email()) or (select private.is_delegate_for(owner_email)) or (select private.is_bill_admin()));

-- 5b) bill_plans
drop policy if exists bill_plans_all on public.bill_plans;
drop policy if exists bill_plans_card_owner_select on public.bill_plans;
drop policy if exists bill_plans_select on public.bill_plans;
drop policy if exists bill_plans_insert on public.bill_plans;
drop policy if exists bill_plans_update on public.bill_plans;
drop policy if exists bill_plans_delete on public.bill_plans;
create policy bill_plans_select on public.bill_plans for select to public using (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(bill_plans.user_email)) or (select private.is_bill_admin())
  or exists (select 1 from public.bill_cards c where c.id = bill_plans.card_id and lower(c.user_email) = (select private.my_email())));
create policy bill_plans_insert on public.bill_plans for insert to public with check (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(bill_plans.user_email)) or (select private.is_bill_admin()));
create policy bill_plans_update on public.bill_plans for update to public using (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(bill_plans.user_email)) or (select private.is_bill_admin()))
  with check (lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(bill_plans.user_email)) or (select private.is_bill_admin()));
create policy bill_plans_delete on public.bill_plans for delete to public using (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(bill_plans.user_email)) or (select private.is_bill_admin()));

-- 5c) et_trackers (the SELECT policy already contains everything the write policy allowed + participants)
drop policy if exists et_trackers_write on public.et_trackers;
drop policy if exists et_trackers_insert on public.et_trackers;
drop policy if exists et_trackers_update on public.et_trackers;
drop policy if exists et_trackers_delete on public.et_trackers;
create policy et_trackers_insert on public.et_trackers for insert to authenticated with check (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(et_trackers.user_email)) or (select private.is_bill_admin()));
create policy et_trackers_update on public.et_trackers for update to authenticated using (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(et_trackers.user_email)) or (select private.is_bill_admin()))
  with check (lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(et_trackers.user_email)) or (select private.is_bill_admin()));
create policy et_trackers_delete on public.et_trackers for delete to authenticated using (
  lower(user_email) = (select private.my_email()) or (select private.is_delegate_for(et_trackers.user_email)) or (select private.is_bill_admin()));

-- 6) indexes: cover the 3 foreign keys, drop the 3 duplicates (the kept twin is identical)
create index if not exists idx_bill_expenses_card_id on public.bill_expenses (card_id);
create index if not exists idx_bill_plans_card_id    on public.bill_plans (card_id);
create index if not exists idx_bill_plans_payee_id   on public.bill_plans (payee_id);
drop index if exists public.idx_bill_card_payments_email;      -- twin: idx_bcp_email
drop index if exists public.idx_bpe_card;                      -- twin: idx_bill_payee_entries_card
drop index if exists public.idx_bill_push_subscriptions_email; -- twin: idx_push_email

-- 7) traffic: a client that opens a transaction and walks away must not hold a connection (statement_timeout anon 3s / authenticated 8s exist already)
alter role anon          set idle_in_transaction_session_timeout = '15s';
alter role authenticated set idle_in_transaction_session_timeout = '30s';
notify pgrst, 'reload config';

-- CHECK (expected: all true / 0):
--   select has_function_privilege('anon','public.notify_settlement_edit()','execute') = false as trigger_helper_closed,
--          (select count(*) from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in ('my_email','is_registered','is_bill_admin','is_squad_admin','is_squad_member','is_admin_delegate','is_delegate_for','et_can','delegate_of')) = 0 as helpers_not_exposed;
