-- LBID v3 hardened Supabase RPC and Data API grants.
-- Run after the base schema and supabase-rls-policies.sql. This keeps
-- privileged token logic in app_private while preserving the public RPC names
-- used by the Next.js API routes.

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
  v_free_balance int;
  v_paid_balance int;
  v_deduct_from text;
  v_bid_id uuid;
  v_txn_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'UNAUTHORIZED';
  end if;

  if not exists (
    select 1
    from public.shipment_requests
    where id = p_sr_id
      and status = 'OPEN'
      and bid_deadline > now()
  ) then
    raise exception 'SHIPMENT_REQUEST_NOT_OPEN';
  end if;

  if exists (
    select 1
    from public.bids
    where sr_id = p_sr_id
      and forwarder_id = p_user_id
  ) then
    raise exception 'BID_ALREADY_SUBMITTED';
  end if;

  select token_balance_free, token_balance_paid
    into v_free_balance, v_paid_balance
    from public.company_profiles
    where user_id = p_user_id
    for update;

  if v_free_balance is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if (v_free_balance + v_paid_balance) < 1 then
    raise exception 'INSUFFICIENT_TOKENS';
  end if;

  if v_free_balance >= 1 then
    v_deduct_from := 'free';
    update public.company_profiles
      set token_balance_free = token_balance_free - 1
      where user_id = p_user_id;
  else
    v_deduct_from := 'paid';
    update public.company_profiles
      set token_balance_paid = token_balance_paid - 1
      where user_id = p_user_id;
  end if;

  insert into public.bids (sr_id, forwarder_id, price, currency, transit_time, terms, submitted_at)
  values (p_sr_id, p_user_id, p_price, coalesce(p_currency, 'HKD'), p_transit_time, p_terms, now())
  returning id into v_bid_id;

  insert into public.token_transactions (
    user_id, type, source, amount, balance_type,
    related_bid_id, balance_after, created_at
  )
  values (
    p_user_id,
    'spend',
    'bid',
    -1,
    v_deduct_from,
    v_bid_id,
    (select token_balance_free + token_balance_paid from public.company_profiles where user_id = p_user_id),
    now()
  )
  returning id into v_txn_id;

  update public.bids set token_transaction_id = v_txn_id where id = v_bid_id;

  return jsonb_build_object(
    'bid_id', v_bid_id,
    'token_transaction_id', v_txn_id,
    'deducted_from', v_deduct_from,
    'remaining_free', (select token_balance_free from public.company_profiles where user_id = p_user_id),
    'remaining_paid', (select token_balance_paid from public.company_profiles where user_id = p_user_id)
  );
end;
$$;

create or replace function public.submit_bid_with_token(
  p_user_id uuid,
  p_sr_id uuid,
  p_price numeric,
  p_currency text,
  p_transit_time text,
  p_terms text
)
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  select app_private.submit_bid_with_token_impl(
    p_user_id,
    p_sr_id,
    p_price,
    p_currency,
    p_transit_time,
    p_terms
  )
$$;

create or replace function app_private.adjust_token_balance_impl(
  p_user_id uuid,
  p_amount int,
  p_balance_type text,
  p_type text,
  p_source text,
  p_related_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current int;
  v_txn_id uuid;
begin
  if auth.role() <> 'service_role' then
    if auth.uid() is null
      or auth.uid() <> p_user_id
      or p_amount > 0
      or p_type <> 'spend'
      or p_source <> 'directory_boost' then
      raise exception 'UNAUTHORIZED';
    end if;
  end if;

  perform 1 from public.company_profiles
    where user_id = p_user_id
    for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if p_balance_type = 'free' then
    select token_balance_free into v_current
      from public.company_profiles where user_id = p_user_id;

    if v_current + p_amount < 0 then
      raise exception 'INSUFFICIENT_TOKENS';
    end if;

    update public.company_profiles
      set token_balance_free = token_balance_free + p_amount
      where user_id = p_user_id;
  elsif p_balance_type = 'paid' then
    select token_balance_paid into v_current
      from public.company_profiles where user_id = p_user_id;

    if v_current + p_amount < 0 then
      raise exception 'INSUFFICIENT_TOKENS';
    end if;

    update public.company_profiles
      set token_balance_paid = token_balance_paid + p_amount
      where user_id = p_user_id;
  else
    raise exception 'INVALID_BALANCE_TYPE';
  end if;

  insert into public.token_transactions (
    user_id, type, source, amount, balance_type,
    related_match_record_id, related_payment_intent_id, balance_after, created_at
  )
  values (
    p_user_id,
    p_type,
    p_source,
    p_amount,
    p_balance_type,
    case when p_source <> 'token_package' then p_related_id else null end,
    case when p_source = 'token_package' then p_related_id else null end,
    (select token_balance_free + token_balance_paid from public.company_profiles where user_id = p_user_id),
    now()
  )
  returning id into v_txn_id;

  return jsonb_build_object(
    'token_transaction_id', v_txn_id,
    'new_free', (select token_balance_free from public.company_profiles where user_id = p_user_id),
    'new_paid', (select token_balance_paid from public.company_profiles where user_id = p_user_id)
  );
end;
$$;

create or replace function public.adjust_token_balance(
  p_user_id uuid,
  p_amount int,
  p_balance_type text,
  p_type text,
  p_source text,
  p_related_id uuid default null
)
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  select app_private.adjust_token_balance_impl(
    p_user_id,
    p_amount,
    p_balance_type,
    p_type,
    p_source,
    p_related_id
  )
$$;

revoke execute on function public.submit_bid_with_token(uuid, uuid, numeric, text, text, text) from public, anon;
revoke execute on function public.adjust_token_balance(uuid, int, text, text, text, uuid) from public, anon;
grant execute on function public.submit_bid_with_token(uuid, uuid, numeric, text, text, text) to authenticated, service_role;
grant execute on function public.adjust_token_balance(uuid, int, text, text, text, uuid) to authenticated, service_role;

revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;
grant execute on all functions in schema app_private to authenticated, service_role;
