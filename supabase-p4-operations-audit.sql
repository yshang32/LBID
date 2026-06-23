-- LBID operations: review notes, cancellation governance and immutable audit data.

alter table public.shipment_requests
  add column if not exists review_reason text,
  add column if not exists reviewed_by uuid references public.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists award_cooling_off_until timestamptz,
  add column if not exists refusal_count integer not null default 0,
  add column if not exists refusal_limit integer not null default 3,
  add column if not exists legal_record jsonb not null default '{}'::jsonb;

alter table public.company_profiles
  add column if not exists verification_documents jsonb not null default '[]'::jsonb,
  add column if not exists verification_note text,
  add column if not exists verification_reviewed_by uuid references public.users(id),
  add column if not exists verification_reviewed_at timestamptz;

alter table public.payment_intents
  add column if not exists review_note text;

create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  reason text not null,
  kind text not null check (kind in ('pre_award_cancel', 'award_refusal', 'post_award_cooling_off', 'post_award_review')),
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'withdrawn')),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cancellation_requests_sr_created_idx on public.cancellation_requests (shipment_request_id, created_at desc);
create index if not exists audit_logs_entity_created_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);

alter table public.cancellation_requests enable row level security;
alter table public.audit_logs enable row level security;
