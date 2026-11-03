-- Admission is committed by register-student. Portal access starts with staff issuance.
create table public.crossfire_student_credentials (
  request_id uuid primary key references public.crossfire_student_accounts(request_id) on delete cascade,
  user_id uuid not null unique,
  job_id uuid unique,
  approved_at timestamptz, approved_by uuid references public.users(id) on delete set null,
  issued_at timestamptz,
  delivery text not null default 'not_sent' check(delivery in ('not_sent','sending','failed','uncertain','accepted')),
  send_attempt uuid, send_started timestamptz, first_send timestamptz, sender jsonb, bootstrap_digest text
);
insert into public.crossfire_student_credentials(request_id,user_id)
select a.request_id,a.user_id from public.crossfire_student_accounts a join public.crossfire_registration_requests r on r.id=a.request_id
where a.provisioned_at is null and r.status='registering';
alter table public.crossfire_student_credentials enable row level security;
revoke all on public.crossfire_student_credentials from public,anon,authenticated,service_role;

-- Only registrations reserved after cutover enter this cohort. Existing students keep their access.
create function public._crossfire_pending_student() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if exists(select 1 from public.crossfire_registration_requests where id=new.request_id and status='registering') then
    insert into public.crossfire_student_credentials(request_id,user_id) values(new.request_id,new.user_id);
  end if;
  return new;
end $$;
create trigger crossfire_pending_student after insert on public.crossfire_student_accounts for each row execute function public._crossfire_pending_student();

-- Compensate under the same request lock as completion. A concurrent successful
-- registration must never lose its Auth identity. Only our unused, banned bootstrap can be removed.
create or replace function public.crossfire_abandon_student_registration(p_request_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare entry public.crossfire_registration_requests; candidate uuid;
begin
  select * into entry from public.crossfire_registration_requests where id=p_request_id for update;
  if not found or entry.status<>'registering' then return; end if;
  select user_id into candidate from public.crossfire_student_accounts where request_id=p_request_id for update;
  if candidate is null or exists(select 1 from public.users where id=candidate) then return; end if;
  delete from auth.users where id=candidate and email_confirmed_at is null and banned_until>now()
    and lower(email)=entry.profile->>'email' and raw_app_meta_data->>'crossfire_request_id'=p_request_id::text;
  delete from public.crossfire_student_accounts where request_id=p_request_id;
  delete from public.crossfire_registration_requests where id=p_request_id;
end $$;

-- A public Auth signup is never an application provisioning event.
create or replace function public.crossfire_handle_new_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin return new; end $$;

-- Preserve historical registrations, including older versions that wrote event entries
-- without a student_accounts row. Isolate empty public-signup profiles left by the old trigger.
create table public.crossfire_unregistered_signups (user_id uuid primary key references public.users(id) on delete cascade);
alter table public.crossfire_unregistered_signups enable row level security;
revoke all on public.crossfire_unregistered_signups from public,anon,authenticated,service_role;
insert into public.crossfire_unregistered_signups(user_id)
  select u.id from public.users u join auth.users a on a.id=u.id
  where u.role='student' and a.raw_user_meta_data->>'app'='crossfire'
    and not coalesce(u.terms_accepted,false) and not coalesce(u.parent_consent,false)
    and not exists(select 1 from public.crossfire_student_accounts c where c.user_id=u.id)
    and not exists(select 1 from public.registrations r where r.user_id=u.id);
create function public._crossfire_portal_session(p_user uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
  select not exists(select 1 from public.crossfire_unregistered_signups q where q.user_id=p_user)
    and (not exists(select 1 from public.crossfire_student_credentials c where c.user_id=p_user)
    or exists(select 1 from public.crossfire_student_credentials c join auth.sessions s on s.user_id=c.user_id
      where c.user_id=p_user and c.issued_at is not null and s.id::text=auth.jwt()->>'session_id' and s.created_at>=c.issued_at))
$$;

create or replace function public.current_user_role() returns public.user_role
language sql stable security definer set search_path=public,pg_temp as $$
  select u.role from public.users u join auth.users a on a.id=u.id where u.id=auth.uid() and u.active
    and a.email_confirmed_at is not null and (a.banned_until is null or a.banned_until<=now())
    and not u.must_change_password and (u.role <> 'super_admin' or auth.jwt()->>'aal'='aal2')
    and public._crossfire_portal_session(u.id)
$$;

alter function public.crossfire_current_profile() rename to _crossfire_profile_details;
revoke all on function public._crossfire_profile_details() from public,anon,authenticated;
create function public.crossfire_current_profile() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare u public.users;
begin
  select p.* into u from public.users p join auth.users a on a.id=p.id where p.id=auth.uid() and p.active
    and a.email_confirmed_at is not null and (a.banned_until is null or a.banned_until<=now()) and public._crossfire_portal_session(p.id);
  if not found then raise exception 'Account access is unavailable.'; end if;
  if u.must_change_password or (u.role='super_admin' and auth.jwt()->>'aal' is distinct from 'aal2') then
    return jsonb_build_object('id',u.id,'role',u.role,'active',true,'must_change_password',u.must_change_password);
  end if;
  return public._crossfire_profile_details();
end $$;
alter function public.crossfire_complete_password_change() rename to _crossfire_finish_changed_password;
revoke all on function public._crossfire_finish_changed_password() from public,anon,authenticated;
create function public.crossfire_complete_password_change() returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare was_temporary boolean := exists(select 1 from public.crossfire_temporary_passwords where user_id=auth.uid());
begin
  if not public._crossfire_portal_session(auth.uid()) then raise exception 'Credentials are not ready.'; end if;
  perform public._crossfire_finish_changed_password();
  if was_temporary and exists(select 1 from public.crossfire_student_credentials where user_id=auth.uid()) then
    delete from auth.sessions where user_id=auth.uid() and id::text is distinct from auth.jwt()->>'session_id';
  end if;
end $$;

alter function public.crossfire_student_records() rename to _crossfire_admission_records;
revoke all on function public._crossfire_admission_records() from public,anon,authenticated;
create function public.crossfire_student_records() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(case when c.request_id is null then rec else rec || jsonb_build_object(
    'approved_at',c.approved_at,'has_login',c.issued_at is not null,'delivery_status',c.delivery,'portal_state',
    case when c.issued_at is null then 'pending' when u.must_change_password then 'first_sign_in' else 'active' end) end order by pos),'[]')
  from jsonb_array_elements(public._crossfire_admission_records()) with ordinality as records(rec,pos)
  left join public.crossfire_student_credentials c on c.request_id=(rec->>'request_id')::uuid
  left join public.users u on u.id=c.user_id
$$;
-- Guard the older invitation route for this cohort as well, including direct RPC calls.
alter function public.crossfire_prepare_invitation(uuid,boolean) rename to _crossfire_prepare_legacy_invitation;
revoke all on function public._crossfire_prepare_legacy_invitation(uuid,boolean) from public,anon,authenticated;
create function public.crossfire_prepare_invitation(p_request_id uuid,p_resend boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform public._require_role('admin','super_admin');
  if exists(select 1 from public.crossfire_student_credentials c join public.users u on u.id=c.user_id
    where c.request_id=p_request_id and (issued_at is null or u.must_change_password)) then raise exception 'Use Generate credentials for this student.'; end if;
  return public._crossfire_prepare_legacy_invitation(p_request_id,p_resend);
end $$;

create function public.crossfire_prepare_credentials(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid := public._require_role('admin','super_admin'); c public.crossfire_student_credentials; u public.users; mail public.crossfire_mail_settings;
begin
  select * into c from public.crossfire_student_credentials where request_id=p_request_id for update;
  select * into u from public.users where id=c.user_id and active and role='student';
  if not found then raise exception 'This student is not eligible for credential issuance.'; end if;
  if c.issued_at is not null and (not u.must_change_password or c.delivery='accepted') then return jsonb_build_object('status','already_issued'); end if;
  select * into mail from public.crossfire_mail_settings where singleton and enabled and sender_email<>'';
  if not found then raise exception 'Enable the college email sender first.'; end if;
  if c.job_id is null then
    update public.crossfire_student_credentials set job_id=gen_random_uuid(), approved_at=clock_timestamp(), approved_by=actor, bootstrap_digest=public._crossfire_password_digest(u.id), sender=to_jsonb(mail)-'singleton' where request_id=p_request_id returning * into c;
    perform public._audit('student.credentials.prepared','student',u.id,null,jsonb_build_object('request_id',p_request_id));
  end if;
  return jsonb_build_object('status','ready','job_id',c.job_id,'user_id',u.id,'email',u.email,'student_id','CFS-'||u.pass_number,'issued',c.issued_at is not null,'sender',c.sender);
end $$;

-- Capture the actual GoTrue password digest atomically with unbanning. An overlapping
-- worker has its own attempt UUID and cannot replace a password that has already been issued.
create function public._crossfire_release_student() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.crossfire_student_credentials; final_user auth.users; digest text;
begin
  if new.raw_app_meta_data->>'crossfire_issue_attempt' is not distinct from old.raw_app_meta_data->>'crossfire_issue_attempt' then return new; end if;
  select * into c from public.crossfire_student_credentials where user_id=new.id for update;
  select * into final_user from auth.users where id=new.id;
  digest := public._crossfire_password_digest(new.id);
  if c.job_id is null or c.job_id::text is distinct from final_user.raw_app_meta_data->>'crossfire_issue_job'
    or c.issued_at is not null or final_user.email_confirmed_at is null or final_user.banned_until>now()
    or digest is null or c.bootstrap_digest is null or digest=c.bootstrap_digest then raise exception 'Invalid or completed credential issuance.'; end if;
  update public.users set must_change_password=true where id=new.id and role='student' and active;
  if not found then raise exception 'Student access is unavailable.'; end if;
  insert into public.crossfire_temporary_passwords(user_id,hash_digest) values(new.id,digest);
  update public.crossfire_student_credentials set issued_at=clock_timestamp(),bootstrap_digest=null where request_id=c.request_id;
  return new;
end $$;
-- GoTrue writes the password, confirmation, metadata and ban in separate statements of one transaction.
create constraint trigger crossfire_release_student after update on auth.users deferrable initially deferred for each row
  when ((new.raw_app_meta_data->>'crossfire_issue_attempt') is distinct from (old.raw_app_meta_data->>'crossfire_issue_attempt'))
  execute function public._crossfire_release_student();

create function public.crossfire_claim_credential_mail(p_job uuid,p_attempt uuid) returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.crossfire_student_credentials;
begin
  perform public._require_role('admin','super_admin');
  select * into c from public.crossfire_student_credentials where job_id=p_job for update;
  if not found or c.issued_at is null then raise exception 'Credentials are not ready.'; end if;
  if not exists(select 1 from public.users where id=c.user_id and active) then raise exception 'Student is inactive.'; end if;
  if c.delivery='accepted' or not exists(select 1 from public.crossfire_temporary_passwords where user_id=c.user_id) then return 'already_issued'; end if;
  if c.delivery='sending' and c.send_started>clock_timestamp()-interval '2 minutes' then return 'in_progress'; end if;
  if c.delivery in ('uncertain','sending') and c.first_send < clock_timestamp()-interval '23 hours' then return 'needs_review'; end if;
  if not exists(select 1 from public.crossfire_mail_settings where singleton and enabled) then raise exception 'Official mail is disabled.'; end if;
  update public.crossfire_student_credentials set delivery='sending',send_attempt=p_attempt,first_send=coalesce(first_send,clock_timestamp()),send_started=clock_timestamp() where job_id=p_job;
  return 'claimed';
end $$;
create function public.crossfire_finish_credential_mail(p_job uuid,p_attempt uuid,p_status text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_status not in ('accepted','failed','uncertain') then raise exception 'Invalid delivery status.'; end if;
  update public.crossfire_student_credentials set delivery=p_status where job_id=p_job and send_attempt=p_attempt and delivery='sending';
  if not found then raise exception 'Delivery status changed. Refresh student records.'; end if;
end $$;

-- Only the sign-in Edge function resolves an ID. The public caller must supply its password.
create function public.crossfire_student_login_email(p_student_id text) returns text language sql stable security definer set search_path=public,pg_temp as $$
  select u.email from public.users u where u.role='student' and u.active and 'CFS-'||u.pass_number=upper(p_student_id)
$$;
revoke all on function public._crossfire_portal_session(uuid),public._crossfire_pending_student(),public._crossfire_release_student(),
  public.crossfire_current_profile(),public.crossfire_complete_password_change(),public.crossfire_student_records(),public.crossfire_prepare_invitation(uuid,boolean),
  public.crossfire_prepare_credentials(uuid),public.crossfire_claim_credential_mail(uuid,uuid),public.crossfire_finish_credential_mail(uuid,uuid,text),public.crossfire_student_login_email(text) from public,anon,authenticated,service_role;
grant execute on function public.crossfire_current_profile(),public.crossfire_complete_password_change(),public.crossfire_student_records(),public.crossfire_prepare_invitation(uuid,boolean),
  public.crossfire_prepare_credentials(uuid) to authenticated;
-- A staff claim is authorized with the caller session. Only the delivery service can finalize it.
grant execute on function public.crossfire_claim_credential_mail(uuid,uuid) to authenticated;
grant execute on function public.crossfire_finish_credential_mail(uuid,uuid,text),public.crossfire_student_login_email(text) to service_role;
