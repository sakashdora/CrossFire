-- Participants who did not keep their student ID or QR can get their own pass back
-- by giving the email address and mobile number they registered with.
-- Server-only: only the participant-pass Edge function (service role) may call
-- this, so the caller-supplied client key cannot be forged from a browser.

-- Shared attempt counter. It never raises on a normal miss, so failed guesses stay counted.
create or replace function public._crossfire_throttle(p_key text, p_limit integer, p_window interval)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_attempts integer;
begin
  insert into public.crossfire_rate_limits(key, attempts) values (p_key, 1)
    on conflict (key) do update set
      attempts = case when crossfire_rate_limits.started_at < now() - p_window then 1 else crossfire_rate_limits.attempts + 1 end,
      started_at = case when crossfire_rate_limits.started_at < now() - p_window then now() else crossfire_rate_limits.started_at end
    returning attempts into v_attempts;
  if v_attempts > p_limit then raise exception 'Too many attempts. Please wait a few minutes and try again.'; end if;
end $$;
revoke all on function public._crossfire_throttle(text, integer, interval) from public, anon, authenticated;

create or replace function public.crossfire_participant_pass(p_email text, p_phone text, p_client text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_email text := lower(btrim(coalesce(p_email, ''))); v_phone text := right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10); u public.users;
begin
  if char_length(v_email) not between 5 and 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or v_phone !~ '^[0-9]{10}$' then
    raise exception 'Enter the email address and 10-digit mobile number you registered with.';
  end if;
  -- Every attempt counts, matched or not, so guessing a mobile number for one email is capped.
  perform public._crossfire_throttle('pass:email:' || md5(v_email), 6, interval '15 minutes');
  perform public._crossfire_throttle('pass:client:' || left(coalesce(nullif(p_client, ''), 'unknown'), 64), 600, interval '10 minutes');
  select * into u from public.users
    where role = 'student' and active and lower(email) = v_email
      and v_phone in (right(regexp_replace(coalesce(contact_number, ''), '[^0-9]', '', 'g'), 10), right(regexp_replace(coalesce(whatsapp_number, ''), '[^0-9]', '', 'g'), 10))
    limit 1;
  -- A miss returns normally (not an error) so the attempt counters above are committed.
  if not found then return jsonb_build_object('found', false); end if;
  return jsonb_build_object('found', true, 'pass', public._crossfire_student_receipt(u.id) || jsonb_build_object(
    'checked_in_at', u.checked_in_at, 'food_redeemed_at', u.food_redeemed_at,
    'events', coalesce((select jsonb_agg(jsonb_build_object('event_id', r.event_id, 'name', e.name, 'slug', e.slug, 'status', r.status, 'reported_at', r.room_reported_at) order by e.start_time, e.name)
      from public.registrations r join public.events e on e.id = r.event_id where r.user_id = u.id), '[]'::jsonb)));
end $$;

revoke all on function public.crossfire_participant_pass(text, text, text) from public, anon, authenticated;
grant execute on function public.crossfire_participant_pass(text, text, text) to service_role;
