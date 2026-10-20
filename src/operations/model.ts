export type OpsRole = 'super_admin' | 'admin' | 'volunteer';
export type StaffRole = OpsRole | 'judge';
export type GuestStatus = 'Invited' | 'Confirmed' | 'Arrived' | 'Departed' | 'Declined';
export type Station = 'gate' | 'food' | 'event' | 'guest' | 'support';
export const STATIONS: Record<Station, string> = { gate: 'Registration gate', food: 'Meal counter', event: 'Event room', guest: 'VIP & guest desk', support: 'Operations support' };
export const GUEST_CATEGORIES = ['Chief Guest', 'Guest of Honour', 'Keynote Speaker', 'VIP Dignitary', 'Judge', 'Special Invitee'] as const;
export const SHIFTS = ['Full Day (08:30 AM - 05:30 PM)', 'Morning Shift (08:30 AM - 01:30 PM)', 'Afternoon Shift (01:00 PM - 05:30 PM)'];
export const ATTENDANCE = ['Assigned', 'Present / On Duty', 'On Break', 'Absent'] as const;
export interface OpsActor { id: string; name: string; role: OpsRole }
export interface OpsStaff { id: string; name: string; email: string; contact_number: string; role: StaffRole; active: boolean; updated_at: string }
export interface OpsVolunteer { id: string; user_id: string | null; volunteer_id: string; name: string; email: string; station: Station; event_id: string | null; shift: string; attendance_status: string; kit_issued: boolean; walkie_channel: string; notes: string; updated_at: string }
export interface OpsEvent { id: string; name: string; slug: string; venue: string; status: string; capacity: number; registered: number; start_time: string; judges: string[] }
export interface OpsRegistration { id: string; event_id: string; name: string; status: string; room_reported_at: string | null }
export interface OpsStudent { id: string; pass_id: string; name: string; institute: string; contact_number: string; food_preference: string; checked_in_at: string | null; food_redeemed_at: string | null; registrations: OpsRegistration[] }
export interface OpsGuest { id: string; pass_code: string; name: string; designation: string; organization: string; category: string; contact_number: string; email: string; status: GuestStatus; escort_volunteer_id: string | null; arrival_time: string; arrived_at: string | null; departed_at: string | null; meal_redeemed_at: string | null; vehicle_number: string; dietary_preference: string; notes: string; archived_at: string | null; updated_at: string }
export interface OpsIncident { id: string; room: string; issue: string; priority: 'Normal' | 'High'; status: 'Open' | 'Resolved'; reported_by: string; resolution: string | null; created_at: string; resolved_at: string | null }
export interface OpsAudit { id: string; actor: string; action: string; entity_type: string; created_at: string }
export interface OpsSnapshot { actor: OpsActor; students: OpsStudent[]; guests: OpsGuest[]; volunteers: OpsVolunteer[]; events: OpsEvent[]; staff: OpsStaff[]; incidents: OpsIncident[]; audit: OpsAudit[]; settings: { student_portal_open: boolean }; fetched_at: string }
export type OpsAction = 'guest.save' | 'guest.status' | 'guest.meal' | 'guest.archive' | 'volunteer.save' | 'volunteer.attendance' | 'student.checkin' | 'student.meal' | 'student.room' | 'registration.status' | 'event.status' | 'event.judge' | 'incident.report' | 'incident.resolve' | 'staff.access' | 'settings.portal' | 'announcement.send';
export type OpsPayload = Record<string, unknown>;
export interface OperationsClient { load(): Promise<OpsSnapshot>; act(action: OpsAction, payload: OpsPayload): Promise<void>; createStaff(input: StaffInput): Promise<void> }
export interface StaffInput { name: string; email: string; contact_number: string; role: StaffRole; password: string }

export const isManager = (role: string) => role === 'admin' || role === 'super_admin';
export function canManageStaff(actor: OpsActor, target: Pick<OpsStaff, 'id' | 'role'>, nextRole: StaffRole = target.role) {
  if (actor.id === target.id) return false;
  return actor.role === 'super_admin' || (actor.role === 'admin' && ['judge', 'volunteer'].includes(target.role) && ['judge', 'volunteer'].includes(nextRole));
}
export function guestTransitions(status: GuestStatus, manager: boolean): GuestStatus[] {
  const flow: Record<GuestStatus, GuestStatus[]> = { Invited: manager ? ['Confirmed', 'Declined'] : [], Confirmed: manager ? ['Arrived', 'Declined'] : ['Arrived'], Arrived: ['Departed'], Departed: [], Declined: manager ? ['Invited'] : [] };
  return flow[status];
}
export function dutyAllows(snapshot: OpsSnapshot, duty: Station, eventId?: string) {
  if (isManager(snapshot.actor.role)) return true;
  return snapshot.volunteers.some(v => v.user_id === snapshot.actor.id && v.station === duty && v.attendance_status === 'Present / On Duty' && (duty !== 'event' || v.event_id === eventId));
}
export function validateGuest(data: OpsPayload) {
  for (const key of ['name', 'designation', 'organization']) if (typeof data[key] !== 'string' || String(data[key]).trim().length < 2) throw new Error('Enter the guest name, designation, and organization (at least 2 characters each).');
  if (!(GUEST_CATEGORIES as readonly string[]).includes(String(data.category))) throw new Error('Select an invited VIP or judge category.');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) throw new Error('Enter a valid email address.');
  if (data.contact_number && !/^\+?[0-9]{10,13}$/.test(String(data.contact_number))) throw new Error('Enter a phone number with 10–13 digits and an optional +.');
}
export function parsePass(raw: string): string {
  const clean = raw.trim();
  if (!clean || clean.length > 4000) throw new Error('Scan a CrossFire pass or enter its pass ID.');
  if (clean.startsWith('{')) {
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(clean); } catch { throw new Error('This QR code is not a valid CrossFire pass.'); }
    const pass = parsed.pass_id ?? parsed.guest_pass;
    if (typeof pass !== 'string' || !pass.trim()) throw new Error('This QR code does not contain a CrossFire pass ID.');
    return pass.trim();
  }
  return clean;
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function formatTime(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';
}
