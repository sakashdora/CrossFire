// Designates a freshly started, disposable Supabase database as a CrossFire stage.
// Run once by the stage owner, before the proof. Refuses anything that is not
// empty: existing Auth users or a CrossFire schema mean it is not a fresh stage.
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { readStageConfig } from './guard.mjs';

const { config, errors } = readStageConfig(process.env);
if (!errors.length && process.env.CROSSFIRE_STAGE_MARK_CONFIRM !== process.env.CROSSFIRE_STAGE_ID) errors.push('Set CROSSFIRE_STAGE_MARK_CONFIRM to the same value as CROSSFIRE_STAGE_ID to designate this database.');
if (errors.length) { console.error('REFUSED: stage marking'); for (const error of errors) console.error(' - ' + error); process.exit(2); }

const db = new pg.Client({ connectionString: config.dbUrl, application_name: 'crossfire-stage-mark', ssl: config.target === 'hosted' ? { ca: readFileSync(config.dbCaFile, 'utf8'), rejectUnauthorized: true } : false });
try { await db.connect(); } catch { console.error('REFUSED: could not connect to the stage database.'); process.exit(2); }
try {
  const existing = (await db.query("select to_regclass('crossfire_stage.identity') is not null as present")).rows[0].present;
  if (existing) {
    const id = (await db.query('select stage_id from crossfire_stage.identity')).rows[0]?.stage_id;
    console.log(id === config.stageId ? 'Already marked with this CROSSFIRE_STAGE_ID.' : 'REFUSED: this database carries a different stage marker.');
    process.exit(id === config.stageId ? 0 : 2);
  }
  const users = Number((await db.query('select count(*) from auth.users')).rows[0].count);
  const crossfire = (await db.query("select to_regclass('public.users') is not null as present")).rows[0].present;
  if (users > 0 || crossfire) { console.error('REFUSED: the database is not freshly started (Auth users or CrossFire tables exist).'); process.exit(2); }
  await db.query('begin');
  await db.query('create schema crossfire_stage');
  await db.query('revoke all on schema crossfire_stage from public');
  await db.query('create table crossfire_stage.identity(singleton boolean primary key default true check(singleton), stage_id text not null, marked_at timestamptz not null default now())');
  await db.query('create table crossfire_stage.applied(name text primary key, sha256 text not null, applied_at timestamptz not null default clock_timestamp())');
  await db.query('insert into crossfire_stage.identity(stage_id) values($1)', [config.stageId]);
  // Lets the proof confirm that the API serves this exact database. Service role only.
  await db.query('create function public.crossfire_stage_identity() returns text language sql stable security definer set search_path=pg_catalog,pg_temp as $$ select stage_id from crossfire_stage.identity $$');
  await db.query('revoke all on function public.crossfire_stage_identity() from public, anon, authenticated');
  await db.query('grant execute on function public.crossfire_stage_identity() to service_role');
  await db.query('commit');
  await db.query("notify pgrst, 'reload schema'");
  console.log('Stage marked. Run npm run stage:auth-proof with the same configuration.');
} catch {
  await db.query('rollback').catch(() => {});
  console.error('REFUSED: marking failed; nothing was committed.');
  process.exitCode = 2;
} finally { await db.end(); }
