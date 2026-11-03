-- One declaration and one assigned coordinator per event. All writes use the
-- locked, version-checked RPC below. Public reads expose approved labels only.
create table if not exists public.event_declarations (
  event_id uuid primary key references public.events(id) on delete cascade,
  coordinator uuid references public.users(id) on delete set null,
  version integer not null default 0,
  state text not null default 'Draft' check(state in ('Draft','In review','Changes requested','Published')),
  picks uuid[] not null default array[null,null,null,null]::uuid[],
  labels text[], feedback text not null default '',
  submitted_by uuid references public.users(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null
);
alter table public.event_declarations enable row level security;
revoke all on public.event_declarations from public,anon,authenticated;

-- Extend only the staff role allowlists in the installed operations functions.
do $$
declare f regprocedure; body text;
begin
  foreach f in array array['public.crossfire_ops_provision(jsonb)'::regprocedure,
    'public.crossfire_ops_action(text,jsonb)'::regprocedure,'public.crossfire_ops_snapshot()'::regprocedure] loop
    body:=pg_get_functiondef(f);
    body:=replace(body,'''judge'',''vip_guest''','''judge'',''coordinator'',''vip_guest''');
    body:=replace(body,'''judge'',''volunteer'',''vip_guest''','''judge'',''coordinator'',''volunteer'',''vip_guest''');
    if strpos(body,'''coordinator''')=0 then raise exception 'Unexpected staff role checks in %',f; end if;
    execute body;
  end loop;
end $$;

-- Removing staff access also releases their event assignments. A subsequent
-- reactivation requires an explicit assignment, as it does for judges.
create or replace function public._release_coordinator_events()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.event_declarations set coordinator=null, version=version+1 where coordinator=new.id;
  return new;
end $$;
revoke all on function public._release_coordinator_events() from public,anon,authenticated;
drop trigger if exists release_coordinator_events on public.users;
create trigger release_coordinator_events after update of role,active on public.users
for each row when (old.role='coordinator' and (new.role<>'coordinator' or not new.active))
execute function public._release_coordinator_events();

create or replace function public.result_desk()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('coordinator','admin','super_admin'); manager boolean:=public.is_admin();
begin
  return jsonb_build_object('events',coalesce((select jsonb_agg(jsonb_build_object(
    'id',e.id,'name',e.name,'day', (e.start_time at time zone 'Asia/Kolkata')::date,
    'event_day',(now() at time zone 'Asia/Kolkata')::date between (e.start_time at time zone 'Asia/Kolkata')::date and (e.end_time at time zone 'Asia/Kolkata')::date,
    'coordinator',d.coordinator,'version',coalesce(d.version,0),'state',coalesce(d.state,'Draft'),
    'picks',coalesce(d.picks,array[null,null,null,null]::uuid[]),'labels',d.labels,'feedback',coalesce(d.feedback,''),
    'entries',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',coalesce(nullif(r.team_name,''),trim(concat_ws(' ',u.first_name,u.last_name))),'school',u.institute_name) order by u.first_name,r.id)
      from public.registrations r join public.users u on u.id=r.user_id where r.event_id=e.id and r.status in ('registered','confirmed') and u.active),'[]'::jsonb)
  ) order by e.start_time,e.name) from public.events e left join public.event_declarations d on d.event_id=e.id
    where manager or d.coordinator=actor),'[]'::jsonb),
    'staff',case when manager then coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',trim(concat_ws(' ',u.first_name,u.last_name))) order by u.first_name) from public.users u where u.role='coordinator' and u.active),'[]'::jsonb) else '[]'::jsonb end);
end $$;

create or replace function public.result_action(p_event uuid,p_version integer,p_action text,p_picks uuid[] default null,p_coordinator uuid default null,p_feedback text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=public._require_role('coordinator','admin','super_admin'); manager boolean:=public.is_admin(); d public.event_declarations; names text[]; selections uuid[]; event_day boolean;
begin
  if p_action is null or p_action not in ('assign','save','submit','approve','return') then raise exception 'Unknown result action.'; end if;
  if (p_action in ('assign','approve','return')) <> manager then raise exception 'Your role cannot perform this action.'; end if;
  if manager then insert into public.event_declarations(event_id) values(p_event) on conflict do nothing; end if;
  select * into d from public.event_declarations where event_id=p_event for update;
  if not found or (not manager and d.coordinator is distinct from actor) then raise exception 'This event is not assigned to you.'; end if;
  if d.version is distinct from p_version then raise exception 'The declaration changed. Refresh before trying again.'; end if;
  if p_action='assign' then
    if p_coordinator is not null and not exists(select 1 from public.users where id=p_coordinator and active and role='coordinator') then raise exception 'Choose an active coordinator.'; end if;
    update public.event_declarations set coordinator=p_coordinator,version=version+1 where event_id=p_event;
  else
    if manager and d.state<>'In review' then raise exception 'Only a submitted declaration can be reviewed.'; end if;
    if manager and d.submitted_by=actor then raise exception 'Another administrator must review your declaration.'; end if;
    if not manager and d.state not in ('Draft','Changes requested') then raise exception 'This declaration is locked.'; end if;
    if p_action='return' then
      if nullif(trim(p_feedback),'') is null or length(p_feedback)>1000 then raise exception 'Enter a review reason of up to 1000 characters.'; end if;
      update public.event_declarations set state='Changes requested',reviewed_by=actor,feedback=trim(p_feedback),version=version+1 where event_id=p_event;
    else
      selections:=case when manager then d.picks else p_picks end;
      if coalesce(array_length(selections,1),0)<>4 or array_ndims(selections)<>1 then raise exception 'Choose four award slots.'; end if;
      select array_agg(coalesce(nullif(r.team_name,''),trim(concat_ws(' ',u.first_name,u.last_name))) order by x.ord)
        into names from unnest(selections) with ordinality x(id,ord) left join public.registrations r on r.id=x.id and r.event_id=p_event and r.status in ('registered','confirmed') left join public.users u on u.id=r.user_id and u.active;
      if exists(select 1 from unnest(selections) x where x is not null and not exists(select 1 from public.registrations r join public.users u on u.id=r.user_id where r.id=x and r.event_id=p_event and r.status in ('registered','confirmed') and u.active)) then raise exception 'Choose eligible entries registered for this event.'; end if;
      if (select count(distinct x)<>count(x) from unnest(selections[1:3]) x) then raise exception 'First, second and third place must be different entries.'; end if;
      if p_action<>'save' and array_position(selections,null) is not null then raise exception 'Choose an entry for each award.'; end if;
      if p_action='submit' then
        select (now() at time zone 'Asia/Kolkata')::date between (start_time at time zone 'Asia/Kolkata')::date and (end_time at time zone 'Asia/Kolkata')::date into event_day from public.events where id=p_event;
        if not event_day and d.state<>'Changes requested' then raise exception 'Submit on the scheduled event day.'; end if;
      end if;
      update public.event_declarations set picks=selections,version=version+1,
        state=case p_action when 'approve' then 'Published' when 'submit' then 'In review' else d.state end,
        feedback=case when p_action='save' then d.feedback else '' end,
        submitted_by=case when p_action='submit' then actor else d.submitted_by end,
        reviewed_by=case when manager then actor else null end,
        labels=case when manager then names else null end where event_id=p_event;
    end if;
  end if;
  perform public._audit('result.'||p_action,'event',p_event,to_jsonb(d.version),to_jsonb(d.version+1));
end $$;

create or replace function public.published_event_awards()
returns table(event_name text, awards text[]) language sql stable security definer set search_path=public,pg_temp as $$
  select e.name,d.labels from public.event_declarations d join public.events e on e.id=d.event_id where d.state='Published' order by e.start_time,e.name
$$;
revoke all on function public.result_desk(),public.result_action(uuid,integer,text,uuid[],uuid,text),public.published_event_awards() from public,anon,authenticated;
grant execute on function public.result_desk(),public.result_action(uuid,integer,text,uuid[],uuid,text) to authenticated;
grant execute on function public.published_event_awards() to anon,authenticated;
