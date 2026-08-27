-- Wijnkelder — basisschema.
-- Draai dit in de Supabase SQL-editor (Dashboard → SQL Editor → New query).
--
-- Uitgangspunten:
--   * UUID's als sleutel, geen tijdstempels — de legacy-app botste daarop.
--   * Echte types: prijs is numeric, jaartallen zijn int (waren strings).
--   * legacy_id onthoudt het oude id, zodat herhaald importeren geen duplicaten geeft.
--   * deleted_at maakt verwijderen terugdraaibaar.
--   * Elke tabel hangt aan een cellar; dat is de enige plek waar een gedeelde
--     huishoudkelder later nog inpast zonder migratiepijn.

create extension if not exists "pgcrypto";

-- ── PROFIELEN ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale       text        not null default 'nl',
  theme        text        not null default 'auto'
                 check (theme in ('auto', 'light', 'dark')),
  is_18_plus   boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- ── KELDERS ──────────────────────────────────────────────────────────────────
create table if not exists public.cellars (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null default 'Mijn kelder',
  created_at timestamptz not null default now()
);
create index if not exists cellars_owner_idx on public.cellars(owner_id);

-- ── WIJNEN ───────────────────────────────────────────────────────────────────
create table if not exists public.wines (
  id         uuid primary key default gen_random_uuid(),
  cellar_id  uuid not null references public.cellars(id) on delete cascade,
  legacy_id  text,

  naam       text not null,
  type       text not null default 'Rood'
               check (type in ('Rood', 'Wit', 'Rosé', 'Mousserend', 'Overig')),
  regio      text,
  druif      text,
  producent  text,
  herkomst   text,
  locatie    text,

  jaar       int  check (jaar between 1800 and 2100),
  aantal     int  not null default 1 check (aantal >= 0),
  prijs      numeric(10,2) check (prijs >= 0),

  drink_from int  check (drink_from between 1800 and 2200),
  drink_to   int  check (drink_to between 1800 and 2200),
  sterren    int  not null default 0 check (sterren between 0 and 5),
  note       text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  -- Twee keer dezelfde back-up importeren mag geen duplicaten opleveren.
  constraint wines_legacy_unique unique (cellar_id, legacy_id)
);
create index if not exists wines_cellar_idx on public.wines(cellar_id) where deleted_at is null;
create index if not exists wines_naam_idx   on public.wines(cellar_id, lower(naam));

-- ── DRINKDAGBOEK ─────────────────────────────────────────────────────────────
-- naam_snapshot houdt het dagboek leesbaar als de wijn zelf verdwijnt.
create table if not exists public.drink_log (
  id            uuid primary key default gen_random_uuid(),
  cellar_id     uuid not null references public.cellars(id) on delete cascade,
  wine_id       uuid references public.wines(id) on delete set null,
  legacy_id     text,

  naam_snapshot text not null,
  type          text,
  jaar          int,
  producent     text,
  sterren       int check (sterren between 0 and 5),

  met_wie       text,
  gelegenheid   text,
  note          text,

  gedronken_op  timestamptz not null default now(),
  created_at    timestamptz not null default now(),

  constraint drink_log_legacy_unique unique (cellar_id, legacy_id)
);
create index if not exists drink_log_cellar_idx on public.drink_log(cellar_id, gedronken_op desc);

-- ── VERLANGLIJST ─────────────────────────────────────────────────────────────
create table if not exists public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  cellar_id  uuid not null references public.cellars(id) on delete cascade,
  legacy_id  text,

  naam       text not null,
  type       text not null default 'Rood'
               check (type in ('Rood', 'Wit', 'Rosé', 'Mousserend', 'Overig')),
  regio      text,
  druif      text,
  producent  text,
  richtprijs numeric(10,2) check (richtprijs >= 0),
  note       text,

  created_at timestamptz not null default now(),

  constraint wishlist_legacy_unique unique (cellar_id, legacy_id)
);
create index if not exists wishlist_cellar_idx on public.wishlist(cellar_id, created_at desc);

-- ── DEEL-LINKS ───────────────────────────────────────────────────────────────
create table if not exists public.shares (
  id         uuid primary key default gen_random_uuid(),
  cellar_id  uuid not null references public.cellars(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists shares_cellar_idx on public.shares(cellar_id);

-- ── updated_at bijhouden ─────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists wines_touch on public.wines;
create trigger wines_touch before update on public.wines
  for each row execute function public.touch_updated_at();

-- ── Profiel + kelder aanmaken bij registratie ────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.cellars (owner_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.cellars   enable row level security;
alter table public.wines     enable row level security;
alter table public.drink_log enable row level security;
alter table public.wishlist  enable row level security;
alter table public.shares    enable row level security;

-- Eigen profiel
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Eigen kelders
drop policy if exists cellars_own on public.cellars;
create policy cellars_own on public.cellars
  for all using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Alles wat aan een kelder hangt: hetzelfde patroon, één keer gedefinieerd.
create or replace function public.owns_cellar(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cellars c
    where c.id = cid and c.owner_id = (select auth.uid())
  )
$$;

drop policy if exists wines_own on public.wines;
create policy wines_own on public.wines
  for all using (public.owns_cellar(cellar_id)) with check (public.owns_cellar(cellar_id));

drop policy if exists drink_log_own on public.drink_log;
create policy drink_log_own on public.drink_log
  for all using (public.owns_cellar(cellar_id)) with check (public.owns_cellar(cellar_id));

drop policy if exists wishlist_own on public.wishlist;
create policy wishlist_own on public.wishlist
  for all using (public.owns_cellar(cellar_id)) with check (public.owns_cellar(cellar_id));

drop policy if exists shares_own on public.shares;
create policy shares_own on public.shares
  for all using (public.owns_cellar(cellar_id)) with check (public.owns_cellar(cellar_id));

-- ── DEEL-LINK: alleen-lezen, zonder inloggen, zonder prijzen ─────────────────
-- Geen RLS-policy maar een functie: zo komt er nooit meer naar buiten dan deze
-- kolommen, ook niet als iemand het token in handen krijgt.
create or replace function public.shared_cellar(share_token text)
returns table (
  naam text, type text, regio text, druif text, producent text,
  jaar int, aantal int, drink_from int, drink_to int, sterren int, note text
)
language sql stable security definer set search_path = public as $$
  select w.naam, w.type, w.regio, w.druif, w.producent,
         w.jaar, w.aantal, w.drink_from, w.drink_to, w.sterren, w.note
  from public.shares s
  join public.wines w on w.cellar_id = s.cellar_id
  where s.token = share_token
    and s.revoked_at is null
    and (s.expires_at is null or s.expires_at > now())
    and w.deleted_at is null
  order by lower(w.naam)
$$;

grant execute on function public.shared_cellar(text) to anon, authenticated;
