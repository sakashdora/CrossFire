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
  console.log('[VERIFY-E2E] Starting end-to-end admin CRUD verification...');

  // 1. Authenticate as Super Admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.SUPER_ADMIN_EMAIL || 'trueinspire@gmail.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeSuperAdmin@2026!'
  });

  if (authError || !authData.session) {
    console.error('[FAIL] Could not sign in as Super Admin:', authError);
    process.exit(1);
  }
  console.log('[PASS] Signed in as Super Admin:', authData.user.email);

  // 2. Test Student Deletion
  const testStudentEmail = `e2e_student_${Date.now()}@test.com`;
  // Create student auth account
  const { data: authCreated, error: authCreateErr } = await adminClient.auth.admin.createUser({
    email: testStudentEmail,
    password: 'StudentPass@123',
    email_confirm: true,
    user_metadata: {
      first_name: 'E2E',
      last_name: 'ToDelete',
      role: 'student',
      contact_number: '9861001122',
      school_name: 'Test School',
      city_town: 'Bhubaneswar',
      course_stream: '12th Science',
      board: 'CBSE',
      food_preference: 'Veg'
    }
  });

  if (authCreateErr || !authCreated.user) {
    console.error('[FAIL] Could not create test auth user:', authCreateErr);
    process.exit(1);
  }

  // Ensure record in public.users
  const { data: createdStudent, error: createStudentErr } = await adminClient.from('users').upsert({
    id: authCreated.user.id,
    email: testStudentEmail,
    first_name: 'E2E',
    last_name: 'ToDelete',
    contact_number: '9861001122',
    role: 'student',
    institute_name: 'Test School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg'
  }).select('id, email').single();

  if (createStudentErr) {
    console.error('[FAIL] Could not create test student:', createStudentErr);
    process.exit(1);
  }
  console.log('[PASS] Created test student in Supabase:', createdStudent.email, createdStudent.id);

  // Call admin_delete_student as authenticated super admin
  const { data: delStudentRes, error: delStudentErr } = await supabase.rpc('admin_delete_student', {
    p_student_id: testStudentEmail
  });

  if (delStudentErr) {
    console.error('[FAIL] admin_delete_student RPC failed:', delStudentErr);
    process.exit(1);
  }
  console.log('[PASS] admin_delete_student RPC result:', delStudentRes);

  // Verify gone from public.users
  const { data: checkStudent } = await adminClient.from('users').select('id').eq('email', testStudentEmail).maybeSingle();
  if (checkStudent) {
    console.error('[FAIL] Student still found in database after delete!');
    process.exit(1);
  }
  console.log('[PASS] Verified student permanently removed from database.');

  // 3. Test Volunteer Creation & Deletion
  const testVolId = `VOL-${Date.now().toString().slice(-4)}`;
  const { data: newVolUuid, error: createVolErr } = await supabase.rpc('admin_upsert_volunteer', {
    p_data: {
      volunteer_id: testVolId,
      name: 'E2E Test Volunteer',
      contact_number: '9876543210',
      email: `vol_${Date.now()}@srusti.edu.in`,
      password: 'volpassword123',
      assigned_station: 'Gate 1',
      shift: 'Morning',
      attendance_status: 'Present / On Duty',
      kit_issued: true,
      walkie_channel: 'CH-1',
      notes: 'Automated test volunteer'
    }
  });

  if (createVolErr) {
    console.error('[FAIL] admin_upsert_volunteer RPC failed:', createVolErr);
    process.exit(1);
  }
  console.log('[PASS] admin_upsert_volunteer created volunteer with UUID:', newVolUuid);

  // Verify in public.volunteers
  const { data: checkVol } = await adminClient.from('volunteers').select('*').eq('volunteer_id', testVolId).single();
  console.log('[PASS] Verified volunteer in public.volunteers table:', checkVol.volunteer_id, checkVol.name);

  // Delete volunteer
  const { data: delVolRes, error: delVolErr } = await supabase.rpc('admin_delete_volunteer', {
    p_identifier: testVolId
  });

  if (delVolErr) {
    console.error('[FAIL] admin_delete_volunteer RPC failed:', delVolErr);
    process.exit(1);
  }
  console.log('[PASS] admin_delete_volunteer result:', delVolRes);

  const { data: checkVolAfter } = await adminClient.from('volunteers').select('id').eq('volunteer_id', testVolId).maybeSingle();
  if (checkVolAfter) {
    console.error('[FAIL] Volunteer still found in database after delete!');
    process.exit(1);
  }
  console.log('[PASS] Verified volunteer permanently deleted from database.');

  // 4. Test Guest Creation & Deletion
  const testGuestName = `E2E VIP Guest ${Date.now()}`;
  const { data: newGuestUuid, error: createGuestErr } = await supabase.rpc('admin_upsert_guest', {
    p_data: {
      name: testGuestName,
      designation: 'Special Advisor',
      organization: 'Govt of Odisha',
      category: 'Chief Guest',
      contact_number: '9123456789',
      email: `guest_${Date.now()}@odisha.gov.in`,
      status: 'Confirmed',
      arrival_time: '10:00 AM',
      dietary_preference: 'Veg',
      notes: 'E2E VIP Guest'
    }
  });

  if (createGuestErr) {
    console.error('[FAIL] admin_upsert_guest RPC failed:', createGuestErr);
    process.exit(1);
  }
  console.log('[PASS] admin_upsert_guest created guest with UUID:', newGuestUuid);

  // Verify in public.guests
  const { data: checkGuest } = await adminClient.from('guests').select('*').eq('name', testGuestName).single();
  console.log('[PASS] Verified guest in public.guests table:', checkGuest.name, checkGuest.organization);

  // Delete guest
  const { data: delGuestRes, error: delGuestErr } = await supabase.rpc('admin_delete_guest', {
    p_identifier: testGuestName
  });

  if (delGuestErr) {
    console.error('[FAIL] admin_delete_guest RPC failed:', delGuestErr);
    process.exit(1);
  }
  console.log('[PASS] admin_delete_guest result:', delGuestRes);

  const { data: checkGuestAfter } = await adminClient.from('guests').select('id').eq('name', testGuestName).maybeSingle();
  if (checkGuestAfter) {
    console.error('[FAIL] Guest still found in database after delete!');
    process.exit(1);
  }
  console.log('[PASS] Verified guest permanently deleted from database.');

  console.log('\n[SUCCESS] ALL ADMIN CRUD DATABASE OPERATIONS CONFIRMED WORKING LIVE!');
}

main();
