-- Results can be filed by any coordinator, for any event, at any time. There is no event-day
-- window and no assignment requirement (an admin can still assign a coordinator as the usual
-- contact). Coordinators may keep editing after submitting or after publication. Nothing reaches the
-- website without an admin or super admin approving it, and the website keeps showing the last
-- approved result until the next approval.
alter table public.event_declarations
  add column if not exists published_labels text[],
  add column if not exists published_at timestamptz,
  add column if not exists updated_by uuid references public.users(id) on delete set null,
  add column if not exists updated_at timestamptz;

-- Results approved under the earlier rules keep showing.
update public.event_declarations set published_labels = labels, published_at = coalesce(published_at, now())
  where state = 'Published' and labels is not null and published_labels is null;

create or replace function public.result_desk()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare actor uuid := public._require_role('coordinator', 'admin', 'super_admin'); manager boolean := public.is_admin();
begin
  return jsonb_build_object('events', coalesce((select jsonb_agg(jsonb_build_object(
    'id', e.id, 'name', e.name, 'day', (e.start_time at time zone 'Asia/Kolkata')::date,
    'event_day', (now() at time zone 'Asia/Kolkata')::date between (e.start_time at time zone 'Asia/Kolkata')::date and (e.end_time at time zone 'Asia/Kolkata')::date,
    'coordinator', d.coordinator, 'mine', coalesce(d.coordinator = actor, false), 'version', coalesce(d.version, 0), 'state', coalesce(d.state, 'Draft'),
    'picks', coalesce(d.picks, array[null, null, null, null]::uuid[]), 'manual', coalesce(d.manual, '[null,null,null,null]'::jsonb),
    'labels', d.labels, 'published', d.published_labels, 'published_at', d.published_at, 'feedback', coalesce(d.feedback, ''),
    'updated_at', d.updated_at, 'updated_by', (select nullif(trim(concat_ws(' ', x.first_name, x.last_name)), '') from public.users x where x.id = d.updated_by),
    'entries', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'name', coalesce(nullif(r.team_name, ''), trim(concat_ws(' ', u.first_name, u.last_name))), 'school', u.institute_name) order by u.first_name, r.id)
      from public.registrations r join public.users u on u.id = r.user_id where r.event_id = e.id and r.status in ('registered', 'confirmed') and u.active), '[]'::jsonb)
  ) order by coalesce(d.coordinator = actor, false) desc, e.start_time, e.name)
    from public.events e left join public.event_declarations d on d.event_id = e.id
    where manager or e.status <> 'draft'), '[]'::jsonb),
    'staff', case when manager then coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'name', trim(concat_ws(' ', u.first_name, u.last_name))) order by u.first_name) from public.users u where u.role = 'coordinator' and u.active), '[]'::jsonb) else '[]'::jsonb end);
end $$;

create or replace function public.result_action(p_event uuid, p_version integer, p_action text, p_picks uuid[] default null, p_coordinator uuid default null, p_feedback text default null, p_manual jsonb default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public._require_role('coordinator', 'admin', 'super_admin'); manager boolean := public.is_admin(); d public.event_declarations;
  selections uuid[]; typed jsonb; v_labels text[] := array[null, null, null, null]; t jsonb; reg record; i integer; j integer;
begin
  if p_action is null or p_action not in ('assign', 'save', 'submit', 'approve', 'return') then raise exception 'Unknown result action.'; end if;
  if (p_action in ('assign', 'approve', 'return')) <> manager then raise exception 'Your role cannot perform this action.'; end if;
  if not exists(select 1 from public.events where id = p_event and (manager or status <> 'draft')) then raise exception 'Event not found.'; end if;
  insert into public.event_declarations(event_id) values (p_event) on conflict do nothing;
  select * into d from public.event_declarations where event_id = p_event for update;
  if not found then raise exception 'Event not found.'; end if;
  -- Two coordinators saving the same event at once: the second one is asked to refresh.
  if d.version is distinct from p_version then raise exception 'The declaration changed. Refresh before trying again.'; end if;
  if p_action = 'assign' then
    if p_coordinator is not null and not exists(select 1 from public.users where id = p_coordinator and active and role = 'coordinator') then raise exception 'Choose an active coordinator.'; end if;
    update public.event_declarations set coordinator = p_coordinator, version = version + 1 where event_id = p_event;
  else
    if manager and d.state <> 'In review' then raise exception 'Only a submitted declaration can be reviewed.'; end if;
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
          if p_action <> 'save' and (char_length(t ->> 'name') < 2 or char_length(t ->> 'school') < 2) then
            raise exception 'Type both the participant name and the college name (at least 2 characters each).';
          end if;
          v_labels[i] := (t ->> 'name') || ' — ' || (t ->> 'school');
        end if;
      end loop;
      if (select count(distinct x) <> count(x) from unnest(selections[1:3]) x) then raise exception 'First, second and third place must be different entries.'; end if;
      for i in 1..3 loop
        for j in (i + 1)..3 loop
          if jsonb_typeof(typed -> (i - 1)) = 'object' and v_labels[i] is not null and lower(v_labels[i]) = lower(coalesce(v_labels[j], '')) then raise exception 'First, second and third place must be different entries.'; end if;
          if jsonb_typeof(typed -> (j - 1)) = 'object' and v_labels[j] is not null and lower(v_labels[j]) = lower(coalesce(v_labels[i], '')) then raise exception 'First, second and third place must be different entries.'; end if;
        end loop;
      end loop;
      if p_action <> 'save' and (v_labels[1] is null or v_labels[2] is null or v_labels[3] is null) then raise exception 'Choose or type a name for first, second and third place.'; end if;
      update public.event_declarations set picks = selections, manual = typed, version = version + 1,
        -- Editing a submitted or published result returns it to a draft; the website keeps the last approved one.
        state = case p_action when 'approve' then 'Published' when 'submit' then 'In review' else case when d.state in ('In review', 'Published') then 'Draft' else d.state end end,
        feedback = case when p_action = 'save' then d.feedback else '' end,
        submitted_by = case when p_action = 'submit' then actor else d.submitted_by end,
        reviewed_by = case when manager then actor else null end,
        labels = case when manager then v_labels else null end,
        published_labels = case when p_action = 'approve' then v_labels else d.published_labels end,
        published_at = case when p_action = 'approve' then now() else d.published_at end,
        updated_by = case when manager then d.updated_by else actor end,
        updated_at = case when manager then d.updated_at else now() end
        where event_id = p_event;
    end if;
  end if;
  perform public._audit('result.' || p_action, 'event', p_event, to_jsonb(d.version), to_jsonb(d.version + 1));
end $$;

-- The website shows the last approved result, even while a newer one waits for approval.
create or replace function public.published_event_awards()
returns table(event_name text, awards text[]) language sql stable security definer set search_path = public, pg_temp as $$
  select e.name, d.published_labels from public.event_declarations d join public.events e on e.id = d.event_id
  where d.published_labels is not null order by e.start_time, e.name
$$;

revoke all on function public.result_desk(), public.result_action(uuid, integer, text, uuid[], uuid, text, jsonb), public.published_event_awards() from public, anon, authenticated;
grant execute on function public.result_desk(), public.result_action(uuid, integer, text, uuid[], uuid, text, jsonb) to authenticated;
grant execute on function public.published_event_awards() to anon, authenticated;
