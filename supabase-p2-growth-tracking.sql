-- LBID P2 growth + tracking schema.
-- Run after the v3/v4 base schema and P1 notifications/storage migration.

alter table public.users
  add column if not exists referral_code text,
  add column if not exists points integer not null default 0;

create unique index if not exists users_referral_code_key
  on public.users(referral_code)
  where referral_code is not null;

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('earn', 'redeem', 'adjust')),
  source text not null,
  points integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referred_email text not null,
  referred_user_id uuid references public.users(id) on delete set null,
  status text not null default 'invited' check (status in ('invited', 'joined', 'transacted', 'rewarded', 'cancelled')),
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  unique (referrer_id, referred_email)
);

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (status in ('confirmed', 'shipment_booked', 'in_transit', 'arrived_hk', 'customs_cleared', 'delivered', 'completed')),
  location text,
  description text not null,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.point_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.tracking_events enable row level security;

drop policy if exists "Users can read own point transactions" on public.point_transactions;
create policy "Users can read own point transactions"
  on public.point_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own point transactions" on public.point_transactions;
create policy "Users can insert own point transactions"
  on public.point_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own referrals" on public.referrals;
create policy "Users can read own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

drop policy if exists "Users can create own referrals" on public.referrals;
create policy "Users can create own referrals"
  on public.referrals for insert
  with check (auth.uid() = referrer_id);

drop policy if exists "Order parties can read tracking events" on public.tracking_events;
create policy "Order parties can read tracking events"
  on public.tracking_events for select
  using (
    exists (
      select 1
      from public.orders o
      join public.quotations q on q.id = o.quotation_id
      join public.shipment_requests sr on sr.id = q.shipment_request_id
      where o.id = tracking_events.order_id
        and (sr.agent_id = auth.uid() or q.forwarder_id = auth.uid())
    )
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists "Order forwarder or admin can create tracking events" on public.tracking_events;
create policy "Order forwarder or admin can create tracking events"
  on public.tracking_events for insert
  with check (
    created_by = auth.uid()
    and (
      exists (
        select 1
        from public.orders o
        join public.quotations q on q.id = o.quotation_id
        where o.id = tracking_events.order_id
          and q.forwarder_id = auth.uid()
      )
      or exists (
        select 1 from public.users u
        where u.id = auth.uid() and u.role = 'admin'
      )
    )
  );

create index if not exists point_transactions_user_created_idx on public.point_transactions(user_id, created_at desc);
create index if not exists referrals_referrer_created_idx on public.referrals(referrer_id, created_at desc);
create index if not exists tracking_events_order_occurred_idx on public.tracking_events(order_id, occurred_at);

do $$
begin
  begin
    alter publication supabase_realtime add table public.tracking_events;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
