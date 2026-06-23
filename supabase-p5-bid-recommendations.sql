-- LBID P5: profile-based sealed-bid recommendations.
-- Run after the existing P1 notifications migration.

create table if not exists public.bid_recommendations (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  forwarder_id uuid not null references public.users(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'viewed', 'bid_submitted', 'dismissed')),
  notified_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shipment_request_id, forwarder_id)
);

create index if not exists bid_recommendations_forwarder_status_idx
  on public.bid_recommendations (forwarder_id, status, created_at desc);

create index if not exists bid_recommendations_request_idx
  on public.bid_recommendations (shipment_request_id, match_score desc);

alter table public.bid_recommendations enable row level security;

drop policy if exists "bid_recommendations_owner_select" on public.bid_recommendations;
create policy "bid_recommendations_owner_select"
  on public.bid_recommendations for select
  to authenticated
  using ((select auth.uid()) = forwarder_id);

revoke all on public.bid_recommendations from anon;
grant select on public.bid_recommendations to authenticated;

-- The existing one-minute bid-window cron also sends a single final-window
-- notification to recommended forwarders who have not submitted a bid.
create or replace function app_private.close_expired_bid_windows()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  closed_count integer;
begin
  insert into public.notifications (user_id, type, title, body, href, metadata)
  select
    recommendation.forwarder_id,
    'bid_final_window',
    'Final 5 minutes to submit a sealed bid',
    'A recommended sealed-bid opportunity is about to close.',
    '/zh/marketplace/' || request.id,
    jsonb_build_object('shipmentRequestId', request.id, 'matchScore', recommendation.match_score)
  from public.bid_recommendations recommendation
  join public.shipment_requests request on request.id = recommendation.shipment_request_id
  where request.status = 'OPEN'
    and request.bid_deadline > now()
    and request.bid_deadline <= now() + interval '5 minutes'
    and recommendation.status in ('pending', 'viewed')
    and not exists (
      select 1
      from public.notifications notification
      where notification.user_id = recommendation.forwarder_id
        and notification.type = 'bid_final_window'
        and notification.metadata->>'shipmentRequestId' = request.id::text
    );

  with closed_requests as (
    update public.shipment_requests
      set status = 'CLOSED'
      where status = 'OPEN'
        and bid_deadline <= now()
      returning id, agent_id
  ), recipients as (
    select id as shipment_request_id, agent_id as user_id
      from closed_requests
    union
    select closed_requests.id, bids.forwarder_id
      from closed_requests
      join public.bids on bids.sr_id = closed_requests.id
  ), notifications_created as (
    insert into public.notifications (user_id, type, title, body, href, metadata)
    select
      user_id,
      'bid_window_closed',
      'Bid window closed',
      'The sealed bid window has ended. The agency can now compare valid quotations.',
      '/zh/requests/' || shipment_request_id,
      jsonb_build_object('shipmentRequestId', shipment_request_id)
    from recipients
    returning id
  )
  select count(*) into closed_count from closed_requests;

  return coalesce(closed_count, 0);
end;
$$;
