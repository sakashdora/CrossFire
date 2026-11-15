import { Check, Clock, MapPin, QrCode, TriangleAlert, Utensils, X } from 'lucide-react';
import { formatTime, type OpsEvent, type OpsStudent } from './model';
import { PhasePill, clock, eventPhase, slotsOf, timeRange, useNow, useScheduleEvents, type ScheduleEvent } from './schedule';
import './volunteer.css';

type Props = {
  student: OpsStudent;
  events: OpsEvent[];
  busy: boolean;
  justArrived: boolean;
  canGate: boolean;
  canFood: boolean;
  canRoom: (eventId: string) => boolean;
  checkIn: () => void;
  issueMeal: () => void;
  markPresent: (registrationId: string, eventName: string) => void;
  scanNext: () => void;
  clear: () => void;
};

// What a volunteer sees after scanning a student's pass: who they are, what this
// desk should do next, and where to send them.
export function PassResult({ student, events, busy, justArrived, canGate, canFood, canRoom, checkIn, issueMeal, markPresent, scanNext, clear }: Props) {
  const schedule = useScheduleEvents(events as ScheduleEvent[]);
  const now = useNow();
  const first = student.name.trim().split(/\s+/)[0] || 'the student';
  const arrived = Boolean(student.checked_in_at);
  const live = student.active;
  // An event can have more than one slot (Quiz: written round and final), each with its own room and time.
  const entries = student.registrations.map(reg => ({ reg, slots: slotsOf(schedule, reg.event_id) }))
    .sort((a, b) => Date.parse(a.slots[0]?.start_time || '') - Date.parse(b.slots[0]?.start_time || ''));
  const pending = (slots: ScheduleEvent[]) => slots.find(slot => eventPhase(slot, now).phase !== 'done');
  const next = entries.find(({ reg, slots }) => reg.status !== 'disqualified' && !reg.room_reported_at && (slots.length === 0 || pending(slots)));
  const nextSlot = next ? pending(next.slots) ?? next.slots[0] : undefined;
  return <section className="pr" aria-label={`Pass details for ${student.name}`}>
    <header className={'pr-state ' + (!live ? 'bad' : arrived ? 'ok' : 'wait')} role="status">
      {!live ? <TriangleAlert size={22} aria-hidden="true" /> : arrived ? <Check size={22} aria-hidden="true" /> : <QrCode size={22} aria-hidden="true" />}
      <div><strong>{!live ? 'Pass suspended' : arrived ? (justArrived ? 'Marked as arrived' : 'Arrived') : 'Not arrived yet'}</strong>
        <span>{!live ? 'Send the student to the help desk.' : arrived ? `Gate check-in at ${formatTime(student.checked_in_at)}` : 'Verify the pass, then mark them arrived.'}</span></div>
    </header>

    <div className="pr-who">
      <h2>{student.name}</h2>
      <p>{student.institute || 'School not listed'}</p>
      <ul className="pr-chips">
        <li><code>{student.pass_id}</code></li>
        <li className={student.food_preference === 'Non-veg' ? 'nonveg' : 'veg'}><Utensils size={13} aria-hidden="true" /> {student.food_preference || 'Meal not set'}{student.food_redeemed_at ? ` · issued ${clock(student.food_redeemed_at)}` : ''}</li>
      </ul>
    </div>

    {live && <div className="pr-do">
      {canGate && !arrived && <button className="pr-big" disabled={busy} onClick={checkIn}><Check size={22} aria-hidden="true" /> Mark arrived</button>}
      {canFood && !arrived && <p className="pr-warn"><TriangleAlert size={16} aria-hidden="true" /> {first} has not arrived. Send them to the registration gate first.</p>}
      {canFood && arrived && !student.food_redeemed_at && <button className="pr-big" disabled={busy} onClick={issueMeal}><Utensils size={22} aria-hidden="true" /> Issue {student.food_preference || ''} meal</button>}
      {canFood && arrived && student.food_redeemed_at && <p className="pr-note">Meal already issued at {formatTime(student.food_redeemed_at)}. One meal per student.</p>}
    </div>}

    {live && arrived && next && <div className="pr-next">
      <p className="pr-label">{justArrived ? `Welcome ${first}! Guide them to` : 'Next for this student'}</p>
      <strong>{next.reg.name}{nextSlot && nextSlot.name !== next.reg.name ? ` · ${nextSlot.name}` : ''}</strong>
      <span className="where"><MapPin size={16} aria-hidden="true" /><span>{nextSlot?.venue || 'Venue to be announced'}</span></span>
      {nextSlot && <span><Clock size={16} aria-hidden="true" />{timeRange(nextSlot)}<PhasePill event={nextSlot} now={now} /></span>}
    </div>}

    <div className="pr-events">
      <p className="pr-label">Registered events</p>
      {entries.length ? <ul>{entries.map(({ reg, slots }) => <li key={reg.id}>
        <div className="pr-event-head"><strong>{reg.name}</strong>
          {reg.status === 'disqualified' ? <span className="pr-tag bad">Disqualified</span> : reg.room_reported_at ? <span className="pr-tag ok">Participated · {clock(reg.room_reported_at)}</span> : <span className="pr-tag">Not yet participated</span>}</div>
        {slots.map(slot => <div className="pr-slot" key={slot.id}>
          {slots.length > 1 && <span className="pr-slotname">{slot.name}</span>}
          <span className="pr-line where"><MapPin size={14} aria-hidden="true" /><span>{slot.venue || 'Venue to be announced'}</span></span>
          <span className="pr-line"><Clock size={14} aria-hidden="true" />{timeRange(slot)}<PhasePill event={slot} now={now} /></span>
        </div>)}
        {live && arrived && !reg.room_reported_at && reg.status !== 'disqualified' && canRoom(reg.event_id) && <button className="pr-act" disabled={busy} onClick={() => markPresent(reg.id, reg.name)}><Check size={16} aria-hidden="true" /> Mark participated</button>}
      </li>)}</ul> : <p className="pr-note">No event registrations on this pass.</p>}
    </div>

    <footer className="pr-foot">
      <button className="pr-scan" onClick={scanNext}><QrCode size={20} aria-hidden="true" /> Scan next pass</button>
      <button className="pr-clear" onClick={clear}><X size={16} aria-hidden="true" /> Done</button>
    </footer>
  </section>;
}
