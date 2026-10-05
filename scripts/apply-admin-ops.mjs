import { getClient } from './db.mjs';

const client = getClient();

async function main() {
  await client.connect();
  console.log('[MIGRATION] Connected to PostgreSQL...');

  try {
    await client.query('BEGIN');

    // 1. Admin Delete Student RPC
    console.log('[RPC] Creating admin_delete_student RPC...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_delete_student(p_student_id text)
      RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_uid uuid := public._require_role('admin', 'super_admin');
          v_target_id uuid;
          v_target_email text;
          v_del_regs int := 0;
          v_del_scores int := 0;
      BEGIN
          IF p_student_id IS NULL OR btrim(p_student_id) = '' THEN
              RAISE EXCEPTION 'Student ID or Email is required.';
          END IF;

          -- Try matching UUID, pass_number, email, or CF26-xxxx
          SELECT id, email INTO v_target_id, v_target_email
          FROM public.users
          WHERE id::text = p_student_id
             OR lower(email) = lower(p_student_id)
             OR (pass_number IS NOT NULL AND pass_number::text = regexp_replace(p_student_id, '[^0-9]', '', 'g'))
          LIMIT 1;

          IF v_target_id IS NULL THEN
              RAISE EXCEPTION 'Student not found with identifier "%".', p_student_id;
          END IF;

          -- Delete scores associated with registrations
          DELETE FROM public.scores
          WHERE registration_id IN (SELECT id FROM public.registrations WHERE user_id = v_target_id);
          GET DIAGNOSTICS v_del_scores = row_count;

          -- Delete registrations
          DELETE FROM public.registrations WHERE user_id = v_target_id;
          GET DIAGNOSTICS v_del_regs = row_count;

          -- Delete from public.users
          DELETE FROM public.users WHERE id = v_target_id;

          -- Delete from auth.users (so account is wiped)
          DELETE FROM auth.users WHERE id = v_target_id;

          -- Audit
          PERFORM public._audit('student_deleted', 'user', v_target_id,
              jsonb_build_object('email', v_target_email, 'deleted_registrations', v_del_regs, 'deleted_scores', v_del_scores),
              null);

          RETURN jsonb_build_object(
              'success', true,
              'deleted_user_id', v_target_id,
              'deleted_email', v_target_email,
              'deleted_registrations', v_del_regs
          );
      END $$;
    `);

    // 2. Admin Delete Volunteer RPC (accepts text identifier)
    console.log('[RPC] Creating/updating admin_delete_volunteer RPC...');
    await client.query(`DROP FUNCTION IF EXISTS public.admin_delete_volunteer(uuid);`);
    await client.query(`DROP FUNCTION IF EXISTS public.admin_delete_volunteer(text);`);
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_delete_volunteer(p_identifier text)
      RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_uid uuid := public._require_role('admin', 'super_admin');
          v_target_id uuid;
          v_email text;
          v_vid text;
      BEGIN
          SELECT id, email, volunteer_id INTO v_target_id, v_email, v_vid
          FROM public.volunteers
          WHERE id::text = p_identifier 
             OR volunteer_id = p_identifier
             OR lower(email) = lower(p_identifier)
          LIMIT 1;

          IF v_target_id IS NULL THEN
              RAISE EXCEPTION 'Volunteer not found with identifier "%".', p_identifier;
          END IF;

          -- Unlink VIP guests escorted by this volunteer
          UPDATE public.guests SET escort_volunteer_id = NULL WHERE escort_volunteer_id = v_target_id;

          -- Delete from volunteers table
          DELETE FROM public.volunteers WHERE id = v_target_id;

          -- Clean up if they have a user account
          DELETE FROM public.users WHERE role = 'volunteer' AND (id = v_target_id OR lower(email) = lower(v_email));
          DELETE FROM auth.users WHERE id = v_target_id OR lower(email) = lower(v_email);

          RETURN jsonb_build_object(
              'success', true,
              'deleted_volunteer_id', v_vid,
              'deleted_id', v_target_id
          );
      END $$;
    `);

    // 3. Admin Delete Guest RPC (accepts text identifier)
    console.log('[RPC] Creating/updating admin_delete_guest RPC...');
    await client.query(`DROP FUNCTION IF EXISTS public.admin_delete_guest(uuid);`);
    await client.query(`DROP FUNCTION IF EXISTS public.admin_delete_guest(text);`);
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_delete_guest(p_identifier text)
      RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_uid uuid := public._require_role('admin', 'super_admin');
          v_target_id uuid;
          v_name text;
      BEGIN
          SELECT id, name INTO v_target_id, v_name
          FROM public.guests
          WHERE id::text = p_identifier 
             OR lower(name) = lower(p_identifier)
             OR (email IS NOT NULL AND lower(email) = lower(p_identifier))
          LIMIT 1;

          IF v_target_id IS NULL THEN
              RAISE EXCEPTION 'Guest not found with identifier "%".', p_identifier;
          END IF;

          DELETE FROM public.guests WHERE id = v_target_id;

          RETURN jsonb_build_object(
              'success', true,
              'deleted_guest_id', v_target_id,
              'deleted_guest_name', v_name
          );
      END $$;
    `);

    // 4. Update ground ops functions to also allow super_admin
    await client.query(`
      CREATE OR REPLACE FUNCTION public.staff_set_check_in(p_user_id uuid, p_checked_in boolean)
      RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_uid uuid := public._require_role('volunteer', 'admin', 'super_admin');
          u     record;
          v_new timestamptz;
      BEGIN
          SELECT role, checked_in_at, food_redeemed_at INTO u FROM public.users WHERE id = p_user_id FOR UPDATE;
          IF NOT FOUND OR u.role <> 'student' THEN
              RAISE EXCEPTION 'Student not found.';
          END IF;
          IF not p_checked_in AND u.food_redeemed_at IS NOT NULL THEN
              RAISE EXCEPTION 'Cannot cancel check-in because this student has already redeemed lunch.';
          END IF;
          v_new := CASE WHEN p_checked_in THEN coalesce(u.checked_in_at, now()) ELSE null END;
          UPDATE public.users SET checked_in_at = v_new WHERE id = p_user_id;
          RETURN v_new;
      END $$;
    `);

    // 5. Grant execute permissions
    await client.query(`
      GRANT EXECUTE ON FUNCTION public.admin_delete_student(text) TO authenticated, service_role;
      GRANT EXECUTE ON FUNCTION public.admin_delete_volunteer(text) TO authenticated, service_role;
      GRANT EXECUTE ON FUNCTION public.admin_delete_guest(text) TO authenticated, service_role;
    `);

    await client.query('COMMIT');
    console.log('[MIGRATION] Admin operation functions applied successfully.');

    // Reload PostgREST cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('[MIGRATION] PostgREST schema cache reloaded.');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ERROR] Failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
