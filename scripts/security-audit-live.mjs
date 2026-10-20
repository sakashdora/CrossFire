// Read-only inventory of CrossFire objects. Never prints row data, credentials, or function bodies.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { getClient } from './db.mjs';

const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const operations = await readFile(new URL('../supabase/migrations/20261016_operations.sql', import.meta.url), 'utf8');
const functionNames = [...new Set([...`${schema}\n${operations}`.matchAll(/create or replace function public\.(\w+)/gi)].map(match => match[1]))];
const tables = ['users','events','registrations','scores','judge_assignments','notifications','incidents','audit_logs','system_settings','volunteers','guests'];
const client = getClient();
try {
  await client.connect();
  await client.query('begin read only');
  const objects = (await client.query(`select c.relname as name, c.relkind as kind, c.relrowsecurity as rls,
    has_table_privilege('anon',c.oid,'SELECT') as anon_read,
    has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') as direct_writes,
    has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') as anon_writes
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=any($1) order by c.relname`, [[...tables,'students_view','staff_view','admins_view']])).rows;
  const functions = (await client.query(`select p.proname as name, pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as definer, has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
    has_function_privilege('authenticated',p.oid,'EXECUTE') as signed_in_execute,
    p.proconfig as settings from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=any($1) order by p.proname`, [functionNames])).rows;
  const policies = (await client.query('select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname=$1 and tablename=any($2)', ['public',tables])).rows;
  const roleCounts = (await client.query('select role,count(*)::int as count from public.users group by role')).rows;
  const passwordStorage = (await client.query('select count(*)::int as rows_with_legacy_password from public.volunteers where password is not null')).rows[0];
  const triggers = (await client.query(`select t.tgname as name,p.proname as function from pg_trigger t join pg_proc p on p.oid=t.tgfoid where t.tgrelid='auth.users'::regclass and not t.tgisinternal`)).rows;
  await client.query('commit');
  const report = {checkedAt:new Date().toISOString(),readOnly:true,objects,functions,policies,roleCounts,passwordStorage,triggers};
  await mkdir(new URL('../artifacts/security/',import.meta.url),{recursive:true});
  await writeFile(new URL('../artifacts/security/database-audit.json',import.meta.url),JSON.stringify(report,null,2));
  console.log(JSON.stringify({objects,functions,roleCounts,passwordStorage,triggers},null,2));
} finally { await client.end(); }
