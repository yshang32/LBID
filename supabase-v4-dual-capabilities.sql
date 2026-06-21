-- LBID product decision: each non-admin company can both create requests and submit bids.
alter table public.company_profiles
  add column if not exists can_be_client boolean not null default true,
  add column if not exists can_be_forwarder boolean not null default true;

create index if not exists company_profiles_capabilities_idx
  on public.company_profiles (can_be_client, can_be_forwarder);

update public.company_profiles as profile
set can_be_client = true,
    can_be_forwarder = true
from public.users as account
where account.id = profile.user_id
  and account.role <> 'admin';
