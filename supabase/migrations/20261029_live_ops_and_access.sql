-- Forward-only. Requires 20261020_student_invitations.sql.
-- 1. Authenticator (AAL2) is required for super admins only. Admins, volunteers and
--    judges use email + password; role, active state and duties still apply.
-- 2. A cheap live revision lets staff screens reload only when data changes.
-- 3. Only a super admin can permanently delete student data.

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path=public,pg_temp as $$
  select u.role from public.users u join auth.users a on a.id=u.id
  where u.id=auth.uid() and u.active and a.email_confirmed_at is not null
    and ((u.role='student' and exists(select 1 from public.system_settings where key='student_portal_open' and value='true'::jsonb))
      or (u.role not in ('student','super_admin'))
      or (u.role='super_admin' and coalesce(auth.jwt()->>'aal','')='aal2'))
$$;

-- A sequence never blocks concurrent writers; rolled-back writes only cause an extra reload.
create sequence if not exists public.crossfire_live_revision_seq;
revoke all on sequence public.crossfire_live_revision_seq from public,anon,authenticated;

create or replace function public.crossfire_live_bump()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin perform nextval('public.crossfire_live_revision_seq'); return null; end $$;
revoke all on function public.crossfire_live_bump() from public,anon,authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['users','registrations','events','scores','judge_assignments','volunteers','guests','incidents',
    'system_settings','crossfire_registration_requests','crossfire_student_invitations','crossfire_mail_settings'] loop
    if to_regclass('public.'||table_name) is not null then
      execute format('drop trigger if exists crossfire_live_bump on public.%I',table_name);
      execute format('create trigger crossfire_live_bump after insert or update or delete on public.%I for each statement execute function public.crossfire_live_bump()',table_name);
    end if;
  end loop;
end $$;

create or replace function public.crossfire_live_revision()
returns bigint language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin','volunteer','judge'); result bigint;
begin
  select case when is_called then last_value else 0 end into result from public.crossfire_live_revision_seq;
  return result;
end $$;

-- Permanently removes the student profile, event entries, scores, notifications,
-- intake request, invitation records and (when permitted) the login account.
-- The pass ID must be supplied as confirmation so a stray call cannot delete a student.
create or replace function public.crossfire_delete_student(p_user_id uuid,p_confirm_pass text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('super_admin'); target public.users; request uuid; login_removed boolean:=false;
begin
  select * into target from public.users where id=p_user_id for update;
  if not found or target.role<>'student' then raise exception 'Student not found.'; end if;
  if p_confirm_pass is null or upper(btrim(p_confirm_pass))<>upper(target.pass_code) then raise exception 'Confirm the student pass ID to delete this student.'; end if;
  select a.request_id into request from public.crossfire_student_accounts a where a.user_id=p_user_id;
  if request is not null then
    delete from public.crossfire_student_invitations where request_id=request;
    delete from public.crossfire_student_accounts where request_id=request;
    delete from public.crossfire_registration_requests where id=request;
  end if;
  -- Cascades registrations (and their scores) and notifications; event counters update by trigger.
  delete from public.users where id=p_user_id;
  begin
    delete from auth.users where id=p_user_id;
    login_removed:=found;
  exception when insufficient_privilege then login_removed:=false;
  end;
  perform public._audit('student.deleted','student',p_user_id,jsonb_build_object('pass_code',target.pass_code,'request_id',request),jsonb_build_object('login_removed',login_removed));
  return jsonb_build_object('deleted',true,'login_removed',login_removed);
end $$;

-- Deletes an intake submission that has no student account yet.
create or replace function public.crossfire_delete_registration_request(p_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('super_admin'); entry public.crossfire_registration_requests; reserved uuid; login_removed boolean:=false;
begin
  select * into entry from public.crossfire_registration_requests where id=p_id for update;
  if not found then raise exception 'Registration request not found.'; end if;
  select a.user_id into reserved from public.crossfire_student_accounts a where a.request_id=p_id;
  if reserved is not null and exists(select 1 from public.users where id=reserved) then
    raise exception 'This request already has a student account. Delete the student instead.';
  end if;
  delete from public.crossfire_student_invitations where request_id=p_id;
  delete from public.crossfire_student_accounts where request_id=p_id;
  delete from public.crossfire_registration_requests where id=p_id;
  if reserved is not null then
    begin
      -- Only an unprovisioned login created for this exact request.
      delete from auth.users where id=reserved and raw_app_meta_data->>'crossfire_request_id'=p_id::text;
      login_removed:=found;
    exception when insufficient_privilege then login_removed:=false;
    end;
  end if;
  perform public._audit('registration_request.deleted','registration_request',p_id,jsonb_build_object('reference_code',entry.reference_code,'status',entry.status),null);
  return jsonb_build_object('deleted',true,'login_removed',login_removed);
end $$;

revoke all on function public.crossfire_live_revision(),public.crossfire_delete_student(uuid,text),public.crossfire_delete_registration_request(uuid) from public,anon,authenticated;
grant execute on function public.crossfire_live_revision(),public.crossfire_delete_student(uuid,text),public.crossfire_delete_registration_request(uuid) to authenticated;
