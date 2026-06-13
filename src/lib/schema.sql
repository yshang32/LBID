create type user_role as enum ('agency', 'forwarder', 'admin');
create type order_status as enum ('confirmed', 'shipment_booked', 'in_transit', 'arrived_hk', 'customs_cleared', 'delivered', 'completed');

create table public.users (
  id uuid primary key references auth.users(id),
  role user_role not null,
  company_name text not null,
  country text,
  email text not null unique,
  referral_code text not null unique,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.forwarder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  tier text not null default 'Free',
  badges text[] not null default '{}',
  service_coverage text[] not null default '{}',
  rating numeric not null default 0,
  completed_orders integer not null default 0,
  verified_at timestamptz
);

create table public.shipment_requests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.users(id),
  cargo_details jsonb not null,
  route jsonb not null,
  services_needed text[] not null,
  deadline timestamptz not null,
  bid_deadline timestamptz not null default (now() + interval '3 hours'),
  is_anonymous boolean not null default true,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  sr_id uuid not null references public.shipment_requests(id),
  forwarder_id uuid not null references public.users(id),
  price numeric not null,
  currency text not null default 'HKD',
  transit_time text,
  terms text,
  submitted_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id),
  forwarder_id uuid not null references public.users(id),
  line_items jsonb not null,
  total_amount numeric not null,
  public_token text unique,
  pdf_url text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id),
  status order_status not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  type text not null,
  file_url text not null,
  uploaded_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  sender_id uuid not null references public.users(id),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  agency_id uuid not null references public.users(id),
  forwarder_id uuid not null references public.users(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.match_records (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id),
  agent_id uuid not null references public.users(id),
  forwarder_id uuid not null references public.users(id),
  winning_quotation_id uuid not null references public.quotations(id),
  matched_at timestamptz not null default now(),
  is_preferred_partner boolean not null default true,
  introduction_period_start date not null default current_date,
  introduction_period_end date not null default (current_date + interval '3 months'),
  rate_card_snapshot jsonb not null default '{}'::jsonb
);

create table public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  match_record_id uuid not null references public.match_records(id),
  route text not null,
  price_per_unit numeric not null,
  minimum_charge numeric,
  currency text not null default 'HKD',
  valid_from date not null,
  valid_to date not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

create table public.reorders (
  id uuid primary key default gen_random_uuid(),
  match_record_id uuid not null references public.match_records(id),
  order_date date not null default current_date,
  volume numeric not null,
  agreed_price numeric not null,
  currency text not null default 'HKD',
  status order_status not null default 'confirmed',
  introduction_fee_rate numeric not null default 0,
  introduction_fee_amount numeric not null default 0,
  fee_status text not null default 'pending'
);

create table public.volume_tracking (
  match_record_id uuid primary key references public.match_records(id),
  total_orders integer not null default 0,
  total_volume numeric not null default 0,
  total_value numeric not null default 0,
  last_order_date date
);

create table public.company_profiles (
  user_id uuid primary key references public.users(id),
  company_name_zh text,
  company_name_en text,
  logo_url text,
  region text,
  founded_year integer,
  company_size text,
  service_routes jsonb not null default '[]'::jsonb,
  service_types jsonb not null default '[]'::jsonb,
  slogan text,
  description text,
  advantage_tags jsonb not null default '[]'::jsonb,
  gallery_images jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  is_public boolean not null default false,
  is_anonymous_default boolean not null default true,
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 0,
  contact_email text,
  contact_phone text,
  contact_whatsapp text,
  reputation_score integer not null default 0,
  token_balance_free integer not null default 0,
  token_balance_paid integer not null default 0,
  token_free_reset_at timestamptz
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id),
  plan text not null check (plan in ('monthly', 'annual', 'trial')),
  status text not null check (status in ('trial', 'active', 'expired', 'pending_payment')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type text not null check (type in ('purchase', 'spend', 'free_grant', 'free_expire', 'refund')),
  source text not null check (source in ('bid', 'directory_boost', 'admin', 'trial', 'token_package')),
  amount integer not null,
  balance_type text not null check (balance_type in ('free', 'paid')),
  related_match_record_id uuid references public.match_records(id),
  related_bid_id uuid references public.bids(id),
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type text not null check (type in ('subscription', 'token_purchase')),
  amount numeric not null,
  currency text not null default 'HKD',
  payment_method text not null check (payment_method in ('stripe', 'fps', 'payme')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  stripe_session_id text,
  fps_reference text,
  proof_url text,
  related_plan jsonb,
  related_token_package jsonb,
  confirmed_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.token_transactions
  add column if not exists related_payment_intent_id uuid references public.payment_intents(id);

create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  event_type text not null check (event_type in ('match_completed', 'review_positive', 'review_negative', 'inactivity_decay')),
  score_change integer not null,
  related_match_record_id uuid references public.match_records(id),
  created_at timestamptz not null default now()
);

create table public.directory_boosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  boost_type text not null check (boost_type in ('1day', '7day')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  token_transaction_id uuid references public.token_transactions(id)
);

alter table public.bids add column if not exists token_transaction_id uuid references public.token_transactions(id);
alter table public.quotations add column if not exists token_transaction_id uuid references public.token_transactions(id);
alter table public.match_records add column if not exists stage text not null default 'matched';
alter table public.match_records add column if not exists contact_revealed_at timestamptz;

create or replace function public.submit_bid_with_token(
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

create or replace function public.adjust_token_balance(
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

alter table public.company_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.token_transactions enable row level security;
alter table public.payment_intents enable row level security;
alter table public.reputation_events enable row level security;
alter table public.directory_boosts enable row level security;

create policy "own profile edit"
  on public.company_profiles for update
  using (auth.uid() = user_id);

create policy "public directory read"
  on public.company_profiles for select
  using (is_public = true or auth.uid() = user_id);

create policy "own subscription read"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "own token history"
  on public.token_transactions for select
  using (auth.uid() = user_id);

create policy "own payment intents"
  on public.payment_intents for select
  using (auth.uid() = user_id);

create policy "own reputation events"
  on public.reputation_events for select
  using (auth.uid() = user_id);

create policy "own directory boosts"
  on public.directory_boosts for select
  using (auth.uid() = user_id);

revoke execute on function public.submit_bid_with_token(uuid, uuid, numeric, text, text, text) from public, anon;
revoke execute on function public.adjust_token_balance(uuid, int, text, text, text, uuid) from public, anon;
grant execute on function public.submit_bid_with_token(uuid, uuid, numeric, text, text, text) to authenticated, service_role;
grant execute on function public.adjust_token_balance(uuid, int, text, text, text, uuid) to authenticated, service_role;
