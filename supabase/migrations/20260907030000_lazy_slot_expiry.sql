-- Lazy 24h hold expiry: no cron. Bookable slots are a view; stale holds
-- are reclaimed when someone books or lists availability.

create or replace function reclaim_stale_nikah_holds()
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

create or replace function expire_held_nikah_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return reclaim_stale_nikah_holds();
end;
$$;

create or replace view available_slots as
select
  s.id,
  s.officiant_id,
  s.starts_at,
  s.ends_at
from availability_slots s
where s.starts_at > now()
  and (
    s.status = 'open'
    or (
      s.status = 'held'
      and not exists (
        select 1
        from service_requests sr
        where sr.slot_id = s.id
          and sr.service_type = 'nikah'
          and sr.status = 'pending'
          and sr.created_at >= now() - interval '24 hours'
      )
    )
  );

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
  perform reclaim_stale_nikah_holds();

  update availability_slots
  set status = 'held'
  where id = p_slot_id
    and (
      status = 'open'
      or (
        status = 'held'
        and not exists (
          select 1
          from service_requests sr
          where sr.slot_id = p_slot_id
            and sr.service_type = 'nikah'
            and sr.status = 'pending'
            and sr.created_at >= now() - interval '24 hours'
        )
      )
    )
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

grant execute on function reclaim_stale_nikah_holds() to anon, authenticated, service_role;
grant select on available_slots to anon, authenticated, service_role;
