import { ArrowRight, Clock, MapPin, QrCode, RefreshCw } from 'lucide-react';
import { STATIONS, type OpsEvent, type OpsVolunteer } from './model';
import { Schedule, sessionLabel, clock, useScheduleEvents, type ScheduleEvent } from './schedule';
import './volunteer.css';

type Props = {
  name: string;
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
  gate: ['Check in students', 'Scan the student’s QR pass, check the details, then tap Check in.'],
  food: ['Give out meals', 'Scan the pass to see the meal type, then tap Issue meal. One meal per student.'],
  event: ['Mark students present', 'Scan the pass to confirm the student is in your event room.'],
  guest: ['Welcome guests', 'Scan the guest’s pass to see their details and record their arrival.'],
  support: ['Support desk', 'Help wherever you are needed. Report any problem so an admin can act.'],
};

export function VolunteerDesk({ name, duty, events, busy, lookupBusy, scan, lookup, changeDuty, report, openDesk, refresh }: Props) {
  const onDuty = duty?.attendance_status === 'Present / On Duty';
  const usesPass = Boolean(duty && duty.station !== 'support');
  const [title, instructions] = duty ? stationTasks[duty.station] : ['Waiting for your station', 'An admin will assign your station and shift. You can already see today’s schedule below.'];
  const shift = duty?.shift.replace(/ Shift \(/, ' shift · ').replace(/ \(/, ' · ').replace(/\)$/, '').replace(/\b0(?=\d:)/g, '').replace(' - ', ' – ');
  const schedule = useScheduleEvents(events as ScheduleEvent[]);
  const assigned = schedule.find(event => event.id === duty?.event_id);
  const first = name.trim().split(/\s+/)[0] || 'there';
  const scanLabel = duty?.station === 'guest' ? 'Scan guest pass' : 'Scan student pass';
  return <div className="vd vd2">
    <header className="vd-hello">
      <div><p className="vd-label">Volunteer desk</p><h1>Hi, {first}</h1></div>
      <span className={'vd-status' + (onDuty ? ' active' : '')}>{onDuty ? 'On duty' : duty?.attendance_status || 'Unassigned'}</span>
    </header>

    <section className="vd-assignment">
      <div>
        <p className="vd-label">Your station</p>
        <h2>{duty ? STATIONS[duty.station] : 'Awaiting assignment'}</h2>
        <p className="vd-meta"><Clock size={15} aria-hidden="true" />{shift || 'Shift details will appear here'}</p>
        {assigned && <p className="vd-meta"><MapPin size={15} aria-hidden="true" />{assigned.name} · {assigned.venue || 'Venue to be announced'} · {sessionLabel(assigned)?.toLowerCase() ?? `starts ${clock(assigned.start_time)}`}</p>}
      </div>
      {duty && <button className={'vd-toggle' + (onDuty ? '' : ' go')} disabled={busy || lookupBusy} onClick={changeDuty}>{onDuty ? 'Take a break' : 'Go on duty'}</button>}
    </section>

    <div className="vd-grid">
      <div className="vd-main">
        <section className="vd-card vd-scan">
          <div className="vd-heading"><span>1</span><h2>{title}</h2></div>
          <p>{instructions}</p>
          {usesPass && <>
            <button className="vd-primary vd-scanbtn" disabled={!onDuty || busy || lookupBusy} onClick={scan}><QrCode size={26} aria-hidden="true" />{lookupBusy ? 'Looking up pass…' : scanLabel}</button>
            {!onDuty && <p className="vd-lock" role="status">You are not on duty yet. Tap <b>Go on duty</b> above to start scanning.</p>}
            <form className="vd-lookup" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const value = String(new FormData(form).get('pass') || '').trim(); if (value) lookup(value); }}>
              <label>No camera? Type the pass ID<input name="pass" required autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={!onDuty} placeholder={duty?.station === 'guest' ? 'CFG-…' : 'CF26-…'} /></label>
              <button disabled={!onDuty || busy || lookupBusy}>Find pass</button>
            </form>
            {(duty?.station === 'event' || duty?.station === 'guest') && <button className="vd-secondary" disabled={!onDuty} onClick={() => openDesk(duty.station === 'guest' ? 'guests' : 'students')}>{duty.station === 'guest' ? 'View my assigned guests' : 'View students in my room'}</button>}
          </>}
          {duty && !usesPass && <button className="vd-secondary" onClick={() => openDesk('incidents')}>View my reports</button>}
        </section>

        <Schedule events={schedule} highlight={duty?.event_id ? [duty.event_id] : []} />
      </div>

      <aside className="vd-side">
        <section className="vd-card">
          <div className="vd-heading"><span>2</span><h2>My shift</h2></div>
          <dl><div><dt>Walkie channel</dt><dd>{duty?.walkie_channel || 'Not assigned'}</dd></div>
          <div><dt>Volunteer kit</dt><dd>{duty?.kit_issued ? 'Issued' : 'Not issued'}</dd></div></dl>
          {duty?.notes && <p className="vd-notes">{duty.notes}</p>}
        </section>
        <section className="vd-card">
          <h3>Something wrong?</h3>
          <p>Tell an admin right away. It takes a few seconds.</p>
          <button className="vd-report" onClick={report}>Report a problem <ArrowRight size={16} aria-hidden="true" /></button>
          <button className="vd-secondary" onClick={() => openDesk('incidents')}>View my reports</button>
        </section>
        <button className="vd-refresh" disabled={busy || lookupBusy} onClick={refresh}><RefreshCw size={16} aria-hidden="true" /> Refresh desk</button>
      </aside>
    </div>
  </div>;
}
