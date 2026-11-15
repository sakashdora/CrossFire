import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PhasePill, Schedule, clock, dayLabel, useNow, useScheduleEvents } from './schedule';
import './volunteer.css';
import './results.css';

type Entry = { id: string; name: string; school: string };
type ResultEvent = { id: string; name: string; day: string; event_day: boolean; coordinator: string | null; version: number; state: 'Draft' | 'In review' | 'Changes requested' | 'Published'; picks: (string | null)[]; labels: string[] | null; feedback: string; entries: Entry[] };
type Desk = { events: ResultEvent[]; staff: { id: string; name: string }[] };
const awards = ['1st place', '2nd place', '3rd place', 'Champion'];
type Action = 'assign' | 'approve' | 'return' | 'submit' | 'save';

function EventSheet({ event, staff, manager, reload }: { event: ResultEvent; staff: Desk['staff']; manager: boolean; reload: (message: string) => Promise<void> }) {
  const [picks, setPicks] = useState(event.picks);
  const [coordinator, setCoordinator] = useState(event.coordinator || '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editable = !manager && (event.state === 'Draft' || event.state === 'Changes requested');
  async function act(action: Action) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { error: failure } = await supabase.rpc('result_action', { p_event: event.id, p_version: event.version, p_action: action, p_coordinator: coordinator || null, p_picks: picks, p_feedback: reason });
      if (failure) throw new Error(failure.message);
      await reload(({assign:'Coordinator assignment saved.',approve:'Awards published to the leaderboard.',return:'Declaration returned for changes.',submit:'Declaration submitted for review.',save:'Draft saved.'})[action]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save. Refresh and try again.'); }
    finally { setBusy(false); }
  }
  const step = event.state === 'Published' ? 2 : event.state === 'In review' ? 1 : 0;
  return <>
    {manager && <section className="vd-assignment"><div><p className="vd-label">Event result sheet</p><h2>{event.name}</h2></div><b className="vd-status">{event.state}</b></section>}
    <div className="vd-grid"><section className="vd-card"><h2>{manager ? 'Award review' : 'Event declaration'}</h2>
      <p className={manager ? undefined : 'result-next'}>{manager ? (editable ? 'Select registered entries for each award.' : event.state === 'Published' ? 'These awards appear on the public leaderboard.' : event.state === 'In review' ? 'Submitted for administrator review.' : 'Waiting for the coordinator to submit.')
        : event.state === 'Published' ? 'Done. These awards are on the public leaderboard.'
        : event.state === 'In review' ? 'Submitted. An admin will review your result next.'
        : event.state === 'Changes requested' ? 'An admin asked for changes. Update the winners, then submit again.'
        : event.event_day ? 'Choose the winners, then tap Submit for review.'
        : `You can pick winners now and save a draft. Submitting opens on event day (${event.day}).`}</p>
      {event.feedback && <p className="result-feedback"><b>Reviewer feedback</b><br/>{event.feedback}</p>}
      {awards.map((label,i)=><div className="result-row" key={label}><label htmlFor={'award-'+i}>{label}</label>{editable ?
        <select id={'award-'+i} disabled={busy} value={picks[i] || ''} onChange={e=>setPicks(picks.map((v,k)=>k===i ? e.target.value || null : v))}>
          <option value="">Choose an entry</option>{event.entries.map(entry=><option key={entry.id} value={entry.id}>{entry.name} · {entry.school}</option>)}
        </select> : <span>{event.labels?.[i] || event.entries.find(entry=>entry.id===picks[i])?.name || (picks[i] ? 'Entry no longer eligible' : 'Unselected')}</span>}</div>)}
      {editable && <><div className="result-actions"><button className="result-primary" disabled={busy || (!event.event_day && event.state==='Draft')} onClick={()=>void act('submit')}>Submit for review</button><button disabled={busy} onClick={()=>void act('save')}>Save draft</button></div>{!event.event_day && event.state==='Draft' && <p>Submission opens on the event day ({event.day}, India time).</p>}</>}
      {manager && event.state==='In review' && <><label className="result-reason">Reason if returning for changes<textarea value={reason} disabled={busy} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label><div className="result-actions"><button className="result-primary" disabled={busy} onClick={()=>void act('approve')}>Approve &amp; publish</button><button disabled={busy || !reason.trim()} onClick={()=>void act('return')}>Request changes</button></div></>}
      {error && <p role="alert" className="result-feedback">{error}</p>}
    </section><div className="vd-side"><section className="vd-card"><h3>Publication status</h3><ol className="result-track">
    {['Declaration','Admin review','Public leaderboard'].map((t,i)=><li key={t} className={i<=step?'reached':''}><strong>{t}</strong><small>{['Coordinator selects event finishers.','An admin or super admin checks the result.','Approved awards appear under the event.'][i]}</small></li>)}</ol></section>
    {manager && <section className="vd-card"><h3>Assigned coordinator</h3><label><span className="sr-only">Assigned coordinator</span><select disabled={busy} value={coordinator} onChange={e=>setCoordinator(e.target.value)}><option value="">Unassigned</option>{staff.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={busy || coordinator===(event.coordinator || '')} onClick={()=>void act('assign')}>Save assignment</button><p>Manage coordinator logins in Staff access.</p></section>}</div></div>
  </>;
}
export function ResultsDesk({ manager=false, initialEventId='' }: { manager?: boolean; initialEventId?: string }) {
  const [desk,setDesk]=useState<Desk|null>(null);
  const [eventId,setEvent]=useState(initialEventId);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const schedule=useScheduleEvents();
  const now=useNow();

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
  const selected=desk?.events.find(e=>e.id===eventId)||desk?.events[0];
  if (manager) return <div className="vd result-desk"><p className="vd-label">CrossFire 2026 &nbsp; / &nbsp; Event day</p><h1>Review event results</h1>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    {selected && desk ? <><label className="result-picker">Event <select value={selected.id} onChange={e=>setEvent(e.target.value)}>{desk.events.map(e=><option key={e.id} value={e.id}>{e.name} · {e.state}</option>)}</select></label>
    <EventSheet key={selected.id+'-'+selected.version} event={selected} manager={manager} staff={desk.staff} reload={load}/></> : <p role="status">{desk?'No events assigned. Contact an administrator.':error?'':'Loading result sheets…'}</p>}
    <button className="result-refresh" onClick={()=>void load()}>Refresh desk</button>
  </div>;
  const infoFor=(id:string)=>schedule.find(item=>item.id===id);
  return <div className="vd result-desk coordinator">
    <header className="vd-hello"><div><p className="vd-label">Results desk</p><h1>My events</h1></div><span className="cs-clock">{dayLabel(now)}</span></header>
    {notice && <p role="status" className="result-notice">{notice}</p>}
    {error && <p role="alert" className="result-error">{error} <button type="button" onClick={()=>void load()}><RefreshCw size={15} aria-hidden="true"/> Try again</button></p>}
    {!desk && !error && <div className="ops-skeleton-inline" role="status"><span className="sr-only">Loading your events…</span><div className="sk sk-hero"/><div className="sk sk-card"/></div>}
    {desk && (selected ? <>
      <div className="result-events" role="group" aria-label="My assigned events">{desk.events.map(event=>{
        const info=infoFor(event.id);
        return <button type="button" key={event.id} className={'result-event'+(event.id===selected.id?' on':'')} aria-pressed={event.id===selected.id} onClick={()=>setEvent(event.id)}>
          <span className="result-event-top"><strong>{event.name}</strong><span className="cs-pill state">{event.state}</span></span>
          {info && <><span className="result-event-line"><Clock size={14} aria-hidden="true"/>{clock(info.start_time)}{info.end_time?` to ${clock(info.end_time)}`:''}<PhasePill event={info} now={now}/></span>
          <span className="result-event-line"><MapPin size={14} aria-hidden="true"/>{info.venue||'Venue to be announced'}</span></>}
        </button>;})}</div>
      <EventSheet key={selected.id+'-'+selected.version} event={selected} manager={false} staff={desk.staff} reload={load}/>
    </> : <section className="vd-card"><h2>No event assigned yet</h2><p>An admin will assign your event soon. Today’s full schedule is below.</p></section>)}
    {desk && <Schedule events={schedule} highlight={desk.events.map(event=>event.id)}/>}
    <button className="result-refresh" onClick={()=>void load()}><RefreshCw size={15} aria-hidden="true"/> Refresh desk</button>
  </div>;
}

type Published = { event_name: string; awards: string[] };
export function PublishedAwards() {
  const [rows,setRows]=useState<Published[]>([]);const [error,setError]=useState(false);
  useEffect(()=>{let active=true,sequence=0;const load=async()=>{const id=++sequence;const {data,error}=await supabase.rpc('published_event_awards');if(active&&sequence===id){setError(!!error);if(!error)setRows(data||[])}};
    void load();const tick=()=>{if(!document.hidden)void load()};const timer=window.setInterval(tick,15000);window.addEventListener('focus',tick);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',tick)}},[]);
  return <section className="vd result-public"><p className="vd-label">Approved declarations</p><h2>Event awards</h2>
    {error && <p role="alert">Event awards could not be refreshed.</p>}{!error && !rows.length && <p>Awaiting approved event awards.</p>}
    {rows.map(row=><article className="vd-card" key={row.event_name}><h3>{row.event_name}</h3>{awards.map((award,i)=><div className="result-row" key={award}><strong>{award}</strong><span>{row.awards[i]}</span></div>)}</article>)}</section>;
}
