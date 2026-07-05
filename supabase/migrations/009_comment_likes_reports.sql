-- ============================================================================
-- 009 · Comentarios enriquecidos: me gusta + reportar (base de moderación)
-- ============================================================================

-- 1. LIKES — un "me gusta" por usuario y comentario. Lectura pública (para el
--    contador); cada usuario gestiona los suyos.
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

drop policy if exists "likes públicos" on public.comment_likes;
create policy "likes públicos"
  on public.comment_likes for select using (true);

drop policy if exists "usuario gestiona sus likes" on public.comment_likes;
create policy "usuario gestiona sus likes"
  on public.comment_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. REPORTES — un reporte por usuario y comentario. Privado: solo el propio
--    autor del reporte lo ve; nadie más (base para moderación posterior).
create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists comment_reports_comment_idx
  on public.comment_reports (comment_id);

alter table public.comment_reports enable row level security;

drop policy if exists "usuario ve sus reportes" on public.comment_reports;
create policy "usuario ve sus reportes"
  on public.comment_reports for select using (auth.uid() = user_id);

drop policy if exists "usuario crea reportes" on public.comment_reports;
create policy "usuario crea reportes"
  on public.comment_reports for insert with check (auth.uid() = user_id);
