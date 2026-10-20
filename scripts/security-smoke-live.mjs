// Read-only HTTP checks against the configured project. No accounts or messages.
import {loadEnv} from 'vite';
import assert from 'node:assert/strict';
const env=loadEnv('production',process.cwd(),'VITE_');
const origin=env.VITE_SUPABASE_URL;
if(new URL(origin).host!=='foklyhoplcghivghuebp.supabase.co')throw new Error('Unexpected target.');
const headers={apikey:env.VITE_SUPABASE_ANON_KEY,Authorization:'Bearer '+env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json'};
let passed=0;
async function check(name,path,options,accept){
  const response=await fetch(origin+path,{headers,signal:AbortSignal.timeout(15000),...options});
  const body=await response.json().catch(()=>null);
  assert.ok(accept(response,body),`${name}: HTTP ${response.status}; code ${body?.code||'n/a'}`);
  passed++;console.log(`PASS: ${name} (HTTP ${response.status})`);
}
await check('public events remain available','/rest/v1/events?select=id&limit=6',{},(r,b)=>r.ok&&Array.isArray(b)&&b.length===6);
for(const view of ['students_view','admins_view','staff_view'])await check('legacy '+view+' denies anonymous reads','/rest/v1/'+view+'?select=*&limit=1',{},r=>[401,403].includes(r.status));
for(const name of ['crossfire_ops_snapshot','crossfire_current_profile','crossfire_judge_snapshot'])await check(name+' denies anonymous callers','/rest/v1/rpc/'+name,{method:'POST',body:'{}'},r=>[401,403].includes(r.status));
await check('published leaderboard responds without private fields','/rest/v1/rpc/get_leaderboard',{method:'POST',body:'{}'},(r,b)=>r.ok&&Array.isArray(b)&&b.every(row=>!('email' in row)&&!('user_id' in row)&&!('contact_number' in row)));
await check('student request table denies anonymous reads','/rest/v1/crossfire_registration_requests?select=*&limit=1',{},r=>[401,403].includes(r.status));
await check('staff review list denies anonymous callers','/rest/v1/rpc/crossfire_list_registration_requests',{method:'POST',body:'{}'},r=>[401,403].includes(r.status));
await check('review writes deny anonymous callers','/rest/v1/rpc/crossfire_review_registration_request',{method:'POST',body:JSON.stringify({p_id:null,p_status:'reviewed',p_notes:'',p_expected_updated_at:null})},r=>[401,403].includes(r.status));
await check('public intake rejects an invalid payload without saving a record','/rest/v1/rpc/crossfire_submit_registration_request',{method:'POST',body:JSON.stringify({p_request_id:null,p_profile:{}})},(r,b)=>r.status===400&&b?.code==='P0001'&&b?.message==='Invalid registration data.');
const endpoint=origin+'/functions/v1/provision-staff';
const allowed=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:'https://cross-fire-three.vercel.app','Access-Control-Request-Method':'POST'},signal:AbortSignal.timeout(15000)});
assert.ok(allowed.ok);assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),'https://cross-fire-three.vercel.app');passed++;console.log('PASS: deployed Edge endpoint accepts the configured Vercel preflight');
const denied=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:'https://untrusted.example.test','Access-Control-Request-Method':'POST'},signal:AbortSignal.timeout(15000)});
assert.equal(denied.status,403);assert.equal(denied.headers.get('Access-Control-Allow-Origin'),null);passed++;console.log('PASS: deployed Edge endpoint rejects foreign origins');
console.log(`${passed} live read-only checks passed. No successful sign-in, email delivery or production staff mutations were tested.`);
