create schema if not exists app_private;

create or replace function app_private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.users where id = (select auth.uid())
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.current_user_role() = 'admin'::public.user_role, false)
$$;

create or replace function app_private.is_forwarder()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.current_user_role() = 'forwarder'::public.user_role, false)
$$;

create or replace function app_private.is_agency()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.current_user_role() = 'agency'::public.user_role, false)
$$;

create or replace function app_private.is_shipment_agency(p_sr_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.shipment_requests
    where id = p_sr_id
      and agent_id = (select auth.uid())
  )
$$;

create or replace function app_private.is_order_party(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.orders o
    join public.quotations q on q.id = o.quotation_id
    join public.shipment_requests sr on sr.id = q.shipment_request_id
    where o.id = p_order_id
      and (sr.agent_id = (select auth.uid()) or q.forwarder_id = (select auth.uid()))
  )
$$;

create or replace function app_private.is_match_party(p_match_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.match_records
    where id = p_match_record_id
      and (agent_id = (select auth.uid()) or forwarder_id = (select auth.uid()))
  )
$$;

grant usage on schema app_private to anon, authenticated;
grant execute on all functions in schema app_private to anon, authenticated;

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

drop policy if exists "own profile edit" on public.company_profiles;
drop policy if exists "public directory read" on public.company_profiles;
drop policy if exists "own subscription read" on public.subscriptions;
drop policy if exists "own token history" on public.token_transactions;
drop policy if exists "own payment intents" on public.payment_intents;
drop policy if exists "own reputation events" on public.reputation_events;
drop policy if exists "own directory boosts" on public.directory_boosts;

drop policy if exists "users_select_self_or_admin" on public.users;
drop policy if exists "users_insert_self" on public.users;
drop policy if exists "users_update_self_or_admin" on public.users;
drop policy if exists "forwarder_profiles_public_select" on public.forwarder_profiles;
drop policy if exists "forwarder_profiles_owner_write" on public.forwarder_profiles;
drop policy if exists "shipment_requests_role_select" on public.shipment_requests;
drop policy if exists "shipment_requests_agency_insert" on public.shipment_requests;
drop policy if exists "shipment_requests_agency_update" on public.shipment_requests;
drop policy if exists "bids_sealed_select" on public.bids;
drop policy if exists "bids_forwarder_insert" on public.bids;
drop policy if exists "bids_forwarder_update" on public.bids;
drop policy if exists "quotations_role_select" on public.quotations;
drop policy if exists "quotations_forwarder_insert" on public.quotations;
drop policy if exists "quotations_forwarder_update" on public.quotations;
drop policy if exists "orders_party_select" on public.orders;
drop policy if exists "orders_party_update" on public.orders;
drop policy if exists "documents_party_select" on public.documents;
drop policy if exists "documents_party_insert" on public.documents;
drop policy if exists "documents_owner_update" on public.documents;
drop policy if exists "messages_party_select" on public.messages;
drop policy if exists "messages_party_insert" on public.messages;
drop policy if exists "reviews_party_select" on public.reviews;
drop policy if exists "reviews_agency_insert" on public.reviews;
drop policy if exists "match_records_party_select" on public.match_records;
drop policy if exists "rate_cards_party_select" on public.rate_cards;
drop policy if exists "rate_cards_forwarder_write" on public.rate_cards;
drop policy if exists "reorders_party_select" on public.reorders;
drop policy if exists "reorders_party_insert" on public.reorders;
drop policy if exists "volume_tracking_party_select" on public.volume_tracking;
drop policy if exists "company_profiles_select_public_owner_admin" on public.company_profiles;
drop policy if exists "company_profiles_insert_owner" on public.company_profiles;
drop policy if exists "company_profiles_update_owner_admin" on public.company_profiles;
drop policy if exists "subscriptions_owner_admin_select" on public.subscriptions;
drop policy if exists "payment_intents_owner_admin_select" on public.payment_intents;
drop policy if exists "payment_intents_owner_insert" on public.payment_intents;
drop policy if exists "token_transactions_owner_admin_select" on public.token_transactions;
drop policy if exists "reputation_events_owner_admin_select" on public.reputation_events;
drop policy if exists "directory_boosts_owner_admin_select" on public.directory_boosts;
drop policy if exists "directory_boosts_owner_insert" on public.directory_boosts;

create policy "users_select_self_or_admin"
  on public.users for select
  to authenticated
  using ((select app_private.is_admin()) or id = (select auth.uid()));

create policy "users_insert_self"
  on public.users for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "users_update_self_or_admin"
  on public.users for update
  to authenticated
  using ((select app_private.is_admin()) or id = (select auth.uid()))
  with check ((select app_private.is_admin()) or id = (select auth.uid()));

create policy "forwarder_profiles_public_select"
  on public.forwarder_profiles for select
  to anon, authenticated
  using (verified_at is not null or user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "forwarder_profiles_owner_write"
  on public.forwarder_profiles for all
  to authenticated
  using ((select app_private.is_admin()) or user_id = (select auth.uid()))
  with check ((select app_private.is_admin()) or user_id = (select auth.uid()));

create policy "shipment_requests_role_select"
  on public.shipment_requests for select
  to authenticated
  using ((select app_private.is_admin()) or agent_id = (select auth.uid()) or (status = 'OPEN' and (select app_private.is_forwarder())));

create policy "shipment_requests_agency_insert"
  on public.shipment_requests for insert
  to authenticated
  with check ((select app_private.is_admin()) or ((select app_private.is_agency()) and agent_id = (select auth.uid())));

create policy "shipment_requests_agency_update"
  on public.shipment_requests for update
  to authenticated
  using ((select app_private.is_admin()) or agent_id = (select auth.uid()))
  with check ((select app_private.is_admin()) or agent_id = (select auth.uid()));

create policy "bids_sealed_select"
  on public.bids for select
  to authenticated
  using (
    (select app_private.is_admin())
    or forwarder_id = (select auth.uid())
    or exists (
      select 1
      from public.shipment_requests sr
      where sr.id = bids.sr_id
        and sr.agent_id = (select auth.uid())
        and sr.bid_deadline <= now()
    )
  );

create policy "bids_forwarder_insert"
  on public.bids for insert
  to authenticated
  with check ((select app_private.is_admin()) or ((select app_private.is_forwarder()) and forwarder_id = (select auth.uid())));

create policy "bids_forwarder_update"
  on public.bids for update
  to authenticated
  using ((select app_private.is_admin()) or forwarder_id = (select auth.uid()))
  with check ((select app_private.is_admin()) or forwarder_id = (select auth.uid()));

create policy "quotations_role_select"
  on public.quotations for select
  to authenticated
  using (
    (select app_private.is_admin())
    or forwarder_id = (select auth.uid())
    or (select app_private.is_shipment_agency(shipment_request_id))
  );

create policy "quotations_forwarder_insert"
  on public.quotations for insert
  to authenticated
  with check ((select app_private.is_admin()) or ((select app_private.is_forwarder()) and forwarder_id = (select auth.uid())));

create policy "quotations_forwarder_update"
  on public.quotations for update
  to authenticated
  using ((select app_private.is_admin()) or forwarder_id = (select auth.uid()))
  with check ((select app_private.is_admin()) or forwarder_id = (select auth.uid()));

create policy "orders_party_select"
  on public.orders for select
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_order_party(id)));

create policy "orders_party_update"
  on public.orders for update
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_order_party(id)))
  with check ((select app_private.is_admin()) or (select app_private.is_order_party(id)));

create policy "documents_party_select"
  on public.documents for select
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_order_party(order_id)));

create policy "documents_party_insert"
  on public.documents for insert
  to authenticated
  with check (((select app_private.is_admin()) or (select app_private.is_order_party(order_id))) and uploaded_by = (select auth.uid()));

create policy "documents_owner_update"
  on public.documents for update
  to authenticated
  using ((select app_private.is_admin()) or uploaded_by = (select auth.uid()))
  with check ((select app_private.is_admin()) or uploaded_by = (select auth.uid()));

create policy "messages_party_select"
  on public.messages for select
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_order_party(order_id)));

create policy "messages_party_insert"
  on public.messages for insert
  to authenticated
  with check (((select app_private.is_admin()) or (select app_private.is_order_party(order_id))) and sender_id = (select auth.uid()));

create policy "reviews_party_select"
  on public.reviews for select
  to authenticated
  using ((select app_private.is_admin()) or agency_id = (select auth.uid()) or forwarder_id = (select auth.uid()));

create policy "reviews_agency_insert"
  on public.reviews for insert
  to authenticated
  with check (
    (select app_private.is_admin())
    or (
      agency_id = (select auth.uid())
      and exists (
        select 1
        from public.orders o
        join public.quotations q on q.id = o.quotation_id
        join public.shipment_requests sr on sr.id = q.shipment_request_id
        where o.id = reviews.order_id
          and sr.agent_id = (select auth.uid())
          and q.forwarder_id = reviews.forwarder_id
      )
    )
  );

create policy "match_records_party_select"
  on public.match_records for select
  to authenticated
  using ((select app_private.is_admin()) or agent_id = (select auth.uid()) or forwarder_id = (select auth.uid()));

create policy "rate_cards_party_select"
  on public.rate_cards for select
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_match_party(match_record_id)));

create policy "rate_cards_forwarder_write"
  on public.rate_cards for all
  to authenticated
  using ((select app_private.is_admin()) or exists (
    select 1 from public.match_records mr
    where mr.id = rate_cards.match_record_id and mr.forwarder_id = (select auth.uid())
  ))
  with check ((select app_private.is_admin()) or exists (
    select 1 from public.match_records mr
    where mr.id = rate_cards.match_record_id and mr.forwarder_id = (select auth.uid())
  ));

create policy "reorders_party_select"
  on public.reorders for select
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_match_party(match_record_id)));

create policy "reorders_party_insert"
  on public.reorders for insert
  to authenticated
  with check ((select app_private.is_admin()) or (select app_private.is_match_party(match_record_id)));

create policy "volume_tracking_party_select"
  on public.volume_tracking for select
  to authenticated
  using ((select app_private.is_admin()) or (select app_private.is_match_party(match_record_id)));

create policy "company_profiles_select_public_owner_admin"
  on public.company_profiles for select
  to anon, authenticated
  using (is_public = true or user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "company_profiles_insert_owner"
  on public.company_profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "company_profiles_update_owner_admin"
  on public.company_profiles for update
  to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()))
  with check (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "subscriptions_owner_admin_select"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "payment_intents_owner_admin_select"
  on public.payment_intents for select
  to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "payment_intents_owner_insert"
  on public.payment_intents for insert
  to authenticated
  with check (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "token_transactions_owner_admin_select"
  on public.token_transactions for select
  to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "reputation_events_owner_admin_select"
  on public.reputation_events for select
  to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "directory_boosts_owner_admin_select"
  on public.directory_boosts for select
  to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

create policy "directory_boosts_owner_insert"
  on public.directory_boosts for insert
  to authenticated
  with check (user_id = (select auth.uid()) or (select app_private.is_admin()));
