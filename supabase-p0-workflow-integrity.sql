-- LBID P0 workflow integrity.
-- Run in the Supabase SQL Editor after supabase-rls-policies.sql and supabase-v4-accept-bid-rpc.sql.

begin;

-- A company may amend its request only while it is waiting for manual review.
-- This prevents direct Data API calls from opening a bid window or extending its deadline.
drop policy if exists "shipment_requests_agency_update" on public.shipment_requests;
create policy "shipment_requests_agency_update"
  on public.shipment_requests for update
  to authenticated
  using (
    (select app_private.is_admin())
    or (agent_id = (select auth.uid()) and status = 'PENDING_REVIEW')
  )
  with check (
    (select app_private.is_admin())
    or (agent_id = (select auth.uid()) and status = 'PENDING_REVIEW')
  );

-- Awarding is permitted only after the sealed window has closed.
create or replace function public.accept_bid_to_order(
  p_bid_id uuid,
  p_requester_id uuid,
  p_total_amount numeric default null,
  p_line_items jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bid public.bids%rowtype;
  v_sr public.shipment_requests%rowtype;
  v_quotation public.quotations%rowtype;
  v_order public.orders%rowtype;
  v_match public.match_records%rowtype;
  v_public_token text;
  v_line_items jsonb;
begin
  if auth.role() <> 'service_role' or p_requester_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select * into v_bid from public.bids where id = p_bid_id for update;
  if not found then raise exception 'BID_NOT_FOUND'; end if;

  select * into v_sr from public.shipment_requests where id = v_bid.sr_id for update;
  if not found then raise exception 'SR_NOT_FOUND'; end if;
  if v_sr.agent_id <> p_requester_id then raise exception 'ONLY_AGENCY_OWNER_CAN_ACCEPT_BID'; end if;
  if v_sr.status = 'AWARDED' then raise exception 'SR_ALREADY_AWARDED'; end if;
  if v_sr.status <> 'CLOSED' or v_sr.bid_deadline > now() then raise exception 'BID_WINDOW_NOT_CLOSED'; end if;

  v_public_token := 'qt_' || replace(gen_random_uuid()::text, '-', '');
  v_line_items := coalesce(p_line_items, jsonb_build_array(jsonb_build_object(
    'label', 'Accepted sealed bid', 'quantity', 1, 'unit', 'shipment',
    'amount', v_bid.price, 'currency', v_bid.currency, 'notes', v_bid.terms
  )));

  insert into public.quotations (shipment_request_id, forwarder_id, line_items, total_amount, public_token, status)
  values (v_sr.id, v_bid.forwarder_id, v_line_items, coalesce(p_total_amount, v_bid.price), v_public_token, 'accepted')
  returning * into v_quotation;

  insert into public.orders (quotation_id, status)
  values (v_quotation.id, 'confirmed')
  returning * into v_order;

  insert into public.match_records (
    shipment_request_id, agent_id, forwarder_id, winning_quotation_id,
    is_preferred_partner, rate_card_snapshot, stage, contact_revealed_at
  ) values (
    v_sr.id, v_sr.agent_id, v_bid.forwarder_id, v_quotation.id, true,
    jsonb_build_object(
      'source', 'accepted_sealed_bid', 'bid_id', v_bid.id,
      'total_amount', v_quotation.total_amount, 'currency', v_bid.currency,
      'route', v_sr.route, 'services_needed', v_sr.services_needed,
      'transit_time', v_bid.transit_time
    ),
    'order_created', now()
  ) returning * into v_match;

  update public.shipment_requests set status = 'AWARDED' where id = v_sr.id;

  return jsonb_build_object(
    'bid_id', v_bid.id,
    'quotation', jsonb_build_object(
      'id', v_quotation.id, 'shipment_request_id', v_quotation.shipment_request_id,
      'forwarder_id', v_quotation.forwarder_id, 'line_items', v_quotation.line_items,
      'total_amount', v_quotation.total_amount, 'public_token', v_quotation.public_token,
      'status', v_quotation.status, 'created_at', v_quotation.created_at
    ),
    'order', jsonb_build_object(
      'id', v_order.id, 'quotation_id', v_order.quotation_id,
      'status', v_order.status, 'created_at', v_order.created_at
    ),
    'match_record', jsonb_build_object(
      'id', v_match.id, 'shipment_request_id', v_match.shipment_request_id,
      'agent_id', v_match.agent_id, 'forwarder_id', v_match.forwarder_id,
      'winning_quotation_id', v_match.winning_quotation_id,
      'stage', v_match.stage, 'contact_revealed_at', v_match.contact_revealed_at,
      'matched_at', v_match.matched_at
    )
  );
end;
$$;

revoke execute on function public.accept_bid_to_order(uuid, uuid, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.accept_bid_to_order(uuid, uuid, numeric, jsonb) to service_role;

commit;
