-- Permisos exclusivos para el bucket privado apaqro-interno.
-- El script de configuración crea el bucket mediante la API de Storage.
begin;

-- Esta restricción también protege el bucket frente a políticas permisivas
-- preexistentes. No cambia el acceso a los demás buckets.
drop policy if exists "apaqro_internal_guard" on storage.objects;
create policy "apaqro_internal_guard" on storage.objects
as restrictive for all to public
using (
  bucket_id <> 'apaqro-interno'
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'apaqro_role') = 'team'
    and (storage.foldername(name))[1] in ('animales-nuevos', 'eventos', 'colaboradores')
  )
)
with check (
  bucket_id <> 'apaqro-interno'
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'apaqro_role') = 'team'
    and (storage.foldername(name))[1] in ('animales-nuevos', 'eventos', 'colaboradores')
  )
);

drop policy if exists "apaqro_internal_read" on storage.objects;
create policy "apaqro_internal_read" on storage.objects
for select to authenticated
using (
  bucket_id = 'apaqro-interno'
  and (select auth.jwt() -> 'app_metadata' ->> 'apaqro_role') = 'team'
  and (storage.foldername(name))[1] in ('animales-nuevos', 'eventos', 'colaboradores')
);

drop policy if exists "apaqro_internal_upload" on storage.objects;
create policy "apaqro_internal_upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'apaqro-interno'
  and (select auth.jwt() -> 'app_metadata' ->> 'apaqro_role') = 'team'
  and (storage.foldername(name))[1] in ('animales-nuevos', 'eventos', 'colaboradores')
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

commit;
