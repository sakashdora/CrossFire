import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const migrations=['20261019_access_containment.sql','20261016_operations.sql','20261019_production_security.sql','20261019_public_event_access.sql','20261019_rpc_privileges.sql','20261020_registration_intake.sql','20261020_student_invitations.sql','20261029_live_ops_and_access.sql','20261029160000_direct_registration.sql'];
const onlyIndex=process.argv.indexOf('--only');
const only=onlyIndex>=0?process.argv[onlyIndex+1]:null;
if(onlyIndex>=0 && (!only || !migrations.includes(only))) throw new Error('Use --only with an exact reviewed migration filename.');
let sql="begin;\nset local lock_timeout='5s';\nset local statement_timeout='60s';\nselect pg_advisory_xact_lock(hashtext('crossfire_security_migrations'));\n";
sql+="create table if not exists public.crossfire_schema_migrations(name text primary key,sha256 text not null,applied_at timestamptz not null default now());\nalter table public.crossfire_schema_migrations enable row level security;\nrevoke all on public.crossfire_schema_migrations from public,anon,authenticated;\n";
if(only){
  const history=JSON.parse(await readFile(new URL('../supabase/deployed-migration-history.json',import.meta.url),'utf8'));
  for(const name of migrations.slice(0,migrations.indexOf(only))){
    if(!/^[a-f0-9]{64}$/.test(history[name]||'')) throw new Error('Missing reviewed deployed checksum for prerequisite '+name);
    sql+=`do $prerequisite$ begin if not exists(select 1 from public.crossfire_schema_migrations where name='${name}' and sha256='${history[name]}') then raise exception 'Prerequisite differs or is missing: ${name}'; end if; end $prerequisite$;\n`;
  }
}
for(const name of migrations){
  if(only && name!==only)continue;
  const source=(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8')).replaceAll('\r\n','\n');
  const hash=createHash('sha256').update(source).digest('hex');
  sql+=`do $release$ begin\n if exists(select 1 from public.crossfire_schema_migrations where name='${name}' and sha256<>'${hash}') then raise exception 'Previously applied migration changed: ${name}. Create a new migration.'; end if;\nend $release$;\n`;
  sql+=source+`\ninsert into public.crossfire_schema_migrations(name,sha256) values('${name}','${hash}') on conflict(name) do nothing;\n`;
  console.log(name+' SHA256 '+hash);
}
sql+="notify pgrst,'reload schema';\ncommit;\nselect name,sha256 from public.crossfire_schema_migrations order by applied_at,name;\n";
await mkdir(new URL('../artifacts/security/',import.meta.url),{recursive:true});
await writeFile(new URL('../artifacts/security/release.sql',import.meta.url),sql);
console.log('Prepared artifacts/security/release.sql. No connection or database change made. Apply only to the confirmed project after tests and a checkpoint.');
