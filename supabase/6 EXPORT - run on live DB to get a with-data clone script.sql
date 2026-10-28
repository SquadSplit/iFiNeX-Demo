-- iFiNeX v9.5  EXPORT YOUR LIVE DATA AS A RESTORE SCRIPT  (paste in Supabase > SQL Editor > Run on the LIVE project).
-- Result = ONE cell called restore_script. Click the cell > use COPY (copy the cell text) > paste into a text editor > save as restore_data.sql.
-- DO NOT use Export / Download as markdown or CSV: it adds table characters, turns line breaks into <br> and doubles backslashes (corrupts notifications).
-- To clone: run the FULL (no data) script on the new project, THEN paste restore_data.sql there and Run.
-- Always matches live data at the moment you run it (a typed snapshot would be out of date). Changes nothing.
-- Left out on purpose (secrets / device-specific, they re-create themselves): bill_devices, bill_push_subscriptions,
-- gdrive_links, gdrive_oauth_state. People reconnect Google Drive and re-enable alerts after a clone.

create or replace function pg_temp.ifx_export() returns text language plpgsql as $fn$
declare
  skip  text[] := array['bill_devices', 'bill_push_subscriptions', 'gdrive_links', 'gdrive_oauth_state'];
  todo  text[]; done text[] := '{}'; r text; j text; n int; pass int := 0; o text := ''; hdr text := ''; ftr text := '';
begin
  select array_agg(c.relname order by c.relname) into todo
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
   where s.nspname = 'public' and c.relkind = 'r' and not (c.relname = any (skip));
  while coalesce(array_length(todo, 1), 0) > 0 and pass < 50 loop
    pass := pass + 1;
    foreach r in array todo loop
      if not exists (
        select 1 from pg_constraint k
          join pg_class f on f.oid = k.confrelid join pg_namespace fs on fs.oid = f.relnamespace
         where k.contype = 'f' and k.conrelid = ('public.' || quote_ident(r))::regclass and f.oid <> k.conrelid
           and fs.nspname = 'public' and f.relname = any (todo) and not (f.relname = any (done))
      ) then
        done := done || r;
      end if;
    end loop;
    todo := array(select t from unnest(todo) t where not (t = any (done)));
  end loop;
  foreach r in array done loop
    execute format('select count(*) from public.%I', r) into n;
    if n > 0 then
      hdr := hdr || format(E'alter table public.%I disable trigger user;\n', r);
      ftr := ftr || format(E'alter table public.%I enable trigger user;\n', r);
    end if;
  end loop;
  o := E'-- iFiNeX data restore, made ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || E' UTC. Run AFTER the FULL (no data) script.\n' || hdr
       || E'delete from public.squad_members;\ndelete from public.squads;\n';
  foreach r in array done loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb)::text from public.%I x', r) into j;
    if j <> '[]' then
      o := o || format(E'insert into public.%I overriding system value select * from jsonb_populate_recordset(null::public.%I, %L::jsonb);\n', r, r, j);
    end if;
  end loop;
  o := o || ftr;
  for r in select c.relname from pg_class c join pg_namespace s on s.oid = c.relnamespace
            where s.nspname = 'public' and c.relkind = 'r' and not (c.relname = any (skip))
              and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'id' and not a.attisdropped)
              order by 1 loop
    if pg_get_serial_sequence('public.' || quote_ident(r), 'id') is null then continue; end if;
    o := o || format(E'select setval(pg_get_serial_sequence(''public.%s'', ''id''), greatest(coalesce((select max(id) from public.%I), 0), 1), (select count(*) > 0 from public.%I));\n', r, r, r);
  end loop;
  return o;
end $fn$;

select pg_temp.ifx_export() as restore_script;
