-- Actes de lliurament / retorn (Annex I i II) del programa de cessions
-- Només el personal VAIC (rol admin) hi pot accedir.

create table if not exists public.cessio_actes (
  id          uuid primary key default gen_random_uuid(),
  cessio_id   uuid not null references public.cessions(id) on delete cascade,
  fase        text not null check (fase in ('lliurament', 'retorn')),
  dades       jsonb not null default '{}'::jsonb,   -- camps de l'acta, elements, valoració, signatures (PNG base64)
  pdf_path    text,                                 -- ruta al bucket 'cessions'
  docx_path   text,
  fotos       text[] not null default '{}',         -- rutes al bucket 'cessions'
  signat_at   timestamptz,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cessio_id, fase)                          -- també serveix d'índex per cessio_id
);

alter table public.cessio_actes enable row level security;

create policy "Admins manage cessio_actes"
  on public.cessio_actes for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

create trigger update_cessio_actes_updated_at
  before update on public.cessio_actes
  for each row execute function public.update_updated_at_column();

create index if not exists cessio_actes_created_by_idx on public.cessio_actes (created_by);
create index if not exists cessions_usuari_email_lower_idx on public.cessions (lower(usuari_email));
create index if not exists cessions_bicicleta_id_idx on public.cessions (bicicleta_id);

-- Bucket PRIVAT per a PDFs, Word i fotos de les actes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cessions', 'cessions', false, 20971520,
        array['application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins read cessions files" on storage.objects for select to authenticated
  using (bucket_id = 'cessions' and (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins upload cessions files" on storage.objects for insert to authenticated
  with check (bucket_id = 'cessions' and (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy "Admins update cessions files" on storage.objects for update to authenticated
  using (bucket_id = 'cessions' and (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
