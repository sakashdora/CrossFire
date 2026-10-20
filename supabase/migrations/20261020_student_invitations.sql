-- Forward-only addition. No seeds, password resets or changes to shared Auth SMTP.
-- Match the already-published intake limits without truncating student identities.
alter table public.users drop constraint if exists users_first_name_check;
alter table public.users add constraint users_first_name_check check(char_length(first_name) between 1 and 120);
alter table public.users drop constraint if exists users_city_town_check;
alter table public.users add constraint users_city_town_check check(city_town is null or char_length(city_town) between 2 and 120);
create table if not exists public.crossfire_mail_settings (
  singleton boolean primary key default true check(singleton),
  sender_name text not null default 'CrossFire Administration',
  sender_email text not null default '',
  reply_to text not null default '',
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.crossfire_mail_settings(singleton) values(true) on conflict do nothing;
create table if not exists public.crossfire_student_accounts (
  request_id uuid primary key references public.crossfire_registration_requests(id),
  user_id uuid not null unique default gen_random_uuid(),
  provisioned_at timestamptz
);
create table if not exists public.crossfire_student_invitations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.crossfire_student_accounts(request_id),
  actor_id uuid not null references public.users(id),
  status text not null default 'preparing' check(status in ('preparing','ready','sending','accepted','failed','uncertain')),
  provider_id text,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crossfire_invitation_request_time on public.crossfire_student_invitations(request_id,created_at desc);
create index if not exists crossfire_invitation_rate on public.crossfire_student_invitations(actor_id,created_at);
alter table public.crossfire_mail_settings enable row level security;
alter table public.crossfire_student_accounts enable row level security;
alter table public.crossfire_student_invitations enable row level security;
revoke all on public.crossfire_mail_settings,public.crossfire_student_accounts,public.crossfire_student_invitations from public,anon,authenticated;
grant select on public.crossfire_mail_settings,public.crossfire_student_accounts,public.crossfire_student_invitations to service_role;

-- The portal switch is enforced on private queries, including existing sessions.
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path=public,pg_temp as $$
  select u.role from public.users u join auth.users a on a.id=u.id
  where u.id=auth.uid() and u.active and a.email_confirmed_at is not null
    and ((u.role='student' and exists(select 1 from public.system_settings where key='student_portal_open' and value='true'::jsonb))
      or (u.role<>'student' and coalesce(auth.jwt()->>'aal','')='aal2'))
$$;

create or replace function public.crossfire_mail_configuration(p_settings jsonb default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); result jsonb;
begin
  if p_settings is not null then
    if jsonb_typeof(p_settings)<>'object' or p_settings-array['sender_name','sender_email','reply_to','enabled']<>'{}'::jsonb
      or jsonb_typeof(p_settings->'enabled') is distinct from 'boolean'
      or jsonb_typeof(p_settings->'sender_name') is distinct from 'string'
      or jsonb_typeof(p_settings->'sender_email') is distinct from 'string'
      or jsonb_typeof(p_settings->'reply_to') is distinct from 'string'
      or char_length(btrim(p_settings->>'sender_name')) not between 2 and 100
      or p_settings->>'sender_name' ~ '[<>"[:cntrl:]]'
      or char_length(p_settings->>'sender_email')>254 or char_length(p_settings->>'reply_to')>254
      or p_settings->>'sender_email' !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      or p_settings->>'reply_to' !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      then raise exception 'Enter a valid sender name, official email and reply-to address.'; end if;
    update public.crossfire_mail_settings set sender_name=btrim(p_settings->>'sender_name'),
      sender_email=lower(p_settings->>'sender_email'),reply_to=lower(p_settings->>'reply_to'),
      enabled=(p_settings->>'enabled')::boolean,updated_at=clock_timestamp() where singleton;
    perform public._audit('mail.settings','mail_settings',actor,null,p_settings);
  end if;
  select to_jsonb(s)-'singleton' into result from public.crossfire_mail_settings s where singleton;
  return result;
end $$;

create or replace function public.crossfire_invitation_status(p_requests uuid[])
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); result jsonb;
begin
  if cardinality(p_requests)>25 then raise exception 'Request at most 25 invitation statuses.'; end if;
  select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into result from (
    select distinct on (i.request_id) i.request_id,i.status,i.failure_code,i.provider_id,i.updated_at,
      case when u.id is not null then 'CFS-'||u.pass_number end as student_id
    from public.crossfire_student_invitations i
    join public.crossfire_student_accounts a on a.request_id=i.request_id
    left join public.users u on u.id=a.user_id
    where i.request_id=any(p_requests) order by i.request_id,i.created_at desc,i.id
  ) q;
  return result;
end $$;

-- Lock each request before reserving an attempt. Unknown delivery results never
-- cause an automatic resend. An operator must reconcile them with the provider.
create or replace function public.crossfire_prepare_invitation(p_request_id uuid,p_resend boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); entry public.crossfire_registration_requests;
  settings public.crossfire_mail_settings; previous public.crossfire_student_invitations;
  account public.crossfire_student_accounts; job uuid;
begin
  perform pg_advisory_xact_lock(hashtext('crossfire_student_invitation_rate'));
  select * into entry from public.crossfire_registration_requests where id=p_request_id for update;
  if not found or entry.status<>'reviewed' then raise exception 'Review this registration before inviting the student.'; end if;
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

-- Full profile and all requested competitions commit in one transaction.
create or replace function public.crossfire_provision_student(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); job public.crossfire_student_invitations;
  entry public.crossfire_registration_requests; account public.crossfire_student_accounts;
  identity auth.users; event_id uuid; result jsonb; full_name text;
begin
  select * into job from public.crossfire_student_invitations where id=p_job_id for update;
  if not found or job.actor_id<>actor or job.status<>'preparing' then raise exception 'This invitation cannot be provisioned.'; end if;
  select * into entry from public.crossfire_registration_requests where id=job.request_id for update;
  if entry.status<>'reviewed' then raise exception 'This registration is no longer approved for invitation.'; end if;
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
      and exists(select 1 from public.crossfire_registration_requests r where r.id=i.request_id and r.status='reviewed');
  if not found then raise exception 'The invitation is stale or already sending. Review its status.'; end if;
end $$;

-- Server-only outcome recording. Provider IDs are safe to display; tokens and
-- email bodies are never stored in public profiles, audit logs or this table.
create or replace function public.crossfire_finish_invitation(p_job_id uuid,p_status text,p_provider_id text default null,p_failure_code text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_status not in ('accepted','failed','uncertain') or p_status is null
    or char_length(coalesce(p_provider_id,''))>200
    or p_failure_code is not null and p_failure_code not in ('account_conflict','account_setup','link_setup','provider_rejected','delivery_unknown','access_changed')
    then raise exception 'Invalid invitation outcome.'; end if;
  update public.crossfire_student_invitations set status=p_status,provider_id=p_provider_id,failure_code=p_failure_code,updated_at=clock_timestamp()
    where id=p_job_id and status in ('preparing','ready','sending');
  if not found then raise exception 'Invitation outcome is already recorded.'; end if;
end $$;

-- Approved accounts are managed through participant operations. A later review
-- edit must not silently revoke or duplicate their event entries.
create or replace function public.crossfire_protect_approved_request()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if (new.profile is distinct from old.profile or new.events is distinct from old.events or new.status is distinct from old.status)
    and exists(select 1 from public.crossfire_student_accounts a where a.request_id=old.id and
      (a.provisioned_at is not null or exists(select 1 from public.crossfire_student_invitations i where i.request_id=old.id and i.status in ('preparing','ready','sending','uncertain'))))
    then raise exception 'An invitation or approved account exists. Manage the student account and event entries before changing this request.'; end if;
  return new;
end $$;
drop trigger if exists crossfire_protect_approved_request on public.crossfire_registration_requests;
create trigger crossfire_protect_approved_request before update on public.crossfire_registration_requests for each row execute function public.crossfire_protect_approved_request();

revoke all on function public.crossfire_mail_configuration(jsonb),public.crossfire_invitation_status(uuid[]),public.crossfire_prepare_invitation(uuid,boolean),
  public.crossfire_provision_student(uuid),public.crossfire_invitation_send_guard(uuid),public.crossfire_finish_invitation(uuid,text,text,text),public.crossfire_protect_approved_request() from public,anon,authenticated;
grant execute on function public.crossfire_mail_configuration(jsonb),public.crossfire_invitation_status(uuid[]),public.crossfire_prepare_invitation(uuid,boolean),
  public.crossfire_provision_student(uuid),public.crossfire_invitation_send_guard(uuid) to authenticated;
grant execute on function public.crossfire_finish_invitation(uuid,text,text,text) to service_role;

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
      where r.id::text=current_setting('crossfire.approving_request',true) and r.status='reviewed'
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
