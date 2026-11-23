-- AeroKnowledge Hub: tabelas para a versão Netlify + Supabase.
-- Correr uma vez no Supabase: SQL Editor -> New query -> colar tudo -> Run.
-- Cada linha guarda o registo completo da app em "doc" (o mesmo formato dos ficheiros seed-*.json).

create table if not exists public.items (
  id text primary key,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.fleet (
  reg text primary key,
  doc jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;
alter table public.fleet enable row level security;

-- Demo sem login: qualquer visitante do site lê, cria e altera registos. Ninguém pode apagar.
drop policy if exists "demo ler items" on public.items;
drop policy if exists "demo criar items" on public.items;
drop policy if exists "demo alterar items" on public.items;
create policy "demo ler items" on public.items for select to anon, authenticated using (true);
create policy "demo criar items" on public.items for insert to anon, authenticated with check (true);
create policy "demo alterar items" on public.items for update to anon, authenticated using (true) with check (true);

drop policy if exists "demo ler fleet" on public.fleet;
drop policy if exists "demo criar fleet" on public.fleet;
drop policy if exists "demo alterar fleet" on public.fleet;
create policy "demo ler fleet" on public.fleet for select to anon, authenticated using (true);
create policy "demo criar fleet" on public.fleet for insert to anon, authenticated with check (true);
create policy "demo alterar fleet" on public.fleet for update to anon, authenticated using (true) with check (true);

-- Atualizações em tempo real para todos os dispositivos com a app aberta.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'items') then
    alter publication supabase_realtime add table public.items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'fleet') then
    alter publication supabase_realtime add table public.fleet;
  end if;
end $$;
