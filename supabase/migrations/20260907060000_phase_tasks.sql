create table if not exists phase_tasks (
  id          uuid primary key default gen_random_uuid(),
  phase_id    uuid not null references phases(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_phase_tasks_phase_id on phase_tasks(phase_id);
create index if not exists idx_phase_tasks_org_id on phase_tasks(org_id);
