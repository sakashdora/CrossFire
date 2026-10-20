-- Requires 20261016_operations.sql. No seeds and no unrelated application objects.
alter table public.guests alter column pass_code set default ('CFG-' || upper(replace(gen_random_uuid()::text,'-','')));
alter function public._normalize_phone(text) set search_path=public,pg_temp;
alter function public.set_updated_at() set search_path=public,pg_temp;
revoke execute on function public.current_user_role(),public.is_admin(),public.is_staff(),public.is_ops_staff() from public,anon;
grant execute on function public.current_user_role(),public.is_admin(),public.is_staff(),public.is_ops_staff() to authenticated;

-- Account role, active state, verified email and staff MFA are checked on every call.
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path=public,pg_temp as $$
  select u.role from public.users u join auth.users a on a.id=u.id
  where u.id=auth.uid() and u.active and a.email_confirmed_at is not null
    and (u.role='student' or coalesce(auth.jwt()->>'aal','')='aal2')
$$;

create or replace function public.crossfire_current_profile()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
  select to_jsonb(u) || jsonb_build_object('selected_competitions',coalesce((
    select jsonb_agg(e.name order by e.name) from public.registrations r join public.events e on e.id=r.event_id
    where r.user_id=u.id and r.status in ('registered','confirmed')),'[]'::jsonb)) into result
  from public.users u join auth.users a on a.id=u.id where u.id=auth.uid() and u.active and a.email_confirmed_at is not null;
  if result is null then raise exception 'Account access is unavailable.'; end if;
  return result;
end $$;

create or replace function public.submit_media(p_registration_id uuid,p_url text)
returns timestamptz language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('student'); link text:=btrim(coalesce(p_url,'')); entry record;
begin
  select r.*,e.slug,e.registration_deadline,e.status as event_status into entry from public.registrations r join public.events e on e.id=r.event_id where r.id=p_registration_id for update of r;
  if not found or entry.user_id<>uid then raise exception 'Registration not found.'; end if;
  if entry.slug not in ('reels','poster-making') then raise exception 'This event does not accept media submissions.'; end if;
  if link !~* '^https://[a-z0-9][a-z0-9.-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$' or char_length(link)>500 then raise exception 'Use a valid HTTPS media link without embedded credentials.'; end if;
  if entry.status not in ('registered','confirmed') or entry.event_status<>'open' or now()>entry.registration_deadline then raise exception 'The media submission window is closed.'; end if;
  if entry.score_locked or exists(select 1 from public.scores where registration_id=p_registration_id) then raise exception 'Your entry has already been evaluated.'; end if;
  update public.registrations set media_url=link,media_submitted_at=now() where id=p_registration_id;
  return now();
end $$;

create or replace function public.withdraw_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('student'); event_id uuid; entry record;
begin
  -- Same lock order as registration intake: student, ordered events, registration.
  perform 1 from public.users where id=uid for update;
  select r.event_id into event_id from public.registrations r where r.id=p_registration_id and r.user_id=uid;
  if event_id is null then raise exception 'Registration not found.'; end if;
  select e.* into entry from public.events e where e.id=event_id for update;
  perform 1 from public.registrations where id=p_registration_id for update;
  if entry.status<>'open' or now()>entry.registration_deadline then raise exception 'The registration window is closed.'; end if;
  if exists(select 1 from public.scores where registration_id=p_registration_id) then raise exception 'Scoring has already started.'; end if;
  delete from public.registrations where id=p_registration_id and user_id=uid;
end $$;

create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare account record;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  select id,email,email_confirmed_at into account from auth.users where id=auth.uid();
  if account.email_confirmed_at is null then raise exception 'Verify your email before continuing.'; end if;
  if exists(select 1 from public.users where id=auth.uid()) then return; end if;
  insert into public.users(id,email,first_name,last_name,role) values(account.id,lower(account.email),'Student','','student');
end $$;

create or replace function public.crossfire_handle_new_user()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.raw_user_meta_data->>'app'='crossfire' then
    insert into public.users(id,email,first_name,last_name,role) values(new.id,lower(new.email),'Student','','student') on conflict(id) do nothing;
  end if;
  return new;
end $$;

create or replace function public.submit_registration_form(p_profile jsonb,p_event_slugs text[])
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid; account_email text;
begin
  perform public.ensure_profile();
  uid:=public._require_role('student');
  if p_profile is null or jsonb_typeof(p_profile)<>'object' or octet_length(p_profile::text)>12000 then raise exception 'Invalid registration data.'; end if;
  if p_profile->>'parent_consent' is distinct from 'true' or p_profile->>'terms_accepted' is distinct from 'true' then raise exception 'Participation consent is required.'; end if;
  if cardinality(p_event_slugs)>4 then raise exception 'Too many event selections.'; end if;
  select email into account_email from auth.users where id=uid;
  if lower(btrim(coalesce(p_profile->>'email',account_email)))<>lower(account_email) then raise exception 'Use your verified email address.'; end if;
  perform public._apply_profile(uid,account_email,p_profile-'email'-'id'-'role'-'active'-'pass_code'-'checked_in_at'-'food_redeemed_at',true);
  perform public._sync_student_events(uid,p_event_slugs);
end $$;

create or replace function public.crossfire_registration_receipt()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('student'); result jsonb;
begin
  select jsonb_build_object('pass_code',u.pass_code,'registrations',count(r.id)) into result
  from public.users u join public.registrations r on r.user_id=u.id where u.id=uid group by u.id;
  if result is null then raise exception 'No saved registration was found.'; end if;
  return result;
end $$;

create or replace function public.crossfire_my_registrations()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('student');
begin
  return coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('event',to_jsonb(e)) order by e.start_time)
    from public.registrations r join public.events e on e.id=r.event_id where r.user_id=uid),'[]'::jsonb);
end $$;

-- Judges receive only their assigned candidates and their own score drafts/finals.
-- Phone numbers, email, dietary information and other judges' private comments are excluded.
create or replace function public.crossfire_judge_snapshot()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('judge','admin','super_admin'); manager boolean:=public.is_admin();
begin
  return jsonb_build_object(
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.start_time) from public.events e
      where manager or exists(select 1 from public.judge_assignments j where j.event_id=e.id and j.judge_id=uid)),'[]'::jsonb),
    'candidates',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'event_id',r.event_id,'studentId',u.pass_code,
      'name',trim(u.first_name||' '||u.last_name),'institute',u.institute_name,'city',u.city_town,'course',u.course_stream,'board',u.board,
      'submissionUrl',r.media_url,'checkedIn',u.checked_in_at is not null,'roomReported',r.room_reported_at is not null,
      'scoreLocked',coalesce(s.is_final,false),'finalScore',s.score,'rubricScores',s.rubric_scores,'comments',s.comments) order by u.first_name,r.id)
      from public.registrations r join public.users u on u.id=r.user_id left join public.scores s on s.registration_id=r.id and s.judge_id=uid
      where u.active and r.status in ('registered','confirmed') and (manager or exists(select 1 from public.judge_assignments j where j.event_id=r.event_id and j.judge_id=uid))),'[]'::jsonb));
end $$;

create or replace function public.submit_score(p_registration_id uuid,p_rubric_scores jsonb,p_comments text default null)
returns numeric language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('judge'); entry record; criterion jsonb; value numeric; total numeric:=0; score_id uuid; existing record;
begin
  select r.*,e.scoring_rubric,e.status as event_status,u.checked_in_at,u.active into entry from public.registrations r join public.events e on e.id=r.event_id join public.users u on u.id=r.user_id where r.id=p_registration_id for update of r;
  if not found or not entry.active or entry.status not in ('registered','confirmed') then raise exception 'An active registration is required.'; end if;
  if not exists(select 1 from public.judge_assignments where judge_id=uid and event_id=entry.event_id) then raise exception 'You are not assigned to this event.'; end if;
  if entry.event_status<>'in_progress' then raise exception 'Scoring is available only while this event is in progress.'; end if;
  if entry.checked_in_at is null or entry.room_reported_at is null then raise exception 'The participant must check in and report to this event room before scoring.'; end if;
  if p_rubric_scores is null or jsonb_typeof(p_rubric_scores)<>'object' or jsonb_array_length(entry.scoring_rubric->'criteria')=0 then raise exception 'A valid event rubric is required.'; end if;
  for criterion in select * from jsonb_array_elements(entry.scoring_rubric->'criteria') loop
    if not (p_rubric_scores ? (criterion->>'name')) or jsonb_typeof(p_rubric_scores->(criterion->>'name'))<>'number' then raise exception 'Provide a numeric score for every criterion.'; end if;
    value:=(p_rubric_scores->>(criterion->>'name'))::numeric;
    if value<0 or value>(criterion->>'max')::numeric then raise exception 'A criterion score is outside its allowed range.'; end if;
    total:=total+value;
  end loop;
  if (select count(*) from jsonb_object_keys(p_rubric_scores))<>jsonb_array_length(entry.scoring_rubric->'criteria') then raise exception 'Unexpected rubric criteria.'; end if;
  if char_length(coalesce(p_comments,''))>2000 then raise exception 'Comments are too long.'; end if;
  select * into existing from public.scores where registration_id=p_registration_id and judge_id=uid;
  if found and existing.is_final then raise exception 'Your score is already locked. An administrator must unlock it before revision.'; end if;
  insert into public.scores(registration_id,judge_id,rubric_scores,score,comments,is_final) values(p_registration_id,uid,p_rubric_scores,total,nullif(btrim(p_comments),''),true)
    on conflict(registration_id,judge_id) do update set rubric_scores=excluded.rubric_scores,score=excluded.score,comments=excluded.comments,is_final=true,submitted_at=now() returning id into score_id;
  perform public._recompute_registration_score(p_registration_id);
  perform public._audit('score_submitted','score',score_id,null,jsonb_build_object('registration_id',p_registration_id,'score',total));
  return total;
end $$;

create or replace function public.get_leaderboard()
returns table(rank bigint,participant_name text,school_name text,board text,events_count bigint,total_score numeric,is_current_user boolean)
language sql stable security definer set search_path=public,pg_temp as $$
  select rank() over(order by sum(r.score) desc),trim(u.first_name||' '||u.last_name),coalesce(u.institute_name,''),u.board::text,count(*),sum(r.score),coalesce(u.id=auth.uid(),false)
  from public.registrations r join public.users u on u.id=r.user_id join public.events e on e.id=r.event_id
  where u.active and r.status in ('registered','confirmed') and r.score is not null and e.status='completed'
  group by u.id order by 6 desc,2 limit 100
$$;

create or replace function public.get_system_setting(p_key text)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  select value from public.system_settings where key=p_key and key='student_portal_open'
$$;
drop policy if exists system_settings_select on public.system_settings;
create policy system_settings_select on public.system_settings for select to anon,authenticated using(key='student_portal_open');

-- Add a restrictive guard alongside existing row-specific ownership/duty policies.
do $$ declare table_name text; begin
  foreach table_name in array array['users','registrations','scores','judge_assignments','volunteers','guests','notifications','incidents','audit_logs'] loop
    execute format('drop policy if exists crossfire_active_session on public.%I',table_name);
    execute format('create policy crossfire_active_session on public.%I as restrictive for all to authenticated using(public.current_user_role() is not null) with check(false)',table_name);
  end loop;
end $$;

-- Judges use the minimal snapshot, not full participant profiles via REST.
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated using(id=auth.uid() or public.is_admin() or (role='student' and public.current_user_role()='volunteer' and public._ops_student_visible(id)));
drop policy if exists registrations_select on public.registrations;
create policy registrations_select on public.registrations for select to authenticated using(user_id=auth.uid() or public.is_admin() or (public.current_user_role()='volunteer' and public._ops_student_visible(user_id,event_id)));

-- Bound expensive staff provisioning independently of the UI and Edge rate limiter.
create table if not exists public.crossfire_rate_limits(key text primary key,started_at timestamptz not null default now(),attempts integer not null default 0);
alter table public.crossfire_rate_limits enable row level security;
revoke all on public.crossfire_rate_limits from public,anon,authenticated;
create or replace function public.crossfire_provision_guard()
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('admin','super_admin'); current_attempts integer;
begin
  insert into public.crossfire_rate_limits(key,attempts) values('provision:'||uid,1)
    on conflict(key) do update set attempts=case when crossfire_rate_limits.started_at<now()-interval '1 hour' then 1 else crossfire_rate_limits.attempts+1 end,
      started_at=case when crossfire_rate_limits.started_at<now()-interval '1 hour' then now() else crossfire_rate_limits.started_at end returning attempts into current_attempts;
  if current_attempts>20 then raise exception 'Staff provisioning limit reached. Try again later.'; end if;
end $$;

-- New functions never inherit PostgreSQL's default PUBLIC execute privilege.
revoke all on function public.crossfire_current_profile(),public.crossfire_registration_receipt(),public.crossfire_my_registrations(),public.crossfire_judge_snapshot(),public.crossfire_provision_guard() from public,anon,authenticated;
grant execute on function public.crossfire_current_profile(),public.crossfire_registration_receipt(),public.crossfire_my_registrations(),public.crossfire_judge_snapshot(),public.crossfire_provision_guard() to authenticated;
revoke all on function public.crossfire_handle_new_user() from public,anon,authenticated;

-- Registration transitions use one consistent event lock order.
create or replace function public.registrations_before_insert()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
    u       record;
    e       record;
    v_count integer;
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
    if e.status <> 'open' then
        raise exception 'Registration for % is closed.', e.name;
    end if;
    if now() > e.registration_deadline then
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
create or replace function public._sync_student_events(p_uid uuid, p_slugs text[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_role    public.user_role;
    v_ids     uuid[];
    v_slugs   text[];
    v_count_a integer;
    v_count_b integer;
    r         record;
begin
    select role into v_role from public.users where id = p_uid for update;
    if v_role is null then
        raise exception 'Profile not found.';
    end if;
    if v_role <> 'student' then
        raise exception 'Only student accounts can register for competitions.';
    end if;
    v_slugs := array(select distinct s from unnest(coalesce(p_slugs, '{}'::text[])) s where s is not null and s <> '');
    if cardinality(v_slugs) = 0 then
        raise exception 'Please select at least 1 competition to participate.';
    end if;

    select count(*) filter (where event_group = 'Group A'),
           count(*) filter (where event_group = 'Group B')
      into v_count_a, v_count_b
      from public.events
     where slug = any(v_slugs);

    if v_count_a > 2 then
        raise exception 'You can select a maximum of 2 competitions from Group A.';
    end if;
    if v_count_b > 2 then
        raise exception 'You can select a maximum of 2 competitions from Group B.';
    end if;

    -- Always order event IDs deterministically to prevent deadlocks across concurrent transactions
    select array_agg(id order by id) into v_ids from public.events where slug = any(v_slugs);
    if coalesce(cardinality(v_ids), 0) <> cardinality(v_slugs) then
        raise exception 'One or more selected competitions do not exist.';
    end if;

    -- Lock the union of old and new events before deleting or inserting any entry.
    perform 1 from public.events e where e.id=any(v_ids) or exists(select 1 from public.registrations x where x.user_id=p_uid and x.event_id=e.id) order by e.id for update;

    for r in
        select reg.id, e.name, e.status, e.registration_deadline,
               exists (select 1 from public.scores s where s.registration_id = reg.id) as has_scores
          from public.registrations reg join public.events e on e.id = reg.event_id
         where reg.user_id = p_uid and not (reg.event_id = any(v_ids))
         order by reg.event_id
    loop
        if r.status <> 'open' or now() > r.registration_deadline then
            raise exception 'The registration window for % is closed.', r.name;
        end if;
        if r.has_scores then
            raise exception 'You cannot withdraw from % because scoring has already started.', r.name;
        end if;
        delete from public.registrations where id = r.id;
    end loop;

    -- Deterministic lock order on insert
    insert into public.registrations (user_id, event_id)
    select p_uid, ev
      from unnest(v_ids) ev
     where not exists (select 1 from public.registrations x where x.user_id = p_uid and x.event_id = ev)
     order by ev;
end $$;
