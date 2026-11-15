import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Clock, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PhasePill, Schedule, dayLabel, slotsOf, timeRange, useNow, useScheduleEvents } from './schedule';
import './volunteer.css';
import './results.css';

type Entry = { id: string; name: string; school: string };
type Typed = { name: string; school: string } | null;
type State = 'Draft' | 'In review' | 'Changes requested' | 'Published';
type ResultEvent = {
  id: string; name: string; day: string; event_day: boolean; coordinator: string | null; mine?: boolean; version: number; state: State;
  picks: (string | null)[]; manual?: Typed[]; labels: string[] | null; published?: (string | null)[] | null; published_at?: string | null;
  feedback: string; updated_by?: string | null; updated_at?: string | null; entries: Entry[];
};
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
// What must be fixed before finalizing, in plain words (the server checks again).
function submitProblem(slots: Slot[]) {
  for (const [i, slot] of slots.entries()) if (slot.mode === 'typed' && (slot.name.trim() || slot.school.trim()) && !filled(slot)) return `${awards[i]}: type both the participant name and the college name.`;
  for (let i = 0; i < 3; i++) if (!filled(slots[i])) return `Choose or type a name for ${awards[i]}.`;
  return '';
}
const hasEntries = (event: ResultEvent) => event.picks.some(Boolean) || Boolean(event.manual?.some(Boolean));
const when = (value?: string | null) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value)) : '';

// One plain status for the event list. The website always shows the last approved result.
function statusOf(event: ResultEvent): { text: string; tone: 'live' | 'state' | 'done' | 'plain' } {
  const live = Boolean(event.published);
  if (event.state === 'Published') return { text: 'Approved · on website', tone: 'live' };
  if (event.state === 'In review') return { text: live ? 'Update waiting for approval' : 'Waiting for approval', tone: 'state' };
  if (event.state === 'Changes requested') return { text: 'Changes requested', tone: 'state' };
  if (live) return { text: 'Update in progress', tone: 'state' };
  return hasEntries(event) ? { text: 'Draft saved', tone: 'state' } : { text: 'Not entered yet', tone: 'plain' };
}

function EventSheet({ event, staff, manager, reload, onDirty }: { event: ResultEvent; staff: Desk['staff']; manager: boolean; reload: (message: string) => Promise<void>; onDirty?: (eventId: string, dirty: boolean) => void }) {
  const [slots, setSlots] = useState<Slot[]>(() => initialSlots(event));
  const saved = useRef(JSON.stringify(payload(initialSlots(event))));
  const [coordinator, setCoordinator] = useState(event.coordinator || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Any coordinator can enter or change a result at any time, before or after it is approved.
  const editable = !manager;
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
      await reload(({assign:'Coordinator assignment saved.',approve:'Approved. The result is now on the website.',return:'Sent back to the coordinator for changes.',submit:`${event.name}: sent for admin approval.`,save:`${event.name}: draft saved.`})[action]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save. Refresh and try again.'); }
    finally { setBusy(false); }
  }
  const slotText = (i: number) => {
    const typed = event.manual?.[i];
    const entry = event.entries.find(item => item.id === event.picks[i]);
    return event.labels?.[i] || (typed ? `${typed.name} — ${typed.school}` : '') || (entry ? `${entry.name} — ${entry.school}` : '') || (event.picks[i] ? 'Entry no longer eligible' : i === 3 ? 'None declared' : 'Not declared');
  };
  const step = event.state === 'Published' ? 2 : event.state === 'In review' ? 1 : 0;
  const live = event.published || null;
  const intro = manager ? (event.state === 'In review' ? 'Submitted for your approval. Approving puts it on the website.' : event.state === 'Published' ? 'These awards are on the website.' : 'Waiting for a coordinator to finalize this result.')
    : event.state === 'Published' ? 'Approved and on the website. You can still change it; updates go live after an admin approves them.'
    : event.state === 'In review' ? 'Sent for admin approval. If you change anything it goes back to a draft and needs finalizing again.'
    : event.state === 'Changes requested' ? 'An admin asked for changes. Update the winners, then finalize again.'
    : 'Enter the 1st, 2nd and 3rd place winners, then finalize. An admin approves it and it appears on the website.';
  const form = <>
    <p className={manager ? undefined : 'result-next'}>{intro}</p>
    {event.feedback && <p className="result-feedback"><b>Reviewer feedback</b><br/>{event.feedback}</p>}
    {live && event.state !== 'Published' && <div className="result-live"><b>On the website now (approved{event.published_at ? ` ${when(event.published_at)}` : ''})</b>{awards.map((label, i) => live[i] ? <span key={label}>{i === 3 ? 'Champion' : label}: {live[i]}</span> : null)}</div>}
    {editable && <p className="result-hint">Student registered offline? Choose <b>Not registered online</b> and type their name and college.</p>}
    {awards.map((label, i) => editable ? <fieldset className="result-slotbox" key={label} disabled={busy}>
      <legend>{i === 3 ? 'Champion (optional)' : label}</legend>
      <select aria-label={`${event.name} ${label}: participant`} value={slots[i].mode === 'typed' ? TYPED : slots[i].pick}
        onChange={e => e.target.value === TYPED ? change(i, { mode: 'typed', pick: '' }) : change(i, { mode: 'registered', pick: e.target.value, name: '', school: '' })}>
        <option value="">{i === 3 ? 'No champion declared' : 'Choose a registered participant'}</option>
        {event.entries.map(entry => <option key={entry.id} value={entry.id}>{entry.name} · {entry.school}</option>)}
        <option value={TYPED}>Not registered online — type name and college</option>
      </select>
      {slots[i].mode === 'typed' && <div className="result-typed">
        <input aria-label={`${event.name} ${label}: participant name`} placeholder="Participant name" autoComplete="off" autoCapitalize="words" maxLength={100} value={slots[i].name} onChange={e => change(i, { name: e.target.value })} />
        <input aria-label={`${event.name} ${label}: college or school name`} placeholder="College / school name" autoComplete="off" autoCapitalize="words" maxLength={150} value={slots[i].school} onChange={e => change(i, { school: e.target.value })} />
      </div>}
    </fieldset> : <div className="result-row" key={label}><strong>{i === 3 ? 'Champion' : label}</strong><span>{slotText(i)}</span></div>)}
    {editable && <><div className="result-actions"><button className="result-primary" disabled={busy} onClick={()=>void act('submit')}>Finalize &amp; send for approval</button><button disabled={busy} onClick={()=>void act('save')}>Save draft</button></div>
      {event.updated_at && <p className="result-saved">Last saved by {event.updated_by || 'a coordinator'} · {when(event.updated_at)}</p>}</>}
    {manager && event.state==='In review' && <><label className="result-reason">Reason if sending back for changes<textarea value={reason} disabled={busy} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label><div className="result-actions"><button className="result-primary" disabled={busy} onClick={()=>void act('approve')}>Approve &amp; publish</button><button disabled={busy || !reason.trim()} onClick={()=>void act('return')}>Request changes</button></div></>}
    {error && <p role="alert" className="result-feedback">{error}</p>}
  </>;
  if (!manager) return <section className="vd-card result-panelcard">{form}</section>;
  return <>
    <section className="vd-assignment"><div><p className="vd-label">Event result sheet</p><h2>{event.name}</h2></div><b className="vd-status">{event.state}</b></section>
    <div className="vd-grid"><section className="vd-card"><h2>Award review</h2>{form}</section>
      <div className="vd-side"><section className="vd-card"><h3>Publication status</h3><ol className="result-track">
        {['Declaration','Admin approval','On the website'].map((t,i)=><li key={t} className={i<=step?'reached':''}><strong>{t}</strong><small>{['A coordinator enters the winners.','An admin or super admin approves it.','Approved awards appear on the website.'][i]}</small></li>)}</ol></section>
      <section className="vd-card"><h3>Usual coordinator (optional)</h3><label><span className="sr-only">Usual coordinator</span><select disabled={busy} value={coordinator} onChange={e=>setCoordinator(e.target.value)}><option value="">Unassigned</option>{staff.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={busy || coordinator===(event.coordinator || '')} onClick={()=>void act('assign')}>Save</button><p>Any coordinator can file results for any event. Manage coordinator logins in Staff access.</p></section></div></div>
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
    if (next) setEvent(current => next.events.some(event => event.id === current) ? current : (manager ? ((next.events.find(event => event.state === 'In review')?.id) || next.events[0]?.id || '') : ''));
  },[manager]);
  useEffect(()=>{void load();return()=>{sequence.current++}},[load]);
  // Leaving the page with unsaved winners (on any event) asks first.
  const unsaved=Object.values(dirty).some(Boolean);
  useEffect(()=>{
    if(!unsaved)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[unsaved]);
  const selected=desk?.events.find(e=>e.id===eventId)||(manager?desk?.events[0]:undefined);
  if (manager) return <div className="vd result-desk"><p className="vd-label">CrossFire 2026 &nbsp; / &nbsp; Event day</p><h1>Review event results</h1>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    {selected && desk ? <><label className="result-picker">Event <select value={selected.id} onChange={e=>setEvent(e.target.value)}>{desk.events.map(e=><option key={e.id} value={e.id}>{e.name} · {statusOf(e).text}</option>)}</select></label>
    <EventSheet key={selected.id+'-'+selected.version} event={selected} manager={manager} staff={desk.staff} reload={load}/></> : <p role="status">{desk?'No events yet.':error?'':'Loading result sheets…'}</p>}
    <button className="result-refresh" onClick={()=>void load()}>Refresh desk</button>
  </div>;
  const counts=desk?{approved:desk.events.filter(e=>e.state==='Published'||Boolean(e.published)).length,total:desk.events.length}:null;
  return <div className="vd result-desk coordinator">
    <header className="vd-hello"><div><p className="vd-label">Results desk</p><h1>Event results</h1></div><span className="cs-clock">{dayLabel(now)}</span></header>
    {notice && <p role="status" className="result-notice">{notice}</p>}
    {error && <p role="alert" className="result-error">{error} <button type="button" onClick={()=>void load()}><RefreshCw size={15} aria-hidden="true"/> Try again</button></p>}
    {!desk && !error && <div className="ops-skeleton-inline" role="status"><span className="sr-only">Loading events…</span><div className="sk sk-hero"/><div className="sk sk-card"/></div>}
    {desk && (desk.events.length ? <>
      <p className="result-hint">Tap an event to enter its 1st, 2nd and 3rd place winners. You can do this at any time, even if the event has not started or has ended. After you finalize, an admin approves it and it appears on the website.{counts ? ` ${counts.approved} of ${counts.total} events approved so far.` : ''}</p>
      <div className="result-list">{desk.events.map(event=>{
        const open=event.id===selected?.id;
        const slots=slotsOf(schedule,event.id);
        const status=statusOf(event);
        return <div key={event.id+'-'+event.version} className={'result-item'+(open?' open':'')}>
          <button type="button" className={'result-event'+(open?' on':'')} aria-expanded={open} onClick={()=>setEvent(open?'':event.id)}>
            <span className="result-event-top"><strong>{event.name}{event.mine&&<em className="result-mine">Yours</em>}</strong>
              <span className="result-badges">{dirty[event.id]&&<span className="cs-pill live">Unsaved</span>}<span className={'cs-pill '+(status.tone==='live'?'live':status.tone==='state'?'state':'')}>{status.text}</span><ChevronDown size={18} className="result-chevron" aria-hidden="true"/></span></span>
            {slots.map(slot=><span className="result-slot" key={slot.id}>{slots.length>1&&<span className="result-slotname">{slot.name}</span>}
              <span className="result-event-line"><Clock size={14} aria-hidden="true"/>{timeRange(slot)}<PhasePill event={slot} now={now}/></span>
              <span className="result-event-line where"><MapPin size={14} aria-hidden="true"/><span>{slot.venue||'Venue to be announced'}</span></span></span>)}
          </button>
          <div className="result-panel" hidden={!open}><EventSheet event={event} manager={false} staff={desk.staff} reload={load} onDirty={markDirty}/></div>
        </div>;})}</div>
    </> : <section className="vd-card"><h2>No events yet</h2><p>Events will appear here once they are published.</p></section>)}
    {desk && <Schedule events={schedule} highlight={desk.events.map(event=>event.id)}/>}
    <button className="result-refresh" onClick={()=>void load()}><RefreshCw size={15} aria-hidden="true"/> Refresh desk</button>
  </div>;
}

type Published = { event_name: string; awards: (string | null)[] };
export function PublishedAwards() {
  const [rows,setRows]=useState<Published[]>([]);const [error,setError]=useState(false);
  useEffect(()=>{let active=true,sequence=0;const load=async()=>{const id=++sequence;const {data,error}=await supabase.rpc('published_event_awards');if(active&&sequence===id){setError(!!error);if(!error)setRows(data||[])}};
    void load();const tick=()=>{if(!document.hidden)void load()};const timer=window.setInterval(tick,15000);window.addEventListener('focus',tick);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',tick)}},[]);
  return <section className="vd result-public"><p className="vd-label">Approved results</p><h2>Event awards</h2>
    {error && <p role="alert">Event awards could not be refreshed.</p>}{!error && !rows.length && <p>Awaiting approved event awards.</p>}
    {rows.map(row=><article className="vd-card" key={row.event_name}><h3>{row.event_name}</h3>{awards.map((award,i)=>row.awards[i]?<div className="result-row" key={award}><strong>{award}</strong><span>{row.awards[i]}</span></div>:null)}</article>)}</section>;
}
