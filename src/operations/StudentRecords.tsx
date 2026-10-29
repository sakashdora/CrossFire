import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLiveRevision } from './live';
import { downloadStudents, type StudentRecord } from './studentExports';
import { invitationRequest } from './EmailSettings';

export function StudentRecords() {
  const [records,setRecords]=useState<StudentRecord[]>([]);
  const [search,setSearch]=useState(''); const [page,setPage]=useState(0);
  const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
  const [invitations,setInvitations]=useState<Record<string,{status:string;failure_code:string|null}>>({});
  const version=useRef(0); const working=useRef(false);
  const refresh=useCallback(async()=>{
    const current=++version.current;
    try {
      const {data,error:failure}=await supabase.rpc('crossfire_student_records');
      if(failure || !Array.isArray(data)) throw new Error('Unable to load student records. Check your connection and staff session, then retry.');
      if(current===version.current){setRecords(data);setError('');}
      return data as StudentRecord[];
    } catch(cause) {if(current===version.current)setError(cause instanceof Error?cause.message:'Unable to load students.');return null;}
    finally {if(current===version.current)setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();return()=>{version.current++;};},[refresh]);
  useLiveRevision(()=>{if(!working.current)void refresh();});
  const run=async(action:()=>Promise<void>)=>{
    if(working.current)return;working.current=true;setBusy(true);setError('');setNotice('');
    try {await action();}catch(cause){setError(cause instanceof Error?cause.message:'Action failed. Please retry.');}
    finally {working.current=false;setBusy(false);}
  };
  const exportAll=(format:'xlsx'|'pdf')=>run(async()=>{
    const fresh=await refresh();if(!fresh)throw new Error('Export stopped because current records could not be loaded.');
    await downloadStudents(fresh,format);setNotice(`Exported all ${fresh.length} records.`);
  });
  const filtered=records.filter(row=>[row.name,row.email,row.reference,row.student_id,row.pass_code,row.contact_number,row.institute_name].some(value=>value?.toLowerCase().includes(search.trim().toLowerCase())));
  const lastPage=Math.max(0,Math.ceil(filtered.length/25)-1);const currentPage=Math.min(page,lastPage);
  const visible=filtered.slice(currentPage*25,currentPage*25+25);
  const requestIds=visible.map(row=>row.request_id).filter((id):id is string=>Boolean(id)).join(',');
  useEffect(()=>{
    let active=true;
    setInvitations({});
    if(requestIds)void supabase.rpc('crossfire_invitation_status',{p_requests:requestIds.split(',')}).then(({data,error:failure})=>{
      if(!active)return;
      if(failure){setError('Could not load invitation status. Refresh before sending invitations.');return;}
      setInvitations(Object.fromEntries(requestIds.split(',').map(id=>[id,{status:'none',failure_code:null}]).concat((data||[]).map((item:{request_id:string;status:string;failure_code:string|null})=>[item.request_id,item]))));
    });
    return()=>{active=false;};
  },[requestIds,records]);
  return <section className="ops-panel">
    <p className="ops-panel-note">Every student registration. New registrations create a login account and QR pass immediately; older submissions without a login are marked. Use “Send password reset link” for account recovery once the official sender is configured. Exports include every record, regardless of search or page.</p>
    <div className="ops-toolbar"><input aria-label="Search student records" placeholder="Name, email, phone, reference or institute" value={search} onChange={event=>{setSearch(event.target.value);setPage(0);}}/>
      <button disabled={busy} onClick={()=>void refresh()}>Refresh</button>
      <button disabled={busy||loading} onClick={()=>void exportAll('xlsx')}>Export Excel</button><button disabled={busy||loading} onClick={()=>void exportAll('pdf')}>Export PDF</button>
    </div>
    {error&&<p role="alert" className="ops-message error">{error}</p>}{notice&&<p role="status" className="ops-message success">{notice}</p>}
    {loading?<p role="status">Loading students…</p>:<p>{records.length} total records · {filtered.length} match</p>}
    <div className="ops-intake-list">{visible.map(row=><article className="ops-intake-card" key={row.id}>
      <header><div><code>{row.student_id || row.reference}</code><h2>{row.name}</h2></div><span className="ops-badge">{row.status}</span>{row.has_login ? <span className="ops-badge good">Login active</span> : <span className="ops-badge warn">No login</span>}</header>
      <dl><div><dt>Email</dt><dd>{row.email}</dd></div><div><dt>Phone / WhatsApp</dt><dd>{row.contact_number} / {row.whatsapp_number}</dd></div>
        <div><dt>Institute / city</dt><dd>{row.institute_name} · {row.city_town}</dd></div><div><dt>Course / board / meal</dt><dd>{row.course_stream} · {row.board} · {row.food_preference}</dd></div>
        <div><dt>Competitions</dt><dd>{row.competitions}</dd></div><div><dt>Pass</dt><dd>{row.pass_code||'Not issued'}</dd></div><div><dt>Gate check-in</dt><dd>{row.checked_in_at?new Date(row.checked_in_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):'Not yet'}</dd></div></dl>
      {row.request_id&&invitations[row.request_id]&&<p>Portal invitation: {invitations[row.request_id].status}{invitations[row.request_id].failure_code&&` · ${invitations[row.request_id].failure_code}`}</p>}
      {row.request_id&&row.status==='registered'&&<button disabled={busy||!invitations[row.request_id]||['preparing','ready','sending','uncertain'].includes(invitations[row.request_id].status)} onClick={()=>void run(async()=>{
        const result=await invitationRequest({request_id:row.request_id,resend:invitations[row.request_id!]?.status==='accepted'});
        await refresh();
        if(!result?.success||result.status!=='accepted')throw new Error('Invitation outcome could not be confirmed. Check delivery status before retrying.');
        setNotice('Portal invitation accepted by the email provider.');
      })}>{row.has_login||invitations[row.request_id]?.status==='accepted'?'Send password reset link':'Send portal invitation'}</button>}
    </article>)}</div>
    {!loading&&!filtered.length&&<p>No student records match this view.</p>}
    <div className="ops-toolbar"><span>Page {currentPage+1} of {lastPage+1}</span><button disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><button disabled={currentPage===lastPage} onClick={()=>setPage(currentPage+1)}>Next</button></div>
  </section>;
}
