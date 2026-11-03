// Target guards for the staging Auth proof. Pure functions: no network, no files.
// The harness never reads .env and never falls back to production variables.
import { createHash } from 'node:crypto';

export const PRODUCTION_REF = 'foklyhoplcghivghuebp';

// Configuration names. Values are never printed.
export const REQUIRED = ['CROSSFIRE_STAGE_RUN', 'CROSSFIRE_STAGE_ID', 'CROSSFIRE_STAGE_API_URL', 'CROSSFIRE_STAGE_ANON_KEY', 'CROSSFIRE_STAGE_SERVICE_ROLE_KEY', 'CROSSFIRE_STAGE_DB_URL', 'CROSSFIRE_STAGE_MAIL_URL'];
export const OPTIONAL = ['CROSSFIRE_STAGE_TARGET', 'CROSSFIRE_STAGE_HOSTED_REF', 'CROSSFIRE_STAGE_MAIL_HOST', 'CROSSFIRE_STAGE_DB_CA_FILE', 'CROSSFIRE_STAGE_KEEP_FIXTURES'];
// Production values that may be present in a developer shell. Reusing any of them refuses the run.
const PRODUCTION_NAMES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'DIRECT_URL', 'DATABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL'];

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const STAGE_ID = /^crossfire-stage-[a-z0-9-]{8,48}$/;

export function decodeJwtPayload(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); } catch { return null; }
}

function keyErrors(name, value, role, hostedRef) {
  if (role === 'anon' && value.startsWith('sb_publishable_')) return [];
  if (role === 'service_role' && value.startsWith('sb_secret_')) return [];
  const payload = decodeJwtPayload(value);
  if (!payload) return [`${name} is not a Supabase ${role} key.`];
  const errors = [];
  if (payload.role !== role) errors.push(`${name} must be the ${role} key of the stage.`);
  if (payload.ref === PRODUCTION_REF) errors.push(`${name} belongs to the production project.`);
  if (hostedRef && payload.ref && payload.ref !== hostedRef) errors.push(`${name} belongs to a different project than CROSSFIRE_STAGE_HOSTED_REF.`);
  return errors;
}

function parseUrl(name, value, errors) {
  let url;
  try { url = new URL(value); } catch { errors.push(`${name} is not a valid URL.`); return null; }
  if (!/^postgres(ql)?:$/.test(url.protocol) && (url.username || url.password)) errors.push(`${name} must not embed credentials.`);
  return url;
}

// Returns { config, errors }. errors is empty only for an explicitly requested,
// fully configured, non-production target whose API, database and inbox agree.
export function readStageConfig(env) {
  const errors = [];
  if (env.CROSSFIRE_STAGE_RUN !== '1') errors.push('Set CROSSFIRE_STAGE_RUN=1 to request a staging run.');
  for (const name of REQUIRED) if (!env[name]) errors.push(`Missing ${name}.`);
  if (errors.length) return { config: null, errors };

  const values = Object.fromEntries([...REQUIRED, ...OPTIONAL].filter(name => env[name]).map(name => [name, env[name]]));
  for (const [name, value] of Object.entries(values)) {
    if (value.toLowerCase().includes(PRODUCTION_REF)) errors.push(`${name} refers to the production project.`);
    for (const production of PRODUCTION_NAMES) if (env[production] && env[production] === value) errors.push(`${name} reuses the value of ${production}. Use a clean environment.`);
  }
  if (!STAGE_ID.test(env.CROSSFIRE_STAGE_ID)) errors.push('CROSSFIRE_STAGE_ID must look like crossfire-stage-<8 to 48 lowercase letters, digits or dashes>.');

  const target = env.CROSSFIRE_STAGE_TARGET || 'local';
  if (!['local', 'hosted'].includes(target)) errors.push('CROSSFIRE_STAGE_TARGET must be local or hosted.');
  const hostedRef = target === 'hosted' ? env.CROSSFIRE_STAGE_HOSTED_REF || '' : '';
  if (target === 'hosted' && !/^[a-z0-9]{20}$/.test(hostedRef)) errors.push('A hosted stage requires CROSSFIRE_STAGE_HOSTED_REF (the dedicated test project ref).');
  if (target === 'local' && env.CROSSFIRE_STAGE_HOSTED_REF) errors.push('CROSSFIRE_STAGE_HOSTED_REF is only valid with CROSSFIRE_STAGE_TARGET=hosted.');

  const api = parseUrl('CROSSFIRE_STAGE_API_URL', env.CROSSFIRE_STAGE_API_URL, errors);
  const mail = parseUrl('CROSSFIRE_STAGE_MAIL_URL', env.CROSSFIRE_STAGE_MAIL_URL, errors);
  const db = parseUrl('CROSSFIRE_STAGE_DB_URL', env.CROSSFIRE_STAGE_DB_URL, errors);
  if (api && (api.pathname !== '/' || api.search || api.hash)) errors.push('CROSSFIRE_STAGE_API_URL must be an origin without a path, query or fragment.');
  if (mail && (mail.pathname !== '/' || mail.search || mail.hash)) errors.push('CROSSFIRE_STAGE_MAIL_URL must be an origin without a path, query or fragment.');
  if (db && !/^postgres(ql)?:$/.test(db.protocol)) errors.push('CROSSFIRE_STAGE_DB_URL must be a postgres:// URL.');

  if (target === 'local') {
    if (api && (api.protocol !== 'http:' || !LOOPBACK.has(api.hostname))) errors.push('A local stage API must be http on a loopback address.');
    if (mail && (mail.protocol !== 'http:' || !LOOPBACK.has(mail.hostname))) errors.push('A local stage inbox must be http on a loopback address.');
    if (db && !LOOPBACK.has(db.hostname)) errors.push('A local stage database must be on a loopback address.');
    if (api && db && api.port && db.port && api.port === db.port) errors.push('The API and database ports must differ.');
  } else if (hostedRef) {
    if (api && (api.protocol !== 'https:' || api.hostname !== `${hostedRef}.supabase.co`)) errors.push('A hosted stage API must be https://<CROSSFIRE_STAGE_HOSTED_REF>.supabase.co.');
    // Direct host db.<ref>.supabase.co, or a pooler whose user names the same ref.
    if (db && !(db.hostname === `db.${hostedRef}.supabase.co` || (db.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(db.username) === `postgres.${hostedRef}`))) errors.push('The hosted stage database does not belong to CROSSFIRE_STAGE_HOSTED_REF.');
    if (mail && (mail.protocol !== 'https:' || !env.CROSSFIRE_STAGE_MAIL_HOST || mail.hostname !== env.CROSSFIRE_STAGE_MAIL_HOST)) errors.push('A hosted stage inbox must be https and exactly match CROSSFIRE_STAGE_MAIL_HOST.');
    if (!env.CROSSFIRE_STAGE_DB_CA_FILE) errors.push('A hosted stage database requires CROSSFIRE_STAGE_DB_CA_FILE for verified TLS.');
  }
  errors.push(...keyErrors('CROSSFIRE_STAGE_ANON_KEY', env.CROSSFIRE_STAGE_ANON_KEY, 'anon', hostedRef));
  errors.push(...keyErrors('CROSSFIRE_STAGE_SERVICE_ROLE_KEY', env.CROSSFIRE_STAGE_SERVICE_ROLE_KEY, 'service_role', hostedRef));
  if (env.CROSSFIRE_STAGE_ANON_KEY === env.CROSSFIRE_STAGE_SERVICE_ROLE_KEY) errors.push('The anon and service-role keys must differ.');
  if (errors.length) return { config: null, errors };
  return {
    errors,
    config: {
      target, hostedRef, stageId: env.CROSSFIRE_STAGE_ID,
      apiUrl: api.origin, mailUrl: mail.origin, dbUrl: env.CROSSFIRE_STAGE_DB_URL, dbCaFile: env.CROSSFIRE_STAGE_DB_CA_FILE || '',
      anonKey: env.CROSSFIRE_STAGE_ANON_KEY, serviceKey: env.CROSSFIRE_STAGE_SERVICE_ROLE_KEY,
      keepFixtures: env.CROSSFIRE_STAGE_KEEP_FIXTURES === '1',
    },
  };
}

// Every HTTP call goes through this fetch: only the approved origins, no redirects.
export function createGuardedFetch(allowedOrigins, baseFetch = globalThis.fetch) {
  const allowed = new Set(allowedOrigins);
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
    if (!allowed.has(url.origin)) throw new Error('Refused request to an unapproved host.');
    const response = await baseFetch(input, { ...init, redirect: 'manual' });
    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) throw new Error('Refused a redirect from the stage target.');
    return response;
  };
}

// Strips anything that could be a secret or personal value from a provider message.
export function redact(value) {
  return String(value ?? '')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]')
    .replace(/sb_(secret|publishable)_[\w-]+/g, '[key]')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/[^\s@]+@[^\s@]+/g, '[email]')
    .replace(/\b[0-9a-f]{32,}\b/gi, '[hex]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[uuid]')
    .replace(/\b\d{6,}\b/g, '[digits]')
    .slice(0, 160);
}
export const errorSummary = error => error ? [error.status, error.code].filter(Boolean).join(' ') + (error.message ? ' ' + redact(error.message) : '') : 'no error';

// ---------------------------------------------------------------------------
// Effective load plan. Production applied files in this reviewed order:
// prepare-security-release.mjs (first nine), then apply-pending-migrations.mjs.
// Alphabetical replay is wrong: 20261029160000_* sorts before 20261029_*.
// ---------------------------------------------------------------------------
export const CREDENTIAL_CUTOVER = '20261103090000_student_credentials.sql';
export const STAGE_LOAD_ORDER = [
  '20261019_access_containment.sql', '20261016_operations.sql', '20261019_production_security.sql',
  '20261019_public_event_access.sql', '20261019_rpc_privileges.sql', '20261020_registration_intake.sql',
  '20261020_student_invitations.sql', '20261029_live_ops_and_access.sql', '20261029160000_direct_registration.sql',
  // Commits on its own: the new enum value must exist before the next file uses it.
  '20261030090000_vip_guest_role.sql', '20261030090100_accounts_registration_qr.sql',
  '20261030120000_least_privilege_review.sql', '20261101090000_student_phone_length.sql',
];

// schema.sql sections 13 and 14 seed real-looking people, emails and plaintext
// volunteer passwords. The stage keeps only the settings row from section 14 and
// keeps sections 15-16 (auto-confirm trigger, views), which the PGlite suites drop.
export function stageSchemaParts(schema) {
  const seed = schema.indexOf('-- 13. SEED:'), settings = schema.indexOf('-- 14. SEED:'), tail = schema.indexOf('-- 15. AUTO-CONFIRM');
  if (seed < 0 || settings < seed || tail < settings) throw new Error('schema.sql section markers changed. Review the stage load plan.');
  const row = schema.slice(settings, tail).match(/insert into public\.system_settings[\s\S]*?;/);
  if (!row) throw new Error('schema.sql settings seed changed. Review the stage load plan.');
  return { base: schema.slice(0, seed), settings: row[0], tail: schema.slice(tail), skipped: ['13. SEED events', '14. SEED volunteers and guests'] };
}

export const sha256 = text => createHash('sha256').update(text).digest('hex');

// Compares repository files with the deployed ledger. Files applied after the
// ledger have no recorded production checksum.
export function compareLedger(history, files) {
  return STAGE_LOAD_ORDER.map(name => ({
    name,
    status: !(name in files) ? 'missing' : !(name in history) ? 'unrecorded' : history[name] === sha256(files[name]) ? 'match' : 'differs',
  }));
}
