-- Forward-only. Apply after 20261030090100_accounts_registration_qr.sql.
-- Least-privilege fixes from the 30 October 2026 review. No records change.
-- 1. Judges no longer receive student QR pass codes (gate and meal lookup keys).
-- 2. Guests are read only through role-scoped RPCs; direct REST reads exposed
--    fields (email, linked login) that the volunteer snapshot deliberately omits.
-- 3. Public setting reads return only the key and value, not who changed it.
-- 4. Assigning a judge directly requires an active judge, as the operations action does.

create or replace function public.crossfire_judge_snapshot()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare uid uuid:=public._require_role('judge','admin','super_admin'); manager boolean:=public.is_admin();
begin
  return jsonb_build_object(
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.start_time) from public.events e
      where manager or exists(select 1 from public.judge_assignments j where j.event_id=e.id and j.judge_id=uid)),'[]'::jsonb),
    -- The student number identifies a candidate; the pass code would let its holder check the student in.
    'candidates',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'event_id',r.event_id,'studentId','CFS-'||u.pass_number,
      'name',trim(u.first_name||' '||u.last_name),'institute',u.institute_name,'city',u.city_town,'course',u.course_stream,'board',u.board,
      'submissionUrl',r.media_url,'checkedIn',u.checked_in_at is not null,'roomReported',r.room_reported_at is not null,
      'scoreLocked',coalesce(s.is_final,false),'finalScore',s.score,'rubricScores',s.rubric_scores,'comments',s.comments) order by u.first_name,r.id)
      from public.registrations r join public.users u on u.id=r.user_id left join public.scores s on s.registration_id=r.id and s.judge_id=uid
      where u.active and r.status in ('registered','confirmed') and (manager or exists(select 1 from public.judge_assignments j where j.event_id=r.event_id and j.judge_id=uid))),'[]'::jsonb));
end $$;

-- crossfire_ops_snapshot and crossfire_vip_snapshot (security definer) remain the read paths.
revoke select on public.guests from anon,authenticated;

revoke select on public.system_settings from anon,authenticated;
grant select(key,value) on public.system_settings to anon,authenticated;

create or replace function public.admin_assign_judge(p_event_id uuid, p_judge_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid := public._require_role('admin','super_admin');
begin
  if not exists(select 1 from public.users where id=p_judge_id and role='judge' and active) then
    raise exception 'Choose an active judge.';
  end if;
  if not exists(select 1 from public.events where id=p_event_id) then
    raise exception 'Event not found.';
  end if;
  insert into public.judge_assignments(judge_id,event_id,assigned_by) values(p_judge_id,p_event_id,v_uid)
    on conflict(judge_id,event_id) do nothing;
  perform public._audit('judge_assigned','event',p_event_id,null,jsonb_build_object('judge_id',p_judge_id));
end $$;

revoke all on function public.crossfire_judge_snapshot(),public.admin_assign_judge(uuid,uuid) from public,anon;
grant execute on function public.crossfire_judge_snapshot(),public.admin_assign_judge(uuid,uuid) to authenticated;
