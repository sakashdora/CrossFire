import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Runs the real Edge handler against a fake database client. No network, accounts or messages.
const filename = new URL('../supabase/functions/participant-pass/index.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const checkSource = source.replace('npm:@supabase/supabase-js@2.49.1', '@supabase/supabase-js') + '\ndeclare const Deno: {env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};';
const compilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler };
const host = ts.createCompilerHost(compilerOptions); const originalGetSourceFile = host.getSourceFile.bind(host);
const sourcePath = filename.pathname.replace(/^\/(\w:)/, '$1');
host.getSourceFile = (file, language, onError, fresh) => file.replaceAll(String.fromCharCode(92),'/').endsWith('/supabase/functions/participant-pass/index.ts') ? ts.createSourceFile(file, checkSource, language, true) : originalGetSourceFile(file, language, onError, fresh);
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], compilerOptions, host));
if (diagnostics.length) { console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory:()=>process.cwd(), getCanonicalFileName:p=>p, getNewLine:()=> '\n' })); process.exit(1); }
console.log('PASS: Edge handler TypeScript contracts against installed Supabase client');

let handler, scenario, calls;
const service = { rpc: async (name, params) => { calls.push({ name, params }); return scenario.rpc ? scenario.rpc(params) : { data: { found: true, pass: { pass_id: 'CF26-TEST', name: 'Test Student' } }, error: null }; } };
globalThis.__passEdgeTest = { createClient: () => service, Deno: { env: { get: name => ({ SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-service', CROSSFIRE_ALLOWED_ORIGINS: 'https://crossfire.example.test' })[name] }, serve: fn => { handler = fn; } } };
const executable = ts.transpileModule(source.replace(/^import .*createClient.*;\r?\n/, 'const {createClient,Deno}=globalThis.__passEdgeTest;\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);

const valid = { email: 'student@example.test', phone: '9000000101' };
async function run(overrides = {}, input = valid, { method = 'POST', headers = {}, raw } = {}) {
  scenario = overrides; calls = [];
  const response = await handler(new Request('https://example.test/functions/v1/participant-pass', { method, headers: { 'Content-Type': 'application/json', Origin: 'https://crossfire.example.test', ...headers }, ...(method === 'POST' ? { body: raw ?? JSON.stringify(input) } : {}) }));
  return { status: response.status, text: await response.text(), headers: response.headers };
}
let passed = 1;
async function test(name, fn) { await fn(); passed++; console.log(`PASS: ${name}`); }

await test('a matching mail ID and mobile number returns the pass, uncached, to the allowed site only', async () => {
  const r = await run();
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.text).pass.pass_id, 'CF26-TEST');
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://crossfire.example.test');
  assert.deepEqual(calls[0].params.p_email, 'student@example.test');
  assert.equal(calls[0].params.p_phone, '9000000101');
});
await test('input is normalised: case, spaces and a country code', async () => {
  await run({}, { email: '  Student@Example.TEST ', phone: '+91 90000-00101' });
  assert.equal(calls[0].params.p_email, 'student@example.test');
  assert.equal(calls[0].params.p_phone, '9000000101');
});
await test('a miss gets one generic answer that does not reveal whether the email exists', async () => {
  const miss = await run({ rpc: () => ({ data: { found: false }, error: null }) });
  assert.equal(miss.status, 404);
  assert.ok(!/exist|registered with this|not found/i.test(JSON.parse(miss.text).error.replace(/registered with/i, '')));
  const other = await run({ rpc: () => ({ data: { found: false }, error: null }) }, { email: 'someone-else@example.test', phone: '9000000555' });
  assert.equal(other.text, miss.text);
});
await test('too many attempts is reported as 429 without details', async () => {
  const r = await run({ rpc: () => ({ data: null, error: { message: 'Too many attempts. Please wait a few minutes and try again.' } }) });
  assert.equal(r.status, 429);
});
await test('database failures never leak internals', async () => {
  const r = await run({ rpc: () => ({ data: null, error: { message: 'relation "users" secret internal detail' } }) });
  assert.equal(r.status, 503);
  assert.ok(!r.text.includes('internal detail'));
  assert.equal((await run({ rpc: () => { throw new Error('boom'); } })).status, 503);
});
await test('bad input is rejected before the database is touched', async () => {
  for (const bad of [{ ...valid, email: 'nope' }, { ...valid, phone: '123' }, { ...valid, phone: 'abcdefghij' }, { email: valid.email }, { phone: valid.phone }, { email: 5, phone: 5 }, { ...valid, phone: '9'.repeat(40) }, []]) {
    assert.equal((await run({}, bad)).status, 400);
    assert.equal(calls.length, 0);
  }
  assert.equal((await run({}, valid, { raw: '{not json' })).status, 400);
  assert.equal((await run({}, valid, { raw: JSON.stringify({ ...valid, pad: 'x'.repeat(2000) }) })).status, 400);
  assert.equal(calls.length, 0);
});
await test('foreign origins, wrong methods and wrong content types are refused', async () => {
  const foreign = await run({}, valid, { headers: { Origin: 'https://evil.example.test' } });
  assert.equal(foreign.status, 403); assert.equal(foreign.headers.get('Access-Control-Allow-Origin'), null); assert.equal(calls.length, 0);
  assert.equal((await run({}, valid, { method: 'GET' })).status, 405);
  assert.equal((await run({}, valid, { method: 'OPTIONS' })).status, 204);
  assert.equal((await run({}, valid, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal(calls.length, 0);
});
await test('only a hash of the network address is passed on, never the address itself', async () => {
  await run({}, valid, { headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' } });
  const client = calls[0].params.p_client;
  assert.match(client, /^[0-9a-f]{32}$/);
  assert.ok(!JSON.stringify(calls).includes('203.0.113.7'));
  await run({}, valid, { headers: { 'x-forwarded-for': '203.0.113.8' } });
  assert.notEqual(calls[0].params.p_client, client);
});
delete globalThis.__passEdgeTest;
console.log(`\n${passed} participant-pass Edge handler checks passed. Supabase hosting itself was not exercised.`);
