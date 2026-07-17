-- LBID P0 transaction integrity and hybrid Shipment Request validation.
-- Additive migration: existing requests and bids remain available as LEGACY records.

begin;

alter table public.shipment_requests
  alter column status set default 'PENDING_REVIEW',
  alter column bid_deadline drop not null,
  alter column bid_deadline drop default;

alter table public.shipment_requests
  add column if not exists validation_decision text not null default 'LEGACY',
  add column if not exists validation_reasons jsonb not null default '[]'::jsonb,
  add column if not exists validation_score smallint,
  add column if not exists review_required boolean not null default true,
  add column if not exists scope_version integer not null default 1,
  add column if not exists scope_hash text,
  add column if not exists scope_locked_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists supersedes_request_id uuid references public.shipment_requests(id),
  add column if not exists idempotency_key text;

create unique index if not exists shipment_requests_agent_idempotency_uidx
  on public.shipment_requests (agent_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists shipment_requests_open_deadline_idx
  on public.shipment_requests (bid_deadline)
  where status = 'OPEN';
create index if not exists shipment_requests_supersedes_idx
  on public.shipment_requests (supersedes_request_id)
  where supersedes_request_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shipment_requests_scope_version_check') then
    alter table public.shipment_requests
      add constraint shipment_requests_scope_version_check check (scope_version > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'shipment_requests_open_integrity_check') then
    alter table public.shipment_requests
      add constraint shipment_requests_open_integrity_check
      check (status <> 'OPEN' or (bid_deadline is not null and scope_locked_at is not null)) not valid;
  end if;
end;
$$;

alter table public.bids add column if not exists status text;
alter table public.bids add column if not exists scope_version integer;
update public.bids b
set status = coalesce(b.status, 'LEGACY'),
    scope_version = coalesce(b.scope_version, sr.scope_version, 1)
from public.shipment_requests sr
where sr.id = b.sr_id and (b.status is null or b.scope_version is null);
alter table public.bids alter column status set default 'SUBMITTED';
alter table public.bids alter column status set not null;
alter table public.bids alter column scope_version set default 1;
alter table public.bids alter column scope_version set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bids_status_check') then
    alter table public.bids add constraint bids_status_check
      check (status in ('LEGACY', 'SUBMITTED', 'AWARDED', 'NOT_AWARDED', 'VOID_SCOPE_CHANGED', 'WITHDRAWN'));
  end if;
end;
$$;

-- Historical duplicate bid pairs remain LEGACY. New final submissions are unique.
create unique index if not exists bids_one_final_submission_uidx
  on public.bids (sr_id, forwarder_id)
  where status = 'SUBMITTED';
create index if not exists bids_sr_scope_status_idx
  on public.bids (sr_id, scope_version, status);

create table if not exists public.payment_events (
  event_id text primary key,
  provider text not null default 'stripe',
  event_type text not null,
  payment_intent_id uuid references public.payment_intents(id),
  status text not null default 'processing',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_events_status_check check (status in ('processing', 'processed', 'failed'))
);
alter table public.payment_events enable row level security;
drop policy if exists "payment_events_service_role_all" on public.payment_events;
create policy "payment_events_service_role_all"
  on public.payment_events for all
  to service_role
  using (true)
  with check (true);

create unique index if not exists payment_intents_stripe_session_uidx
  on public.payment_intents (stripe_session_id)
  where stripe_session_id is not null;
create unique index if not exists token_transactions_payment_credit_uidx
  on public.token_transactions (related_payment_intent_id)
  where source = 'token_package' and type = 'purchase' and related_payment_intent_id is not null;
create unique index if not exists token_transactions_bid_refund_uidx
  on public.token_transactions (related_bid_id)
  where source = 'bid' and type = 'refund' and related_bid_id is not null;
create unique index if not exists quotations_one_accepted_per_sr_uidx
  on public.quotations (shipment_request_id)
  where status = 'accepted';
create unique index if not exists orders_one_per_quotation_uidx
  on public.orders (quotation_id);
create unique index if not exists match_records_one_per_sr_uidx
  on public.match_records (shipment_request_id);

-- Data API users may read through RLS, but transaction state changes go through server APIs/RPC only.
revoke insert, update, delete on public.shipment_requests from authenticated;
revoke insert, update, delete on public.bids from authenticated;
grant select on public.shipment_requests, public.bids to authenticated;
revoke all on public.payment_events from public, anon, authenticated;
grant select, insert, update, delete on public.payment_events to service_role;

drop policy if exists "shipment_requests_agency_insert" on public.shipment_requests;
drop policy if exists "shipment_requests_agency_update" on public.shipment_requests;
drop policy if exists "bids_forwarder_insert" on public.bids;
drop policy if exists "bids_forwarder_update" on public.bids;

create or replace function app_private.submit_bid_with_token_impl(
  p_user_id uuid,
  p_sr_id uuid,
  p_price numeric,
  p_currency text,
  p_transit_time text,
  p_terms text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sr public.shipment_requests%rowtype;
  v_free_balance int;
  v_paid_balance int;
  v_deduct_from text;
  v_bid_id uuid;
  v_txn_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'UNAUTHORIZED'; end if;
  if p_price is null or p_price <= 0 then raise exception 'INVALID_BID_PRICE'; end if;
  if coalesce(trim(p_currency), '') !~ '^[A-Za-z]{3}$' then raise exception 'INVALID_BID_CURRENCY'; end if;

  select * into v_sr from public.shipment_requests where id = p_sr_id for share;
  if not found or v_sr.status <> 'OPEN' or v_sr.bid_deadline is null or v_sr.bid_deadline <= now()
    or v_sr.scope_locked_at is null then
    raise exception 'SHIPMENT_REQUEST_NOT_OPEN';
  end if;

  select token_balance_free, token_balance_paid
    into v_free_balance, v_paid_balance
    from public.company_profiles
    where user_id = p_user_id and can_be_forwarder = true
    for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  if exists (
    select 1 from public.bids
    where sr_id = p_sr_id and forwarder_id = p_user_id and status = 'SUBMITTED'
  ) then raise exception 'BID_ALREADY_SUBMITTED'; end if;

  if (v_free_balance + v_paid_balance) < 1 then raise exception 'INSUFFICIENT_TOKENS'; end if;
  if v_free_balance >= 1 then
    v_deduct_from := 'free';
    update public.company_profiles set token_balance_free = token_balance_free - 1 where user_id = p_user_id;
  else
    v_deduct_from := 'paid';
    update public.company_profiles set token_balance_paid = token_balance_paid - 1 where user_id = p_user_id;
  end if;

  begin
    insert into public.bids (
      sr_id, forwarder_id, price, currency, transit_time, terms, submitted_at, status, scope_version
    ) values (
      p_sr_id, p_user_id, p_price, upper(p_currency), nullif(trim(p_transit_time), ''),
      nullif(trim(p_terms), ''), now(), 'SUBMITTED', v_sr.scope_version
    ) returning id into v_bid_id;
  exception when unique_violation then
    raise exception 'BID_ALREADY_SUBMITTED';
  end;

  insert into public.token_transactions (
    user_id, type, source, amount, balance_type, related_bid_id, balance_after, created_at
  ) values (
    p_user_id, 'spend', 'bid', -1, v_deduct_from, v_bid_id,
    (select token_balance_free + token_balance_paid from public.company_profiles where user_id = p_user_id), now()
  ) returning id into v_txn_id;
  update public.bids set token_transaction_id = v_txn_id where id = v_bid_id;

  return jsonb_build_object(
    'bid_id', v_bid_id, 'token_transaction_id', v_txn_id, 'scope_version', v_sr.scope_version,
    'deducted_from', v_deduct_from,
    'remaining_free', (select token_balance_free from public.company_profiles where user_id = p_user_id),
    'remaining_paid', (select token_balance_paid from public.company_profiles where user_id = p_user_id)
  );
end;
$$;

create or replace function app_private.close_expired_bid_windows()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_closed integer := 0;
begin
  with closed as (
    update public.shipment_requests
    set status = 'CLOSED', closed_at = coalesce(closed_at, now())
    where status = 'OPEN' and bid_deadline is not null and bid_deadline <= now()
    returning id
  )
  select count(*) into v_closed from closed;
  return v_closed;
end;
$$;

create or replace function public.confirm_payment_intent_atomic(
  p_intent_id uuid,
  p_confirmed_by uuid default null,
  p_event_id text default null,
  p_event_type text default 'manual.confirmed',
  p_stripe_session_id text default null,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intent public.payment_intents%rowtype;
  v_event_id text := coalesce(nullif(trim(p_event_id), ''), 'manual:' || p_intent_id::text);
  v_tokens integer;
  v_plan text;
  v_period_end timestamptz;
begin
  if auth.role() <> 'service_role' then raise exception 'UNAUTHORIZED'; end if;

  insert into public.payment_events (event_id, provider, event_type, payment_intent_id)
  values (v_event_id, case when p_stripe_session_id is null then 'manual' else 'stripe' end, p_event_type, p_intent_id)
  on conflict (event_id) do nothing;
  if not found then
    select * into v_intent from public.payment_intents where id = p_intent_id;
    return jsonb_build_object(
      'ok', true, 'already_processed', true, 'already_confirmed', v_intent.status = 'confirmed',
      'intent_id', p_intent_id, 'user_id', v_intent.user_id, 'type', v_intent.type
    );
  end if;

  select * into v_intent from public.payment_intents where id = p_intent_id for update;
  if not found then raise exception 'INVALID_INTENT'; end if;
  if v_intent.status = 'confirmed' then
    update public.payment_events set status = 'processed', processed_at = now() where event_id = v_event_id;
    return jsonb_build_object(
      'ok', true, 'already_confirmed', true, 'intent_id', p_intent_id,
      'user_id', v_intent.user_id, 'type', v_intent.type
    );
  end if;
  if v_intent.status <> 'pending' then raise exception 'INVALID_INTENT'; end if;

  update public.payment_intents
  set stripe_session_id = coalesce(p_stripe_session_id, stripe_session_id),
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
      stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id)
  where id = p_intent_id;

  if v_intent.type = 'token_purchase' then
    v_tokens := coalesce(
      nullif(v_intent.related_token_package ->> 'tokens', '')::integer,
      nullif(v_intent.related_plan ->> 'tokens', '')::integer,
      0
    );
    if v_tokens <= 0 then raise exception 'INVALID_TOKEN_PACKAGE'; end if;
    perform 1 from public.company_profiles where user_id = v_intent.user_id for update;
    if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
    update public.company_profiles set token_balance_paid = token_balance_paid + v_tokens
    where user_id = v_intent.user_id;
    insert into public.token_transactions (
      user_id, type, source, amount, balance_type, related_payment_intent_id, balance_after
    ) values (
      v_intent.user_id, 'purchase', 'token_package', v_tokens, 'paid', p_intent_id,
      (select token_balance_free + token_balance_paid from public.company_profiles where user_id = v_intent.user_id)
    );
  elsif v_intent.type = 'subscription' then
    v_plan := coalesce(v_intent.related_plan ->> 'plan_id', v_intent.related_plan ->> 'id', 'monthly');
    v_period_end := now() + case when v_plan = 'annual' then interval '12 months' else interval '1 month' end;
    insert into public.subscriptions (
      user_id, plan, status, current_period_end, stripe_customer_id, stripe_subscription_id
    ) values (
      v_intent.user_id, v_plan, 'active', v_period_end,
      coalesce(p_stripe_customer_id, v_intent.stripe_customer_id),
      coalesce(p_stripe_subscription_id, v_intent.stripe_subscription_id)
    ) on conflict (user_id) do update set
      plan = excluded.plan, status = excluded.status, current_period_end = excluded.current_period_end,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id;
  end if;

  update public.payment_intents
  set status = 'confirmed', confirmed_by = p_confirmed_by, confirmed_at = now()
  where id = p_intent_id;
  update public.payment_events set status = 'processed', processed_at = now() where event_id = v_event_id;

  return jsonb_build_object(
    'ok', true, 'intent_id', p_intent_id, 'user_id', v_intent.user_id,
    'type', v_intent.type, 'already_confirmed', false, 'already_processed', false
  );
end;
$$;

create or replace function public.accept_bid_to_order_v2(
  p_bid_id uuid,
  p_requester_id uuid,
  p_selection_reason text default null,
  p_selection_context jsonb default '{}'::jsonb,
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
  v_lowest numeric;
  v_is_lowest boolean;
  v_public_token text;
  v_line_items jsonb;
  v_cooling_off_until timestamptz := now() + interval '24 hours';
begin
  if auth.role() <> 'service_role' or p_requester_id is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_bid from public.bids where id = p_bid_id for update;
  if not found then raise exception 'BID_NOT_FOUND'; end if;
  select * into v_sr from public.shipment_requests where id = v_bid.sr_id for update;
  if not found then raise exception 'SR_NOT_FOUND'; end if;
  if v_sr.agent_id <> p_requester_id then raise exception 'ONLY_AGENCY_OWNER_CAN_ACCEPT_BID'; end if;
  if v_sr.status = 'AWARDED' then raise exception 'SR_ALREADY_AWARDED'; end if;
  if v_sr.status <> 'CLOSED' or v_sr.bid_deadline is null or v_sr.bid_deadline > now() then
    raise exception 'BID_WINDOW_NOT_CLOSED';
  end if;
  if v_bid.scope_version <> v_sr.scope_version or v_bid.status not in ('SUBMITTED', 'LEGACY') then
    raise exception 'BID_NOT_VALID_FOR_CURRENT_SCOPE';
  end if;

  select min(price) into v_lowest from public.bids
  where sr_id = v_sr.id and scope_version = v_sr.scope_version and status in ('SUBMITTED', 'LEGACY');
  v_is_lowest := v_bid.price = v_lowest;
  if not v_is_lowest and nullif(trim(p_selection_reason), '') is null then
    raise exception 'NON_LOWEST_SELECTION_REASON_REQUIRED';
  end if;

  v_public_token := 'qt_' || replace(gen_random_uuid()::text, '-', '');
  v_line_items := coalesce(p_line_items, jsonb_build_array(jsonb_build_object(
    'label', 'Accepted sealed bid', 'quantity', 1, 'unit', 'shipment',
    'amount', v_bid.price, 'currency', v_bid.currency, 'notes', v_bid.terms
  )));
  insert into public.quotations (shipment_request_id, forwarder_id, line_items, total_amount, public_token, status)
  values (v_sr.id, v_bid.forwarder_id, v_line_items, v_bid.price, v_public_token, 'accepted')
  returning * into v_quotation;
  insert into public.orders (quotation_id, status) values (v_quotation.id, 'confirmed') returning * into v_order;
  insert into public.match_records (
    shipment_request_id, agent_id, forwarder_id, winning_quotation_id,
    is_preferred_partner, rate_card_snapshot, stage, contact_revealed_at
  ) values (
    v_sr.id, v_sr.agent_id, v_bid.forwarder_id, v_quotation.id, true,
    jsonb_build_object(
      'source', 'accepted_sealed_bid', 'bid_id', v_bid.id,
      'total_amount', v_quotation.total_amount, 'currency', v_bid.currency,
      'route', v_sr.route, 'services_needed', v_sr.services_needed,
      'transit_time', v_bid.transit_time, 'was_lowest', v_is_lowest,
      'lowest_amount', v_lowest, 'selection_reason', nullif(trim(p_selection_reason), ''),
      'selection_context', coalesce(p_selection_context, '{}'::jsonb)
    ),
    'order_created', now()
  ) returning * into v_match;

  update public.bids set status = case when id = v_bid.id then 'AWARDED' else 'NOT_AWARDED' end
  where sr_id = v_sr.id and scope_version = v_sr.scope_version and status in ('SUBMITTED', 'LEGACY');
  update public.shipment_requests set
    status = 'AWARDED',
    award_cooling_off_until = v_cooling_off_until,
    legal_record = coalesce(legal_record, '{}'::jsonb) || jsonb_build_object(
      'platform_role', 'workflow_platform_not_carrier_of_record',
      'awarded_bid_id', v_bid.id, 'awarded_at', now(),
      'cooling_off_until', v_cooling_off_until, 'was_lowest', v_is_lowest,
      'lowest_amount', v_lowest, 'selected_amount', v_bid.price,
      'selection_reason', nullif(trim(p_selection_reason), '')
    )
  where id = v_sr.id;

  return jsonb_build_object(
    'bid_id', v_bid.id, 'was_lowest', v_is_lowest,
    'lowest_amount', v_lowest, 'price_difference', v_bid.price - v_lowest,
    'cooling_off_until', v_cooling_off_until,
    'quotation', to_jsonb(v_quotation), 'order', to_jsonb(v_order), 'match_record', to_jsonb(v_match)
  );
end;
$$;

create or replace function public.amend_shipment_request_scope(
  p_original_sr_id uuid,
  p_requester_id uuid,
  p_cargo_details jsonb,
  p_route jsonb,
  p_services_needed text[],
  p_deadline timestamptz,
  p_is_anonymous boolean,
  p_validation_decision text,
  p_validation_reasons jsonb,
  p_validation_score smallint,
  p_scope_hash text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_original public.shipment_requests%rowtype;
  v_new public.shipment_requests%rowtype;
  v_bid record;
  v_balance_type text;
  v_refunds integer := 0;
  v_auto boolean := p_validation_decision = 'AUTO_APPROVED';
begin
  if auth.role() <> 'service_role' then raise exception 'UNAUTHORIZED'; end if;
  select * into v_original from public.shipment_requests where id = p_original_sr_id for update;
  if not found then raise exception 'SR_NOT_FOUND'; end if;
  if v_original.agent_id <> p_requester_id then raise exception 'SR_ACCESS_DENIED'; end if;
  if v_original.status not in ('OPEN', 'CLOSED') then raise exception 'SR_SCOPE_NOT_AMENDABLE'; end if;

  insert into public.shipment_requests (
    agent_id, cargo_details, route, services_needed, deadline, bid_deadline,
    is_anonymous, status, validation_decision, validation_reasons, validation_score,
    review_required, scope_version, scope_hash, scope_locked_at, published_at,
    supersedes_request_id, idempotency_key
  ) values (
    p_requester_id, p_cargo_details, p_route, p_services_needed, p_deadline,
    case when v_auto then now() + interval '3 hours' else null end,
    coalesce(p_is_anonymous, true), case when v_auto then 'OPEN' else 'PENDING_REVIEW' end,
    p_validation_decision, coalesce(p_validation_reasons, '[]'::jsonb), p_validation_score,
    not v_auto, v_original.scope_version + 1, p_scope_hash,
    case when v_auto then now() else null end, case when v_auto then now() else null end,
    v_original.id, p_idempotency_key
  ) returning * into v_new;

  for v_bid in
    select b.*, tt.balance_type as spent_balance_type
    from public.bids b
    left join public.token_transactions tt on tt.id = b.token_transaction_id
    where b.sr_id = v_original.id and b.status in ('SUBMITTED', 'LEGACY')
    for update of b
  loop
    v_balance_type := coalesce(v_bid.spent_balance_type, 'paid');
    perform 1 from public.company_profiles where user_id = v_bid.forwarder_id for update;
    if found then
      if v_balance_type = 'free' then
        update public.company_profiles set token_balance_free = token_balance_free + 1 where user_id = v_bid.forwarder_id;
      else
        update public.company_profiles set token_balance_paid = token_balance_paid + 1 where user_id = v_bid.forwarder_id;
      end if;
      insert into public.token_transactions (
        user_id, type, source, amount, balance_type, related_bid_id, balance_after
      ) values (
        v_bid.forwarder_id, 'refund', 'bid', 1, v_balance_type, v_bid.id,
        (select token_balance_free + token_balance_paid from public.company_profiles where user_id = v_bid.forwarder_id)
      ) on conflict do nothing;
      if found then v_refunds := v_refunds + 1; end if;
    end if;
    update public.bids set status = 'VOID_SCOPE_CHANGED' where id = v_bid.id;
  end loop;

  update public.shipment_requests set
    status = 'CANCELLED', cancelled_at = now(),
    cancellation_reason = 'SUPERSEDED_BY_SCOPE_VERSION_' || v_new.scope_version::text,
    legal_record = coalesce(legal_record, '{}'::jsonb) || jsonb_build_object(
      'superseded_by', v_new.id, 'superseded_at', now(), 'token_refunds', v_refunds
    )
  where id = v_original.id;

  return jsonb_build_object('shipment_request', to_jsonb(v_new), 'refunded_bids', v_refunds);
end;
$$;

revoke execute on function public.confirm_payment_intent_atomic(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.accept_bid_to_order_v2(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.amend_shipment_request_scope(uuid, uuid, jsonb, jsonb, text[], timestamptz, boolean, text, jsonb, smallint, text, text) from public, anon, authenticated;
grant execute on function public.confirm_payment_intent_atomic(uuid, uuid, text, text, text, text, text) to service_role;
grant execute on function public.accept_bid_to_order_v2(uuid, uuid, text, jsonb, jsonb) to service_role;
grant execute on function public.amend_shipment_request_scope(uuid, uuid, jsonb, jsonb, text[], timestamptz, boolean, text, jsonb, smallint, text, text) to service_role;

revoke all on function app_private.submit_bid_with_token_impl(uuid, uuid, numeric, text, text, text) from public, anon;
grant execute on function app_private.submit_bid_with_token_impl(uuid, uuid, numeric, text, text, text) to authenticated, service_role;

commit;
