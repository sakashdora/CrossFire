// Connects to a validated stage and proves that the API, Auth, database and inbox
// belong to the same independently marked target before the first write.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { createGuardedFetch } from './guard.mjs';
import { createInbox } from './inbox.mjs';
import { StageError } from './report.mjs';

const clientOptions = fetch => ({ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch } });
export const secret = () => randomBytes(24).toString('base64url');

export async function openStage(config) {
  const fetch = createGuardedFetch([config.apiUrl, config.mailUrl]);
  const db = new pg.Client({
    connectionString: config.dbUrl, application_name: 'crossfire-stage-proof', statement_timeout: 120000,
    ssl: config.target === 'hosted' ? { ca: readFileSync(config.dbCaFile, 'utf8'), rejectUnauthorized: true } : false,
  });
  try { await db.connect(); } catch { throw new StageError('Could not connect to the stage database.'); }
  const runTag = randomBytes(4).toString('hex');
  const stage = {
    config, fetch, db, runTag, created: [],
    inbox: createInbox(config.mailUrl, fetch),
    admin: createClient(config.apiUrl, config.serviceKey, clientOptions(fetch)),
    service: createClient(config.apiUrl, config.serviceKey, clientOptions(fetch)),
    fresh: () => createClient(config.apiUrl, config.anonKey, clientOptions(fetch)),
    email: label => `${label}.${runTag}@example.com`,
    versions: {},
  };
  return stage;
}

const getJson = async (stage, path, key) => {
  const response = await stage.fetch(stage.config.apiUrl + path, { headers: { apikey: key, Authorization: 'Bearer ' + key, Accept: 'application/json' } });
  if (!response.ok) throw new StageError(`Stage endpoint ${path.split('?')[0]} returned HTTP ${response.status}.`);
  return response.json();
};

// Read-only checks. Returns the Auth settings needed by later cases.
export async function preflight(stage) {
  const { db, config } = stage;
  const marker = await db.query("select to_regclass('crossfire_stage.identity') is not null as present").then(r => r.rows[0].present);
  if (!marker) throw new StageError('The stage marker is missing. Run npm run stage:mark against this disposable database first.');
  const id = (await db.query('select stage_id from crossfire_stage.identity')).rows[0]?.stage_id;
  if (id !== config.stageId) throw new StageError('The database stage marker does not match CROSSFIRE_STAGE_ID.');
  const restId = await stage.service.rpc('crossfire_stage_identity');
  if (restId.error || restId.data !== config.stageId) throw new StageError('The API does not serve the marked stage database (endpoint and database mismatch).');

  const health = await getJson(stage, '/auth/v1/health', config.anonKey);
  const settings = await getJson(stage, '/auth/v1/settings', config.anonKey);
  if (!settings.external?.email) throw new StageError('Email sign-in is disabled on the stage Auth service.');
  if (settings.disable_signup) throw new StageError('Signup is disabled on the stage; production has signup enabled. Enable it to test the bypass paths.');
  if (settings.mailer_autoconfirm) throw new StageError('The stage auto-confirms email. Set [auth.email] enable_confirmations = true to mirror production.');
  await stage.inbox.ready();

  // Auth and database must list the same identities (read-only binding).
  const total = Number((await db.query('select count(*) from auth.users')).rows[0].count);
  if (total > 1000) throw new StageError('The stage database has more than 1000 Auth users; it does not look disposable.');
  const listed = await stage.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw new StageError('The Auth admin API could not list users with the stage service key.');
  const dbIds = new Set((await db.query('select id::text from auth.users')).rows.map(row => row.id));
  if (listed.data.users.length !== dbIds.size || listed.data.users.some(user => !dbIds.has(user.id))) throw new StageError('The Auth service and the stage database disagree (endpoint and database mismatch).');

  stage.versions = {
    postgres: (await db.query('show server_version')).rows[0].server_version,
    auth: health.version || 'unknown',
    postgrest: (await getJson(stage, '/rest/v1/', config.serviceKey).catch(() => ({})))?.info?.version || 'unknown',
    supabaseCli: (() => { try { return execSync('supabase --version', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }).toString().trim(); } catch { return 'not on PATH (record it from the runner)'; } })(),
    node: process.version,
    supabaseJs: JSON.parse(readFileSync(new URL('../../node_modules/@supabase/supabase-js/package.json', import.meta.url), 'utf8')).version,
    target: config.target,
  };
  return settings;
}

// Creates a synthetic Auth user. The first write also proves the Auth/DB binding.
export async function createAuthUser(stage, attributes) {
  const { data, error } = await stage.admin.auth.admin.createUser(attributes);
  const id = data?.user?.id || attributes.id;
  if (id) stage.created.push(id);
  if (!error && data?.user && !stage.boundByWrite) {
    const seen = (await stage.db.query('select 1 from auth.users where id=$1', [data.user.id])).rowCount;
    if (!seen) throw new StageError('An Auth write did not reach the stage database (endpoint and database mismatch).');
    stage.boundByWrite = true;
  }
  return { data, error };
}

// Auth state used to prove that nothing about an identity changed. Kept in memory only.
export async function snapshot(stage, id) {
  const row = (await stage.db.query(`select email, email_confirmed_at is not null as confirmed, coalesce(banned_until > now(),false) as banned,
    raw_app_meta_data as app, raw_user_meta_data as meta, encode(sha256(convert_to(coalesce(encrypted_password,''),'UTF8')),'hex') as digest
    from auth.users where id=$1`, [id])).rows[0];
  return row || null;
}
export const sameIdentity = (a, b) => Boolean(a && b) && a.email === b.email && a.digest === b.digest && a.banned === b.banned && a.confirmed === b.confirmed
  && a.app?.crossfire_stage_fixture === b.app?.crossfire_stage_fixture && a.app?.crossfire_request_id === b.app?.crossfire_request_id
  && JSON.stringify(a.meta || {}) === JSON.stringify(b.meta || {});

// Ends a session that must not exist and records the violation.
export async function forbid(stage, report, session) {
  if (!session) return false;
  report.forbidden();
  try { await stage.admin.auth.admin.signOut(session.access_token, 'global'); } catch { /* still recorded */ }
  return true;
}

export async function cleanup(stage) {
  if (stage.config.keepFixtures) return 'kept';
  let removed = 0;
  for (const id of new Set(stage.created)) {
    const { error } = await stage.admin.auth.admin.deleteUser(id);
    if (!error) removed++;
  }
  return `removed ${removed} synthetic Auth users`;
}

export const newRequestId = () => randomUUID();
