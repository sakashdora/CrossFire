-- ==============================================================================
-- CROSSFIRE 2026 - Supabase Database Schema, Business Logic & RLS
-- Event Date: November 15, 2026 | Srusti Academy of Graduate Studies
--
-- Apply with:  npm run db:migrate   (uses DIRECT_URL from .env, server-side only)
--
-- Design rules
--   * This Supabase project is SHARED with another application. All Crossfire
--     objects use lowercase names that do not collide with the other app's
--     quoted PascalCase tables, and the auth trigger only acts on Crossfire signups.
--   * Browser roles (anon/authenticated) get READ access through RLS only.
--     Every write goes through a SECURITY DEFINER function below, which checks
--     auth.uid() and the caller's role stored in public.users (never client state).
--   * Business-rule violations raise SQLSTATE P0001 with a user-safe message.
--   * The script is idempotent: it can be re-run safely.
-- ==============================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
do $$ begin create type public.user_role as enum ('student', 'volunteer', 'judge', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin create type public.school_board as enum ('CBSE', 'ICSE', 'CHSE');
exception when duplicate_object then null; end $$;

do $$ begin create type public.event_format as enum ('solo', 'team');
exception when duplicate_object then null; end $$;

do $$ begin create type public.event_status as enum ('draft', 'open', 'registration_closed', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.registration_status as enum ('registered', 'confirmed', 'disqualified');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Profiles (1:1 with auth.users). Student-only fields are nullable so that
-- staff accounts and freshly created (e.g. Google) accounts can exist; the
-- registration logic requires them to be complete before joining events.
create table if not exists public.users (
    id               uuid primary key references auth.users(id) on delete cascade,
    email            text not null unique,
    first_name       text not null check (char_length(first_name) between 1 and 100),
    last_name        text not null default '' check (char_length(last_name) <= 100),
    contact_number   text check (contact_number ~ '^\+?[0-9]{10,13}$'),
    whatsapp_number  text check (whatsapp_number ~ '^\+?[0-9]{10,13}$'),
    date_of_birth    date,
    institute_name   text check (char_length(institute_name) between 2 and 255),
    city_town        text check (char_length(city_town) between 2 and 100),
    course_stream    text check (course_stream in ('12th Science', '12th Commerce', '12th Arts')),
    board            public.school_board,
    food_preference  text check (food_preference in ('Veg', 'Non-veg')),
    role             public.user_role not null default 'student',
    pass_number      integer generated always as identity unique,
    parent_consent   boolean not null default false,
    terms_accepted   boolean not null default false,
    checked_in_at    timestamptz,
    food_redeemed_at timestamptz,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    constraint users_food_requires_checkin check (food_redeemed_at is null or checked_in_at is not null)
);
create index if not exists users_role_idx on public.users(role);

-- 2.2 Events (the 6 competition tracks)
create table if not exists public.events (
    id                    uuid primary key default gen_random_uuid(),
    name                  text not null unique,
    slug                  text not null unique check (slug ~ '^[a-z0-9-]+$'),
    event_group           text not null check (event_group in ('Group A', 'Group B')),
    description           text not null,
    event_icon            text not null,
    event_type            public.event_format not null,
    team_size             integer not null,
    max_participants      integer not null default 100 check (max_participants > 0),
    current_participants  integer not null default 0 check (current_participants >= 0),
    prize_pool            integer not null check (prize_pool >= 0),
    prize_distribution    jsonb not null default '{}'::jsonb,
    scoring_rubric        jsonb not null check (jsonb_typeof(scoring_rubric -> 'criteria') = 'array'),
    start_time            timestamptz not null,
    end_time              timestamptz not null,
    registration_deadline timestamptz not null,
    venue_location        text not null,
    status                public.event_status not null default 'open',
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    constraint events_time_order check (end_time > start_time),
    constraint events_team_size_valid check (
        (event_type = 'solo' and team_size = 1) or (event_type = 'team' and team_size between 2 and 10)
    )
);
create index if not exists events_status_idx on public.events(status);

-- 2.3 Registrations (student <-> event)
create table if not exists public.registrations (
    id                 uuid primary key default gen_random_uuid(),
    user_id            uuid not null references public.users(id) on delete cascade,
    event_id           uuid not null references public.events(id) on delete restrict,
    team_name          text check (team_name is null or char_length(team_name) between 1 and 100),
    team_members       jsonb not null default '[]'::jsonb check (jsonb_typeof(team_members) = 'array'),
    status             public.registration_status not null default 'registered',
    media_url          text check (media_url is null or (media_url ~* '^https?://[^[:space:]]+$' and char_length(media_url) <= 500)),
    media_submitted_at timestamptz,
    room_reported_at   timestamptz,
    score              numeric(5,2) check (score is null or score between 0 and 100),
    score_locked       boolean not null default false,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    constraint registrations_user_event_key unique (user_id, event_id)
);
create index if not exists registrations_event_id_idx on public.registrations(event_id);
create index if not exists registrations_status_idx on public.registrations(status);

-- 2.4 Judge scores (one per judge per registration)
create table if not exists public.scores (
    id              uuid primary key default gen_random_uuid(),
    registration_id uuid not null references public.registrations(id) on delete cascade,
    judge_id        uuid not null references public.users(id) on delete restrict,
    rubric_scores   jsonb not null check (jsonb_typeof(rubric_scores) = 'object'),
    score           numeric(5,2) not null check (score between 0 and 100),
    comments        text check (comments is null or char_length(comments) <= 2000),
    is_final        boolean not null default true,
    submitted_at    timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    constraint scores_registration_judge_key unique (registration_id, judge_id)
);
create index if not exists scores_judge_id_idx on public.scores(judge_id);

-- 2.5 Judge assignments (admin assigns evaluators to tracks)
create table if not exists public.judge_assignments (
    id          uuid primary key default gen_random_uuid(),
    judge_id    uuid not null references public.users(id) on delete cascade,
    event_id    uuid not null references public.events(id) on delete cascade,
    assigned_by uuid references public.users(id) on delete set null,
    assigned_at timestamptz not null default now(),
    constraint judge_assignments_judge_event_key unique (judge_id, event_id)
);
create index if not exists judge_assignments_event_id_idx on public.judge_assignments(event_id);

-- 2.6 Notifications (admin broadcasts are fanned out per recipient => per-user read state)
create table if not exists public.notifications (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references public.users(id) on delete cascade,
    type             text not null check (type in ('registration', 'score', 'event_reminder', 'debate_topic', 'announcement')),
    title            text not null check (char_length(title) between 1 and 150),
    message          text not null check (char_length(message) between 1 and 2000),
    related_event_id uuid references public.events(id) on delete set null,
    created_by       uuid references public.users(id) on delete set null,
    read_at          timestamptz,
    created_at       timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

-- 2.7 Ground-ops incidents (volunteer -> admin)
create table if not exists public.incidents (
    id          uuid primary key default gen_random_uuid(),
    room        text not null check (char_length(room) between 1 and 100),
    issue       text not null check (char_length(issue) between 3 and 1000),
    status      text not null default 'Open' check (status in ('Open', 'Resolved')),
    reported_by uuid references public.users(id) on delete set null,
    resolved_by uuid references public.users(id) on delete set null,
    resolved_at timestamptz,
    created_at  timestamptz not null default now()
);
create index if not exists incidents_created_idx on public.incidents(created_at desc);

-- 2.8 Audit trail for privileged operations
create table if not exists public.audit_logs (
    id          uuid primary key default gen_random_uuid(),
    actor_id    uuid references public.users(id) on delete set null,
    action      text not null,
    entity_type text not null,
    entity_id   uuid not null,
    old_values  jsonb,
    new_values  jsonb,
    created_at  timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

-- ------------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public, pg_temp as $$
    select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select coalesce((select role = 'admin' from public.users where id = auth.uid()), false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select coalesce((select role in ('admin', 'judge', 'volunteer') from public.users where id = auth.uid()), false)
$$;

create or replace function public.is_ops_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select coalesce((select role in ('admin', 'volunteer') from public.users where id = auth.uid()), false)
$$;

-- Raises unless the caller is signed in with one of the given roles. Returns auth.uid().
create or replace function public._require_role(variadic p_roles public.user_role[])
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
    v_uid  uuid := auth.uid();
    v_role public.user_role;
begin
    if v_uid is null then
        raise exception 'Please sign in to continue.';
    end if;
    select role into v_role from public.users where id = v_uid;
    if v_role is null or not (v_role = any(p_roles)) then
        raise exception 'You are not authorized to perform this action.';
    end if;
    return v_uid;
end $$;

create or replace function public._audit(p_action text, p_entity_type text, p_entity_id uuid, p_old jsonb, p_new jsonb)
returns void language sql security definer set search_path = public, pg_temp as $$
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
    values ((select id from public.users where id = auth.uid()), p_action, p_entity_type, p_entity_id, p_old, p_new)
$$;

create or replace function public._normalize_phone(p text)
returns text language sql immutable as $$
    select nullif(regexp_replace(coalesce(p, ''), '[[:space:]()-]', '', 'g'), '')
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end $$;

-- ------------------------------------------------------------------------------
-- 4. PROFILE LOGIC
-- ------------------------------------------------------------------------------
-- Validates and upserts a profile. Never touches role, pass_number or ops fields.
create or replace function public._apply_profile(p_uid uuid, p_email text, p jsonb, p_require_student_fields boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_first   text := nullif(btrim(coalesce(p ->> 'first_name', '')), '');
    v_last    text := btrim(coalesce(p ->> 'last_name', ''));
    v_contact text := public._normalize_phone(p ->> 'contact_number');
    v_wa      text := public._normalize_phone(p ->> 'whatsapp_number');
    v_inst    text := nullif(btrim(coalesce(p ->> 'institute_name', '')), '');
    v_city    text := nullif(btrim(coalesce(p ->> 'city_town', '')), '');
    v_stream  text := nullif(p ->> 'course_stream', '');
    v_board   text := nullif(p ->> 'board', '');
    v_food    text := nullif(p ->> 'food_preference', '');
    v_dob     date;
    v_age     integer;
begin
    if p_email is null or btrim(p_email) = '' then
        raise exception 'A valid email address is required.';
    end if;
    if v_first is null then
        raise exception 'Please enter the Name of the Student.';
    end if;
    if char_length(v_first) > 100 or char_length(v_last) > 100 then
        raise exception 'Name is too long (maximum 100 characters).';
    end if;
    if v_contact is not null and v_contact !~ '^\+?[0-9]{10,13}$' then
        raise exception 'Please enter a valid contact number (10 to 13 digits).';
    end if;
    if v_wa is not null and v_wa !~ '^\+?[0-9]{10,13}$' then
        raise exception 'Please enter a valid WhatsApp number (10 to 13 digits).';
    end if;
    if v_inst is not null and char_length(v_inst) not between 2 and 255 then
        raise exception 'Please provide a valid Name of the Institute.';
    end if;
    if v_city is not null and char_length(v_city) not between 2 and 100 then
        raise exception 'Please enter a valid City / Town.';
    end if;
    if v_stream is not null and v_stream not in ('12th Science', '12th Commerce', '12th Arts') then
        raise exception 'Please choose a valid course stream.';
    end if;
    if v_board is not null and v_board not in ('CBSE', 'ICSE', 'CHSE') then
        raise exception 'Please choose a valid education board.';
    end if;
    if v_food is not null and v_food not in ('Veg', 'Non-veg') then
        raise exception 'Please choose a valid food preference.';
    end if;
    begin
        v_dob := nullif(p ->> 'date_of_birth', '')::date;
    exception when others then
        raise exception 'Please enter a valid date of birth.';
    end;
    if v_dob is not null then
        v_age := extract(year from age(current_date, v_dob))::integer;
        if v_age < 15 or v_age > 20 then
            raise exception 'Eligibility restriction: Only +2 Final Year students (ages 16 to 18) are eligible. Detected age: %', v_age;
        end if;
    end if;
    if p_require_student_fields and (v_contact is null or v_wa is null or v_inst is null
        or v_city is null or v_stream is null or v_food is null) then
        raise exception 'Please complete all required fields (contact number, WhatsApp number, institute, city, course and food preference).';
    end if;

    insert into public.users as u (id, email, first_name, last_name, contact_number, whatsapp_number,
        date_of_birth, institute_name, city_town, course_stream, board, food_preference,
        parent_consent, terms_accepted)
    values (p_uid, lower(btrim(p_email)), v_first, v_last, v_contact, v_wa, v_dob, v_inst, v_city,
        v_stream, v_board::public.school_board, v_food,
        coalesce(p ->> 'parent_consent', '') = 'true', coalesce(p ->> 'terms_accepted', '') = 'true')
    on conflict (id) do update set
        first_name      = excluded.first_name,
        last_name       = excluded.last_name,
        contact_number  = coalesce(excluded.contact_number, u.contact_number),
        whatsapp_number = coalesce(excluded.whatsapp_number, u.whatsapp_number),
        date_of_birth   = coalesce(excluded.date_of_birth, u.date_of_birth),
        institute_name  = coalesce(excluded.institute_name, u.institute_name),
        city_town       = coalesce(excluded.city_town, u.city_town),
        course_stream   = coalesce(excluded.course_stream, u.course_stream),
        board           = coalesce(excluded.board, u.board),
        food_preference = coalesce(excluded.food_preference, u.food_preference),
        parent_consent  = u.parent_consent or excluded.parent_consent,
        terms_accepted  = u.terms_accepted or excluded.terms_accepted;
end $$;

-- Auth trigger: create the profile for Crossfire signups only (metadata app = 'crossfire').
-- The role is ALWAYS 'student' (column default) - never taken from client metadata.
create or replace function public.crossfire_handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
    m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
    if coalesce(m ->> 'app', '') <> 'crossfire' then
        return new;
    end if;
    perform public._apply_profile(new.id, new.email, m, false);
    return new;
end $$;

drop trigger if exists crossfire_on_auth_user_created on auth.users;
create trigger crossfire_on_auth_user_created
    after insert on auth.users
    for each row execute function public.crossfire_handle_new_user();

-- For accounts without a profile (e.g. Google OAuth): create a minimal student profile.
create or replace function public.ensure_profile()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid  uuid := auth.uid();
    v_au   record;
    v_name text;
begin
    if v_uid is null then
        raise exception 'Please sign in to continue.';
    end if;
    if exists (select 1 from public.users where id = v_uid) then
        return;
    end if;
    select email, raw_user_meta_data into v_au from auth.users where id = v_uid;
    v_name := nullif(btrim(coalesce(v_au.raw_user_meta_data ->> 'full_name', v_au.raw_user_meta_data ->> 'name', '')), '');
    if v_name is null then
        v_name := split_part(v_au.email, '@', 1);
    end if;
    insert into public.users (id, email, first_name, last_name)
    values (v_uid, lower(v_au.email), left(split_part(v_name, ' ', 1), 100),
            left(btrim(substr(v_name, char_length(split_part(v_name, ' ', 1)) + 1)), 100))
    on conflict (id) do nothing;
end $$;

-- ------------------------------------------------------------------------------
-- 5. REGISTRATION LOGIC
-- ------------------------------------------------------------------------------
-- Single source of truth for registration eligibility (applies to every insert path).
create or replace function public.registrations_before_insert()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
    u       record;
    e       record;
    v_count integer;
begin
    -- Lock the student row: serialises concurrent registrations for the max-2 rule.
    select role, contact_number, whatsapp_number, institute_name, city_town, course_stream, food_preference
      into u from public.users where id = new.user_id for update;
    if not found then
        raise exception 'Profile not found. Please complete the registration form first.';
    end if;
    if u.role <> 'student' then
        raise exception 'Only student accounts can register for competitions.';
    end if;
    if u.contact_number is null or u.whatsapp_number is null or u.institute_name is null
       or u.city_town is null or u.course_stream is null or u.food_preference is null then
        raise exception 'Please complete the registration form (contact, institute, city, course and food preference) before registering for events.';
    end if;

    -- Lock the event row: serialises capacity checks.
    select * into e from public.events where id = new.event_id for update;
    if not found then
        raise exception 'Event not found.';
    end if;
    if e.status <> 'open' then
        raise exception 'Registration for % is closed.', e.name;
    end if;
    if now() > e.registration_deadline then
        raise exception 'The registration deadline for % has passed.', e.name;
    end if;
    if exists (select 1 from public.registrations where user_id = new.user_id and event_id = new.event_id) then
        raise exception 'You are already registered for %.', e.name;
    end if;
    if e.current_participants >= e.max_participants then
        raise exception '% is full. No more registrations are being accepted.', e.name;
    end if;
    select count(*) into v_count from public.registrations where user_id = new.user_id;
    if v_count >= 2 then
        raise exception 'A student may register for a maximum of 2 events only.';
    end if;
    return new;
end $$;

drop trigger if exists registrations_before_insert on public.registrations;
create trigger registrations_before_insert
    before insert on public.registrations
    for each row execute function public.registrations_before_insert();

-- Keep events.current_participants consistent with real registrations.
create or replace function public.registrations_sync_participants()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_event uuid := coalesce(new.event_id, old.event_id);
begin
    update public.events
       set current_participants = (select count(*) from public.registrations where event_id = v_event)
     where id = v_event;
    return null;
end $$;

drop trigger if exists registrations_sync_participants on public.registrations;
create trigger registrations_sync_participants
    after insert or delete on public.registrations
    for each row execute function public.registrations_sync_participants();

-- Replace a student's selection with p_slugs (1-2 events). Deselected events are
-- withdrawn unless scoring has already started for them.
create or replace function public._sync_student_events(p_uid uuid, p_slugs text[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_role  public.user_role;
    v_ids   uuid[];
    v_slugs text[];
    r       record;
begin
    select role into v_role from public.users where id = p_uid for update;
    if v_role is null then
        raise exception 'Profile not found.';
    end if;
    if v_role <> 'student' then
        raise exception 'Only student accounts can register for competitions.';
    end if;
    v_slugs := array(select distinct s from unnest(coalesce(p_slugs, '{}'::text[])) s where s is not null and s <> '');
    if cardinality(v_slugs) = 0 then
        raise exception 'Please select at least 1 competition to participate.';
    end if;
    if cardinality(v_slugs) > 2 then
        raise exception 'You can select a maximum of 2 competitions only.';
    end if;
    select array_agg(id) into v_ids from public.events where slug = any(v_slugs);
    if coalesce(cardinality(v_ids), 0) <> cardinality(v_slugs) then
        raise exception 'One or more selected competitions do not exist.';
    end if;

    for r in
        select reg.id, e.name,
               exists (select 1 from public.scores s where s.registration_id = reg.id) as has_scores
          from public.registrations reg join public.events e on e.id = reg.event_id
         where reg.user_id = p_uid and not (reg.event_id = any(v_ids))
    loop
        if r.has_scores then
            raise exception 'You cannot withdraw from % because scoring has already started.', r.name;
        end if;
        delete from public.registrations where id = r.id;
    end loop;

    insert into public.registrations (user_id, event_id)
    select p_uid, ev
      from unnest(v_ids) ev
     where not exists (select 1 from public.registrations x where x.user_id = p_uid and x.event_id = ev);
end $$;

-- Official registration form (Google-form fields) for the signed-in user.
create or replace function public.submit_registration_form(p_profile jsonb, p_event_slugs text[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid   uuid := auth.uid();
    v_email text;
    v_role  public.user_role;
begin
    if v_uid is null then
        raise exception 'Please sign in to continue.';
    end if;
    if p_profile is null or jsonb_typeof(p_profile) <> 'object' then
        raise exception 'Invalid registration data.';
    end if;
    select role into v_role from public.users where id = v_uid;
    if v_role is not null and v_role <> 'student' then
        raise exception 'Staff accounts cannot submit the student registration form.';
    end if;
    select email into v_email from auth.users where id = v_uid;
    perform public._apply_profile(v_uid, v_email, p_profile, true);
    perform public._sync_student_events(v_uid, p_event_slugs);
end $$;

-- Register for a single event from the Events directory.
create or replace function public.register_for_event(p_event_id uuid, p_team_name text default null, p_team_members jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid     uuid := public._require_role('student');
    e         record;
    v_members jsonb := '[]'::jsonb;
    v_team    text := null;
    m         jsonb;
    v_name    text;
    v_id      uuid;
begin
    select * into e from public.events where id = p_event_id;
    if not found then
        raise exception 'Event not found.';
    end if;
    if e.event_type = 'team' then
        if p_team_members is null or jsonb_typeof(p_team_members) <> 'array' then
            raise exception 'Invalid team members.';
        end if;
        if jsonb_array_length(p_team_members) <> e.team_size - 1 then
            raise exception '% requires % teammate name(s).', e.name, e.team_size - 1;
        end if;
        for m in select * from jsonb_array_elements(p_team_members) loop
            v_name := btrim(coalesce(m ->> 'name', ''));
            if char_length(v_name) not between 2 and 100 then
                raise exception 'Please enter a valid name for every teammate.';
            end if;
            v_members := v_members || jsonb_build_array(jsonb_build_object('name', v_name));
        end loop;
        v_team := nullif(btrim(coalesce(p_team_name, '')), '');
        if v_team is null or char_length(v_team) > 100 then
            raise exception 'Please enter a team name (maximum 100 characters).';
        end if;
    end if;

    insert into public.registrations (user_id, event_id, team_name, team_members)
    values (v_uid, p_event_id, v_team, v_members)
    returning id into v_id;
    return v_id;
end $$;

create or replace function public.withdraw_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('student');
    r     record;
begin
    select reg.id, reg.user_id, e.name into r
      from public.registrations reg join public.events e on e.id = reg.event_id
     where reg.id = p_registration_id for update of reg;
    if not found or r.user_id <> v_uid then
        raise exception 'Registration not found.';
    end if;
    if exists (select 1 from public.scores where registration_id = p_registration_id) then
        raise exception 'You cannot withdraw from % because scoring has already started.', r.name;
    end if;
    delete from public.registrations where id = p_registration_id;
end $$;

create or replace function public.submit_media(p_registration_id uuid, p_url text)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('student');
    v_url text := btrim(coalesce(p_url, ''));
    r     record;
    v_now timestamptz := now();
begin
    select reg.user_id, reg.score_locked, e.slug, e.name, e.registration_deadline into r
      from public.registrations reg join public.events e on e.id = reg.event_id
     where reg.id = p_registration_id for update of reg;
    if not found or r.user_id <> v_uid then
        raise exception 'Registration not found.';
    end if;
    if r.slug not in ('reels', 'poster-making') then
        raise exception '% does not accept media submissions.', r.name;
    end if;
    if v_url !~* '^https?://[^[:space:]]+$' or char_length(v_url) > 500 then
        raise exception 'Please enter a valid public link starting with http:// or https://';
    end if;
    if v_now > r.registration_deadline then
        raise exception 'The media submission deadline for % has passed.', r.name;
    end if;
    if r.score_locked then
        raise exception 'Your entry for % has already been evaluated.', r.name;
    end if;
    update public.registrations set media_url = v_url, media_submitted_at = v_now where id = p_registration_id;
    return v_now;
end $$;

-- ------------------------------------------------------------------------------
-- 6. SCORING LOGIC
-- ------------------------------------------------------------------------------
create or replace function public._recompute_registration_score(p_registration_id uuid)
returns void language sql security definer set search_path = public, pg_temp as $$
    update public.registrations
       set score        = (select round(avg(score), 2) from public.scores where registration_id = p_registration_id and is_final),
           score_locked = exists (select 1 from public.scores where registration_id = p_registration_id and is_final)
     where id = p_registration_id
$$;

create or replace function public.submit_score(p_registration_id uuid, p_rubric_scores jsonb, p_comments text default null)
returns numeric language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid      uuid := public._require_role('judge');
    r          record;
    c          jsonb;
    v_val      numeric;
    v_total    numeric := 0;
    v_keys     integer;
    v_existing record;
    v_comments text := nullif(btrim(coalesce(p_comments, '')), '');
    v_score_id uuid;
begin
    select reg.id, reg.status, reg.event_id, e.name, e.scoring_rubric into r
      from public.registrations reg join public.events e on e.id = reg.event_id
     where reg.id = p_registration_id for update of reg;
    if not found then
        raise exception 'Registration not found.';
    end if;
    if r.status = 'disqualified' then
        raise exception 'This participant has been disqualified.';
    end if;
    if not exists (select 1 from public.judge_assignments where judge_id = v_uid and event_id = r.event_id) then
        raise exception 'You are not assigned to judge %.', r.name;
    end if;
    if p_rubric_scores is null or jsonb_typeof(p_rubric_scores) <> 'object' then
        raise exception 'Invalid rubric scores.';
    end if;
    for c in select * from jsonb_array_elements(r.scoring_rubric -> 'criteria') loop
        if not (p_rubric_scores ? (c ->> 'name')) then
            raise exception 'Missing score for criterion "%".', c ->> 'name';
        end if;
        begin
            v_val := (p_rubric_scores ->> (c ->> 'name'))::numeric;
        exception when others then
            raise exception 'Invalid score for criterion "%".', c ->> 'name';
        end;
        if v_val is null or v_val < 0 or v_val > (c ->> 'max')::numeric then
            raise exception 'Score for "%" must be between 0 and %.', c ->> 'name', c ->> 'max';
        end if;
        v_total := v_total + v_val;
    end loop;
    select count(*) into v_keys from jsonb_object_keys(p_rubric_scores);
    if v_keys <> jsonb_array_length(r.scoring_rubric -> 'criteria') then
        raise exception 'Unexpected rubric criteria were submitted.';
    end if;
    if v_comments is not null and char_length(v_comments) > 2000 then
        raise exception 'Comments are too long (maximum 2000 characters).';
    end if;

    select * into v_existing from public.scores where registration_id = p_registration_id and judge_id = v_uid;
    if found and v_existing.is_final then
        raise exception 'Your score for this participant is already locked. Ask an admin to unlock it for revision.';
    end if;

    insert into public.scores (registration_id, judge_id, rubric_scores, score, comments, is_final)
    values (p_registration_id, v_uid, p_rubric_scores, v_total, v_comments, true)
    on conflict (registration_id, judge_id) do update
       set rubric_scores = excluded.rubric_scores, score = excluded.score,
           comments = excluded.comments, is_final = true, submitted_at = now()
    returning id into v_score_id;

    perform public._recompute_registration_score(p_registration_id);
    perform public._audit('score_submitted', 'score', v_score_id,
        case when v_existing.id is null then null else jsonb_build_object('score', v_existing.score) end,
        jsonb_build_object('score', v_total, 'registration_id', p_registration_id));
    return v_total;
end $$;

-- ------------------------------------------------------------------------------
-- 7. GROUND OPERATIONS (volunteer + admin)
-- ------------------------------------------------------------------------------
create or replace function public.staff_set_check_in(p_user_id uuid, p_checked_in boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('volunteer', 'admin');
    u     record;
    v_new timestamptz;
begin
    select role, checked_in_at, food_redeemed_at into u from public.users where id = p_user_id for update;
    if not found or u.role <> 'student' then
        raise exception 'Student not found.';
    end if;
    if not p_checked_in and u.food_redeemed_at is not null then
        raise exception 'Revoke the meal token before undoing the check-in.';
    end if;
    v_new := case when p_checked_in then coalesce(u.checked_in_at, now()) else null end;
    update public.users set checked_in_at = v_new where id = p_user_id;
    return v_new;
end $$;

create or replace function public.staff_set_food_redeemed(p_user_id uuid, p_redeemed boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('volunteer', 'admin');
    u     record;
    v_new timestamptz;
begin
    select role, checked_in_at, food_redeemed_at into u from public.users where id = p_user_id for update;
    if not found or u.role <> 'student' then
        raise exception 'Student not found.';
    end if;
    if p_redeemed then
        if u.checked_in_at is null then
            raise exception 'The student must be checked in at the gate before redeeming a meal.';
        end if;
        if u.food_redeemed_at is not null then
            raise exception 'Meal token already redeemed at %.',
                to_char(u.food_redeemed_at at time zone 'Asia/Kolkata', 'HH12:MI AM');
        end if;
        v_new := now();
    else
        v_new := null;
    end if;
    update public.users set food_redeemed_at = v_new where id = p_user_id;
    return v_new;
end $$;

create or replace function public.staff_set_room_reported(p_registration_id uuid, p_reported boolean)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('volunteer', 'admin');
    v_new timestamptz := case when p_reported then now() else null end;
begin
    update public.registrations set room_reported_at = v_new where id = p_registration_id;
    if not found then
        raise exception 'Registration not found.';
    end if;
    return v_new;
end $$;

create or replace function public.report_incident(p_room text, p_issue text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid   uuid := public._require_role('volunteer', 'admin');
    v_room  text := btrim(coalesce(p_room, ''));
    v_issue text := btrim(coalesce(p_issue, ''));
    v_id    uuid;
begin
    if char_length(v_room) not between 1 and 100 then
        raise exception 'Please choose a venue room.';
    end if;
    if char_length(v_issue) not between 3 and 1000 then
        raise exception 'Please describe the issue (3 to 1000 characters).';
    end if;
    insert into public.incidents (room, issue, reported_by) values (v_room, v_issue, v_uid) returning id into v_id;
    return v_id;
end $$;

-- ------------------------------------------------------------------------------
-- 8. NOTIFICATIONS & LEADERBOARD
-- ------------------------------------------------------------------------------
create or replace function public.mark_notifications_read()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := auth.uid();
    v_n   integer;
begin
    if v_uid is null then
        raise exception 'Please sign in to continue.';
    end if;
    update public.notifications set read_at = now() where user_id = v_uid and read_at is null;
    get diagnostics v_n = row_count;
    return v_n;
end $$;

-- Public leaderboard: exposes only name, institute, board and scores (no contact data).
create or replace function public.get_leaderboard()
returns table (rank bigint, participant_name text, school_name text, board text,
               events_count bigint, total_score numeric, is_current_user boolean)
language sql stable security definer set search_path = public, pg_temp as $$
    select rank() over (order by sum(r.score) desc) as rank,
           btrim(u.first_name || ' ' || u.last_name) as participant_name,
           coalesce(u.institute_name, '') as school_name,
           u.board::text as board,
           count(*) as events_count,
           sum(r.score) as total_score,
           coalesce(u.id = auth.uid(), false) as is_current_user
      from public.registrations r
      join public.users u on u.id = r.user_id
     where r.score is not null and r.status <> 'disqualified'
     group by u.id
     order by 6 desc, 2
     limit 100
$$;

-- ------------------------------------------------------------------------------
-- 9. ADMIN OPERATIONS
-- ------------------------------------------------------------------------------
create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
begin
    return jsonb_build_object(
        'total_students',      (select count(*) from public.users where role = 'student'),
        'registered_students', (select count(distinct user_id) from public.registrations),
        'total_registrations', (select count(*) from public.registrations),
        'total_capacity',      (select coalesce(sum(max_participants), 0) from public.events),
        'checked_in',          (select count(*) from public.users where role = 'student' and checked_in_at is not null),
        'food_redeemed',       (select count(*) from public.users where role = 'student' and food_redeemed_at is not null),
        'prize_total',         (select coalesce(sum(prize_pool), 0) from public.events),
        'open_incidents',      (select count(*) from public.incidents where status = 'Open'),
        'stream_counts',       (select coalesce(jsonb_object_agg(course_stream, n), '{}'::jsonb)
                                  from (select course_stream, count(*) as n from public.users
                                         where role = 'student' and course_stream is not null
                                         group by course_stream) s),
        'events', (select coalesce(jsonb_agg(to_jsonb(x) order by x.start_time), '[]'::jsonb) from (
            select e.id, e.name, e.slug, e.event_type, e.team_size, e.status, e.max_participants,
                   e.current_participants, e.start_time,
                   (select count(*) from public.registrations r where r.event_id = e.id and r.score_locked) as scored,
                   (select coalesce(jsonb_agg(jsonb_build_object('id', u.id,
                            'name', btrim(u.first_name || ' ' || u.last_name)) order by u.first_name), '[]'::jsonb)
                      from public.judge_assignments ja join public.users u on u.id = ja.judge_id
                     where ja.event_id = e.id) as judges
              from public.events e) x)
    );
end $$;

create or replace function public.admin_set_event_status(p_event_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
    v_old public.event_status;
begin
    if p_status is null or p_status not in ('draft', 'open', 'registration_closed', 'in_progress', 'completed') then
        raise exception 'Invalid event status.';
    end if;
    select status into v_old from public.events where id = p_event_id for update;
    if not found then
        raise exception 'Event not found.';
    end if;
    update public.events set status = p_status::public.event_status where id = p_event_id;
    perform public._audit('event_status_changed', 'event', p_event_id,
        jsonb_build_object('status', v_old), jsonb_build_object('status', p_status));
end $$;

create or replace function public.admin_set_registration_status(p_registration_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
    v_old public.registration_status;
begin
    if p_status is null or p_status not in ('registered', 'confirmed', 'disqualified') then
        raise exception 'Invalid registration status.';
    end if;
    select status into v_old from public.registrations where id = p_registration_id for update;
    if not found then
        raise exception 'Registration not found.';
    end if;
    update public.registrations set status = p_status::public.registration_status where id = p_registration_id;
    perform public._audit('registration_status_changed', 'registration', p_registration_id,
        jsonb_build_object('status', v_old), jsonb_build_object('status', p_status));
end $$;

create or replace function public.admin_delete_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
    v_old jsonb;
begin
    select to_jsonb(r) into v_old from public.registrations r where id = p_registration_id for update;
    if v_old is null then
        raise exception 'Registration not found.';
    end if;
    delete from public.registrations where id = p_registration_id;
    perform public._audit('registration_deleted', 'registration', p_registration_id, v_old, null);
end $$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
    v_old public.user_role;
begin
    if p_role is null or p_role not in ('student', 'volunteer', 'judge', 'admin') then
        raise exception 'Invalid role.';
    end if;
    if p_user_id = v_uid then
        raise exception 'You cannot change your own role.';
    end if;
    select role into v_old from public.users where id = p_user_id for update;
    if not found then
        raise exception 'User not found.';
    end if;
    if v_old = p_role::public.user_role then
        return;
    end if;
    if p_role <> 'student' and exists (select 1 from public.registrations where user_id = p_user_id) then
        raise exception 'This user has event registrations. Remove them before assigning a staff role.';
    end if;
    if v_old = 'admin' and (select count(*) from public.users where role = 'admin') <= 1 then
        raise exception 'At least one admin account must remain.';
    end if;
    if v_old = 'judge' and exists (select 1 from public.scores where judge_id = p_user_id) then
        raise exception 'This judge has submitted scores and cannot be reassigned to another role.';
    end if;
    if p_role <> 'judge' then
        delete from public.judge_assignments where judge_id = p_user_id;
    end if;
    update public.users set role = p_role::public.user_role where id = p_user_id;
    perform public._audit('user_role_changed', 'user', p_user_id,
        jsonb_build_object('role', v_old), jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_assign_judge(p_event_id uuid, p_judge_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
begin
    if not exists (select 1 from public.users where id = p_judge_id and role = 'judge') then
        raise exception 'Selected user is not a judge.';
    end if;
    if not exists (select 1 from public.events where id = p_event_id) then
        raise exception 'Event not found.';
    end if;
    insert into public.judge_assignments (judge_id, event_id, assigned_by)
    values (p_judge_id, p_event_id, v_uid)
    on conflict (judge_id, event_id) do nothing;
    perform public._audit('judge_assigned', 'event', p_event_id, null, jsonb_build_object('judge_id', p_judge_id));
end $$;

create or replace function public.admin_unassign_judge(p_event_id uuid, p_judge_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
begin
    delete from public.judge_assignments where event_id = p_event_id and judge_id = p_judge_id;
    if not found then
        raise exception 'Assignment not found.';
    end if;
    perform public._audit('judge_unassigned', 'event', p_event_id, jsonb_build_object('judge_id', p_judge_id), null);
end $$;

create or replace function public.admin_unlock_score(p_score_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
    s     record;
begin
    select id, registration_id, score, is_final into s from public.scores where id = p_score_id for update;
    if not found then
        raise exception 'Score not found.';
    end if;
    if not s.is_final then
        raise exception 'This score is already unlocked.';
    end if;
    update public.scores set is_final = false where id = p_score_id;
    perform public._recompute_registration_score(s.registration_id);
    perform public._audit('score_unlocked', 'score', p_score_id,
        jsonb_build_object('score', s.score, 'is_final', true), jsonb_build_object('is_final', false));
end $$;

-- Fan-out an in-app announcement. p_target: 'all_students' | 'judges' | 'volunteers' | 'event:<slug>'
create or replace function public.admin_broadcast(p_target text, p_title text, p_message text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid     uuid := public._require_role('admin');
    v_title   text := btrim(coalesce(p_title, ''));
    v_msg     text := btrim(coalesce(p_message, ''));
    v_event   record;
    v_type    text := 'announcement';
    v_n       integer;
begin
    if char_length(v_title) not between 1 and 150 then
        raise exception 'Please enter a title (maximum 150 characters).';
    end if;
    if char_length(v_msg) not between 1 and 2000 then
        raise exception 'Please enter a message (maximum 2000 characters).';
    end if;

    if p_target = 'all_students' then
        insert into public.notifications (user_id, type, title, message, created_by)
        select id, v_type, v_title, v_msg, v_uid from public.users where role = 'student';
    elsif p_target in ('judges', 'volunteers') then
        insert into public.notifications (user_id, type, title, message, created_by)
        select id, v_type, v_title, v_msg, v_uid from public.users
         where role = (case when p_target = 'judges' then 'judge' else 'volunteer' end)::public.user_role;
    elsif p_target like 'event:%' then
        select id, slug into v_event from public.events where slug = substr(p_target, 7);
        if not found then
            raise exception 'Event not found.';
        end if;
        if v_event.slug = 'debate' then
            v_type := 'debate_topic';
        end if;
        insert into public.notifications (user_id, type, title, message, related_event_id, created_by)
        select r.user_id, v_type, v_title, v_msg, v_event.id, v_uid
          from public.registrations r where r.event_id = v_event.id and r.status <> 'disqualified';
    else
        raise exception 'Invalid broadcast audience.';
    end if;
    get diagnostics v_n = row_count;
    perform public._audit('broadcast_sent', 'notification', gen_random_uuid(), null,
        jsonb_build_object('target', p_target, 'title', v_title, 'recipients', v_n));
    return v_n;
end $$;

create or replace function public.admin_resolve_incident(p_incident_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
    v_uid uuid := public._require_role('admin');
begin
    update public.incidents set status = 'Resolved', resolved_by = v_uid, resolved_at = now()
     where id = p_incident_id and status = 'Open';
    if not found then
        raise exception 'Incident not found or already resolved.';
    end if;
end $$;

-- ------------------------------------------------------------------------------
-- 10. updated_at TRIGGERS
-- ------------------------------------------------------------------------------
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at before update on public.registrations for each row execute function public.set_updated_at();
drop trigger if exists scores_set_updated_at on public.scores;
create trigger scores_set_updated_at before update on public.scores for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (read access only; no write policies => writes only via RPCs)
-- ------------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.events            enable row level security;
alter table public.registrations     enable row level security;
alter table public.scores            enable row level security;
alter table public.judge_assignments enable row level security;
alter table public.notifications     enable row level security;
alter table public.incidents         enable row level security;
alter table public.audit_logs        enable row level security;

drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
    using (id = auth.uid() or public.is_staff());

drop policy if exists events_select on public.events;
create policy events_select on public.events for select to anon, authenticated
    using (status <> 'draft' or public.is_admin());

drop policy if exists registrations_select on public.registrations;
create policy registrations_select on public.registrations for select to authenticated
    using (user_id = auth.uid() or public.is_staff());

drop policy if exists scores_select on public.scores;
create policy scores_select on public.scores for select to authenticated
    using (judge_id = auth.uid() or public.is_admin());

drop policy if exists judge_assignments_select on public.judge_assignments;
create policy judge_assignments_select on public.judge_assignments for select to authenticated
    using (judge_id = auth.uid() or public.is_admin());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
    using (user_id = auth.uid());

drop policy if exists incidents_select on public.incidents;
create policy incidents_select on public.incidents for select to authenticated
    using (public.is_ops_staff());

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
    using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 12. PRIVILEGES (Supabase grants ALL to anon/authenticated by default - tighten)
-- ------------------------------------------------------------------------------
revoke all on table public.users, public.events, public.registrations, public.scores,
    public.judge_assignments, public.notifications, public.incidents, public.audit_logs
    from anon, authenticated;

grant select on table public.events to anon, authenticated;
grant select on table public.users, public.registrations, public.scores, public.judge_assignments,
    public.notifications, public.incidents, public.audit_logs to authenticated;

do $$
declare
    f record;
    v_internal text[] := array['_require_role', '_audit', '_apply_profile', '_sync_student_events',
        '_recompute_registration_score', 'crossfire_handle_new_user', 'registrations_before_insert',
        'registrations_sync_participants', 'set_updated_at', '_normalize_phone'];
    v_public text[] := array['get_leaderboard', 'current_user_role', 'is_admin', 'is_staff', 'is_ops_staff'];
    v_authenticated text[] := array['ensure_profile', 'submit_registration_form', 'register_for_event',
        'withdraw_registration', 'submit_media', 'submit_score', 'staff_set_check_in',
        'staff_set_food_redeemed', 'staff_set_room_reported', 'report_incident', 'mark_notifications_read',
        'admin_overview', 'admin_set_event_status', 'admin_set_registration_status', 'admin_delete_registration',
        'admin_set_user_role', 'admin_assign_judge', 'admin_unassign_judge', 'admin_unlock_score',
        'admin_broadcast', 'admin_resolve_incident'];
begin
    for f in
        select p.oid::regprocedure as sig, p.proname
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public'
           and p.proname = any(v_internal || v_public || v_authenticated)
    loop
        execute format('revoke all on function %s from public, anon, authenticated', f.sig);
        if f.proname = any(v_public) then
            execute format('grant execute on function %s to anon, authenticated', f.sig);
        elsif f.proname = any(v_authenticated) then
            execute format('grant execute on function %s to authenticated', f.sig);
        end if;
    end loop;
end $$;

-- ------------------------------------------------------------------------------
-- 13. SEED: the 6 official CROSSFIRE 2026 competitions
-- ------------------------------------------------------------------------------
insert into public.events (name, slug, event_group, description, event_icon, event_type, team_size,
    max_participants, prize_pool, prize_distribution, scoring_rubric, start_time, end_time,
    registration_deadline, venue_location)
values
(
    'Quiz', 'quiz', 'Group A',
    'Written test preliminary round followed by campus buzzer final round. Top 6 teams qualify for the final round. Trophy & cash awards for Champion & Runners-ups.',
    'Brain', 'team', 2, 60, 24500, '{"1st": 6000, "2nd": 4000, "3rd": 3500, "4th": 1500, "5th": 1500, "6th": 1500}',
    '{"criteria": [{"name": "Accuracy", "weight": 40, "max": 40, "description": "Correct answers and factual precision in written & buzzer rounds"}, {"name": "Speed", "weight": 30, "max": 30, "description": "Reaction time during direct buzzer questions"}, {"name": "Final Round Answers", "weight": 30, "max": 30, "description": "Performance in campus buzzer finals"}]}',
    '2026-11-15 10:30:00+05:30', '2026-11-15 12:00:00+05:30', '2026-11-14 23:59:59+05:30', 'Srusti Campus - Main Auditorium A'
),
(
    'Debate', 'debate', 'Group A',
    'Argumentation & public speaking. Debate topic shall be communicated via mobile WhatsApp no. / SMS on event morning. Prep time: 15 mins (Opening: 2 min, Rebuttal: 1 min).',
    'MessageSquareQuote', 'solo', 1, 40, 7000, '{"1st": 4000, "2nd": 2000, "3rd": 1000}',
    '{"criteria": [{"name": "Argumentation & Logic", "weight": 40, "max": 40, "description": "Structural rigor, logic, and factual backing"}, {"name": "Clarity & Expression", "weight": 30, "max": 30, "description": "Voice modulation, body language, and fluency"}, {"name": "Rebuttal Strength", "weight": 30, "max": 30, "description": "Refutation of opposing arguments and speed of thought"}]}',
    '2026-11-15 13:30:00+05:30', '2026-11-15 14:30:00+05:30', '2026-11-14 23:59:59+05:30', 'Srusti Campus - Management Seminar Hall B'
),
(
    'Poster Making', 'poster-making', 'Group A',
    'Artistic design & creative expression. Theme announced at event start. Physical artwork created on campus using chart/canvas with acrylics, poster colors, or sketches.',
    'Palette', 'solo', 1, 60, 7000, '{"1st": 4000, "2nd": 2000, "3rd": 1000}',
    '{"criteria": [{"name": "Design & Aesthetics", "weight": 35, "max": 35, "description": "Visual composition, color balance, and style"}, {"name": "Message Clarity", "weight": 35, "max": 35, "description": "Theme adherence, relevance, and emotional impact"}, {"name": "Creativity & Innovation", "weight": 30, "max": 30, "description": "Originality of concept and creative finesse"}]}',
    '2026-11-15 10:00:00+05:30', '2026-11-15 14:30:00+05:30', '2026-11-14 23:59:59+05:30', 'Srusti Campus - Creative Art Studio Block C'
),
(
    'Treasure Hunt', 'treasure-hunt', 'Group B',
    'Physical puzzle solving across campus in teams of 3 students. Multi-station treasure hunt decoding cryptic clues, riddle trails, and racing against time.',
    'Compass', 'team', 3, 90, 8000, '{"1st": 3000, "2nd": 2000, "3rd": 1000}',
    '{"criteria": [{"name": "Speed (Checkpoint Finish)", "weight": 50, "max": 50, "description": "Overall race completion time across all stations"}, {"name": "Accuracy (Clues & Riddles)", "weight": 50, "max": 50, "description": "Solving riddles and clues without hints or penalties"}, {"name": "Bonus Checkpoint Points", "weight": 10, "max": 10, "description": "Bonus points for first 3 completing teams"}]}',
    '2026-11-15 15:00:00+05:30', '2026-11-15 16:00:00+05:30', '2026-11-14 23:59:59+05:30', 'Srusti Campus - Central Campus Quadrangle'
),
(
    'Ramp Walk', 'ramp-walk', 'Group B',
    'Fashion & personality showcase. Live performance on stage (2 mins per participant). Celebrate confidence, poise, styling, and charismatic stage presence.',
    'Sparkles', 'solo', 1, 50, 9000, '{"1st": 3000, "2nd": 2000, "3rd": 1000}',
    '{"criteria": [{"name": "Appearance & Confidence", "weight": 30, "max": 30, "description": "Attire elegance, styling, grooming, and self-assurance"}, {"name": "Stage Presence", "weight": 30, "max": 30, "description": "Walk posture, stride confidence, and stage connection"}, {"name": "Personality & Expression", "weight": 40, "max": 40, "description": "Charisma, aura, authenticity, and spontaneous charm"}]}',
    '2026-11-15 11:30:00+05:30', '2026-11-15 12:30:00+05:30', '2026-11-14 23:59:59+05:30', 'Srusti Campus - Central Open Air Amphitheatre'
),
(
    'Reels', 'reels', 'Group B',
    'Short video content creation (30-60 seconds). Reels to be shot in Srusti Campus on the same day. Showcase creative visual storytelling and youth dynamism.',
    'Video', 'solo', 1, 80, 9000, '{"1st": 3000, "2nd": 2000, "3rd": 1000}',
    '{"criteria": [{"name": "Creativity", "weight": 35, "max": 35, "description": "Fresh perspective, concept originality, and storytelling"}, {"name": "Content Quality", "weight": 35, "max": 35, "description": "Visual framing, theme resonance, and engagement"}, {"name": "Execution", "weight": 30, "max": 30, "description": "Editing cuts, rhythm, color grading, and audio sync"}]}',
    '2026-11-15 10:00:00+05:30', '2026-11-15 14:30:00+05:30', '2026-11-14 18:00:00+05:30', 'Srusti Campus - Media Lab & Studio Block'
)
on conflict (slug) do update set
    name = excluded.name,
    event_group = excluded.event_group,
    description = excluded.description,
    event_icon = excluded.event_icon,
    event_type = excluded.event_type,
    team_size = excluded.team_size,
    max_participants = excluded.max_participants,
    prize_pool = excluded.prize_pool,
    prize_distribution = excluded.prize_distribution,
    scoring_rubric = excluded.scoring_rubric,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    registration_deadline = excluded.registration_deadline,
    venue_location = excluded.venue_location;
