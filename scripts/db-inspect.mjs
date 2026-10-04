// Inspect current database state (tables, policies, functions, row counts).
import { getClient } from './db.mjs';

const c = getClient();
try {
  await c.connect();
  const q = async (label, sql) => {
    const r = await c.query(sql);
    console.log(`\n== ${label} ==`);
    console.table(r.rows);
  };
  await q('public tables', `select table_name from information_schema.tables where table_schema='public' order by 1`);
  await q('policies', `select tablename, policyname, cmd from pg_policies where schemaname='public' order by 1,2`);
  await q('functions', `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by 1`);
  await q('triggers', `select event_object_schema||'.'||event_object_table as tbl, trigger_name from information_schema.triggers where trigger_schema in ('public') or event_object_schema='auth' order by 1`);
  await q('types', `select typname from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and typtype='e'`);
  const tables = (await c.query(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`)).rows;
  for (const t of tables) {
    const r = await c.query(`select count(*)::int as n from public."${t.table_name}"`);
    console.log(`${t.table_name}: ${r.rows[0].n} rows`);
  }
  const au = await c.query(`select count(*)::int n from auth.users`);
  console.log(`auth.users: ${au.rows[0].n} rows`);
} catch (e) {
  console.error('DB inspect failed:', e.code || '', e.message);
  process.exitCode = 1;
} finally {
  await c.end().catch(() => {});
}
