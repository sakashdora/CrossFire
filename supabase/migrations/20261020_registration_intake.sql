-- Unverified student intake is separate from Auth users, passes and event entries.
-- No existing account, email confirmation or portal policy is changed.
create table if not exists public.crossfire_registration_requests (
  id uuid primary key,
  reference_code text not null unique default ('CFREQ-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
  profile jsonb not null,
  events jsonb not null,
  status text not null default 'pending' check (status in ('pending','reviewed','declined')),
  review_notes text not null default '',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crossfire_requests_status_created on public.crossfire_registration_requests(status,created_at desc);
create index if not exists crossfire_requests_created on public.crossfire_registration_requests(created_at);
create index if not exists crossfire_requests_email_created on public.crossfire_registration_requests((profile->>'email'),created_at);
create index if not exists crossfire_requests_phone_created on public.crossfire_registration_requests((profile->>'contact_number'),created_at);
alter table public.crossfire_registration_requests enable row level security;
revoke all on public.crossfire_registration_requests from public,anon,authenticated;

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
    return jsonb_build_object('reference_code',previous.reference_code,'status','received');
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
  insert into public.crossfire_registration_requests(id,profile,events) values(p_request_id,clean,selected_events) returning reference_code into reference;
  return jsonb_build_object('reference_code',reference,'status','received');
end $$;

create or replace function public.crossfire_list_registration_requests(p_status text default 'pending',p_search text default '',p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); result jsonb;
begin
  if p_status is null or p_status not in ('all','pending','reviewed','declined') or p_page is null or p_page<0 or p_page>10000 or char_length(coalesce(p_search,''))>200 then raise exception 'Invalid review filter.'; end if;
  with matching as (
    select * from public.crossfire_registration_requests r where (p_status='all' or r.status=p_status)
      and (coalesce(p_search,'')='' or position(lower(btrim(p_search)) in lower(r.reference_code||' '||(r.profile->>'student_name')||' '||(r.profile->>'email')||' '||(r.profile->>'institute_name')))>0)
  ) select jsonb_build_object('total',(select count(*) from matching),'items',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc,q.id) from (select * from matching order by created_at desc,id limit 25 offset p_page*25) q),'[]'::jsonb)) into result;
  return result;
end $$;

create or replace function public.crossfire_review_registration_request(p_id uuid,p_status text,p_notes text,p_expected_updated_at timestamptz)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('admin','super_admin'); entry public.crossfire_registration_requests;
begin
  if p_status is null or p_status not in ('pending','reviewed','declined') or char_length(coalesce(p_notes,''))>2000 then raise exception 'Invalid review details.'; end if;
  if p_status='declined' and char_length(btrim(coalesce(p_notes,'')))<3 then raise exception 'Add a reason before declining a request.'; end if;
  select * into entry from public.crossfire_registration_requests where id=p_id for update;
  if not found then raise exception 'Registration request not found.'; end if;
  if p_expected_updated_at is distinct from entry.updated_at then raise exception 'This request changed. Refresh before saving your review.'; end if;
  update public.crossfire_registration_requests set status=p_status,review_notes=btrim(coalesce(p_notes,'')),reviewed_by=actor,reviewed_at=now(),updated_at=clock_timestamp() where id=p_id;
  perform public._audit('registration_request_reviewed','registration_request',p_id,jsonb_build_object('status',entry.status),jsonb_build_object('status',p_status));
  -- Reviewing does not create an Auth account, confirm an email, reserve a seat or issue a pass.
end $$;

revoke all on function public.crossfire_submit_registration_request(uuid,jsonb),public.crossfire_list_registration_requests(text,text,integer),public.crossfire_review_registration_request(uuid,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.crossfire_submit_registration_request(uuid,jsonb) to anon,authenticated;
grant execute on function public.crossfire_list_registration_requests(text,text,integer),public.crossfire_review_registration_request(uuid,text,text,timestamptz) to authenticated;
