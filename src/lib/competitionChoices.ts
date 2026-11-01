import type { EventItem, Registration } from '../types';

// Mirrors the server rules in registrations_before_insert: registration must be
// open, the event open and before its deadline, and at most 2 entries per group.
// The server re-checks every rule; this only explains unavailable choices.
export const MAX_PER_GROUP = 2;
export const MAX_COMPETITIONS = MAX_PER_GROUP * 2;

export interface CompetitionChoice { event: EventItem; reason: string | null }

export function competitionChoices(events: EventItem[], registrations: Registration[], registrationOpen: boolean, now = Date.now()): CompetitionChoice[] {
  const registered = new Set(registrations.map(entry => entry.event_id));
  const perGroup = (group: string) => registrations.filter(entry => (entry.event?.group || events.find(event => event.id === entry.event_id)?.group) === group).length;
  return events.filter(event => event.status !== 'draft').map(event => {
    let reason: string | null = null;
    if (registered.has(event.id)) reason = 'Already registered';
    else if (!registrationOpen) reason = 'Student registration is closed';
    else if (event.status !== 'open') reason = 'Registration for this event is closed';
    else if (!(Date.parse(event.registration_deadline) > now)) reason = 'The registration deadline has passed';
    else if (perGroup(event.group) >= MAX_PER_GROUP) reason = `You already have ${MAX_PER_GROUP} ${event.group} events`;
    return { event, reason };
  });
}

// Team events need a team name and every teammate's name (team size minus the student).
export function validateTeam(event: EventItem, teamName: string, members: string[]): string | null {
  if (event.event_type !== 'team') return null;
  const name = teamName.trim();
  if (!name || name.length > 100) return 'Enter a team name (up to 100 characters).';
  if (members.length !== event.team_size - 1 || members.some(member => member.trim().length < 2 || member.trim().length > 100)) return `Enter the name of each of your ${event.team_size - 1} teammate${event.team_size - 1 === 1 ? '' : 's'} (2–100 characters).`;
  return null;
}
