-- Apply after schema.sql. Additive CrossFire operations update; never resets data.
-- Deploy only within the ordered release prepared by scripts/prepare-security-release.mjs.
alter table public.users add column if not exists active boolean not null default true;
alter table public.users add column if not exists pass_code text not null default ('CF26-' || upper(replace(gen_random_uuid()::text,'-','')));
create unique index if not exists users_pass_code_unique on public.users(pass_code);
alter table public.volunteers alter column password drop not null;
alter table public.volunteers add column if not exists ops_station text not null default 'support' check (ops_station in ('gate','food','event','guest','support'));
alter table public.volunteers add column if not exists ops_event_id uuid references public.events(id);
create unique index if not exists volunteers_linked_user_unique on public.volunteers(user_id) where user_id is not null;
alter table public.guests add column if not exists pass_code text not null default ('CFG-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
create unique index if not exists guests_pass_code_unique on public.guests(pass_code);
alter table public.guests add column if not exists arrived_at timestamptz;
alter table public.guests add column if not exists departed_at timestamptz;
alter table public.guests add column if not exists meal_redeemed_at timestamptz;
alter table public.guests add column if not exists archived_at timestamptz;
alter table public.incidents add column if not exists priority text not null default 'Normal' check (priority in ('Normal','High'));
alter table public.incidents add column if not exists resolution text;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.users where id = auth.uid() and active
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select coalesce(public.current_user_role() in ('admin','super_admin'),false) $$;
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select coalesce(public.current_user_role() = 'super_admin',false) $$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select coalesce(public.current_user_role() in ('admin','super_admin','judge','volunteer'),false) $$;
create or replace function public.is_ops_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$ select coalesce(public.current_user_role() in ('admin','super_admin','volunteer'),false) $$;
create or replace function public._require_role(variadic p_roles public.user_role[])
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_role public.user_role := public.current_user_role();
begin
  if auth.uid() is null then raise exception 'Please sign in to continue.'; end if;
  if v_role is null or not (v_role = any(p_roles) or (v_role = 'super_admin' and not ('student' = any(p_roles)))) then
    raise exception 'Your account does not have permission for this action.';
  end if;
  return auth.uid();
end $$;

create or replace function public._ops_has_duty(p_station text, p_event uuid default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin() or (public.current_user_role() = 'volunteer' and exists (
    select 1 from public.volunteers v where v.user_id = auth.uid() and v.ops_station = p_station
      and v.attendance_status = 'Present / On Duty' and (p_station <> 'event' or v.ops_event_id = p_event)
  ))
$$;
create or replace function public._ops_student_visible(p_student uuid, p_event uuid default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin() or public._ops_has_duty('gate') or public._ops_has_duty('food') or exists (
    select 1 from public.registrations r where r.user_id = p_student and (p_event is null or r.event_id = p_event)
      and ((public.current_user_role() = 'volunteer' and public._ops_has_duty('event',r.event_id))
        or (public.current_user_role() = 'judge' and exists(select 1 from public.judge_assignments j where j.judge_id = auth.uid() and j.event_id = r.event_id)))
  )
$$;

-- Existing endpoints also enforce duty boundaries; calling an older endpoint cannot bypass them.
create or replace function public.staff_set_check_in(p_user_id uuid, p_checked_in boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('volunteer','admin'); u public.users; v_new timestamptz;
begin
  if not public._ops_has_duty('gate') then raise exception 'Check-in is available to on-duty gate volunteers and admins.'; end if;
  if not p_checked_in and not public.is_admin() then raise exception 'Only an admin can undo check-in.'; end if;
  select * into u from public.users where id = p_user_id and role = 'student' for update;
  if not found then raise exception 'Student not found.'; end if;
  if not exists(select 1 from public.registrations where user_id=p_user_id and status in ('registered','confirmed')) then raise exception 'This student has no active event registration.'; end if;
  if not p_checked_in and u.food_redeemed_at is not null then raise exception 'A redeemed meal prevents check-in reversal.'; end if;
  v_new := case when p_checked_in then coalesce(u.checked_in_at,now()) else null end;
  update public.users set checked_in_at=v_new where id=p_user_id;
  if v_new is distinct from u.checked_in_at then perform public._audit('student.checkin','student',p_user_id,jsonb_build_object('at',u.checked_in_at),jsonb_build_object('at',v_new)); end if;
  return v_new;
end $$;
create or replace function public.staff_set_food_redeemed(p_user_id uuid, p_redeemed boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('volunteer','admin'); u public.users; v_new timestamptz;
begin
  if not public._ops_has_duty('food') then raise exception 'Meals are available to on-duty meal volunteers and admins.'; end if;
  if not p_redeemed and not public.is_admin() then raise exception 'Only an admin can reverse a meal redemption.'; end if;
  select * into u from public.users where id=p_user_id and role='student' for update;
  if not found then raise exception 'Student not found.'; end if;
  if p_redeemed and u.checked_in_at is null then raise exception 'Check in the student before issuing a meal.'; end if;
  if p_redeemed and u.food_redeemed_at is not null then raise exception 'This meal has already been redeemed.'; end if;
  v_new := case when p_redeemed then now() else null end;
  update public.users set food_redeemed_at=v_new where id=p_user_id;
  perform public._audit('student.meal','student',p_user_id,jsonb_build_object('at',u.food_redeemed_at),jsonb_build_object('at',v_new));
  return v_new;
end $$;
create or replace function public.staff_set_room_reported(p_registration_id uuid, p_reported boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('volunteer','admin'); r public.registrations; v_new timestamptz;
begin
  select * into r from public.registrations where id=p_registration_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  if not public._ops_has_duty('event',r.event_id) then raise exception 'You are not assigned to this event room.'; end if;
  if r.status not in ('registered','confirmed') then raise exception 'This registration is not active.'; end if;
  if not exists(select 1 from public.users where id=r.user_id and checked_in_at is not null) then raise exception 'Check in the student at the gate first.'; end if;
  if not p_reported and not public.is_admin() then raise exception 'Only an admin can clear event attendance.'; end if;
  v_new := case when p_reported then coalesce(r.room_reported_at,now()) else null end;
  update public.registrations set room_reported_at=v_new where id=r.id;
  if v_new is distinct from r.room_reported_at then perform public._audit('student.room','registration',r.id,jsonb_build_object('at',r.room_reported_at),jsonb_build_object('at',v_new)); end if;
  return v_new;
end $$;

create or replace function public.crossfire_ops_snapshot()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('admin','super_admin','volunteer'); v_admin boolean := public.is_admin(); v_actor jsonb;
begin
  select jsonb_build_object('id',id,'name',trim(first_name||' '||last_name),'role',role) into v_actor from public.users where id=v_uid;
  return jsonb_build_object(
    'actor',v_actor,'fetched_at',now(),
    'students',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'pass_id',u.pass_code,'name',trim(u.first_name||' '||u.last_name),
      'institute',u.institute_name,'contact_number',case when v_admin or public._ops_has_duty('gate') then coalesce(u.contact_number,'') else '' end,
      'food_preference',u.food_preference,'checked_in_at',u.checked_in_at,'food_redeemed_at',u.food_redeemed_at,
      'registrations',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'event_id',r.event_id,'name',e.name,'status',r.status,'room_reported_at',r.room_reported_at) order by e.name)
        from public.registrations r join public.events e on e.id=r.event_id where r.user_id=u.id and public._ops_student_visible(u.id,r.event_id)),'[]'::jsonb)
      ) order by u.created_at desc) from public.users u where u.role='student' and public._ops_student_visible(u.id)),'[]'::jsonb),
    'guests',coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at desc) from public.guests g where g.archived_at is null and
      (v_admin or (public._ops_has_duty('guest') and (g.escort_volunteer_id is null or exists(select 1 from public.volunteers v where v.id=g.escort_volunteer_id and v.user_id=v_uid))))),'[]'::jsonb),
    'volunteers',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'user_id',v.user_id,'volunteer_id',v.volunteer_id,'name',v.name,'email',v.email,
      'station',v.ops_station,'event_id',v.ops_event_id,'shift',v.shift,'attendance_status',v.attendance_status,'kit_issued',v.kit_issued,'walkie_channel',coalesce(v.walkie_channel,''),'notes',coalesce(v.notes,''),'updated_at',v.updated_at) order by v.name)
      from public.volunteers v where v_admin or v.user_id=v_uid),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'slug',e.slug,'venue',e.venue_location,'status',e.status,'capacity',e.max_participants,
      'registered',(select count(*) from public.registrations r where r.event_id=e.id and r.status in ('registered','confirmed')),'start_time',e.start_time,
      'judges',case when v_admin then coalesce((select jsonb_agg(j.judge_id) from public.judge_assignments j where j.event_id=e.id),'[]'::jsonb) else '[]'::jsonb end) order by e.start_time)
      from public.events e where v_admin or e.status<>'draft'),'[]'::jsonb),
    'staff',case when v_admin then coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',trim(u.first_name||' '||u.last_name),'email',u.email,'contact_number',coalesce(u.contact_number,''),'role',u.role,'active',u.active,'updated_at',u.updated_at) order by u.first_name)
      from public.users u where u.role in ('admin','super_admin','volunteer','judge')),'[]'::jsonb) else '[]'::jsonb end,
    'incidents',coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from public.incidents i where v_admin or i.reported_by=v_uid),'[]'::jsonb),
    'audit',case when v_admin then coalesce((select jsonb_agg(a) from (select l.id,coalesce(trim(u.first_name||' '||u.last_name),'System') as actor,l.action,l.entity_type,l.created_at from public.audit_logs l left join public.users u on u.id=l.actor_id order by l.created_at desc limit 100) a),'[]'::jsonb) else '[]'::jsonb end,
    'settings',jsonb_build_object('student_portal_open',coalesce((select value='true'::jsonb from public.system_settings where key='student_portal_open'),false))
  );
end $$;

create or replace function public.crossfire_ops_action(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := public._require_role('admin','super_admin','volunteer');
  v_admin boolean := public.is_admin(); v_super boolean := public.is_super_admin();
  v_id uuid := nullif(p_payload->>'id','')::uuid;
  v_guest public.guests; v_vol public.volunteers; v_staff public.users;
  v_status text := p_payload->>'status'; v_role text := p_payload->>'role';
  v_active boolean := coalesce((p_payload->>'active')::boolean,true); v_old jsonb; v_result jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid request.'; end if;
  -- Serialize assignment/access edits with new guest assignments so an escort
  -- cannot be suspended or moved while another admin assigns an active guest.
  if p_action in ('guest.save','volunteer.save','staff.access') then perform pg_advisory_xact_lock(2026,1016); end if;
  if p_action in ('guest.save','guest.archive','volunteer.save','registration.status','event.status','event.judge','incident.resolve','staff.access','announcement.send') and not v_admin then raise exception 'This action requires an admin.'; end if;
  if p_action='guest.save' then
    if char_length(btrim(coalesce(p_payload->>'name',''))) not between 2 and 120 or char_length(btrim(coalesce(p_payload->>'designation',''))) not between 2 and 200 or char_length(btrim(coalesce(p_payload->>'organization',''))) not between 2 and 200 then raise exception 'Enter the guest name, designation, and organization.'; end if;
    if coalesce(p_payload->>'category','') not in ('Chief Guest','Guest of Honour','Keynote Speaker','VIP Dignitary','Judge','Special Invitee') then raise exception 'Select an invited VIP or judge category.'; end if;
    if coalesce(p_payload->>'email','')<>'' and p_payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
    if coalesce(p_payload->>'contact_number','')<>'' and p_payload->>'contact_number' !~ '^\+?[0-9]{10,13}$' then raise exception 'Enter a phone number with 10 to 13 digits.'; end if;
    if nullif(p_payload->>'escort_volunteer_id','') is not null and not exists(select 1 from public.volunteers v join public.users u on u.id=v.user_id where v.id=(p_payload->>'escort_volunteer_id')::uuid and v.ops_station='guest' and u.active and u.role='volunteer') then raise exception 'Select an active volunteer assigned to guest duties.'; end if;
    if v_id is null then v_id:=gen_random_uuid(); end if;
    select * into v_guest from public.guests where id=v_id for update;
    if found then
      if nullif(p_payload->>'expected_updated_at','') is null or v_guest.updated_at is distinct from (p_payload->>'expected_updated_at')::timestamptz then raise exception 'This guest has changed. Refresh and reopen the form.'; end if;
      if v_guest.archived_at is not null then raise exception 'This guest is archived.'; end if;
      v_old:=to_jsonb(v_guest);
      update public.guests set name=btrim(p_payload->>'name'),designation=btrim(p_payload->>'designation'),organization=btrim(p_payload->>'organization'),category=p_payload->>'category',contact_number=coalesce(p_payload->>'contact_number',''),email=lower(coalesce(p_payload->>'email','')),escort_volunteer_id=nullif(p_payload->>'escort_volunteer_id','')::uuid,arrival_time=coalesce(p_payload->>'arrival_time',''),vehicle_number=coalesce(p_payload->>'vehicle_number',''),dietary_preference=coalesce(p_payload->>'dietary_preference','Veg'),notes=left(coalesce(p_payload->>'notes',''),2000) where id=v_id;
    else
      insert into public.guests(id,name,designation,organization,category,contact_number,email,status,escort_volunteer_id,arrival_time,vehicle_number,dietary_preference,notes)
        values(v_id,btrim(p_payload->>'name'),btrim(p_payload->>'designation'),btrim(p_payload->>'organization'),p_payload->>'category',coalesce(p_payload->>'contact_number',''),lower(coalesce(p_payload->>'email','')),'Invited',nullif(p_payload->>'escort_volunteer_id','')::uuid,coalesce(p_payload->>'arrival_time',''),coalesce(p_payload->>'vehicle_number',''),coalesce(p_payload->>'dietary_preference','Veg'),left(coalesce(p_payload->>'notes',''),2000));
    end if;
    perform public._audit(p_action,'guest',v_id,v_old,jsonb_build_object('name',p_payload->>'name'));
  elsif p_action in ('guest.status','guest.meal','guest.archive') then
    select * into v_guest from public.guests where id=v_id and archived_at is null for update;
    if not found then raise exception 'Guest not found.'; end if;
    if not v_admin and (not public._ops_has_duty('guest') or (v_guest.escort_volunteer_id is not null and not exists(select 1 from public.volunteers where id=v_guest.escort_volunteer_id and user_id=v_uid))) then raise exception 'You are not assigned to this guest.'; end if;
    v_old:=jsonb_build_object('status',v_guest.status,'meal_redeemed_at',v_guest.meal_redeemed_at);
    if p_action='guest.status' then
      if not ((v_guest.status='Invited' and v_admin and v_status in ('Confirmed','Declined')) or (v_guest.status='Confirmed' and (v_status='Arrived' or (v_admin and v_status='Declined'))) or (v_guest.status='Arrived' and v_status='Departed') or (v_guest.status='Declined' and v_admin and v_status='Invited')) then raise exception 'This guest status transition is not allowed. Refresh the guest list.'; end if;
      update public.guests set status=v_status,arrived_at=case when v_status='Arrived' then now() else arrived_at end,departed_at=case when v_status='Departed' then now() else departed_at end where id=v_id;
    elsif p_action='guest.meal' then
      if v_guest.status<>'Arrived' then raise exception 'The guest must be marked arrived before a meal is issued.'; end if;
      if v_guest.meal_redeemed_at is not null then raise exception 'This guest meal has already been issued.'; end if;
      update public.guests set meal_redeemed_at=now() where id=v_id;
    else
      if v_guest.status='Arrived' then raise exception 'Mark the guest departed before archiving.'; end if;
      update public.guests set archived_at=now() where id=v_id;
    end if;
    perform public._audit(p_action,'guest',v_id,v_old,jsonb_build_object('status',v_status));
  elsif p_action='volunteer.save' then
    select * into v_vol from public.volunteers where id=v_id for update;
    if not found then raise exception 'Create the volunteer staff account first.'; end if;
    if v_vol.updated_at is distinct from nullif(p_payload->>'expected_updated_at','')::timestamptz then raise exception 'This assignment has changed. Refresh and reopen it.'; end if;
    if coalesce(p_payload->>'station','') not in ('gate','food','event','guest','support') then raise exception 'Choose a duty station.'; end if;
    if coalesce(p_payload->>'attendance_status','') not in ('Assigned','Present / On Duty','On Break','Absent') then raise exception 'Choose a valid attendance status.'; end if;
    if not exists(select 1 from public.users where id=v_vol.user_id and role='volunteer' and active) then raise exception 'Link an active volunteer account before assigning duties.'; end if;
    if p_payload->>'station'='event' and not exists(select 1 from public.events where id=nullif(p_payload->>'event_id','')::uuid) then raise exception 'Choose the assigned event.'; end if;
    if p_payload->>'station'<>'guest' and exists(select 1 from public.guests where escort_volunteer_id=v_id and archived_at is null and status in ('Invited','Confirmed','Arrived')) then raise exception 'Reassign this volunteer’s active guests before changing their station.'; end if;
    update public.volunteers set ops_station=p_payload->>'station',ops_event_id=case when p_payload->>'station'='event' then (p_payload->>'event_id')::uuid else null end,assigned_station=p_payload->>'station',shift=left(coalesce(p_payload->>'shift','Full day'),100),attendance_status=p_payload->>'attendance_status',kit_issued=coalesce((p_payload->>'kit_issued')::boolean,false),walkie_channel=left(coalesce(p_payload->>'walkie_channel',''),100),notes=left(coalesce(p_payload->>'notes',''),2000) where id=v_id;
    perform public._audit(p_action,'volunteer',v_id,jsonb_build_object('station',v_vol.ops_station),jsonb_build_object('station',p_payload->>'station'));
  elsif p_action='volunteer.attendance' then
    select * into v_vol from public.volunteers where id=v_id for update;
    if not found or (not v_admin and v_vol.user_id is distinct from v_uid) then raise exception 'Volunteer assignment not found.'; end if;
    if not exists(select 1 from public.users where id=v_vol.user_id and active and role='volunteer') then raise exception 'This volunteer account is inactive.'; end if;
    if coalesce(v_status,'') not in ('Present / On Duty','On Break') then raise exception 'Choose on duty or on break.'; end if;
    update public.volunteers set attendance_status=v_status where id=v_id;
    perform public._audit(p_action,'volunteer',v_id,jsonb_build_object('status',v_vol.attendance_status),jsonb_build_object('status',v_status));
  elsif p_action='student.checkin' then perform public.staff_set_check_in(v_id,true);
  elsif p_action='student.meal' then perform public.staff_set_food_redeemed(v_id,true);
  elsif p_action='student.room' then perform public.staff_set_room_reported(v_id,true);
  elsif p_action='registration.status' then perform public.admin_set_registration_status(v_id,v_status);
  elsif p_action='event.status' then perform public.admin_set_event_status(v_id,v_status);
  elsif p_action='event.judge' then
    if coalesce((p_payload->>'assigned')::boolean,false) then
      if not exists(select 1 from public.users where id=(p_payload->>'judge_id')::uuid and role='judge' and active) then raise exception 'Choose an active judge.'; end if;
      perform public.admin_assign_judge(v_id,(p_payload->>'judge_id')::uuid);
    else perform public.admin_unassign_judge(v_id,(p_payload->>'judge_id')::uuid); end if;
  elsif p_action='incident.report' then
    if char_length(btrim(coalesce(p_payload->>'room',''))) not between 1 and 100 or char_length(btrim(coalesce(p_payload->>'issue',''))) not between 3 and 1000 then raise exception 'Choose a room and describe the issue (3–1000 characters).'; end if;
    insert into public.incidents(room,issue,priority,reported_by) values(btrim(p_payload->>'room'),btrim(p_payload->>'issue'),coalesce(p_payload->>'priority','Normal'),v_uid) returning id into v_id;
    perform public._audit(p_action,'incident',v_id,null,jsonb_build_object('priority',p_payload->>'priority'));
  elsif p_action='incident.resolve' then
    if char_length(btrim(coalesce(p_payload->>'resolution',''))) not between 3 and 1000 then raise exception 'Describe how this issue was resolved.'; end if;
    update public.incidents set status='Resolved',resolution=btrim(p_payload->>'resolution'),resolved_by=v_uid,resolved_at=now() where id=v_id and status='Open';
    if not found then raise exception 'This incident is already resolved or no longer exists.'; end if;
    perform public._audit(p_action,'incident',v_id,null,jsonb_build_object('resolution',p_payload->>'resolution'));
  elsif p_action='staff.access' then
    select * into v_staff from public.users where id=v_id for update;
    if not found or v_staff.role='student' then raise exception 'Staff account not found.'; end if;
    if v_id=v_uid then raise exception 'You cannot change your own access.'; end if;
    if nullif(p_payload->>'expected_updated_at','') is not null and v_staff.updated_at is distinct from (p_payload->>'expected_updated_at')::timestamptz then raise exception 'Staff access has changed. Refresh and reopen the form.'; end if;
    if coalesce(v_role,'') not in ('volunteer','judge','admin','super_admin') then raise exception 'Choose a valid staff role.'; end if;
    if not v_super and (v_staff.role not in ('judge','volunteer') or v_role not in ('judge','volunteer')) then raise exception 'Only a super admin can manage admin-level accounts.'; end if;
    if v_staff.role='super_admin' and (v_role<>'super_admin' or not v_active) and (select count(*) from public.users where role='super_admin' and active)<=1 then raise exception 'At least one active super admin must remain.'; end if;
    if v_staff.role='judge' and v_role<>'judge' and exists(select 1 from public.scores where judge_id=v_id) then raise exception 'A judge with submitted scores cannot change roles.'; end if;
    if v_staff.role='volunteer' and (not v_active or v_role<>'volunteer') and exists(select 1 from public.guests g join public.volunteers v on v.id=g.escort_volunteer_id where v.user_id=v_id and g.archived_at is null and g.status in ('Invited','Confirmed','Arrived')) then raise exception 'Reassign this volunteer’s active guests before changing access.'; end if;
    update public.users set role=v_role::public.user_role,active=v_active where id=v_id;
    if v_role='volunteer' then
      insert into public.volunteers(user_id,volunteer_id,name,contact_number,email,password,attendance_status,kit_issued,ops_station) values(v_id,'VOL-'||upper(substr(replace(v_id::text,'-',''),1,10)),trim(v_staff.first_name||' '||v_staff.last_name),coalesce(v_staff.contact_number,'0000000000'),v_staff.email,null,'Assigned',false,'support') on conflict(user_id) where user_id is not null do nothing;
    end if;
    if not v_active or v_role<>'volunteer' then update public.volunteers set attendance_status='Absent' where user_id=v_id; end if;
    if not v_active or v_role<>'judge' then delete from public.judge_assignments where judge_id=v_id; end if;
    perform public._audit(p_action,'staff',v_id,jsonb_build_object('role',v_staff.role,'active',v_staff.active),jsonb_build_object('role',v_role,'active',v_active));
  elsif p_action='settings.portal' then
    if not v_super then raise exception 'Only a super admin can change system settings.'; end if;
    perform public.admin_set_system_setting('student_portal_open',to_jsonb(coalesce((p_payload->>'open')::boolean,false)));
  elsif p_action='announcement.send' then
    perform public.admin_broadcast(p_payload->>'target',p_payload->>'title',p_payload->>'message');
  else raise exception 'Unknown operations action.';
  end if;
  return jsonb_build_object('success',true,'id',v_id);
end $$;

-- Called by provision-staff with the caller's real JWT after Auth creates an account.
create or replace function public.crossfire_ops_provision(p_data jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('admin','super_admin'); v_id uuid := (p_data->>'id')::uuid; v_role text := p_data->>'role'; v_email text;
begin
  if coalesce(v_role,'') not in ('volunteer','judge','admin','super_admin') or (not public.is_super_admin() and v_role not in ('volunteer','judge')) then raise exception 'You cannot create this staff role.'; end if;
  if char_length(btrim(coalesce(p_data->>'name',''))) not between 2 and 100 then raise exception 'Enter a staff name (2–100 characters).'; end if;
  if coalesce(p_data->>'contact_number','') !~ '^\+?[0-9]{10,13}$' then raise exception 'Enter a valid contact number.'; end if;
  select email into v_email from auth.users where id=v_id and raw_app_meta_data->>'crossfire_provisioned_by'=v_uid::text;
  if not found then raise exception 'Auth account not found.'; end if;
  if exists(select 1 from public.users where id=v_id) then raise exception 'This profile already exists. Manage its access instead.'; end if;
  insert into public.users(id,email,first_name,last_name,contact_number,role,active) values(v_id,v_email,btrim(p_data->>'name'),'',p_data->>'contact_number',v_role::public.user_role,true);
  if v_role='volunteer' then
    insert into public.volunteers(user_id,volunteer_id,name,contact_number,email,password,attendance_status,kit_issued,ops_station) values(v_id,'VOL-'||upper(substr(replace(v_id::text,'-',''),1,10)),btrim(p_data->>'name'),p_data->>'contact_number',v_email,null,'Assigned',false,'support');
  end if;
  perform public._audit('staff.created','staff',v_id,null,jsonb_build_object('role',v_role));
  return v_id;
end $$;

-- The system-setting endpoint also enforces the super-admin boundary for legacy callers.
create or replace function public.admin_set_system_setting(p_key text,p_value jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid := public._require_role('super_admin');
begin
  if p_key<>'student_portal_open' or jsonb_typeof(p_value)<>'boolean' then raise exception 'Unknown or invalid system setting.'; end if;
  insert into public.system_settings(key,value,updated_by) values(p_key,p_value,v_uid) on conflict(key) do update set value=excluded.value,updated_by=v_uid,updated_at=now();
  perform public._audit('settings.portal','setting',gen_random_uuid(),null,jsonb_build_object('open',p_value));
end $$;

-- Table policies remain restrictive even if a user calls REST directly.
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated using (id=auth.uid() or public.is_admin() or (role='student' and public._ops_student_visible(id)));
drop policy if exists registrations_select on public.registrations;
create policy registrations_select on public.registrations for select to authenticated using (user_id=auth.uid() or public._ops_student_visible(user_id,event_id));
drop policy if exists volunteers_select on public.volunteers;
create policy volunteers_select on public.volunteers for select to authenticated using(public.is_admin() or (user_id=auth.uid() and public.current_user_role()='volunteer'));
drop policy if exists guests_select on public.guests;
create policy guests_select on public.guests for select to authenticated using(public.is_admin() or (archived_at is null and public._ops_has_duty('guest') and (escort_volunteer_id is null or exists(select 1 from public.volunteers where id=escort_volunteer_id and user_id=auth.uid()))));
drop policy if exists incidents_select on public.incidents;
create policy incidents_select on public.incidents for select to authenticated using(public.is_admin() or (reported_by=auth.uid() and public.is_ops_staff()));
revoke select on public.volunteers from authenticated;
grant select(id,user_id,volunteer_id,name,contact_number,email,assigned_station,shift,attendance_status,kit_issued,walkie_channel,notes,created_at,updated_at,ops_station,ops_event_id) on public.volunteers to authenticated;

-- Disable legacy password and account-edit paths; do not erase any existing records.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('verify_volunteer_login','admin_set_user_role','admin_upsert_volunteer','admin_delete_volunteer','admin_upsert_guest','admin_delete_guest') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.sig);
  end loop;
  if to_regclass('public.students_view') is not null then execute 'revoke all on public.students_view from anon,authenticated'; end if;
  if to_regclass('public.staff_view') is not null then execute 'revoke all on public.staff_view from anon,authenticated'; end if;
  if to_regclass('public.admins_view') is not null then execute 'revoke all on public.admins_view from anon,authenticated'; end if;
end $$;
revoke all on function public.crossfire_ops_snapshot(),public.crossfire_ops_action(text,jsonb),public.crossfire_ops_provision(jsonb),public._ops_has_duty(text,uuid),public._ops_student_visible(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crossfire_ops_snapshot(),public.crossfire_ops_action(text,jsonb),public.crossfire_ops_provision(jsonb),public._ops_has_duty(text,uuid),public._ops_student_visible(uuid,uuid) to authenticated;

create or replace function public.crossfire_mark_notification_read(p_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or public.current_user_role() is null then raise exception 'Sign in to continue.'; end if;
  update public.notifications set read_at=coalesce(read_at,now()) where id=p_id and user_id=auth.uid();
  if not found then raise exception 'Notification not found.'; end if;
end $$;
revoke all on function public.crossfire_mark_notification_read(uuid) from public,anon,authenticated;
grant execute on function public.crossfire_mark_notification_read(uuid) to authenticated;
