-- Direct registration keeps contact records private and does not assert email ownership.
alter table public.crossfire_registration_requests drop constraint if exists crossfire_registration_requests_status_check;
alter table public.crossfire_registration_requests add constraint crossfire_registration_requests_status_check check(status in ('pending','reviewed','declined','registered'));
alter table public.crossfire_registration_requests alter column status set default 'registered';
-- Pending records never had approval; preserve declined and already-invited records.
update public.crossfire_registration_requests set status='registered',updated_at=clock_timestamp() where status='pending';

create or replace function public.crossfire_submit_registration_request(p_request_id uuid,p_profile jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  clean jsonb; field text; choices text[]; selected_events jsonb; found_count integer;
  previous public.crossfire_registration_requests; reference text;
begin
  if p_request_id is null or p_profile is null or jsonb_typeof(p_profile)<>'object' or octet_length(p_profile::text)>8192 then raise exception 'Invalid registration data.'; end if;
  if p_profile - array['student_name','email','contact_number','whatsapp_number','institute_name','city_town','course_stream','board','food_preference','selected_competitions','parent_consent','terms_accepted','website'] <> '{}'::jsonb then raise exception 'Unexpected registration fields.'; end if;
  if coalesce(p_profile->>'website','')<>'' then raise exception 'Unable to accept this submission.'; end if;
  if p_profile->'parent_consent' is distinct from 'true'::jsonb or p_profile->'terms_accepted' is distinct from 'true'::jsonb then raise exception 'Participation consent is required.'; end if;
  clean:='{}'::jsonb;
  foreach field in array array['student_name','email','contact_number','whatsapp_number','institute_name','city_town','course_stream','board','food_preference'] loop
    if jsonb_typeof(p_profile->field) is distinct from 'string' then raise exception 'Complete all registration fields.'; end if;
    clean:=clean||jsonb_build_object(field,btrim(p_profile->>field));
  end loop;
  clean:=clean||jsonb_build_object('email',lower(clean->>'email'),
    'contact_number',regexp_replace(clean->>'contact_number','[ +().-]','','g'),
    'whatsapp_number',regexp_replace(clean->>'whatsapp_number','[ +().-]','','g'));
  if char_length(clean->>'student_name') not between 2 and 120
    or char_length(clean->>'institute_name') not between 2 and 200
    or char_length(clean->>'city_town') not between 2 and 120
    or char_length(clean->>'email')>254 or clean->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or clean->>'contact_number' !~ '^[0-9]{10,13}$' or clean->>'whatsapp_number' !~ '^[0-9]{10,13}$'
    or clean->>'course_stream' not in ('12th Science','12th Commerce','12th Arts')
    or clean->>'board' not in ('CBSE','ICSE','CHSE') or clean->>'food_preference' not in ('Veg','Non-veg') then
    raise exception 'Enter valid student, contact, institute and preference details.';
  end if;
  if jsonb_typeof(p_profile->'selected_competitions') is distinct from 'array' then raise exception 'Select between 1 and 4 competitions.'; end if;
  if jsonb_array_length(p_profile->'selected_competitions') not between 1 and 4
    or exists(select 1 from jsonb_array_elements(p_profile->'selected_competitions') v where jsonb_typeof(v)<>'string') then raise exception 'Select between 1 and 4 competitions.'; end if;
  choices:=array(select distinct btrim(value) from jsonb_array_elements_text(p_profile->'selected_competitions') order by btrim(value));
  if cardinality(choices)<>jsonb_array_length(p_profile->'selected_competitions') then raise exception 'Select each competition only once.'; end if;
  clean:=clean||jsonb_build_object('selected_competitions',to_jsonb(choices),'parent_consent',true,'terms_accepted',true);

  -- Serialize bounded intake and idempotent retries, without trusting client IP headers.
  perform pg_advisory_xact_lock(hashtext('crossfire_registration_intake'));
  select * into previous from public.crossfire_registration_requests where id=p_request_id;
  if found then
    if previous.profile<>clean then raise exception 'This submission reference was already used. Start a new submission.'; end if;
    if previous.status='declined' then raise exception 'This registration was declined. Contact the organisers.'; end if;
    return jsonb_build_object('reference_code',previous.reference_code,'status','registered');
  end if;
  -- Repeated requests cannot overwrite an existing registration or reveal it by email.
  if (select count(*) from public.crossfire_registration_requests where profile->>'email'=clean->>'email' and created_at>now()-interval '24 hours')>=3
    or (select count(*) from public.crossfire_registration_requests where profile->>'contact_number'=clean->>'contact_number' and created_at>now()-interval '24 hours')>=3
    or (select count(*) from public.crossfire_registration_requests where created_at>now()-interval '1 hour')>=1000 then
    raise exception 'Submission limit reached. Please try later or contact the college organisers.';
  end if;
  perform 1 from public.events where name=any(choices) order by id for share;
  select count(*),jsonb_agg(jsonb_build_object('id',id,'name',name,'group',event_group) order by name)
    into found_count,selected_events from public.events where name=any(choices);
  if found_count<>cardinality(choices) then raise exception 'One or more competitions are unavailable.'; end if;
  if exists(select 1 from public.events where name=any(choices) and (status<>'open' or registration_deadline<now())) then raise exception 'Registration for a selected competition is closed.'; end if;
  if exists(select 1 from public.events where name=any(choices) group by event_group having count(*)>2) then raise exception 'Choose no more than 2 competitions from each group.'; end if;
  insert into public.crossfire_registration_requests(id,profile,events,status) values(p_request_id,clean,selected_events,'registered') returning reference_code into reference;
  return jsonb_build_object('reference_code',reference,'status','registered');
end $$;

create or replace function public.crossfire_list_registration_requests(p_status text default 'all',p_search text default '',p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); result jsonb;
begin
  if p_status is null or p_status not in ('all','pending','reviewed','declined','registered') or p_page is null or p_page<0 or p_page>10000 or char_length(coalesce(p_search,''))>200 then raise exception 'Invalid review filter.'; end if;
  with matching as (
    select * from public.crossfire_registration_requests r where (p_status='all' or r.status=p_status)
      and (coalesce(p_search,'')='' or position(lower(btrim(p_search)) in lower(r.reference_code||' '||(r.profile->>'student_name')||' '||(r.profile->>'email')||' '||(r.profile->>'institute_name')))>0)
  ) select jsonb_build_object('total',(select count(*) from matching),'items',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc,q.id) from (select * from matching order by created_at desc,id limit 25 offset p_page*25) q),'[]'::jsonb)) into result;
  return result;
end $$;

create or replace function public.crossfire_prepare_invitation(p_request_id uuid,p_resend boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); entry public.crossfire_registration_requests;
  settings public.crossfire_mail_settings; previous public.crossfire_student_invitations;
  account public.crossfire_student_accounts; job uuid;
begin
  perform pg_advisory_xact_lock(hashtext('crossfire_student_invitation_rate'));
  select * into entry from public.crossfire_registration_requests where id=p_request_id for update;
  if not found or entry.status not in ('reviewed','registered') then raise exception 'This registration is not eligible for a portal invitation.'; end if;
  if not exists(select 1 from public.system_settings where key='student_portal_open' and value='true'::jsonb) then raise exception 'The super admin must open the student portal before invitations are sent.'; end if;
  select * into settings from public.crossfire_mail_settings where singleton;
  if not settings.enabled or settings.sender_email='' then raise exception 'Enable an official sender in Email & invitations first.'; end if;
  select * into previous from public.crossfire_student_invitations where request_id=p_request_id order by created_at desc,id limit 1;
  if found then
    if previous.status in ('preparing','ready','sending','uncertain') then raise exception 'An invitation is in progress or needs delivery review. Do not resend until its outcome is confirmed.'; end if;
    if previous.status='accepted' and not coalesce(p_resend,false) then raise exception 'An invitation was already accepted by the email provider. Use Send new setup link for recovery.'; end if;
    if previous.created_at>now()-interval '10 minutes' then raise exception 'Wait 10 minutes before another invitation attempt.'; end if;
  end if;
  if (select count(*) from public.crossfire_student_invitations where actor_id=actor and created_at>now()-interval '1 hour')>=100
    or (select count(*) from public.crossfire_student_invitations where created_at>now()-interval '1 hour')>=1000 then raise exception 'Invitation limit reached. Try later.'; end if;
  insert into public.crossfire_student_accounts(request_id) values(p_request_id) on conflict do nothing;
  select * into account from public.crossfire_student_accounts where request_id=p_request_id;
  insert into public.crossfire_student_invitations(request_id,actor_id) values(p_request_id,actor) returning id into job;
  perform public._audit('student.invitation.prepared','registration_request',p_request_id,null,jsonb_build_object('job_id',job));
  return jsonb_build_object('job_id',job,'user_id',account.user_id,'request_id',p_request_id,'profile',entry.profile,'sender',to_jsonb(settings)-'singleton');
end $$;

create or replace function public.crossfire_provision_student(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); job public.crossfire_student_invitations;
  entry public.crossfire_registration_requests; account public.crossfire_student_accounts;
  identity auth.users; event_id uuid; result jsonb; full_name text;
begin
  select * into job from public.crossfire_student_invitations where id=p_job_id for update;
  if not found or job.actor_id<>actor or job.status<>'preparing' then raise exception 'This invitation cannot be provisioned.'; end if;
  select * into entry from public.crossfire_registration_requests where id=job.request_id for update;
  if entry.status not in ('reviewed','registered') then raise exception 'This registration is no longer approved for invitation.'; end if;
  select * into account from public.crossfire_student_accounts where request_id=job.request_id;
  select * into identity from auth.users where id=account.user_id;
  if not found or lower(identity.email)<>entry.profile->>'email'
    or identity.raw_app_meta_data->>'crossfire_request_id' is distinct from entry.id::text
    then raise exception 'This Auth identity does not belong to the reviewed CrossFire request.'; end if;
  if account.provisioned_at is null then
    full_name:=entry.profile->>'student_name';
    insert into public.users(id,email,first_name,last_name,role,contact_number,whatsapp_number,institute_name,city_town,course_stream,board,food_preference,parent_consent,terms_accepted)
    values(account.user_id,identity.email,full_name,'','student',entry.profile->>'contact_number',entry.profile->>'whatsapp_number',
      entry.profile->>'institute_name',entry.profile->>'city_town',entry.profile->>'course_stream',(entry.profile->>'board')::public.school_board,
      entry.profile->>'food_preference',true,true);
    -- Only this trusted transaction can import an already-submitted request after
    -- registration closes. The trigger still applies group and capacity rules.
    perform set_config('crossfire.approving_request',entry.id::text,true);
    for event_id in select (value->>'id')::uuid from jsonb_array_elements(entry.events) order by (value->>'id')::uuid loop
      insert into public.registrations(user_id,event_id) values(account.user_id,event_id);
    end loop;
    perform set_config('crossfire.approving_request','',true);
    update public.crossfire_student_accounts set provisioned_at=now() where request_id=entry.id;
    perform public._audit('student.account.approved','student',account.user_id,null,jsonb_build_object('request_id',entry.id));
  end if;
  select jsonb_build_object('student_id','CFS-'||pass_number,'pass_id',pass_code) into result from public.users where id=account.user_id and role='student' and active;
  if result is null then raise exception 'The student account is unavailable or suspended.'; end if;
  update public.crossfire_student_invitations set status='ready',updated_at=clock_timestamp() where id=job.id;
  return result;
end $$;

create or replace function public.crossfire_invitation_send_guard(p_job_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin');
begin
  if not exists(select 1 from public.system_settings where key='student_portal_open' and value='true'::jsonb)
    or not exists(select 1 from public.crossfire_mail_settings where enabled) then raise exception 'Student invitations are currently closed.'; end if;
  update public.crossfire_student_invitations i set status='sending',updated_at=clock_timestamp()
    where i.id=p_job_id and i.actor_id=actor and i.status='ready' and i.created_at>now()-interval '5 minutes'
      and exists(select 1 from public.crossfire_registration_requests r where r.id=i.request_id and r.status in ('reviewed','registered'));
  if not found then raise exception 'The invitation is stale or already sending. Review its status.'; end if;
end $$;

create or replace function public.registrations_before_insert()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
    u       record;
    e       record;
    v_count integer;
    importing boolean;
begin
    -- Lock the student row: serialises concurrent registrations for the max-2 rule.
    select role, contact_number, whatsapp_number, institute_name, city_town, course_stream, food_preference
      into u from public.users where id = new.user_id for update;
    if not found then
        raise exception 'Profile not found. Please complete the registration form first.';
    end if;
    if u.role <> 'student' then
        raise exception 'Only student accounts can register for competitions.';
    end if;
    if u.contact_number is null or u.whatsapp_number is null or u.institute_name is null
       or u.city_town is null or u.course_stream is null or u.food_preference is null then
        raise exception 'Please complete the registration form (contact, institute, city, course and food preference) before registering for events.';
    end if;

    -- Serialize the capacity check with the participant counter update.
    select id, name, status, registration_deadline, max_participants, current_participants, event_group
      into e from public.events where id = new.event_id for update;
    if not found then
        raise exception 'Event not found.';
    end if;
    importing := public.is_admin() and exists (
      select 1 from public.crossfire_registration_requests r
      join public.crossfire_student_accounts a on a.request_id=r.id
      where r.id::text=current_setting('crossfire.approving_request',true) and r.status in ('reviewed','registered')
        and a.user_id=new.user_id and a.provisioned_at is null
        and exists(select 1 from jsonb_array_elements(r.events) item where item->>'id'=new.event_id::text));
    if (not importing and e.status <> 'open') or (importing and e.status not in ('open','registration_closed')) then
        raise exception 'Registration for % is closed.', e.name;
    end if;
    if not importing and now() > e.registration_deadline then
        raise exception 'The registration deadline for % has passed.', e.name;
    end if;
    if exists (select 1 from public.registrations where user_id = new.user_id and event_id = new.event_id) then
        raise exception 'You are already registered for %.', e.name;
    end if;

    -- Dynamic Overflow: If nominal max_participants is reached, flag as overflow for admin review
    -- without blocking the student or raising an unrecoverable exception
    if e.current_participants >= e.max_participants then
        new.is_overflow := true;
    end if;
    select count(*) into v_count
      from public.registrations r
      join public.events ev on ev.id = r.event_id
     where r.user_id = new.user_id and ev.event_group = e.event_group;
    if v_count >= 2 then
        raise exception 'A student may register for a maximum of 2 events in % only.', e.event_group;
    end if;
    return new;
end $$;

-- One transactionally consistent directory, including students without portal accounts.
create or replace function public.crossfire_student_records()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); result jsonb;
begin
  with records as (
    select 'account:'||u.id as id, a.request_id, coalesce(r.reference_code,u.pass_code) as reference,
      u.pass_code, trim(u.first_name||' '||u.last_name) as name,u.email,u.contact_number,u.whatsapp_number,
      u.institute_name,u.city_town,u.course_stream,u.board::text,u.food_preference,
      case when u.active then 'registered' else 'inactive' end as status,
      coalesce(r.created_at,u.created_at) as created_at,u.checked_in_at,u.food_redeemed_at,
      coalesce((select string_agg(e.name,', ' order by e.name) from registrations x join events e on e.id=x.event_id where x.user_id=u.id),'') as competitions,
      u.parent_consent,u.terms_accepted
    from users u left join crossfire_student_accounts a on a.user_id=u.id
      left join crossfire_registration_requests r on r.id=a.request_id where u.role='student'
    union all
    select 'request:'||r.id,r.id,r.reference_code,null,r.profile->>'student_name',r.profile->>'email',
      r.profile->>'contact_number',r.profile->>'whatsapp_number',r.profile->>'institute_name',r.profile->>'city_town',
      r.profile->>'course_stream',r.profile->>'board',r.profile->>'food_preference',
      case when r.status in ('registered','reviewed') then 'registered' else r.status end,
      r.created_at,null::timestamptz,null::timestamptz,
      (select string_agg(v->>'name',', ' order by v->>'name') from jsonb_array_elements(r.events) v),
      (r.profile->>'parent_consent')::boolean,(r.profile->>'terms_accepted')::boolean
    from crossfire_registration_requests r where not exists
      (select 1 from crossfire_student_accounts a join users u on u.id=a.user_id where a.request_id=r.id)
  ) select coalesce(jsonb_agg(to_jsonb(records) order by created_at desc,id),'[]'::jsonb) into result from records;
  return result;
end $$;
revoke all on function public.crossfire_student_records() from public,anon,authenticated;
grant execute on function public.crossfire_student_records() to authenticated;
