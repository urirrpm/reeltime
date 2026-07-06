-- ============================================================================
-- 012 · Estadísticas de cine: IDs de películas completadas de un usuario
-- ----------------------------------------------------------------------------
-- tracked_items es privado (solo el dueño lo ve por RLS). Para las estadísticas
-- públicas del perfil exponemos ÚNICAMENTE las películas marcadas como "vistas"
-- (completed), no la watchlist, mediante una función SECURITY DEFINER.
-- ============================================================================

create or replace function public.completed_movie_ids(p_user uuid)
returns table (tmdb_id integer)
language sql
stable
security definer
set search_path = public
as $$
  select tmdb_id
  from public.tracked_items
  where user_id = p_user
    and media_type = 'movie'
    and status = 'completed';
$$;
