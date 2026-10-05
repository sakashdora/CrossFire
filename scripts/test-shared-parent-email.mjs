import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('[SHARED-EMAIL TEST] Testing 2 siblings registering under the same parent email...');

  const parentEmail = `parent_${Date.now()}@gmail.com`;
  const parentMobile = '9861009988';

  // Sibling 1
  const auth1 = await supabase.auth.signUp({
    email: parentEmail,
    password: 'Password@123',
    options: { data: { app: 'crossfire' } }
  });

  if (auth1.error || !auth1.data.session) {
    console.error('[FAIL] Sibling 1 auth signup failed:', auth1.error);
    process.exit(1);
  }

  const client1 = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${auth1.data.session.access_token}` } }
  });

  const rpc1 = await client1.rpc('submit_registration_form', {
    p_profile: {
      first_name: 'Rahul',
      last_name: 'Nayak',
      email: parentEmail,
      contact_number: parentMobile,
      whatsapp_number: parentMobile,
      institute_name: 'DAV Chandrasekharpur',
      city_town: 'Bhubaneswar',
      course_stream: '12th Science',
      board: 'CBSE',
      food_preference: 'Veg',
      parent_consent: 'true',
      terms_accepted: 'true'
    },
    p_event_slugs: ['quiz', 'debate']
  });

  if (rpc1.error) {
    console.error('[FAIL] Sibling 1 registration failed:', rpc1.error);
    process.exit(1);
  }
  console.log('[PASS] Sibling 1 (Rahul) registered successfully under', parentEmail);

  // Sibling 2: uses SAME parentEmail & parentMobile!
  // Sibling 2 uses sub-addressing in auth so Supabase Auth creates distinct session
  const sibling2AuthEmail = parentEmail.replace('@', `+cf${Date.now().toString().slice(-4)}@`);
  const auth2 = await supabase.auth.signUp({
    email: sibling2AuthEmail,
    password: 'Password@123',
    options: { data: { app: 'crossfire' } }
  });

  if (auth2.error || !auth2.data.session) {
    console.error('[FAIL] Sibling 2 auth signup failed:', auth2.error);
    process.exit(1);
  }

  const client2 = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${auth2.data.session.access_token}` } }
  });

  const rpc2 = await client2.rpc('submit_registration_form', {
    p_profile: {
      first_name: 'Riya',
      last_name: 'Nayak',
      email: parentEmail,
      contact_number: parentMobile,
      whatsapp_number: parentMobile,
      institute_name: 'DAV Chandrasekharpur',
      city_town: 'Bhubaneswar',
      course_stream: '12th Commerce',
      board: 'CBSE',
      food_preference: 'Non-veg',
      parent_consent: 'true',
      terms_accepted: 'true'
    },
    p_event_slugs: ['ramp-walk', 'treasure-hunt']
  });

  if (rpc2.error) {
    console.error('[FAIL] Sibling 2 registration failed:', rpc2.error);
    process.exit(1);
  }
  console.log('[PASS] Sibling 2 (Riya) registered successfully under SAME email:', parentEmail);

  // Verify both exist in public.users and public.students_view
  const { data: dbRecords } = await adminClient
    .from('students_view')
    .select('student_code, full_name, email, course_stream, registered_events')
    .eq('email', parentEmail);

  console.log('\n== Verification from students_view ==');
  console.table(dbRecords);

  if (dbRecords && dbRecords.length === 2) {
    console.log('[SUCCESS] Both siblings coexist in the database with their own events and pass IDs!');
  } else {
    console.error('[FAIL] Expected 2 records, found:', dbRecords?.length);
    process.exit(1);
  }

  // Cleanup test siblings
  await client1.rpc('admin_delete_student', { p_student_id: auth1.data.user.id });
  await client2.rpc('admin_delete_student', { p_student_id: auth2.data.user.id });
  console.log('[CLEANUP] Deleted test sibling records.');
}

main();
