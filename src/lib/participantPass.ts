import { supabase, isSupabaseConfigured } from './supabase';

// A participant's own pass and registration, returned by the participant-pass function
// after they give the mail ID and mobile number they registered with.
export interface ParticipantPass {
  student_id: string;
  pass_id: string;
  reference_code: string;
  name: string;
  email: string;
  contact_number: string;
  whatsapp_number: string;
  institute_name: string;
  city_town: string;
  course_stream: string;
  board: string;
  food_preference: string;
  competitions: string[];
  registered_at: string;
  checked_in_at: string | null;
  food_redeemed_at: string | null;
  events: { event_id: string; name: string; slug: string; status: string; reported_at: string | null }[];
}

const unavailable = 'We could not look up your pass right now. Check your connection and try again, or ask the help desk.';

export async function findMyPass(email: string, phone: string): Promise<ParticipantPass> {
  if (!isSupabaseConfigured) throw new Error(unavailable);
  const { data, error } = await supabase.functions.invoke('participant-pass', { body: { email: email.trim(), phone: phone.trim() } });
  if (error) {
    let detail = '';
    if (error.context instanceof Response) {
      try { detail = (await error.context.json()).error || ''; } catch { /* Use the generic message below. */ }
    }
    throw new Error(detail || unavailable);
  }
  const pass = data?.pass as ParticipantPass | undefined;
  if (!pass?.pass_id || !pass.name) throw new Error(unavailable);
  return { ...pass, competitions: pass.competitions || [], events: pass.events || [] };
}
