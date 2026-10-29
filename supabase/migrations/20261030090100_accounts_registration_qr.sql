-- Forward-only. Requires 20261030090000_vip_guest_role.sql to be committed first.
-- 1. Student registration creates one complete login account, profile, entries and pass.
-- 2. Registration open/closed is separate from sign-in; existing students keep access.
-- 3. Provisioned staff, judge and VIP logins must replace their initial password.
-- 4. QR scans resolve one pass server-side; a check-in ledger rejects duplicates.
-- No records are deleted, except legacy plaintext volunteer passwords that no login uses.

-- ---------------------------------------------------------------------------
-- Settings: registration window
-- ---------------------------------------------------------------------------
-- Preserve today's behaviour: registration is currently accepted.
insert into public.system_settings(key,value,description)
  values('student_registration_open','true'::jsonb,'New student registrations are accepted only while true. Sign-in is unaffected.')
  on conflict(key) do nothing;
drop policy if exists system_settings_select on public.system_settings;
create policy system_settings_select on public.system_settings for select to anon,authenticated
  using(key in ('student_portal_open','student_registration_open'));
create or replace function public.get_system_setting(p_key text)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  select value from public.system_settings where key=p_key and key in ('student_portal_open','student_registration_open')
$$;
create or replace function public._registration_open()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select coalesce((select value='true'::jsonb from public.system_settings where key='student_registration_open'),false)
$$;
create or replace function public.admin_set_system_setting(p_key text,p_value jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid := public._require_role('super_admin');
begin
  if p_key not in ('student_portal_open','student_registration_open') or jsonb_typeof(p_value)<>'boolean' then raise exception 'Unknown or invalid system setting.'; end if;
  insert into public.system_settings(key,value,updated_by) values(p_key,p_value,v_uid) on conflict(key) do update set value=excluded.value,updated_by=v_uid,updated_at=now();
  perform public._audit(case when p_key='student_registration_open' then 'settings.registration' else 'settings.portal' end,'setting',gen_random_uuid(),null,jsonb_build_object('key',p_key,'open',p_value));
end $$;

-- ---------------------------------------------------------------------------
-- Columns and private tables
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists must_change_password boolean not null default false;
alter table public.guests add column if not exists user_id uuid references public.users(id) on delete set null;
create unique index if not exists guests_user_unique on public.guests(user_id) where user_id is not null;
-- The retired volunteer login stored plaintext passwords. Nothing reads them.
update public.volunteers set password=null where password is not null;
-- Auth already requires unique emails; keep profiles consistent with it.
do $$ begin
  if not exists(select 1 from public.users group by lower(email) having count(*)>1) then
    create unique index if not exists users_email_lower_unique on public.users(lower(email));
  else
    raise warning 'users_email_lower_unique was not created because duplicate profile emails exist. Resolve them, then create the index.';
  end if;
end $$;

alter table public.crossfire_registration_requests drop constraint if exists crossfire_registration_requests_status_check;
alter table public.crossfire_registration_requests add constraint crossfire_registration_requests_status_check
  check(status in ('pending','reviewed','declined','registered','registering','superseded'));

-- A digest of the provisioned password hash. The initial password is never stored.
create table if not exists public.crossfire_temporary_passwords(
  user_id uuid primary key references public.users(id) on delete cascade,
  hash_digest text not null,
  created_at timestamptz not null default now()
);
-- One gate check-in and one meal per student, one attendance per event entry.
create table if not exists public.crossfire_checkins(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  kind text not null check(kind in ('gate','meal','room')),
  operator_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  undone_at timestamptz,
  undone_by uuid references public.users(id) on delete set null,
  constraint crossfire_checkins_room_entry check((kind='room')=(registration_id is not null))
);
create unique index if not exists crossfire_checkins_once on public.crossfire_checkins(student_id,kind) where undone_at is null and kind in ('gate','meal');
create unique index if not exists crossfire_checkins_room_once on public.crossfire_checkins(registration_id) where undone_at is null and kind='room';
create index if not exists crossfire_checkins_created on public.crossfire_checkins(created_at desc);
-- Replaced pass IDs are reported as revoked instead of unknown.
create table if not exists public.crossfire_revoked_passes(
  pass_code text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  revoked_at timestamptz not null default now(),
  revoked_by uuid references public.users(id) on delete set null
);
alter table public.crossfire_temporary_passwords enable row level security;
alter table public.crossfire_checkins enable row level security;
alter table public.crossfire_revoked_passes enable row level security;
revoke all on public.crossfire_temporary_passwords,public.crossfire_checkins,public.crossfire_revoked_passes from public,anon,authenticated;

-- Backfill the ledger from existing timestamps. The operator was not recorded before.
insert into public.crossfire_checkins(student_id,kind,created_at)
  select u.id,'gate',u.checked_in_at from public.users u where u.role='student' and u.checked_in_at is not null
    and not exists(select 1 from public.crossfire_checkins c where c.student_id=u.id and c.kind='gate' and c.undone_at is null);
insert into public.crossfire_checkins(student_id,kind,created_at)
  select u.id,'meal',u.food_redeemed_at from public.users u where u.role='student' and u.food_redeemed_at is not null
    and not exists(select 1 from public.crossfire_checkins c where c.student_id=u.id and c.kind='meal' and c.undone_at is null);
insert into public.crossfire_checkins(student_id,registration_id,event_id,kind,created_at)
  select r.user_id,r.id,r.event_id,'room',r.room_reported_at from public.registrations r where r.room_reported_at is not null
    and not exists(select 1 from public.crossfire_checkins c where c.registration_id=r.id and c.undone_at is null);

do $$ declare table_name text; begin
  foreach table_name in array array['crossfire_checkins','crossfire_revoked_passes'] loop
    execute format('drop trigger if exists crossfire_live_bump on public.%I',table_name);
    execute format('create trigger crossfire_live_bump after insert or update or delete on public.%I for each statement execute function public.crossfire_live_bump()',table_name);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Identity and sessions
-- ---------------------------------------------------------------------------
-- Students sign in whether or not registration is open. A pending forced password
-- change blocks every data path until the user chooses their own password.
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path=public,pg_temp as $$
  select u.role from public.users u join auth.users a on a.id=u.id
  where u.id=auth.uid() and u.active and a.email_confirmed_at is not null and not u.must_change_password
    and (u.role<>'super_admin' or coalesce(auth.jwt()->>'aal','')='aal2')
$$;

-- Explicit fields only. The pass belongs to students; staff receive none.
create or replace function public.crossfire_current_profile()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
  select jsonb_build_object('id',u.id,'email',u.email,'first_name',u.first_name,'last_name',u.last_name,
    'contact_number',coalesce(u.contact_number,''),'whatsapp_number',coalesce(u.whatsapp_number,''),
    'institute_name',coalesce(u.institute_name,''),'city_town',coalesce(u.city_town,''),'course_stream',u.course_stream,
    'board',u.board,'food_preference',u.food_preference,'role',u.role,'active',u.active,
    'must_change_password',u.must_change_password,'parent_consent',u.parent_consent,'terms_accepted',u.terms_accepted,
    'created_at',u.created_at,
    'pass_code',case when u.role='student' then u.pass_code end,
    'student_id',case when u.role='student' then 'CFS-'||u.pass_number end,
    'checked_in_at',case when u.role='student' then u.checked_in_at end,
    'food_redeemed_at',case when u.role='student' then u.food_redeemed_at end,
    'selected_competitions',coalesce((select jsonb_agg(e.name order by e.name) from public.registrations r join public.events e on e.id=r.event_id
      where r.user_id=u.id and r.status in ('registered','confirmed')),'[]'::jsonb)) into result
  from public.users u join auth.users a on a.id=u.id where u.id=auth.uid() and u.active and a.email_confirmed_at is not null;
  if result is null then raise exception 'Account access is unavailable.'; end if;
  return result;
end $$;

create or replace function public._crossfire_password_digest(p_user uuid)
returns text language sql stable security definer set search_path=public,pg_temp as $$
  select encode(sha256(convert_to(coalesce(encrypted_password,''),'UTF8')),'hex') from auth.users where id=p_user
$$;

-- Succeeds only after Auth holds a different password than the provisioned one.
create or replace function public.crossfire_complete_password_change()
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); stored text;
begin
  if uid is null then raise exception 'Please sign in to continue.'; end if;
  if not exists(select 1 from public.users where id=uid and active and must_change_password) then return; end if;
  select hash_digest into stored from public.crossfire_temporary_passwords where user_id=uid;
  if stored is null or stored=public._crossfire_password_digest(uid) then raise exception 'Choose a new password before continuing.'; end if;
  update public.users set must_change_password=false where id=uid;
  delete from public.crossfire_temporary_passwords where user_id=uid;
  perform public._audit('account.password_changed','staff',uid,null,null);
end $$;

-- Ends refresh sessions after deactivation or a role change. Database checks
-- already apply the new state on the next request with any outstanding JWT.
create or replace function public._crossfire_revoke_sessions(p_user uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if to_regclass('auth.sessions') is null then return false; end if;
  execute 'delete from auth.sessions where user_id=$1' using p_user;
  return true;
exception when insufficient_privilege then return false;
end $$;

-- Only role-scoped RPCs expose other people's records. Volunteers no longer read
-- student profiles or entries through REST.
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated using(id=auth.uid() or public.is_admin());
drop policy if exists registrations_select on public.registrations;
create policy registrations_select on public.registrations for select to authenticated using(user_id=auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Provisioned accounts (volunteer, judge, VIP guest, admin, super admin)
-- ---------------------------------------------------------------------------
create or replace function public.crossfire_ops_provision(p_data jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid := public._require_role('admin','super_admin'); v_id uuid := (p_data->>'id')::uuid; v_role text := p_data->>'role';
  v_email text; v_guest public.guests;
begin
  if coalesce(v_role,'') not in ('volunteer','judge','vip_guest','admin','super_admin') or (not public.is_super_admin() and v_role not in ('volunteer','judge','vip_guest')) then raise exception 'You cannot create this account role.'; end if;
  if char_length(btrim(coalesce(p_data->>'name',''))) not between 2 and 100 then raise exception 'Enter a name (2–100 characters).'; end if;
  if coalesce(p_data->>'contact_number','') !~ '^\+?[0-9]{10,13}$' then raise exception 'Enter a valid contact number.'; end if;
  select email into v_email from auth.users where id=v_id and raw_app_meta_data->>'crossfire_provisioned_by'=v_uid::text;
  if not found then raise exception 'Auth account not found.'; end if;
  if exists(select 1 from public.users where id=v_id) then raise exception 'This profile already exists. Manage its access instead.'; end if;
  if v_role='vip_guest' then
    select * into v_guest from public.guests where id=nullif(p_data->>'guest_id','')::uuid for update;
    if not found or v_guest.archived_at is not null then raise exception 'Choose an active invited guest for this VIP login.'; end if;
    if v_guest.category='Judge' then raise exception 'Invited judges use a judge login for scoring.'; end if;
    if v_guest.user_id is not null then raise exception 'This guest already has a login.'; end if;
  end if;
  insert into public.users(id,email,first_name,last_name,contact_number,role,active,must_change_password)
    values(v_id,lower(v_email),btrim(p_data->>'name'),'',p_data->>'contact_number',v_role::public.user_role,true,true);
  insert into public.crossfire_temporary_passwords(user_id,hash_digest) values(v_id,public._crossfire_password_digest(v_id));
  if v_role='volunteer' then
    insert into public.volunteers(user_id,volunteer_id,name,contact_number,email,password,attendance_status,kit_issued,ops_station) values(v_id,'VOL-'||upper(substr(replace(v_id::text,'-',''),1,10)),btrim(p_data->>'name'),p_data->>'contact_number',v_email,null,'Assigned',false,'support');
  elsif v_role='vip_guest' then
    update public.guests set user_id=v_id where id=v_guest.id;
  end if;
  perform public._audit('staff.created','staff',v_id,null,jsonb_build_object('role',v_role,'guest_id',v_guest.id));
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Student registration: begin (reserve) → Auth account → complete, all retry-safe
-- ---------------------------------------------------------------------------
create or replace function public._crossfire_clean_registration(p_profile jsonb)
returns jsonb language plpgsql immutable set search_path=public,pg_temp as $$
declare clean jsonb; field text; choices text[];
begin
  if p_profile is null or jsonb_typeof(p_profile)<>'object' or octet_length(p_profile::text)>8192 then raise exception 'Invalid registration data.'; end if;
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
  if char_length(clean->>'student_name') not between 2 and 120 then raise exception 'Enter the student name (2–120 characters).'; end if;
  if char_length(clean->>'email')>254 or clean->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
  if clean->>'contact_number' !~ '^[0-9]{10,13}$' or clean->>'whatsapp_number' !~ '^[0-9]{10,13}$' then raise exception 'Enter contact and WhatsApp numbers with 10–13 digits.'; end if;
  if char_length(clean->>'institute_name') not between 2 and 200 or char_length(clean->>'city_town') not between 2 and 120 then raise exception 'Enter the institute name and city / town.'; end if;
  if clean->>'course_stream' not in ('12th Science','12th Commerce','12th Arts') or clean->>'board' not in ('CBSE','ICSE','CHSE') or clean->>'food_preference' not in ('Veg','Non-veg') then
    raise exception 'Choose a valid course stream, board and meal preference.';
  end if;
  if jsonb_typeof(p_profile->'selected_competitions') is distinct from 'array'
    or jsonb_array_length(p_profile->'selected_competitions') not between 1 and 4
    or exists(select 1 from jsonb_array_elements(p_profile->'selected_competitions') v where jsonb_typeof(v)<>'string') then raise exception 'Select between 1 and 4 competitions.'; end if;
  choices:=array(select distinct btrim(value) from jsonb_array_elements_text(p_profile->'selected_competitions') order by btrim(value));
  if cardinality(choices)<>jsonb_array_length(p_profile->'selected_competitions') then raise exception 'Select each competition only once.'; end if;
  return clean||jsonb_build_object('selected_competitions',to_jsonb(choices),'parent_consent',true,'terms_accepted',true);
end $$;

create or replace function public._crossfire_student_receipt(p_user uuid)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('student_id','CFS-'||u.pass_number,'pass_id',u.pass_code,'reference_code',coalesce(r.reference_code,''),
    'name',trim(u.first_name||' '||u.last_name),'email',u.email,'contact_number',u.contact_number,'whatsapp_number',u.whatsapp_number,
    'institute_name',u.institute_name,'city_town',u.city_town,'course_stream',u.course_stream,'board',u.board,'food_preference',u.food_preference,
    'competitions',coalesce((select jsonb_agg(e.name order by e.name) from public.registrations x join public.events e on e.id=x.event_id where x.user_id=u.id),'[]'::jsonb),
    'registered_at',u.created_at)
  from public.users u left join public.crossfire_student_accounts a on a.user_id=u.id
    left join public.crossfire_registration_requests r on r.id=a.request_id
  where u.id=p_user and u.role='student'
$$;

-- Server-only (register-student Edge function). Validates, checks the window,
-- duplicate email and rate limits, then reserves one Auth user ID per request.
create or replace function public.crossfire_begin_student_registration(p_request_id uuid,p_profile jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare clean jsonb; choices text[]; selected_events jsonb; found_count integer;
  previous public.crossfire_registration_requests; account public.crossfire_student_accounts; stale uuid[];
begin
  if p_request_id is null then raise exception 'Invalid registration data.'; end if;
  clean:=public._crossfire_clean_registration(p_profile);
  choices:=array(select jsonb_array_elements_text(clean->'selected_competitions'));
  -- Serialises intake, duplicate-email checks and retries across all callers.
  perform pg_advisory_xact_lock(hashtext('crossfire_registration_intake'));
  select * into previous from public.crossfire_registration_requests where id=p_request_id for update;
  if found then
    if previous.profile<>clean then raise exception 'This submission reference was already used. Start a new submission.'; end if;
    if previous.status not in ('registering','registered') then raise exception 'This registration cannot be completed online. Contact the organisers.'; end if;
    select * into account from public.crossfire_student_accounts where request_id=p_request_id;
    return jsonb_build_object('request_id',p_request_id,'user_id',account.user_id,'email',clean->>'email','status',previous.status,'stale_user_ids','[]'::jsonb);
  end if;
  if not public._registration_open() then raise exception 'Student registration is closed. Students who already registered can still sign in.'; end if;
  -- An unfinished reservation older than 15 minutes, with no profile, is released.
  select array_agg(a.user_id) into stale from public.crossfire_registration_requests r join public.crossfire_student_accounts a on a.request_id=r.id
    where r.profile->>'email'=clean->>'email' and r.status='registering' and r.created_at<now()-interval '15 minutes'
      and not exists(select 1 from public.users u where u.id=a.user_id);
  if stale is not null then
    delete from public.crossfire_student_accounts a using public.crossfire_registration_requests r
      where a.request_id=r.id and a.user_id=any(stale);
    delete from public.crossfire_registration_requests r where r.profile->>'email'=clean->>'email' and r.status='registering'
      and not exists(select 1 from public.crossfire_student_accounts a where a.request_id=r.id);
  end if;
  if exists(select 1 from public.users where lower(email)=clean->>'email')
    or exists(select 1 from public.crossfire_registration_requests r join public.crossfire_student_accounts a on a.request_id=r.id
      where r.profile->>'email'=clean->>'email' and r.status<>'declined') then
    raise exception 'This email is already registered. Sign in with your password, or ask the organisers for a password reset link.';
  end if;
  if (select count(*) from public.crossfire_registration_requests where profile->>'email'=clean->>'email' and created_at>now()-interval '24 hours')>=3
    or (select count(*) from public.crossfire_registration_requests where profile->>'contact_number'=clean->>'contact_number' and created_at>now()-interval '24 hours')>=5
    or (select count(*) from public.crossfire_registration_requests where created_at>now()-interval '1 hour')>=1000 then
    raise exception 'Submission limit reached. Please try later or contact the college organisers.';
  end if;
  perform 1 from public.events where name=any(choices) order by id for share;
  select count(*),jsonb_agg(jsonb_build_object('id',id,'name',name,'group',event_group) order by name)
    into found_count,selected_events from public.events where name=any(choices);
  if found_count<>cardinality(choices) then raise exception 'One or more competitions are unavailable.'; end if;
  if exists(select 1 from public.events where name=any(choices) and (status<>'open' or registration_deadline<now())) then raise exception 'Registration for a selected competition is closed.'; end if;
  if exists(select 1 from public.events where name=any(choices) group by event_group having count(*)>2) then raise exception 'Choose no more than 2 competitions from each group.'; end if;
  insert into public.crossfire_registration_requests(id,profile,events,status) values(p_request_id,clean,selected_events,'registering');
  insert into public.crossfire_student_accounts(request_id) values(p_request_id) returning * into account;
  return jsonb_build_object('request_id',p_request_id,'user_id',account.user_id,'email',clean->>'email','status','registering','stale_user_ids',coalesce(to_jsonb(stale),'[]'::jsonb));
end $$;

-- Server-only. Profile, every event entry and the pass commit together, or nothing does.
create or replace function public.crossfire_complete_student_registration(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare entry public.crossfire_registration_requests; account public.crossfire_student_accounts; identity auth.users; event_id uuid;
begin
  select * into entry from public.crossfire_registration_requests where id=p_request_id for update;
  if not found then raise exception 'Registration not found. Submit the form again.'; end if;
  select * into account from public.crossfire_student_accounts where request_id=p_request_id for update;
  if not found then raise exception 'Registration not found. Submit the form again.'; end if;
  if entry.status='registered' and account.provisioned_at is not null then return public._crossfire_student_receipt(account.user_id); end if;
  if entry.status<>'registering' then raise exception 'This registration cannot be completed online. Contact the organisers.'; end if;
  select * into identity from auth.users where id=account.user_id;
  if not found or lower(identity.email)<>entry.profile->>'email' or identity.raw_app_meta_data->>'crossfire_request_id' is distinct from entry.id::text then
    raise exception 'The login account for this registration could not be verified.';
  end if;
  if exists(select 1 from public.users where lower(email)=entry.profile->>'email') then
    raise exception 'This email is already registered. Sign in with your password, or ask the organisers for a password reset link.';
  end if;
  insert into public.users(id,email,first_name,last_name,role,contact_number,whatsapp_number,institute_name,city_town,course_stream,board,food_preference,parent_consent,terms_accepted)
    values(account.user_id,lower(identity.email),entry.profile->>'student_name','','student',entry.profile->>'contact_number',entry.profile->>'whatsapp_number',
      entry.profile->>'institute_name',entry.profile->>'city_town',entry.profile->>'course_stream',(entry.profile->>'board')::public.school_board,
      entry.profile->>'food_preference',true,true);
  -- The registration trigger re-checks the window, deadlines and group limits.
  for event_id in select (value->>'id')::uuid from jsonb_array_elements(entry.events) order by (value->>'id')::uuid loop
    insert into public.registrations(user_id,event_id) values(account.user_id,event_id);
  end loop;
  -- Status first: the approved-request guard locks a request once provisioned.
  update public.crossfire_registration_requests set status='registered',updated_at=clock_timestamp() where id=entry.id;
  update public.crossfire_student_accounts set provisioned_at=now() where request_id=entry.id;
  -- Earlier account-less submissions with this email are now represented by the account.
  update public.crossfire_registration_requests r set status='superseded',review_notes=left('Superseded by account registration '||entry.reference_code||'. '||r.review_notes,2000),updated_at=clock_timestamp()
    where r.profile->>'email'=entry.profile->>'email' and r.id<>entry.id and r.status in ('pending','reviewed','registered')
      and not exists(select 1 from public.crossfire_student_accounts a where a.request_id=r.id);
  perform public._audit('student.registered','student',account.user_id,null,jsonb_build_object('request_id',entry.id,'reference',entry.reference_code));
  return public._crossfire_student_receipt(account.user_id);
end $$;

-- Server-only compensation after a definite Auth or completion failure.
create or replace function public.crossfire_abandon_student_registration(p_request_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  delete from public.crossfire_student_accounts a using public.crossfire_registration_requests r
    where a.request_id=p_request_id and r.id=a.request_id and r.status='registering' and not exists(select 1 from public.users u where u.id=a.user_id);
  delete from public.crossfire_registration_requests r where r.id=p_request_id and r.status='registering'
    and not exists(select 1 from public.crossfire_student_accounts a where a.request_id=r.id);
end $$;

-- The registration window applies to every new event entry except an admin
-- importing an already-submitted request through the invitation workflow.
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
    if not importing and not public._registration_open() then
        raise exception 'Student registration is closed.';
    end if;
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

-- One directory row per student. Unfinished reservations and superseded
-- submissions are not shown as separate students.
create or replace function public.crossfire_student_records()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); result jsonb;
begin
  with records as (
    select 'account:'||u.id as id, a.request_id, coalesce(r.reference_code,u.pass_code) as reference,
      u.pass_code, 'CFS-'||u.pass_number as student_id, trim(u.first_name||' '||u.last_name) as name,u.email,u.contact_number,u.whatsapp_number,
      u.institute_name,u.city_town,u.course_stream,u.board::text,u.food_preference,
      case when u.active then 'registered' else 'inactive' end as status, true as has_login,
      coalesce(r.created_at,u.created_at) as created_at,u.checked_in_at,u.food_redeemed_at,
      coalesce((select string_agg(e.name,', ' order by e.name) from registrations x join events e on e.id=x.event_id where x.user_id=u.id),'') as competitions,
      u.parent_consent,u.terms_accepted
    from users u left join crossfire_student_accounts a on a.user_id=u.id
      left join crossfire_registration_requests r on r.id=a.request_id where u.role='student'
    union all
    select 'request:'||r.id,r.id,r.reference_code,null,null,r.profile->>'student_name',r.profile->>'email',
      r.profile->>'contact_number',r.profile->>'whatsapp_number',r.profile->>'institute_name',r.profile->>'city_town',
      r.profile->>'course_stream',r.profile->>'board',r.profile->>'food_preference',
      case when r.status in ('registered','reviewed','pending') then 'registered' else r.status end,false,
      r.created_at,null::timestamptz,null::timestamptz,
      (select string_agg(v->>'name',', ' order by v->>'name') from jsonb_array_elements(r.events) v),
      (r.profile->>'parent_consent')::boolean,(r.profile->>'terms_accepted')::boolean
    from crossfire_registration_requests r where r.status not in ('registering','superseded') and not exists
      (select 1 from crossfire_student_accounts a join users u on u.id=a.user_id where a.request_id=r.id)
  ) select coalesce(jsonb_agg(to_jsonb(records) order by created_at desc,id),'[]'::jsonb) into result from records;
  return result;
end $$;

-- Invitations now double as password recovery links for existing student accounts,
-- so they no longer depend on the retired student-portal switch.
create or replace function public.crossfire_prepare_invitation(p_request_id uuid,p_resend boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); entry public.crossfire_registration_requests;
  settings public.crossfire_mail_settings; previous public.crossfire_student_invitations;
  account public.crossfire_student_accounts; job uuid;
begin
  perform pg_advisory_xact_lock(hashtext('crossfire_student_invitation_rate'));
  select * into entry from public.crossfire_registration_requests where id=p_request_id for update;
  if not found or entry.status not in ('reviewed','registered') then raise exception 'This registration is not eligible for a portal invitation.'; end if;
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

create or replace function public.crossfire_invitation_send_guard(p_job_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin');
begin
  if not exists(select 1 from public.crossfire_mail_settings where enabled) then raise exception 'Student invitations are currently closed.'; end if;
  update public.crossfire_student_invitations i set status='sending',updated_at=clock_timestamp()
    where i.id=p_job_id and i.actor_id=actor and i.status='ready' and i.created_at>now()-interval '5 minutes'
      and exists(select 1 from public.crossfire_registration_requests r where r.id=i.request_id and r.status in ('reviewed','registered'));
  if not found then raise exception 'The invitation is stale or already sending. Review its status.'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- QR passes and check-in
-- ---------------------------------------------------------------------------
-- Minimal participant view. Contact details and operator names are admin-only.
create or replace function public._ops_student_json(p_student uuid,p_admin boolean,p_event uuid)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object('id',u.id,'pass_id',u.pass_code,'name',trim(u.first_name||' '||u.last_name),'institute',coalesce(u.institute_name,''),
    'contact_number',case when p_admin then coalesce(u.contact_number,'') else '' end,'food_preference',coalesce(u.food_preference,''),'active',u.active,
    'checked_in_at',u.checked_in_at,'food_redeemed_at',u.food_redeemed_at,
    'checked_in_by',case when p_admin then (select nullif(trim(o.first_name||' '||o.last_name),'') from public.crossfire_checkins c join public.users o on o.id=c.operator_id
      where c.student_id=u.id and c.kind='gate' and c.undone_at is null) end,
    'registrations',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'event_id',r.event_id,'name',e.name,'status',r.status,'room_reported_at',r.room_reported_at) order by e.name)
      from public.registrations r join public.events e on e.id=r.event_id where r.user_id=u.id and (p_admin or p_event is null or r.event_id=p_event)),'[]'::jsonb))
  from public.users u where u.id=p_student and u.role='student'
$$;

-- A QR code is a lookup key only. The operator's role, duty and the pass state
-- are checked here; the scanned value grants nothing on its own.
create or replace function public.crossfire_ops_lookup_pass(p_code text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_uid uuid := public._require_role('admin','super_admin','volunteer'); v_admin boolean := public.is_admin();
  v_code text := upper(btrim(coalesce(p_code,''))); u public.users; v_event uuid;
begin
  if v_code !~ '^CF26-[0-9A-F]{32}$' then raise exception 'This is not a valid CrossFire student pass.'; end if;
  if not v_admin then
    if not (public._ops_has_duty('gate') or public._ops_has_duty('food')) then
      select ops_event_id into v_event from public.volunteers where user_id=v_uid and ops_station='event' and attendance_status='Present / On Duty';
      if v_event is null then raise exception 'Go on duty at the gate, meal counter or an event room before scanning student passes.'; end if;
    end if;
  end if;
  select * into u from public.users where pass_code=v_code and role='student';
  if not found then
    if exists(select 1 from public.crossfire_revoked_passes where pass_code=v_code) then
      raise exception 'This pass was replaced and is no longer valid. Ask the student to open their current pass in the portal.';
    end if;
    raise exception 'Unknown pass. No student is registered with this pass ID.';
  end if;
  if not u.active then raise exception 'This pass is suspended. Send the student to the help desk.'; end if;
  if v_event is not null and not exists(select 1 from public.registrations where user_id=u.id and event_id=v_event and status in ('registered','confirmed')) then
    raise exception 'This participant is not registered for your assigned event.';
  end if;
  return public._ops_student_json(u.id,v_admin,v_event);
end $$;

create or replace function public.staff_set_check_in(p_user_id uuid, p_checked_in boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('volunteer','admin'); u public.users; v_new timestamptz;
begin
  if not public._ops_has_duty('gate') then raise exception 'Check-in is available to on-duty gate volunteers and admins.'; end if;
  if not p_checked_in and not public.is_admin() then raise exception 'Only an admin can undo check-in.'; end if;
  -- The row lock serialises simultaneous scans; the ledger index is the backstop.
  select * into u from public.users where id = p_user_id and role = 'student' for update;
  if not found then raise exception 'Student not found.'; end if;
  if p_checked_in then
    if not u.active then raise exception 'This pass is suspended. Send the student to the help desk.'; end if;
    if u.checked_in_at is not null then raise exception 'Already checked in. This pass was scanned at the gate earlier.'; end if;
    if not exists(select 1 from public.registrations where user_id=p_user_id and status in ('registered','confirmed')) then raise exception 'This student has no active event registration.'; end if;
    v_new := now();
    insert into public.crossfire_checkins(student_id,kind,operator_id) values(p_user_id,'gate',v_uid);
  else
    if u.checked_in_at is null then return null; end if;
    if u.food_redeemed_at is not null then raise exception 'A redeemed meal prevents check-in reversal.'; end if;
    update public.crossfire_checkins set undone_at=now(),undone_by=v_uid where student_id=p_user_id and kind='gate' and undone_at is null;
  end if;
  update public.users set checked_in_at=v_new where id=p_user_id;
  perform public._audit('student.checkin','student',p_user_id,jsonb_build_object('at',u.checked_in_at),jsonb_build_object('at',v_new));
  return v_new;
exception when unique_violation then raise exception 'Already checked in. This pass was scanned at the gate earlier.';
end $$;

create or replace function public.staff_set_food_redeemed(p_user_id uuid, p_redeemed boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('volunteer','admin'); u public.users; v_new timestamptz;
begin
  if not public._ops_has_duty('food') then raise exception 'Meals are available to on-duty meal volunteers and admins.'; end if;
  if not p_redeemed and not public.is_admin() then raise exception 'Only an admin can reverse a meal redemption.'; end if;
  select * into u from public.users where id=p_user_id and role='student' for update;
  if not found then raise exception 'Student not found.'; end if;
  if p_redeemed then
    if not u.active then raise exception 'This pass is suspended. Send the student to the help desk.'; end if;
    if u.checked_in_at is null then raise exception 'Check in the student before issuing a meal.'; end if;
    if u.food_redeemed_at is not null then raise exception 'This meal has already been redeemed.'; end if;
    v_new := now();
    insert into public.crossfire_checkins(student_id,kind,operator_id) values(p_user_id,'meal',v_uid);
  else
    update public.crossfire_checkins set undone_at=now(),undone_by=v_uid where student_id=p_user_id and kind='meal' and undone_at is null;
  end if;
  update public.users set food_redeemed_at=v_new where id=p_user_id;
  perform public._audit('student.meal','student',p_user_id,jsonb_build_object('at',u.food_redeemed_at),jsonb_build_object('at',v_new));
  return v_new;
exception when unique_violation then raise exception 'This meal has already been redeemed.';
end $$;

create or replace function public.staff_set_room_reported(p_registration_id uuid, p_reported boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('volunteer','admin'); r public.registrations; v_new timestamptz;
begin
  select * into r from public.registrations where id=p_registration_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  if not public._ops_has_duty('event',r.event_id) then raise exception 'You are not assigned to this event room.'; end if;
  if not p_reported and not public.is_admin() then raise exception 'Only an admin can clear event attendance.'; end if;
  if p_reported then
    if r.status not in ('registered','confirmed') then raise exception 'This registration is not active.'; end if;
    if not exists(select 1 from public.users where id=r.user_id and active and checked_in_at is not null) then raise exception 'Check in the student at the gate first.'; end if;
    if r.room_reported_at is not null then raise exception 'Attendance for this event was already recorded.'; end if;
    v_new := now();
    insert into public.crossfire_checkins(student_id,registration_id,event_id,kind,operator_id) values(r.user_id,r.id,r.event_id,'room',v_uid);
  else
    update public.crossfire_checkins set undone_at=now(),undone_by=v_uid where registration_id=r.id and undone_at is null;
  end if;
  update public.registrations set room_reported_at=v_new where id=r.id;
  perform public._audit('student.room','registration',r.id,jsonb_build_object('at',r.room_reported_at),jsonb_build_object('at',v_new));
  return v_new;
exception when unique_violation then raise exception 'Attendance for this event was already recorded.';
end $$;

-- ---------------------------------------------------------------------------
-- Operations snapshot and actions
-- ---------------------------------------------------------------------------
create or replace function public.crossfire_ops_snapshot()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := public._require_role('admin','super_admin','volunteer'); v_admin boolean := public.is_admin(); v_actor jsonb; v_event uuid;
begin
  select jsonb_build_object('id',id,'name',trim(first_name||' '||last_name),'role',role) into v_actor from public.users where id=v_uid;
  -- Gate and meal desks look up one scanned pass at a time. Only an on-duty
  -- event-room volunteer receives a roster: the participants of that room.
  if not v_admin then
    select ops_event_id into v_event from public.volunteers where user_id=v_uid and ops_station='event' and attendance_status='Present / On Duty';
  end if;
  return jsonb_build_object(
    'actor',v_actor,'fetched_at',now(),
    'students',coalesce((select jsonb_agg(public._ops_student_json(u.id,v_admin,v_event) order by u.created_at desc) from public.users u
      where u.role='student' and (v_admin or (v_event is not null and u.active and exists(select 1 from public.registrations r where r.user_id=u.id and r.event_id=v_event)))),'[]'::jsonb),
    'guests',coalesce((select jsonb_agg(to_jsonb(g) - case when v_admin then array[]::text[] else array['email','user_id'] end order by g.created_at desc) from public.guests g where g.archived_at is null and
      (v_admin or (public._ops_has_duty('guest') and (g.escort_volunteer_id is null or exists(select 1 from public.volunteers v where v.id=g.escort_volunteer_id and v.user_id=v_uid))))),'[]'::jsonb),
    'volunteers',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'user_id',v.user_id,'volunteer_id',v.volunteer_id,'name',v.name,'email',v.email,
      'station',v.ops_station,'event_id',v.ops_event_id,'shift',v.shift,'attendance_status',v.attendance_status,'kit_issued',v.kit_issued,'walkie_channel',coalesce(v.walkie_channel,''),'notes',coalesce(v.notes,''),'updated_at',v.updated_at) order by v.name)
      from public.volunteers v where v_admin or v.user_id=v_uid),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'slug',e.slug,'venue',e.venue_location,'status',e.status,'capacity',e.max_participants,
      'registered',(select count(*) from public.registrations r where r.event_id=e.id and r.status in ('registered','confirmed')),'start_time',e.start_time,
      'judges',case when v_admin then coalesce((select jsonb_agg(j.judge_id) from public.judge_assignments j where j.event_id=e.id),'[]'::jsonb) else '[]'::jsonb end) order by e.start_time)
      from public.events e where v_admin or e.status<>'draft'),'[]'::jsonb),
    'staff',case when v_admin then coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',trim(u.first_name||' '||u.last_name),'email',u.email,'contact_number',coalesce(u.contact_number,''),
      'role',u.role,'active',u.active,'must_change_password',u.must_change_password,'guest_id',(select g.id from public.guests g where g.user_id=u.id),'updated_at',u.updated_at) order by u.first_name)
      from public.users u where u.role in ('admin','super_admin','volunteer','judge','vip_guest')),'[]'::jsonb) else '[]'::jsonb end,
    'incidents',coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from public.incidents i where v_admin or i.reported_by=v_uid),'[]'::jsonb),
    'audit',case when v_admin then coalesce((select jsonb_agg(a) from (select l.id,coalesce(trim(u.first_name||' '||u.last_name),'System') as actor,l.action,l.entity_type,l.created_at from public.audit_logs l left join public.users u on u.id=l.actor_id order by l.created_at desc limit 100) a),'[]'::jsonb) else '[]'::jsonb end,
    'settings',jsonb_build_object('student_portal_open',coalesce((select value='true'::jsonb from public.system_settings where key='student_portal_open'),false),
      'student_registration_open',public._registration_open())
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
  v_active boolean := coalesce((p_payload->>'active')::boolean,true); v_old jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid request.'; end if;
  -- Serialize assignment/access edits with new guest assignments so an escort
  -- cannot be suspended or moved while another admin assigns an active guest.
  if p_action in ('guest.save','volunteer.save','staff.access') then perform pg_advisory_xact_lock(2026,1016); end if;
  if p_action in ('guest.save','guest.archive','volunteer.save','registration.status','event.status','event.judge','incident.resolve','staff.access','announcement.send','student.pass.regenerate') and not v_admin then raise exception 'This action requires an admin.'; end if;
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
      if v_guest.user_id is not null and p_payload->>'category'='Judge' then raise exception 'This guest has a VIP login. Keep a VIP category or create a separate judge login.'; end if;
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
  elsif p_action='student.pass.regenerate' then
    -- The previous QR is recorded as revoked, so a scan of it is reported clearly.
    select * into v_staff from public.users where id=v_id and role='student' for update;
    if not found then raise exception 'Student not found.'; end if;
    insert into public.crossfire_revoked_passes(pass_code,user_id,revoked_by) values(v_staff.pass_code,v_id,v_uid) on conflict do nothing;
    update public.users set pass_code='CF26-'||upper(replace(gen_random_uuid()::text,'-','')) where id=v_id;
    perform public._audit(p_action,'student',v_id,null,null);
  elsif p_action='registration.status' then perform public.admin_set_registration_status(v_id,v_status);
  elsif p_action='event.status' then perform public.admin_set_event_status(v_id,v_status);
  elsif p_action='event.judge' then
    if coalesce((p_payload->>'assigned')::boolean,false) then
      if not exists(select 1 from public.users where id=(p_payload->>'judge_id')::uuid and role='judge' and active) then raise exception 'Choose an active judge.'; end if;
      perform public.admin_assign_judge(v_id,(p_payload->>'judge_id')::uuid);
    else perform public.admin_unassign_judge(v_id,(p_payload->>'judge_id')::uuid); end if;
  elsif p_action='incident.report' then
    if char_length(btrim(coalesce(p_payload->>'room',''))) not between 1 and 100 or char_length(btrim(coalesce(p_payload->>'issue',''))) not between 3 and 1000 then raise exception 'Choose a room and describe the issue (3–1000 characters).'; end if;
    if coalesce(p_payload->>'priority','Normal') not in ('Normal','High') then raise exception 'Choose a valid priority.'; end if;
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
    if coalesce(v_role,'') not in ('volunteer','judge','vip_guest','admin','super_admin') then raise exception 'Choose a valid staff role.'; end if;
    if (v_staff.role::text='vip_guest') <> (v_role='vip_guest') then raise exception 'VIP guest logins are linked to one invitation. Create a separate account instead of changing this role.'; end if;
    if not v_super and (v_staff.role::text not in ('judge','volunteer','vip_guest') or v_role not in ('judge','volunteer','vip_guest')) then raise exception 'Only a super admin can manage admin-level accounts.'; end if;
    if v_staff.role='super_admin' and (v_role<>'super_admin' or not v_active) and (select count(*) from public.users where role='super_admin' and active)<=1 then raise exception 'At least one active super admin must remain.'; end if;
    if v_staff.role='judge' and v_role<>'judge' and exists(select 1 from public.scores where judge_id=v_id) then raise exception 'A judge with submitted scores cannot change roles.'; end if;
    if v_staff.role='volunteer' and (not v_active or v_role<>'volunteer') and exists(select 1 from public.guests g join public.volunteers v on v.id=g.escort_volunteer_id where v.user_id=v_id and g.archived_at is null and g.status in ('Invited','Confirmed','Arrived')) then raise exception 'Reassign this volunteer’s active guests before changing access.'; end if;
    update public.users set role=v_role::public.user_role,active=v_active where id=v_id;
    if v_role='volunteer' then
      insert into public.volunteers(user_id,volunteer_id,name,contact_number,email,password,attendance_status,kit_issued,ops_station) values(v_id,'VOL-'||upper(substr(replace(v_id::text,'-',''),1,10)),trim(v_staff.first_name||' '||v_staff.last_name),coalesce(v_staff.contact_number,'0000000000'),v_staff.email,null,'Assigned',false,'support') on conflict(user_id) where user_id is not null do nothing;
    end if;
    if not v_active or v_role<>'volunteer' then update public.volunteers set attendance_status='Absent' where user_id=v_id; end if;
    if not v_active or v_role<>'judge' then delete from public.judge_assignments where judge_id=v_id; end if;
    if v_staff.role::text<>v_role or v_staff.active<>v_active then perform public._crossfire_revoke_sessions(v_id); end if;
    perform public._audit(p_action,'staff',v_id,jsonb_build_object('role',v_staff.role,'active',v_staff.active),jsonb_build_object('role',v_role,'active',v_active));
  elsif p_action='settings.portal' then
    if not v_super then raise exception 'Only a super admin can change system settings.'; end if;
    perform public.admin_set_system_setting('student_portal_open',to_jsonb(coalesce((p_payload->>'open')::boolean,false)));
  elsif p_action='settings.registration' then
    if not v_super then raise exception 'Only a super admin can open or close student registration.'; end if;
    perform public.admin_set_system_setting('student_registration_open',to_jsonb(coalesce((p_payload->>'open')::boolean,false)));
  elsif p_action='announcement.send' then
    perform public.admin_broadcast(p_payload->>'target',p_payload->>'title',p_payload->>'message');
  else raise exception 'Unknown operations action.';
  end if;
  return jsonb_build_object('success',true,'id',v_id);
end $$;

-- ---------------------------------------------------------------------------
-- VIP guest portal: own invitation and public schedule only
-- ---------------------------------------------------------------------------
create or replace function public.crossfire_vip_snapshot()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_uid uuid := auth.uid(); g public.guests;
begin
  if v_uid is null then raise exception 'Please sign in to continue.'; end if;
  if public.current_user_role() is distinct from 'vip_guest'::public.user_role then raise exception 'Your account does not have permission for this action.'; end if;
  select * into g from public.guests where user_id=v_uid and archived_at is null;
  return jsonb_build_object(
    'profile',(select jsonb_build_object('name',trim(first_name||' '||last_name),'email',email,'contact_number',coalesce(contact_number,'')) from public.users where id=v_uid),
    'invitation',case when g.id is null then null else jsonb_build_object('pass_code',g.pass_code,'name',g.name,'designation',g.designation,'organization',g.organization,
      'category',g.category,'status',g.status,'arrival_time',coalesce(g.arrival_time,''),'dietary_preference',g.dietary_preference,'arrived_at',g.arrived_at,
      'departed_at',g.departed_at,'meal_redeemed_at',g.meal_redeemed_at,'escort',(select v.name from public.volunteers v where v.id=g.escort_volunteer_id)) end,
    'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'venue',e.venue_location,'start_time',e.start_time,'end_time',e.end_time,'status',e.status) order by e.start_time)
      from public.events e where e.status<>'draft'),'[]'::jsonb),
    'fetched_at',now());
end $$;

-- ---------------------------------------------------------------------------
-- Privileges. Retired browser paths: unverified intake and OTP self-profiles.
-- ---------------------------------------------------------------------------
revoke all on function public.crossfire_submit_registration_request(uuid,jsonb),public.ensure_profile(),public.submit_registration_form(jsonb,text[]) from public,anon,authenticated;
revoke all on function public._registration_open(),public._crossfire_password_digest(uuid),public._crossfire_revoke_sessions(uuid),
  public._crossfire_clean_registration(jsonb),public._crossfire_student_receipt(uuid),public._ops_student_json(uuid,boolean,uuid),
  public.crossfire_begin_student_registration(uuid,jsonb),public.crossfire_complete_student_registration(uuid),public.crossfire_abandon_student_registration(uuid),
  public.crossfire_complete_password_change(),public.crossfire_ops_lookup_pass(text),public.crossfire_vip_snapshot(),public.crossfire_current_profile(),
  public.crossfire_ops_snapshot(),public.crossfire_ops_action(text,jsonb),public.crossfire_ops_provision(jsonb),public.crossfire_student_records(),
  public.crossfire_prepare_invitation(uuid,boolean),public.crossfire_invitation_send_guard(uuid),public.admin_set_system_setting(text,jsonb),
  public.staff_set_check_in(uuid,boolean),public.staff_set_food_redeemed(uuid,boolean),public.staff_set_room_reported(uuid,boolean) from public,anon,authenticated;
grant execute on function public.crossfire_begin_student_registration(uuid,jsonb),public.crossfire_complete_student_registration(uuid),
  public.crossfire_abandon_student_registration(uuid) to service_role;
grant execute on function public.crossfire_complete_password_change(),public.crossfire_ops_lookup_pass(text),public.crossfire_vip_snapshot(),public.crossfire_current_profile(),
  public.crossfire_ops_snapshot(),public.crossfire_ops_action(text,jsonb),public.crossfire_ops_provision(jsonb),public.crossfire_student_records(),
  public.crossfire_prepare_invitation(uuid,boolean),public.crossfire_invitation_send_guard(uuid),public.admin_set_system_setting(text,jsonb),
  public.staff_set_check_in(uuid,boolean),public.staff_set_food_redeemed(uuid,boolean),public.staff_set_room_reported(uuid,boolean) to authenticated;
grant execute on function public.get_system_setting(text) to anon,authenticated;
