-- Event time intervals: end timestamp required alongside starts_at.
alter table events add column if not exists ends_at timestamptz;

-- Backfill existing rows with a 1-hour window when end is missing.
update events
set ends_at = starts_at + interval '1 hour'
where starts_at is not null and ends_at is null;
