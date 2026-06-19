create or replace function app_private.can_create_sr()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_admin(), false)
    or exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role = 'agency'::public.user_role
    )
    or exists (
      select 1
      from public.company_profiles cp
      where cp.user_id = (select auth.uid())
        and cp.can_be_client = true
    )
$$;

create or replace function app_private.can_submit_bid()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(app_private.is_admin(), false)
    or exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.role = 'forwarder'::public.user_role
    )
    or exists (
      select 1
      from public.company_profiles cp
      where cp.user_id = (select auth.uid())
        and cp.can_be_forwarder = true
    )
$$;

grant execute on function app_private.can_create_sr() to anon, authenticated;
grant execute on function app_private.can_submit_bid() to anon, authenticated;

drop policy if exists "shipment_requests_role_select" on public.shipment_requests;
drop policy if exists "shipment_requests_agency_insert" on public.shipment_requests;
drop policy if exists "bids_forwarder_insert" on public.bids;
drop policy if exists "bids_forwarder_update" on public.bids;
drop policy if exists "quotations_forwarder_insert" on public.quotations;
drop policy if exists "quotations_forwarder_update" on public.quotations;

create policy "shipment_requests_role_select"
  on public.shipment_requests for select
  to authenticated
  using ((select app_private.is_admin()) or agent_id = (select auth.uid()) or (status = 'OPEN' and (select app_private.can_submit_bid())));

create policy "shipment_requests_agency_insert"
  on public.shipment_requests for insert
  to authenticated
  with check (((select app_private.can_create_sr()) or (select app_private.is_admin())) and agent_id = (select auth.uid()));

create policy "bids_forwarder_insert"
  on public.bids for insert
  to authenticated
  with check (((select app_private.can_submit_bid()) or (select app_private.is_admin())) and forwarder_id = (select auth.uid()));

create policy "bids_forwarder_update"
  on public.bids for update
  to authenticated
  using ((select app_private.is_admin()) or forwarder_id = (select auth.uid()))
  with check (((select app_private.can_submit_bid()) or (select app_private.is_admin())) and forwarder_id = (select auth.uid()));

create policy "quotations_forwarder_insert"
  on public.quotations for insert
  to authenticated
  with check (((select app_private.can_submit_bid()) or (select app_private.is_admin())) and forwarder_id = (select auth.uid()));

create policy "quotations_forwarder_update"
  on public.quotations for update
  to authenticated
  using ((select app_private.is_admin()) or forwarder_id = (select auth.uid()))
  with check (((select app_private.can_submit_bid()) or (select app_private.is_admin())) and forwarder_id = (select auth.uid()));
