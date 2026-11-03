-- Preinscripcions al programa de longtails (formulari públic /inscripcio)
-- Anònims: només poden INSERIR a través de la funció crear_preinscripcio (no poden llegir res).
-- Personal VAIC (admin): ho pot gestionar tot.

create table if not exists public.preinscripcions (
  id                      uuid primary key default gen_random_uuid(),
  email                   text not null check (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nom                     text not null check (length(nom) between 2 and 200),
  document                text not null check (length(document) between 5 and 20),
  telefon                 text check (length(telefon) <= 30),
  escola_bressol          text check (length(escola_bressol) <= 200),
  infant_unitat_familiar  text check (length(infant_unitat_familiar) <= 300),
  adult_nom               text check (length(adult_nom) <= 200),
  privacitat_versio       text not null,
  privacitat_acceptada_at timestamptz not null default now(),
  estat                   text not null default 'pendent' check (estat in ('pendent', 'convertida', 'descartada')),
  cessio_id               uuid references public.cessions(id) on delete set null,
  created_at              timestamptz not null default now()
);

alter table public.preinscripcions enable row level security;

create policy "Admins manage preinscripcions"
  on public.preinscripcions for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

create index if not exists preinscripcions_email_idx on public.preinscripcions (lower(email), created_at desc);
create index if not exists preinscripcions_estat_idx on public.preinscripcions (estat, created_at desc);
create index if not exists preinscripcions_cessio_idx on public.preinscripcions (cessio_id);

create or replace function public.crear_preinscripcio(
  _email text, _nom text, _document text, _telefon text, _escola_bressol text,
  _infant text, _adult_nom text, _privacitat_versio text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(trim(_email));
begin
  if coalesce(_privacitat_versio, '') = '' then
    raise exception 'Cal acceptar la política de privacitat';
  end if;
  -- Límits bàsics contra abús
  if (select count(*) from preinscripcions where lower(email) = e and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Ja hi ha diverses preinscripcions recents amb aquest correu';
  end if;
  if (select count(*) from preinscripcions where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Massa sol·licituds. Torna-ho a provar més tard';
  end if;

  insert into preinscripcions (email, nom, document, telefon, escola_bressol, infant_unitat_familiar, adult_nom, privacitat_versio)
  values (e, trim(_nom), upper(trim(_document)), nullif(trim(_telefon), ''), nullif(trim(_escola_bressol), ''),
          nullif(trim(_infant), ''), nullif(trim(_adult_nom), ''), _privacitat_versio);
end;
$$;

revoke all on function public.crear_preinscripcio(text, text, text, text, text, text, text, text) from public;
grant execute on function public.crear_preinscripcio(text, text, text, text, text, text, text, text) to anon, authenticated;
