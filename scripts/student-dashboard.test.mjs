import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import ts from 'typescript';

// Pure rules behind the student dashboard "Add competition" dialog. The server
// (registrations_before_insert) enforces the same rules; see accounts-registration.test.mjs.
const output=new URL('../artifacts/student-dashboard-qa/',import.meta.url);
await mkdir(output,{recursive:true});
const source=await readFile(new URL('../src/lib/competitionChoices.ts',import.meta.url),'utf8');
await writeFile(new URL('competitionChoices.mjs',output),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {competitionChoices,validateTeam,MAX_COMPETITIONS}=await import(new URL('competitionChoices.mjs',output));

const now=Date.parse('2026-11-01T00:00:00Z');
const later='2026-11-10T00:00:00Z', earlier='2026-10-20T00:00:00Z';
const event=(id,group,extra={})=>({id,name:'Event '+id,group,status:'open',registration_deadline:later,event_type:'solo',team_size:1,...extra});
const events=[event('a1','Group A'),event('a2','Group A'),event('a3','Group A',{event_type:'team',team_size:3}),event('b1','Group B'),event('b2','Group B',{status:'registration_closed'}),event('b3','Group B',{registration_deadline:earlier}),event('d','Group B',{status:'draft'})];
const entry=(eventId)=>({id:'r-'+eventId,event_id:eventId,event:events.find(item=>item.id===eventId)});
const reasons=(registrations,open=true)=>Object.fromEntries(competitionChoices(events,registrations,open,now).map(choice=>[choice.event.id,choice.reason]));

let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS: '+name);};
test('a registered student can add open events up to 2 per group (4 in total)',()=>{
  assert.equal(MAX_COMPETITIONS,4);
  const r=reasons([entry('a1')]);
  assert.equal(r.a1,'Already registered');
  assert.equal(r.a2,null); assert.equal(r.a3,null); assert.equal(r.b1,null);
  assert.ok(!('d' in r),'draft events are never offered');
});
test('a full group, closed event, passed deadline and closed registration are explained',()=>{
  const r=reasons([entry('a1'),entry('a2')]);
  assert.match(r.a3,/2 Group A events/);
  assert.equal(r.b1,null);
  assert.match(r.b2,/event is closed/);
  assert.match(r.b3,/deadline has passed/);
  assert.ok(Object.values(reasons([],false)).every(reason=>/closed|deadline/.test(reason)));
});
test('team events require a team name and every teammate',()=>{
  const team=events.find(item=>item.id==='a3');
  assert.equal(validateTeam(events[0],'',[]),null);
  assert.match(validateTeam(team,'',['Asha','Ravi']),/team name/);
  assert.match(validateTeam(team,'Blue',['Asha']),/2 teammates/);
  assert.match(validateTeam(team,'Blue',['Asha',' ']),/2 teammates/);
  assert.equal(validateTeam(team,'Blue',['Asha','Ravi']),null);
});
console.log(`\n${count} student dashboard checks passed.`);
