-- ============================================================================
-- 004 · Notificaciones push (nuevo episodio de una serie seguida)
-- ----------------------------------------------------------------------------
-- Dos tablas:
--   push_tokens        -> el token de Expo de cada dispositivo del usuario.
--   notified_episodes  -> registro de qué episodio ya se avisó a cada usuario
--                          (evita enviar la misma push dos veces).
--
-- El usuario gestiona SOLO sus propios tokens (RLS). El cron del servidor lee
-- todos los tokens y escribe en notified_episodes con la service_role key, que
-- salta RLS por diseño.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PUSH_TOKENS — un token de Expo por dispositivo. Un usuario puede tener
--    varios (móvil, tablet...). El token es único a nivel global.
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "usuario gestiona sus tokens" on public.push_tokens;
create policy "usuario gestiona sus tokens"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. NOTIFIED_EPISODES — dedupe. Una fila = "a este usuario ya le avisamos de
--    este episodio de esta serie". El cron consulta esto antes de enviar.
-- ---------------------------------------------------------------------------
create table if not exists public.notified_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tv_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  sent_at timestamptz not null default now(),
  unique (user_id, tv_id, season_number, episode_number)
);

create index if not exists notified_episodes_user_idx
  on public.notified_episodes (user_id);

alter table public.notified_episodes enable row level security;

-- El usuario puede ver (opcional) su propio historial de avisos. La escritura
-- la hace el cron con service_role (salta RLS), así que no hay policy de insert
-- para usuarios normales: nadie desde el cliente puede falsear avisos.
drop policy if exists "usuario ve sus avisos" on public.notified_episodes;
create policy "usuario ve sus avisos"
  on public.notified_episodes for select using (auth.uid() = user_id);
