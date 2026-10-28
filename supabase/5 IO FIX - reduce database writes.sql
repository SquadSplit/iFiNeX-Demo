-- iFiNeX v9.5  DISK IO FIX  (paste in Supabase > SQL Editor > Run). Safe to run twice. Changes no data.
-- Cause: many tiny writes (phone polls every ~2 min, 96 cron log rows/day). The DB is only 18 MB, so size is NOT the problem.

-- 1) phone poll: write last_seen_at every 10 min instead of every 1 min (this was 7,536 table updates) -----------------------
create or replace function public.poll_notifications(p_device_id uuid, p_secret text, p_after bigint default -1)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  d record; v_hash text; v_items jsonb; v_cnt int; v_last bigint; v_newest bigint; v_more boolean; v_cursor bigint;
begin
  if p_device_id is null or p_secret is null then return jsonb_build_object('ok', false, 'error', 'invalid_device'); end if;
  v_hash := encode(sha256(convert_to(p_secret, 'utf8')), 'hex');
  select * into d from bill_devices where device_id = p_device_id and secret_hash = v_hash;
  if not found then return jsonb_build_object('ok', false, 'error', 'invalid_device'); end if;
  if d.last_seen_at is null or d.last_seen_at < now() - interval '10 minutes' then
    update bill_devices set last_seen_at = now() where id = d.id;
  end if;
  select coalesce(max(id), 0) into v_newest from bill_notifications where lower(recipient_email) = lower(d.user_email);
  if p_after is null or p_after < 0 then
    return jsonb_build_object('ok', true, 'baseline', true, 'max_id', v_newest, 'has_more', false, 'items', '[]'::jsonb);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'message', t.message, 'created_at', t.created_at) order by t.id), '[]'::jsonb), count(*), max(t.id)
    into v_items, v_cnt, v_last
  from (select id, title, message, created_at from bill_notifications
         where lower(recipient_email) = lower(d.user_email) and created_at > now() - interval '7 days'
           and (id > p_after or (id > p_after - 200 and created_at > now() - interval '3 minutes'))
         order by id limit 20) t;
  if v_cnt = 20 then
    v_more := exists (select 1 from bill_notifications where lower(recipient_email) = lower(d.user_email) and id > v_last);
    v_cursor := v_last;
  else
    v_more := false; v_cursor := greatest(p_after, v_newest);
  end if;
  return jsonb_build_object('ok', true, 'items', v_items, 'max_id', v_cursor, 'has_more', v_more);
end $fn$;

-- 2) Drive clock: every 15 min -> hourly (backups may start up to 1 hour after the chosen time) ----------------------------------
select cron.alter_job(jobid, schedule := '3 * * * *') from cron.job where jobname = 'ifinex-gdrive-due';

-- 3) cron keeps a log row for every run forever: keep only 3 days, cleaned daily ---------------------------------------------------
select cron.unschedule(jobid) from cron.job where jobname = 'ifinex-cron-log-purge';
select cron.schedule('ifinex-cron-log-purge', '20 3 * * *', $job$ delete from cron.job_run_details where end_time < now() - interval '3 days'; $job$);
delete from cron.job_run_details where end_time < now() - interval '3 days';

-- 4) drop 3 duplicate indexes (each one doubles the write cost of its table) --------------------------------------------------------
drop index if exists public.idx_bill_card_payments_email;
drop index if exists public.idx_bill_payee_entries_card;
drop index if exists public.idx_bill_push_subscriptions_email;

-- CHECK: expect poll fn ok, gdrive job '3 * * * *', purge job 1, duplicates 0
select (select schedule from cron.job where jobname = 'ifinex-gdrive-due') as gdrive_schedule,
       (select count(*) from cron.job where jobname = 'ifinex-cron-log-purge') as purge_job_should_be_1,
       (select count(*) from cron.job_run_details) as log_rows_now,
       (select count(*) from pg_indexes where indexname in ('idx_bill_card_payments_email','idx_bill_payee_entries_card','idx_bill_push_subscriptions_email')) as dupes_should_be_0;
