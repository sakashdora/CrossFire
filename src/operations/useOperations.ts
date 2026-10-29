import { useCallback, useEffect, useRef, useState } from 'react';
import type { OperationsClient, OpsAction, OpsPayload, OpsSnapshot, StaffInput } from './model';
import { useLiveRevision } from './live';

export function useOperations(client: OperationsClient) {
  const [data, setData] = useState<OpsSnapshot | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const sequence = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  // Resolves to the fresh snapshot, or null when it could not be loaded.
  const refresh = useCallback(async (): Promise<OpsSnapshot | null> => {
    const id = ++sequence.current;
    try {
      const snapshot = await client.load();
      if (mounted.current && id === sequence.current) { setData(snapshot); setError(''); }
      return snapshot;
    } catch (cause) {
      if (mounted.current && id === sequence.current) setError(cause instanceof Error ? cause.message : 'Unable to load operations.');
      return null;
    } finally { if (mounted.current && id === sequence.current) setLoading(false); }
  }, [client]);
  useEffect(() => {
    mounted.current = true;
    setData(null); setLoading(true); setNotice('');
    void refresh();
    const update = () => { if (!document.hidden && !pending.current) void refresh(); };
    // Live revision changes trigger reloads; this slower timer is the fallback.
    const interval = window.setInterval(update, 60000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { mounted.current = false; sequence.current++; clearInterval(interval); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [refresh]);
  useLiveRevision(() => { if (!pending.current) void refresh(); });
  const run = async (task: () => Promise<void>, success: string) => {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setNotice(''); setError('');
    try {
      await task();
      const fresh = await refresh();
      if (mounted.current) setNotice(fresh ? success : `${success} The latest view could not be loaded; refresh before taking another action.`);
      return true;
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Nothing was saved. Please try again.');
      return false;
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  return { data, error, notice, loading, busy, refresh,
    act: (action: OpsAction, payload: OpsPayload, success = 'Changes saved.') => run(() => client.act(action, payload), success),
    createStaff: (input: StaffInput) => run(() => client.createStaff(input), 'Staff account created. Share the initial password securely with the staff member.'),
  };
}
