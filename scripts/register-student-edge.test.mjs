import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the actual register-student handler with fake Auth/database clients.
// No network, real credentials, accounts or messages are used by this test.
const filename = new URL('../supabase/functions/register-student/index.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const checkSource = source.replace('npm:@supabase/supabase-js@2.49.1', '@supabase/supabase-js') + '\ndeclare const Deno: {env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};';
const compilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler };
const host = ts.createCompilerHost(compilerOptions); const originalGetSourceFile = host.getSourceFile.bind(host);
const sourcePath = filename.pathname.replace(/^\/(\w:)/, '$1');
host.getSourceFile = (file, language, onError, fresh) => file.replaceAll('\\','/').endsWith('/supabase/functions/register-student/index.ts') ? ts.createSourceFile(file, checkSource, language, true) : originalGetSourceFile(file, language, onError, fresh);
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], compilerOptions, host));
if (diagnostics.length) { console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory:()=>process.cwd(), getCanonicalFileName:p=>p, getNewLine:()=> '\n' })); process.exit(1); }
console.log('PASS: register-student TypeScript contracts against installed Supabase client');

const requestId = '11111111-2222-4333-8444-555555555555';
const userId = '99999999-8888-4777-8666-555555555555';
let handler; let scenario; let calls;
const marked = (id = userId, request = requestId, email = 'student@example.test') => ({ id, email, app_metadata: { crossfire_request_id: request } });
const service = {
  rpc: async (name, params) => {
    calls.rpc.push([name, params]);
    if (name === 'crossfire_begin_student_registration') return scenario.begin;
    if (name === 'crossfire_complete_student_registration') return scenario.complete;
    if (name === 'crossfire_abandon_student_registration') return { error: null };
    throw new Error('unexpected rpc ' + name);
  },
  auth: { admin: {
    getUserById: async id => ({ data: { user: scenario.users[id] || null }, error: scenario.users[id] ? null : { status: 404 } }),
    createUser: async input => { calls.created.push(input); if (scenario.createError) return { data: { user: null }, error: scenario.createError }; scenario.users[input.id] = { id: input.id, email: input.email, app_metadata: input.app_metadata }; return { data: { user: scenario.users[input.id] }, error: null }; },
    deleteUser: async id => { calls.deleted.push(id); delete scenario.users[id]; return { error: null }; },
  } },
};
globalThis.__registerEdgeTest = { createClient: () => service, Deno: { env: { get: name => ({ SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service', CROSSFIRE_ALLOWED_ORIGINS: 'https://crossfire.example.test' })[name] }, serve: fn => { handler = fn; } } };
const executable = ts.transpileModule(source.replace(/^import .*createClient.*;\r?\n/, 'const {createClient,Deno}=globalThis.__registerEdgeTest;\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);

const receipt = { student_id: 'CFS-12', pass_id: 'CF26-' + 'A'.repeat(32), reference_code: 'CFREQ-' + 'B'.repeat(16), name: 'Test Student', email: 'student@example.test', competitions: ['Event 1'] };
const valid = { request_id: requestId, password: 'fixture-only-pass', profile: { email: 'student@example.test', student_name: 'Test Student' } };
const reserved = (extra = {}) => ({ data: { request_id: requestId, user_id: userId, email: 'student@example.test', status: 'registering', stale_user_ids: [], ...extra }, error: null });
async function run(overrides = {}, input = valid, method = 'POST', headers = {}) {
  scenario = { begin: reserved(), complete: { data: receipt, error: null }, users: {}, ...overrides };
  calls = { rpc: [], created: [], deleted: [] };
  const response = await handler(new Request('https://example.test/functions/v1/register-student', { method, headers: { 'Content-Type': 'application/json', Origin: 'https://crossfire.example.test', ...headers }, ...(method === 'POST' ? { body: typeof input === 'string' ? input : JSON.stringify(input) } : {}) }));
  const text = await response.text();
  return { status: response.status, text, body: text && text !== 'ok' ? JSON.parse(text) : null, headers: response.headers };
}
const rpcNames = () => calls.rpc.map(([name]) => name);
let passed = 1;
async function test(name, fn) { await fn(); passed++; console.log(`PASS: ${name}`); }

await test('preflight and a foreign origin make no database or Auth calls', async () => {
  assert.equal((await run({}, valid, 'OPTIONS')).status, 200);
  const foreign = await run({}, valid, 'POST', { Origin: 'https://untrusted.example.test' });
  assert.equal(foreign.status, 403); assert.equal(foreign.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(calls.rpc.length + calls.created.length, 0);
});
await test('malformed requests and weak passwords fail before any reservation', async () => {
  for (const input of ['{not json', { ...valid, role: 'admin' }, { ...valid, request_id: 'x' }, { ...valid, password: 'short' }, { ...valid, password: 'x'.repeat(73) }, { ...valid, password: 'Student@Example.test' }]) {
    assert.equal((await run({}, input)).status, 400);
    assert.equal(calls.rpc.length + calls.created.length, 0);
  }
  assert.equal((await run({}, { ...valid, profile: { email: 'x'.repeat(9000) } })).status, 413);
});
await test('a new registration creates one marked, confirmed login and returns the receipt', async () => {
  const r = await run();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.receipt, receipt);
  assert.equal(calls.created.length, 1);
  assert.deepEqual({ id: calls.created[0].id, email: calls.created[0].email, confirm: calls.created[0].email_confirm, marker: calls.created[0].app_metadata.crossfire_request_id }, { id: userId, email: 'student@example.test', confirm: true, marker: requestId });
  assert.deepEqual(rpcNames(), ['crossfire_begin_student_registration', 'crossfire_complete_student_registration']);
  assert.ok(!r.text.includes(valid.password));
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
});
await test('closed registration and duplicate emails are rejected without creating a login', async () => {
  for (const message of ['Student registration is closed. Students who already registered can still sign in.', 'This email is already registered. Sign in with your password, or ask the organisers for a password reset link.']) {
    const r = await run({ begin: { data: null, error: { code: 'P0001', message } } });
    assert.equal(r.status, 409); assert.equal(r.body.error, message); assert.equal(calls.created.length, 0);
  }
  assert.equal((await run({ begin: { data: null, error: { code: 'P0001', message: 'Submission limit reached. Please try later.' } } })).status, 429);
});
await test('a retry after completion returns the same receipt without touching Auth', async () => {
  const r = await run({ begin: reserved({ status: 'registered' }), users: { [userId]: marked() } });
  assert.equal(r.status, 200); assert.equal(calls.created.length, 0); assert.equal(calls.deleted.length, 0);
});
await test('a retry after an ambiguous create resumes with the existing marked login', async () => {
  const r = await run({ users: { [userId]: marked() } });
  assert.equal(r.status, 200); assert.equal(calls.created.length, 0);
});
await test('an Auth email conflict releases the reservation and reports a duplicate', async () => {
  const r = await run({ createError: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } });
  assert.equal(r.status, 409); assert.match(r.body.error, /already registered/);
  assert.ok(rpcNames().includes('crossfire_abandon_student_registration')); assert.ok(!rpcNames().includes('crossfire_complete_student_registration'));
});
await test('an unmarked identity at the reserved ID is never adopted or deleted', async () => {
  const r = await run({ users: { [userId]: { id: userId, email: 'student@example.test', app_metadata: {} } } });
  assert.equal(r.status, 409); assert.equal(calls.deleted.length, 0); assert.equal(calls.created.length, 0);
});
await test('a definite completion failure removes the new login and the reservation', async () => {
  const r = await run({ complete: { data: null, error: { code: 'P0001', message: 'Registration for Event 1 is closed.' } } });
  assert.equal(r.status, 409); assert.deepEqual(calls.deleted, [userId]);
  assert.ok(rpcNames().includes('crossfire_abandon_student_registration'));
});
await test('an ambiguous completion error keeps everything for a safe retry', async () => {
  const r = await run({ complete: { data: null, error: { message: 'fetch failed' } } });
  assert.equal(r.status, 503); assert.equal(calls.deleted.length, 0);
  assert.ok(!rpcNames().includes('crossfire_abandon_student_registration'));
});
await test('released stale reservations remove only their marked identity', async () => {
  const stale = '77777777-6666-4555-8444-333333333333';
  const other = '77777777-6666-4555-8444-222222222222';
  await run({ begin: reserved({ stale_user_ids: [stale, other] }), users: { [stale]: marked(stale, 'old-request'), [other]: { id: other, email: 'student@example.test', app_metadata: {} } } });
  assert.deepEqual(calls.deleted, [stale]);
});
delete globalThis.__registerEdgeTest;
console.log(`\n${passed} register-student Edge handler checks passed. Supabase hosting itself was not exercised.`);
