-- Expense approval workflow (vendor, status, receipt, rejection reason) and
-- the signature trail that backs multi-signature approval.

alter table organizations add column if not exists org_type text;
alter table organizations add column if not exists approval_threshold numeric(12, 2) not null default 5000;
alter table organizations add column if not exists required_approvals int not null default 2;

alter table expenses add column if not exists vendor text;
alter table expenses add column if not exists receipt_url text;
alter table expenses add column if not exists submitted_by uuid references members(id) on delete set null;
alter table expenses add column if not exists status text not null default 'pending'
  check (status in ('draft', 'pending', 'approved', 'rejected'));
alter table expenses add column if not exists rejection_reason text;

create index if not exists idx_expenses_status on expenses(status);

create table if not exists expense_signatures (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  action      text not null check (action in ('approved', 'rejected')),
  created_at  timestamptz not null default now(),
  unique (expense_id, member_id)
);

create index if not exists idx_expense_signatures_expense_id on expense_signatures(expense_id);

-- Events: category/visibility/status to support the events list screen.
alter table events add column if not exists category text not null default 'community'
  check (category in ('community', 'fundraising', 'life_event', 'construction'));
alter table events add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'private', 'board_only'));
alter table events add column if not exists status text not null default 'confirmed'
  check (status in ('confirmed', 'pending'));
alter table events add column if not exists qualifier text;
