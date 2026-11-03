-- Portal d'usuaris (/portal): la persona beneficiària entra amb el seu correu (enllaç d'accés de Supabase Auth)
-- i pot LLEGIR les seves cessions, actes, fitxers, la bici assignada i la seva preinscripció.
-- Només amb el correu verificat (email_confirmed_at), comparat amb cessions.usuari_email / preinscripcions.email.

create or replace function public.email_verificat()
returns text language sql stable security definer set search_path = public, auth as $$
  select lower(u.email) from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null
$$;
revoke all on function public.email_verificat() from public, anon;
grant execute on function public.email_verificat() to authenticated;

create or replace function public.usuari_cessio_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select c.id from cessions c where lower(c.usuari_email) = public.email_verificat()
$$;
revoke all on function public.usuari_cessio_ids() from public, anon;
grant execute on function public.usuari_cessio_ids() to authenticated;

create policy "Usuaris read own cessions"
  on public.cessions for select to authenticated
  using (id in (select public.usuari_cessio_ids()));

create policy "Usuaris read own cessio_actes"
  on public.cessio_actes for select to authenticated
  using (cessio_id in (select public.usuari_cessio_ids()));

create policy "Usuaris read own cessions files"
  on storage.objects for select to authenticated
  using (bucket_id = 'cessions' and (storage.foldername(name))[1] in (select id::text from public.usuari_cessio_ids() as id));

create policy "Usuaris view bikes of own cessions"
  on public.bicicletes for select to authenticated
  using (id in (select c.bicicleta_id from public.cessions c where c.id in (select public.usuari_cessio_ids())));

create policy "Usuaris read own preinscripcions"
  on public.preinscripcions for select to authenticated
  using (lower(email) = (select public.email_verificat()));
