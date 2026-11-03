// Runs only on a marked, local stack after stage:auth-proof. Each address is synthetic.
// Install Playwright with Chromium on the runner. Supply its module path if installed separately.
import { randomUUID, randomInt } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readStageConfig } from './guard.mjs';
import { openStage, preflight, createAuthUser, cleanup, secret } from './context.mjs';
import { totp } from './totp.mjs';

const {config,errors}=readStageConfig(process.env);
if(errors.length || config?.target!=='local') { console.error('A marked disposable local stack is required.'); process.exit(2); }
const site='http://127.0.0.1:55480';
const stage=await openStage(config);
const cases=[];
let diagnosticPage;
let browser, step='verify stage', inboxStopped=false, closed=false;
class JourneyCheck extends Error {}
const check=(condition,label)=>{ if(!condition) throw new JourneyCheck(label); };
const passed=label=>{cases.push(label);console.log('PASS '+label);};
const creds=(action, request_id)=>({body:{action,request_id}});
const emailFor=n=>stage.email('journey-'+n);
const nameFor=n=>'Journey '+stage.runTag+' '+n;
const mailContainer='supabase_inbucket_'+config.stageId;
const docker=(operation)=>execFileSync('docker',[operation,mailContainer],{stdio:'ignore',timeout:25000});
const requestIds=[];
const agents={};
let eventId;
let mailBefore;
async function staff(role) {
  const email=stage.email('journey-'+role), password=secret();
  const made=await createAuthUser(stage,{email,password,email_confirm:true});
  check(made.data?.user?.id,'staff fixture');
  const id=made.data.user.id;
  await stage.db.query("insert into public.users(id,email,first_name,role,contact_number) values($1,$2,'Stage staff',$3,'9100000000')",[id,email,role]);
  if(role==='volunteer') await stage.db.query("insert into public.volunteers(user_id,volunteer_id,name,email,contact_number,attendance_status,ops_station) values($1,$2,'Stage gate',$3,'9100000000','Present / On Duty','gate')",[id,'VOL-J'+stage.runTag,email]);
  const client=stage.fresh();
  check(!(await client.auth.signInWithPassword({email,password})).error,'staff sign-in');
  if(role==='super_admin'){
    const factor=await client.auth.mfa.enroll({factorType:'totp'});
    check(!factor.error,'TOTP enrollment');
    check(!(await client.auth.mfa.challengeAndVerify({factorId:factor.data.id,code:totp(factor.data.totp.secret)})).error,'TOTP challenge');
  }
  check((await client.rpc('current_user_role')).data===role,'staff role');
  return client;
}
async function registerApi(n) {
  const id=randomUUID(), phone='9'+randomInt(100000000,999999999);
  const profile={student_name:nameFor(n),email:emailFor(n),contact_number:phone,whatsapp_number:phone,institute_name:'Stage College',city_town:'Stage City',course_stream:'12th Science',board:'CBSE',food_preference:'Veg',parent_consent:true,terms_accepted:true,selected_competitions:[eventName],website:''};
  const post=()=>stage.fresh().functions.invoke('register-student',{body:{request_id:id,profile}});
  const first=await post();
  check(first.data?.receipt?.pass_id,'public registration endpoint');
  const second=await post();
  check(JSON.stringify(first.data.receipt)===JSON.stringify(second.data?.receipt),'idempotent receipt');
  requestIds.push(id);return {id,receipt:first.data.receipt};
}
const eventName='Journey event '+stage.runTag;
async function context(width,client) {
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    return [site,config.apiUrl].includes(url.origin) || ['data:','blob:'].includes(url.protocol) ? route.continue() : route.abort();
  });
  if(client) {
    const session=(await client.auth.getSession()).data.session;
    await ctx.addInitScript(value=>{ if(!sessionStorage.getItem('crossfire.auth')) sessionStorage.setItem('crossfire.auth',JSON.stringify(value)); },session);
  }
  const p=await ctx.newPage(); p.setDefaultTimeout(30000);diagnosticPage=p;return p;
}
async function managerPage(client,width) {
  const p=await context(width,client);
  await p.goto(site+'/#admin');
  const search=p.getByRole('textbox',{name:'Search student records'});
  if(!await search.isVisible()) {
    await p.getByRole('button',{name:/^(Open student records|Student records)$/i}).first().click();
  }
  await search.fill(stage.runTag);
  return p;
}
async function passwordInInbox(email) {
  let matching=[];
  for(let poll=0;poll<20;poll++){
    const list=await (await stage.fetch(config.mailUrl+'/api/v1/search?query='+encodeURIComponent('to:"'+email+'"'))).json();
    matching=list.messages.filter(m=>m.Subject==='Your CrossFire student portal credentials' && m.To.some(to=>to.Address===email));
    if(matching.length) break;
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  check(matching.length===1,'one credential email per recipient');
  const mail=await (await stage.fetch(config.mailUrl+'/api/v1/message/'+matching[0].ID)).json();
  const match=mail.Text.match(/Temporary password: ([^\s]+)/);
  check(match && mail.Text.includes(site+'/#student-login'),'mail contains credential and controlled sign-in URL');return match[1];
}
try {
  await preflight(stage);
  check(await stage.db.query("select to_regclass('public.crossfire_student_credentials') is not null as ready").then(r=>r.rows[0].ready),'cutover applied');
  const {chromium}=await import(process.env.CROSSFIRE_STAGE_PLAYWRIGHT || 'playwright');
  browser=await chromium.launch({args:['--disable-dev-shm-usage']});
  mailBefore=(await stage.db.query('select * from public.crossfire_mail_settings where singleton')).rows[0];
  await stage.db.query("update public.crossfire_mail_settings set enabled=true,sender_email='registrar@example.test',reply_to='registrar@example.test' where singleton");
  eventId=(await stage.db.query(`insert into public.events(name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
      values($1,$2,'Group A','Stage fixture','test','solo',1,0,'{}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Stage Hall') returning id`,[eventName,'journey-'+stage.runTag])).rows[0].id;
  for(const role of ['admin','super_admin','volunteer']) agents[role]=await staff(role);
  step='mobile registration';
  const mobile=await context(390);
  await mobile.goto(site+'/#register');
  await mobile.getByPlaceholder('Enter your full name').fill(nameFor(1));
  check(await mobile.locator('input[type=password]').count()===0,'registration asks for no password');
  await mobile.getByPlaceholder('e.g. yourname@gmail.com').fill(emailFor(1));
  const phone=mobile.getByPlaceholder('9876543210').first();
  const uniquePhone='9'+randomInt(100000000,999999999);
  await phone.fill(uniquePhone+'1');check((await phone.inputValue())===uniquePhone,'mobile phone limited to ten digits');
  await mobile.getByPlaceholder(/DAV Public School/).fill('Stage College');
  await mobile.getByPlaceholder(/Bhubaneswar, Cuttack/).fill('Stage City');
  await mobile.getByText(eventName,{exact:true}).click();
  await mobile.getByText(/I confirm these details are accurate/).click();
  const receiptResponse=mobile.waitForResponse(r=>r.request().method()==='POST' && r.url().endsWith('/functions/v1/register-student'));
  await mobile.locator('form button[type=submit]').click();
  const reg=await receiptResponse;
  const body=await reg.json();check(reg.ok() && body.receipt?.pass_id,'mobile registration receipt HTTP '+reg.status());
  const payload=reg.request().postDataJSON();requestIds.push(payload.request_id);
  await mobile.getByLabel('QR pass '+body.receipt.pass_id,{exact:true}).waitFor();
  check(!await mobile.evaluate(()=>sessionStorage.getItem('crossfire.auth')),'no registration session');
  const receipt=body.receipt;
  check(receipt.competitions.includes(eventName) && receipt.email===emailFor(1),'receipt details');
  const [download]=await Promise.all([mobile.waitForEvent('download'),mobile.getByRole('button',{name:'Download QR',exact:true}).click()]);
  check(!await download.failure(),'student can download the QR as a PNG');
  const qrImage=await readFile(await download.path());
  await mobile.context().close();
  passed('Mobile registration, ten-digit validation, immediate QR and acknowledgement, no automatic sign-in');
  step='duplicate registration and volunteer scan';
  const retry=await stage.fresh().functions.invoke('register-student',{body:payload});
  check(retry.data?.receipt?.pass_id===receipt.pass_id,'same pass on retry');
  const gate=agents.volunteer;
  const scan=await gate.rpc('crossfire_ops_lookup_pass',{p_code:receipt.pass_id});
  check(scan.data?.id,'gate resolves pass');
  const gatePage=await context(390,gate);
  await gatePage.goto(site+'/#volunteer');
  await gatePage.getByRole('button',{name:'Student desk',exact:true}).first().click();
  await gatePage.getByRole('button',{name:'Scan QR',exact:true}).click();
  await gatePage.getByRole('button',{name:'Upload Image',exact:true}).click();
  const [lookup]=await Promise.all([
    gatePage.waitForResponse(r=>r.url().includes('/rpc/crossfire_ops_lookup_pass') && r.request().method()==='POST'),
    gatePage.locator('input[type=file]').setInputFiles({name:'student-qr.png',mimeType:'image/png',buffer:qrImage}),
  ]);
  check(lookup.ok(),'uploaded registration QR decoded by volunteer scanner');
  const card=gatePage.getByText(nameFor(1),{exact:true}).first().locator('xpath=ancestor::*[.//button[normalize-space()="Check in"]][1]');
  const [saved]=await Promise.all([
    gatePage.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('/rpc/crossfire_ops_action')),
    card.getByRole('button',{name:'Check in',exact:true}).click(),
  ]);
  check(saved.ok(),'first check-in');
  await gatePage.context().close();
  check((await gate.rpc('staff_set_check_in',{p_user_id:scan.data.id,p_checked_in:true})).error?.message.toLowerCase().includes('already checked in'),'repeat scan denied');
  passed('Same receipt on retry; volunteer scanned the real QR image and checked in exactly once before issuance');
  const b=await registerApi(2);
  const failover=await registerApi(3);
  step='manager panels';
  const adminPage=await managerPage(agents.admin,1440);
  const superPage=await managerPage(agents.super_admin,390);
  for(const page of [adminPage,superPage]){
    await page.getByRole('button',{name:'View details for '+nameFor(1)}).click();
    await page.getByRole('dialog').getByText(receipt.pass_id,{exact:true}).waitFor();
    await page.getByRole('button',{name:'Close student details'}).click();
  }
  await superPage.context().close();
  check((await gate.functions.invoke('student-portal',creds('issue',payload.request_id))).error,'volunteer denied issuance');
  check((await stage.fresh().functions.invoke('student-portal',creds('issue',payload.request_id))).error,'anonymous caller denied issuance');
  passed('Desktop admin and mobile MFA super admin see registration details; unauthorized issuance denied');
  step='bulk issuance from dashboard';
  for(const n of [1,2]) await adminPage.getByRole('checkbox',{name:'Select '+nameFor(n),exact:true}).check();
  await adminPage.getByRole('button',{name:/Bulk actions/}).click();
  await adminPage.getByRole('button',{name:'Approve and issue credentials',exact:true}).click();
  for(const n of [1,2]) await adminPage.getByText(nameFor(n)+': Email accepted',{exact:true}).waitFor({timeout:45000});
  await adminPage.context().close();
  const temp=await passwordInInbox(emailFor(1));
  check(temp!==await passwordInInbox(emailFor(2)),'distinct temporary passwords');
  const replay=await agents.super_admin.functions.invoke('student-portal',creds('issue',b.id));
  check(replay.data?.status==='already_issued' && !JSON.stringify(replay.data).includes(temp),'already issued is stable');
  passed('Bulk issuance, private mail with unique credentials, safe replay and per-student dashboard outcomes');
  step='partial delivery failure and concurrent retry';
  docker('stop');inboxStopped=true;
  const failed=await agents.admin.functions.invoke('student-portal',creds('issue',failover.id));
  check(['failed','uncertain'].includes(failed.data?.status),'delivery failure recorded');
  docker('start');inboxStopped=false;
  for(let n=0;n<20;n++){try{await stage.inbox.ready();break;}catch{await new Promise(r=>setTimeout(r,250));}}
  const retries=await Promise.all([agents.admin,agents.super_admin].map(c=>c.functions.invoke('student-portal',creds('issue',failover.id))));
  check(retries.some(r=>r.data?.status==='accepted') && retries.every(r=>['accepted','in_progress','already_issued'].includes(r.data?.status)),'retry outcomes');
  await passwordInInbox(emailFor(3));
  passed('Real inbox outage and overlapping delivery retries recover the failed student without rotating delivered passwords');
  step='forced first sign-in';
  const client=stage.fresh();const initial=await client.auth.signInWithPassword({email:receipt.email,password:temp});
  check(initial.data.session,'temporary password works');
  const profile=await client.rpc('crossfire_current_profile');
  check(profile.data?.must_change_password && !('pass_code' in profile.data) && (await client.rpc('current_user_role')).data===null,'bootstrap only');
  check((await client.from('users').select('id')).data?.length===0 && (await client.rpc('crossfire_complete_password_change')).error,'data and bypass denied');
  const portal=await context(390);
  await portal.goto(site+'/#student-login');
  await portal.getByLabel('Student ID or registered email').fill(receipt.student_id);
  await portal.getByLabel('Password',{exact:true}).fill(temp);
  await portal.locator('dialog form').getByRole('button').click();
  await portal.getByRole('heading',{name:'Choose your own password'}).waitFor();
  const next=secret();
  await portal.getByLabel('New password',{exact:true}).fill(next);
  await portal.getByLabel('Confirm new password').fill(next);
  await portal.getByRole('button',{name:'Save password and continue'}).click();
  await portal.getByRole('heading',{name:'Choose your own password'}).waitFor({state:'detached'});
  check(!(await stage.fresh().auth.signInWithPassword({email:receipt.email,password:temp})).data.session,'old password rejected');
  const oldRole=await client.rpc('current_user_role');
  const oldRows=await client.from('users').select('id');
  check(!oldRole.data && !oldRows.data?.length,'an earlier temporary session stays denied after another session changes the password');
  const already=await agents.admin.functions.invoke('student-portal',creds('issue',payload.request_id));
  check(already.data?.status==='already_issued','a repeat issuance does not rotate the chosen password');
  check(!(await agents.super_admin.rpc('crossfire_ops_action',{p_action:'settings.registration',p_payload:{open:false}})).error,'registration closed');
  closed=true;
  const session=await stage.fresh().functions.invoke('student-portal',{body:{action:'login',student_id:receipt.student_id,password:next}});
  check(session.data?.access_token,'issued ID works after closing registration');
  const active=stage.fresh();await active.auth.setSession(session.data);
  check((await active.rpc('crossfire_current_profile')).data?.pass_code===receipt.pass_id,'dashboard restored after password change');
  passed('Student ID sign-in, backend first-password enforcement, password change and active access after registration closes');
} catch(error) {
  // Browser errors and API payloads may contain inputs. Report the step and code location only.
  if(diagnosticPage && !diagnosticPage.isClosed()) {
    const state=await diagnosticPage.evaluate(()=>({hash:location.hash,dialogs:document.querySelectorAll('dialog[open]').length,forms:document.forms.length,filePicker:!!document.querySelector('input[type=file]'),unreadableQR:document.body.textContent.includes('Could not detect a valid QR'),cameraDenied:document.body.textContent.includes('Camera access was not granted')})).catch(()=>({}));
    console.error('Browser state '+JSON.stringify(state)+' ('+error.name+')');
  }
  console.error('FAIL '+step+(error instanceof JourneyCheck ? ' — '+error.message : '')+' at '+(String(error?.stack).match(/full-journey\.mjs:\d+/)||['unknown location'])[0]);
  process.exitCode=1;
} finally {
  if(inboxStopped) docker('start');
  if(closed) await agents.super_admin.rpc('crossfire_ops_action',{p_action:'settings.registration',p_payload:{open:true}});
  await browser?.close();
  if (mailBefore) await stage.db.query('update public.crossfire_mail_settings set enabled=$1,sender_email=$2,reply_to=$3 where singleton',[mailBefore.enabled,mailBefore.sender_email,mailBefore.reply_to]);
  for(const id of requestIds) {const row=await stage.db.query('select user_id from public.crossfire_student_accounts where request_id=$1',[id]);if(row.rows[0]) stage.created.push(row.rows[0].user_id);}
  await cleanup(stage);
  await stage.db.end();
  const output=new URL('../../artifacts/stage-auth-proof/',import.meta.url);await mkdir(output,{recursive:true});
  await writeFile(new URL('student-journey.json',output),JSON.stringify({passed:cases,failed:process.exitCode?step:null},null,2));
}
