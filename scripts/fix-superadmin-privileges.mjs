import { getClient } from './db.mjs';

const client = getClient();

async function main() {
  await client.connect();
  console.log('[SECURITY] Connected to PostgreSQL...');

  try {
    await client.query('BEGIN');

    console.log('[SECURITY] Updating _require_role to correctly cascade super_admin authority...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public._require_role(variadic p_roles public.user_role[])
      RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
      DECLARE
          v_uid  uuid := auth.uid();
          v_role public.user_role;
      BEGIN
          IF v_uid IS NULL THEN
              RAISE EXCEPTION 'Please sign in to continue.';
          END IF;
          SELECT role INTO v_role FROM public.users WHERE id = v_uid;
          -- Super Admin possesses master access across all staff, ops, and admin operations
          IF v_role IS NULL OR NOT (v_role = any(p_roles) OR (v_role = 'super_admin' AND NOT ('student' = any(p_roles)))) THEN
              RAISE EXCEPTION 'You are not authorized to perform this action.';
          END IF;
          RETURN v_uid;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('[SECURITY] _require_role updated successfully.');

    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('[SECURITY] PostgREST schema cache reloaded.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[SECURITY] Error updating _require_role:', err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
