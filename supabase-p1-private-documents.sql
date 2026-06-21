-- LBID P1: make order documents private and serve them only through signed URLs.
-- Run this after supabase-v4-documents-storage.sql and supabase-rls-policies.sql.

-- Preserve access to existing uploaded files before closing the public bucket.
update public.documents
set file_url = 'storage://documents/' || substring(file_url from '/storage/v1/object/public/documents/(.+)$')
where file_url like '%/storage/v1/object/public/documents/%';

update public.quotations
set pdf_url = 'storage://documents/' || substring(pdf_url from '/storage/v1/object/public/documents/(.+)$')
where pdf_url like '%/storage/v1/object/public/documents/%';

update storage.buckets
set public = false
where id = 'documents';

-- Browser clients never access this bucket directly; LBID route handlers authorize
-- order parties and issue short-lived signed URLs using the service role.
drop policy if exists "documents_storage_read" on storage.objects;
drop policy if exists "documents_storage_upload" on storage.objects;
drop policy if exists "documents_storage_update_owner" on storage.objects;
drop policy if exists "documents_bucket_authenticated_read" on storage.objects;
drop policy if exists "documents_bucket_authenticated_insert" on storage.objects;
