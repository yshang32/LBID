-- LBID v3 adjust_token_balance RPC.
-- Run after supabase-v3-02-submit-bid-rpc.sql.

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
as $lbid_adjust_token$
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
$lbid_adjust_token$;

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
as $lbid_adjust_token_public$
  select app_private.adjust_token_balance_impl(
    p_user_id,
    p_amount,
    p_balance_type,
    p_type,
    p_source,
    p_related_id
  )
$lbid_adjust_token_public$;

revoke execute on function public.adjust_token_balance(uuid, int, text, text, text, uuid) from public, anon;
grant execute on function public.adjust_token_balance(uuid, int, text, text, text, uuid) to authenticated, service_role;

revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;
grant execute on all functions in schema app_private to authenticated, service_role;
