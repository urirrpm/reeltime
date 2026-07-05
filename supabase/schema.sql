-- ============================================================================
-- Reeltime · Esquema de base de datos (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- Cómo aplicarlo:
--   1. Crea un proyecto en https://supabase.com
--   2. Ve a "SQL Editor" y pega TODO este fichero. Ejecuta.
--   3. Copia la URL y la anon key (Settings > API) a tu .env
--
-- Row Level Security (RLS) está ACTIVADO en todas las tablas: cada usuario solo
-- puede tocar sus propios datos. Los comentarios/valoraciones son de lectura
-- pública (red social), pero solo el autor puede escribir/borrar los suyos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — perfil público de cada usuario (base para la parte social)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfiles visibles para todos" on public.profiles;
create policy "perfiles visibles para todos"
  on public.profiles for select using (true);

drop policy if exists "usuario edita su perfil" on public.profiles;
create policy "usuario edita su perfil"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "usuario inserta su perfil" on public.profiles;
create policy "usuario inserta su perfil"
  on public.profiles for insert with check (auth.uid() = id);

-- Crea el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. TRACKED_ITEMS — series/películas que el usuario sigue (núcleo del MVP)
-- ---------------------------------------------------------------------------
create table if not exists public.tracked_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  status text not null default 'watchlist'
    check (status in ('watchlist', 'watching', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create index if not exists tracked_items_user_idx
  on public.tracked_items (user_id, updated_at desc);

alter table public.tracked_items enable row level security;

drop policy if exists "usuario gestiona su seguimiento" on public.tracked_items;
create policy "usuario gestiona su seguimiento"
  on public.tracked_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. WATCHED_EPISODES — progreso por episodio (para series)
-- ---------------------------------------------------------------------------
create table if not exists public.watched_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tv_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamptz not null default now(),
  unique (user_id, tv_id, season_number, episode_number)
);

create index if not exists watched_episodes_user_idx
  on public.watched_episodes (user_id, tv_id);

alter table public.watched_episodes enable row level security;

drop policy if exists "usuario gestiona su progreso" on public.watched_episodes;
create policy "usuario gestiona su progreso"
  on public.watched_episodes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===========================================================================
-- FASE 2 (red social) — tablas preparadas. Puedes ejecutarlas ya; la UI se
-- construirá después.
-- ===========================================================================

-- 4. RATINGS — valoración (1-10) por título, pública
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

alter table public.ratings enable row level security;

drop policy if exists "valoraciones públicas" on public.ratings;
create policy "valoraciones públicas"
  on public.ratings for select using (true);

drop policy if exists "usuario escribe su valoración" on public.ratings;
create policy "usuario escribe su valoración"
  on public.ratings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. COMMENTS — comentarios públicos por título o episodio
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  season_number integer,   -- null = comentario general del título
  episode_number integer,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_title_idx
  on public.comments (tmdb_id, media_type, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "comentarios públicos" on public.comments;
create policy "comentarios públicos"
  on public.comments for select using (true);

drop policy if exists "usuario crea comentarios" on public.comments;
create policy "usuario crea comentarios"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "usuario borra sus comentarios" on public.comments;
create policy "usuario borra sus comentarios"
  on public.comments for delete using (auth.uid() = user_id);
