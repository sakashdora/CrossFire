import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import ts from 'typescript';

// Public student sign-in is hidden unless VITE_STUDENT_SIGNIN_PUBLIC=true.
// Staff sign-in stays public; #student-login is the controlled student entry.
const output=new URL('../artifacts/student-access-qa/',import.meta.url);
await mkdir(output,{recursive:true});
const source=await readFile(new URL('../src/lib/studentAccess.ts',import.meta.url),'utf8');
await writeFile(new URL('studentAccess.mjs',output),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {publicStudentSignInEnabled,isStudentLoginHash,STUDENT_LOGIN_VIEW,PUBLIC_STUDENT_SIGNIN}=await import(new URL('studentAccess.mjs',output));
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

let count=0;
const test=async(name,fn)=>{await fn();count++;console.log('PASS: '+name);};
await test('public student sign-in is hidden unless explicitly enabled',()=>{
  assert.equal(PUBLIC_STUDENT_SIGNIN,false,'Unset flag must hide public student sign-in');
  for(const value of [undefined,'','false','TRUE','1','yes']) assert.equal(publicStudentSignInEnabled(value),false);
  assert.equal(publicStudentSignInEnabled('true'),true);
});
await test('only the exact controlled hash opens the student entry',()=>{
  assert.equal(STUDENT_LOGIN_VIEW,'student-login');
  for(const hash of ['#student-login','student-login','#student-login?from=email']) assert.equal(isStudentLoginHash(hash),true);
  for(const hash of ['','#landing','#student-login-x','#dashboard','#student']) assert.equal(isStudentLoginHash(hash),false);
});
await test('public student sign-in CTAs are guarded; staff sign-in stays reachable',async()=>{
  const modal=await read('src/components/AuthModal.tsx');
  assert.match(modal,/showStudent = PUBLIC_STUDENT_SIGNIN \|\| studentEntry/);
  assert.match(modal,/\{showStudent && <div role="tablist"/);
  assert.match(modal,/setStaff\(!showStudent\)/,'Hidden student tab must default to staff sign-in');
  const notice=await read('src/components/RegistrationLiveNotice.tsx');
  assert.match(notice,/\{PUBLIC_STUDENT_SIGNIN && <p className="cf-reg-notice__footer">/);
  const page=await read('src/pages/RegistrationPage.tsx');
  assert.equal((page.match(/\{PUBLIC_STUDENT_SIGNIN && <button type="button" onClick=\{openStudentLogin\}/g)||[]).length,2);
  const navbar=await read('src/components/Navbar.tsx');
  assert.equal((navbar.match(/onClick=\{\(\) => openAuthModal\('login'\)\}|openAuthModal\('login'\);/g)||[]).length,2,'Desktop and mobile staff sign-in remain');
  const app=await read('src/App.tsx');
  assert.match(app,/if \(!user\) \{ openAuth\('login'\); return; \}/,'Mobile bottom portal still opens sign-in');
  assert.match(app,/isStudentLoginHash\(window\.location\.hash\)/);
  assert.match(app,/studentEntry=\{studentEntry\}/);
});
await test('the build accepts only true or false for the flag',async()=>{
  const security=await read('scripts/build-security.mjs');
  assert.match(security,/'VITE_STUDENT_SIGNIN_PUBLIC'/);
  assert.match(security,/VITE_STUDENT_SIGNIN_PUBLIC must be true or false/);
});
console.log(`\n${count} student access checks passed.`);
