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
  rpc: async (name, params) => {
    if(name==='crossfire_provision_guard') {calls.guards++; return {error:scenario.guardError?{message:scenario.guardError}:null};}
    if(name==='crossfire_clear_staff_credential') {calls.order.push('clear'); calls.cleared.push(params); return {error:scenario.clearError?{message:'test failure'}:null};}
    if(name==='crossfire_save_staff_credential') {calls.order.push('save'); calls.saved.push(params); return {error:scenario.saveError?{message:'test failure'}:null};}
    calls.provisions.push(params); return {error:scenario.provisionError?{message:'test failure'}:null};
  },
};
const service = {
  auth: {admin:{createUser:async input=>{calls.created.push(input);return {data:{user:scenario.createError?null:{id:'new-user'}},error:scenario.createError?{}:null};},deleteUser:async id=>{calls.deleted.push(id);return {error:scenario.cleanupError?{}:null};},updateUserById:async(id,input)=>{calls.order.push('auth');calls.updated.push({id,input});return {error:scenario.updateError?{}:null};}}},
  from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:scenario.persisted?{id:'new-user',role:scenario.targetRole||'volunteer',active:true}:null,error:scenario.readError?{}:null})})})}),
};
globalThis.__opsEdgeTest = { createClient:(_url,key)=>key==='test-service'?service:caller, Deno:{env:{get:name=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',CROSSFIRE_ALLOWED_ORIGINS:'https://crossfire.example.test'})[name]},serve:fn=>{handler=fn;}} };
const executable = ts.transpileModule(source.replace(/^import .*createClient.*;\r?\n/, 'const {createClient,Deno}=globalThis.__opsEdgeTest;\n'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);
const valid={name:'Sample Staff',email:'staff@example.test',contact_number:'9000000000',role:'volunteer',password:'fixture-only-password'};
async function run(overrides={},input=valid,method='POST',authorization='Bearer test-session',headers={}) {
  scenario={authenticated:true,role:'admin',active:true,...overrides};calls={created:[],provisions:[],deleted:[],guards:0,order:[],cleared:[],saved:[],updated:[]};
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
await test('staff password length is bounded before Auth creation',async()=>{
  assert.equal((await run({}, {...valid,password:'x'.repeat(73)})).status,400);
  assert.equal(calls.created.length,0);
  assert.equal((await run({}, {...valid,password:'x'.repeat(72)})).status,200);
});
await test('admin provisions a volunteer without returning a password',async()=>{const r=await run();assert.equal(r.status,200);assert.equal(calls.created[0].app_metadata.crossfire_provisioned_by,'admin-user');assert.equal(calls.provisions[0].p_data.id,'new-user');assert.ok(!r.text.includes(valid.password));assert.equal(calls.deleted.length,0);});
await test('admins and super admins provision coordinators',async()=>{for(const role of ['admin','super_admin']){assert.equal((await run({role},{...valid,role:'coordinator'})).status,200);assert.equal(calls.provisions[0].p_data.role,'coordinator');}});
await test('super admin may provision an admin',async()=>{assert.equal((await run({role:'super_admin'}, {...valid,role:'admin'})).status,200);});
await test('duplicate Auth account does not invoke provisioning or cleanup',async()=>{assert.equal((await run({createError:true})).status,409);assert.equal(calls.provisions.length,0);assert.equal(calls.deleted.length,0);});
await test('failed profile setup compensates only the new Auth account',async()=>{assert.equal((await run({provisionError:true})).status,503);assert.deepEqual(calls.deleted,['new-user']);});
await test('committed profile survives an ambiguous RPC error',async()=>{assert.equal((await run({provisionError:true,persisted:true})).status,200);assert.equal(calls.deleted.length,0);});
await test('unverifiable commit does not delete the account',async()=>{assert.equal((await run({provisionError:true,readError:true})).status,503);assert.equal(calls.deleted.length,0);});
await test('foreign browser origin is denied without provider calls',async()=>{const r=await run({},valid,'POST','Bearer test-session',{Origin:'https://untrusted.example.test'});assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.equal(calls.created.length,0);});
await test('MFA and rate-limit guards run before creating Auth users',async()=>{assert.equal((await run({guardError:'Insufficient permissions'})).status,403);assert.equal(calls.created.length,0);assert.equal((await run({guardError:'Staff provisioning limit reached.'})).status,429);assert.equal(calls.created.length,0);});
await test('oversized JSON is rejected even without Content-Length',async()=>{assert.equal((await run({}, {...valid,name:'x'.repeat(9000)})).status,413);assert.equal(calls.created.length,0);});
await test('responses cannot be cached and reflect only an allowed origin',async()=>{const r=await run();assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://crossfire.example.test');assert.equal(calls.guards,1);});
await test('admin provisions a VIP guest login linked to its invitation',async()=>{const guest='10000000-0000-4000-8000-000000000001';assert.equal((await run({}, {...valid,role:'vip_guest',guest_id:guest})).status,200);assert.equal(calls.provisions[0].p_data.guest_id,guest);});
await test('a VIP guest login requires an invitation before Auth creation',async()=>{assert.equal((await run({}, {...valid,role:'vip_guest'})).status,400);assert.equal(calls.created.length,0);});
const target='20000000-0000-4000-8000-000000000002', fixed='Fixed-Crew-Pass-7';
const reissue={action:'set_password',user_id:target,password:fixed};
await test('a crew password is cleared first, then changed in Auth, then saved, and never echoed',async()=>{
  const r=await run({persisted:true},reissue);
  assert.equal(r.status,200);
  assert.deepEqual(calls.order,['clear','auth','save']);
  assert.deepEqual(calls.cleared,[{p_user:target}]);
  assert.deepEqual(calls.updated,[{id:target,input:{password:fixed}}]);
  assert.deepEqual(calls.saved,[{p_user:target,p_password:fixed}]);
  assert.ok(!r.text.includes(fixed));
  assert.equal(calls.created.length,0);
  assert.equal(calls.guards,1);
});
await test('a failed Auth change leaves the saved copy cleared, so no stale password is shown',async()=>{
  const r=await run({persisted:true,updateError:true},reissue);
  assert.equal(r.status,409);
  assert.deepEqual(calls.order,['clear','auth']);
  assert.equal(calls.saved.length,0);
  assert.ok(!r.text.includes(fixed));
});
await test('a failed clear stops before Auth is touched',async()=>{
  const r=await run({persisted:true,clearError:true},reissue);
  assert.equal(r.status,503);
  assert.deepEqual(calls.order,['clear']);
  assert.equal(calls.updated.length,0);
});
await test('a failed save after the Auth change is reported and leaves nothing stale saved',async()=>{
  const r=await run({persisted:true,saveError:true},reissue);
  assert.equal(r.status,503);
  assert.deepEqual(calls.order,['clear','auth','save']);
  assert.ok(!r.text.includes(fixed));
});
await test('only volunteer and coordinator logins accept a fixed password',async()=>{
  for (const targetRole of ['judge','vip_guest','admin','super_admin','student']) { const r=await run({persisted:true,targetRole},reissue); assert.equal(r.status,404); assert.equal(calls.order.length,0); }
  assert.equal((await run({persisted:false},reissue)).status,404);
  assert.equal((await run({persisted:true,targetRole:'coordinator'},reissue)).status,200);
});
await test('password re-issue validates its input and the caller before any change',async()=>{
  for (const bad of [{...reissue,user_id:'not-a-uuid'},{...reissue,password:'short'},{...reissue,password:'x'.repeat(73)},{...reissue,user_id:undefined}]) { assert.equal((await run({persisted:true},bad)).status,400); assert.equal(calls.order.length,0); }
  assert.equal((await run({persisted:true,role:'volunteer'},reissue)).status,403);
  assert.equal((await run({persisted:true,active:false},reissue)).status,403);
  assert.equal((await run({persisted:true,authenticated:false},reissue)).status,401);
  assert.equal((await run({persisted:true,guardError:'Staff provisioning limit reached.'},reissue)).status,429);
  assert.equal(calls.order.length,0);
});
await test('only volunteer and coordinator accounts are given a fixed password at creation',async()=>{
  await run({},valid);assert.equal(calls.provisions[0].p_data.password,valid.password);
  await run({},{...valid,role:'coordinator'});assert.equal(calls.provisions[0].p_data.password,valid.password);
  await run({},{...valid,role:'judge'});assert.equal('password' in calls.provisions[0].p_data,false);
  await run({role:'super_admin'},{...valid,role:'admin'});assert.equal('password' in calls.provisions[0].p_data,false);
});
delete globalThis.__opsEdgeTest;
console.log(`\n${passed} Edge handler checks passed. Supabase hosting itself was not exercised.`);
