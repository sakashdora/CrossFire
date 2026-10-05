import { getClient } from './db.mjs';

const client = getClient();

async function main() {
  await client.connect();
  console.log('[MIGRATION] Connected to PostgreSQL...');

  try {
    await client.query('BEGIN');

    // 1. Purge automated test registrations & test users
    console.log('[CLEANUP] Purging automated test accounts...');
    
    // First remove registrations of test users
    const deleteRegs = await client.query(`
      DELETE FROM public.registrations
      WHERE user_id IN (
        SELECT id FROM public.users 
        WHERE email LIKE 'cf_%' OR email LIKE 'verify_candidate_%'
      )
    `);
    console.log(`[CLEANUP] Deleted ${deleteRegs.rowCount} test registrations.`);

    // Remove from public.users
    const deletePublicUsers = await client.query(`
      DELETE FROM public.users
      WHERE email LIKE 'cf_%' OR email LIKE 'verify_candidate_%'
    `);
    console.log(`[CLEANUP] Deleted ${deletePublicUsers.rowCount} test records from public.users.`);

    // Remove from auth.users
    const deleteAuthUsers = await client.query(`
      DELETE FROM auth.users
      WHERE email LIKE 'cf_%' OR email LIKE 'verify_candidate_%'
    `);
    console.log(`[CLEANUP] Deleted ${deleteAuthUsers.rowCount} test accounts from auth.users.`);

    // 2. Create Database Views for Supabase Table Editor
    console.log('[VIEWS] Creating dedicated views (students_view, admins_view, staff_view)...');

    await client.query(`
      CREATE OR REPLACE VIEW public.students_view WITH (security_invoker = true) AS
      SELECT
          u.id,
          u.pass_number,
          concat('CF26-', coalesce(nullif(u.pass_number::text, ''), upper(substr(u.id::text, 1, 4)))) AS student_code,
          u.first_name,
          u.last_name,
          concat(u.first_name, ' ', coalesce(u.last_name, '')) AS full_name,
          u.email,
          u.contact_number,
          u.whatsapp_number,
          u.institute_name,
          u.city_town,
          u.course_stream,
          u.board,
          u.food_preference,
          count(r.id)::int AS event_count,
          coalesce(string_agg(e.name, ', ' ORDER BY e.name), 'None') AS registered_events,
          u.checked_in_at,
          u.food_redeemed_at,
          u.created_at
      FROM public.users u
      LEFT JOIN public.registrations r ON r.user_id = u.id
      LEFT JOIN public.events e ON e.id = r.event_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.pass_number, u.first_name, u.last_name, u.email, u.contact_number, 
               u.whatsapp_number, u.institute_name, u.city_town, u.course_stream, u.board, 
               u.food_preference, u.checked_in_at, u.food_redeemed_at, u.created_at;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW public.admins_view WITH (security_invoker = true) AS
      SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          concat(u.first_name, ' ', coalesce(u.last_name, '')) AS full_name,
          u.contact_number,
          u.role,
          CASE 
              WHEN u.role = 'super_admin' THEN 'Super Admin (Tech Team & Master Access)'
              WHEN u.role = 'admin' THEN 'College Admin (Srusti Official)'
              ELSE initcap(u.role::text)
          END AS role_description,
          u.created_at,
          u.updated_at
      FROM public.users u
      WHERE u.role IN ('admin', 'super_admin');
    `);

    await client.query(`
      CREATE OR REPLACE VIEW public.staff_view WITH (security_invoker = true) AS
      SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          concat(u.first_name, ' ', coalesce(u.last_name, '')) AS full_name,
          u.contact_number,
          u.role,
          u.created_at,
          u.updated_at
      FROM public.users u
      WHERE u.role IN ('volunteer', 'judge');
    `);

    // Grant access to views
    await client.query(`GRANT SELECT ON public.students_view TO authenticated, service_role, anon;`);
    await client.query(`GRANT SELECT ON public.admins_view TO authenticated, service_role, anon;`);
    await client.query(`GRANT SELECT ON public.staff_view TO authenticated, service_role, anon;`);

    await client.query('COMMIT');
    console.log('[VIEWS] Views created successfully and permissions granted.');

    // Reload PostgREST schema cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('[VIEWS] PostgREST schema cache reloaded.');

    // 3. Inspect final state
    const remainingUsers = await client.query(`
      SELECT email, role, first_name, last_name FROM public.users ORDER BY role, email
    `);
    console.log('\n== Current Public Users ==');
    console.table(remainingUsers.rows);

    const studentsViewData = await client.query(`
      SELECT student_code, full_name, email, event_count, registered_events FROM public.students_view
    `);
    console.log('\n== Students View Sample ==');
    console.table(studentsViewData.rows);

    const adminsViewData = await client.query(`
      SELECT email, role, role_description FROM public.admins_view
    `);
    console.log('\n== Admins View Sample ==');
    console.table(adminsViewData.rows);

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ERROR] Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
