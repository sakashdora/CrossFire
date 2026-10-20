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

export async function submitRegistrationRequest(requestId: string, profile: RegistrationRequestInput): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Registration is temporarily unavailable. Please contact the college organisers.');
  const { data, error } = await supabase.rpc('crossfire_submit_registration_request', { p_request_id: requestId, p_profile: profile });
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Your submission could not be confirmed. Check your connection and retry with the same details.');
  if (data?.status !== 'received' || typeof data.reference_code !== 'string' || !/^CFREQ-[A-F0-9]{16}$/.test(data.reference_code)) {
    throw new Error('Your submission receipt could not be confirmed. Retry with the same details or contact the college organisers.');
  }
  return data.reference_code;
}
