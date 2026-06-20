-- LBID P3: Stripe customer state and write protection for financial ledgers.
-- Run after the base schema, RLS policies and P2 growth migration.

alter table public.payment_intents
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists payment_intents_stripe_session_idx
  on public.payment_intents(stripe_session_id)
  where stripe_session_id is not null;

-- Point and payment ledgers are written only by server-side RPC/service-role code.
-- End users retain read access through the existing RLS select policies.
drop policy if exists "Users can insert own point transactions" on public.point_transactions;
drop policy if exists "payment_intents_owner_insert" on public.payment_intents;

revoke insert, update, delete on table public.point_transactions from anon, authenticated;
revoke insert, update, delete on table public.payment_intents from anon, authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null; when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null; when undefined_object then null;
  end;
end $$;
