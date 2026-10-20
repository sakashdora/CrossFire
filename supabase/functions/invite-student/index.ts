import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

// No invitation token, password, provider secret or provider body is returned to
// the administrator. This function never changes shared-project Auth SMTP.
Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  const allowed = (Deno.env.get('CROSSFIRE_ALLOWED_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean);
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.includes(origin)) return reply(403, { error: 'This website is not enabled for student invitations.' });
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply(415, { error: 'Use JSON.' });
  let jobId: string | undefined;
  let sending = false;
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !secret) return reply(503, { error: 'The invitation service is not configured.' });
  const service = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const finish = async (status: string, code: string | null, providerId: string | null = null) => {
    if (!jobId) return false;
    const { error } = await service.rpc('crossfire_finish_invitation', { p_job_id: jobId, p_status: status, p_provider_id: providerId, p_failure_code: code });
    return !error;
  };
  try {
    const authorization = request.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) return reply(401, { error: 'Sign in to continue.' });
    const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await caller.auth.getUser();
    if (authError || !auth.user) return reply(401, { error: 'Sign in again.' });
    // This RPC requires an active, verified admin or super admin at AAL2.
    const { error: accessError } = await caller.rpc('crossfire_mail_configuration');
    if (accessError) return reply(403, { error: 'An active admin account and authenticator verification are required.' });
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: 'Invalid request.' });
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 2048) { await reader.cancel(); return reply(413, { error: 'Request is too large.' }); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let input;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply(400, { error: 'Invalid JSON.' }); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'Invalid request.' });
    const apiKey = Deno.env.get('CROSSFIRE_RESEND_API_KEY');
    const site = Deno.env.get('CROSSFIRE_SITE_URL') || allowed[0];
    const configured = Boolean(apiKey && site && allowed.includes(site) && /^https:\/\/[^/?#]+$/.test(site));
    if (input.action === 'status') return reply(200, { configured, provider: 'Resend' });
    if (Object.keys(input).some(key => !['request_id', 'resend'].includes(key)) || typeof input.request_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.request_id) || (input.resend !== undefined && typeof input.resend !== 'boolean')) return reply(400, { error: 'Select a registration request.' });
    if (!configured) return reply(503, { error: 'The official email service is not connected. Ask the project owner to configure the verified sender domain and server API key.' });
    const { data: prepared, error: prepareError } = await caller.rpc('crossfire_prepare_invitation', { p_request_id: input.request_id, p_resend: input.resend === true });
    if (prepareError) return reply(409, { error: prepareError.code === 'P0001' ? prepareError.message : 'Invitation could not be prepared. Refresh its status before retrying.' });
    jobId = prepared.job_id;
    const id: string = prepared.user_id;
    const email: string = prepared.profile.email;
    const owns = (user: { id: string; email?: string; app_metadata: Record<string, unknown> } | null) => user?.id === id && user.email?.toLowerCase() === email && user.app_metadata.crossfire_request_id === input.request_id;
    const { data: existing, error: lookupError } = await service.auth.admin.getUserById(id);
    if (lookupError && lookupError.status !== 404) throw new Error('Account lookup unavailable');
    if (!existing.user) {
      // A reserved UUID permits safe readback after an ambiguous create response.
      const { data: created, error: createError } = await service.auth.admin.createUser({
        id, email, password: crypto.randomUUID() + crypto.randomUUID(), email_confirm: false,
        app_metadata: { crossfire_request_id: input.request_id, crossfire_invited_by: auth.user.id },
        user_metadata: { app: 'crossfire_student_invitation' },
      });
      if (createError || !owns(created.user)) {
        const { data: readback, error: readError } = await service.auth.admin.getUserById(id);
        if (!owns(readback.user)) {
          await finish(readError && readError.status !== 404 ? 'uncertain' : 'failed', 'account_conflict');
          return reply(409, { error: 'Account creation could not be confirmed. An existing email account is never overwritten. Review the request and account status.' });
        }
      }
    } else if (!owns(existing.user)) {
      await finish('failed', 'account_conflict');
      return reply(409, { error: 'This account does not belong to the reviewed request. Contact the project owner.' });
    }
    const { data: student, error: provisionError } = await caller.rpc('crossfire_provision_student', { p_job_id: jobId });
    if (provisionError) {
      await finish('failed', 'account_setup');
      return reply(409, { error: provisionError.code === 'P0001' ? provisionError.message : 'Account setup could not be confirmed. Refresh and review the invitation status.' });
    }
    const { data: link, error: linkError } = await service.auth.admin.generateLink({ type: 'magiclink', email });
    if (linkError || !link.properties?.hashed_token || !owns(link.user)) {
      await finish('failed', 'link_setup');
      return reply(503, { error: 'The secure setup link could not be generated. Review the invitation status before retrying.' });
    }
    const activation = `${site}/#activate?token_hash=${encodeURIComponent(link.properties.hashed_token)}`;
    const text = `Hello ${prepared.profile.student_name},\n\nYour CrossFire 2026 registration has been approved.\nStudent ID: ${student.student_id}\nPass ID: ${student.pass_id}\nLogin email: ${email}\n\nSet or recover your password securely:\n${activation}\n\nThis link is private and expires. If it expires, ask the college for a new setup link. Your Pass ID identifies your event pass; it is not a password. Never share this setup link.\n\nSrusti Academy of Graduate Studies\nCrossFire Administration`;
    const { error: guardError } = await caller.rpc('crossfire_invitation_send_guard', { p_job_id: jobId });
    if (guardError) {
      await finish('failed', 'access_changed');
      return reply(403, { error: 'Access or invitation settings changed. No email was sent. Refresh before retrying.' });
    }
    sending = true;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `crossfire-student-${jobId}` },
      body: JSON.stringify({ from: `${prepared.sender.sender_name} <${prepared.sender.sender_email}>`, to: [email], reply_to: prepared.sender.reply_to, subject: 'Your CrossFire 2026 student account', text }),
    });
    if (!response.ok) {
      const definite = [400, 401, 403, 404, 422, 429].includes(response.status);
      await finish(definite ? 'failed' : 'uncertain', definite ? 'provider_rejected' : 'delivery_unknown');
      return reply(502, { error: definite ? 'The email provider rejected this invitation. Check the verified sender and provider configuration.' : 'The email delivery outcome is uncertain. Ask the project owner to check the provider logs before resending.' });
    }
    const sent = await response.json();
    if (typeof sent.id !== 'string' || !sent.id) throw new Error('Missing provider receipt');
    if (!await finish('accepted', null, sent.id)) return reply(503, { error: 'The provider accepted the email, but saving its status could not be confirmed. Review provider logs before resending.' });
    return reply(200, { success: true, status: 'accepted', student_id: student.student_id });
  } catch {
    try { await finish(sending ? 'uncertain' : 'failed', sending ? 'delivery_unknown' : 'account_setup'); } catch { /* preserve unresolved job for reconciliation */ }
    return reply(503, { error: 'The invitation outcome could not be confirmed. Refresh its status; unresolved deliveries need review before another send.' });
  }
});
