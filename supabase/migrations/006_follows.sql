-- ============================================================================
-- 006 · Feed social Fase B — seguir usuarios
-- ----------------------------------------------------------------------------
-- Tabla de relaciones "follower_id sigue a following_id". El feed "Siguiendo"
-- se obtiene filtrando activity_feed por los actores a los que sigue el usuario.
-- Lectura pública (para contar seguidores y mostrar quién sigue a quién); cada
-- usuario solo puede crear/borrar SUS propios follows.
-- ============================================================================

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)  -- no puedes seguirte a ti mismo
);

create index if not exists follows_following_idx
  on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "follows visibles para todos" on public.follows;
create policy "follows visibles para todos"
  on public.follows for select using (true);

drop policy if exists "usuario sigue a otros" on public.follows;
create policy "usuario sigue a otros"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "usuario deja de seguir" on public.follows;
create policy "usuario deja de seguir"
  on public.follows for delete using (auth.uid() = follower_id);
