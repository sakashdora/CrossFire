import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { OperationsClient, OpsSnapshot } from './model';

function message(error: { message?: string; code?: string }) {
  if (error.code === 'PGRST202' || error.code === '42883') return 'The operations database update has not been installed. Ask the project administrator to apply the operations migration.';
  return error.message || 'The request failed. Check your connection and try again.';
}
export const liveOperationsClient: OperationsClient = {
  async load() {
    if (!isSupabaseConfigured) throw new Error('Connect Supabase to use live operations. The development preview uses separate sample data.');
    const { data, error } = await supabase.rpc('crossfire_ops_snapshot');
    if (error) throw new Error(message(error));
    if (!data?.actor || !Array.isArray(data.students)) throw new Error('The server returned an incomplete operations snapshot. Please refresh.');
    return data as OpsSnapshot;
  },
  async act(action, payload) {
    const { error } = await supabase.rpc('crossfire_ops_action', { p_action: action, p_payload: payload });
    if (error) throw new Error(message(error));
    if (action === 'event.status') window.dispatchEvent(new Event('crossfire_events_changed'));
  },
  // The server validates the code, the operator's duty and the pass state.
  async lookup(passId) {
    const { data, error } = await supabase.rpc('crossfire_ops_lookup_pass', { p_code: passId });
    if (error) throw new Error(message(error));
    if (!data?.id || !data.pass_id) throw new Error('The pass lookup returned an incomplete record. Try again.');
    return data;
  },
  async createStaff(input) {
    const { data, error } = await supabase.functions.invoke('provision-staff', { body: input });
    if (error) {
      let detail = '';
      if (error.context instanceof Response) {
        try { detail = (await error.context.json()).error || ''; } catch { /* Use the generic service error below. */ }
      }
      throw new Error(detail || 'Staff provisioning is unavailable. Check that the provision-staff function is deployed and try again.');
    }
    if (!data?.success) throw new Error(data?.error || 'The staff account was not created.');
  },
};

// Super admin only (enforced by the database). Permanently deletes the student,
// their event entries, scores, intake request and login. The pass ID confirms the target.
export async function deleteStudent(studentId: string, passId: string): Promise<{ login_removed: boolean }> {
  const { data, error } = await supabase.rpc('crossfire_delete_student', { p_user_id: studentId, p_confirm_pass: passId });
  if (error) throw new Error(message(error));
  window.dispatchEvent(new Event('crossfire_events_changed'));
  return { login_removed: Boolean(data?.login_removed) };
}

// Super admin only. Deletes an intake submission that has no student account yet.
export async function deleteRegistrationRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('crossfire_delete_registration_request', { p_id: requestId });
  if (error) throw new Error(message(error));
}
