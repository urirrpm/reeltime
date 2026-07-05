-- ============================================================================
-- 010 · Favoritos + Listas personalizadas
-- ----------------------------------------------------------------------------
-- Guardamos título/póster junto a tmdb_id (denormalizado) para pintar las
-- estanterías sin una llamada a TMDB por cada elemento. Lectura pública (se
-- muestran en el perfil de cualquiera); cada usuario gestiona lo suyo.
-- ============================================================================

-- 1. FAVORITOS
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table public.favorites enable row level security;

drop policy if exists "favoritos públicos" on public.favorites;
create policy "favoritos públicos"
  on public.favorites for select using (true);

drop policy if exists "usuario gestiona sus favoritos" on public.favorites;
create policy "usuario gestiona sus favoritos"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. LISTAS
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create index if not exists lists_user_idx on public.lists (user_id);

alter table public.lists enable row level security;

drop policy if exists "listas públicas" on public.lists;
create policy "listas públicas"
  on public.lists for select using (true);

drop policy if exists "usuario gestiona sus listas" on public.lists;
create policy "usuario gestiona sus listas"
  on public.lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. ELEMENTOS DE LISTA
create table if not exists public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  created_at timestamptz not null default now(),
  primary key (list_id, tmdb_id, media_type)
);

alter table public.list_items enable row level security;

drop policy if exists "items de lista públicos" on public.list_items;
create policy "items de lista públicos"
  on public.list_items for select using (true);

-- Solo el dueño de la lista añade/quita elementos.
drop policy if exists "dueño gestiona items" on public.list_items;
create policy "dueño gestiona items"
  on public.list_items for all
  using (
    exists (select 1 from public.lists l
            where l.id = list_id and l.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.lists l
            where l.id = list_id and l.user_id = auth.uid())
  );
