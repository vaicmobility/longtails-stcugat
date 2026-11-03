-- Gestors de flota (rol gestor_flota, vinculats a una organització via client_gestors):
-- poden LLEGIR les actes i els fitxers (PDF, Word, fotos) de les cessions de la seva organització.
-- No poden crear, modificar ni esborrar actes ni fitxers.

create policy "Gestors read org cessio_actes"
  on public.cessio_actes for select to authenticated
  using (cessio_id in (
    select c.id from public.cessions c
    where c.client_id in (select public.gestor_client_ids((select auth.uid())))
  ));

create policy "Gestors read org cessions files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cessions'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.cessions c
      where c.client_id in (select public.gestor_client_ids((select auth.uid())))
    )
  );

-- També les bicis de les cessions de la seva organització (encara que el contracte ja s'hagi tancat),
-- perquè l'històric de cessions continuï mostrant codi, marca i model.
create policy "Gestors view bikes of org cessions"
  on public.bicicletes for select to authenticated
  using (id in (
    select c.bicicleta_id from public.cessions c
    where c.client_id in (select public.gestor_client_ids((select auth.uid())))
  ));
