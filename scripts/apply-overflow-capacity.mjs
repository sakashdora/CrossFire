import { getClient } from './db.mjs';

const client = getClient();

async function main() {
  await client.connect();
  console.log('[OVERFLOW] Connected to PostgreSQL...');

  try {
    await client.query('BEGIN');

    console.log('[OVERFLOW] Adding is_overflow column to public.registrations...');
    await client.query(`
      ALTER TABLE public.registrations 
      ADD COLUMN IF NOT EXISTS is_overflow boolean NOT NULL DEFAULT false;
    `);

    console.log('[OVERFLOW] Updating registrations_before_insert trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.registrations_before_insert()
      RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          e       record;
          v_count integer;
      BEGIN
          -- Lock event row in FOR SHARE mode to safely check live capacity without blocking concurrent registrations
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

          -- Dynamic Overflow: If nominal max_participants is reached, flag as overflow for admin review
          -- without blocking the student or raising an unrecoverable exception
          IF e.current_participants >= e.max_participants THEN
              new.is_overflow := true;
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

    // Update students_view to also reflect if any registration is an overflow
    console.log('[OVERFLOW] Updating students_view with overflow indicator...');
    await client.query(`
      CREATE OR REPLACE VIEW public.students_view WITH (security_invoker = true) AS
      SELECT
          u.id,
          u.pass_number,
          concat('CF26-', coalesce(nullif(u.pass_number::text, ''), upper(substr(u.id::text, 1, 4)))) as student_code,
          u.first_name,
          u.last_name,
          concat(u.first_name, ' ', coalesce(u.last_name, '')) as full_name,
          u.email,
          u.contact_number,
          u.whatsapp_number,
          u.institute_name,
          u.city_town,
          u.course_stream,
          u.board,
          u.food_preference,
          count(r.id)::int as event_count,
          coalesce(string_agg(e.name, ', ' order by e.name), 'None') as registered_events,
          u.checked_in_at,
          u.food_redeemed_at,
          u.created_at,
          bool_or(coalesce(r.is_overflow, false)) as has_overflow
      FROM public.users u
      LEFT JOIN public.registrations r ON r.user_id = u.id
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.pass_number, u.first_name, u.last_name, u.email, u.contact_number, 
               u.whatsapp_number, u.institute_name, u.city_town, u.course_stream, u.board, 
               u.food_preference, u.checked_in_at, u.food_redeemed_at, u.created_at;

      GRANT SELECT ON public.students_view TO authenticated, service_role, anon;
    `);

    await client.query('COMMIT');
    console.log('[OVERFLOW] Migration committed successfully.');

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('[OVERFLOW] PostgREST schema cache reloaded.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[OVERFLOW] Error running migration:', err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
