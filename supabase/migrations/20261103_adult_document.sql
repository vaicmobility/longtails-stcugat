-- DNI/NIE de l'altra persona adulta autoritzada (també a les preinscripcions).
-- Les actes el desen dins cessio_actes.dades (adult_document), sense canvis d'esquema.
-- No esborra res: la funció antiga crear_preinscripcio es manté; l'app passa a fer servir crear_preinscripcio_v2.

alter table public.preinscripcions
  add column if not exists adult_document text check (length(adult_document) <= 20);

create or replace function public.crear_preinscripcio_v2(
  _email text, _nom text, _document text, _telefon text, _escola_bressol text,
  _infant text, _adult_nom text, _adult_document text, _privacitat_versio text
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

  insert into preinscripcions (email, nom, document, telefon, escola_bressol, infant_unitat_familiar,
                               adult_nom, adult_document, privacitat_versio, client_id)
  values (e, trim(_nom), upper(trim(_document)), nullif(trim(_telefon), ''), nullif(trim(_escola_bressol), ''),
          nullif(trim(_infant), ''), nullif(trim(_adult_nom), ''), nullif(upper(trim(_adult_document)), ''),
          _privacitat_versio, programa_longtails_client_id());
end;
$$;

revoke all on function public.crear_preinscripcio_v2(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.crear_preinscripcio_v2(text, text, text, text, text, text, text, text, text) to anon, authenticated;
