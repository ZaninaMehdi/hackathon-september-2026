-- Hackathon MVP schema: organizations, members, roles, projects, phases, donations, expenses, events
-- Booking/RSVP intentionally omitted (out of hackathon scope).

create extension if not exists pgcrypto;

-- ORGANIZATIONS ---------------------------------------------------------
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- MEMBERS -----------------------------------------------------------------
-- One row per (org, auth user). A person can belong to multiple orgs.
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists idx_members_org_id on members(org_id);

-- ROLES ---------------------------------------------------------------------
create table if not exists roles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  role        text not null check (role in ('admin', 'treasurer', 'member')),
  created_at  timestamptz not null default now(),
  unique (org_id, member_id, role)
);

create index if not exists idx_roles_org_id on roles(org_id);
create index if not exists idx_roles_member_id on roles(member_id);

-- PROJECTS ------------------------------------------------------------------
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  title           text not null,
  description     text,
  total_goal      numeric(12, 2) not null default 0,
  cover_image_url text,
  created_by      uuid references members(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_projects_org_id on projects(org_id);

-- PHASES ----------------------------------------------------------------------
create table if not exists phases (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  org_id          uuid not null references organizations(id) on delete cascade,
  title           text not null,
  budget_target   numeric(12, 2) not null default 0,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_phases_org_id on phases(org_id);
create index if not exists idx_phases_project_id on phases(project_id);

-- DONATIONS -------------------------------------------------------------------
create table if not exists donations (
  id                uuid primary key default gen_random_uuid(),
  phase_id          uuid not null references phases(id) on delete cascade,
  project_id        uuid not null references projects(id) on delete cascade,
  org_id            uuid not null references organizations(id) on delete cascade,
  amount            numeric(12, 2) not null,
  donor_email       text,
  stripe_payment_id text unique,
  created_at        timestamptz not null default now()
);

create index if not exists idx_donations_org_id on donations(org_id);
create index if not exists idx_donations_phase_id on donations(phase_id);
create index if not exists idx_donations_project_id on donations(project_id);

-- EXPENSES ----------------------------------------------------------------------
create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  phase_id      uuid references phases(id) on delete set null,
  project_id    uuid not null references projects(id) on delete cascade,
  org_id        uuid not null references organizations(id) on delete cascade,
  amount        numeric(12, 2) not null,
  description   text,
  created_by    uuid references members(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_expenses_org_id on expenses(org_id);
create index if not exists idx_expenses_phase_id on expenses(phase_id);
create index if not exists idx_expenses_project_id on expenses(project_id);

-- EVENTS ---------------------------------------------------------------------------
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  project_id    uuid references projects(id) on delete set null,
  title         text not null,
  description   text,
  starts_at     timestamptz,
  location      text,
  created_by    uuid references members(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_events_org_id on events(org_id);
create index if not exists idx_events_project_id on events(project_id);
