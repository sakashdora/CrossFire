import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Contracts for registration without a password and separately issued portal credentials.
// Disposable, in-memory Postgres. Never reads .env or connects to Supabase.
// A legacy student registers on the baseline schema; every migration newer than
// the baseline is then applied (the cutover), and a new-cohort student registers.
const BASELINE = '20261101090000_student_phone_length.sql';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text,banned_until timestamptz,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
create table auth.sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null,created_at timestamptz not null default now());
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;`);
await db.exec((await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')).split('-- 13. SEED:')[0].replace('create extension if not exists pgcrypto;', ''));
const migration = name => readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
const ordered = ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql','20261020_student_invitations.sql','20261029_live_ops_and_access.sql','20261029160000_direct_registration.sql','20261030090000_vip_guest_role.sql','20261030090100_accounts_registration_qr.sql','20261030120000_least_privilege_review.sql',BASELINE];
for (const name of ordered) await db.exec(await migration(name));

const actors = {};
for (const [key, role] of [['admin','admin'],['super','super_admin'],['gate','volunteer']]) {
  actors[key] = randomUUID();
  await db.query('insert into auth.users(id,email,email_confirmed_at,encrypted_password) values($1,$2,now(),$3)', [actors[key], key + '@example.test', 'hash-' + key]);
  await db.query(`insert into users(id,email,first_name,role,contact_number) values($1,$2,$3,$4::user_role,'9000000000')`, [actors[key], key + '@example.test', key, role]);
}
await db.query(`insert into volunteers(user_id,volunteer_id,name,contact_number,email,ops_station,attendance_status) values($1,'VOL-GATE','gate','9000000000','gate@example.test','gate','Present / On Duty')`, [actors.gate]);
for (let n = 1; n <= 2; n++) await db.query(`insert into events(name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
  values($1,$2,'Group A','Test only','test','solo',1,100,'{"criteria":[]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Test Hall')`, ['Event ' + n, 'event-' + n]);

async function as(actor, sql, args = []) {
  await db.exec('reset role');
  const sub = actor && actor !== 'service' ? (actors[actor] || actor) : '';
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", [sub, JSON.stringify({ aal: actor === 'super' ? 'aal2' : 'aal1' })]);
  await db.exec('set role ' + (actor === 'service' ? 'service_role' : actor ? 'authenticated' : 'anon'));
  try { return await db.query(sql, args); } finally { await db.exec('reset role'); }
}
const one = async (actor, sql, args) => Object.values((await as(actor, sql, args)).rows[0])[0];
const profile = n => ({ student_name: 'Contract Student ' + n, email: `contract${n}@example.test`, contact_number: String(9100000000 + n), whatsapp_number: String(9100000000 + n), institute_name: 'Test School', city_town: 'Test City', course_stream: '12th Science', board: 'CBSE', food_preference: 'Veg', selected_competitions: ['Event 1'], parent_consent: true, terms_accepted: true, website: '' });
// Mirrors the server registration path. The Auth row is written as confirmed on
// purpose: the database must not rely on an unconfirmed email to deny access,
// because OTP or recovery flows can confirm it later.
async function register(n) {
  const id = randomUUID();
  const begin = await one('service', 'select crossfire_begin_student_registration($1,$2::jsonb)', [id, JSON.stringify(profile(n))]);
  await db.query('insert into auth.users(id,email,email_confirmed_at,encrypted_password,raw_app_meta_data) values($1,$2,now(),$3,$4) on conflict do nothing', [begin.user_id, begin.email, 'hash-bootstrap', JSON.stringify({ crossfire_request_id: id })]);
  const receipt = await one('service', 'select crossfire_complete_student_registration($1)', [id]);
  actors['student' + n] = begin.user_id;
  return { id, userId: begin.user_id, receipt };
}

const legacy = await register(1);
const orphan = randomUUID();
await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'orphan@example.test',now(),'{"app":"crossfire"}')`,[orphan]);
assert.equal((await db.query('select role from users where id=$1',[orphan])).rows[0]?.role, 'student', 'the legacy Auth trigger created this untrusted student');
const pending = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(name => name.endsWith('.sql') && name > BASELINE).sort();
for (const name of pending) await db.exec(await migration(name));
console.log(`# cutover migrations applied: ${pending.length ? pending.join(', ') : 'none yet'}`);
const fresh = await register(2);

// A self-signup that carries the client-controlled app label, then confirms its email.
const signup = randomUUID();
await db.query(`insert into auth.users(id,email,email_confirmed_at,encrypted_password,raw_user_meta_data) values($1,'selfsignup@example.test',now(),'hash-self','{"app":"crossfire"}')`, [signup]);
actors.signup = signup;

test('new registrant receives a complete receipt with CFS ID, CF26 pass and CFREQ reference', () => {
  assert.match(fresh.receipt.student_id, /^CFS-\d+$/);
  assert.match(fresh.receipt.pass_id, /^CF26-[0-9A-F]{32}$/);
  assert.match(fresh.receipt.reference_code, /^CFREQ-/);
  assert.ok(!JSON.stringify(fresh.receipt).match(/password|token/i));
});
test('new registrant pass scans and checks in at an on-duty gate before any review', async () => {
  const scanned = await one('gate', 'select crossfire_ops_lookup_pass($1)', [fresh.receipt.pass_id]);
  assert.equal(scanned.id, fresh.userId);
  assert.ok(await one('gate', 'select staff_set_check_in($1,true)', [fresh.userId]));
});
test('legacy student keeps portal access across the cutover', async () => {
  assert.equal(await one('student1', 'select current_user_role()'), 'student');
  assert.equal((await one('student1', 'select crossfire_current_profile()')).student_id, legacy.receipt.student_id);
});
test('staff roles are unaffected by the cutover', async () => {
  assert.equal(await one('admin', 'select current_user_role()'), 'admin');
  assert.equal(await one('super', 'select current_user_role()'), 'super_admin');
  assert.equal(await one('gate', 'select current_user_role()'), 'volunteer');
});
test('new registrant has no student role before credentials are issued, even with a confirmed email', async () => {
  assert.equal(await one('student2', 'select current_user_role()'), null);
});
test('new registrant cannot open the student profile before credentials are issued', async () => {
  await assert.rejects(one('student2', 'select crossfire_current_profile()'), /unavailable|not ready|credentials/i);
});
test('new registrant cannot read own rows through REST policies before credentials are issued', async () => {
  assert.equal((await as('student2', 'select id from users where id=auth.uid()')).rows.length, 0);
  assert.equal((await as('student2', 'select id from registrations where user_id=auth.uid()')).rows.length, 0);
});
test('a self-signup profile from client app metadata is not a trusted student', async () => {
  assert.equal(await one('signup', 'select current_user_role()'), null);
});
test('previously self-created empty profiles do not inherit legacy portal access',async()=>{
  assert.equal(await one(orphan,'select current_user_role()'),null);
  await assert.rejects(one(orphan,'select crossfire_current_profile()'),/unavailable/);
});
test('abandonment after successful completion cannot delete the student or their receipt',async()=>{
  await one('service','select crossfire_abandon_student_registration($1)',[fresh.id]);
  assert.equal((await one('service','select crossfire_complete_student_registration($1)',[fresh.id])).pass_id,fresh.receipt.pass_id);
});
test('both manager panels see the new registrant before review', async () => {
  for (const actor of ['admin', 'super']) {
    const records = await one(actor, 'select crossfire_student_records()');
    assert.equal(records.filter(r => r.email === 'contract2@example.test').length, 1);
  }
});
test('the directory reports portal access separately from admission', async () => {
  const record = (await one('admin', 'select crossfire_student_records()')).find(r => r.email === 'contract2@example.test');
  assert.equal(record.has_login, false);
  assert.ok('portal_state' in record);
});
