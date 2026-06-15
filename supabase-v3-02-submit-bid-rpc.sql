-- LBID v3 submit_bid_with_token RPC.
-- Run after supabase-v3-01-grants-rls.sql.

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
as $lbid_submit_bid$
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
$lbid_submit_bid$;

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
as $lbid_submit_bid_public$
  select app_private.submit_bid_with_token_impl(
    p_user_id,
    p_sr_id,
    p_price,
    p_currency,
    p_transit_time,
    p_terms
  )
$lbid_submit_bid_public$;

revoke execute on function public.submit_bid_with_token(uuid, uuid, numeric, text, text, text) from public, anon;
grant execute on function public.submit_bid_with_token(uuid, uuid, numeric, text, text, text) to authenticated, service_role;
