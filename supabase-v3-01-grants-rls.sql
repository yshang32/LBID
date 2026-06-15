-- LBID v3 grants and RLS bootstrap.
-- Run after src/lib/schema.sql and supabase-rls-policies.sql.

create schema if not exists app_private;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.company_profiles to anon;

grant select, insert, update on public.users to authenticated;
grant select, insert, update on public.forwarder_profiles to authenticated;
grant select, insert, update on public.shipment_requests to authenticated;
grant select, insert, update on public.bids to authenticated;
grant select, insert, update on public.quotations to authenticated;
grant select, update on public.orders to authenticated;
grant select, insert, update on public.documents to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.reviews to authenticated;
grant select on public.match_records to authenticated;
grant select, insert, update on public.rate_cards to authenticated;
grant select, insert on public.reorders to authenticated;
grant select on public.volume_tracking to authenticated;
grant select, insert, update on public.company_profiles to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert on public.payment_intents to authenticated;
grant select on public.token_transactions to authenticated;
grant select on public.reputation_events to authenticated;
grant select, insert on public.directory_boosts to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter table public.users enable row level security;
alter table public.forwarder_profiles enable row level security;
alter table public.shipment_requests enable row level security;
alter table public.bids enable row level security;
alter table public.quotations enable row level security;
alter table public.orders enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.match_records enable row level security;
alter table public.rate_cards enable row level security;
alter table public.reorders enable row level security;
alter table public.volume_tracking enable row level security;
alter table public.company_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.token_transactions enable row level security;
alter table public.payment_intents enable row level security;
alter table public.reputation_events enable row level security;
alter table public.directory_boosts enable row level security;
