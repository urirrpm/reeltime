-- ============================================================================
-- 003 · Valoraciones (media de comunidad) + Encuesta "mejor personaje"
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A. Resumen de valoraciones de un título: media + nº de votos.
--    (PostgREST no expone agregados por defecto, así que usamos una función.)
-- ---------------------------------------------------------------------------
create or replace function public.rating_summary(
  p_tmdb_id integer,
  p_media_type text
)
returns table (avg_score numeric, votes bigint)
language sql
stable
as $$
  select
    coalesce(round(avg(score)::numeric, 1), 0) as avg_score,
    count(*)::bigint as votes
  from public.ratings
  where tmdb_id = p_tmdb_id
    and media_type = p_media_type;
$$;

-- ---------------------------------------------------------------------------
-- B. Votos de "mejor personaje del episodio" (1 voto por usuario y episodio).
-- ---------------------------------------------------------------------------
create table if not exists public.character_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tv_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  character_id integer not null,      -- id de la persona en TMDB
  character_name text not null,
  profile_path text,                  -- imagen del actor (opcional)
  created_at timestamptz not null default now(),
  unique (user_id, tv_id, season_number, episode_number)
);

create index if not exists character_votes_episode_idx
  on public.character_votes (tv_id, season_number, episode_number);

alter table public.character_votes enable row level security;

drop policy if exists "votos de personaje públicos" on public.character_votes;
create policy "votos de personaje públicos"
  on public.character_votes for select using (true);

drop policy if exists "usuario gestiona su voto" on public.character_votes;
create policy "usuario gestiona su voto"
  on public.character_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- C. Resultados agregados de un episodio: votos y % por personaje.
-- ---------------------------------------------------------------------------
create or replace function public.episode_character_results(
  p_tv_id integer,
  p_season integer,
  p_episode integer
)
returns table (
  character_id integer,
  character_name text,
  profile_path text,
  votes bigint,
  pct numeric
)
language sql
stable
as $$
  with v as (
    select
      character_id,
      max(character_name) as character_name,
      max(profile_path) as profile_path,
      count(*)::bigint as votes
    from public.character_votes
    where tv_id = p_tv_id
      and season_number = p_season
      and episode_number = p_episode
    group by character_id
  ),
  t as (select coalesce(sum(votes), 0) as total from v)
  select
    v.character_id,
    v.character_name,
    v.profile_path,
    v.votes,
    case when t.total = 0 then 0
         else round(v.votes * 100.0 / t.total, 0)
    end as pct
  from v, t
  order by v.votes desc;
$$;
