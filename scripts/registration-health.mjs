import {getClient} from './db.mjs';
const db=getClient();
try {
  await db.connect();
  await db.query('begin read only');
  const {rows}=await db.query(`select
    (select count(*)::int from public.crossfire_registration_requests) as saved_registrations,
    (select count(*)::int from public.users where role='student') as student_accounts,
    (select count(*)::int from public.events where status='open' and registration_deadline>now()) as open_events,
    to_regprocedure('public.crossfire_student_records()') is not null as direct_registration_installed`);
  console.log(JSON.stringify(rows[0]));
  await db.query('rollback');
} catch(error) {console.error('Database health check failed:',error.code||error.name);process.exitCode=1;}
finally {await db.end();}
