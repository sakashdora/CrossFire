// Development helper: materialize complete forward function definitions from the historical migrations.
import { readFileSync, writeFileSync } from 'node:fs';
const intake = readFileSync('supabase/migrations/20261020_registration_intake.sql','utf8');
const invitations = readFileSync('supabase/migrations/20261020_student_invitations.sql','utf8');
const fn = (source, name) => source.match(new RegExp('create or replace function public\\.'+name+'\\([\\s\\S]*?end \\$\\$;'))[0];
let sql = `-- Direct registration keeps contact records private and does not assert email ownership.
alter table public.crossfire_registration_requests drop constraint if exists crossfire_registration_requests_status_check;
alter table public.crossfire_registration_requests add constraint crossfire_registration_requests_status_check check(status in ('pending','reviewed','declined','registered'));
alter table public.crossfire_registration_requests alter column status set default 'registered';
-- Pending records never had approval; preserve declined and already-invited records.
update public.crossfire_registration_requests set status='registered',updated_at=clock_timestamp() where status='pending';

`;
sql += fn(intake,'crossfire_submit_registration_request')
  .replace("return jsonb_build_object('reference_code',previous.reference_code,'status','received');", "if previous.status='declined' then raise exception 'This registration was declined. Contact the organisers.'; end if;\n    return jsonb_build_object('reference_code',previous.reference_code,'status','registered');")
  .replace("insert into public.crossfire_registration_requests(id,profile,events) values(p_request_id,clean,selected_events)","insert into public.crossfire_registration_requests(id,profile,events,status) values(p_request_id,clean,selected_events,'registered')")
  .replace("'status','received'","'status','registered'") + '\n\n';
sql += fn(intake,'crossfire_list_registration_requests').replace("default 'pending'","default 'all'").replace("('all','pending','reviewed','declined')","('all','pending','reviewed','declined','registered')") + '\n\n';
for(const name of ['crossfire_prepare_invitation','crossfire_provision_student','crossfire_invitation_send_guard','registrations_before_insert']) {
  sql += fn(invitations,name).replaceAll("entry.status<>'reviewed'","entry.status not in ('reviewed','registered')").replaceAll("r.status='reviewed'","r.status in ('reviewed','registered')").replace('Review this registration before inviting the student.','This registration is not eligible for a portal invitation.')+'\n\n';
}
sql += `-- One transactionally consistent directory, including students without portal accounts.
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
`;
writeFileSync('supabase/migrations/20261029160000_direct_registration.sql', sql);
