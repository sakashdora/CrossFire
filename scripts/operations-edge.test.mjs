import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the actual Edge handler with fake Auth/database clients. No network,
// real credentials, accounts, or messages are used by this test.
const filename = new URL('../supabase/functions/provision-staff/index.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const checkSource = source.replace('npm:@supabase/supabase-js@2.49.1', '@supabase/supabase-js') + '\ndeclare const Deno: {env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};';
const compilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler };
const host = ts.createCompilerHost(compilerOptions); const originalGetSourceFile = host.getSourceFile.bind(host);
const sourcePath = filename.pathname.replace(/^\/(\w:)/, '$1');
host.getSourceFile = (file, language, onError, fresh) => file.replaceAll('\\','/').endsWith('/supabase/functions/provision-staff/index.ts') ? ts.createSourceFile(file, checkSource, language, true) : originalGetSourceFile(file, language, onError, fresh);
const program = ts.createProgram([sourcePath], compilerOptions, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) { console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory:()=>process.cwd(), getCanonicalFileName:p=>p, getNewLine:()=> '\n' })); process.exit(1); }
console.log('PASS: Edge handler TypeScript contracts against installed Supabase client');
let handler; let scenario; let calls;
const caller = {
  auth: { getUser: async () => ({data:{user:scenario.authenticated?{id:'admin-user'}:null},error:null}) },
  from: () => ({select:()=>({eq:()=>({single:async()=>({data:{role:scenario.role,active:scenario.active}})})})}),
  rpc: async (name, params) => { if(name==='crossfire_provision_guard') {calls.guards++; return {error:scenario.guardError?{message:scenario.guardError}:null};} calls.provisions.push(params); return {error:scenario.provisionError?{message:'test failure'}:null}; },
};
const service = {
  auth: {admin:{createUser:async input=>{calls.created.push(input);return {data:{user:scenario.createError?null:{id:'new-user'}},error:scenario.createError?{}:null};},deleteUser:async id=>{calls.deleted.push(id);return {error:scenario.cleanupError?{}:null};}}},
  from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:scenario.persisted?{id:'new-user',role:'volunteer',active:true}:null,error:scenario.readError?{}:null})})})}),
};
globalThis.__opsEdgeTest = { createClient:(_url,key)=>key==='test-service'?service:caller, Deno:{env:{get:name=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',CROSSFIRE_ALLOWED_ORIGINS:'https://crossfire.example.test'})[name]},serve:fn=>{handler=fn;}} };
const executable = ts.transpileModule(source.replace(/^import .*createClient.*;\r?\n/, 'const {createClient,Deno}=globalThis.__opsEdgeTest;\n'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);
const valid={name:'Sample Staff',email:'staff@example.test',contact_number:'9000000000',role:'volunteer',password:'fixture-only-password'};
async function run(overrides={},input=valid,method='POST',authorization='Bearer test-session',headers={}) {
  scenario={authenticated:true,role:'admin',active:true,...overrides};calls={created:[],provisions:[],deleted:[],guards:0};
  const response=await handler(new Request('https://example.test/functions/v1/provision-staff',{method,headers:{Authorization:authorization,'Content-Type':'application/json',Origin:'https://crossfire.example.test',...headers},...(method==='POST'?{body:JSON.stringify(input)}:{})}));
  const text=await response.text(); return {status:response.status,text,headers:response.headers};
}
let passed=1;
async function test(name,fn){await fn();passed++;console.log(`PASS: ${name}`);}
await test('OPTIONS allows preflight without creating an account',async()=>{assert.equal((await run({},valid,'OPTIONS')).status,200);assert.equal(calls.created.length,0);});
await test('missing or invalid sessions cannot provision staff',async()=>{assert.equal((await run({},valid,'POST','')).status,401);assert.equal((await run({authenticated:false})).status,401);assert.equal(calls.created.length,0);});
await test('inactive admins and volunteers cannot provision staff',async()=>{assert.equal((await run({active:false})).status,403);assert.equal((await run({role:'volunteer'})).status,403);assert.equal(calls.created.length,0);});
await test('admins cannot provision admin-level users',async()=>{assert.equal((await run({}, {...valid,role:'super_admin'})).status,403);assert.equal(calls.created.length,0);});
await test('invalid contact and weak password fail before Auth creation',async()=>{assert.equal((await run({}, {...valid,password:'short'})).status,400);assert.equal((await run({}, {...valid,contact_number:'123'})).status,400);assert.equal(calls.created.length,0);});
await test('admin provisions a volunteer without returning a password',async()=>{const r=await run();assert.equal(r.status,200);assert.equal(calls.created[0].app_metadata.crossfire_provisioned_by,'admin-user');assert.equal(calls.provisions[0].p_data.id,'new-user');assert.ok(!r.text.includes(valid.password));assert.equal(calls.deleted.length,0);});
await test('super admin may provision an admin',async()=>{assert.equal((await run({role:'super_admin'}, {...valid,role:'admin'})).status,200);});
await test('duplicate Auth account does not invoke provisioning or cleanup',async()=>{assert.equal((await run({createError:true})).status,409);assert.equal(calls.provisions.length,0);assert.equal(calls.deleted.length,0);});
await test('failed profile setup compensates only the new Auth account',async()=>{assert.equal((await run({provisionError:true})).status,503);assert.deepEqual(calls.deleted,['new-user']);});
await test('committed profile survives an ambiguous RPC error',async()=>{assert.equal((await run({provisionError:true,persisted:true})).status,200);assert.equal(calls.deleted.length,0);});
await test('unverifiable commit does not delete the account',async()=>{assert.equal((await run({provisionError:true,readError:true})).status,503);assert.equal(calls.deleted.length,0);});
await test('foreign browser origin is denied without provider calls',async()=>{const r=await run({},valid,'POST','Bearer test-session',{Origin:'https://untrusted.example.test'});assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.equal(calls.created.length,0);});
await test('MFA and rate-limit guards run before creating Auth users',async()=>{assert.equal((await run({guardError:'Insufficient permissions'})).status,403);assert.equal(calls.created.length,0);assert.equal((await run({guardError:'Staff provisioning limit reached.'})).status,429);assert.equal(calls.created.length,0);});
await test('oversized JSON is rejected even without Content-Length',async()=>{assert.equal((await run({}, {...valid,name:'x'.repeat(9000)})).status,413);assert.equal(calls.created.length,0);});
await test('responses cannot be cached and reflect only an allowed origin',async()=>{const r=await run();assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://crossfire.example.test');assert.equal(calls.guards,1);});
delete globalThis.__opsEdgeTest;
console.log(`\n${passed} Edge handler checks passed. Supabase hosting itself was not exercised.`);
