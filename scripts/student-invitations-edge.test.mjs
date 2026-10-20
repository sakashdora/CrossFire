import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the actual Edge handler with fake Auth/database clients. No network,
// real credentials, accounts, or messages are used by this test.
const filename = new URL('../supabase/functions/invite-student/index.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const checkSource = source.replace('npm:@supabase/supabase-js@2.117.2', '@supabase/supabase-js') + '\ndeclare const Deno: {env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};';
const compilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler };
const host = ts.createCompilerHost(compilerOptions); const originalGetSourceFile = host.getSourceFile.bind(host);
const sourcePath = filename.pathname.replace(/^\/(\w:)/, '$1');
host.getSourceFile = (file, language, onError, fresh) => file.replaceAll('\\','/').endsWith('/supabase/functions/invite-student/index.ts') ? ts.createSourceFile(file, checkSource, language, true) : originalGetSourceFile(file, language, onError, fresh);
const program = ts.createProgram([sourcePath], compilerOptions, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) { console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory:()=>process.cwd(), getCanonicalFileName:p=>p, getNewLine:()=> '\n' })); process.exit(1); }
console.log('PASS: Edge handler TypeScript contracts against installed Supabase client');
let handler, scenario, calls;
const uid='10000000-0000-4000-8000-000000000001';
const requestId='20000000-0000-4000-8000-000000000001';
const own=()=>({id:uid,email:'student@example.test',app_metadata:{crossfire_request_id:scenario.foreign?'foreign':requestId}});
const caller={
  auth:{getUser:async()=>({data:{user:scenario.authenticated?{id:'staff-id'}:null},error:null})},
  rpc:async(name,params)=>{
    calls.rpc.push(name);
    if(name==='crossfire_mail_configuration') return {error:scenario.denied?{}:null};
    if(name==='crossfire_prepare_invitation') return {error:scenario.prepareError?{code:'P0001',message:'Portal is closed'}:null,data:{job_id:'job-fixture',user_id:uid,request_id:requestId,profile:{email:'student@example.test',student_name:'Test Student'},sender:{sender_name:'CrossFire',sender_email:'events@college.example',reply_to:'help@college.example'}}};
    if(name==='crossfire_provision_student') return {error:scenario.provisionError?{code:'P0001',message:'Registration for event is closed.'}:null,data:{student_id:'CFS-100',pass_id:'CF26-EXAMPLE'}};
    if(name==='crossfire_invitation_send_guard') return {error:scenario.guardError?{}:null};
    throw new Error('Unexpected RPC '+name);
  }
};
const service={
  auth:{admin:{
    getUserById:async()=>({data:{user:scenario.existing||calls.created.length&&!scenario.createError?own():null},error:scenario.lookupError?{status:503}:scenario.existing||calls.created.length&&!scenario.createError?null:{status:404}}),
    createUser:async(input)=>{calls.created.push(input);return {data:{user:scenario.createError?null:own()},error:scenario.createError?{}:null};},
    generateLink:async()=>{calls.links++;return {data:{user:own(),properties:{hashed_token:'PRIVATE-TEST-TOKEN'}},error:scenario.linkError?{}:null};},
  }},
  rpc:async(name,params)=>{assert.equal(name,'crossfire_finish_invitation');calls.finish.push(params);return {error:scenario.finishError?{}:null};},
};
globalThis.__inviteTest={
  createClient:(_url,key)=>key==='service'?service:caller,
  fetch:async(url,options)=>{
    assert.equal(url,'https://api.resend.com/emails');calls.sent.push(options);
    if(scenario.timeout) throw new Error('timeout');
    return new Response(JSON.stringify(scenario.malformed?{}:{id:'provider-test'}),{status:scenario.providerStatus||200});
  },
  Deno:{env:{get:name=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',CROSSFIRE_ALLOWED_ORIGINS:'https://crossfire.example.test',CROSSFIRE_RESEND_API_KEY:scenario.noKey?undefined:'server-only-test-key'})[name]},serve:fn=>{handler=fn;}},
};
const executable=ts.transpileModule(source.replace(/^import .*createClient.*;\r?\n/,'const {createClient,Deno,fetch}=globalThis.__inviteTest;\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);
async function run(overrides={},input={request_id:requestId},options={}) {
  scenario={authenticated:true,...overrides};calls={created:[],rpc:[],links:0,sent:[],finish:[]};
  const response=await handler(new Request('https://example.test/functions/v1/invite-student',{method:options.method||'POST',headers:{Origin:options.origin||'https://crossfire.example.test',Authorization:options.authorization??'Bearer fixture','Content-Type':'application/json'},...((options.method||'POST')==='POST'?{body:JSON.stringify(input)}:{})}));
  return {status:response.status,text:await response.text(),headers:response.headers};
}
let passed=1;
async function test(name,fn){await fn();passed++;console.log('PASS: '+name);}
await test('CORS and method guards do not create users or send messages',async()=>{
  assert.equal((await run({},undefined,{origin:'https://foreign.example'})).status,403);
  assert.equal((await run({},undefined,{method:'GET'})).status,405);
  assert.equal((await run({},undefined,{method:'OPTIONS'})).status,200);assert.equal(calls.created.length,0);
});
await test('unauthenticated and non-MFA callers cannot inspect or send',async()=>{
  assert.equal((await run({},undefined,{authorization:''})).status,401);
  assert.equal((await run({authenticated:false})).status,401);
  assert.equal((await run({denied:true})).status,403);assert.equal(calls.sent.length,0);
});
await test('status reports missing server configuration without creating a request',async()=>{
  const result=await run({noKey:true},{action:'status'});assert.equal(result.status,200);assert.equal(JSON.parse(result.text).configured,false);assert.equal(calls.created.length,0);
  assert.equal((await run({noKey:true})).status,503);assert.equal(calls.rpc.includes('crossfire_prepare_invitation'),false);
});
await test('invalid and oversized bodies fail before preparation',async()=>{
  assert.equal((await run({},null)).status,400);assert.equal((await run({},{request_id:requestId,role:'admin'})).status,400);
  assert.equal((await run({},{request_id:'x'.repeat(3000)})).status,413);assert.equal(calls.created.length,0);
});
await test('portal/review guards run before Auth calls',async()=>{
  assert.equal((await run({prepareError:true})).status,409);assert.equal(calls.created.length,0);assert.equal(calls.sent.length,0);
});
await test('new account receives random private credentials and a scoped ownership marker',async()=>{
  const result=await run();assert.equal(result.status,200);assert.equal(calls.created[0].id,uid);assert.equal(calls.created[0].email_confirm,false);
  assert.equal(calls.created[0].app_metadata.crossfire_request_id,requestId);assert.ok(calls.created[0].password.length>=64);
  const body=JSON.parse(calls.sent[0].body);assert.match(body.text,/#activate\?token_hash=PRIVATE-TEST-TOKEN/);assert.match(body.text,/CFS-100/);
  assert.ok(!body.text.includes(calls.created[0].password));assert.ok(!result.text.includes('PRIVATE-TEST-TOKEN'));assert.ok(!result.text.includes('server-only-test-key'));
  assert.equal(calls.sent[0].headers['Idempotency-Key'],'crossfire-student-job-fixture');
  assert.equal(calls.finish.at(-1).p_status,'accepted');assert.equal(result.headers.get('Cache-Control'),'no-store');
});
await test('account recovery preserves existing owned identity',async()=>{assert.equal((await run({existing:true})).status,200);assert.equal(calls.created.length,0);assert.equal(calls.links,1);});
await test('unrelated existing identities are never modified or emailed',async()=>{assert.equal((await run({existing:true,foreign:true})).status,409);assert.equal(calls.created.length,0);assert.equal(calls.links,0);assert.equal(calls.sent.length,0);});
await test('duplicate email does not adopt a foreign identity',async()=>{assert.equal((await run({createError:true})).status,409);assert.equal(calls.sent.length,0);assert.equal(calls.finish.at(-1).p_status,'failed');});
await test('unknown Auth lookup does not create another account',async()=>{assert.equal((await run({lookupError:true})).status,503);assert.equal(calls.created.length,0);assert.equal(calls.sent.length,0);});
await test('provision, link and final permission failures stop delivery',async()=>{
  for(const scenario of [{provisionError:true},{linkError:true},{guardError:true}]) {assert.ok((await run(scenario)).status>=400);assert.equal(calls.sent.length,0);assert.equal(calls.finish.at(-1).p_status,'failed');}
});
await test('provider rejection is recorded without pretending success',async()=>{assert.equal((await run({providerStatus:422})).status,502);assert.equal(calls.finish.at(-1).p_status,'failed');});
await test('timeouts, server errors and malformed success remain uncertain without automatic resend',async()=>{
  for(const scenario of [{timeout:true},{providerStatus:500},{malformed:true}]){assert.ok((await run(scenario)).status>=500);assert.equal(calls.finish.at(-1).p_status,'uncertain');assert.equal(calls.sent.length,1);}
});
await test('accepted email with unconfirmed database receipt never claims saved success',async()=>{const result=await run({finishError:true});assert.equal(result.status,503);assert.match(result.text,/provider accepted/);assert.equal(calls.sent.length,1);});
delete globalThis.__inviteTest;
console.log(`\n${passed} student invitation Edge checks passed. Providers mocked; no real email sent.`);
