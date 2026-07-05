-- ============================================================================
-- 005 · Feed social — vista unificada de actividad de la comunidad
-- ----------------------------------------------------------------------------
-- No creamos tablas nuevas: derivamos el feed de lo que ya existe
-- (ratings, comments, character_votes, watched_episodes) uniéndolo en filas
-- homogéneas con su autor (@usuario). El título de cada obra NO se guarda aquí;
-- el cliente lo resuelve desde TMDB con tmdb_id + media_type (fuente única de
-- datos = autonomía). Si el volumen crece, esta vista se puede materializar
-- después sin tocar la app.
--
-- Seguridad: la vista usa `security_invoker = on`, así que respeta las RLS de
-- cada tabla base. ratings/comments/character_votes ya tienen lectura pública;
-- para el feed hacemos también pública la lectura de "episodios vistos".
-- ============================================================================

-- "X vio un episodio" es actividad social pública (como en TV Time). El usuario
-- sigue siendo el único que puede escribir/borrar su progreso (policy previa).
drop policy if exists "progreso visible para todos" on public.watched_episodes;
create policy "progreso visible para todos"
  on public.watched_episodes for select using (true);

-- ---------------------------------------------------------------------------
-- Vista del feed. `payload` (jsonb) lleva los campos específicos de cada tipo.
-- El `id` va prefijado por tipo para ser único en toda la unión.
-- ---------------------------------------------------------------------------
create or replace view public.activity_feed
with (security_invoker = on) as
  select
    'rating:' || r.id::text            as id,
    r.user_id                          as actor_id,
    p.username                         as username,
    p.avatar_url                       as avatar_url,
    'rating'::text                     as type,
    r.tmdb_id                          as tmdb_id,
    r.media_type                       as media_type,
    null::integer                      as season_number,
    null::integer                      as episode_number,
    r.created_at                       as created_at,
    jsonb_build_object('score', r.score) as payload
  from public.ratings r
  join public.profiles p on p.id = r.user_id

  union all
  select
    'comment:' || c.id::text,
    c.user_id, p.username, p.avatar_url,
    'comment',
    c.tmdb_id, c.media_type,
    c.season_number, c.episode_number,
    c.created_at,
    jsonb_build_object(
      'excerpt', left(c.body, 140),
      'scope', case
        when c.episode_number is not null then 'episode'
        when c.season_number is not null then 'season'
        else 'title'
      end
    )
  from public.comments c
  join public.profiles p on p.id = c.user_id

  union all
  select
    'vote:' || v.id::text,
    v.user_id, p.username, p.avatar_url,
    'character_vote',
    v.tv_id, 'tv',
    v.season_number, v.episode_number,
    v.created_at,
    jsonb_build_object(
      'character_id', v.character_id,
      'character_name', v.character_name,
      'profile_path', v.profile_path
    )
  from public.character_votes v
  join public.profiles p on p.id = v.user_id

  union all
  select
    'watched:' || w.id::text,
    w.user_id, p.username, p.avatar_url,
    'watched',
    w.tv_id, 'tv',
    w.season_number, w.episode_number,
    w.watched_at,
    '{}'::jsonb
  from public.watched_episodes w
  join public.profiles p on p.id = w.user_id;

-- PostgREST accede con los roles anon/authenticated; hay que concederles SELECT.
grant select on public.activity_feed to anon, authenticated;
