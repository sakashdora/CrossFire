import { useState } from 'react';
import { ArrowRight, QrCode, Scan } from 'lucide-react';
import { STATIONS, formatTime, type OpsEvent, type OpsVolunteer } from './model';
import './volunteer.css';

type Props = {
  duty?: OpsVolunteer;
  events: OpsEvent[];
  busy: boolean;
  lookupBusy: boolean;
  scan: () => void;
  lookup: (code: string) => void;
  changeDuty: () => void;
  report: () => void;
  openDesk: (section: 'students' | 'guests' | 'incidents') => void;
  refresh: () => void;
};

const stationTasks = {
  gate: ['Check in a student', 'Scan the student’s pass, then review their details before check-in.'],
  food: ['Issue a student meal', 'Scan the student’s pass to check their meal preference and redemption status.'],
  event: ['Record room attendance', 'Scan a student’s pass or open the room list to record attendance.'],
  guest: ['Welcome a guest', 'Scan a guest pass or open your assigned guests to record an arrival.'],
  support: ['Station support', 'Report an issue at your station or follow up on a previous report.'],
};

export function VolunteerDesk({ duty, events, busy, lookupBusy, scan, lookup, changeDuty, report, openDesk, refresh }: Props) {
  const [manual, setManual] = useState(false);
  const onDuty = duty?.attendance_status === 'Present / On Duty';
  const usesPass = duty && duty.station !== 'support';
  const [title, instructions] = duty ? stationTasks[duty.station] : ['Awaiting duty assignment', 'Ask an admin to assign your station and shift.'];
  const shift = duty?.shift.replace(/ Shift \(/, ' shift · ').replace(/ \(/, ' · ').replace(/\)$/, '').replace(/\b0(?=\d:)/g, '').replace(' - ', ' – ');
  const assignedEvent = events.find(event => event.id === duty?.event_id);
  return <div className="vd">
    <p className="vd-label">Event operations &nbsp; / &nbsp; Volunteer</p>
    <h1>My duty desk</h1>
    <section className="vd-assignment">
      <div><p className="vd-label">Assigned station</p><h2>{duty ? STATIONS[duty.station] : 'Awaiting assignment'}</h2><p>{shift || 'Shift details will appear here.'}{assignedEvent && <> · {assignedEvent.name}</>}</p></div>
      <span className={'vd-status' + (onDuty ? ' active' : '')}>{onDuty ? 'On duty' : duty?.attendance_status || 'Unassigned'}</span>
    </section>
    <div className="vd-grid">
      <section className="vd-card">
        <div className="vd-heading"><span>01</span><h2>{title}</h2></div>
        <p>{usesPass && !onDuty ? 'Go on duty to use your station’s pass lookup.' : instructions}</p>
        {usesPass && <>
          <div className="vd-viewfinder" aria-hidden="true"><Scan /><QrCode /></div>
          <button className="vd-primary" disabled={!onDuty || busy || lookupBusy} onClick={scan}>{lookupBusy ? 'Looking up pass…' : duty.station === 'guest' ? 'Scan guest pass' : 'Scan student pass'}</button>
          <button className="vd-manual" disabled={!onDuty || busy || lookupBusy} aria-expanded={manual && onDuty} onClick={() => setManual(!manual)}>Enter pass ID</button>
          {manual && onDuty && <form className="vd-lookup" onSubmit={event => { event.preventDefault(); lookup(String(new FormData(event.currentTarget).get('pass'))); }}>
            <label>Pass ID<input autoFocus required name="pass" autoComplete="off" placeholder={duty.station === 'guest' ? 'CFG-…' : 'CF26-…'} /></label>
            <button disabled={busy || lookupBusy}>Find pass</button>
          </form>}
          {(duty.station === 'event' || duty.station === 'guest') && <button className="vd-secondary" disabled={!onDuty} onClick={() => openDesk(duty.station === 'guest' ? 'guests' : 'students')}>{duty.station === 'guest' ? 'View assigned guests' : 'View room participants'}</button>}
        </>}
        {duty?.station === 'support' && <button className="vd-secondary" onClick={() => openDesk('incidents')}>View incidents</button>}
      </section>
      <div className="vd-side">
        <section className="vd-card">
          <div className="vd-heading"><span>02</span><h2>Shift details</h2></div>
          <dl><div><dt>Walkie channel</dt><dd>{duty?.walkie_channel || 'Not assigned'}</dd></div>
          <div><dt>Volunteer kit</dt><dd>{duty?.kit_issued ? 'Issued' : 'Not issued'}</dd></div></dl>
          {duty?.notes && <p className="vd-notes">{duty.notes}</p>}
          {duty && <button className="vd-wide" disabled={busy || lookupBusy} onClick={changeDuty}>{onDuty ? 'Start break' : 'Go on duty'}</button>}
        </section>
        <section className="vd-card"><h3>{duty?.station === 'gate' ? 'Need help at the gate?' : 'Need help at your station?'}</h3>
          <button className="vd-report" onClick={report}>Report an incident <ArrowRight size={16} /></button>
        </section>
      </div>
    </div>
    <div className="vd-tools"><details><summary>Event schedule</summary>{events.length ? events.map(event => <div className="vd-event" key={event.id}><strong>{event.name}</strong><span>{event.venue} · {formatTime(event.start_time)} · {event.status.split('_').join(' ')}</span></div>) : <p>No events scheduled.</p>}</details>
    <button onClick={() => openDesk('incidents')}>View incidents</button><button disabled={busy || lookupBusy} onClick={refresh}>Refresh desk</button></div>
  </div>;
}
