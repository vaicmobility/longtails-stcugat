-- Preinscripcions vinculades a l'organització del programa, perquè els gestors de flota
-- d'aquesta organització les puguin CONSULTAR (no modificar).
-- El programa de longtails és de l'Ajuntament de Sant Cugat: el formulari públic hi assigna sempre aquesta organització.

alter table public.preinscripcions add column if not exists client_id uuid references public.clients(id) on delete set null;
create index if not exists preinscripcions_client_idx on public.preinscripcions (client_id);

create or replace function public.programa_longtails_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from clients
  where tipus = 'organitzacio' and empresa ilike 'Ajuntament de Sant Cugat%'
  order by created_at limit 1
$$;
revoke all on function public.programa_longtails_client_id() from public, anon, authenticated;

update public.preinscripcions set client_id = public.programa_longtails_client_id() where client_id is null;

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
  if (select count(*) from preinscripcions where lower(email) = e and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Ja hi ha diverses preinscripcions recents amb aquest correu';
  end if;
  if (select count(*) from preinscripcions where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'Massa sol·licituds. Torna-ho a provar més tard';
  end if;

  insert into preinscripcions (email, nom, document, telefon, escola_bressol, infant_unitat_familiar, adult_nom, privacitat_versio, client_id)
  values (e, trim(_nom), upper(trim(_document)), nullif(trim(_telefon), ''), nullif(trim(_escola_bressol), ''),
          nullif(trim(_infant), ''), nullif(trim(_adult_nom), ''), _privacitat_versio, programa_longtails_client_id());
end;
$$;
revoke all on function public.crear_preinscripcio(text, text, text, text, text, text, text, text) from public;
grant execute on function public.crear_preinscripcio(text, text, text, text, text, text, text, text) to anon, authenticated;

create policy "Gestors read org preinscripcions"
  on public.preinscripcions for select to authenticated
  using (client_id in (select public.gestor_client_ids((select auth.uid()))));
