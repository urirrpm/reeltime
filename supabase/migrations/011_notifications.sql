-- ============================================================================
-- 011 · Notificaciones sociales (campana + push)
-- ----------------------------------------------------------------------------
-- Se generan solas con triggers (autonomía): al seguir a alguien o al dar like
-- a un comentario. `pushed` lo marca la edge function notify-social tras enviar
-- la push. Solo el destinatario ve/gestiona sus notificaciones (RLS).
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('follow', 'comment_like')),
  comment_id uuid references public.comments (id) on delete cascade,
  tmdb_id integer,
  media_type text,
  season_number integer,
  episode_number integer,
  read boolean not null default false,
  pushed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unpushed_idx
  on public.notifications (pushed) where pushed = false;

alter table public.notifications enable row level security;

-- El destinatario ve y marca como leídas sus notificaciones. La inserción la
-- hacen los triggers (security definer), no el cliente.
drop policy if exists "destinatario ve sus notificaciones" on public.notifications;
create policy "destinatario ve sus notificaciones"
  on public.notifications for select using (auth.uid() = recipient_id);

drop policy if exists "destinatario marca leídas" on public.notifications;
create policy "destinatario marca leídas"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- ---------------------------------------------------------------------------
-- Trigger: nuevo seguidor -> notifica al seguido.
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;

drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- ---------------------------------------------------------------------------
-- Trigger: like a un comentario -> notifica a su autor (si no es él mismo).
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_comment_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
begin
  select user_id, tmdb_id, media_type, season_number, episode_number
    into c
  from public.comments
  where id = new.comment_id;

  if c.user_id is not null and c.user_id <> new.user_id then
    insert into public.notifications (
      recipient_id, actor_id, type, comment_id,
      tmdb_id, media_type, season_number, episode_number
    )
    values (
      c.user_id, new.user_id, 'comment_like', new.comment_id,
      c.tmdb_id, c.media_type, c.season_number, c.episode_number
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_comment_like on public.comment_likes;
create trigger trg_notify_comment_like
  after insert on public.comment_likes
  for each row execute function public.notify_on_comment_like();
