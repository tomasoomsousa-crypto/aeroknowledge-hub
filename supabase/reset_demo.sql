-- "Reset demo data" button: clears tips and aircraft so the app reloads the example data with today's dates.
-- The supervisor code is checked here, on the server. Tester feedback and uploaded files are kept.
-- Run once in Supabase: SQL Editor -> New query -> paste everything -> Run.

create or replace function public.reset_demo(code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if code is distinct from '1234' then
    raise exception 'Wrong supervisor code';
  end if;
  delete from public.items where true;
  delete from public.fleet where true;
end;
$$;

revoke all on function public.reset_demo(text) from public;
grant execute on function public.reset_demo(text) to anon, authenticated;
