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
for (const name of ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql']) {
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
const firstId=randomUUID(); let firstReceipt;
await test('anonymous submission saves a private pending request without Auth or pass creation',async()=>{
  firstReceipt=(await submit(profile(),firstId)).rows[0].receipt;
  assert.match(firstReceipt.reference_code,/^CFREQ-[A-F0-9]{16}$/);
  assert.deepEqual(Object.keys(firstReceipt).sort(),['reference_code','status']);
  assert.equal((await db.query('select count(*)::int as n from auth.users')).rows[0].n,5);
  assert.equal((await db.query('select count(*)::int as n from users')).rows[0].n,5);
  assert.equal((await db.query('select count(*)::int as n from registrations')).rows[0].n,0);
  const row=(await db.query('select * from crossfire_registration_requests where id=$1',[firstId])).rows[0];
  assert.equal(row.status,'pending'); assert.equal(row.reviewed_by,null); assert.equal(row.profile.email,profile().email);
});
await test('retry with the same request ID returns one receipt without duplicate data',async()=>{
  for(let n=0;n<4;n++) assert.deepEqual((await submit(profile(),firstId)).rows[0].receipt,firstReceipt);
  assert.equal((await db.query('select count(*)::int as n from crossfire_registration_requests')).rows[0].n,1);
});
await test('an existing submission cannot be overwritten with the same request ID',()=>denied(submit({...profile(),student_name:'Changed'},firstId),/reference/));
await test('contact formatting is normalized and email is never marked verified',async()=>{
  await submit({...profile(2),email:' STUDENT2@EXAMPLE.TEST ',contact_number:'+91 90000 00002'});
  const row=(await db.query("select profile from crossfire_registration_requests where profile->>'email'='student2@example.test'")).rows[0];
  assert.equal(row.profile.contact_number,'919000000002'); assert.ok(!('email_verified' in row.profile));
});
for (const actor of [null,'student','judge','volunteer','admin']) await test(`${actor||'anonymous'} cannot read or mutate the request table directly`,async()=>{
  await denied(as(actor,'select * from crossfire_registration_requests'));
  await denied(as(actor,"update crossfire_registration_requests set status='reviewed'"));
});
for (const actor of [null,'student','judge','volunteer']) await test(`${actor||'anonymous'} cannot list or review other students`,async()=>{
  await denied(list(actor)); await denied(review(actor,firstId,'reviewed','',new Date().toISOString()));
});
await test('admins need MFA to read or review requests',async()=>{
  await denied(list('admin','all','',0,'aal1')); await denied(review('admin',firstId,'reviewed','',new Date().toISOString(),'aal1'));
});
await test('suspended staff immediately lose review access',async()=>{
  await db.query('update users set active=false where id=$1',[actors.admin]);
  await denied(list('admin')); await db.query('update users set active=true where id=$1',[actors.admin]);
});
await test('admin and super admin can search pending submissions',async()=>{
  for(const actor of ['admin','super_admin']) { const data=(await list(actor,'pending',firstReceipt.reference_code)).rows[0].data; assert.equal(data.total,1); assert.equal(data.items[0].id,firstId); }
});
await test('missing, false and string consent are rejected',async()=>{
  for(const consent of [null,false,'true']) await denied(submit({...profile(20),parent_consent:consent}),/consent/);
});
await test('role, account and review fields cannot be injected',async()=>{
  for(const key of ['role','status','email_verified','pass_code','reviewed_by']) await denied(submit({...profile(20),[key]:'admin'}),/Unexpected/);
});
await test('invalid field types, contact details, enums, body size and honeypots are rejected',async()=>{
  for(const change of [{email:'bad'},{email:['test@example.test']},{student_name:'X'},{contact_number:'abc'},{board:'Other'},{food_preference:'Other'},{website:'spam'},{student_name:'A'.repeat(9000)}]) await assert.rejects(submit({...profile(20),...change}));
});
await test('unknown, duplicate, oversized and cross-group selections are rejected',async()=>{
  for(const selected_competitions of [[],{},[null],['Unknown'],['Event 1','Event 1'],['Event 1','Event 2','Event 3'],['Event 1','Event 2','Event 3','Event 4','Event 5']]) await assert.rejects(submit({...profile(20),selected_competitions}));
});
await test('closed and draft competitions cannot accept requests',async()=>{
  for(const status of ['draft','registration_closed','in_progress','completed']) {
    await db.query('update events set status=$1 where name=$2',[status,'Event 1']); await denied(submit(profile(20)),/closed/);
  }
  await db.exec("update events set status='open'");
});
await test('submission deadlines are enforced and already-saved retries still work',async()=>{
  await db.exec("update events set registration_deadline=now()-interval '1 day' where name='Event 1'");
  await denied(submit(profile(20)),/closed/); assert.deepEqual((await submit(profile(),firstId)).rows[0].receipt,firstReceipt);
  await db.exec("update events set registration_deadline=now()+interval '1 day'");
});
await test('contact limits are enforced across new IDs without exposing existing receipts',async()=>{
  for(let n=0;n<3;n++) await submit(profile(30));
  await denied(submit(profile(30)),/limit/);
  await denied(submit({...profile(31),contact_number:profile(30).contact_number}),/limit/);
  await denied(submit({...profile(31),email:profile(30).email}),/limit/);
});
await test('review saves an audit entry but creates no account, pass, or registration',async()=>{
  const before=(await list('admin','pending',firstReceipt.reference_code)).rows[0].data.items[0];
  await review('admin',firstId,'reviewed','Contact student for details',before.updated_at);
  const after=(await list('super_admin','reviewed',firstReceipt.reference_code)).rows[0].data.items[0];
  assert.equal(after.review_notes,'Contact student for details'); assert.equal(after.reviewed_by,actors.admin);
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='registration_request_reviewed'")).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int as n from users')).rows[0].n,5);
  assert.equal((await db.query('select count(*)::int as n from registrations')).rows[0].n,0);
  await denied(review('super_admin',firstId,'declined','Old review',before.updated_at),/changed/);
});
await test('declining requires a reason, and status cannot be promoted to approved or privileged',async()=>{
  const entry=(await list('admin','all',firstReceipt.reference_code)).rows[0].data.items[0];
  await denied(review('admin',firstId,'declined','',entry.updated_at),/reason/);
  await denied(review('admin',firstId,'approved','',entry.updated_at),/Invalid/);
  await review('super_admin',firstId,'pending','Follow up',entry.updated_at);
});
await test('review filters validate and search treats SQL metacharacters literally',async()=>{
  await denied(list('admin','bad'),/filter/); await denied(list('admin','all','',-1),/filter/);
  assert.equal((await list('admin','all',"' OR 1=1 --")).rows[0].data.total,0);
});
await test('private review pagination is bounded and intake has a global hourly ceiling',async()=>{
  await db.query("insert into crossfire_registration_requests(id,profile,events) select gen_random_uuid(),$1::jsonb,'[]'::jsonb from generate_series(1,1000)",[JSON.stringify(profile(80))]);
  const first=(await list('admin')).rows[0].data; const second=(await list('admin','all','',1)).rows[0].data;
  assert.equal(first.items.length,25); assert.equal(second.items.length,25); assert.notEqual(first.items[0].id,second.items[0].id);
  await denied(submit(profile(90)),/limit/);
});
console.log(`\n${count} student intake checks passed. Disposable local database only; no live registrations or emails created.`);
await db.close();
