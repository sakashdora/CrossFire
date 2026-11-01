import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { EventItem } from '../types';
import { validateTeam, type CompetitionChoice } from '../lib/competitionChoices';

interface AddCompetitionDialogProps {
  choices: CompetitionChoice[];
  onAdd: (event: EventItem, teamName: string, members: { name: string }[]) => Promise<string | null>;
  onClose: () => void;
}

// Adds one competition to a registered student's account. The server applies
// the registration window, deadlines and group limits again.
export function AddCompetitionDialog({ choices, onAdd, onClose }: AddCompetitionDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const available = choices.filter(choice => !choice.reason);
  const [eventId, setEventId] = useState(available[0]?.event.id || '');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = available.find(choice => choice.event.id === eventId)?.event;
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => { setMembers(Array.from({ length: selected?.event_type === 'team' ? selected.team_size - 1 : 0 }, () => '')); setTeamName(''); setError(''); }, [selected?.id]);
  const close = () => { if (!busy) onClose(); };
  // The ref blocks a repeat submit before the disabled state renders.
  const pending = useRef(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current || !selected) return;
    const problem = validateTeam(selected, teamName, members);
    if (problem) { setError(problem); return; }
    pending.current = true; setBusy(true); setError('');
    try {
      const failure = await onAdd(selected, teamName.trim(), members.map(name => ({ name: name.trim() })));
      if (failure) setError(failure); else onClose();
    } catch {
      setError('The change could not be verified. Refresh your registrations before retrying.');
    } finally { pending.current = false; setBusy(false); }
  };
  const field = 'mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-navy focus:ring-2 focus:ring-orange-400';
  return <dialog ref={dialog} aria-labelledby="add-competition-title" onCancel={event => { event.preventDefault(); close(); }} className="p-0 w-[calc(100%_-_32px)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white text-navy backdrop:bg-slate-950/70">
    <header className="flex items-start justify-between gap-3 p-5 border-b border-gray-200">
      <div><h2 id="add-competition-title" className="text-lg font-black">Add a competition</h2><p className="text-xs text-gray-500 mt-1">Up to 2 events from each group. Your QR pass stays the same.</p></div>
      <button type="button" onClick={close} disabled={busy} aria-label="Close add competition" className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
    </header>
    <form onSubmit={submit} className="p-5 space-y-4">
      <fieldset className="space-y-2" disabled={busy}>
        <legend className="text-sm font-bold mb-1">Competition</legend>
        {choices.map(({ event, reason }) => <label key={event.id} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${reason ? 'border-gray-200 bg-gray-50 text-gray-500' : eventId === event.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 cursor-pointer'}`}>
          <input type="radio" name="competition" value={event.id} checked={eventId === event.id} disabled={Boolean(reason)} onChange={() => setEventId(event.id)} className="mt-1 accent-orange-500" />
          <span className="min-w-0"><strong className="block">{event.name}</strong><small className="block text-xs">{event.group} · {event.event_type === 'team' ? `Team of ${event.team_size}` : 'Solo'}{reason ? ` · ${reason}` : ''}</small></span>
        </label>)}
      </fieldset>
      {selected?.event_type === 'team' && <fieldset className="space-y-3" disabled={busy}>
        <legend className="text-sm font-bold">Team details</legend>
        <label className="block text-sm font-semibold">Team name<input className={field} required maxLength={100} value={teamName} onChange={event => setTeamName(event.target.value)} /></label>
        {members.map((member, index) => <label key={index} className="block text-sm font-semibold">Teammate {index + 1} name<input className={field} required minLength={2} maxLength={100} value={member} onChange={event => setMembers(previous => previous.map((value, position) => position === index ? event.target.value : value))} /></label>)}
      </fieldset>}
      {!available.length && <p role="status" className="text-sm text-gray-600">No competitions can be added right now.</p>}
      {error && <p role="alert" className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
      <footer className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={close} disabled={busy} className="px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-300">Cancel</button>
        <button disabled={busy || !selected} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">{busy ? 'Adding…' : 'Add competition'}</button>
      </footer>
    </form>
  </dialog>;
}
