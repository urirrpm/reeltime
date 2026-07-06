-- ============================================================================
-- 013 · Valoración por episodio (5 niveles) + distribución de la comunidad
-- ----------------------------------------------------------------------------
-- Igual que TV Time: 1=Malo, 2=Normal, 3=Bueno, 4=Genial, 5=Brutal. Una por
-- usuario y episodio (upsert). Lectura pública (para el histograma).
-- ============================================================================

create table if not exists public.episode_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tv_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, tv_id, season_number, episode_number)
);

create index if not exists episode_ratings_episode_idx
  on public.episode_ratings (tv_id, season_number, episode_number);

alter table public.episode_ratings enable row level security;

drop policy if exists "valoraciones de episodio públicas" on public.episode_ratings;
create policy "valoraciones de episodio públicas"
  on public.episode_ratings for select using (true);

drop policy if exists "usuario gestiona su valoración de episodio"
  on public.episode_ratings;
create policy "usuario gestiona su valoración de episodio"
  on public.episode_ratings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Distribución por nivel (1-5): votos y % de cada uno para un episodio.
create or replace function public.episode_rating_results(
  p_tv_id integer,
  p_season integer,
  p_episode integer
)
returns table (score smallint, votes bigint, pct numeric)
language sql
stable
as $$
  with v as (
    select score, count(*)::bigint as votes
    from public.episode_ratings
    where tv_id = p_tv_id
      and season_number = p_season
      and episode_number = p_episode
    group by score
  ),
  t as (select coalesce(sum(votes), 0) as total from v)
  select
    s.score::smallint,
    coalesce(v.votes, 0) as votes,
    case when t.total = 0 then 0
         else round(coalesce(v.votes, 0) * 100.0 / t.total, 0)
    end as pct
  from generate_series(1, 5) as s(score)
  left join v on v.score = s.score, t
  order by s.score;
$$;

-- ---------------------------------------------------------------------------
-- Añadir la valoración de episodio al feed (6º origen).
-- ---------------------------------------------------------------------------
create or replace view public.activity_feed
with (security_invoker = on) as
  select 'rating:' || r.id::text as id, r.user_id as actor_id,
    p.username as username, p.avatar_url as avatar_url,
    'rating'::text as type, r.tmdb_id as tmdb_id, r.media_type as media_type,
    null::integer as season_number, null::integer as episode_number,
    r.created_at as created_at, jsonb_build_object('score', r.score) as payload
  from public.ratings r join public.profiles p on p.id = r.user_id
  union all
  select 'comment:' || c.id::text, c.user_id, p.username, p.avatar_url,
    'comment', c.tmdb_id, c.media_type, c.season_number, c.episode_number,
    c.created_at,
    jsonb_build_object(
      'excerpt', left(c.body, 140),
      'scope', case when c.episode_number is not null then 'episode'
                    when c.season_number is not null then 'season'
                    else 'title' end)
  from public.comments c join public.profiles p on p.id = c.user_id
  union all
  select 'vote:' || v.id::text, v.user_id, p.username, p.avatar_url,
    'character_vote', v.tv_id, 'tv', v.season_number, v.episode_number,
    v.created_at,
    jsonb_build_object('character_id', v.character_id,
      'character_name', v.character_name, 'profile_path', v.profile_path)
  from public.character_votes v join public.profiles p on p.id = v.user_id
  union all
  select 'watched:' || w.id::text, w.user_id, p.username, p.avatar_url,
    'watched', w.tv_id, 'tv', w.season_number, w.episode_number,
    w.watched_at, '{}'::jsonb
  from public.watched_episodes w join public.profiles p on p.id = w.user_id
  union all
  select 'reaction:' || er.id::text, er.user_id, p.username, p.avatar_url,
    'reaction', er.tv_id, 'tv', er.season_number, er.episode_number,
    er.created_at, jsonb_build_object('emotion', er.emotion)
  from public.episode_reactions er join public.profiles p on p.id = er.user_id
  union all
  select 'eprating:' || er.id::text, er.user_id, p.username, p.avatar_url,
    'episode_rating', er.tv_id, 'tv', er.season_number, er.episode_number,
     er.created_at, jsonb_build_object('score', er.score)
  from public.episode_ratings er join public.profiles p on p.id = er.user_id;

grant select on public.activity_feed to anon, authenticated;
