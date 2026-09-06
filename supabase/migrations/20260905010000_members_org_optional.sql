-- A member row is created on first login (Step 2), before the user has
-- created or joined an organization (Step 3). Allow org_id to be null to
-- represent that transitional state.
alter table members alter column org_id drop not null;
