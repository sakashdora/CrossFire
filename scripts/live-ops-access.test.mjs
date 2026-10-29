import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

process.on('uncaughtException', error => { console.error('FAIL:', error.message, error.where || ''); process.exit(1); });
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`);
await db.exec((await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8')).split('-- 13. SEED:')[0].replace('create extension if not exists pgcrypto;',''));
const migrations = ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql','20261020_student_invitations.sql','20261029_live_ops_and_access.sql'];
for (const name of migrations) await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
// The new migration must be safe to apply twice.
await db.exec(await readFile(new URL('../supabase/migrations/20261029_live_ops_and_access.sql',import.meta.url),'utf8'));
const actors = {};
for (const role of ['admin','super_admin','student','judge','volunteer']) {
  actors[role] = randomUUID();
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[actors[role],role+'@example.test']);
  await db.query('insert into users(id,email,first_name,role) values($1,$2,$3::text,$3::user_role)',[actors[role],role+'@example.test',role]);
}
for (let n=1;n<=6;n++) await db.query(`insert into events(name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
  values($1,$2,$3,'Test only','test','solo',1,100,'{"criteria":[]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Test Hall')`,['Event '+n,'event-'+n,n<=3?'Group A':'Group B']);
async function as(actor, sql, args=[], aal='aal1') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[actors[actor]||'',JSON.stringify({aal,role:actor?'authenticated':'anon'})]);
  await db.exec('set role '+(actor?'authenticated':'anon'));
  try { return await db.query(sql,args); } finally { await db.exec('reset role'); }
}
let count=0;
const test = async(name,fn)=>{ await fn(); count++; console.log('PASS: '+name); };
const denied = (promise,pattern=/permission|role|Sign in|sign in|denied|access/i)=>assert.rejects(promise,pattern);
const profile = n => ({student_name:'Test Student',email:`student${n}@example.test`,contact_number:String(9000000000+n),whatsapp_number:String(9000000000+n),institute_name:'Test School',city_town:'Test City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',selected_competitions:['Event 1','Event 4'],parent_consent:true,terms_accepted:true,website:''});
const submit = async n => { const id=randomUUID(); await as(null,'select crossfire_submit_registration_request($1,$2::jsonb)',[id,JSON.stringify(profile(n))]); return id; };
const revision = async (actor='admin') => Number((await as(actor,'select crossfire_live_revision() as v',[],actor==='super_admin'?'aal2':'aal1')).rows[0].v);
const portal = open => db.query("insert into system_settings(key,value) values('student_portal_open',$1::jsonb) on conflict(key) do update set value=excluded.value",[JSON.stringify(open)]);

// A real reviewed → invited → provisioned student, using the production invitation path.
async function provisionedStudent(n) {
  const id = await submit(n);
  const row = (await as('admin','select crossfire_list_registration_requests($1,$2,$3) as d',['all',`student${n}@example.test`,0])).rows[0].d.items[0];
  await as('admin','select crossfire_review_registration_request($1,$2,$3,$4)',[id,'reviewed','ok',row.updated_at]);
  const job = (await as('admin','select crossfire_prepare_invitation($1,false) as d',[id])).rows[0].d;
  await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[job.user_id,job.profile.email,JSON.stringify({crossfire_request_id:id})]);
  const student = (await as('admin','select crossfire_provision_student($1) as d',[job.job_id])).rows[0].d;
  const pass = (await db.query('select pass_code from users where id=$1',[job.user_id])).rows[0].pass_code;
  return { requestId:id, userId:job.user_id, pass, student };
}

await test('admins, volunteers and judges work with a password-only (aal1) session',async()=>{
  assert.ok((await as('admin','select crossfire_ops_snapshot() as s')).rows[0].s.actor);
  assert.ok((await as('volunteer','select crossfire_ops_snapshot() as s')).rows[0].s.actor);
  assert.ok((await as('judge','select crossfire_judge_snapshot() as s')).rows[0].s);
  assert.ok((await as('admin','select crossfire_list_registration_requests() as d')).rows[0].d);
});
await test('super admin still requires authenticator verification (aal2)',async()=>{
  await denied(as('super_admin','select crossfire_ops_snapshot()',[],'aal1'));
  assert.ok((await as('super_admin','select crossfire_ops_snapshot() as s',[],'aal2')).rows[0].s.actor);
});
await test('inactive staff remain blocked without MFA',async()=>{
  await db.query('update users set active=false where id=$1',[actors.admin]);
  await denied(as('admin','select crossfire_ops_snapshot()'));
  await db.query('update users set active=true where id=$1',[actors.admin]);
});
await test('admins still cannot change system settings or create admin-level access',async()=>{
  await denied(as('admin',"select crossfire_ops_action('settings.portal','{\"open\":true}')"),/super admin/);
  await denied(as('admin',"select crossfire_ops_action('staff.access',$1::jsonb)",[JSON.stringify({id:actors.judge,role:'admin',active:true})]),/super admin/);
});
for (const actor of [null,'student']) await test(`${actor||'anonymous'} cannot read the live revision`,async()=>{
  await denied(as(actor,'select crossfire_live_revision()'));
});
await test('live revision advances on public intake and staff actions',async()=>{
  const before = await revision();
  await submit(50);
  const afterIntake = await revision();
  assert.ok(afterIntake>before);
  await as('admin',"select crossfire_ops_action('guest.save',$1::jsonb)",[JSON.stringify({id:randomUUID(),name:'Guest One',designation:'Principal',organization:'College',category:'Chief Guest'})]);
  assert.ok(await revision('volunteer')>afterIntake);
  assert.equal(await revision('judge'),await revision('super_admin'));
});
await test('reading the live revision does not change it',async()=>{
  const a = await revision(); const b = await revision(); assert.equal(a,b);
});

await portal(true);
await as('admin','select crossfire_mail_configuration($1::jsonb)',[JSON.stringify({sender_name:'College CrossFire',sender_email:'events@college.example',reply_to:'help@college.example',enabled:true})]);
const first = await provisionedStudent(1);
await test('provisioned student is stored with registrations and a pass',async()=>{
  assert.match(first.pass,/^CF26-/);
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[first.userId])).rows[0].n,2);
  const snapshot = (await as('admin','select crossfire_ops_snapshot() as s')).rows[0].s;
  assert.ok(snapshot.students.some(s=>s.pass_id===first.pass));
});
for (const actor of ['admin','volunteer','judge','student',null]) await test(`${actor||'anonymous'} cannot delete student data`,async()=>{
  await denied(as(actor,'select crossfire_delete_student($1,$2)',[first.userId,first.pass]));
  await denied(as(actor,'select crossfire_delete_registration_request($1)',[first.requestId]));
});
await test('super admin delete requires aal2 and the matching pass ID',async()=>{
  await denied(as('super_admin','select crossfire_delete_student($1,$2)',[first.userId,first.pass],'aal1'));
  await assert.rejects(as('super_admin','select crossfire_delete_student($1,$2)',[first.userId,'CF26-WRONG'],'aal2'),/Confirm the student pass ID/);
  await assert.rejects(as('super_admin','select crossfire_delete_student($1,$2)',[actors.admin,'x'],'aal2'),/Student not found/);
});
await test('super admin cannot delete a request that already has a student account',async()=>{
  await assert.rejects(as('super_admin','select crossfire_delete_registration_request($1)',[first.requestId],'aal2'),/Delete the student instead/);
});
await test('super admin permanently deletes a student and every linked record',async()=>{
  const counters = async()=>(await db.query("select sum(current_participants)::int n from events")).rows[0].n;
  const before = await counters(); const rev = await revision();
  const result = (await as('super_admin','select crossfire_delete_student($1,$2) as r',[first.userId,first.pass.toLowerCase()],'aal2')).rows[0].r;
  assert.deepEqual(result,{deleted:true,login_removed:true});
  for (const [sql,arg] of [['select count(*)::int n from users where id=$1',first.userId],['select count(*)::int n from registrations where user_id=$1',first.userId],
    ['select count(*)::int n from auth.users where id=$1',first.userId],['select count(*)::int n from crossfire_registration_requests where id=$1',first.requestId],
    ['select count(*)::int n from crossfire_student_accounts where request_id=$1',first.requestId],['select count(*)::int n from crossfire_student_invitations where request_id=$1',first.requestId]])
    assert.equal((await db.query(sql,[arg])).rows[0].n,0,sql);
  assert.equal(await counters(),before-2);
  assert.ok(await revision()>rev);
  const audit = (await db.query("select actor_id,old_values from audit_logs where action='student.deleted'")).rows[0];
  assert.equal(audit.actor_id,actors.super_admin);
  assert.equal(audit.old_values.pass_code,first.pass);
});
await test('super admin deletes a pending intake request; admins still review it',async()=>{
  const id = await submit(60);
  await denied(as('admin','select crossfire_delete_registration_request($1)',[id]));
  await as('super_admin','select crossfire_delete_registration_request($1)',[id],'aal2');
  assert.equal((await db.query('select count(*)::int n from crossfire_registration_requests where id=$1',[id])).rows[0].n,0);
  await assert.rejects(as('super_admin','select crossfire_delete_registration_request($1)',[id],'aal2'),/not found/);
});
await test('other students remain untouched by a delete',async()=>{
  const second = await provisionedStudent(2);
  const third = await provisionedStudent(3);
  await as('super_admin','select crossfire_delete_student($1,$2)',[second.userId,second.pass],'aal2');
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[third.userId])).rows[0].n,2);
});
console.log(`\n${count} live-operations and access checks passed in a disposable local database.`);
