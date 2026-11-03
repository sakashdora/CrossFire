import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readStageConfig, createGuardedFetch, redact, stageSchemaParts, compareLedger, CREDENTIAL_CUTOVER, STAGE_LOAD_ORDER, PRODUCTION_REF } from './stage/guard.mjs';
import { extractAuthTokens } from './stage/inbox.mjs';
import { totp, base32Decode } from './stage/totp.mjs';
import { Report, REQUIRED_CASES, categoryOf } from './stage/report.mjs';

// Offline checks for the staging Auth proof harness. No network, Docker or Supabase.
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const jwt = payload => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.c2lnbmF0dXJl';
const local = {
  CROSSFIRE_STAGE_RUN: '1', CROSSFIRE_STAGE_ID: 'crossfire-stage-a1b2c3d4',
  CROSSFIRE_STAGE_API_URL: 'http://127.0.0.1:55421', CROSSFIRE_STAGE_MAIL_URL: 'http://127.0.0.1:55424',
  CROSSFIRE_STAGE_DB_URL: 'postgresql://postgres:postgres@127.0.0.1:55422/postgres',
  CROSSFIRE_STAGE_ANON_KEY: jwt({ iss: 'supabase-demo', role: 'anon' }), CROSSFIRE_STAGE_SERVICE_ROLE_KEY: jwt({ iss: 'supabase-demo', role: 'service_role' }),
};
const refused = (overrides, pattern) => {
  const { errors, config } = readStageConfig({ ...local, ...overrides });
  assert.equal(config, null);
  assert.ok(errors.some(error => pattern.test(error)), `Expected refusal ${pattern}; got ${errors.join(' | ')}`);
};
let count = 0;
const test = async (name, fn) => { await fn(); count++; console.log('PASS: ' + name); };

await test('a valid local stage configuration is accepted', () => {
  const { errors, config } = readStageConfig(local);
  assert.deepEqual(errors, []);
  assert.equal(config.target, 'local'); assert.equal(config.apiUrl, 'http://127.0.0.1:55421');
  assert.deepEqual(readStageConfig({ ...local, CROSSFIRE_STAGE_ANON_KEY: 'sb_publishable_x', CROSSFIRE_STAGE_SERVICE_ROLE_KEY: 'sb_secret_y' }).errors, []);
});
await test('a run must be explicitly requested and fully configured', () => {
  const { errors } = readStageConfig({});
  assert.ok(errors.some(error => /CROSSFIRE_STAGE_RUN=1/.test(error)));
  for (const name of ['CROSSFIRE_STAGE_ID', 'CROSSFIRE_STAGE_API_URL', 'CROSSFIRE_STAGE_DB_URL', 'CROSSFIRE_STAGE_MAIL_URL', 'CROSSFIRE_STAGE_ANON_KEY', 'CROSSFIRE_STAGE_SERVICE_ROLE_KEY']) refused({ [name]: '' }, new RegExp('Missing ' + name));
  refused({ CROSSFIRE_STAGE_RUN: 'true' }, /CROSSFIRE_STAGE_RUN=1/);
});
await test('the production project is refused in any value', () => {
  refused({ CROSSFIRE_STAGE_API_URL: `https://${PRODUCTION_REF}.supabase.co` }, /production project/);
  refused({ CROSSFIRE_STAGE_DB_URL: `postgresql://postgres:x@db.${PRODUCTION_REF}.supabase.co:5432/postgres` }, /production project/);
  refused({ CROSSFIRE_STAGE_ANON_KEY: jwt({ role: 'anon', ref: PRODUCTION_REF }) }, /production project/);
  refused({ CROSSFIRE_STAGE_TARGET: 'hosted', CROSSFIRE_STAGE_HOSTED_REF: PRODUCTION_REF }, /production project/);
});
await test('values copied from production variables in the shell are refused', () => {
  const { errors } = readStageConfig({ ...local, VITE_SUPABASE_ANON_KEY: local.CROSSFIRE_STAGE_ANON_KEY });
  assert.ok(errors.some(error => /reuses the value of VITE_SUPABASE_ANON_KEY/.test(error)));
  const db = readStageConfig({ ...local, DIRECT_URL: local.CROSSFIRE_STAGE_DB_URL }).errors;
  assert.ok(db.some(error => /reuses the value of DIRECT_URL/.test(error)));
});
await test('local targets must be loopback and well formed', () => {
  refused({ CROSSFIRE_STAGE_API_URL: 'http://10.0.0.5:54321' }, /loopback/);
  refused({ CROSSFIRE_STAGE_API_URL: 'https://127.0.0.1:54321' }, /http on a loopback/);
  refused({ CROSSFIRE_STAGE_MAIL_URL: 'http://mail.example.com' }, /inbox/);
  refused({ CROSSFIRE_STAGE_DB_URL: 'postgresql://postgres:postgres@db.internal:5432/postgres' }, /database must be on a loopback/);
  refused({ CROSSFIRE_STAGE_API_URL: 'http://127.0.0.1:54321/rest/v1' }, /origin without a path/);
  refused({ CROSSFIRE_STAGE_API_URL: 'http://user:pw@127.0.0.1:54321' }, /must not embed credentials/);
  refused({ CROSSFIRE_STAGE_DB_URL: 'mysql://127.0.0.1:55422/x' }, /postgres:\/\//);
  refused({ CROSSFIRE_STAGE_DB_URL: 'postgresql://postgres:postgres@127.0.0.1:55421/postgres' }, /ports must differ/);
  refused({ CROSSFIRE_STAGE_ID: 'staging' }, /CROSSFIRE_STAGE_ID must look like/);
  refused({ CROSSFIRE_STAGE_HOSTED_REF: 'abcdefghijklmnopqrst' }, /only valid with CROSSFIRE_STAGE_TARGET=hosted/);
  refused({ CROSSFIRE_STAGE_TARGET: 'remote' }, /local or hosted/);
});
await test('keys must be the stage anon and service-role keys', () => {
  refused({ CROSSFIRE_STAGE_ANON_KEY: local.CROSSFIRE_STAGE_SERVICE_ROLE_KEY }, /anon key of the stage|must differ/);
  refused({ CROSSFIRE_STAGE_SERVICE_ROLE_KEY: local.CROSSFIRE_STAGE_ANON_KEY }, /service_role key/);
  refused({ CROSSFIRE_STAGE_ANON_KEY: 'not-a-key' }, /not a Supabase anon key/);
  refused({ CROSSFIRE_STAGE_ANON_KEY: 'sb_secret_x' }, /not a Supabase anon key/);
});
await test('a hosted stage needs one dedicated ref shared by API, database, keys and verified TLS', () => {
  const ref = 'abcdefghijklmnopqrst';
  const hosted = { ...local, CROSSFIRE_STAGE_TARGET: 'hosted', CROSSFIRE_STAGE_HOSTED_REF: ref, CROSSFIRE_STAGE_API_URL: `https://${ref}.supabase.co`,
    CROSSFIRE_STAGE_DB_URL: `postgresql://postgres:x@db.${ref}.supabase.co:5432/postgres`, CROSSFIRE_STAGE_MAIL_URL: 'https://inbox.example.org', CROSSFIRE_STAGE_MAIL_HOST: 'inbox.example.org',
    CROSSFIRE_STAGE_DB_CA_FILE: 'ca.pem', CROSSFIRE_STAGE_ANON_KEY: jwt({ role: 'anon', ref }), CROSSFIRE_STAGE_SERVICE_ROLE_KEY: jwt({ role: 'service_role', ref }) };
  assert.deepEqual(readStageConfig(hosted).errors, []);
  assert.ok(readStageConfig({ ...hosted, CROSSFIRE_STAGE_TARGET: undefined }).errors.length, 'hosted values without the hosted target are refused');
  const bad = (overrides, pattern) => assert.ok(readStageConfig({ ...hosted, ...overrides }).errors.some(error => pattern.test(error)), String(pattern));
  bad({ CROSSFIRE_STAGE_HOSTED_REF: '' }, /requires CROSSFIRE_STAGE_HOSTED_REF/);
  bad({ CROSSFIRE_STAGE_API_URL: 'https://zzzzzzzzzzzzzzzzzzzz.supabase.co' }, /hosted stage API/);
  bad({ CROSSFIRE_STAGE_DB_URL: 'postgresql://postgres:x@db.zzzzzzzzzzzzzzzzzzzz.supabase.co:5432/postgres' }, /does not belong/);
  bad({ CROSSFIRE_STAGE_ANON_KEY: jwt({ role: 'anon', ref: 'zzzzzzzzzzzzzzzzzzzz' }) }, /different project/);
  bad({ CROSSFIRE_STAGE_MAIL_HOST: 'other.example.org' }, /CROSSFIRE_STAGE_MAIL_HOST/);
  bad({ CROSSFIRE_STAGE_DB_CA_FILE: '' }, /verified TLS/);
});
await test('every request goes only to approved origins and never follows redirects', async () => {
  const calls = [];
  const base = async (input, init) => { calls.push(init.redirect); const url = String(input); return url.endsWith('/redirect') ? { status: 302, type: 'basic', ok: false } : url.endsWith('/opaque') ? { status: 0, type: 'opaqueredirect' } : { status: 200, type: 'basic', ok: true }; };
  const fetch = createGuardedFetch(['http://127.0.0.1:55421'], base);
  assert.equal((await fetch('http://127.0.0.1:55421/auth/v1/health')).status, 200);
  await assert.rejects(fetch('http://127.0.0.1:55421/redirect'), /redirect/);
  await assert.rejects(fetch('http://127.0.0.1:55421/opaque'), /redirect/);
  await assert.rejects(fetch(`https://${PRODUCTION_REF}.supabase.co/auth/v1/health`), /unapproved host/);
  await assert.rejects(fetch(new Request('http://127.0.0.2:55421/')), /unapproved host/);
  assert.ok(calls.every(mode => mode === 'manual')); assert.equal(calls.length, 3);
});
await test('printed outcomes are redacted', () => {
  const text = redact(`Invalid token ${jwt({ role: 'anon' })} for person@example.com at http://127.0.0.1/x?token=abc id 11111111-2222-4333-8444-555555555555 hash ${'a'.repeat(64)} code 123456 sb_secret_abc`);
  for (const leak of ['person@example.com', 'eyJ', 'token=abc', '11111111-2222', 'aaaaaaaa', '123456', 'sb_secret_abc']) assert.ok(!text.includes(leak), leak);
  assert.ok(redact('x'.repeat(500)).length <= 160);
});
await test('auth links and codes are parsed from test-inbox messages', () => {
  const tokens = extractAuthTokens('<a href="http://127.0.0.1:55421/auth/v1/verify?token=pkce_abc123&amp;type=magiclink&amp;redirect_to=http://127.0.0.1:3000">Log In</a><p>Alternatively, enter the code: 654321</p>');
  assert.deepEqual(tokens, { tokenHash: 'pkce_abc123', type: 'magiclink', code: '654321' });
  assert.deepEqual(extractAuthTokens('nothing here'), { tokenHash: '', type: '', code: '' });
});
await test('TOTP matches the RFC 6238 SHA-1 vectors', () => {
  const secret = Buffer.from('12345678901234567890');
  assert.equal(totp(secret, 59000, 8), '94287082');
  assert.equal(totp(secret, 1111111109000, 8), '07081804');
  assert.equal(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1234567890000, 8), '89005924');
  assert.deepEqual(base32Decode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'), secret);
});
await test('the stage load order matches production and the PGlite contract suite, not alphabetical replay', async () => {
  const listed = async (path, pattern) => [...((await read(path)).match(pattern)?.[1] || '').matchAll(/'([^']+\.sql)'/g)].map(match => match[1]);
  const prepared = await listed('scripts/prepare-security-release.mjs', /const migrations=\[([^\]]+)\]/);
  const pending = await listed('scripts/apply-pending-migrations.mjs', /const PENDING = \[([\s\S]+?)\];/);
  assert.deepEqual([...prepared, ...pending.filter(name => !prepared.includes(name))], STAGE_LOAD_ORDER);
  const contract = await read('scripts/student-portal-issuance.contract.test.mjs');
  const contractOrder = [...contract.match(/const ordered = \[([^\]]+)\]/)[1].matchAll(/'([^']+\.sql)'/g)].map(match => match[1]);
  assert.deepEqual([...contractOrder, '20261101090000_student_phone_length.sql'], STAGE_LOAD_ORDER);
  assert.notDeepEqual([...STAGE_LOAD_ORDER].sort(), STAGE_LOAD_ORDER, 'Alphabetical replay would apply files in a different order');
  const files = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(name => name.endsWith('.sql')).sort();
  assert.deepEqual(files, [...STAGE_LOAD_ORDER, CREDENTIAL_CUTOVER].sort(), 'Every repository migration must be placed in the reviewed stage order');
});
await test('the stage schema skips non-synthetic seeds but keeps triggers and settings', async () => {
  const parts = stageSchemaParts(await read('supabase/schema.sql'));
  const loaded = parts.base + parts.settings + parts.tail;
  assert.ok(!/^insert into public\.(?:events|volunteers|guests)\s*\(/im.test(loaded), 'A top-level seed insert was included.');
  assert.match(parts.settings, /student_portal_open/);
  assert.match(parts.base, /create trigger crossfire_on_auth_user_created/);
  assert.match(parts.tail, /create trigger tr_crossfire_auto_confirm/);
  assert.match(parts.tail, /students_view/);
});
await test('the deployed ledger comparison is reported exactly', async () => {
  const history = JSON.parse(await read('supabase/deployed-migration-history.json'));
  const files = Object.fromEntries(await Promise.all(STAGE_LOAD_ORDER.map(async name => [name, await readFile(new URL('../supabase/migrations/' + name, import.meta.url))])));
  const result = Object.fromEntries(compareLedger(history, files).map(item => [item.name, item.status]));
  assert.ok(!Object.values(result).includes('missing'));
  assert.equal(Object.values(result).filter(status => status === 'unrecorded').length, 5);
  // The ledger hashes raw bytes. Verify both outcomes independently of Git's checkout line endings.
  const [example] = STAGE_LOAD_ORDER;
  const known = { [example]: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' }; // SHA-256 of "abc"
  const status = bytes => compareLedger(known, { [example]: Buffer.from(bytes) })[0].status;
  assert.equal(status('abc'), 'match');
  assert.equal(status('abc\r\n'), 'differs');
  assert.equal(compareLedger(known, {})[0].status, 'missing');
});
await test('exit codes and decisions separate provider proof from CrossFire authorization', () => {
  const scenario = (overrides = {}, forbidden = false) => {
    const report = new Report(); const log = console.log; console.log = () => {};
    try {
      for (const id of REQUIRED_CASES) report.record(id, categoryOf(id), id, 'x', 'x', overrides[id] || 'pass');
      if (forbidden) report.forbidden();
    } finally { console.log = log; }
    return { code: report.exitCode(), ...report.decisions() };
  };
  assert.deepEqual(scenario(), { code: 0, providerLockProven: true, crossfireFullyProven: true });
  assert.deepEqual(scenario({ 'B-X1': 'fail', 'B-X2': 'fail' }), { code: 3, providerLockProven: true, crossfireFullyProven: false });
  assert.equal(scenario({ 'A-C2': 'fail' }).code, 1); assert.equal(scenario({ 'A-C2': 'fail' }).providerLockProven, false);
  assert.equal(scenario({ 'A-L0': 'blocked' }).code, 1);
  assert.equal(scenario({ 'B-X1': 'blocked' }).code, 1, 'a skipped gap case is still a skipped required case');
  assert.equal(scenario({ 'B-G2': 'fail' }).code, 1);
  assert.deepEqual(scenario({}, true), { code: 1, providerLockProven: false, crossfireFullyProven: false });
  assert.deepEqual(['A-C1', 'A-L0', 'B-D1', 'B-X2'].map(categoryOf), ['control', 'provider', 'crossfire', 'gap']);
});
await test('the entry points refuse missing or production configuration before any connection', () => {
  const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot || '' };
  const run = (script, extra) => spawnSync(process.execPath, [fileURLToPath(new URL('./stage/' + script, import.meta.url))], { env: { ...env, ...extra }, encoding: 'utf8', timeout: 60000 });
  const empty = run('run.mjs', {});
  assert.equal(empty.status, 2); assert.match(empty.stderr, /Provider proof not run/);
  const production = run('run.mjs', { ...local, CROSSFIRE_STAGE_API_URL: `https://${PRODUCTION_REF}.supabase.co` });
  assert.equal(production.status, 2); assert.match(production.stderr, /production project/);
  for (const value of [local.CROSSFIRE_STAGE_ANON_KEY, local.CROSSFIRE_STAGE_SERVICE_ROLE_KEY, 'postgres:postgres']) assert.ok(!(production.stdout + production.stderr).includes(value), 'configuration values must not be printed');
  const mark = run('mark-stage.mjs', local);
  assert.equal(mark.status, 2); assert.match(mark.stderr, /CROSSFIRE_STAGE_MARK_CONFIRM/);
});
await test('the harness never reads .env files or prints configuration values', async () => {
  for (const name of await readdir(new URL('./stage/', import.meta.url))) {
    const source = await read('scripts/stage/' + name);
    assert.ok(!/dotenv|['"]\.env|loadEnv/.test(source), name + ' must not load environment files');
    assert.ok(!/console\.\w+\([^)]*(process\.env|config\.(dbUrl|anonKey|serviceKey)|password|bootstrap|access_token|refresh_token)/.test(source), name + ' must not print secrets');
  }
});
console.log(`\n${count} staging harness checks passed (offline; provider proof not run).`);
