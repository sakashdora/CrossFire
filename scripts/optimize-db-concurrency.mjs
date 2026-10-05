import { getClient } from './db.mjs';

const client = getClient();

async function main() {
  await client.connect();
  console.log('[OPTIMIZE] Connected to PostgreSQL...');

  try {
    await client.query('BEGIN');

    // 1. SECURITY TIGHTENING: Revoke anon from admins_view & staff_view
    console.log('[SECURITY] Revoking public/anon access from admin & staff views...');
    await client.query(`REVOKE SELECT ON public.admins_view FROM anon;`);
    await client.query(`REVOKE SELECT ON public.staff_view FROM anon;`);
    await client.query(`GRANT SELECT ON public.admins_view TO authenticated, service_role;`);
    await client.query(`GRANT SELECT ON public.staff_view TO authenticated, service_role;`);

    // 2. SHARED PARENT EMAIL SUPPORT:
    // Drop global unique constraint on users(email) so siblings can register under parent's email.
    // Enforce unique email ONLY for admin and super_admin.
    console.log('[SCHEMA] Updating email uniqueness: allow shared parent email for students...');
    await client.query(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;`);
    await client.query(`DROP INDEX IF EXISTS public.users_email_key;`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_staff_email_unique 
      ON public.users(email) 
      WHERE role IN ('admin', 'super_admin');
    `);

    // 3. HIGH-CONCURRENCY COMPOSITE INDEXES
    console.log('[INDEXES] Creating high-concurrency composite indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS users_role_created_idx ON public.users(role, created_at DESC);
      CREATE INDEX IF NOT EXISTS users_institute_idx ON public.users(institute_name);
      CREATE INDEX IF NOT EXISTS users_email_lower_idx ON public.users(lower(email));
      CREATE INDEX IF NOT EXISTS users_contact_idx ON public.users(contact_number);
      CREATE INDEX IF NOT EXISTS registrations_user_status_idx ON public.registrations(user_id, status);
      CREATE INDEX IF NOT EXISTS registrations_event_status_idx ON public.registrations(event_id, status);
    `);

    // 4. ATOMIC EVENT INCREMENT & DEADLOCK ELIMINATION
    console.log('[CONCURRENCY] Updating trigger to atomic increment to eliminate event row contention...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.registrations_sync_participants()
      RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_event uuid;
      BEGIN
          IF (TG_OP = 'INSERT') THEN
              v_event := new.event_id;
              UPDATE public.events
                 SET current_participants = current_participants + 1,
                     updated_at = now()
               WHERE id = v_event;
          ELSIF (TG_OP = 'DELETE') THEN
              v_event := old.event_id;
              UPDATE public.events
                 SET current_participants = greatest(0, current_participants - 1),
                     updated_at = now()
               WHERE id = v_event;
          END IF;
          RETURN NULL;
      END $$;
    `);

    // 5. DEADLOCK-PROOF REGISTRATION: Sort event locking order in _sync_student_events
    console.log('[CONCURRENCY] Sorting event inserts in _sync_student_events to eliminate lock order reversal deadlocks...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public._sync_student_events(p_uid uuid, p_slugs text[])
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_role    public.user_role;
          v_ids     uuid[];
          v_slugs   text[];
          v_count_a integer;
          v_count_b integer;
          r         record;
      BEGIN
          SELECT role INTO v_role FROM public.users WHERE id = p_uid FOR UPDATE;
          IF v_role IS NULL THEN
              RAISE EXCEPTION 'Profile not found.';
          END IF;
          IF v_role <> 'student' THEN
              RAISE EXCEPTION 'Only student accounts can register for competitions.';
          END IF;
          v_slugs := array(SELECT DISTINCT s FROM unnest(coalesce(p_slugs, '{}'::text[])) s WHERE s IS NOT NULL AND s <> '');
          IF cardinality(v_slugs) = 0 THEN
              RAISE EXCEPTION 'Please select at least 1 competition to participate.';
          END IF;

          SELECT count(*) FILTER (WHERE event_group = 'Group A'),
                 count(*) FILTER (WHERE event_group = 'Group B')
            INTO v_count_a, v_count_b
            FROM public.events
           WHERE slug = any(v_slugs);

          IF v_count_a > 2 THEN
              RAISE EXCEPTION 'You can select a maximum of 2 competitions from Group A.';
          END IF;
          IF v_count_b > 2 THEN
              RAISE EXCEPTION 'You can select a maximum of 2 competitions from Group B.';
          END IF;

          -- Always order event IDs deterministically to prevent deadlocks across concurrent transactions
          SELECT array_agg(id ORDER BY id) INTO v_ids FROM public.events WHERE slug = any(v_slugs);
          IF coalesce(cardinality(v_ids), 0) <> cardinality(v_slugs) THEN
              RAISE EXCEPTION 'One or more selected competitions do not exist.';
          END IF;

          FOR r IN
              SELECT reg.id, e.name,
                     exists (SELECT 1 FROM public.scores s WHERE s.registration_id = reg.id) AS has_scores
                FROM public.registrations reg JOIN public.events e ON e.id = reg.event_id
               WHERE reg.user_id = p_uid AND not (reg.event_id = any(v_ids))
               ORDER BY reg.event_id
          LOOP
              IF r.has_scores THEN
                  RAISE EXCEPTION 'You cannot withdraw from % because scoring has already started.', r.name;
              END IF;
              DELETE FROM public.registrations WHERE id = r.id;
          END LOOP;

          -- Deterministic lock order on insert
          INSERT INTO public.registrations (user_id, event_id)
          SELECT p_uid, ev
            FROM unnest(v_ids) ev
           WHERE not exists (SELECT 1 FROM public.registrations x WHERE x.user_id = p_uid AND x.event_id = ev)
           ORDER BY ev;
      END $$;
    `);

    // 6. CAPACITY CHECK IN TRIGGER WITH ROW LOCKING IN SORTED ORDER
    console.log('[CONCURRENCY] Updating registrations_before_insert for strict capacity checks...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.registrations_before_insert()
      RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          e       record;
          v_count integer;
      BEGIN
          -- Lock event row to check live capacity safely
          SELECT id, name, status, registration_deadline, max_participants, current_participants, event_group
            INTO e
            FROM public.events
           WHERE id = new.event_id
             FOR SHARE;

          IF not found THEN
              RAISE EXCEPTION 'Competition track not found.';
          END IF;
          IF e.status <> 'open' THEN
              RAISE EXCEPTION 'Registration for % is closed.', e.name;
          END IF;
          IF now() > e.registration_deadline THEN
              RAISE EXCEPTION 'The registration deadline for % has passed.', e.name;
          END IF;
          IF exists (SELECT 1 FROM public.registrations WHERE user_id = new.user_id AND event_id = new.event_id) THEN
              RAISE EXCEPTION 'You are already registered for %.', e.name;
          END IF;
          IF e.current_participants >= e.max_participants THEN
              RAISE EXCEPTION '% is full. Maximum participant capacity reached.', e.name;
          END IF;

          SELECT count(*) INTO v_count
            FROM public.registrations r
            JOIN public.events ev ON ev.id = r.event_id
           WHERE r.user_id = new.user_id AND ev.event_group = e.event_group;

          IF v_count >= 2 THEN
              RAISE EXCEPTION 'A student may register for a maximum of 2 events in % only.', e.event_group;
          END IF;

          RETURN new;
      END $$;
    `);

    // 7. Statement timeout guard in submit_registration_form
    console.log('[SECURITY] Adding statement timeout guard to submit_registration_form...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.submit_registration_form(p_profile jsonb, p_event_slugs text[])
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_uid   uuid := auth.uid();
          v_email text;
          v_role  public.user_role;
      BEGIN
          PERFORM set_config('statement_timeout', '8000', true);

          IF v_uid IS NULL THEN
              RAISE EXCEPTION 'Please sign in to continue.';
          END IF;
          IF p_profile IS NULL OR jsonb_typeof(p_profile) <> 'object' THEN
              RAISE EXCEPTION 'Invalid registration data.';
          END IF;
          SELECT role INTO v_role FROM public.users WHERE id = v_uid;
          IF v_role IS NOT NULL AND v_role <> 'student' THEN
              RAISE EXCEPTION 'Staff accounts cannot submit the student registration form.';
          END IF;
          SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
          -- If email in profile is provided, prefer it for public.users
          IF p_profile ? 'email' AND p_profile ->> 'email' <> '' THEN
              v_email := lower(btrim(p_profile ->> 'email'));
          END IF;
          PERFORM public._apply_profile(v_uid, v_email, p_profile, true);
          PERFORM public._sync_student_events(v_uid, p_event_slugs);
      END $$;
    `);

    await client.query('COMMIT');
    console.log('[OPTIMIZE] All database optimizations committed successfully.');

    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('[OPTIMIZE] PostgREST schema cache reloaded.');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ERROR] Optimization failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
