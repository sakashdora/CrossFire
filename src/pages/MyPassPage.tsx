import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Clock, MapPin, QrCode, ShieldCheck } from 'lucide-react';
import { StudentQRCode } from '../components/StudentQRCode';
import { findMyPass, type ParticipantPass } from '../lib/participantPass';
import { PhasePill, slotsOf, timeRange, useNow, useScheduleEvents } from '../operations/schedule';
import '../operations/volunteer.css';

const when = (value: string | null) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value)) : '';

// For participants who did not keep their student ID or QR: get the pass back with the
// mail ID and mobile number used at registration. Nothing is saved on this device.
export function MyPassPage({ onHome }: { onHome: () => void }) {
  const schedule = useScheduleEvents();
  const now = useNow();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState<ParticipantPass | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { setPass(await findMyPass(email, phone)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not look up your pass. Please try again.'); }
    finally { setBusy(false); }
  };
  const clear = () => { setPass(null); setEmail(''); setPhone(''); setError(''); window.scrollTo({ top: 0 }); };
  const field = 'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200';

  if (!pass) return <section className="max-w-lg mx-auto my-6 sm:my-10 px-4 text-slate-900" aria-labelledby="my-pass-title">
    <button onClick={onHome} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-navy"><ArrowLeft size={16} aria-hidden="true" /> Back to home</button>
    <div className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm">
      <QrCode className="text-orange-500 mb-3" size={32} aria-hidden="true" />
      <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Participants</p>
      <h1 id="my-pass-title" className="text-2xl sm:text-3xl font-black mt-1 text-navy">Find my pass</h1>
      <p className="text-sm text-slate-600 mt-3">Forgot your student ID or QR? Enter the mail ID and mobile number you registered with to see your QR pass and your details.</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
        <label className="block text-sm font-semibold">Mail ID (email)
          <input className={field} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" disabled={busy} /></label>
        <label className="block text-sm font-semibold">Mobile number
          <input className={field} type="tel" inputMode="numeric" autoComplete="tel" required minLength={10} maxLength={16} pattern="[0-9+ ()\-]{10,16}" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" disabled={busy} /></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-orange-500 py-3.5 text-base font-bold text-white shadow hover:bg-orange-600 disabled:opacity-60">{busy ? 'Finding your pass…' : 'Show my pass'}</button>
      </form>
      <p className="mt-5 flex items-start gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> Your details are shown only on this screen and are not saved on this device. Use the same mail ID and mobile number as your registration (your WhatsApp number works too).</p>
      <p className="mt-3 text-xs text-slate-500">Still stuck? Ask at the help desk and a volunteer will find you by name.</p>
    </div>
  </section>;

  const first = pass.name.trim().split(/\s+/)[0];
  const rows: [string, string][] = [['Name', pass.name], ['Mail ID', pass.email], ['Mobile', pass.contact_number], ['WhatsApp', pass.whatsapp_number], ['School / college', pass.institute_name],
    ['City / town', pass.city_town], ['Stream', pass.course_stream], ['Board', pass.board], ['Meal preference', pass.food_preference], ['Student ID', pass.student_id], ['Registration reference', pass.reference_code], ['Registered on', when(pass.registered_at)]];
  return <section className="max-w-xl mx-auto my-6 sm:my-10 px-4 text-slate-900 space-y-4" aria-label="Your CrossFire pass">
    <div className="rounded-2xl bg-navy p-6 text-white">
      <p className="text-xs font-bold uppercase tracking-widest text-orange-300">CrossFire 2026 · Participant pass</p>
      <h1 className="text-2xl sm:text-3xl font-black mt-1 text-white">Hi, {first}!</h1>
      <p className="text-sm text-slate-200 mt-1">{pass.institute_name}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
        <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1 ' + (pass.checked_in_at ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{pass.checked_in_at && <Check size={14} aria-hidden="true" />}{pass.checked_in_at ? `Arrived · ${when(pass.checked_in_at)}` : 'Not arrived yet'}</span>
        <span className="rounded-full bg-white/10 px-3 py-1">{pass.food_preference || 'Meal'} meal{pass.food_redeemed_at ? ` · issued ${when(pass.food_redeemed_at)}` : ''}</span>
      </div>
    </div>

    <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-black text-navy">Your QR pass</h2>
      <p className="text-sm text-slate-600 mt-1">Show this at the registration gate. Download it so you have it even without internet.</p>
      <div className="mt-4 flex justify-center"><StudentQRCode studentId={pass.pass_id} name={pass.name} size={230} downloadable /></div>
      <p className="mt-3 break-all text-xs text-slate-500">Pass ID {pass.pass_id}</p>
    </div>

    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-navy">Your events</h2>
      {pass.events.length ? <ul className="mt-2 divide-y">{pass.events.map(entry => {
        const slots = slotsOf(schedule, entry.event_id);
        return <li key={entry.event_id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-base">{entry.name}</strong>
            {entry.reported_at ? <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Participated · {when(entry.reported_at)}</span> : null}</div>
          {slots.map(slot => <div key={slot.id} className="mt-1.5">
            {slots.length > 1 && <p className="text-sm font-semibold text-slate-800">{slot.name}</p>}
            <p className="flex items-start gap-1.5 text-sm text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-orange-600" aria-hidden="true" />{slot.venue || 'Venue to be announced'}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-600"><Clock size={15} className="shrink-0 text-orange-600" aria-hidden="true" />{timeRange(slot)}<PhasePill event={slot} now={now} /></p>
          </div>)}
        </li>;
      })}</ul> : <p className="mt-2 text-sm text-slate-600">No events found on your registration.</p>}
    </div>

    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-navy">Your registration details</h2>
      <dl className="mt-2 divide-y text-sm">{rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4"><dt className="text-slate-500">{label}</dt><dd className="font-semibold break-words sm:text-right">{value}</dd></div>)}</dl>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <button onClick={clear} className="flex-1 rounded-xl border border-slate-300 bg-white py-3 font-bold text-slate-800">Not you? Look up another pass</button>
      <button onClick={onHome} className="flex-1 rounded-xl bg-navy py-3 font-bold text-white">Back to home</button>
    </div>
  </section>;
}
