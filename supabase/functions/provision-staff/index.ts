import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Service credentials stay in the Edge runtime. Browser callers need an active
// administrator session; database provisioning checks the role again at commit.
Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (Deno.env.get('CROSSFIRE_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean);
  const headers: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
  if (origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.includes(origin)) return reply(403, { error: 'This website is not enabled for staff provisioning.' });
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply(415, { error: 'Use a JSON request.' });
  if (Number(request.headers.get('Content-Length')) > 8192) return reply(413, { error: 'Request is too large.' });
  try {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !secret) return reply(503, { error: 'Staff provisioning is not configured.' });
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return reply(401, { error: 'Sign in to continue.' });
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const service = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await caller.auth.getUser();
  if (authError || !auth.user) return reply(401, { error: 'Your session has expired. Sign in again.' });
  const { data: profile } = await caller.from('users').select('role,active').eq('id', auth.user.id).single();
  if (!profile?.active || !['admin', 'super_admin'].includes(profile.role)) return reply(403, { error: 'An active admin account is required.' });
  let input: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: 'Invalid request.' });
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 8192) { await reader.cancel(); return reply(413, { error: 'Request is too large.' }); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const body = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    input = JSON.parse(new TextDecoder().decode(body));
  } catch { return reply(400, { error: 'Invalid request.' }); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'Invalid request.' });
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const phone = typeof input.contact_number === 'string' ? input.contact_number.trim() : '';
  const role = String(input.role || '');
  const guestId = typeof input.guest_id === 'string' ? input.guest_id : '';
  if (!['volunteer', 'judge', 'vip_guest', 'admin', 'super_admin'].includes(role) || (profile.role !== 'super_admin' && !['volunteer', 'judge', 'vip_guest'].includes(role))) return reply(403, { error: 'Only super admins can create admin-level accounts.' });
  if (role === 'vip_guest' && !/^[0-9a-f-]{36}$/i.test(guestId)) return reply(400, { error: 'Choose the invited guest for this VIP login.' });
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\+?[0-9]{10,13}$/.test(phone) || password.length < 12 || password.length > 200) return reply(400, { error: 'Enter a valid name, email, 10–13 digit phone number, and password of 12–200 characters.' });
  // Check verified identity, current role, MFA and the shared rate limit before
  // creating an Auth account. The database repeats authorization at provisioning.
  const { error: guardError } = await caller.rpc('crossfire_provision_guard');
  if (guardError) return reply(guardError.message?.includes('limit reached') ? 429 : 403, { error: 'Staff provisioning is unavailable. Verify your authenticator and permissions, or try again later if you reached the hourly limit.' });
  // createUser does not send invitation email. The app metadata marker cannot be
  // written by a browser and prevents provisioning unrelated shared-project users.
  const { data: created, error: createError } = await service.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { crossfire_provisioned_by: auth.user.id }, user_metadata: { app: 'crossfire_operations', full_name: name } });
  if (createError || !created.user) return reply(409, { error: 'The account could not be created. The email may already be registered, or the password may not meet the project policy.' });
  const id = created.user.id;
  // The profile requires a password change at first sign-in; this password is single-use.
  const { error: provisionError } = await caller.rpc('crossfire_ops_provision', { p_data: { id, name, role, contact_number: phone, ...(role === 'vip_guest' ? { guest_id: guestId } : {}) } });
  if (provisionError) {
    // Read back first: a transport error can occur after the transaction committed.
    const { data: persisted, error: readError } = await service.from('users').select('id,role,active').eq('id', id).maybeSingle();
    if (persisted?.role === role && persisted.active) return reply(200, { success: true, id });
    if (readError || persisted) return reply(503, { error: 'Account creation could not be verified. Ask a super admin to review Staff access before retrying.' });
    // Compensate only this newly created Auth account, never an existing account.
    const { error: cleanupError } = await service.auth.admin.deleteUser(id);
    return reply(503, { error: cleanupError ? 'Account setup is incomplete. Ask a super admin to review the new account before retrying.' : 'Staff access was not saved. Check the operations database update and your permissions, then retry.' });
  }
  return reply(200, { success: true, id });
  } catch {
    // Do not expose provider responses, credentials or account data on failure.
    return reply(503, { error: 'Staff provisioning could not be verified. Review Staff access before retrying.' });
  }
});
