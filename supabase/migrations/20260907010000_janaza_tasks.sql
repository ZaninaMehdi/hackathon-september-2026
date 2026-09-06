-- Janaza splits into four independently tracked tasks.
-- salat / ghusl: first-to-claim. transport / cemetery: admin-entered contacts.

create table if not exists member_skills (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  skill       text not null check (skill in ('salat', 'ghusl')),
  created_at  timestamptz not null default now(),
  unique (member_id, skill)
);

create index if not exists idx_member_skills_skill on member_skills(skill, member_id);

create table if not exists janaza_tasks (
  id                   uuid primary key default gen_random_uuid(),
  service_request_id   uuid not null references service_requests(id) on delete cascade,
  role                 text not null check (role in ('salat', 'ghusl', 'transport', 'cemetery')),
  status               text not null default 'open' check (status in ('open', 'claimed', 'confirmed')),
  claimed_by           uuid references members(id) on delete set null,
  contact_name         text,
  contact_phone        text,
  notes                text,
  claimed_at           timestamptz,
  confirmed_at         timestamptz,
  unique (service_request_id, role),
  constraint janaza_tasks_claimed_has_member check (
    status = 'open' or claimed_by is not null or role in ('transport', 'cemetery')
  )
);

create index if not exists idx_janaza_tasks_request on janaza_tasks(service_request_id, role);
create index if not exists idx_janaza_tasks_open_role on janaza_tasks(role, status);

alter table service_notifications drop constraint if exists service_notifications_kind_check;
alter table service_notifications add constraint service_notifications_kind_check check (kind in (
  'nikah_request',
  'nikah_confirmed',
  'nikah_declined',
  'nikah_expired',
  'janaza_broadcast',
  'janaza_claimed',
  'janaza_covered',
  'janaza_task_broadcast',
  'janaza_task_claimed',
  'janaza_task_covered'
));

-- Seed the four task rows whenever a janaza request is created.
create or replace function seed_janaza_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.service_type = 'janaza' then
    insert into janaza_tasks (service_request_id, role, status)
    values
      (new.id, 'salat', 'open'),
      (new.id, 'ghusl', 'open'),
      (new.id, 'transport', 'open'),
      (new.id, 'cemetery', 'open')
    on conflict (service_request_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_seed_janaza_tasks on service_requests;
create trigger trg_seed_janaza_tasks
after insert on service_requests
for each row
execute function seed_janaza_tasks();

-- Janaza officiants can lead salat by default.
create or replace function sync_salat_skill_from_officiant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if 'janaza' = any (new.services) then
    insert into member_skills (member_id, skill)
    values (new.member_id, 'salat')
    on conflict (member_id, skill) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_salat_skill on officiants;
create trigger trg_sync_salat_skill
after insert or update of services on officiants
for each row
execute function sync_salat_skill_from_officiant();

create or replace function member_has_janaza_skill(p_member_id uuid, p_skill text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from member_skills
    where member_id = p_member_id and skill = p_skill
  )
  or (
    p_skill = 'salat'
    and exists (
      select 1 from officiants
      where member_id = p_member_id and 'janaza' = any (services)
    )
  );
$$;

create or replace function sync_janaza_request_status(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) = 4
    from janaza_tasks
    where service_request_id = p_request_id and status = 'confirmed'
  ) then
    update service_requests set status = 'confirmed' where id = p_request_id;
  end if;
end;
$$;

-- First matching member to claim salat/ghusl wins.
create or replace function claim_janaza_task(
  p_task_id uuid,
  p_member_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task janaza_tasks%rowtype;
  v_request service_requests%rowtype;
  v_updated uuid;
begin
  select * into v_task from janaza_tasks where id = p_task_id;
  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.role not in ('salat', 'ghusl') then
    raise exception 'This task is coordinated manually';
  end if;

  if not member_has_janaza_skill(p_member_id, v_task.role) then
    raise exception 'You do not have the matching skill for this task';
  end if;

  update janaza_tasks
  set status = 'claimed', claimed_by = p_member_id, claimed_at = now()
  where id = p_task_id
    and status = 'open'
    and claimed_by is null
  returning id into v_updated;

  if v_updated is null then
    return false;
  end if;

  select * into strict v_request from service_requests where id = v_task.service_request_id;

  insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
  values (
    v_request.requested_by,
    v_request.org_id,
    v_request.id,
    'janaza_task_claimed',
    'A volunteer claimed the ' || v_task.role || ' task.'
  );

  insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
  select ms.member_id, v_request.org_id, v_request.id, 'janaza_task_covered',
         'The ' || v_task.role || ' task is already covered.'
  from member_skills ms
  join members m on m.id = ms.member_id
  where ms.skill = v_task.role
    and ms.member_id <> p_member_id
    and m.org_id = v_request.org_id;

  return true;
end;
$$;

create or replace function confirm_janaza_task(
  p_task_id uuid,
  p_member_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task janaza_tasks%rowtype;
  v_is_admin boolean;
begin
  select * into v_task from janaza_tasks where id = p_task_id;
  if not found then
    raise exception 'Task not found';
  end if;

  select exists (
    select 1
    from roles r
    join service_requests sr on sr.id = v_task.service_request_id
    where r.member_id = p_member_id
      and r.org_id = sr.org_id
      and r.role in ('admin', 'treasurer')
  ) into v_is_admin;

  if v_task.claimed_by is distinct from p_member_id and not v_is_admin then
    raise exception 'Only the claimant or an admin can confirm this task';
  end if;

  if v_task.status = 'open' and v_task.role in ('salat', 'ghusl') then
    raise exception 'This task must be claimed before it can be confirmed';
  end if;

  update janaza_tasks
  set
    status = 'confirmed',
    confirmed_at = now(),
    claimed_by = coalesce(claimed_by, p_member_id),
    claimed_at = coalesce(claimed_at, now())
  where id = p_task_id
    and status in ('open', 'claimed');

  if not found then
    return false;
  end if;

  perform sync_janaza_request_status(v_task.service_request_id);
  return true;
end;
$$;

grant execute on function member_has_janaza_skill(uuid, text) to authenticated, service_role;
grant execute on function claim_janaza_task(uuid, uuid) to authenticated, service_role;
grant execute on function confirm_janaza_task(uuid, uuid) to authenticated, service_role;
grant execute on function sync_janaza_request_status(uuid) to authenticated, service_role;

-- Existing janaza requests and officiants.
insert into janaza_tasks (service_request_id, role, status)
select sr.id, role.role, 'open'
from service_requests sr
cross join (values ('salat'), ('ghusl'), ('transport'), ('cemetery')) as role(role)
where sr.service_type = 'janaza'
on conflict (service_request_id, role) do nothing;

insert into member_skills (member_id, skill)
select member_id, 'salat'
from officiants
where 'janaza' = any (services)
on conflict (member_id, skill) do nothing;
