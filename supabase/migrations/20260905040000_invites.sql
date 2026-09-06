-- Pending org invites, resolved when the invited email completes login via
-- /auth/callback (see lib/actions/invite.ts and the callback route).
create table if not exists invites (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  email        text not null,
  role         text not null check (role in ('admin', 'treasurer', 'member')),
  invited_by   uuid references members(id) on delete set null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_invites_org_id on invites(org_id);
create unique index if not exists idx_invites_email_pending
  on invites(email) where accepted_at is null;
