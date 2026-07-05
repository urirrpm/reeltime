-- ============================================================================
-- 008 · Reacciones emocionales por episodio ("¿Cómo te sentiste?")
-- ----------------------------------------------------------------------------
-- Una reacción por usuario y episodio (upsert). `emotion` es una de las claves
-- fijas definidas en el cliente (src/lib/emotions.ts). Lectura pública para
-- mostrar el % de la comunidad; el usuario solo gestiona la suya.
-- ============================================================================

create table if not exists public.episode_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tv_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  emotion text not null,
  created_at timestamptz not null default now(),
  unique (user_id, tv_id, season_number, episode_number)
);

create index if not exists episode_reactions_episode_idx
  on public.episode_reactions (tv_id, season_number, episode_number);

alter table public.episode_reactions enable row level security;

drop policy if exists "reacciones públicas" on public.episode_reactions;
create policy "reacciones públicas"
  on public.episode_reactions for select using (true);

drop policy if exists "usuario gestiona su reacción" on public.episode_reactions;
create policy "usuario gestiona su reacción"
  on public.episode_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Resultados agregados (votos y % por emoción) de un episodio.
create or replace function public.episode_reaction_results(
  p_tv_id integer,
  p_season integer,
  p_episode integer
)
returns table (emotion text, votes bigint, pct numeric)
language sql
stable
as $$
  with v as (
    select emotion, count(*)::bigint as votes
    from public.episode_reactions
    where tv_id = p_tv_id
      and season_number = p_season
      and episode_number = p_episode
    group by emotion
  ),
  t as (select coalesce(sum(votes), 0) as total from v)
  select
    v.emotion,
    v.votes,
    case when t.total = 0 then 0 else round(v.votes * 100.0 / t.total, 0) end
  from v, t
  order by v.votes desc;
$$;

-- ---------------------------------------------------------------------------
-- Añadir las reacciones al feed de actividad (5º origen de la vista).
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
  join public.profiles p on p.id = w.user_id

  union all
  select
    'reaction:' || er.id::text,
    er.user_id, p.username, p.avatar_url,
    'reaction',
    er.tv_id, 'tv',
    er.season_number, er.episode_number,
    er.created_at,
    jsonb_build_object('emotion', er.emotion)
  from public.episode_reactions er
  join public.profiles p on p.id = er.user_id;

grant select on public.activity_feed to anon, authenticated;
