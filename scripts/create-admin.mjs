import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'chandanmahapatra2400@gmail.com';
  const password = '8328863317@';

  // Create user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('Error creating auth user:', authError);
    return;
  }

  // Get user ID
  let userId;
  if (authData?.user) {
    userId = authData.user.id;
  } else {
    // If user exists, find them
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return console.error('Error listing users', listError);
    const existing = users.users.find(u => u.email === email);
    if (!existing) return console.error('Could not find existing user');
    userId = existing.id;
  }

  // Wait for the trigger to fire
  await new Promise(res => setTimeout(res, 2000));

  // Update public.users role to admin
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      role: 'admin',
      first_name: 'Super',
      last_name: 'Admin'
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error making user admin:', updateError);
    return;
  }

  console.log(`Successfully created and granted admin role to:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

createAdmin();
