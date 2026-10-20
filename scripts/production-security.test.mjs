import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.on('uncaughtException',error=>{console.error('FAIL:',error.message,error.where||'');process.exit(1);});
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`);
const base=(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8')).split('-- 13. SEED:')[0].replace('create extension if not exists pgcrypto;','');
await db.exec(base);
for(const file of ['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase/migrations/20261019_production_security.sql',import.meta.url),'utf8'));
const id=Object.fromEntries(['admin','judge','judge2','student','student2','unverified','foreign','e1','e2','r1','r2'].map((name,i)=>[name,`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`]));
for(const [name,role] of [['admin','super_admin'],['judge','judge'],['judge2','judge'],['student','student'],['student2','student'],['unverified','student']]){
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)',[id[name],name+'@example.test',name==='unverified'?null:new Date().toISOString()]);
  await db.query("insert into public.users(id,email,first_name,role,contact_number,whatsapp_number,institute_name,city_town,course_stream,board,food_preference,parent_consent,terms_accepted) values($1,$2,$3,$4,'9000000000','9000000000','Test School','Test City','12th Science','CBSE','Veg',true,true)",[id[name],name+'@example.test',name,role]);
}
await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'foreign@example.test',now())",[id.foreign]);
for(const [name,slug] of [['e1','quiz'],['e2','poster-making']])await db.query(`insert into events(id,name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location) values($1,$2,$2,'Group A','Test','test','solo',1,100,'{"criteria":[{"name":"Quality","max":60,"weight":60},{"name":"Clarity","max":40,"weight":40}]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Test Hall')`,[id[name],slug]);
await db.query('insert into registrations(id,user_id,event_id) values($1,$2,$3),($4,$5,$6)',[id.r1,id.student,id.e1,id.r2,id.student2,id.e2]);
await db.query('insert into judge_assignments(event_id,judge_id) values($1,$2)',[id.e1,id.judge]);
async function as(actor,sql,args=[],aal='aal2'){
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[actor?id[actor]:'',JSON.stringify({aal,role:'authenticated'})]);
  await db.exec('set role '+(actor?'authenticated':'anon'));
  try{return await db.query(sql,args);}finally{await db.exec('reset role');}
}
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS: '+name);}
const denied=(promise,pattern=/permission|not assigned|not found|Verify|unavailable|Sign in/)=>assert.rejects(promise,pattern);
await test('anonymous callers cannot read participant data',()=>denied(as(null,'select * from users')));
await test('public event discovery works without staff helper permissions and hides drafts',async()=>{
  assert.equal((await as(null,'select id from events')).rows.length,2);
  await db.query("update events set status='draft' where id=$1",[id.e2]);
  assert.equal((await as(null,'select id from events')).rows.length,1);
  assert.equal((await as('admin','select id from events')).rows.length,2);
  await db.query("update events set status='open' where id=$1",[id.e2]);
});
await test('anonymous callers cannot execute profile or judge snapshots',async()=>{await denied(as(null,'select crossfire_current_profile()'));await denied(as(null,'select crossfire_judge_snapshot()'));});
await test('staff password-only sessions cannot access operations',()=>denied(as('admin','select crossfire_ops_snapshot()',[],'aal1')));
await test('staff MFA sessions can access operations',async()=>assert.equal((await as('admin','select crossfire_ops_snapshot() as data')).rows[0].data.actor.role,'super_admin'));
await test('unverified email cannot restore profile or register',async()=>{await denied(as('unverified','select crossfire_current_profile()'));await denied(as('unverified','select ensure_profile()'));});
await test('student cannot grant self staff privileges through REST',()=>denied(as('student',"update users set role='super_admin' where id=$1",[id.student])));
await test('suspended student loses direct REST and RPC access',async()=>{await db.query('update users set active=false where id=$1',[id.student]);assert.equal((await as('student','select * from users')).rows.length,0);await denied(as('student','select crossfire_registration_receipt()'));await db.query('update users set active=true where id=$1',[id.student]);});
await test('student reads only own registrations',async()=>{const rows=(await as('student','select crossfire_my_registrations() as data')).rows[0].data;assert.equal(rows.length,1);assert.equal(rows[0].id,id.r1);});
const profile={first_name:'Student',contact_number:'9000000000',whatsapp_number:'9000000000',institute_name:'Test School',city_town:'Test City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',parent_consent:true,terms_accepted:true};
await test('registration requires consent and the verified account email',async()=>{
  await denied(as('student','select submit_registration_form($1::jsonb,$2::text[])',[JSON.stringify({...profile,parent_consent:false}),['quiz']]),/consent/);
  await denied(as('student','select submit_registration_form($1::jsonb,$2::text[])',[JSON.stringify({...profile,email:'someoneelse@example.test'}),['quiz']]),/verified email/);
});
await test('registration ignores privileged fields and saves a real receipt',async()=>{
  await as('student','select submit_registration_form($1::jsonb,$2::text[])',[JSON.stringify({...profile,first_name:'student',role:'super_admin',pass_code:'FAKE',active:false}),['quiz']]);
  const row=(await db.query('select role,active,pass_code from users where id=$1',[id.student])).rows[0];assert.equal(row.role,'student');assert.equal(row.active,true);assert.notEqual(row.pass_code,'FAKE');
});
await test('media ownership and HTTPS links are enforced on the server',async()=>{
  await denied(as('student','select submit_media($1,$2)',[id.r2,'https://example.test/art']),/not found/);
  for(const url of ['javascript:alert(1)','http://example.test/art','https://name:password@example.test/art'])await denied(as('student2','select submit_media($1,$2)',[id.r2,url]),/HTTPS/);
  await as('student2','select submit_media($1,$2)',[id.r2,'https://example.test/art']);assert.equal((await db.query('select media_url from registrations where id=$1',[id.r2])).rows[0].media_url,'https://example.test/art');
});
await test('withdrawal cannot target another student',()=>denied(as('student','select withdraw_registration($1)',[id.r2]),/not found/));
await test('receipt uses a random pass identifier',async()=>assert.match((await as('student','select crossfire_registration_receipt() as data')).rows[0].data.pass_code,/^CF26-[A-F0-9]{32}$/));
await test('judge snapshot excludes contact details and unassigned entries',async()=>{const data=(await as('judge','select crossfire_judge_snapshot() as data')).rows[0].data;assert.equal(data.events.length,1);assert.equal(data.candidates.length,1);assert.equal(data.candidates[0].id,id.r1);assert.ok(!JSON.stringify(data.candidates).includes('example.test'));assert.ok(!JSON.stringify(data.candidates).includes('9000000000'));});
await test('judge REST cannot bypass minimal profile snapshot',async()=>assert.equal((await as('judge',"select * from users where role='student'")).rows.length,0));
await test('unassigned judge cannot score a known registration ID',()=>denied(as('judge2','select submit_score($1,$2::jsonb)',[id.r1,JSON.stringify({Quality:50,Clarity:30})])));
await test('scoring is denied outside event lifecycle',()=>denied(as('judge','select submit_score($1,$2::jsonb)',[id.r1,JSON.stringify({Quality:50,Clarity:30})]),/in progress/));
await db.query("update events set status='in_progress' where id=$1",[id.e1]);
await test('started events cannot be removed through either registration API',async()=>{
  await denied(as('student','select withdraw_registration($1)',[id.r1]),/window/);
  await denied(as('student','select submit_registration_form($1::jsonb,$2::text[])',[JSON.stringify(profile),['poster-making']]),/window/);
});
await test('absent participants cannot be scored',()=>denied(as('judge','select submit_score($1,$2::jsonb)',[id.r1,JSON.stringify({Quality:50,Clarity:30})]),/check in/));
await db.query('update users set checked_in_at=now() where id=$1',[id.student]);await db.query('update registrations set room_reported_at=now() where id=$1',[id.r1]);
for(const values of [{Quality:'NaN',Clarity:20},{Quality:61,Clarity:20},{Quality:20},{Quality:20,Clarity:20,Extra:10}])await test('invalid rubric is rejected: '+JSON.stringify(values),()=>denied(as('judge','select submit_score($1,$2::jsonb)',[id.r1,JSON.stringify(values)]),/numeric|range|criteria/));
await test('final evaluation persists and locks for the specific judge',async()=>{assert.equal((await as('judge','select submit_score($1,$2::jsonb) as score',[id.r1,JSON.stringify({Quality:50,Clarity:30})])).rows[0].score,'80');await denied(as('judge','select submit_score($1,$2::jsonb)',[id.r1,JSON.stringify({Quality:51,Clarity:30})]),/locked/);});
await test('unpublished scores do not appear publicly',async()=>assert.equal((await as(null,'select * from get_leaderboard()')).rows.length,0));
await db.query("update events set status='completed' where id=$1",[id.e1]);
await test('completed event publishes only public ranking fields',async()=>{const rows=(await as(null,'select * from get_leaderboard()')).rows;assert.equal(rows.length,1);assert.equal(rows[0].participant_name,'student');assert.ok(!JSON.stringify(rows).includes('example.test'));});
await test('sensitive settings cannot be enumerated',async()=>{await db.query("insert into system_settings(key,value) values('private_test','\"private\"')");assert.equal((await as(null,"select get_system_setting('private_test') as value")).rows[0].value,null);assert.equal((await as(null,"select * from system_settings where key='private_test'")).rows.length,0);});
await test('MFA is required before creating any Auth accounts',()=>denied(as('admin','select crossfire_provision_guard()',[],'aal1')));
await test('server rate limit bounds staff provisioning',async()=>{for(let i=0;i<20;i++)await as('admin','select crossfire_provision_guard()');await denied(as('admin','select crossfire_provision_guard()'),/limit/);});
await test('profile bootstrap cannot assign a privileged role',async()=>{await as('foreign','select ensure_profile()');assert.equal((await db.query('select role from users where id=$1',[id.foreign])).rows[0].role,'student');});
console.log('\n'+passed+' production security checks passed. No live database or emails used.');
await db.close();
