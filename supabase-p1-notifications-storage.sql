-- LBID P1 migration: notifications, document storage, realtime and admin verification.
-- Run after the v3/v4 schema migrations.

alter table public.company_profiles
  add column if not exists verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.users(id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type text not null,
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_owner_select" on public.notifications;
drop policy if exists "notifications_owner_insert" on public.notifications;
drop policy if exists "notifications_owner_update" on public.notifications;

create policy "notifications_owner_select"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "notifications_owner_insert"
  on public.notifications for insert
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "notifications_owner_update"
  on public.notifications for update
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

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
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_bucket_authenticated_read" on storage.objects;
drop policy if exists "documents_bucket_authenticated_insert" on storage.objects;

create policy "documents_bucket_authenticated_read"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "documents_bucket_authenticated_insert"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.notifications;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
