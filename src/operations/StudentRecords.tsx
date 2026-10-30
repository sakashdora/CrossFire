import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StudentQRCode } from '../components/StudentQRCode';
import { useLiveRevision } from './live';
import type { StudentRecord } from './studentExports';
import { accountLabel, formatStudentDate, selectStudents, type StudentFilter, type StudentSort } from './studentRecordsModel';
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
      <div className="student-detail-status"><span className={`ops-badge ${row.status === 'registered' ? 'good' : 'warn'}`}>{row.status}</span><span>{accountLabel(row)}</span></div>
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
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
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
  const exportRecords = (format: 'xlsx' | 'pdf') => run(async () => {
    const fresh = await refresh();
    if (!fresh) throw new Error('Export stopped because current records could not be loaded. Refresh and retry.');
    const rows = selectStudents(fresh, exportScope === 'filtered' ? search : '', exportScope === 'filtered' ? filter : 'all', sort);
    if (!rows.length) throw new Error('No records to export in the selected scope.');
    const { downloadStudents } = await import('./studentExports');
    await downloadStudents(rows, format);
    if (alive.current) setNotice(`Exported ${rows.length} ${exportScope === 'filtered' ? 'matching' : 'total'} student records as ${format === 'xlsx' ? 'Excel' : 'PDF'}.`);
  });
  const filtered = useMemo(() => selectStudents(records, search, filter, sort), [records, search, filter, sort]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / 25) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice(currentPage * 25, currentPage * 25 + 25);
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
  return <section className="ops-panel student-directory" aria-label="Registered student records">
    <div className="student-directory-summary">
      <div><strong>{loading ? '—' : records.length}</strong><span>Total records</span></div>
      <div><strong>{loading ? '—' : records.filter(record => record.status === 'registered').length}</strong><span>Registered</span></div>
      <div><strong>{loading ? '—' : records.filter(record => !record.has_login).length}</strong><span>Without login</span></div>
      <div><strong>{loading ? '—' : records.filter(record => record.checked_in_at).length}</strong><span>Checked in</span></div>
    </div>
    <div className="student-directory-controls">
      <label className="ops-search"><Search size={17}/><input aria-label="Search student records" placeholder="Search name, ID, phone, institute or competition" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}/></label>
      <label>Show<select value={filter} onChange={event => { setFilter(event.target.value as StudentFilter); setPage(0); }}><option value="all">All records</option><option value="registered">Registered</option><option value="no_login">Without login</option><option value="checked_in">Checked in</option><option value="inactive">Suspended</option><option value="declined">Declined</option></select></label>
      <label>Sort<select value={sort} onChange={event => { setSort(event.target.value as StudentSort); setPage(0); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label>
      <button disabled={busy || refreshing} onClick={() => void refresh()}><RefreshCw size={15}/>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
    </div>
    <div className="student-directory-exports">
      <label>Export<select aria-label="Export scope" value={exportScope} onChange={event => setExportScope(event.target.value as 'all' | 'filtered')}><option value="all">All {records.length} records</option><option value="filtered">Matching {filtered.length} records</option></select></label>
      <button disabled={busy || loading || !records.length} onClick={() => void exportRecords('xlsx')}><Download size={15}/>Excel</button>
      <button disabled={busy || loading || !records.length} onClick={() => void exportRecords('pdf')}><Download size={15}/>PDF</button>
      <span>{busy ? 'Preparing…' : updated ? `Updated ${formatStudentDate(updated)} IST` : 'Waiting for records'}</span>
    </div>
    {error && <p role="alert" className="ops-message error">{error}{updated && ' Showing the last successfully loaded records.'}</p>}
    {notice && <p role="status" className="ops-message success">{notice}</p>}
    {loading ? <div className="ops-empty" role="status">Loading registered students…</div> : !filtered.length ? <div className="ops-empty"><Users size={28}/><p>{records.length ? 'No students match these filters.' : error ? 'Records are unavailable. Use Refresh to retry.' : 'No student registrations yet. New registrations will appear here automatically.'}</p>{records.length > 0 && <button onClick={() => { setSearch(''); setFilter('all'); setPage(0); }}>Clear filters</button>}</div> : <>
      <div className="ops-table-wrap"><table className="student-directory-table"><caption className="sr-only">Registered students. Open details to view the complete registration and QR pass.</caption><thead><tr><th>Student</th><th>Contact</th><th>Institute & competitions</th><th>Registration</th><th>Details</th></tr></thead><tbody>{visible.map(record => <tr key={record.id}>
        <td data-label="Student"><strong>{record.name}</strong><code>{record.student_id || record.reference}</code><small>{accountLabel(record)}</small></td>
        <td data-label="Contact"><span>{record.email || '—'}</span><small>{record.contact_number || 'No phone recorded'}</small></td>
        <td data-label="Institute & competitions"><strong>{record.institute_name || '—'}</strong><small>{record.city_town}</small><span className="student-directory-events">{record.competitions || 'No competitions recorded'}</span></td>
        <td data-label="Registration"><span className={`ops-badge ${record.status === 'registered' ? 'good' : 'warn'}`}>{record.status}</span><small>{formatStudentDate(record.created_at)} IST</small>{record.checked_in_at && <small>Gate checked in</small>}</td>
        <td><button aria-label={`View details for ${record.name}`} onClick={() => setSelected(record.id)}>View details<ChevronRight size={14}/></button></td>
      </tr>)}</tbody></table></div>
      <div className="student-directory-pagination"><span>{currentPage * 25 + 1}–{Math.min((currentPage + 1) * 25, filtered.length)} of {filtered.length} matching records</span><div><button aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16}/></button><span>Page {currentPage + 1} / {lastPage + 1}</span><button aria-label="Next page" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16}/></button></div></div>
    </>}
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
