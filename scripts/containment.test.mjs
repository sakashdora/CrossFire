import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid,raw_user_meta_data jsonb,email_confirmed_at timestamptz);
create table public.users(id uuid,role text);
create view public.students_view as select * from public.users;
create view public.admins_view as select * from public.users;
create view public.staff_view as select * from public.users;
grant all on public.students_view,public.admins_view,public.staff_view to anon,authenticated;
create function public.verify_volunteer_login(text,text) returns boolean language sql as $$select true$$;
grant execute on function public.verify_volunteer_login(text,text) to anon,authenticated;
create function public.crossfire_auto_confirm_user() returns trigger language plpgsql as $$begin new.email_confirmed_at=now(); return new; end$$;
create trigger tr_crossfire_auto_confirm before insert on auth.users for each row execute function public.crossfire_auto_confirm_user();`);
const migration=await readFile(new URL('../supabase/migrations/20261019_access_containment.sql',import.meta.url),'utf8');
await db.exec(migration);await db.exec(migration);
for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);
  for(const view of ['students_view','admins_view','staff_view']){
    await assert.rejects(db.exec('select * from '+view),/permission denied/);
    await assert.rejects(db.exec("insert into "+view+" values(gen_random_uuid(),'super_admin')"),/permission denied/);
  }
  await assert.rejects(db.exec("select verify_volunteer_login('test','test')"),/permission denied/);
  await db.exec('reset role');
}
await db.exec("insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),'{\"app\":\"crossfire\"}')");
assert.equal((await db.query('select email_confirmed_at from auth.users')).rows[0].email_confirmed_at,null);
console.log('PASS: 15 access-containment checks; migration reapplies safely. No live database used.');
await db.close();
