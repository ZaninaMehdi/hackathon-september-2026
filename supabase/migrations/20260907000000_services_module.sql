-- Nikah (hold-a-slot) and janaza (broadcast-and-claim) share one request model.
-- Officiants link to members (this repo has no profiles table).

-- OFFICIANTS --------------------------------------------------------------
create table if not exists officiants (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  services    text[] not null,
  created_at  timestamptz not null default now(),
  unique (org_id, member_id),
  constraint officiants_services_valid check (
    services <@ array['nikah', 'janaza']::text[]
    and cardinality(services) > 0
  )
);

create index if not exists idx_officiants_org_id on officiants(org_id);
create index if not exists idx_officiants_member_id on officiants(member_id);

-- WEEKLY RECURRING AVAILABILITY -------------------------------------------
create table if not exists officiant_recurring_availability (
  id            uuid primary key default gen_random_uuid(),
  officiant_id  uuid not null references officiants(id) on delete cascade,
  day_of_week   int not null check (day_of_week between 0 and 6),
  start_time    time not null,
  end_time      time not null,
  constraint recurring_availability_range check (start_time < end_time)
);

create index if not exists idx_recurring_availability_officiant
  on officiant_recurring_availability(officiant_id);

-- GENERATED SLOTS ---------------------------------------------------------
create table if not exists availability_slots (
  id            uuid primary key default gen_random_uuid(),
  officiant_id  uuid not null references officiants(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        text not null default 'open'
                check (status in ('open', 'held', 'confirmed')),
  unique (officiant_id, starts_at),
  constraint availability_slots_range check (starts_at < ends_at)
);

create index if not exists idx_availability_slots_officiant_status
  on availability_slots(officiant_id, status, starts_at);

-- SERVICE REQUESTS --------------------------------------------------------
create table if not exists service_requests (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  service_type   text not null check (service_type in ('nikah', 'janaza')),
  slot_id        uuid references availability_slots(id) on delete set null,
  officiant_id   uuid references officiants(id) on delete set null,
  requested_by   uuid not null references members(id) on delete cascade,
  status         text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'declined', 'expired')),
  needed_by      timestamptz,
  details        text,
  created_at     timestamptz not null default now(),
  constraint service_requests_nikah_slot check (
    service_type <> 'nikah' or slot_id is not null
  ),
  constraint service_requests_janaza_shape check (
    service_type <> 'janaza' or (slot_id is null and needed_by is not null)
  )
);

create index if not exists idx_service_requests_org_status
  on service_requests(org_id, service_type, status);
create index if not exists idx_service_requests_officiant
  on service_requests(officiant_id, status);
create index if not exists idx_service_requests_requester
  on service_requests(requested_by, created_at desc);

-- IN-APP NOTIFICATIONS ----------------------------------------------------
create table if not exists service_notifications (
  id                    uuid primary key default gen_random_uuid(),
  recipient_member_id   uuid not null references members(id) on delete cascade,
  org_id                uuid not null references organizations(id) on delete cascade,
  service_request_id    uuid references service_requests(id) on delete cascade,
  kind                  text not null check (kind in (
                          'nikah_request',
                          'nikah_confirmed',
                          'nikah_declined',
                          'nikah_expired',
                          'janaza_broadcast',
                          'janaza_claimed',
                          'janaza_covered'
                        )),
  body                  text not null,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_service_notifications_recipient
  on service_notifications(recipient_member_id, created_at desc);

-- RPC: hold an open nikah slot and create the pending request --------------
create or replace function hold_nikah_slot(
  p_slot_id uuid,
  p_requested_by uuid,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot availability_slots%rowtype;
  v_officiant officiants%rowtype;
  v_request_id uuid;
begin
  update availability_slots
  set status = 'held'
  where id = p_slot_id and status = 'open'
  returning * into v_slot;

  if not found then
    raise exception 'Slot is no longer available';
  end if;

  select * into strict v_officiant from officiants where id = v_slot.officiant_id;

  if not ('nikah' = any (v_officiant.services)) then
    raise exception 'Officiant does not offer nikah';
  end if;

  insert into service_requests (
    org_id, service_type, slot_id, officiant_id, requested_by, status, details
  ) values (
    v_officiant.org_id, 'nikah', p_slot_id, v_officiant.id, p_requested_by, 'pending', p_details
  )
  returning id into v_request_id;

  insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
  values (
    v_officiant.member_id,
    v_officiant.org_id,
    v_request_id,
    'nikah_request',
    'New nikah request needs confirmation.'
  );

  return v_request_id;
end;
$$;

-- RPC: officiant confirms or declines a held nikah request -----------------
create or replace function respond_nikah_request(
  p_request_id uuid,
  p_officiant_id uuid,
  p_accept boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request service_requests%rowtype;
begin
  select * into v_request
  from service_requests
  where id = p_request_id
    and officiant_id = p_officiant_id
    and service_type = 'nikah'
    and status = 'pending';

  if not found then
    raise exception 'Nikah request is no longer pending';
  end if;

  if p_accept then
    update service_requests set status = 'confirmed' where id = v_request.id;
    update availability_slots set status = 'confirmed' where id = v_request.slot_id;
    insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
    values (
      v_request.requested_by,
      v_request.org_id,
      v_request.id,
      'nikah_confirmed',
      'Your nikah request was confirmed.'
    );
  else
    update service_requests set status = 'declined' where id = v_request.id;
    update availability_slots
    set status = 'open'
    where id = v_request.slot_id and status = 'held';
    insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
    values (
      v_request.requested_by,
      v_request.org_id,
      v_request.id,
      'nikah_declined',
      'Your nikah request was declined. Please pick another slot.'
    );
  end if;

  return true;
end;
$$;

-- RPC: first officiant to claim an unassigned janaza wins ------------------
create or replace function claim_janaza_request(
  p_request_id uuid,
  p_officiant_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated uuid;
  v_request service_requests%rowtype;
begin
  update service_requests
  set officiant_id = p_officiant_id, status = 'confirmed'
  where id = p_request_id
    and service_type = 'janaza'
    and officiant_id is null
    and status = 'pending'
  returning id into v_updated;

  if v_updated is null then
    return false;
  end if;

  select * into strict v_request from service_requests where id = p_request_id;

  insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
  values (
    v_request.requested_by,
    v_request.org_id,
    v_request.id,
    'janaza_claimed',
    'An officiant has claimed this janaza request.'
  );

  insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
  select o.member_id, o.org_id, p_request_id, 'janaza_covered',
         'This janaza request is already covered.'
  from officiants o
  where o.id <> p_officiant_id
    and 'janaza' = any (o.services)
    and (
      o.org_id = v_request.org_id
      or exists (
        select 1
        from service_notifications n
        where n.service_request_id = p_request_id
          and n.recipient_member_id = o.member_id
          and n.kind = 'janaza_broadcast'
      )
    );

  return true;
end;
$$;

-- RPC: expire held nikah requests after 24 hours ---------------------------
create or replace function expire_held_nikah_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select sr.id, sr.slot_id, sr.requested_by, sr.org_id
    from service_requests sr
    where sr.service_type = 'nikah'
      and sr.status = 'pending'
      and sr.created_at < now() - interval '24 hours'
  loop
    update service_requests set status = 'expired' where id = r.id;

    if r.slot_id is not null then
      update availability_slots
      set status = 'open'
      where id = r.slot_id and status = 'held';
    end if;

    insert into service_notifications (recipient_member_id, org_id, service_request_id, kind, body)
    values (
      r.requested_by,
      r.org_id,
      r.id,
      'nikah_expired',
      'Your nikah slot hold expired. Please pick another slot.'
    );

    n := n + 1;
  end loop;

  return n;
end;
$$;

-- RPC: expand recurring weekly hours into open slots a few weeks out -------
create or replace function generate_availability_slots(
  p_weeks int default 4,
  p_officiant_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int := 0;
begin
  if p_weeks is null or p_weeks < 1 then
    p_weeks := 4;
  end if;

  insert into availability_slots (officiant_id, starts_at, ends_at, status)
  select
    a.officiant_id,
    ((d.slot_date + a.start_time) at time zone 'UTC'),
    ((d.slot_date + a.end_time) at time zone 'UTC'),
    'open'
  from officiant_recurring_availability a
  cross join lateral (
    select generate_series(
      current_date,
      current_date + (p_weeks * 7 - 1),
      interval '1 day'
    )::date as slot_date
  ) d
  where extract(dow from d.slot_date)::int = a.day_of_week
    and (p_officiant_id is null or a.officiant_id = p_officiant_id)
    and ((d.slot_date + a.start_time) at time zone 'UTC') > now()
  on conflict (officiant_id, starts_at) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

grant execute on function hold_nikah_slot(uuid, uuid, text) to authenticated, service_role;
grant execute on function respond_nikah_request(uuid, uuid, boolean) to authenticated, service_role;
grant execute on function claim_janaza_request(uuid, uuid) to authenticated, service_role;
grant execute on function expire_held_nikah_requests() to authenticated, service_role;
grant execute on function generate_availability_slots(int, uuid) to authenticated, service_role;
