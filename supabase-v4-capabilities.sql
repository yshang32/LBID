alter table public.company_profiles
  add column if not exists can_be_client boolean not null default true,
  add column if not exists can_be_forwarder boolean not null default false;

create index if not exists company_profiles_capabilities_idx
  on public.company_profiles (can_be_client, can_be_forwarder);
