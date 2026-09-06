-- Event pricing and recurring series support.
alter table events add column if not exists price numeric(12, 2) not null default 0;
alter table events add column if not exists series_id uuid;
alter table events add column if not exists recurrence text
  check (recurrence is null or recurrence in ('weekly', 'biweekly', 'monthly'));

create index if not exists idx_events_series_id on events(series_id);
