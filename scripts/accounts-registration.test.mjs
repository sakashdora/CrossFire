import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

// Disposable, in-memory Postgres. Never reads .env or connects to Supabase.
process.on('uncaughtException', error => { console.error('FAIL:', error.message, error.where || ''); process.exit(1); });
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
create table auth.sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;`);
await db.exec((await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8')).split('-- 13. SEED:')[0].replace('create extension if not exists pgcrypto;',''));
const migration = name => readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
for (const name of ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql','20261020_student_invitations.sql','20261029_live_ops_and_access.sql','20261029160000_direct_registration.sql']) await db.exec(await migration(name));

const actors = {};
const addUser = async (key, role, extra = {}) => {
  actors[key] = randomUUID();
  await db.query('insert into auth.users(id,email,email_confirmed_at,encrypted_password) values($1,$2,now(),$3)',[actors[key],key+'@example.test','hash-'+key]);
  await db.query(`insert into users(id,email,first_name,role,contact_number,whatsapp_number,institute_name,city_town,course_stream,food_preference) values($1,$2,$3,$4::user_role,'9000000000','9000000000','Test School','Test City','12th Science','Veg')`,[actors[key],key+'@example.test',key,role]);
  return actors[key];
};
for (const [key,role] of [['admin','admin'],['super','super_admin'],['judge','judge'],['gate','volunteer'],['food','volunteer'],['room','volunteer'],['support','volunteer']]) await addUser(key,role);
for (let n=1;n<=6;n++) await db.query(`insert into events(name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
  values($1,$2,$3,'Test only','test','solo',1,100,'{"criteria":[]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Test Hall')`,['Event '+n,'event-'+n,n<=3?'Group A':'Group B']);
const eventId = async name => (await db.query('select id from events where name=$1',[name])).rows[0].id;
for (const [key,station,event] of [['gate','gate',null],['food','food',null],['room','event','Event 1'],['support','support',null]])
  await db.query(`insert into volunteers(user_id,volunteer_id,name,contact_number,email,password,ops_station,ops_event_id,attendance_status) values($1,$2,$3,'9000000000',$4,$5,$6,$7,'Present / On Duty')`,
    [actors[key],'VOL-'+key.toUpperCase(),key,key+'@example.test','legacy-plaintext',station,event?await eventId(event):null]);
// An account-less submission from the earlier intake workflow.
const legacyRequest = randomUUID();
await db.query(`insert into crossfire_registration_requests(id,profile,events,status) values($1,$2,'[]','registered')`,[legacyRequest,JSON.stringify({student_name:'Legacy Student',email:'legacy@example.test',contact_number:'9111111111'})]);

for (const name of ['20261030090000_vip_guest_role.sql','20261030090100_accounts_registration_qr.sql']) await db.exec(await migration(name));
// Forward migrations must be safe to apply twice.
for (const name of ['20261030090000_vip_guest_role.sql','20261030090100_accounts_registration_qr.sql']) await db.exec(await migration(name));

async function as(actor, sql, args=[], aal) {
  await db.exec('reset role');
  const sub = actor && actor!=='service' ? (actors[actor] || actor) : '';
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[sub,JSON.stringify({aal:aal || (actor==='super'?'aal2':'aal1')})]);
  await db.exec('set role '+(actor==='service'?'service_role':actor?'authenticated':'anon'));
  try { return await db.query(sql,args); } finally { await db.exec('reset role'); }
}
const one = async (actor, sql, args) => Object.values((await as(actor, sql, args)).rows[0])[0];
let count=0;
const test = async(name,fn)=>{ await fn(); count++; console.log('PASS: '+name); };
const denied = (promise,pattern=/permission|not authorized|Sign in|sign in|access/i)=>assert.rejects(promise,pattern);
const profile = (n, extra={}) => ({student_name:'Test Student '+n,email:`student${n}@example.test`,contact_number:String(9000000100+n),whatsapp_number:String(9000000100+n),institute_name:'Test School',city_town:'Test City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',selected_competitions:['Event 1','Event 4'],parent_consent:true,terms_accepted:true,website:'',...extra});
const action = (actor,name,payload) => as(actor,'select crossfire_ops_action($1,$2::jsonb) as r',[name,JSON.stringify(payload)]);
const snapshot = actor => one(actor,'select crossfire_ops_snapshot()');
const lookup = (actor, code) => one(actor,'select crossfire_ops_lookup_pass($1)',[code]);
const setRegistration = open => action('super','settings.registration',{open});

// Mirrors the register-student Edge function: reserve, create the Auth user, complete.
async function register(n, { id = randomUUID(), extra = {} } = {}) {
  const begin = await one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[id,JSON.stringify(profile(n,extra))]);
  if (begin.status === 'registering') await db.query('insert into auth.users(id,email,email_confirmed_at,encrypted_password,raw_app_meta_data) values($1,$2,now(),$3,$4) on conflict do nothing',[begin.user_id,begin.email,'hash-student',JSON.stringify({crossfire_request_id:id})]);
  const receipt = await one('service','select crossfire_complete_student_registration($1)',[id]);
  actors['student'+n] = begin.user_id;
  return { id, userId: begin.user_id, receipt };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
await test('browsers cannot call server-only registration functions or the retired intake RPC',async()=>{
  for (const actor of [null,'admin']) {
    await assert.rejects(as(actor,'select crossfire_begin_student_registration($1,$2::jsonb)',[randomUUID(),JSON.stringify(profile(90))]),/permission denied/);
    await assert.rejects(as(actor,'select crossfire_complete_student_registration($1)',[randomUUID()]),/permission denied/);
    await assert.rejects(as(actor,'select crossfire_submit_registration_request($1,$2::jsonb)',[randomUUID(),JSON.stringify(profile(90))]),/permission denied/);
  }
  await assert.rejects(as('admin','select ensure_profile()'),/permission denied/);
});
let first;
await test('open registration creates one complete account, profile, entries and unique pass',async()=>{
  first = await register(1);
  const r = first.receipt;
  assert.match(r.pass_id,/^CF26-[0-9A-F]{32}$/);
  assert.match(r.student_id,/^CFS-\d+$/);
  assert.match(r.reference_code,/^CFREQ-/);
  assert.deepEqual(r.competitions,['Event 1','Event 4']);
  assert.equal(r.email,'student1@example.test');
  const u = (await db.query('select role,active,must_change_password from users where id=$1',[first.userId])).rows[0];
  assert.deepEqual(u,{role:'student',active:true,must_change_password:false});
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[first.userId])).rows[0].n,2);
  assert.equal((await db.query('select status from crossfire_registration_requests where id=$1',[first.id])).rows[0].status,'registered');
  assert.ok((await db.query('select provisioned_at from crossfire_student_accounts where request_id=$1',[first.id])).rows[0].provisioned_at);
  assert.ok(!JSON.stringify(r).match(/password/i));
});
await test('retrying the same submission returns the same receipt and creates nothing new',async()=>{
  const again = await register(1,{id:first.id});
  assert.deepEqual(again.receipt,first.receipt);
  assert.equal((await db.query("select count(*)::int n from users where lower(email)='student1@example.test'")).rows[0].n,1);
  assert.equal((await db.query("select count(*)::int n from crossfire_registration_requests where profile->>'email'='student1@example.test'")).rows[0].n,1);
});
await test('a second submission with the same email (any case) is rejected',async()=>{
  await assert.rejects(register(1,{extra:{email:'STUDENT1@Example.test'}}),/already registered/);
  assert.equal((await db.query("select count(*)::int n from users where lower(email)='student1@example.test'")).rows[0].n,1);
});
await test('a reused submission reference with different details is rejected',async()=>{
  await assert.rejects(register(1,{id:first.id,extra:{city_town:'Other City'}}),/already used/);
});
await test('back-to-back submissions for one email reserve once; the second is rejected',async()=>{
  const a = randomUUID(), b = randomUUID();
  const results = await Promise.allSettled([
    one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[a,JSON.stringify(profile(2))]),
    one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[b,JSON.stringify(profile(2))]),
  ]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.match(results.find(r=>r.status==='rejected').reason.message,/already registered/);
  await one('service','select crossfire_abandon_student_registration($1)',[a]); await one('service','select crossfire_abandon_student_registration($1)',[b]);
  assert.equal((await db.query("select count(*)::int n from crossfire_registration_requests where profile->>'email'='student2@example.test'")).rows[0].n,0);
});
await test('server validation returns useful messages',async()=>{
  const reject = (extra, pattern) => assert.rejects(one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[randomUUID(),JSON.stringify(profile(3,extra))]),pattern);
  await reject({email:'not-an-email'},/valid email/);
  await reject({contact_number:'123'},/10–13 digits/);
  await reject({selected_competitions:['Event 1','Event 2','Event 3']},/no more than 2/);
  await reject({selected_competitions:[]},/between 1 and 4/);
  await reject({website:'spam'},/Unable to accept/);
  await reject({role:'admin'},/Unexpected registration fields/);
});
await test('a failed completion leaves no partial profile, entries or reservation',async()=>{
  const id = randomUUID();
  const begin = await one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[id,JSON.stringify(profile(4))]);
  await db.query('insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values($1,$2,now(),$3)',[begin.user_id,begin.email,JSON.stringify({crossfire_request_id:id})]);
  await db.query("update events set status='registration_closed' where name='Event 4'");
  await assert.rejects(one('service','select crossfire_complete_student_registration($1)',[id]),/closed/);
  await db.query("update events set status='open' where name='Event 4'");
  assert.equal((await db.query('select count(*)::int n from users where id=$1',[begin.user_id])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[begin.user_id])).rows[0].n,0);
  await one('service','select crossfire_abandon_student_registration($1)',[id]);
  assert.equal((await db.query('select count(*)::int n from crossfire_registration_requests where id=$1',[id])).rows[0].n,0);
});
await test('an Auth identity that is not marked for the request is never adopted',async()=>{
  const id = randomUUID();
  const begin = await one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[id,JSON.stringify(profile(5))]);
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[begin.user_id,begin.email]);
  await assert.rejects(one('service','select crossfire_complete_student_registration($1)',[id]),/could not be verified/);
  await db.query('delete from auth.users where id=$1',[begin.user_id]);
  await one('service','select crossfire_abandon_student_registration($1)',[id]);
});
await test('an abandoned reservation older than 15 minutes is released for a new attempt',async()=>{
  const id = randomUUID();
  await one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[id,JSON.stringify(profile(6))]);
  await db.query("update crossfire_registration_requests set created_at=now()-interval '1 hour' where id=$1",[id]);
  const fresh = await one('service','select crossfire_begin_student_registration($1,$2::jsonb)',[randomUUID(),JSON.stringify(profile(6))]);
  assert.equal(fresh.stale_user_ids.length,1);
  assert.equal((await db.query('select count(*)::int n from crossfire_registration_requests where id=$1',[id])).rows[0].n,0);
});
await test('a legacy account-less submission with the same email is superseded, not duplicated',async()=>{
  await register(7,{extra:{email:'legacy@example.test'}});
  assert.equal((await db.query('select status from crossfire_registration_requests where id=$1',[legacyRequest])).rows[0].status,'superseded');
  const records = await one('admin','select crossfire_student_records()');
  assert.equal(records.filter(r=>r.email==='legacy@example.test').length,1);
  assert.equal(records.find(r=>r.email==='legacy@example.test').has_login,true);
});
await test('new students appear for admins and super admins, with their pass',async()=>{
  for (const actor of ['admin','super']) {
    const record = (await one(actor,'select crossfire_student_records()')).find(r=>r.email==='student1@example.test');
    assert.equal(record.pass_code,first.receipt.pass_id);
    assert.equal(record.competitions,'Event 1, Event 4');
    assert.ok((await snapshot(actor)).students.some(s=>s.pass_id===first.receipt.pass_id));
  }
});
await test('students, volunteers and judges cannot list student records',async()=>{
  for (const actor of [null,'student1','gate','judge']) await denied(as(actor,'select crossfire_student_records()'));
});

// ---------------------------------------------------------------------------
// Registration window
// ---------------------------------------------------------------------------
await test('only the super admin can open or close registration',async()=>{
  await denied(action('admin','settings.registration',{open:false}),/super admin/);
  await denied(as('admin',"select admin_set_system_setting('student_registration_open','false')"));
  await setRegistration(false);
  assert.equal((await snapshot('super')).settings.student_registration_open,false);
  assert.equal(await one(null,"select get_system_setting('student_registration_open')"),false);
});
await test('closed registration rejects new registrations through the server path',async()=>{
  await assert.rejects(register(8),/registration is closed/i);
});
await test('closed registration also rejects new event entries for existing students',async()=>{
  await assert.rejects(as('student1','select register_for_event($1)',[await eventId('Event 2')]),/closed/);
});
await test('existing students keep sign-in, profile and pass after registration closes',async()=>{
  const me = await one('student1','select crossfire_current_profile()');
  assert.equal(me.pass_code,first.receipt.pass_id);
  assert.equal(me.student_id,first.receipt.student_id);
  assert.deepEqual(me.selected_competitions,['Event 1','Event 4']);
  assert.equal((await one('student1','select crossfire_my_registrations()')).length,2);
  assert.equal(await one('student1','select current_user_role()'),'student');
});
await test('students cannot read another student or any staff dashboard',async()=>{
  await setRegistration(true);
  await register(9);
  assert.equal((await as('student1',"select id from users where role='student'")).rows.length,1);
  assert.equal((await as('student1','select id from registrations')).rows.length,2);
  for (const sql of ['select crossfire_ops_snapshot()','select crossfire_judge_snapshot()','select crossfire_vip_snapshot()',`select crossfire_ops_lookup_pass('${first.receipt.pass_id}')`]) await denied(as('student1',sql));
  await denied(action('student1','student.checkin',{id:actors.student9}));
});

// ---------------------------------------------------------------------------
// Provisioned accounts and forced password change
// ---------------------------------------------------------------------------
const guestId = randomUUID();
await action('admin','guest.save',{id:guestId,name:'Chief Guest',designation:'Director',organization:'Test Org',category:'Chief Guest',email:'vip@example.test',contact_number:'9000000999'});
const judgeGuest = randomUUID();
await action('admin','guest.save',{id:judgeGuest,name:'Visiting Judge',designation:'Professor',organization:'Test Org',category:'Judge'});
async function provision(by, key, role, extra={}) {
  const id = randomUUID();
  await db.query('insert into auth.users(id,email,email_confirmed_at,encrypted_password,raw_app_meta_data) values($1,$2,now(),$3,$4)',[id,key+'@example.test','initial-hash-'+key,JSON.stringify({crossfire_provisioned_by:actors[by]})]);
  await as(by,'select crossfire_ops_provision($1::jsonb)',[JSON.stringify({id,name:'New '+key,role,contact_number:'9000000123',...extra})]);
  actors[key]=id; return id;
}
await test('admins provision volunteer, judge and VIP guest logins but never admin-level ones',async()=>{
  await provision('admin','newvol','volunteer');
  await provision('admin','newjudge','judge');
  await provision('admin','vip','vip_guest',{guest_id:guestId});
  for (const role of ['admin','super_admin']) await assert.rejects(provision('admin','bad'+role,role),/cannot create/);
  await assert.rejects(provision('admin','vip2','vip_guest',{guest_id:guestId}),/already has a login/);
  await assert.rejects(provision('admin','vip3','vip_guest',{guest_id:judgeGuest}),/judge login/);
  await assert.rejects(provision('admin','vip4','vip_guest',{}),/active invited guest/);
  await provision('super','newadmin','admin');
});
await test('unprovisioned users cannot self-register as staff, VIP or judge',async()=>{
  const outsider = randomUUID();
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[outsider,'outsider@example.test']);
  await assert.rejects(as(outsider,'select crossfire_ops_provision($1::jsonb)',[JSON.stringify({id:outsider,name:'Me',role:'judge',contact_number:'9000000000'})]),/permission/);
  await assert.rejects(as(outsider,'select crossfire_current_profile()'),/unavailable/);
  await assert.rejects(provision('admin','foreign','volunteer').then(()=>as('admin','select crossfire_ops_provision($1::jsonb)',[JSON.stringify({id:outsider,name:'Me',role:'volunteer',contact_number:'9000000000'})])),/Auth account not found/);
});
await test('a provisioned login must replace its initial password before any access',async()=>{
  for (const key of ['newvol','newjudge','vip','newadmin']) {
    const me = await one(key,'select crossfire_current_profile()');
    assert.equal(me.must_change_password,true);
    assert.equal(me.pass_code,null);
    assert.equal(await one(key,'select current_user_role()'),null);
  }
  await denied(snapshot('newvol'));
  await denied(as('newjudge','select crossfire_judge_snapshot()'));
  await denied(as('vip','select crossfire_vip_snapshot()'));
  await assert.rejects(as('newvol','select crossfire_complete_password_change()'),/new password/);
  for (const key of ['newvol','newjudge','vip','newadmin']) {
    await db.query("update auth.users set encrypted_password='changed-'||id where id=$1",[actors[key]]);
    await as(key,'select crossfire_complete_password_change()');
    assert.equal((await one(key,'select crossfire_current_profile()')).must_change_password,false);
  }
  assert.equal((await db.query('select count(*)::int n from crossfire_temporary_passwords where user_id=any($1)',[['newvol','newjudge','vip','newadmin'].map(key=>actors[key])])).rows[0].n,0);
});
await test('each role reaches only its own dashboard data',async()=>{
  assert.equal((await snapshot('newvol')).actor.role,'volunteer');
  assert.ok(await one('newjudge','select crossfire_judge_snapshot()'));
  assert.equal((await snapshot('newadmin')).actor.role,'admin');
  const vip = await one('vip','select crossfire_vip_snapshot()');
  assert.equal(vip.invitation.name,'Chief Guest');
  assert.match(vip.invitation.pass_code,/^CFG-/);
  assert.ok(vip.events.length>0);
  for (const sql of ['select crossfire_ops_snapshot()','select crossfire_judge_snapshot()','select crossfire_student_records()',`select crossfire_ops_lookup_pass('${first.receipt.pass_id}')`]) await denied(as('vip',sql));
  assert.equal((await as('vip','select id from guests')).rows.length,0);
  assert.equal((await as('vip',"select id from users where id<>auth.uid()")).rows.length,0);
  for (const actor of ['admin','gate','judge','student1']) await denied(as(actor,'select crossfire_vip_snapshot()'));
});
await test('provisioning stores no password and responses expose none',async()=>{
  const blob = JSON.stringify([await snapshot('super'),await one('super','select crossfire_student_records()'),await one('vip','select crossfire_vip_snapshot()'),await one('student1','select crossfire_current_profile()')]);
  assert.ok(!/password"|encrypted|initial-hash|hash_digest|legacy-plaintext/.test(blob.replaceAll('must_change_password"','')));
  assert.equal((await db.query('select count(*)::int n from volunteers where password is not null')).rows[0].n,0);
});

// ---------------------------------------------------------------------------
// Deactivation and role changes
// ---------------------------------------------------------------------------
await test('admins cannot change super admins, admins or themselves',async()=>{
  await denied(action('admin','staff.access',{id:actors.super,role:'super_admin',active:false}),/super admin/);
  await denied(action('admin','staff.access',{id:actors.newadmin,role:'admin',active:false}),/super admin/);
  await denied(action('admin','staff.access',{id:actors.newjudge,role:'admin',active:true}),/super admin/);
  await denied(action('admin','staff.access',{id:actors.admin,role:'super_admin',active:true}),/own access/);
});
await test('deactivation ends sessions and access immediately; reactivation restores it',async()=>{
  await db.query('insert into auth.sessions(user_id) values($1),($1)',[actors.vip]);
  await action('admin','staff.access',{id:actors.vip,role:'vip_guest',active:false});
  assert.equal((await db.query('select count(*)::int n from auth.sessions where user_id=$1',[actors.vip])).rows[0].n,0);
  await denied(as('vip','select crossfire_vip_snapshot()'));
  await assert.rejects(as('vip','select crossfire_current_profile()'),/unavailable/);
  await action('admin','staff.access',{id:actors.vip,role:'vip_guest',active:true});
  assert.ok(await one('vip','select crossfire_vip_snapshot()'));
});
await test('a role change takes effect on the next request and VIP logins keep their role',async()=>{
  await action('admin','staff.access',{id:actors.newjudge,role:'volunteer',active:true});
  await denied(as('newjudge','select crossfire_judge_snapshot()'));
  assert.equal((await snapshot('newjudge')).actor.role,'volunteer');
  await denied(action('admin','staff.access',{id:actors.vip,role:'volunteer',active:true}),/VIP guest logins/);
  await denied(action('admin','staff.access',{id:actors.newvol,role:'vip_guest',active:true}),/VIP guest logins/);
});
await test('a browser-supplied role is ignored; authority comes from the database',async()=>{
  await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'super_admin',user_role:'super_admin',aal:'aal2'})]);
  await denied(as('gate','select crossfire_student_records()'));
});

// ---------------------------------------------------------------------------
// QR lookup and check-in
// ---------------------------------------------------------------------------
const pass = first.receipt.pass_id;
await test('invalid and unknown codes are rejected clearly',async()=>{
  await assert.rejects(lookup('gate','hello'),/not a valid CrossFire student pass/);
  await assert.rejects(lookup('gate',JSON.stringify({pass_id:pass})),/not a valid/);
  await assert.rejects(lookup('gate','CF26-'+'0'.repeat(32)),/Unknown pass/);
});
await test('scanning requires an authorized, on-duty operator',async()=>{
  for (const actor of [null,'student9','judge','vip']) await denied(lookup(actor,pass));
  await assert.rejects(lookup('support',pass),/Go on duty/);
  await action('gate','volunteer.attendance',{id:(await db.query('select id from volunteers where user_id=$1',[actors.gate])).rows[0].id,status:'On Break'});
  await assert.rejects(lookup('gate',pass),/Go on duty/);
  await action('gate','volunteer.attendance',{id:(await db.query('select id from volunteers where user_id=$1',[actors.gate])).rows[0].id,status:'Present / On Duty'});
});
await test('a valid scan returns only the details the desk needs',async()=>{
  const s = await lookup('gate',pass.toLowerCase());
  assert.equal(s.id,actors.student1);
  assert.equal(s.contact_number,'');
  assert.equal(s.checked_in_by,null);
  for (const key of ['email','whatsapp_number','city_town']) assert.ok(!(key in s));
  assert.ok((await lookup('admin',pass)).contact_number);
});
await test('event-room volunteers can scan only their own event participants',async()=>{
  assert.equal((await lookup('room',pass)).registrations.length,1);
  const other = await register(10,{extra:{selected_competitions:['Event 2','Event 5']}});
  await assert.rejects(lookup('room',other.receipt.pass_id),/not registered for your assigned event/);
});
await test('gate and meal desks receive no bulk student roster; rooms receive their own',async()=>{
  assert.equal((await snapshot('gate')).students.length,0);
  assert.equal((await snapshot('food')).students.length,0);
  const roster = (await snapshot('room')).students;
  assert.ok(roster.length>=1 && roster.every(s=>s.registrations.every(r=>r.name==='Event 1') && s.contact_number===''));
  assert.equal((await as('gate',"select id from users where role='student'")).rows.length,0);
  assert.equal((await as('gate','select id from registrations')).rows.length,0);
});
await test('check-in records student, action, time and operator',async()=>{
  await action('gate','student.checkin',{id:actors.student1});
  const row = (await db.query("select operator_id,created_at from crossfire_checkins where student_id=$1 and kind='gate' and undone_at is null",[actors.student1])).rows[0];
  assert.equal(row.operator_id,actors.gate);
  assert.ok(row.created_at);
  assert.equal((await lookup('admin',pass)).checked_in_by,'gate');
  assert.ok((await lookup('gate',pass)).checked_in_at);
});
await test('a duplicate scan is reported as already checked in',async()=>{
  await assert.rejects(action('gate','student.checkin',{id:actors.student1}),/Already checked in/);
  await assert.rejects(action('admin','student.checkin',{id:actors.student1}),/Already checked in/);
  assert.equal((await db.query("select count(*)::int n from crossfire_checkins where student_id=$1 and kind='gate'",[actors.student1])).rows[0].n,1);
});
await test('simultaneous scans cannot both record: the ledger index rejects a second active check-in',async()=>{
  // PGlite runs one connection, so this asserts the database backstop directly;
  // in Postgres the row lock in staff_set_check_in serialises concurrent scans.
  await assert.rejects(db.query("insert into crossfire_checkins(student_id,kind,operator_id) values($1,'gate',$2)",[actors.student1,actors.admin]),/duplicate key|unique/);
  const results = await Promise.allSettled([action('gate','student.checkin',{id:actors.student1}),action('admin','student.checkin',{id:actors.student1})]);
  assert.ok(results.every(r=>r.status==='rejected'));
});
await test('meal and room attendance are recorded once each',async()=>{
  await action('food','student.meal',{id:actors.student1});
  await assert.rejects(action('food','student.meal',{id:actors.student1}),/already been redeemed/);
  const reg = (await lookup('room',pass)).registrations[0].id;
  await action('room','student.room',{id:reg});
  await assert.rejects(action('room','student.room',{id:reg}),/already recorded/);
  assert.equal((await db.query('select count(*)::int n from crossfire_checkins where student_id=$1',[actors.student1])).rows[0].n,3);
});
await test('a regenerated pass revokes the previous QR',async()=>{
  await denied(action('gate','student.pass.regenerate',{id:actors.student9}),/requires an admin/);
  const old = (await one('student9','select crossfire_current_profile()')).pass_code;
  await action('admin','student.pass.regenerate',{id:actors.student9});
  const fresh = (await one('student9','select crossfire_current_profile()')).pass_code;
  assert.notEqual(fresh,old);
  assert.match(fresh,/^CF26-[0-9A-F]{32}$/);
  await assert.rejects(lookup('gate',old),/replaced and is no longer valid/);
  assert.equal((await lookup('gate',fresh)).id,actors.student9);
});
await test('a suspended student pass cannot be used',async()=>{
  await db.query('update users set active=false where id=$1',[actors.student9]);
  await assert.rejects(lookup('gate',(await db.query('select pass_code from users where id=$1',[actors.student9])).rows[0].pass_code),/suspended/);
  await assert.rejects(action('gate','student.checkin',{id:actors.student9}),/suspended/);
  await db.query('update users set active=true where id=$1',[actors.student9]);
});

// ---------------------------------------------------------------------------
// Incidents and judges
// ---------------------------------------------------------------------------
await test('incidents persist and appear only for the reporter and admins',async()=>{
  await action('gate','incident.report',{room:'Gate 1',issue:'Scanner battery low',priority:'High'});
  assert.ok((await snapshot('admin')).incidents.some(i=>i.issue==='Scanner battery low'));
  assert.ok((await snapshot('super')).incidents.some(i=>i.issue==='Scanner battery low'));
  assert.ok((await snapshot('gate')).incidents.some(i=>i.issue==='Scanner battery low'));
  assert.ok(!(await snapshot('food')).incidents.some(i=>i.issue==='Scanner battery low'));
  await denied(action('gate','incident.resolve',{id:(await snapshot('admin')).incidents[0].id,resolution:'Fixed'}),/requires an admin/);
  await denied(action('gate','incident.report',{room:'Gate 1',issue:'Bad priority',priority:'Urgent'}),/valid priority/);
});
await test('judges see only their assigned event candidates and no contact details',async()=>{
  await action('admin','event.judge',{id:await eventId('Event 1'),judge_id:actors.judge,assigned:true});
  const s = await one('judge','select crossfire_judge_snapshot()');
  assert.ok(s.candidates.length>=1 && s.candidates.every(c=>c.event_id===s.events[0].id));
  assert.equal(s.events.length,1);
  assert.ok(!JSON.stringify(s).match(/@example\.test|9000000/));
});
await test('volunteers cannot perform admin or super-admin actions',async()=>{
  for (const [name,payload] of [['staff.access',{id:actors.newvol,role:'judge'}],['event.status',{id:await eventId('Event 1'),status:'open'}],['settings.registration',{open:false}],['announcement.send',{target:'volunteers',title:'x',message:'y'}]])
    await denied(action('gate',name,payload),/requires an admin|super admin/);
});

console.log(`\n${count} account, registration and QR checks passed in a disposable local database.`);
