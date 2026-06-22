-- LBID P0 background bid-window closure.
-- Supabase Cron closes an expired sealed bid window every minute.

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function app_private.close_expired_bid_windows()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  closed_count integer;
begin
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

revoke execute on function app_private.close_expired_bid_windows() from public, anon, authenticated;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
    from cron.job
    where jobname = 'lbid-close-expired-bid-windows';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'lbid-close-expired-bid-windows',
    '* * * * *',
    'select app_private.close_expired_bid_windows();'
  );
end;
$$;
