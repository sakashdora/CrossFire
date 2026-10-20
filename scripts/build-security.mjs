// Run by Vite before bundling. Errors never include environment values.
export function validatePublicEnvironment(env) {
  const allowed = new Set(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_EMAIL_AUTH_READY', 'VITE_APP_NAME', 'VITE_EVENT_DATE']);
  for (const key of Object.keys(env)) if (key.startsWith('VITE_') && !allowed.has(key)) throw new Error(`Unreviewed public environment variable: ${key}. VITE_ values are sent to every browser.`);
  let url;
  try { url = new URL(env.VITE_SUPABASE_URL); } catch { throw new Error('Set VITE_SUPABASE_URL before building.'); }
  if (url.origin !== 'https://foklyhoplcghivghuebp.supabase.co' || url.username || url.password) throw new Error('This release must target the reviewed CrossFire Supabase project. Review the headers and deployment configuration before changing projects.');
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  if (!key.startsWith('sb_publishable_')) {
    let payload;
    try { payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')); } catch { throw new Error('Use a Supabase publishable or anon key in the public configuration.'); }
    if (payload.role !== 'anon' || payload.ref !== 'foklyhoplcghivghuebp') throw new Error('Only this project’s public anon key may be bundled. Never use a service-role key.');
  }
  if (env.VITE_EMAIL_AUTH_READY && !['true','false'].includes(env.VITE_EMAIL_AUTH_READY)) throw new Error('VITE_EMAIL_AUTH_READY must be true or false.');
}
