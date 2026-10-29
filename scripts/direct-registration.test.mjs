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
const migration = name => readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
for (const name of ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql','20261020_student_invitations.sql','20261029_live_ops_and_access.sql']) await db.exec(await migration(name));
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
const profile = n => ({student_name:'Test Student '+n,email:`student${n}@example.test`,contact_number:String(9000000000+n),whatsapp_number:String(9000000000+n),institute_name:'Test School',city_town:'Test City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',selected_competitions:['Event 1','Event 4'],parent_consent:true,terms_accepted:true,website:''});
const submit = async (n,id=randomUUID()) => ({ id, result:(await as(null,'select crossfire_submit_registration_request($1,$2::jsonb) as d',[id,JSON.stringify(profile(n))])).rows[0].d });
const status = async id => (await db.query('select status from crossfire_registration_requests where id=$1',[id])).rows[0].status;
const records = async (actor='admin') => (await as(actor,'select crossfire_student_records() as d',[],actor==='super_admin'?'aal2':'aal1')).rows[0].d;

// Requests saved under the review workflow, before this migration.
const legacyPending = (await submit(1)).id;
const legacyDeclined = (await submit(2)).id;
const declinedRow = (await as('admin','select crossfire_list_registration_requests($1,$2,$3) as d',['all','student2@example.test',0])).rows[0].d.items[0];
await as('admin','select crossfire_review_registration_request($1,$2,$3,$4)',[legacyDeclined,'declined','duplicate',declinedRow.updated_at]);

await db.exec(await migration('20261029160000_direct_registration.sql'));
// Reapplying must be harmless.
await db.exec(await migration('20261029160000_direct_registration.sql'));

await test('pending requests become registered; declined requests are preserved',async()=>{
  assert.equal(await status(legacyPending),'registered');
  assert.equal(await status(legacyDeclined),'declined');
});
await test('new submissions are registered immediately with a CFREQ reference',async()=>{
  const { id, result } = await submit(3);
  assert.equal(result.status,'registered');
  assert.match(result.reference_code,/^CFREQ-[A-F0-9]{16}$/);
  assert.equal(await status(id),'registered');
});
await test('retrying the same submission returns the same receipt',async()=>{
  const id = randomUUID();
  const a = (await submit(4,id)).result; const b = (await submit(4,id)).result;
  assert.deepEqual(a,b);
  assert.equal((await db.query('select count(*)::int n from crossfire_registration_requests where id=$1',[id])).rows[0].n,1);
});
await test('a retry of a declined registration is refused',async()=>{
  await assert.rejects(submit(2,legacyDeclined),/declined/);
});
await test('honeypot and group limits still apply',async()=>{
  await assert.rejects(as(null,'select crossfire_submit_registration_request($1,$2::jsonb)',[randomUUID(),JSON.stringify({...profile(5),website:'spam'})]),/Unable to accept/);
  await assert.rejects(as(null,'select crossfire_submit_registration_request($1,$2::jsonb)',[randomUUID(),JSON.stringify({...profile(5),selected_competitions:['Event 1','Event 2','Event 3']})]),/no more than 2/);
});
for (const actor of [null,'student','volunteer','judge']) await test(`${actor||'anonymous'} cannot read student records`,async()=>{
  await denied(as(actor,'select crossfire_student_records()'));
});
await test('admins and super admins can read student records',async()=>{
  assert.ok(Array.isArray(await records('admin')));
  assert.ok(Array.isArray(await records('super_admin')));
});

await db.query("insert into system_settings(key,value) values('student_portal_open','true'::jsonb) on conflict(key) do update set value=excluded.value");
await as('admin','select crossfire_mail_configuration($1::jsonb)',[JSON.stringify({sender_name:'College CrossFire',sender_email:'events@college.example',reply_to:'help@college.example',enabled:true})]);
await test('registered requests can be invited and provisioned without a review step',async()=>{
  const job = (await as('admin','select crossfire_prepare_invitation($1,false) as d',[legacyPending])).rows[0].d;
  await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[job.user_id,job.profile.email,JSON.stringify({crossfire_request_id:legacyPending})]);
  const student = (await as('admin','select crossfire_provision_student($1) as d',[job.job_id])).rows[0].d;
  assert.match(student.pass_id,/^CF26-/);
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[job.user_id])).rows[0].n,2);
});
await test('declined requests cannot be invited',async()=>{
  await assert.rejects(as('admin','select crossfire_prepare_invitation($1,false)',[legacyDeclined]),/not eligible/);
});
await test('student records list every registration once, with accounts merged',async()=>{
  const list = await records();
  const total = (await db.query('select count(*)::int n from crossfire_registration_requests')).rows[0].n;
  assert.equal(list.filter(r=>r.id.startsWith('request:')).length,total-1);
  const provisioned = list.filter(r=>r.request_id===legacyPending);
  assert.equal(provisioned.length,1);
  assert.ok(provisioned[0].id.startsWith('account:'));
  assert.match(provisioned[0].pass_code,/^CF26-/);
  assert.equal(provisioned[0].competitions,'Event 1, Event 4');
  assert.equal(list.find(r=>r.request_id===legacyDeclined).status,'declined');
  for (const row of list.filter(r=>r.id.startsWith('request:'))) assert.equal(row.pass_code,null);
});
console.log(`\n${count} direct-registration checks passed in a disposable local database.`);
