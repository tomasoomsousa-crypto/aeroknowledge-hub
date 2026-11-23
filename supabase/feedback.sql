-- Tester feedback from the ★ Feedback button.
-- Run once in Supabase: SQL Editor -> New query -> paste everything -> Run.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rating int not null check (rating between 1 and 5),
  profile text,
  would_use text,
  comment text check (char_length(comment) <= 2000),
  app_role text
);

alter table public.feedback enable row level security;
grant select, insert on public.feedback to anon, authenticated;

-- Demo without login: anyone can send feedback and the supervisor dashboard can read it. Nobody can edit or delete.
drop policy if exists "demo read feedback" on public.feedback;
drop policy if exists "demo send feedback" on public.feedback;
create policy "demo read feedback" on public.feedback for select to anon, authenticated using (true);
create policy "demo send feedback" on public.feedback for insert to anon, authenticated with check (rating between 1 and 5);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'feedback') then
    alter publication supabase_realtime add table public.feedback;
  end if;
end $$;
