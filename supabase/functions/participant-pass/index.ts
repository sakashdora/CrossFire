import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Lets a registered participant who lost their student ID or QR get their own pass
// back with the email address and mobile number they registered with. Public by
// design (no sign-in), so everything is validated, rate-limited in the database,
// and every non-match gets the same answer.
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');

async function readInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error();
  const buffer = new Uint8Array(1024);
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (length + value.byteLength > buffer.length) { await reader.cancel(); throw new Error(); }
      buffer.set(value, length); length += value.byteLength;
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(new TextDecoder().decode(buffer.subarray(0, length)));
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  const allowed = (Deno.env.get('CROSSFIRE_ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean);
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.includes(origin)) return reply(403, { error: 'This website is not enabled for pass lookup.' });
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply(415, { error: 'Use a JSON request.' });
  let input: Record<string, unknown>;
  try { input = await readInput(request); } catch { return reply(400, { error: 'Invalid request.' }); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'Invalid request.' });
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const phone = typeof input.phone === 'string' ? input.phone.replace(/[^0-9]/g, '').slice(-10) : '';
  if (email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9]{10}$/.test(phone) || (typeof input.phone === 'string' && input.phone.length > 20)) {
    return reply(400, { error: 'Enter the email address and 10-digit mobile number you registered with.' });
  }
  const url = Deno.env.get('SUPABASE_URL'), secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !secret) return reply(503, { error: 'Pass lookup is unavailable right now. Please ask the help desk.' });
  try {
    const service = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    // Only a hash of the network address is stored, as a coarse abuse limit.
    const address = (request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown').split(',')[0].trim();
    const client = hex(await crypto.subtle.digest('SHA-256', encoder.encode(address))).slice(0, 32);
    const { data, error } = await service.rpc('crossfire_participant_pass', { p_email: email, p_phone: phone, p_client: client });
    if (error) {
      if (error.message?.includes('Too many attempts')) return reply(429, { error: 'Too many attempts. Please wait a few minutes and try again, or ask the help desk.' });
      return reply(503, { error: 'Pass lookup is unavailable right now. Please ask the help desk.' });
    }
    if (!data?.found || !data.pass) return reply(404, { error: 'We could not match those details. Check the email and mobile number you registered with, or ask the help desk.' });
    return reply(200, { pass: data.pass });
  } catch {
    return reply(503, { error: 'Pass lookup is unavailable right now. Please ask the help desk.' });
  }
});
