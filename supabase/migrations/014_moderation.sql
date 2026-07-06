-- ============================================================================
-- 014 · Moderación autónoma (sin moderadores humanos)
-- ----------------------------------------------------------------------------
-- Tres capas gratis:
--   1. `hidden` en comments: los ocultos dejan de verse (salvo para su autor).
--   2. banned_words + trigger: bloquea al publicar slurs/insultos graves. NO
--      bloquea tacos suaves (en una app de series son normales); solo lo grave.
--   3. auto-ocultar: al acumular varios reportes distintos, se oculta solo.
-- ============================================================================

-- 1. Columna hidden + política de lectura (otros no ven ocultos; el autor sí).
alter table public.comments add column if not exists hidden boolean not null default false;

drop policy if exists "comentarios públicos" on public.comments;
create policy "comentarios públicos"
  on public.comments for select
  using (not hidden or auth.uid() = user_id);

-- 2. Lista de términos vetados (editable sin desplegar) + trigger de bloqueo.
create table if not exists public.banned_words (word text primary key);

alter table public.banned_words enable row level security;
-- Nadie la lee/escribe desde el cliente; solo el trigger (security definer) y el
-- servicio. Sin policies => sin acceso vía API.

-- Slurs / acoso (ES + EN). Coincidencia por palabra completa, sin acentos.
insert into public.banned_words (word) values
  ('maricon'), ('maricón'), ('marica'), ('bollera'), ('travelo'),
  ('sudaca'), ('negrata'), ('moronegro'), ('panchito'), ('subnormal'),
  ('retrasado'), ('mongolo'), ('mongólico'), ('gitanazo'), ('puto negro'),
  ('faggot'), ('nigger'), ('nigga'), ('retard'), ('tranny'),
  ('spic'), ('chink'), ('kike'), ('coon'), ('dyke')
on conflict (word) do nothing;

create or replace function public.enforce_comment_policy()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.banned_words b
    where lower(new.body) ~ ('\y' || b.word || '\y')
  ) then
    raise exception 'comment_policy_violation'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_comment_policy on public.comments;
create trigger trg_enforce_comment_policy
  before insert on public.comments
  for each row execute function public.enforce_comment_policy();

-- 3. Auto-ocultar: al llegar a 3 reportes de usuarios distintos.
create or replace function public.autohide_on_reports()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  n integer;
begin
  select count(distinct user_id) into n
  from public.comment_reports
  where comment_id = new.comment_id;

  if n >= 3 then
    update public.comments set hidden = true where id = new.comment_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_autohide_on_reports on public.comment_reports;
create trigger trg_autohide_on_reports
  after insert on public.comment_reports
  for each row execute function public.autohide_on_reports();
