-- ============================================================================
-- 002 · Comentarios: autor enlazado a profiles (para mostrar @usuario)
-- ----------------------------------------------------------------------------
-- PostgREST (Supabase) solo puede "incrustar" el autor de un comentario si
-- existe una FK entre comments.user_id y profiles.id. Cambiamos la FK de
-- auth.users a profiles (que a su vez referencia auth.users). Antes,
-- rellenamos cualquier perfil que faltara.
-- ============================================================================

-- 1. Backfill: crea perfil para usuarios que aún no lo tengan
insert into public.profiles (id, username)
select u.id, split_part(u.email, '@', 1)
from auth.users u
on conflict (id) do nothing;

-- 2. Reapunta la FK de comments.user_id a profiles.id
alter table public.comments
  drop constraint if exists comments_user_id_fkey;

alter table public.comments
  add constraint comments_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade;

-- 3. Igual para ratings (lo aprovecharemos en la valoración de la comunidad)
alter table public.ratings
  drop constraint if exists ratings_user_id_fkey;

alter table public.ratings
  add constraint ratings_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade;
