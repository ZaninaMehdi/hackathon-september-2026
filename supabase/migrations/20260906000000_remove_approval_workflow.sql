-- The multi-signature approval workflow was removed: an admin adding an
-- expense is trusted immediately, and submitted_by is the audit trail.
-- This drops everything that only existed to support that workflow.

drop table if exists expense_signatures;

-- Every expense is approved on creation now; narrow the status column to
-- match instead of carrying dead states around.
update expenses set status = 'approved' where status <> 'approved';

alter table expenses drop constraint if exists expenses_status_check;
alter table expenses alter column status set default 'approved';
alter table expenses add constraint expenses_status_check check (status = 'approved');

alter table expenses drop column if exists rejection_reason;

alter table organizations drop column if exists approval_threshold;
alter table organizations drop column if exists required_approvals;
