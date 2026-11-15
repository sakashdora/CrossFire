-- Coordinators can declare winners who are not registered online (offline registrations)
-- by typing the participant's name and college. Each of the four award slots (1st, 2nd,
-- 3rd, Champion) holds either a registered entry (picks) or a typed entry (manual), never both.
-- First, second and third are required to submit; Champion is optional.
-- Published labels now read "Name — College".
alter table public.event_declarations add column if not exists manual jsonb not null default '[null,null,null,null]'::jsonb;

-- Normalises the typed winners sent by the coordinator: exactly four slots, each null or {name, school}.
create or replace function public._declaration_clean_manual(p_manual jsonb)
returns jsonb language plpgsql immutable set search_path = public, pg_temp as $$
declare result jsonb := '[]'::jsonb; item jsonb; n text; s text; i integer;
begin
  if p_manual is null or p_manual = 'null'::jsonb then return '[null,null,null,null]'::jsonb; end if;
  if jsonb_typeof(p_manual) <> 'array' or jsonb_array_length(p_manual) <> 4 then raise exception 'Invalid typed winners.'; end if;
  for i in 0..3 loop
    item := p_manual -> i;
    if item is null or jsonb_typeof(item) = 'null' then result := result || 'null'::jsonb; continue; end if;
    if jsonb_typeof(item) <> 'object' then raise exception 'Invalid typed winners.'; end if;
    n := regexp_replace(btrim(coalesce(item ->> 'name', '')), '\s+', ' ', 'g');
    s := regexp_replace(btrim(coalesce(item ->> 'school', '')), '\s+', ' ', 'g');
    if char_length(n) > 100 or char_length(s) > 150 then raise exception 'Names are limited to 100 characters and college names to 150.'; end if;
    if n ~ '[<>]' or s ~ '[<>]' then raise exception 'Names cannot contain angle brackets.'; end if;
    -- A completely empty slot is an unused slot. A half-filled one is kept so a draft can be saved.
    result := result || case when n = '' and s = '' then 'null'::jsonb else jsonb_build_object('name', n, 'school', s) end;
  end loop;
  return result;
end $$;
revoke all on function public._declaration_clean_manual(jsonb) from public, anon, authenticated;

create or replace function public.result_desk()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare actor uuid := public._require_role('coordinator', 'admin', 'super_admin'); manager boolean := public.is_admin();
begin
  return jsonb_build_object('events', coalesce((select jsonb_agg(jsonb_build_object(
    'id', e.id, 'name', e.name, 'day', (e.start_time at time zone 'Asia/Kolkata')::date,
    'event_day', (now() at time zone 'Asia/Kolkata')::date between (e.start_time at time zone 'Asia/Kolkata')::date and (e.end_time at time zone 'Asia/Kolkata')::date,
    'coordinator', d.coordinator, 'version', coalesce(d.version, 0), 'state', coalesce(d.state, 'Draft'),
    'picks', coalesce(d.picks, array[null, null, null, null]::uuid[]), 'manual', coalesce(d.manual, '[null,null,null,null]'::jsonb),
    'labels', d.labels, 'feedback', coalesce(d.feedback, ''),
    'entries', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'name', coalesce(nullif(r.team_name, ''), trim(concat_ws(' ', u.first_name, u.last_name))), 'school', u.institute_name) order by u.first_name, r.id)
      from public.registrations r join public.users u on u.id = r.user_id where r.event_id = e.id and r.status in ('registered', 'confirmed') and u.active), '[]'::jsonb)
  ) order by e.start_time, e.name) from public.events e left join public.event_declarations d on d.event_id = e.id
    where manager or d.coordinator = actor), '[]'::jsonb),
    'staff', case when manager then coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'name', trim(concat_ws(' ', u.first_name, u.last_name))) order by u.first_name) from public.users u where u.role = 'coordinator' and u.active), '[]'::jsonb) else '[]'::jsonb end);
end $$;

-- The earlier six-argument signature is replaced; callers that omit p_manual keep working.
drop function if exists public.result_action(uuid, integer, text, uuid[], uuid, text);
create or replace function public.result_action(p_event uuid, p_version integer, p_action text, p_picks uuid[] default null, p_coordinator uuid default null, p_feedback text default null, p_manual jsonb default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public._require_role('coordinator', 'admin', 'super_admin'); manager boolean := public.is_admin(); d public.event_declarations;
  selections uuid[]; typed jsonb; v_labels text[] := array[null, null, null, null]; t jsonb; reg record; event_day boolean; i integer; j integer;
begin
  if p_action is null or p_action not in ('assign', 'save', 'submit', 'approve', 'return') then raise exception 'Unknown result action.'; end if;
  if (p_action in ('assign', 'approve', 'return')) <> manager then raise exception 'Your role cannot perform this action.'; end if;
  if manager then insert into public.event_declarations(event_id) values (p_event) on conflict do nothing; end if;
  select * into d from public.event_declarations where event_id = p_event for update;
  if not found or (not manager and d.coordinator is distinct from actor) then raise exception 'This event is not assigned to you.'; end if;
  if d.version is distinct from p_version then raise exception 'The declaration changed. Refresh before trying again.'; end if;
  if p_action = 'assign' then
    if p_coordinator is not null and not exists(select 1 from public.users where id = p_coordinator and active and role = 'coordinator') then raise exception 'Choose an active coordinator.'; end if;
    update public.event_declarations set coordinator = p_coordinator, version = version + 1 where event_id = p_event;
  else
    if manager and d.state <> 'In review' then raise exception 'Only a submitted declaration can be reviewed.'; end if;
    if manager and d.submitted_by = actor then raise exception 'Another administrator must review your declaration.'; end if;
    if not manager and d.state not in ('Draft', 'Changes requested') then raise exception 'This declaration is locked.'; end if;
    if p_action = 'return' then
      if nullif(trim(p_feedback), '') is null or length(p_feedback) > 1000 then raise exception 'Enter a review reason of up to 1000 characters.'; end if;
      update public.event_declarations set state = 'Changes requested', reviewed_by = actor, feedback = trim(p_feedback), version = version + 1 where event_id = p_event;
    else
      selections := case when manager then d.picks else p_picks end;
      typed := case when manager then coalesce(d.manual, '[null,null,null,null]'::jsonb) else public._declaration_clean_manual(p_manual) end;
      if coalesce(array_length(selections, 1), 0) <> 4 or array_ndims(selections) <> 1 then raise exception 'Choose four award slots.'; end if;
      for i in 1..4 loop
        t := typed -> (i - 1);
        if selections[i] is not null and jsonb_typeof(t) = 'object' then raise exception 'Use either a registered entry or a typed name for each award, not both.'; end if;
        if selections[i] is not null then
          select coalesce(nullif(r.team_name, ''), trim(concat_ws(' ', u.first_name, u.last_name))) as n, u.institute_name as s into reg
            from public.registrations r join public.users u on u.id = r.user_id
            where r.id = selections[i] and r.event_id = p_event and r.status in ('registered', 'confirmed') and u.active;
          if not found then raise exception 'Choose eligible entries registered for this event.'; end if;
          v_labels[i] := reg.n || coalesce(' — ' || nullif(btrim(reg.s), ''), '');
        elsif jsonb_typeof(t) = 'object' then
          -- Saving a draft may keep a half-typed row; submitting needs both the name and the college.
          if p_action <> 'save' and (char_length(t ->> 'name') < 2 or char_length(t ->> 'school') < 2) then
            raise exception 'Type both the participant name and the college name (at least 2 characters each).';
          end if;
          v_labels[i] := (t ->> 'name') || ' — ' || (t ->> 'school');
        end if;
      end loop;
      -- Podium places must be different people: registered entries by id, typed ones by name and college.
      if (select count(distinct x) <> count(x) from unnest(selections[1:3]) x) then raise exception 'First, second and third place must be different entries.'; end if;
      for i in 1..3 loop
        for j in (i + 1)..3 loop
          if jsonb_typeof(typed -> (i - 1)) = 'object' and v_labels[i] is not null and lower(v_labels[i]) = lower(coalesce(v_labels[j], '')) then raise exception 'First, second and third place must be different entries.'; end if;
          if jsonb_typeof(typed -> (j - 1)) = 'object' and v_labels[j] is not null and lower(v_labels[j]) = lower(coalesce(v_labels[i], '')) then raise exception 'First, second and third place must be different entries.'; end if;
        end loop;
      end loop;
      -- First, second and third are required; Champion is optional.
      if p_action <> 'save' and (v_labels[1] is null or v_labels[2] is null or v_labels[3] is null) then raise exception 'Choose or type a name for first, second and third place.'; end if;
      if p_action = 'submit' then
        select (now() at time zone 'Asia/Kolkata')::date between (start_time at time zone 'Asia/Kolkata')::date and (end_time at time zone 'Asia/Kolkata')::date into event_day from public.events where id = p_event;
        if not event_day and d.state <> 'Changes requested' then raise exception 'Submit on the scheduled event day.'; end if;
      end if;
      update public.event_declarations set picks = selections, manual = typed, version = version + 1,
        state = case p_action when 'approve' then 'Published' when 'submit' then 'In review' else d.state end,
        feedback = case when p_action = 'save' then d.feedback else '' end,
        submitted_by = case when p_action = 'submit' then actor else d.submitted_by end,
        reviewed_by = case when manager then actor else null end,
        labels = case when manager then v_labels else null end where event_id = p_event;
    end if;
  end if;
  perform public._audit('result.' || p_action, 'event', p_event, to_jsonb(d.version), to_jsonb(d.version + 1));
end $$;

revoke all on function public.result_desk(), public.result_action(uuid, integer, text, uuid[], uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.result_desk(), public.result_action(uuid, integer, text, uuid[], uuid, text, jsonb) to authenticated;
