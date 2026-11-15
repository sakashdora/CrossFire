import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PhasePill, Schedule, dayLabel, slotsOf, timeRange, useNow, useScheduleEvents } from './schedule';
import './volunteer.css';
import './results.css';

type Entry = { id: string; name: string; school: string };
type Typed = { name: string; school: string } | null;
type ResultEvent = { id: string; name: string; day: string; event_day: boolean; coordinator: string | null; version: number; state: 'Draft' | 'In review' | 'Changes requested' | 'Published'; picks: (string | null)[]; manual?: Typed[]; labels: string[] | null; feedback: string; entries: Entry[] };
type Desk = { events: ResultEvent[]; staff: { id: string; name: string }[] };
// The fourth award is separate from the podium and optional.
const awards = ['1st place', '2nd place', '3rd place', 'Champion'];
type Action = 'assign' | 'approve' | 'return' | 'submit' | 'save';

// Each award holds a registered participant or a typed name and college (for students registered offline).
type Slot = { mode: 'registered' | 'typed'; pick: string; name: string; school: string };
const TYPED = '__typed';
const initialSlots = (event: ResultEvent): Slot[] => awards.map((_, i) => {
  const typed = event.manual?.[i];
  return typed ? { mode: 'typed', pick: '', name: typed.name, school: typed.school } : { mode: 'registered', pick: event.picks[i] || '', name: '', school: '' };
});
const payload = (slots: Slot[]) => ({
  picks: slots.map(slot => slot.mode === 'registered' && slot.pick ? slot.pick : null),
  manual: slots.map(slot => slot.mode === 'typed' && (slot.name.trim() || slot.school.trim()) ? { name: slot.name, school: slot.school } : null),
});
const filled = (slot: Slot) => slot.mode === 'registered' ? Boolean(slot.pick) : slot.name.trim().length >= 2 && slot.school.trim().length >= 2;
// What must be fixed before submitting, in plain words (the server checks again).
function submitProblem(slots: Slot[]) {
  for (const [i, slot] of slots.entries()) if (slot.mode === 'typed' && (slot.name.trim() || slot.school.trim()) && !filled(slot)) return `${awards[i]}: type both the participant name and the college name.`;
  for (let i = 0; i < 3; i++) if (!filled(slots[i])) return `Choose or type a name for ${awards[i]}.`;
  return '';
}

function EventSheet({ event, staff, manager, reload, onDirty }: { event: ResultEvent; staff: Desk['staff']; manager: boolean; reload: (message: string) => Promise<void>; onDirty?: (eventId: string, dirty: boolean) => void }) {
  const [slots, setSlots] = useState<Slot[]>(() => initialSlots(event));
  const saved = useRef(JSON.stringify(payload(initialSlots(event))));
  const [coordinator, setCoordinator] = useState(event.coordinator || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editable = !manager && (event.state === 'Draft' || event.state === 'Changes requested');
  // Lets the desk warn about unsaved winners, including on events the coordinator switched away from.
  useEffect(() => { onDirty?.(event.id, JSON.stringify(payload(slots)) !== saved.current); }, [slots, event.id, onDirty]);
  useEffect(() => () => onDirty?.(event.id, false), [event.id, onDirty]);
  const change = (index: number, next: Partial<Slot>) => setSlots(current => current.map((slot, k) => k === index ? { ...slot, ...next } : slot));
  async function act(action: Action) {
    if (busy) return;
    if (action === 'submit') { const problem = submitProblem(slots); if (problem) { setError(problem); return; } }
    setBusy(true); setError('');
    try {
      const { picks, manual } = payload(slots);
      const { error: failure } = await supabase.rpc('result_action', { p_event: event.id, p_version: event.version, p_action: action, p_coordinator: coordinator || null, p_picks: picks, p_manual: manual, p_feedback: reason });
      if (failure) throw new Error(failure.message);
      await reload(({assign:'Coordinator assignment saved.',approve:'Awards published to the leaderboard.',return:'Declaration returned for changes.',submit:'Declaration submitted for review.',save:'Draft saved.'})[action]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save. Refresh and try again.'); }
    finally { setBusy(false); }
  }
  const slotText = (i: number) => {
    const typed = event.manual?.[i];
    const entry = event.entries.find(item => item.id === event.picks[i]);
    return event.labels?.[i] || (typed ? `${typed.name} — ${typed.school}` : '') || (entry ? `${entry.name} — ${entry.school}` : '') || (event.picks[i] ? 'Entry no longer eligible' : i === 3 ? 'None declared' : 'Not declared');
  };
  const step = event.state === 'Published' ? 2 : event.state === 'In review' ? 1 : 0;
  return <>
    {manager && <section className="vd-assignment"><div><p className="vd-label">Event result sheet</p><h2>{event.name}</h2></div><b className="vd-status">{event.state}</b></section>}
    <div className="vd-grid"><section className="vd-card"><h2>{manager ? 'Award review' : `${event.name} — winners`}</h2>
      <p className={manager ? undefined : 'result-next'}>{manager ? (editable ? 'Select registered entries for each award.' : event.state === 'Published' ? 'These awards appear on the public leaderboard.' : event.state === 'In review' ? 'Submitted for administrator review.' : 'Waiting for the coordinator to submit.')
        : event.state === 'Published' ? 'Done. These awards are on the public leaderboard.'
        : event.state === 'In review' ? 'Submitted. An admin will review your result next.'
        : event.state === 'Changes requested' ? 'An admin asked for changes. Update the winners, then submit again.'
        : event.event_day ? 'Choose or type the 1st, 2nd and 3rd place winners, then tap Submit for review.'
        : `You can enter winners now and save a draft. Submitting opens on event day (${event.day}).`}</p>
      {event.feedback && <p className="result-feedback"><b>Reviewer feedback</b><br/>{event.feedback}</p>}
      {editable && <p className="result-hint">Student registered offline? Choose <b>Not registered online</b> and type their name and college.</p>}
      {awards.map((label, i) => editable ? <fieldset className="result-slotbox" key={label} disabled={busy}>
        <legend>{i === 3 ? 'Champion (optional)' : label}</legend>
        <select aria-label={`${label}: participant`} value={slots[i].mode === 'typed' ? TYPED : slots[i].pick}
          onChange={e => e.target.value === TYPED ? change(i, { mode: 'typed', pick: '' }) : change(i, { mode: 'registered', pick: e.target.value, name: '', school: '' })}>
          <option value="">{i === 3 ? 'No champion declared' : 'Choose a registered participant'}</option>
          {event.entries.map(entry => <option key={entry.id} value={entry.id}>{entry.name} · {entry.school}</option>)}
          <option value={TYPED}>Not registered online — type name and college</option>
        </select>
        {slots[i].mode === 'typed' && <div className="result-typed">
          <input aria-label={`${label}: participant name`} placeholder="Participant name" autoComplete="off" autoCapitalize="words" maxLength={100} value={slots[i].name} onChange={e => change(i, { name: e.target.value })} />
          <input aria-label={`${label}: college or school name`} placeholder="College / school name" autoComplete="off" autoCapitalize="words" maxLength={150} value={slots[i].school} onChange={e => change(i, { school: e.target.value })} />
        </div>}
      </fieldset> : <div className="result-row" key={label}><strong>{i === 3 ? 'Champion' : label}</strong><span>{slotText(i)}</span></div>)}
      {editable && <><div className="result-actions"><button className="result-primary" disabled={busy || (!event.event_day && event.state==='Draft')} onClick={()=>void act('submit')}>Submit for review</button><button disabled={busy} onClick={()=>void act('save')}>Save draft</button></div>{!event.event_day && event.state==='Draft' && <p>Submission opens on the event day ({event.day}, India time).</p>}</>}
      {manager && event.state==='In review' && <><label className="result-reason">Reason if returning for changes<textarea value={reason} disabled={busy} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label><div className="result-actions"><button className="result-primary" disabled={busy} onClick={()=>void act('approve')}>Approve &amp; publish</button><button disabled={busy || !reason.trim()} onClick={()=>void act('return')}>Request changes</button></div></>}
      {error && <p role="alert" className="result-feedback">{error}</p>}
    </section><div className="vd-side"><section className="vd-card"><h3>Publication status</h3><ol className="result-track">
    {['Declaration','Admin review','Public leaderboard'].map((t,i)=><li key={t} className={i<=step?'reached':''}><strong>{t}</strong><small>{['Coordinator enters the winners.','An admin or super admin checks the result.','Approved awards appear under the event.'][i]}</small></li>)}</ol></section>
    {manager && <section className="vd-card"><h3>Assigned coordinator</h3><label><span className="sr-only">Assigned coordinator</span><select disabled={busy} value={coordinator} onChange={e=>setCoordinator(e.target.value)}><option value="">Unassigned</option>{staff.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={busy || coordinator===(event.coordinator || '')} onClick={()=>void act('assign')}>Save assignment</button><p>Manage coordinator logins in Staff access.</p></section>}</div></div>
  </>;
}
export function ResultsDesk({ manager=false, initialEventId='' }: { manager?: boolean; initialEventId?: string }) {
  const [desk,setDesk]=useState<Desk|null>(null);
  const [eventId,setEvent]=useState(initialEventId);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [dirty,setDirty]=useState<Record<string,boolean>>({});
  const schedule=useScheduleEvents();
  const now=useNow();
  const markDirty=useCallback((id:string,value:boolean)=>setDirty(current=>current[id]===value?current:{...current,[id]:value}),[]);

  const sequence=useRef(0);
  const load=useCallback(async(savedMessage='')=>{
    const id=++sequence.current;
    const {data,error}=await supabase.rpc('result_desk');
    if(sequence.current!==id)return;
    const next = error ? null : data as Desk;
    setNotice(savedMessage);setError(error?.message || '');setDesk(next);
    if (next) setEvent(current => next.events.some(event => event.id === current) ? current : ((manager && next.events.find(event => event.state === 'In review')?.id) || next.events[0]?.id || ''));
  },[manager]);
  useEffect(()=>{void load();return()=>{sequence.current++}},[load]);
  // Leaving the page with unsaved winners (on any of the coordinator's events) asks first.
  const unsaved=Object.values(dirty).some(Boolean);
  useEffect(()=>{
    if(!unsaved)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[unsaved]);
  const selected=desk?.events.find(e=>e.id===eventId)||desk?.events[0];
  if (manager) return <div className="vd result-desk"><p className="vd-label">CrossFire 2026 &nbsp; / &nbsp; Event day</p><h1>Review event results</h1>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    {selected && desk ? <><label className="result-picker">Event <select value={selected.id} onChange={e=>setEvent(e.target.value)}>{desk.events.map(e=><option key={e.id} value={e.id}>{e.name} · {e.state}</option>)}</select></label>
    <EventSheet key={selected.id+'-'+selected.version} event={selected} manager={manager} staff={desk.staff} reload={load}/></> : <p role="status">{desk?'No events assigned. Contact an administrator.':error?'':'Loading result sheets…'}</p>}
    <button className="result-refresh" onClick={()=>void load()}>Refresh desk</button>
  </div>;
  return <div className="vd result-desk coordinator">
    <header className="vd-hello"><div><p className="vd-label">Results desk</p><h1>My events</h1></div><span className="cs-clock">{dayLabel(now)}</span></header>
    {notice && <p role="status" className="result-notice">{notice}</p>}
    {error && <p role="alert" className="result-error">{error} <button type="button" onClick={()=>void load()}><RefreshCw size={15} aria-hidden="true"/> Try again</button></p>}
    {!desk && !error && <div className="ops-skeleton-inline" role="status"><span className="sr-only">Loading your events…</span><div className="sk sk-hero"/><div className="sk sk-card"/></div>}
    {desk && (selected ? <>
      {desk.events.length>1 && <p className="result-hint">You have {desk.events.length} events. Tap an event to enter its winners. Entries on every event are kept while you switch.</p>}
      <div className="result-events" role="group" aria-label="My assigned events">{desk.events.map(event=>{
        const slots=slotsOf(schedule,event.id);
        return <button type="button" key={event.id} className={'result-event'+(event.id===selected.id?' on':'')} aria-pressed={event.id===selected.id} onClick={()=>setEvent(event.id)}>
          <span className="result-event-top"><strong>{event.name}</strong><span className="result-badges">{dirty[event.id]&&<span className="cs-pill live">Unsaved</span>}<span className="cs-pill state">{event.state}</span></span></span>
          {slots.map(slot=><span className="result-slot" key={slot.id}>{slots.length>1&&<span className="result-slotname">{slot.name}</span>}
            <span className="result-event-line"><Clock size={14} aria-hidden="true"/>{timeRange(slot)}<PhasePill event={slot} now={now}/></span>
            <span className="result-event-line where"><MapPin size={14} aria-hidden="true"/><span>{slot.venue||'Venue to be announced'}</span></span></span>)}
        </button>;})}</div>
      {desk.events.map(event=><div key={event.id+'-'+event.version} hidden={event.id!==selected.id}><EventSheet event={event} manager={false} staff={desk.staff} reload={load} onDirty={markDirty}/></div>)}
    </> : <section className="vd-card"><h2>No event assigned yet</h2><p>An admin will assign your event soon. Today’s full schedule is below.</p></section>)}
    {desk && <Schedule events={schedule} highlight={desk.events.map(event=>event.id)}/>}
    <button className="result-refresh" onClick={()=>void load()}><RefreshCw size={15} aria-hidden="true"/> Refresh desk</button>
  </div>;
}

type Published = { event_name: string; awards: (string | null)[] };
export function PublishedAwards() {
  const [rows,setRows]=useState<Published[]>([]);const [error,setError]=useState(false);
  useEffect(()=>{let active=true,sequence=0;const load=async()=>{const id=++sequence;const {data,error}=await supabase.rpc('published_event_awards');if(active&&sequence===id){setError(!!error);if(!error)setRows(data||[])}};
    void load();const tick=()=>{if(!document.hidden)void load()};const timer=window.setInterval(tick,15000);window.addEventListener('focus',tick);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',tick)}},[]);
  return <section className="vd result-public"><p className="vd-label">Approved declarations</p><h2>Event awards</h2>
    {error && <p role="alert">Event awards could not be refreshed.</p>}{!error && !rows.length && <p>Awaiting approved event awards.</p>}
    {rows.map(row=><article className="vd-card" key={row.event_name}><h3>{row.event_name}</h3>{awards.map((award,i)=>row.awards[i]?<div className="result-row" key={award}><strong>{award}</strong><span>{row.awards[i]}</span></div>:null)}</article>)}</section>;
}
