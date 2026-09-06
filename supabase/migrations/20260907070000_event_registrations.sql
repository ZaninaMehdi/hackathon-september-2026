-- Paid event registrations, tracked separately from donations so ticket
-- revenue never gets summed into project fundraising totals.
create table if not exists event_registrations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  org_id            uuid not null references organizations(id) on delete cascade,
  attendee_name     text,
  attendee_email    text,
  amount_paid       numeric(12, 2) not null default 0,
  stripe_payment_id text unique,
  created_at        timestamptz not null default now()
);

create index if not exists idx_event_registrations_event_id on event_registrations(event_id);
create index if not exists idx_event_registrations_org_id on event_registrations(org_id);
