-- ============================================================================
-- 007 · Perfil "de verdad": bio/portada + estadísticas + Storage de avatares
-- ============================================================================

-- 1. Campos nuevos de perfil (username y avatar_url ya existían).
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists cover_url text;

-- 2. Conteo de episodios vistos por serie de un usuario. El cliente lo usa para
--    estimar el "tiempo de series" multiplicando por la duración media (TMDB).
create or replace function public.watched_episode_counts(p_user uuid)
returns table (tv_id integer, episodes bigint)
language sql
stable
as $$
  select tv_id, count(*)::bigint as episodes
  from public.watched_episodes
  where user_id = p_user
  group by tv_id;
$$;

-- 3. Storage: bucket público para avatares y portadas.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Lectura pública de las imágenes del bucket.
drop policy if exists "avatars lectura pública" on storage.objects;
create policy "avatars lectura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada usuario solo escribe en su propia carpeta: avatars/<uid>/...
drop policy if exists "avatars subida propia" on storage.objects;
create policy "avatars subida propia"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars actualiza propia" on storage.objects;
create policy "avatars actualiza propia"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars borra propia" on storage.objects;
create policy "avatars borra propia"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
