-- On es mostra cada text de la Documentació (lliurament / retorn) i clau fixa per als textos que van al PDF. No destructiu.
alter table public.programa_documents
  add column if not exists mostrar_lliurament boolean not null default true,
  add column if not exists mostrar_retorn boolean not null default false,
  add column if not exists clau text;
create unique index if not exists programa_documents_clau_key on public.programa_documents (clau) where clau is not null;
comment on column public.programa_documents.mostrar_lliurament is 'Es mostra per llegir abans de signar l''acta de lliurament';
comment on column public.programa_documents.mostrar_retorn is 'Es mostra per llegir abans de signar l''acta de devolució';
comment on column public.programa_documents.clau is 'Identificador fix per als textos que s''imprimeixen al PDF (p. ex. manifestacions_addicionals)';
update public.programa_documents set mostrar_lliurament = false, mostrar_retorn = true where id = 'a893ae40-456d-430e-a6dc-fd713e044fc9';
update public.programa_documents set clau = 'manifestacions_addicionals' where id = 'd2ba6590-b954-46f6-abe7-a0f11e774e16';
