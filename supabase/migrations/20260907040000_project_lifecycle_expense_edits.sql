-- Project lifecycle: close (stop new donations, reversible) and archive
-- (hide from active lists, reversible, never destroys financial history).
-- Hard delete is only permitted at the application layer when a project has
-- zero donations and zero expenses.
alter table projects add column if not exists status text not null default 'active'
  check (status in ('active', 'closed', 'archived'));

-- Attribution for expense edits, alongside the existing submitted_by.
alter table expenses add column if not exists updated_by uuid references members(id) on delete set null;
alter table expenses add column if not exists updated_at timestamptz;
