-- Public, no-login intake for nikah/janaza requests from community members.
-- Deliberately separate from service_requests/hold_nikah_slot (which assume
-- a logged-in member and manage real-time slot holding) so this doesn't
-- touch that in-progress officiant workflow. Once guest auth exists, these
-- can be triaged into the real booking flow by an officiant/admin.
create table if not exists guest_service_inquiries (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  service_type    text not null check (service_type in ('nikah', 'janaza')),
  guest_name      text not null,
  guest_email     text not null,
  guest_phone     text,
  preferred_date  date,
  details         text,
  status          text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_guest_service_inquiries_org_id on guest_service_inquiries(org_id, created_at desc);
