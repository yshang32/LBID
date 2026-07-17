-- Production-safe P0 smoke test. Every mutation is rolled back.
begin;

do $$
declare
  v_users uuid[];
  v_agent uuid;
  v_forwarder uuid;
  v_other_forwarder uuid;
  v_sr uuid;
  v_award_sr uuid;
  v_bid jsonb;
  v_bid_id uuid;
  v_low_bid_id uuid;
  v_high_bid_id uuid;
  v_payment_id uuid;
  v_before integer;
  v_after integer;
  v_result jsonb;
begin
  select array_agg(user_id order by user_id) into v_users
  from (select user_id from public.company_profiles limit 3) profiles;
  if coalesce(array_length(v_users, 1), 0) < 3 then
    raise exception 'P0_SMOKE_REQUIRES_THREE_COMPANY_PROFILES';
  end if;
  v_agent := v_users[1];
  v_forwarder := v_users[2];
  v_other_forwarder := v_users[3];

  update public.company_profiles set token_balance_free = 0, token_balance_paid = 5
  where user_id = v_forwarder;
  select token_balance_free + token_balance_paid into v_before
  from public.company_profiles where user_id = v_forwarder;

  insert into public.shipment_requests (
    agent_id, cargo_details, route, services_needed, deadline, bid_deadline,
    status, validation_decision, review_required, scope_version, scope_hash,
    scope_locked_at, published_at
  ) values (
    v_agent, '{"cargo_type":"general","weight_kg":100,"cbm":1,"mode":"air"}',
    '{"origin":"Singapore (SIN)","destination":"Hong Kong (HKG)","origin_code":"SIN","destination_code":"HKG","origin_coordinates":[103.99,1.36],"destination_coordinates":[113.92,22.31]}',
    array['Air Freight'], now() + interval '2 days', now() + interval '3 hours',
    'OPEN', 'AUTO_APPROVED', false, 1, 'p0-smoke-scope', now(), now()
  ) returning id into v_sr;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_forwarder::text, true);
  v_bid := public.submit_bid_with_token(v_forwarder, v_sr, 1000, 'HKD', '2 days', 'P0 smoke');
  v_bid_id := (v_bid ->> 'bid_id')::uuid;
  begin
    perform public.submit_bid_with_token(v_forwarder, v_sr, 999, 'HKD', '2 days', 'Duplicate');
    raise exception 'P0_DUPLICATE_BID_WAS_ACCEPTED';
  exception when others then
    if position('BID_ALREADY_SUBMITTED' in sqlerrm) = 0 then raise; end if;
  end;
  select token_balance_free + token_balance_paid into v_after
  from public.company_profiles where user_id = v_forwarder;
  if v_after <> v_before - 1 then raise exception 'P0_BID_TOKEN_NOT_DEDUCTED_ONCE'; end if;

  perform set_config('request.jwt.claim.role', 'service_role', true);
  perform set_config('request.jwt.claim.sub', '', true);
  v_result := public.amend_shipment_request_scope(
    v_sr, v_agent,
    '{"cargo_type":"general","weight_kg":110,"cbm":1.1,"mode":"air"}'::jsonb,
    '{"origin":"Singapore (SIN)","destination":"Hong Kong (HKG)","origin_code":"SIN","destination_code":"HKG","origin_coordinates":[103.99,1.36],"destination_coordinates":[113.92,22.31]}'::jsonb,
    array['Air Freight'], now() + interval '3 days', true,
    'MANUAL_REVIEW', '["SCOPE_CHANGED"]'::jsonb, 70::smallint, 'p0-smoke-scope-v2', 'p0-smoke-amend'
  );
  if (select status from public.shipment_requests where id = v_sr) <> 'CANCELLED' then
    raise exception 'P0_ORIGINAL_SCOPE_NOT_CANCELLED';
  end if;
  if (select status from public.bids where id = v_bid_id) <> 'VOID_SCOPE_CHANGED' then
    raise exception 'P0_BID_NOT_VOIDED_AFTER_SCOPE_CHANGE';
  end if;
  select token_balance_free + token_balance_paid into v_after
  from public.company_profiles where user_id = v_forwarder;
  if v_after <> v_before then raise exception 'P0_SCOPE_CHANGE_TOKEN_NOT_REFUNDED'; end if;

  insert into public.payment_intents (
    user_id, type, amount, currency, payment_method, related_token_package
  ) values (
    v_forwarder, 'token_purchase', 100, 'HKD', 'stripe', '{"tokens":3}'
  ) returning id into v_payment_id;
  select token_balance_free + token_balance_paid into v_before
  from public.company_profiles where user_id = v_forwarder;
  perform public.confirm_payment_intent_atomic(v_payment_id, null, 'evt_p0_smoke', 'checkout.session.completed', 'cs_p0_smoke');
  perform public.confirm_payment_intent_atomic(v_payment_id, null, 'evt_p0_smoke', 'checkout.session.completed', 'cs_p0_smoke');
  select token_balance_free + token_balance_paid into v_after
  from public.company_profiles where user_id = v_forwarder;
  if v_after <> v_before + 3 then raise exception 'P0_PAYMENT_WAS_NOT_CREDITED_EXACTLY_ONCE'; end if;

  insert into public.shipment_requests (
    agent_id, cargo_details, route, services_needed, deadline, bid_deadline,
    status, validation_decision, review_required, scope_version, scope_hash,
    scope_locked_at, published_at, closed_at
  ) values (
    v_agent, '{"cargo_type":"general","weight_kg":100,"cbm":1,"mode":"air"}',
    '{"origin":"Singapore (SIN)","destination":"Hong Kong (HKG)"}',
    array['Air Freight'], now() + interval '2 days', now() - interval '1 minute',
    'CLOSED', 'AUTO_APPROVED', false, 1, 'p0-smoke-award', now() - interval '4 hours', now() - interval '4 hours', now()
  ) returning id into v_award_sr;
  insert into public.bids (sr_id, forwarder_id, price, currency, status, scope_version)
  values (v_award_sr, v_forwarder, 1000, 'HKD', 'SUBMITTED', 1) returning id into v_low_bid_id;
  insert into public.bids (sr_id, forwarder_id, price, currency, status, scope_version)
  values (v_award_sr, v_other_forwarder, 1200, 'HKD', 'SUBMITTED', 1) returning id into v_high_bid_id;

  begin
    perform public.accept_bid_to_order_v2(v_high_bid_id, v_agent, null, '{}', null);
    raise exception 'P0_NON_LOWEST_BID_ACCEPTED_WITHOUT_REASON';
  exception when others then
    if position('NON_LOWEST_SELECTION_REASON_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  v_result := public.accept_bid_to_order_v2(
    v_high_bid_id, v_agent, 'Faster specialised handling', '{"source":"p0_smoke"}', null
  );
  if (v_result ->> 'was_lowest')::boolean then raise exception 'P0_NON_LOWEST_FLAG_INCORRECT'; end if;
  if (select status from public.shipment_requests where id = v_award_sr) <> 'AWARDED' then
    raise exception 'P0_AWARD_NOT_ATOMIC';
  end if;
  if (select legal_record ->> 'platform_role' from public.shipment_requests where id = v_award_sr)
     <> 'workflow_platform_not_carrier_of_record' then
    raise exception 'P0_PLATFORM_ROLE_RECORD_MISSING';
  end if;
end;
$$;

rollback;
