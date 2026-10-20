import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.on('uncaughtException', error => { console.error('FAIL:', error.message, error.where || ''); process.exit(1); });

// Disposable, in-memory Postgres. Never reads .env or connects to Supabase.
const db = new PGlite();
const base = (await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')).split('-- 13. SEED:')[0].replace('create extension if not exists pgcrypto;', '');
const migration = await readFile(new URL('../supabase/migrations/20261016_operations.sql', import.meta.url), 'utf8');
await db.exec(`create role anon; create role authenticated; create role service_role;
  create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
await db.exec(base);
await db.exec(migration);
await db.exec(migration); // Re-applying the additive migration must preserve records/contracts.
console.log('PASS: base schema + operations migration install and re-apply');
let passed = 1;
const ids = Object.fromEntries(['super','admin','gate','food','event','guest','otherguest','support','judge','student','student2','e1','e2','r1','r2','vGate','vFood','vEvent','vGuest','vOther','vSupport','newStaff','foreignAuth'].map((key, i) => [key, `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`]));
for (const [key, role] of [['super','super_admin'],['admin','admin'],['gate','volunteer'],['food','volunteer'],['event','volunteer'],['guest','volunteer'],['otherguest','volunteer'],['support','volunteer'],['judge','judge'],['student','student'],['student2','student']]) {
  await db.query('insert into auth.users(id,email) values($1,$2)', [ids[key], `${key}@example.test`]);
  await db.query(`insert into public.users(id,email,first_name,role,contact_number,whatsapp_number,institute_name,city_town,course_stream,food_preference)
    values($1,$2,$3,$4,'9000000000','9000000000','Sample School','Sample City','12th Science','Veg')`, [ids[key], `${key}@example.test`, key, role]);
}
for (const [key, name] of [['e1','Quiz'],['e2','Debate']]) await db.query(`insert into events(id,name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
 values($1,$2,$3,'Group A','Test event','test','solo',1,1000,'{"criteria":[]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Test hall')`, [ids[key],name,name.toLowerCase()]);
for (const [key, account, station] of [['vGate','gate','gate'],['vFood','food','food'],['vEvent','event','event'],['vGuest','guest','guest'],['vOther','otherguest','guest'],['vSupport','support','support']]) await db.query(`insert into volunteers(id,user_id,volunteer_id,name,contact_number,email,ops_station,ops_event_id,attendance_status) values($1,$2,$3,$4,'9000000000',$5,$6,$7,'Present / On Duty')`, [ids[key],ids[account],`VOL-${key}`,account,`${account}@example.test`,station,station==='event'?ids.e1:null]);
await db.query('insert into registrations(id,user_id,event_id) values($1,$2,$3),($4,$2,$5)',[ids.r1,ids.student,ids.e1,ids.r2,ids.e2]);
async function as(actor, query, args=[]) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[actor?ids[actor] || actor:'']);
  await db.exec(`set role ${actor?'authenticated':'anon'}`);
  try { return await db.query(query,args); } finally { await db.exec('reset role'); }
}
const action = (actor,name,payload) => as(actor,'select crossfire_ops_action($1,$2::jsonb) as result',[name,JSON.stringify(payload)]);
const snapshot = async actor => (await as(actor,'select crossfire_ops_snapshot() as data')).rows[0].data;
async function test(name, fn) { await fn(); passed++; console.log(`PASS: ${name}`); }
const denied = (promise, text) => assert.rejects(promise, text);
await test('anonymous callers cannot load operations',()=>denied(as(null,'select crossfire_ops_snapshot()'),/permission denied/));
await test('students and judges cannot open operations',async()=>{await denied(snapshot('student'),/permission/);await denied(snapshot('judge'),/permission/);});
await test('super admin sees shared operational records',async()=>{const s=await snapshot('super');assert.equal(s.staff.length,9);assert.equal(s.students.length,2);assert.equal(s.events.length,2);assert.ok(!JSON.stringify(s).includes('password'));});
await test('event volunteers only see their event registrations',async()=>{const s=await snapshot('event');assert.equal(s.students.length,1);assert.equal(s.students[0].registrations.length,1);assert.equal(s.students[0].registrations[0].event_id,ids.e1);assert.equal(s.staff.length,0);});
await test('support volunteer cannot read students through REST',async()=>{assert.equal((await as('support',"select id from users where role='student'")).rows.length,0);});
await test('volunteer password column and legacy login are inaccessible',async()=>{await denied(as('admin','select password from volunteers'),/permission denied/);await denied(as(null,"select verify_volunteer_login('x','x')"),/permission denied/);});
await test('food desk cannot issue before gate check-in',()=>denied(action('food','student.meal',{id:ids.student}),/Check in/));
await test('wrong station cannot check in a student',()=>denied(action('food','student.checkin',{id:ids.student}),/gate volunteers/));
await test('student without registrations cannot check in',()=>denied(action('gate','student.checkin',{id:ids.student2}),/no active/));
await test('gate check-in persists and repeat check-in is idempotent',async()=>{await action('gate','student.checkin',{id:ids.student});const first=(await snapshot('gate')).students.find(s=>s.id===ids.student).checked_in_at;await action('gate','student.checkin',{id:ids.student});assert.equal((await snapshot('gate')).students.find(s=>s.id===ids.student).checked_in_at,first);});
await test('gate volunteer cannot issue meals through legacy endpoint',()=>denied(as('gate','select staff_set_food_redeemed($1,true)',[ids.student]),/meal volunteers/));
await test('meal issuance persists and duplicates are rejected',async()=>{await action('food','student.meal',{id:ids.student});assert.ok((await snapshot('food')).students.find(s=>s.id===ids.student).food_redeemed_at);await denied(action('food','student.meal',{id:ids.student}),/already been redeemed/);});
await test('volunteers cannot reverse attendance or meals',async()=>{await denied(as('gate','select staff_set_check_in($1,false)',[ids.student]),/Only an admin/);await denied(as('food','select staff_set_food_redeemed($1,false)',[ids.student]),/Only an admin/);});
await test('event attendance changes only the assigned event',async()=>{await action('event','student.room',{id:ids.r1});await denied(action('event','student.room',{id:ids.r2}),/not assigned/);const s=await snapshot('super');const regs=s.students.find(s=>s.id===ids.student).registrations;assert.ok(regs.find(r=>r.id===ids.r1).room_reported_at);assert.equal(regs.find(r=>r.id===ids.r2).room_reported_at,null);});
await test('break removes student access and actions until resumed',async()=>{await action('gate','volunteer.attendance',{id:ids.vGate,status:'On Break'});assert.equal((await snapshot('gate')).students.length,0);await denied(action('gate','student.checkin',{id:ids.student}),/gate volunteers/);await action('gate','volunteer.attendance',{id:ids.vGate,status:'Present / On Duty'});});
const guestId='10000000-0000-4000-8000-000000000001';
const guestData={id:guestId,name:'Sample Judge',designation:'Visiting judge',organization:'Sample Institute',category:'Judge',contact_number:'9000000000',email:'judge@example.test',escort_volunteer_id:ids.vGuest};
await test('only managers create invited guests',()=>denied(action('guest','guest.save',guestData),/requires an admin/));
await test('guest category validation excludes ordinary visitors',()=>denied(action('admin','guest.save',{...guestData,category:'Parent'}),/VIP or judge/));
await test('guest creation and assigned escort visibility persist',async()=>{await action('admin','guest.save',guestData);assert.equal((await snapshot('guest')).guests.length,1);assert.equal((await snapshot('otherguest')).guests.length,0);assert.match((await snapshot('admin')).guests[0].pass_code,/^CFG-/);});
await test('unassigned volunteer cannot change another escort’s guest',()=>denied(action('otherguest','guest.status',{id:guestId,status:'Arrived'}),/not assigned/));
await test('guest cannot skip invitation confirmation',()=>denied(action('guest','guest.status',{id:guestId,status:'Arrived'}),/transition/));
await test('confirmed guest arrives, redeems one meal, and departs',async()=>{await action('admin','guest.status',{id:guestId,status:'Confirmed'});await denied(action('guest','guest.meal',{id:guestId}),/marked arrived/);await action('guest','guest.status',{id:guestId,status:'Arrived'});await action('guest','guest.meal',{id:guestId});await denied(action('guest','guest.meal',{id:guestId}),/already been issued/);await denied(action('admin','guest.archive',{id:guestId}),/departed/);});
await test('active guests protect escort reassignment and suspension',async()=>{const v=(await snapshot('admin')).volunteers.find(v=>v.id===ids.vGuest);await denied(action('admin','volunteer.save',{...v,expected_updated_at:v.updated_at,station:'gate'}),/Reassign/);await denied(action('admin','staff.access',{id:ids.guest,role:'volunteer',active:false}),/Reassign/);});
await test('stale guest edit fails without overwriting updates',()=>denied(action('admin','guest.save',{...guestData,expected_updated_at:'2020-01-01T00:00:00Z'}),/changed/));
await test('departure is terminal and archive preserves historical record',async()=>{await action('guest','guest.status',{id:guestId,status:'Departed'});await denied(action('guest','guest.status',{id:guestId,status:'Arrived'}),/transition/);await action('admin','guest.archive',{id:guestId});assert.equal((await snapshot('admin')).guests.length,0);assert.equal((await db.query('select count(*) as n from guests where id=$1 and archived_at is not null',[guestId])).rows[0].n,1);});
await test('admin can manage judge access but cannot create elevated access',async()=>{await action('admin','staff.access',{id:ids.judge,role:'judge',active:false});await denied(action('judge','incident.report',{room:'Test',issue:'Example report'}),/permission/);await action('admin','staff.access',{id:ids.judge,role:'judge',active:true});await denied(action('admin','staff.access',{id:ids.judge,role:'admin',active:true}),/super admin/);await denied(action('admin','staff.access',{id:ids.super,role:'admin',active:true}),/super admin/);});
await test('super admin can manage admins but cannot change own access',async()=>{await action('super','staff.access',{id:ids.admin,role:'admin',active:false});await denied(snapshot('admin'),/permission/);await action('super','staff.access',{id:ids.admin,role:'admin',active:true});await denied(action('super','staff.access',{id:ids.super,role:'admin',active:true}),/own access/);});
await test('system settings are super-admin only through all paths',async()=>{await denied(action('admin','settings.portal',{open:true}),/super admin/);await denied(as('admin',"select admin_set_system_setting('student_portal_open','true')"),/permission/);await action('super','settings.portal',{open:true});assert.equal((await snapshot('super')).settings.student_portal_open,true);});
await test('incident persists across callers and requires admin resolution',async()=>{await action('event','incident.report',{room:'Test Hall',issue:'Microphone battery depleted',priority:'High'});const i=(await snapshot('admin')).incidents[0];assert.equal(i.priority,'High');assert.equal((await snapshot('food')).incidents.length,0);await denied(action('event','incident.resolve',{id:i.id,resolution:'Replaced battery'}),/requires an admin/);await action('admin','incident.resolve',{id:i.id,resolution:'Replaced battery'});assert.equal((await snapshot('event')).incidents[0].status,'Resolved');});
await test('event status and judge assignment reach persistent tables',async()=>{await action('admin','event.status',{id:ids.e1,status:'in_progress'});await action('admin','event.judge',{id:ids.e1,judge_id:ids.judge,assigned:true});const e=(await snapshot('super')).events.find(e=>e.id===ids.e1);assert.equal(e.status,'in_progress');assert.deepEqual(e.judges,[ids.judge]);});
await test('announcements persist only to the selected audience',async()=>{await action('admin','announcement.send',{target:'volunteers',title:'Test bulletin',message:'This is a local test notification.'});const rows=(await db.query("select u.role from notifications n join users u on u.id=n.user_id where title='Test bulletin'")).rows;assert.equal(rows.length,6);assert.ok(rows.every(r=>r.role==='volunteer'));});
await test('notification read status persists for its recipient only',async()=>{const n=(await as('gate',"select id from notifications where title='Test bulletin'")).rows[0];await denied(as('food','select crossfire_mark_notification_read($1)',[n.id]),/not found/);await as('gate','select crossfire_mark_notification_read($1)',[n.id]);assert.ok((await as('gate','select read_at from notifications where id=$1',[n.id])).rows[0].read_at);});
await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'new@example.test',$2),($3,'foreign@example.test','{}')",[ids.newStaff,JSON.stringify({crossfire_provisioned_by:ids.admin}),ids.foreignAuth]);
await test('provisioning cannot claim an unrelated shared-project account',()=>denied(as('admin','select crossfire_ops_provision($1::jsonb)',[JSON.stringify({id:ids.foreignAuth,name:'Test Staff',contact_number:'9000000000',role:'volunteer'})]),/Auth account not found/));
await test('marked new Auth account provisions without a plaintext password',async()=>{await as('admin','select crossfire_ops_provision($1::jsonb)',[JSON.stringify({id:ids.newStaff,name:'New Staff',contact_number:'9000000000',role:'volunteer'})]);const v=(await db.query('select user_id,password from volunteers where user_id=$1',[ids.newStaff])).rows[0];assert.equal(v.password,null);assert.equal(v.user_id,ids.newStaff);});
await test('operations produce an auditable history',async()=>{assert.ok((await snapshot('super')).audit.length>=15);assert.equal((await snapshot('guest')).audit.length,0);});
console.log(`\n${passed} operations database checks passed. No live data was accessed.`);
await db.close();
