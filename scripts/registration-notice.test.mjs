import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import ts from 'typescript';

// Rules behind the "registration is live" announcement. Browser behaviour (dialog,
// focus, timing) is checked against the real component; these cover the pure rules
// and guard the contracts the component relies on.
const output=new URL('../artifacts/registration-notice-qa/',import.meta.url);
await mkdir(output,{recursive:true});
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
await writeFile(new URL('registrationNotice.mjs',output),ts.transpileModule(await read('src/lib/registrationNotice.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {REGISTRATION_NOTICE_KEY,REGISTRATION_NOTICE_DELAY_MS,registrationStatusFromSetting,noticeConditionsMet,isEditableElement,createNoticeMemory}=await import(new URL('registrationNotice.mjs',output));

let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS: '+name);};
const eligible={view:'landing',authStatus:'anonymous',registrationStatus:'open',documentVisible:true,introActive:false,authModalOpen:false,awaitingFreshStatus:false};
const memoryStorage=()=>{const data=new Map();return {data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};

test('only a boolean setting is trusted; nothing defaults to open',()=>{
  assert.equal(registrationStatusFromSetting(true,null),'open');
  assert.equal(registrationStatusFromSetting(false,null),'closed');
  for(const data of [null,undefined,'true',1,0,{},[]]) assert.equal(registrationStatusFromSetting(data,null),'error',String(data));
  assert.equal(registrationStatusFromSetting(true,{message:'rpc failed'}),'error');
});
test('the notice needs every condition at once',()=>{
  assert.equal(noticeConditionsMet(eligible),true);
  const blockers={view:['register','events','leaderboard','activate','account','dashboard','admin','volunteer','judge','vip'],
    authStatus:['loading','authenticated','error','unconfigured'],registrationStatus:['loading','closed','error'],
    documentVisible:[false],introActive:[true],authModalOpen:[true],awaitingFreshStatus:[true]};
  for(const [key,values] of Object.entries(blockers)) for(const value of values)
    assert.equal(noticeConditionsMet({...eligible,[key]:value}),false,`${key}=${value}`);
});
test('typing in a text control blocks the prompt; buttons and links do not',()=>{
  for(const el of [{tagName:'INPUT'},{tagName:'input',type:'email'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{tagName:'DIV',isContentEditable:true}]) assert.equal(isEditableElement(el),true,JSON.stringify(el));
  for(const el of [null,undefined,{tagName:'BUTTON'},{tagName:'A'},{tagName:'BODY'},{tagName:'INPUT',type:'checkbox'},{tagName:'INPUT',type:'submit'}]) assert.equal(isEditableElement(el),false,JSON.stringify(el));
});
test('seen is stored as a fixed flag under a versioned key',()=>{
  assert.equal(REGISTRATION_NOTICE_KEY,'crossfire:registration-live:2026:v1');
  assert.equal(REGISTRATION_NOTICE_DELAY_MS,900);
  const store=memoryStorage();
  const memory=createNoticeMemory(()=>store);
  assert.equal(memory.hasSeen(),false);
  memory.markSeen();
  assert.equal(memory.hasSeen(),true);
  assert.deepEqual([...store.data],[[REGISTRATION_NOTICE_KEY,'1']],'nothing but the flag is written');
  assert.equal(createNoticeMemory(()=>store).hasSeen(),true,'a reload in the same tab session stays suppressed');
});
test('malformed stored values are discarded and treated as unseen',()=>{
  for(const value of ['true','0','{"seen":true}','']){
    const store=memoryStorage(); store.setItem(REGISTRATION_NOTICE_KEY,value);
    assert.equal(createNoticeMemory(()=>store).hasSeen(),false,value);
    assert.equal(store.getItem(REGISTRATION_NOTICE_KEY),null,value);
  }
});
test('denied storage falls back to memory without throwing',()=>{
  const denied={getItem(){throw new Error('SecurityError');},setItem(){throw new Error('QuotaExceededError');},removeItem(){throw new Error('SecurityError');}};
  for(const getStorage of [()=>denied,()=>{throw new Error('SecurityError');},()=>null]){
    const memory=createNoticeMemory(getStorage);
    assert.equal(memory.hasSeen(),false);
    memory.markSeen();
    assert.equal(memory.hasSeen(),true,'memory keeps the page load suppressed');
  }
});
const [auth,hook,notice,app,page]=await Promise.all(['src/context/AuthContext.tsx','src/hooks/useRegistrationNotice.ts','src/components/RegistrationLiveNotice.tsx','src/App.tsx','src/pages/RegistrationPage.tsx'].map(read));
test('auth context reports explicit statuses and keeps the boolean contract',()=>{
  assert.match(auth,/useState<RegistrationStatus>\(isSupabaseConfigured \? 'loading' : 'error'\)/);
  assert.match(auth,/useState<AuthStatus>\(isSupabaseConfigured \? 'loading' : 'unconfigured'\)/);
  assert.match(auth,/isRegistrationOpen:registrationStatus === 'open'/);
  assert.match(auth,/if \(!session\) \{[^}]*setAuthStatus\('anonymous'\)/);
  assert.match(auth,/catch \{\s*if \(request === revision\.current\) \{[^}]*setAuthStatus\('error'\)/);
  assert.equal((auth.match(/setInterval\(/g)||[]).length,1,'one shared refresh loop');
  assert.match(auth,/if \(registrationRequest\.current\) return registrationRequest\.current;/,'overlapping refreshes are shared');
  assert.match(auth,/addEventListener\('visibilitychange'/);
});
test('the notice never queries data itself and never renders raw HTML',()=>{
  for(const [name,source] of [['hook',hook],['notice',notice]]){
    assert.doesNotMatch(source,/supabase|fetch\(|\.rpc\(|setInterval|dangerouslySetInnerHTML|localStorage/,name);
  }
  assert.match(notice,/aria-label="Close registration announcement"/);
  for(const copy of ['Registration open','CrossFire 2026','Registration is now <span>LIVE</span>','For +2 final-year students','Choose your competitions and get your QR entry pass immediately. The organisers will email your student portal credentials separately.','Register now','Maybe later','Already registered?','Sign in'])
    assert.ok(notice.includes(copy),copy);
  assert.doesNotMatch(notice,/onClick=\{[^}]*\}\s*\n?\s*>\s*\n?\s*<div className="cf-reg-notice__card"/,'no click handler on the dialog container');
  assert.equal((app.match(/<RegistrationLiveNotice/g)||[]).length,1,'mounted once');
});
test('registration page does not flash closed while loading and offers a retry on error',()=>{
  assert.match(page,/registrationStatus === 'loading' \? \(/);
  assert.match(page,/registrationStatus === 'closed' \? \(/);
  assert.match(page,/Registration status could not be checked\. Please try again\./);
  assert.match(page,/refreshRegistrationStatus\(\)/);
  assert.doesNotMatch(page,/!authLoading && !isRegistrationOpen/);
  assert.match(page,/\/\^\[0-9\]\{10\}\$\/\.test\(contactNo\)/,'exact 10-digit contact validation is kept');
});
console.log(`\n${count} registration notice checks passed.`);
