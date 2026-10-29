import { supabase, isSupabaseConfigured } from './supabase';

export interface RegistrationRequestInput {
  student_name: string;
  email: string;
  contact_number: string;
  whatsapp_number: string;
  institute_name: string;
  city_town: string;
  course_stream: string;
  board: string;
  food_preference: string;
  selected_competitions: string[];
  parent_consent: boolean;
  terms_accepted: boolean;
  website: string;
}

export interface RegistrationReceipt {
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
}

export class RegistrationError extends Error {
  constructor(message: string, readonly field?: string) { super(message); }
}

// Reusing the same request ID with the same details is safe: the server returns
// the saved receipt instead of creating a second account.
export async function registerStudent(requestId: string, profile: RegistrationRequestInput, password: string): Promise<RegistrationReceipt> {
  if (!isSupabaseConfigured) throw new RegistrationError('Registration is temporarily unavailable. Please contact the college organisers.');
  const { data, error } = await supabase.functions.invoke('register-student', { body: { request_id: requestId, profile, password } });
  if (error) {
    let detail: { error?: string; field?: string } = {};
    if (error.context instanceof Response) {
      try { detail = await error.context.json(); } catch { /* Use the generic message below. */ }
    }
    throw new RegistrationError(detail.error || 'Your registration could not be confirmed. Check your connection and submit again with the same details.', detail.field);
  }
  const receipt = data?.receipt as RegistrationReceipt | undefined;
  if (!data?.success || !receipt || !/^CF26-[0-9A-F]{32}$/.test(receipt.pass_id) || !/^CFS-\d+$/.test(receipt.student_id)) {
    throw new RegistrationError('Your registration receipt could not be confirmed. Submit again with the same details, or sign in to check your registration.');
  }
  return receipt;
}
