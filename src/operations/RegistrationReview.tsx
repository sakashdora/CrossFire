import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ClipboardList, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { RegistrationRequestInput } from '../lib/registrationRequests';
import { formatTime } from './model';

type ReviewStatus = 'pending' | 'reviewed' | 'declined';
interface RequestRow {
  id: string;
  reference_code: string;
  profile: RegistrationRequestInput;
  events: { id: string; name: string; group: string }[];
  status: ReviewStatus;
  review_notes: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
interface ReviewPage { items: RequestRow[]; total: number }
const statusLabel = { pending: 'Awaiting review', reviewed: 'Reviewed', declined: 'Declined' };

export function RegistrationReview() {
  const [data, setData] = useState<ReviewPage | null>(null);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('reviewed');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++revision.current;
    setLoading(true); setError('');
    try {
      const result = await supabase.rpc('crossfire_list_registration_requests', { p_status: status, p_search: query, p_page: page });
      if (result.error) throw result.error;
      if (!Array.isArray(result.data?.items) || typeof result.data.total !== 'number') throw new Error('Incomplete response');
      if (version === revision.current) setData(result.data as ReviewPage);
      return true;
    } catch {
      if (version === revision.current) { setData(null); setError('Unable to load registration requests. Check your connection, staff access and authenticator session, then retry.'); }
      return false;
    } finally { if (version === revision.current) setLoading(false); }
  }, [status, query, page]);

  useEffect(() => {
    setData(null); setEditing(null); void refresh();
    return () => { revision.current++; };
  }, [refresh]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || saving.current) return;
    saving.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const { error: failure } = await supabase.rpc('crossfire_review_registration_request', {
        p_id: editing.id, p_status: reviewStatus, p_notes: notes,
        p_expected_updated_at: editing.updated_at,
      });
      if (failure) throw failure;
      setEditing(null);
      const updated = await refresh();
      setNotice(updated ? 'Review saved. No account or event pass was created.' : 'Review saved. Refresh to load the latest requests.');
    } catch (cause) {
      const failure = cause as { code?: string; message?: string };
      setError(failure.code === 'P0001' ? failure.message || 'Review could not be saved.' : 'Review could not be confirmed. Refresh before retrying.');
    } finally { saving.current = false; setBusy(false); }
  };

  return <section className="ops-panel">
    <p className="ops-panel-note">These student details are unverified submissions. Reviewing a request records the college’s decision; it does not confirm email ownership, reserve an event place, create an account or issue an entry pass.</p>
    <form className="ops-toolbar" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(0); setNotice(''); }}>
      <label className="ops-search"><Search size={17} /><input aria-label="Search registration requests" placeholder="Name, reference, email or institute…" maxLength={200} value={search} onChange={event=>setSearch(event.target.value)} disabled={busy} /></label>
      <button type="submit" disabled={busy}>Search</button>
      <select aria-label="Review status" value={status} disabled={busy} onChange={event=>{setStatus(event.target.value);setPage(0);setNotice('');}}>
        <option value="pending">Awaiting review</option><option value="reviewed">Reviewed</option><option value="declined">Declined</option><option value="all">All requests</option>
      </select>
      <button type="button" disabled={busy || loading} onClick={()=>void refresh()}><RefreshCw size={16} /> Refresh requests</button>
    </form>
    {error && <p role="alert" className="ops-message error">{error}</p>}
    {notice && <p role="status" className="ops-message success">{notice}</p>}
    {loading && <p role="status" className="ops-panel-note">Loading registration requests…</p>}
    {!loading && data?.items.length === 0 && <div className="ops-empty"><ClipboardList size={28}/><p>No registration requests match this view.</p></div>}
    <div className="ops-intake-list">{data?.items.map(request=><article key={request.id} className="ops-intake-card">
      <header><div><code>{request.reference_code}</code><h2>{request.profile.student_name}</h2><small>Submitted {formatTime(request.created_at)}</small></div><span className={`ops-badge ${request.status==='pending'?'warn':''}`}>{statusLabel[request.status]}</span></header>
      <dl>
        <div><dt>Contact email · unverified</dt><dd>{request.profile.email}</dd></div>
        <div><dt>Phone / WhatsApp</dt><dd>{request.profile.contact_number} / {request.profile.whatsapp_number}</dd></div>
        <div><dt>Institute / city</dt><dd>{request.profile.institute_name} · {request.profile.city_town}</dd></div>
        <div><dt>Course / board / meal</dt><dd>{request.profile.course_stream} · {request.profile.board} · {request.profile.food_preference}</dd></div>
        <div><dt>Requested competitions</dt><dd>{request.events.map(event=>event.name).join(', ')}</dd></div>
        <div><dt>Participation consent</dt><dd>Accepted with submission</dd></div>
      </dl>
      {request.review_notes && <p className="ops-note">Staff note: {request.review_notes}</p>}
      {request.reviewed_at && <small>Last reviewed {formatTime(request.reviewed_at)}</small>}
      {editing?.id===request.id ? <form className="ops-form" onSubmit={save}>
        <label>Review outcome<select aria-label="Review outcome" value={reviewStatus} disabled={busy} onChange={event=>setReviewStatus(event.target.value as ReviewStatus)}><option value="reviewed">Reviewed</option><option value="declined">Declined</option><option value="pending">Awaiting review</option></select></label>
        <label>Internal review note<textarea aria-label="Internal review note" rows={3} maxLength={2000} minLength={reviewStatus==='declined'?3:undefined} required={reviewStatus==='declined'} value={notes} onChange={event=>setNotes(event.target.value)} disabled={busy}/></label>
        <footer><button type="button" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button><button type="submit" className="primary" disabled={busy}>{busy?'Saving…':'Save review'}</button></footer>
      </form> : <button type="button" disabled={busy} onClick={()=>{setEditing(request);setReviewStatus(request.status==='pending'?'reviewed':request.status);setNotes(request.review_notes);setNotice('');}}>Review request</button>}
    </article>)}</div>
    {data && <div className="ops-toolbar"><span>{data.total} requests · Page {page+1} of {Math.max(1,Math.ceil(data.total/25))}</span><button type="button" disabled={busy || loading || page===0} onClick={()=>setPage(value=>value-1)}>Previous</button><button type="button" disabled={busy || loading || (page+1)*25>=data.total} onClick={()=>setPage(value=>value+1)}>Next</button></div>}
  </section>;
}
