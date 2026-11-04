-- Dades del llistat d'assignació de l'Ajuntament (prova pilot) a les preinscripcions,
-- per omplir el lliurament automàticament. No esborra res.
alter table public.preinscripcions
  add column if not exists num_assignacio integer,
  add column if not exists servei_gestor text check (length(servei_gestor) <= 200),
  add column if not exists data_lliurament date,
  add column if not exists data_retorn_prevista date,
  add column if not exists lloc_lliurament text check (length(lloc_lliurament) <= 200),
  add column if not exists lloc_retorn text check (length(lloc_retorn) <= 200),
  add column if not exists origen text not null default 'formulari' check (origen in ('formulari', 'importacio'));
-- Les importades no tenen acceptació en línia de la privacitat (queda null).
alter table public.preinscripcions alter column privacitat_acceptada_at drop not null;
alter table public.preinscripcions alter column privacitat_acceptada_at set default now();
