import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sessionOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2,'0')).join('');

async function readInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error();
  const buffer = new Uint8Array(2048);
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (length + value.byteLength > buffer.length) { await reader.cancel(); throw new Error(); }
      buffer.set(value,length); length += value.byteLength;
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(new TextDecoder().decode(buffer.subarray(0,length)));
}

// A retry derives the same high-entropy password for this one job. The secret stays in the Edge runtime.
async function jobPassword(secret: string, job: string) {
  const key = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return 'Cf!' + hex(await crypto.subtle.sign('HMAC',key,encoder.encode('student-credential-v1:' + job)));
}

type Delivery = { sender: {sender_name:string;sender_email:string;reply_to:string}; email:string;student_id:string;job_id:string };
async function sendCredential(job: Delivery, password: string, site: string, mailpit: string | undefined, key: string | undefined) {
  const subject = 'Your CrossFire student portal credentials';
  const text = ['Your CrossFire registration is approved for portal access.', 'Student ID: ' + job.student_id,
    'Temporary password: ' + password, 'Sign in: ' + site + '/#student-login',
    'Choose a new password at first sign-in. Keep this message private. Your gate QR is already valid.'].join('\n');
  if (mailpit) {
    const response = await fetch(mailpit + '/api/v1/send',{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),
      headers:{'Content-Type':'application/json'},body:JSON.stringify({From:{Email:job.sender.sender_email},To:[{Email:job.email}],Subject:subject,Text:text})});
    return response.ok ? 'accepted' : 'failed';
  }
  const response = await fetch('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),
    headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'crossfire-credentials-'+job.job_id},
    body:JSON.stringify({from:job.sender.sender_name+' <'+job.sender.sender_email+'>',to:[job.email],reply_to:job.sender.reply_to || undefined,subject,text})});
  if (!response.ok) return [400,401,403,404,422,429].includes(response.status) ? 'failed' : 'uncertain';
  return typeof (await response.json()).id === 'string' ? 'accepted' : 'uncertain';
}

Deno.serve(async request => {
  const allowed = (Deno.env.get('CROSSFIRE_ALLOWED_ORIGINS') || '').split(',').map(value=>value.trim()).filter(Boolean);
  const origin = request.headers.get('Origin');
  const headers: Record<string,string> = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
    'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
  const reply = (status:number, body:object) => new Response(JSON.stringify(body),{status,headers});
  if (origin && !allowed.includes(origin)) return reply(403,{error:'Website not enabled.'});
  if (origin) headers['Access-Control-Allow-Origin']=origin;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(request.method!=='POST') return reply(405,{error:'Use POST.'});
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415,{error:'Use JSON.'});
  let input;
  try { input=await readInput(request); } catch { return reply(400,{error:'Invalid request.'}); }
  if (!input || typeof input!=='object' || Array.isArray(input)) return reply(400,{error:'Invalid request.'});
  const url=Deno.env.get('SUPABASE_URL'), anon=Deno.env.get('SUPABASE_ANON_KEY'), secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url || !anon || !secret) return reply(503,{error:'Portal service unavailable.'});
  const service=createClient(url,secret,sessionOptions);
  try {
    if(input.action==='login') {
      if(typeof input.student_id!=='string' || !/^CFS-\d{1,16}$/i.test(input.student_id) || typeof input.password!=='string' || !input.password.length || input.password.length>128) return reply(401,{error:'Invalid student ID or password.'});
      const {data:email,error}=await service.rpc('crossfire_student_login_email',{p_student_id:input.student_id});
      if(error) return reply(503,{error:'Portal service unavailable.'});
      const client=createClient(url,anon,sessionOptions);
      const signIn=await client.auth.signInWithPassword({email:email || 'unknown-'+crypto.randomUUID()+'@example.invalid',password:input.password});
      if(!email || !signIn.data.session) return reply(signIn.error?.status===429 ? 429 : 401,{error:'Invalid student ID or password.'});
      const profile=await client.rpc('crossfire_current_profile');
      if(profile.error || profile.data?.role!=='student') { await client.auth.signOut({scope:'local'}); return reply(401,{error:'Student access is unavailable.'}); }
      return reply(200,{access_token:signIn.data.session.access_token,refresh_token:signIn.data.session.refresh_token});
    }
    if(input.action!=='issue' || !uuid.test(input.request_id)) return reply(400,{error:'Invalid credential request.'});
    const authorization=request.headers.get('Authorization') || '';
    if(!authorization.startsWith('Bearer ')) return reply(401,{error:'Sign in again.'});
    const caller=createClient(url,anon,{...sessionOptions,global:{headers:{Authorization:authorization}}});
    if((await caller.auth.getUser()).error) return reply(401,{error:'Sign in again.'});
    const issuanceSecret=Deno.env.get('CROSSFIRE_ISSUANCE_SECRET'), key=Deno.env.get('CROSSFIRE_RESEND_API_KEY'), mailpit=Deno.env.get('CROSSFIRE_STAGE_MAILPIT_URL');
    const site=(Deno.env.get('CROSSFIRE_SITE_URL') || allowed[0] || '').replace(/\/$/,'');
    if (!issuanceSecret || issuanceSecret.length<32 || !allowed.includes(site) || (!mailpit && (!key || !site.startsWith('https://')))) return reply(503,{error:'The credential sender is not configured.'});
    if(mailpit && (!['kong','127.0.0.1','localhost'].includes(new URL(url).hostname) || !/^http:\/\/(?:127\.0\.0\.1|localhost|mailpit|inbucket):\d+$/.test(mailpit))) return reply(503,{error:'Invalid test inbox configuration.'});
    const prepared=await caller.rpc('crossfire_prepare_credentials',{p_request_id:input.request_id});
    if(prepared.error) return reply(403,{error:'Issuance unavailable. Check your staff permissions, student status and college sender.'});
    const job=prepared.data;
    if(job.status==='already_issued') return reply(200,{status:'already_issued'});
    const password=await jobPassword(issuanceSecret,job.job_id);
    const fingerprint=hex(await crypto.subtle.digest('SHA-256',encoder.encode(password)));
    const attempt=crypto.randomUUID();
    if(!job.issued) {
      await service.auth.admin.updateUserById(job.user_id,{password,email_confirm:true,ban_duration:'none',
        app_metadata:{crossfire_issue_job:job.job_id,crossfire_issue_attempt:attempt,crossfire_issue_check:fingerprint}});
    }
    // A concurrent worker or a lost response is resolved by authoritative readback.
    const account=await service.auth.admin.getUserById(job.user_id);
    const user=account.data.user;
    if(account.error || user?.app_metadata.crossfire_issue_job!==job.job_id || user.app_metadata.crossfire_issue_check!==fingerprint ||
      user.email?.toLowerCase()!==job.email.toLowerCase() || !user.email_confirmed_at || Date.parse(user.banned_until || '')>Date.now()) {
      return reply(503,{error:'Credential setup could not be verified. Retry after checking the issuance configuration.'});
    }
    const claim=await caller.rpc('crossfire_claim_credential_mail',{p_job:job.job_id,p_attempt:attempt});
    if(claim.error) return reply(409,{error:'Delivery unavailable. Refresh the student record.'});
    if(claim.data!=='claimed') return reply(200,{status:claim.data});
    let status='uncertain';
    try { status=await sendCredential(job,password,site,mailpit,key); } catch { /* Provider acceptance is unknown. Retry uses the same job. */ }
    const saved=await service.rpc('crossfire_finish_credential_mail',{p_job:job.job_id,p_attempt:attempt,p_status:status});
    if(saved.error) return reply(503,{error:'Delivery status could not be saved. Refresh before retrying.'});
    return reply(200,{status});
  } catch { return reply(503,{error:'Portal service unavailable. Please retry.'}); }
});
