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
for (const name of ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql','20261020_student_invitations.sql']) {
  await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
}
// Reapplying the additive migration must preserve requests and policies.
await db.exec(await readFile(new URL('../supabase/migrations/20261020_registration_intake.sql',import.meta.url),'utf8'));
const actors = {};
for (const role of ['admin','super_admin','student','judge','volunteer']) {
  actors[role] = randomUUID();
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[actors[role],role+'@example.test']);
  await db.query('insert into users(id,email,first_name,role) values($1,$2,$3::text,$3::user_role)',[actors[role],role+'@example.test',role]);
}
for (let n=1;n<=6;n++) await db.query(`insert into events(name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
  values($1,$2,$3,'Test only','test','solo',1,100,'{"criteria":[]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Test Hall')`,['Event '+n,'event-'+n,n<=3?'Group A':'Group B']);
async function as(actor, sql, args=[], aal='aal2') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[actors[actor]||'',JSON.stringify({aal,role:actor?'authenticated':'anon'})]);
  await db.exec('set role '+(actor?'authenticated':'anon'));
  try { return await db.query(sql,args); } finally { await db.exec('reset role'); }
}
let count=0;
const profile = (n=1) => ({student_name:'Test Student',email:`student${n}@example.test`,contact_number:String(9000000000+n),whatsapp_number:String(9000000000+n),institute_name:'Test School',city_town:'Test City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',selected_competitions:['Event 1','Event 4'],parent_consent:true,terms_accepted:true,website:''});
const submit = (data=profile(),id=randomUUID()) => as(null,'select crossfire_submit_registration_request($1,$2::jsonb) as receipt',[id,JSON.stringify(data)]);
const list = (actor='admin',status='all',search='',page=0,aal='aal2') => as(actor,'select crossfire_list_registration_requests($1,$2,$3) as data',[status,search,page],aal);
const review = (actor,id,status,notes,updated,aal='aal2') => as(actor,'select crossfire_review_registration_request($1,$2,$3,$4)',[id,status,notes,updated],aal);
const test = async(name,fn)=>{ await fn(); count++; console.log('PASS: '+name); };
const denied = (promise,pattern=/permission|role|Sign in|sign in|denied|access/i)=>assert.rejects(promise,pattern);
const settings={sender_name:'College CrossFire',sender_email:'events@college.example',reply_to:'help@college.example',enabled:true};
const configure=(actor='admin',value=settings,aal='aal2')=>as(actor,'select crossfire_mail_configuration($1::jsonb) as data',[value===null?null:JSON.stringify(value)],aal);
const prepare=(actor,id,resend=false,aal='aal2')=>as(actor,'select crossfire_prepare_invitation($1,$2) as data',[id,resend],aal);
const provision=(actor,id)=>as(actor,'select crossfire_provision_student($1) as data',[id]);
const guard=(actor,id)=>as(actor,'select crossfire_invitation_send_guard($1)',[id]);
const finish=async(id,status='accepted',failure=null)=>{
  await db.exec('set role service_role');
  try { return await db.query('select crossfire_finish_invitation($1,$2,$3,$4)',[id,status,status==='accepted'?'provider-fixture':null,failure]); }
  finally { await db.exec('reset role'); }
};
const portal=async(open)=>db.query("insert into system_settings(key,value) values('student_portal_open',$1::jsonb) on conflict(key) do update set value=excluded.value",[JSON.stringify(open)]);
async function request(n=1) {
  const id=randomUUID(); await submit(profile(n),id);
  const row=(await list('admin','all',`student${n}@example.test`)).rows[0].data.items.find(r=>r.id===id);
  await review('admin',id,'reviewed','Details checked',row.updated_at);
  return id;
}
async function account(job, trusted=true) {
  await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[job.user_id,job.profile.email,JSON.stringify(trusted?{crossfire_request_id:job.request_id}:{})]);
}
await db.exec('grant usage on schema public to service_role');
await test('official mail defaults to disabled without a sender',async()=>{
  const row=(await configure('admin',null)).rows[0].data;
  assert.equal(row.enabled,false);assert.equal(row.sender_email,'');
});
for (const actor of [null,'student','judge','volunteer']) await test(`${actor||'anonymous'} cannot read sender configuration or prepare invitations`,async()=>{
  await denied(configure(actor));await denied(prepare(actor,randomUUID()));await denied(as(actor,'select crossfire_invitation_status($1)',[[]]));
});
await test('admin MFA and active state are enforced for sender configuration',async()=>{
  await denied(configure('admin',settings,'aal1'));
  await db.query('update users set active=false where id=$1',[actors.admin]);await denied(configure());await db.query('update users set active=true where id=$1',[actors.admin]);
});
await test('both manager roles can save sender details but cannot inject secrets or header data',async()=>{
  for(const actor of ['admin','super_admin']) assert.equal((await configure(actor)).rows[0].data.sender_email,settings.sender_email);
  for(const value of [{...settings,api_key:'not-a-key'},{...settings,sender_name:'Name\nBcc: somebody'},{...settings,sender_email:'a@example.org\nBcc: b@example.org'},{...settings,enabled:'true'},{...settings,sender_name:null}]) await denied(configure('admin',value),/valid sender/);
});
for(const table of ['crossfire_mail_settings','crossfire_student_accounts','crossfire_student_invitations']) await test(`${table} is inaccessible directly even to authenticated admins`,async()=>{await denied(as('admin',`select * from ${table}`));await denied(as('student',`select * from ${table}`));});
const first=await request();
await test('closed student portal prevents invitations',()=>denied(prepare('admin',first),/open the student portal/));
await portal(true);
await test('disabled sender prevents invitations',async()=>{await configure('admin',{...settings,enabled:false});await denied(prepare('admin',first),/Enable/);await configure();});
await test('pending and declined requests cannot be invited',async()=>{const id=randomUUID();await submit(profile(2),id);await denied(prepare('admin',id),/Review/);});
let job;
await test('a reviewed request reserves one account ID and serializes invitation attempts',async()=>{
  job=(await prepare('admin',first)).rows[0].data;
  assert.equal(job.profile.email,profile().email);assert.ok(job.job_id);assert.ok(job.user_id);
  await denied(prepare('super_admin',first),/in progress/);
  assert.equal((await db.query('select count(*)::int n from crossfire_student_accounts')).rows[0].n,1);
});
await test('unrelated shared-project identities cannot be adopted',async()=>{
  await account(job,false);await denied(provision('admin',job.job_id),/does not belong/);
  await db.query('update auth.users set raw_app_meta_data=$2 where id=$1',[job.user_id,JSON.stringify({crossfire_request_id:first})]);
});
await test('only the initiating active admin can provision a reserved account',async()=>{
  await denied(provision('super_admin',job.job_id),/cannot be provisioned/);
  await denied(provision('student',job.job_id));
});
await test('approved intake imports after registration closes and atomically creates all entries',async()=>{
  await db.exec("update events set status='registration_closed',registration_deadline=now()-interval '1 hour'");
  const receipt=(await provision('admin',job.job_id)).rows[0].data;
  assert.match(receipt.student_id,/^CFS-\d+$/);assert.match(receipt.pass_id,/^CF26-[A-F0-9]{32}$/);
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[job.user_id])).rows[0].n,2);
  const auth=(await db.query('select email_confirmed_at from auth.users where id=$1',[job.user_id])).rows[0];assert.equal(auth.email_confirmed_at,null);
});
await test('approved records cannot be silently declined after account creation',async()=>{
  const row=(await db.query('select updated_at from crossfire_registration_requests where id=$1',[first])).rows[0];
  await denied(review('admin',first,'declined','Cancel later',row.updated_at),/approved account exists/);
});
await test('closed portal blocks delivery at the final send guard',async()=>{await portal(false);await denied(guard('admin',job.job_id),/closed/);await portal(true);});
await test('send guard is single-use and results cannot be forged by admin/student browsers',async()=>{
  await guard('admin',job.job_id);await denied(guard('admin',job.job_id),/already sending/);
  for(const actor of ['admin','student']) await denied(as(actor,'select crossfire_finish_invitation($1,$2)',[job.job_id,'accepted']));
  await finish(job.job_id);
});
await test('admin status exposes the provider receipt but never a token or password',async()=>{
  const row=(await as('super_admin','select crossfire_invitation_status($1) as data',[[first]])).rows[0].data[0];
  assert.equal(row.status,'accepted');assert.equal(row.provider_id,'provider-fixture');assert.match(row.student_id,/CFS-/);
  assert.ok(!/token|password|app_metadata/.test(JSON.stringify(row)));
});
await test('repeated clicks cannot send a duplicate or bypass the recovery cooldown',async()=>{
  await denied(prepare('admin',first),/already accepted/);await denied(prepare('admin',first,true),/10 minutes/);
});
await test('explicit recovery keeps the same identity and never duplicates entries',async()=>{
  await db.query("update crossfire_student_invitations set created_at=now()-interval '11 minutes' where id=$1",[job.job_id]);
  const retry=(await prepare('admin',first,true)).rows[0].data;assert.equal(retry.user_id,job.user_id);
  await provision('admin',retry.job_id);await guard('admin',retry.job_id);await finish(retry.job_id,'uncertain','delivery_unknown');
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[job.user_id])).rows[0].n,2);
  await denied(prepare('admin',first,true),/delivery review/);
});
await test('portal closure removes access from already-verified student sessions at SQL and REST boundaries',async()=>{
  actors.approved=job.user_id;await db.query('update auth.users set email_confirmed_at=now() where id=$1',[job.user_id]);
  assert.equal((await as('approved','select crossfire_my_registrations() as data')).rows[0].data.length,2);
  await portal(false);await denied(as('approved','select crossfire_my_registrations()'));
  assert.equal((await as('approved','select * from registrations')).rows.length,0);
  assert.equal((await as('approved','select * from users')).rows.length,0);
  await portal(true);
});
await db.exec("update events set status='open',registration_deadline=now()+interval '1 day'");
const another=await request(3);const anotherJob=(await prepare('admin',another)).rows[0].data;await account(anotherJob);
await test('invalid event state rolls back the entire profile/registration transaction',async()=>{
  await db.exec("update events set status='completed' where name='Event 4'");
  await denied(provision('admin',anotherJob.job_id),/closed/);
  assert.equal((await db.query('select count(*)::int n from users where id=$1',[anotherJob.user_id])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from registrations where user_id=$1',[anotherJob.user_id])).rows[0].n,0);
});
await test('a browser cannot fake the trusted late-registration context',async()=>{
  await as('approved',"select set_config('crossfire.approving_request',$1,false)",[another]);
  await db.exec("update events set status='registration_closed',registration_deadline=now()-interval '1 hour' where name='Event 5'");
  const valid={first_name:'Test Student',contact_number:'9000000001',whatsapp_number:'9000000001',institute_name:'Test School',city_town:'Test City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',parent_consent:true,terms_accepted:true};
  await denied(as('approved','select submit_registration_form($1,$2)',[JSON.stringify(valid),['event-4','event-5']]),/closed/);
});
await test('approved imports still honor capacity overflow and cannot be provisioned twice',async()=>{
  await db.exec("update events set status='registration_closed',max_participants=1,registration_deadline=now()-interval '1 hour'");
  await provision('admin',anotherJob.job_id);
  const entries=(await db.query('select is_overflow from registrations where user_id=$1',[anotherJob.user_id])).rows;
  assert.equal(entries.length,2);assert.ok(entries.every(row=>row.is_overflow));
  await denied(provision('admin',anotherJob.job_id),/cannot be provisioned/);
});
console.log(`\n${count} student invitation database checks passed in a disposable local database. No real accounts or emails created.`);
await db.close();
