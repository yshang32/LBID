-- LBID P3: payment proofs are private and served only to authorised Admin routes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment_proofs_owner_read" on storage.objects;
drop policy if exists "payment_proofs_owner_insert" on storage.objects;
drop policy if exists "payment_proofs_owner_update" on storage.objects;

-- All upload, read and signed-download operations use the server service role.
