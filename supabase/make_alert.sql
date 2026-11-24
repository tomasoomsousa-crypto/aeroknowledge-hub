-- Email alert for supervisors through Make: when a mechanic submits a NEW tip, Supabase sends its summary
-- to the Make webhook, and Make emails the supervisor. Works without any Netlify deploy.
-- Only new tips fire it: the example tips reloaded by "Reset demo data" (K-1042 to K-1069) never do.
--
-- Run once in Supabase: SQL Editor -> New query -> paste everything ->
-- replace PASTE-THE-MAKE-WEBHOOK-URL-HERE with the webhook address -> Run.
-- Do not commit the real webhook address to GitHub.

create extension if not exists pg_net;

create or replace function public.notify_make_new_tip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb := new.doc;
  hook text := 'PASTE-THE-MAKE-WEBHOOK-URL-HERE';
begin
  if coalesce(d->>'status', '') <> 'pending'
     or coalesce(nullif(regexp_replace(new.id, '\D', '', 'g'), ''), '0')::int <= 1069
     or hook not like 'https://%' then
    return new;
  end if;

  perform net.http_post(
    url := hook,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'event', 'tip_submitted',
      'id', new.id,
      'title', d->>'title',
      'author', d->>'author',
      'role', d->>'role',
      'aircraft', d->>'aircraft',
      'ata', d->>'ata',
      'ata_name', case d->>'ata'
        when '21' then 'Air Conditioning' when '24' then 'Electrical Power' when '27' then 'Flight Controls'
        when '28' then 'Fuel' when '29' then 'Hydraulic Power' when '32' then 'Landing Gear'
        when '34' then 'Navigation' when '36' then 'Pneumatic (Bleed Air)' when '49' then 'APU'
        when '72' then 'Engine' when '79' then 'Oil' else '' end,
      'part', d->>'part',
      'alarm', d->>'alarm',
      'downtime', coalesce((d->>'downtime')::numeric, 0),
      'attachment', d->>'media',
      'description', left(coalesce(d->>'description', ''), 600),
      'submitted_at', d->>'submittedAt',
      'link', 'https://vermillion-palmier-9c92b1.netlify.app/#validate'
    )
  );
  return new;
exception when others then
  return new; -- an alert problem must never block saving the tip
end;
$$;

drop trigger if exists make_new_tip on public.items;
create trigger make_new_tip
  after insert on public.items
  for each row execute function public.notify_make_new_tip();

-- To turn the alert off after the presentation:
--   drop trigger if exists make_new_tip on public.items;
