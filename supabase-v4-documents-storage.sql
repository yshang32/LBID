insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_storage_read" on storage.objects;
drop policy if exists "documents_storage_upload" on storage.objects;
drop policy if exists "documents_storage_update_owner" on storage.objects;

create policy "documents_storage_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "documents_storage_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and owner = (select auth.uid())
  );

create policy "documents_storage_update_owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documents'
    and owner = (select auth.uid())
  )
  with check (
    bucket_id = 'documents'
    and owner = (select auth.uid())
  );
