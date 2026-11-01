-- Require 10-digit student contact and WhatsApp numbers before reserving an account.
-- Existing registrations are untouched. CREATE OR REPLACE preserves function privileges.
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
  clean:=clean||jsonb_build_object('email',lower(clean->>'email'));
  if char_length(clean->>'student_name') not between 2 and 120 then raise exception 'Enter the student name (2–120 characters).'; end if;
  if char_length(clean->>'email')>254 or clean->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
  if clean->>'contact_number' !~ '^[0-9]{10}$' then raise exception 'Enter a contact number with exactly 10 digits, without the country code.'; end if;
  if clean->>'whatsapp_number' !~ '^[0-9]{10}$' then raise exception 'Enter a WhatsApp number with exactly 10 digits, without the country code.'; end if;
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
