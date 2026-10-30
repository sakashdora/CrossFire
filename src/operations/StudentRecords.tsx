import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, Eye, FileText, Phone, MessageCircle, RefreshCw, Search, Ticket, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StudentQRCode } from '../components/StudentQRCode';
import { useLiveRevision } from './live';
import type { StudentRecord } from './studentExports';
import { accountLabel, formatStudentDate, registrationLabel, studentDay, selectStudents, type StudentFilter, type StudentSort } from './studentRecordsModel';
import { invitationRequest } from './EmailSettings';

type Invitation = { status: string; failure_code: string | null };
function Details({ row, close, children }: { row: StudentRecord; close: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  const fields = [
    ['Student ID', row.student_id], ['Submission reference', row.reference],
    ['Email', row.email], ['Phone', row.contact_number], ['WhatsApp', row.whatsapp_number],
    ['Institute', row.institute_name], ['City / town', row.city_town], ['Course', row.course_stream],
    ['Board', row.board], ['Food preference', row.food_preference], ['Competitions', row.competitions],
    ['Registered (IST)', formatStudentDate(row.created_at)], ['Gate check-in (IST)', formatStudentDate(row.checked_in_at)],
    ['Meal issued (IST)', formatStudentDate(row.food_redeemed_at)],
    ['Parent / guardian consent', row.parent_consent ? 'Yes' : 'Not recorded'], ['Terms accepted', row.terms_accepted ? 'Yes' : 'Not recorded'],
  ];
  return <dialog ref={dialog} className="ops-modal student-detail" aria-labelledby="student-detail-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header><div><small>Student registration</small><h2 id="student-detail-title">{row.name}</h2></div><button className="ops-icon" onClick={close} aria-label="Close student details"><X size={20}/></button></header>
    <div className="student-detail-body">
      <div className="student-detail-status"><span className={`ops-badge ${row.status === 'registered' && row.has_login ? 'good' : 'warn'}`}>{registrationLabel(row)}</span><span>{accountLabel(row)}</span></div>
      <dl className="student-detail-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
      <div className="student-detail-pass"><div><h3>Student QR pass</h3><code>{row.pass_code || 'Not issued'}</code><p>{row.status === 'inactive' ? 'This account is suspended. Its pass cannot be used for check-in.' : row.has_login ? 'The student can also find this pass in their dashboard.' : 'This older submission has no login or QR pass yet.'}</p></div>{row.pass_code && <StudentQRCode studentId={row.pass_code} name={row.name} size={150} downloadable/>}</div>
      {children}
    </div>
  </dialog>;
}

export function StudentRecords() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [sort, setSort] = useState<StudentSort>('newest');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [passFilter, setPassFilter] = useState('all');
  const [competition, setCompetition] = useState('');
  const [course, setCourse] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const dismiss = (event: MouseEvent) => { if (!bulkRef.current?.contains(event.target as Node)) setBulkOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setBulkOpen(false); };
    document.addEventListener('mousedown', dismiss); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', dismiss); document.removeEventListener('keydown', escape); };
  }, []);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitationError, setInvitationError] = useState('');
  const [invitationVersion, setInvitationVersion] = useState(0);
  const alive = useRef(true);
  const pending = useRef<Promise<StudentRecord[] | null> | null>(null);
  const working = useRef(false);
  const refresh = useCallback((): Promise<StudentRecord[] | null> => {
    if (pending.current) return pending.current;
    setRefreshing(true);
    const request = (async () => {
      try {
        const { data, error: failure } = await supabase.rpc('crossfire_student_records');
        if (failure || !Array.isArray(data)) throw new Error('Student records could not be refreshed. Check your connection and staff session, then retry.');
        if (alive.current) { setRecords(data); setError(''); setUpdated(new Date().toISOString()); }
        return data as StudentRecord[];
      } catch (cause) {
        if (alive.current) setError(cause instanceof Error ? cause.message : 'Unable to load students.');
        return null;
      } finally { pending.current = null; if (alive.current) { setLoading(false); setRefreshing(false); } }
    })();
    pending.current = request;
    return request;
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const update = () => { if (!document.hidden && !working.current) void refresh(); };
    const timer = window.setInterval(update, 60000);
    window.addEventListener('focus', update); document.addEventListener('visibilitychange', update);
    return () => { alive.current = false; clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [refresh]);
  useLiveRevision(() => { if (!working.current) void refresh(); });
  const run = async (action: () => Promise<void>) => {
    if (working.current) return;
    working.current = true; setBusy(true); setNotice('');
    try { await action(); } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Action failed. Please retry.'); }
    finally { working.current = false; if (alive.current) setBusy(false); }
  };
  const exportRecords = (format: 'xlsx' | 'pdf', scope: 'matching' | 'selected' = 'matching') => run(async () => {
    const fresh = await refresh();
    if (!fresh) throw new Error('Export stopped because current records could not be loaded. Refresh and retry.');
    const rows = scope === 'selected' ? fresh.filter(record => checked.has(record.id)) : selectStudents(fresh, search, filter, sort, { pass: passFilter, competition, course });
    if (scope === 'selected' && rows.length !== checked.size) throw new Error('Some selected records changed or are no longer available. Clear the selection and select again.');
    if (!rows.length) throw new Error('No records to export in the selected scope.');
    const { downloadStudents } = await import('./studentExports');
    await downloadStudents(rows, format);
    if (alive.current) setNotice(`Exported ${rows.length} ${scope} student records as ${format === 'xlsx' ? 'Excel' : 'PDF'}.`);
  });
  const filtered = useMemo(() => selectStudents(records, search, filter, sort, { pass: passFilter, competition, course }), [records, search, filter, sort, passFilter, competition, course]);
  const competitions = useMemo(() => [...new Set(records.flatMap(record => record.competitions.split(',').map(value => value.trim()).filter(Boolean)))].sort(), [records]);
  const courses = useMemo(() => [...new Set(records.flatMap(record => [record.course_stream, record.board]).filter(Boolean))].sort(), [records]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const allChecked = visible.length > 0 && visible.every(record => checked.has(record.id));
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = !allChecked && visible.some(record => checked.has(record.id)); }, [checked, allChecked, visible]);
  const toggle = (ids: string[], enabled: boolean) => setChecked(previous => { const next = new Set(previous); ids.forEach(id => enabled ? next.add(id) : next.delete(id)); return next; });
  const clearFilters = () => { setSearch(''); setFilter('all'); setPassFilter('all'); setCompetition(''); setCourse(''); setPage(0); };
  const stats = [
    { label: 'Total registrations', hint: 'All submissions', count: records.length, icon: Users, tone: 'blue' },
    { label: 'Registered', hint: 'Complete accounts', count: records.filter(record => record.has_login && record.status === 'registered').length, icon: CheckCircle2, tone: 'green' },
    { label: 'No login', hint: 'Login pending', count: records.filter(record => !record.has_login).length, icon: Clock3, tone: 'orange' },
    { label: 'Issued passes', hint: 'QR passes created', count: records.filter(record => record.pass_code).length, icon: Ticket, tone: 'purple' },
    { label: 'Today', hint: 'New submissions · IST', count: records.filter(record => studentDay(record.created_at) === studentDay(new Date().toISOString())).length, icon: Users, tone: 'pink' },
  ];
  const row = records.find(record => record.id === selected);
  const requestId = row?.request_id;
  useEffect(() => {
    let active = true; setInvitation(null); setInvitationError('');
    if (requestId) void supabase.rpc('crossfire_invitation_status', { p_requests: [requestId] }).then(({ data, error: failure }) => {
      if (!active) return;
      if (failure) { setInvitationError('Could not load delivery status. Close and reopen these details to retry.'); return; }
      setInvitation(data?.[0] || { status: 'none', failure_code: null });
    });
    return () => { active = false; };
  }, [requestId, invitationVersion]);
  return <section className="student-directory" aria-label="Registered student records">
    <div className="records-heading">
      <div><h1>Student registrations</h1><p>View, search and manage all student registrations for CrossFire 2026.</p></div>
      <div className="records-updated"><span>Last updated<strong>{updated ? `${formatStudentDate(updated)} IST` : 'Waiting for records'}</strong></span><button className="ops-icon" disabled={busy || refreshing} onClick={() => void refresh()} aria-label="Refresh student records"><RefreshCw size={19} className={refreshing ? 'records-spinning' : ''}/></button></div>
      <div className="records-actions">
        <div className="records-bulk" ref={bulkRef}><button className="records-bulk-trigger" aria-expanded={bulkOpen} aria-controls="records-bulk-menu" onClick={() => setBulkOpen(!bulkOpen)}>Bulk actions{checked.size > 0 && ` (${checked.size})`}<ChevronDown size={15}/></button>
          {bulkOpen && <div id="records-bulk-menu" className="records-bulk-menu"><small>{checked.size} selected across pages</small><button disabled={busy || !checked.size} onClick={() => { setBulkOpen(false); void exportRecords('xlsx', 'selected'); }}>Export selected Excel</button><button disabled={busy || !checked.size} onClick={() => { setBulkOpen(false); void exportRecords('pdf', 'selected'); }}>Export selected PDF</button><button disabled={!checked.size} onClick={() => { setChecked(new Set()); setBulkOpen(false); }}>Clear selection</button></div>}
        </div>
        <button disabled={busy || loading || !filtered.length} title="Export all matching student records" onClick={() => void exportRecords('xlsx')}><Download size={17}/>Export Excel</button>
        <button className="records-pdf" disabled={busy || loading || !filtered.length} title="Export all matching student records" onClick={() => void exportRecords('pdf')}><FileText size={17}/>Export PDF</button>
      </div>
    </div>
    <div className="records-metrics">{stats.map(({label,hint,count,icon:Icon,tone}) => <div className={`records-metric ${tone}`} key={label}><span className="records-metric-icon"><Icon size={29}/></span><div><strong>{loading ? '—' : count}</strong><b>{label}</b><small>{hint}</small></div></div>)}</div>
    <div className="records-filters">
      <div className="ops-search"><Search size={19}/><input aria-label="Search student records" placeholder="Search by name, email, phone, institute…" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}/>{search && <button className="ops-icon" aria-label="Clear search" onClick={() => { setSearch(''); setPage(0); }}><X size={17}/></button>}</div>
      <label>Registration status<select value={filter} onChange={event => { setFilter(event.target.value as StudentFilter); setPage(0); }}><option value="all">All</option><option value="registered">Registered</option><option value="no_login">No login</option><option value="inactive">Suspended</option><option value="declined">Declined</option><option value="checked_in">Checked in</option></select></label>
      <label>Gate pass<select value={passFilter} onChange={event => { setPassFilter(event.target.value); setPage(0); }}><option value="all">All</option><option value="issued">Issued</option><option value="not_issued">Not issued</option></select></label>
      <label>Competition<select value={competition} onChange={event => { setCompetition(event.target.value); setPage(0); }}><option value="">All</option>{competitions.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Course / Board<select value={course} onChange={event => { setCourse(event.target.value); setPage(0); }}><option value="">All</option>{courses.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    {error && <p role="alert" className="ops-message error">{error}{updated && ' Showing the last successfully loaded records.'}</p>}
    {notice && <p role="status" className="ops-message success">{notice}</p>}
    {busy && <p role="status">Preparing current records…</p>}
    <div className="records-table-card">
    {loading ? <div className="ops-empty" role="status">Loading registered students…</div> : !filtered.length ? <div className="ops-empty"><Users size={28}/><p>{records.length ? 'No students match these filters.' : error ? 'Records are unavailable. Use Refresh to retry.' : 'No student registrations yet. New registrations will appear here automatically.'}</p>{records.length > 0 && <button onClick={clearFilters}>Clear filters</button>}</div> : <>
      <div className="ops-table-wrap"><table className="records-table"><caption className="sr-only">Student registrations. Exports include all matching rows; bulk actions export selected rows across pages.</caption><thead><tr><th><input ref={selectAllRef} type="checkbox" aria-label="Select all students on this page" checked={allChecked} onChange={event => toggle(visible.map(record => record.id), event.target.checked)}/></th><th>#</th><th>Reg. ID</th><th>Name</th><th>Contact</th><th>Institute / City</th><th>Class / Course</th><th>Competitions</th><th>Status</th><th>Gate pass</th><th>Actions</th></tr></thead><tbody>{visible.map((record,index) => <tr key={record.id} data-selected={checked.has(record.id)}>
        <td><input type="checkbox" aria-label={`Select ${record.name}`} checked={checked.has(record.id)} onChange={event => toggle([record.id], event.target.checked)}/></td>
        <td className="records-number">{currentPage * pageSize + index + 1}</td>
        <td data-label="Reg. ID"><code>{record.student_id || record.reference}</code></td>
        <td data-label="Name"><strong>{record.name}</strong><small>{record.email || 'No email recorded'}</small></td>
        <td data-label="Contact"><span className="records-contact"><Phone size={14}/>{record.contact_number || '—'}</span><span className="records-contact whatsapp"><MessageCircle size={15}/>{record.whatsapp_number || '—'}</span></td>
        <td data-label="Institute / City">{record.institute_name || '—'}<small>{record.city_town}</small></td>
        <td data-label="Class / Course">{record.course_stream || '—'}<small>{[record.board,record.food_preference].filter(Boolean).join(' · ')}</small></td>
        <td data-label="Competitions">{record.competitions || 'No competitions recorded'}</td>
        <td data-label="Status"><span className={`records-status ${record.status === 'registered' && record.has_login ? 'registered' : 'pending'}`}>{registrationLabel(record)}</span></td>
        <td data-label="Gate pass"><span className={`records-status ${record.status === 'inactive' ? 'pending' : record.pass_code ? 'registered' : 'unissued'}`}>{record.status === 'inactive' && record.pass_code ? 'Suspended' : record.checked_in_at ? 'Checked in' : record.pass_code ? 'Issued' : 'Not issued'}</span></td>
        <td><button aria-label={`View details for ${record.name}`} onClick={() => setSelected(record.id)}><Eye size={16}/>View</button></td>
      </tr>)}</tbody></table></div>
    </>}
    <div className="records-pagination"><span>Showing {filtered.length ? currentPage * pageSize + 1 : 0}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length} registrations{checked.size > 0 && ` · ${checked.size} selected`}</span><div><select aria-label="Sort students" value={sort} onChange={event => { setSort(event.target.value as StudentSort); setPage(0); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select><button aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16}/></button><span className="records-current" aria-label={`Page ${currentPage + 1} of ${lastPage + 1}`}>{currentPage + 1}</span><button aria-label="Next page" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16}/></button><select aria-label="Students per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}>{[10,25,50].map(size => <option key={size} value={size}>{size} / page</option>)}</select></div></div>
    </div>
    {row && <Details row={row} close={() => { if (!working.current) setSelected(null); }}>
      {requestId && <section className="student-detail-recovery"><h3>{row.has_login ? 'Account recovery' : 'Set up student login'}</h3><p>{row.has_login ? 'Send a password reset link to the registered email using the configured college sender.' : 'An older submission needs a portal invitation to create its login and QR pass.'}</p>
        {invitationError && <p role="alert">{invitationError}</p>}
        {invitation && <p>Last delivery: {invitation.status === 'none' ? 'No invitation sent' : invitation.status}{invitation.failure_code ? ` (${invitation.failure_code})` : ''}</p>}
        {row.status === 'registered' && <button disabled={busy || !invitation || ['preparing', 'ready', 'sending', 'uncertain'].includes(invitation.status)} onClick={() => void run(async () => {
          const result = await invitationRequest({ request_id: requestId, resend: invitation?.status === 'accepted' });
          setInvitationVersion(value => value + 1); await refresh();
          if (!result?.success || result.status !== 'accepted') throw new Error('Delivery could not be confirmed. Check its status before retrying.');
          setNotice('The email provider accepted the student account link.');
        })}>{busy ? 'Sending…' : row.has_login ? 'Send password reset link' : 'Send portal invitation'}</button>}
        {error && <p role="alert" className="ops-message error">{error}</p>}{notice && <p role="status" className="ops-message success">{notice}</p>}
      </section>}
    </Details>}
  </section>;
}
