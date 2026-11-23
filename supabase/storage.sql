-- Anexos das dicas (fotos, notas de voz, vídeos) no Supabase Storage.
-- Correr uma vez no Supabase: SQL Editor -> New query -> colar tudo -> Run.
-- Bucket público "media": qualquer pessoa vê os ficheiros pelo link; o site pode enviar ficheiros até 10 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/*', 'audio/*', 'video/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "demo enviar media" on storage.objects;
create policy "demo enviar media" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'media');
