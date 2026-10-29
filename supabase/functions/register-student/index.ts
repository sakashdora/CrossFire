import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Public student registration. The service credential stays in the Edge runtime.
// SQL validates the form, the registration window, duplicates and rate limits,
// then profile, entries and pass commit together. Every failure either removes
// what this request created or leaves a state the same request ID can resume.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (Deno.env.get('CROSSFIRE_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean);
  const headers: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
  if (origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.includes(origin)) return reply(403, { error: 'This website is not enabled for student registration.' });
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply(415, { error: 'Use a JSON request.' });
  if (Number(request.headers.get('Content-Length')) > 8192) return reply(413, { error: 'Request is too large.' });
  const url = Deno.env.get('SUPABASE_URL');
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !secret) return reply(503, { error: 'Registration is temporarily unavailable. Please try again later.' });
  const service = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  let requestId = '';
  let owned = false;
  // After a definite SQL failure no profile exists; remove only the identity marked for this request.
  const compensate = async (userId: string) => {
    if (owned) await service.auth.admin.deleteUser(userId);
    await service.rpc('crossfire_abandon_student_registration', { p_request_id: requestId });
  };
  try {
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
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['request_id', 'profile', 'password'].includes(key))) return reply(400, { error: 'Invalid request.' });
    const password = typeof input.password === 'string' ? input.password : '';
    if (typeof input.request_id !== 'string' || !uuid.test(input.request_id) || !input.profile || typeof input.profile !== 'object') return reply(400, { error: 'Invalid registration data. Refresh the page and try again.' });
    if (password.length < 8 || password.length > 72) return reply(400, { error: 'Choose a password of 8 to 72 characters.', field: 'password' });
    const profileEmail = typeof (input.profile as Record<string, unknown>).email === 'string' ? String((input.profile as Record<string, unknown>).email).trim().toLowerCase() : '';
    if (profileEmail && profileEmail === password.trim().toLowerCase()) return reply(400, { error: 'Do not use your email address as your password.', field: 'password' });
    requestId = input.request_id;

    const { data: reserved, error: beginError } = await service.rpc('crossfire_begin_student_registration', { p_request_id: requestId, p_profile: input.profile });
    if (beginError) return beginError.code === 'P0001' ? reply(/limit reached/.test(beginError.message) ? 429 : /already (registered|used)|closed/i.test(beginError.message) ? 409 : 400, { error: beginError.message }) : reply(503, { error: 'Registration could not be confirmed. Retry with the same details.' });
    const userId: string = reserved.user_id;
    const email: string = reserved.email;
    for (const stale of Array.isArray(reserved.stale_user_ids) ? reserved.stale_user_ids : []) {
      // Released by SQL only when no profile exists. Remove only the matching marked identity.
      const { data } = await service.auth.admin.getUserById(stale);
      if (data?.user?.app_metadata?.crossfire_request_id && data.user.email?.toLowerCase() === email) await service.auth.admin.deleteUser(stale);
    }

    if (reserved.status === 'registering') {
      const owns = (user: { id: string; email?: string; app_metadata: Record<string, unknown> } | null | undefined) => user?.id === userId && user.email?.toLowerCase() === email && user.app_metadata?.crossfire_request_id === requestId;
      const { data: existing, error: lookupError } = await service.auth.admin.getUserById(userId);
      if (lookupError && lookupError.status !== 404) return reply(503, { error: 'Registration could not be confirmed. Retry with the same details.' });
      if (existing?.user && !owns(existing.user)) { await service.rpc('crossfire_abandon_student_registration', { p_request_id: requestId }); return reply(409, { error: 'This registration could not be completed. Contact the organisers.' }); }
      if (!existing?.user) {
        // Email ownership is not verified by this flow. The reserved ID makes an
        // ambiguous create response safe to read back on retry.
        const { data: account, error: createError } = await service.auth.admin.createUser({
          id: userId, email, password, email_confirm: true,
          app_metadata: { crossfire_request_id: requestId }, user_metadata: { app: 'crossfire_student_registration' },
        });
        if (createError || !owns(account?.user)) {
          const { data: readback } = await service.auth.admin.getUserById(userId);
          if (!owns(readback?.user)) {
            await service.rpc('crossfire_abandon_student_registration', { p_request_id: requestId });
            const code = (createError as { code?: string } | null)?.code;
            if (code === 'weak_password') return reply(400, { error: 'Choose a stronger password.', field: 'password' });
            if (code === 'email_exists' || /already (been )?registered/i.test(createError?.message || '')) return reply(409, { error: 'This email is already registered. Sign in with your password, or ask the organisers for a password reset link.' });
            return reply(503, { error: 'Your login could not be created. Please try again.' });
          }
        }
      }
      owned = true;
    }

    const { data: receipt, error: completeError } = await service.rpc('crossfire_complete_student_registration', { p_request_id: requestId });
    if (completeError) {
      if (completeError.code === 'P0001') { await compensate(userId); return reply(409, { error: completeError.message }); }
      // A transport error may follow a commit; the same request ID resumes safely.
      return reply(503, { error: 'Registration could not be confirmed. Retry with the same details.' });
    }
    return reply(200, { success: true, receipt });
  } catch {
    // Never echo provider responses, credentials or the submitted password.
    return reply(503, { error: 'Registration could not be confirmed. Retry with the same details.' });
  }
});
