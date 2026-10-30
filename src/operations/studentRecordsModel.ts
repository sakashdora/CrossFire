import type { StudentRecord } from './studentExports';

export type StudentFilter = 'all' | 'registered' | 'no_login' | 'inactive' | 'declined' | 'checked_in';
export type StudentSort = 'newest' | 'oldest' | 'name';
export type DirectoryFilters = { pass?: string; competition?: string; course?: string };
export function registrationLabel(row: StudentRecord): string {
  return row.status === 'inactive' ? 'Suspended' : row.status === 'declined' ? 'Declined' : !row.has_login ? 'No login' : 'Registered';
}
export function studentDay(value: string): string {
  return Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) : '';
}
export function directoryMatches(row: StudentRecord, filters: DirectoryFilters): boolean {
  return (!filters.pass || filters.pass === 'all' || (filters.pass === 'issued' ? !!row.pass_code : !row.pass_code))
    && (!filters.competition || row.competitions.split(',').map(value => value.trim()).includes(filters.competition))
    && (!filters.course || [row.course_stream, row.board].includes(filters.course));
}
export function accountLabel(row: StudentRecord): string {
  if (!row.has_login) return 'No login yet';
  return row.status === 'inactive' ? 'Login suspended' : 'Login available';
}
export function formatStudentDate(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
export function selectStudents(records: StudentRecord[], query: string, filter: StudentFilter, sort: StudentSort, extra: DirectoryFilters = {}): StudentRecord[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return records.filter(row => {
    const haystack = [row.name, row.email, row.reference, row.student_id, row.pass_code, row.contact_number, row.whatsapp_number, row.institute_name, row.city_town, row.course_stream, row.board, row.competitions].join(' ').toLowerCase();
    const matches = filter === 'all' || (filter === 'no_login' ? !row.has_login : filter === 'checked_in' ? !!row.checked_in_at : filter === 'registered' ? row.status === 'registered' && row.has_login : row.status === filter);
    return matches && directoryMatches(row, extra) && words.every(word => haystack.includes(word));
  }).sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id);
    const difference = (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0);
    return (sort === 'oldest' ? difference : -difference) || a.id.localeCompare(b.id);
  });
}
