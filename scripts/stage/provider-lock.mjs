// Part A: does the real Auth service keep an identity locked from creation?
// Every assertion about access uses a fresh anon-key client. The service key only
// creates fixtures and reads state back.
import { createAuthUser, snapshot, sameIdentity, forbid, secret, newRequestId } from './context.mjs';
import { errorSummary } from './guard.mjs';
import { StageError } from './report.mjs';

const LOCK = '876000h';
const future = value => Boolean(value) && Date.parse(value) > Date.now() + 365 * 24 * 3600 * 1000;
const sessionOf = result => result?.data?.session || null;

// Tries every token the message carries. Returns the first session, if any.
async function redeem(client, tokens, email, fallbackType) {
  const attempts = [];
  if (tokens.tokenHash) {
    const result = await client.auth.verifyOtp({ token_hash: tokens.tokenHash, type: tokens.type || fallbackType });
    attempts.push('link: ' + errorSummary(result.error));
    if (sessionOf(result)) return { session: sessionOf(result), attempts };
  }
  if (tokens.code) {
    const result = await client.auth.verifyOtp({ email, token: tokens.code, type: fallbackType === 'recovery' ? 'recovery' : 'email' });
    attempts.push('code: ' + errorSummary(result.error));
    if (sessionOf(result)) return { session: sessionOf(result), attempts };
  }
  if (!attempts.length) attempts.push('no link or code found in the message');
  return { session: null, attempts };
}

// Requests mail through a public endpoint, then redeems whatever arrives.
async function mailFlow(stage, request, email, type) {
  const existing = await stage.inbox.existingIds(email);
  const since = Date.now();
  let ack = await request();
  if (ack.error?.status === 429) {
    // The stage has a one-second interval between emails to the same address.
    await new Promise(resolve => setTimeout(resolve, 1500));
    ack = await request();
  }
  if (ack.error && ack.error.code !== 'user_banned') {
    throw new StageError('Mail request did not exercise the intended path: ' + errorSummary(ack.error));
  }
  const message = await stage.inbox.waitFor(email, since, ack.error ? 4000 : 12000, existing);
  if (message && !message.tokens.tokenHash && !message.tokens.code) throw new StageError('New mail had no redeemable link or code.');
  if (!message) return { ack, message: null, session: null, attempts: [] };
  const { session, attempts } = await redeem(stage.fresh(), message.tokens, email, type);
  return { ack, message, session, attempts };
}

export async function runProviderProof(stage, report) {
  const { admin } = stage;
  const fixtures = {};

  // ---------------------------------------------------------------- controls
  await report.run('A-C1', 'control', 'Confirmed user: password grant, own user, refresh', 'session, same user, refreshed session', async () => {
    const email = stage.email('control-password'), password = secret();
    const created = await createAuthUser(stage, { email, password, email_confirm: true, app_metadata: { crossfire_stage_fixture: 'control' } });
    if (created.error) return { ok: false, observed: 'fixture create failed: ' + errorSummary(created.error) };
    const client = stage.fresh();
    const signIn = await client.auth.signInWithPassword({ email, password });
    const session = sessionOf(signIn);
    if (!session) return { ok: false, observed: 'no session: ' + errorSummary(signIn.error) };
    const user = await client.auth.getUser(session.access_token);
    const refreshed = await client.auth.refreshSession({ refresh_token: session.refresh_token });
    const ok = user.data?.user?.id === created.data.user.id && Boolean(sessionOf(refreshed)) && sessionOf(refreshed).refresh_token !== session.refresh_token;
    return { ok, observed: `session issued; own user ${user.data?.user?.id === created.data.user.id ? 'matched' : 'mismatch'}; refresh ${sessionOf(refreshed) ? 'rotated' : errorSummary(refreshed.error)}` };
  });
  for (const { id, label, type, send } of [
    { id: 'A-C2', label: 'Confirmed user: magic link from the test inbox opens a session', type: 'magiclink', send: (client, email) => client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }) },
    { id: 'A-C3', label: 'Confirmed user: recovery message from the test inbox opens a session', type: 'recovery', send: (client, email) => client.auth.resetPasswordForEmail(email) },
  ]) {
    await report.run(id, 'control', label, 'message delivered; redemption opens a working session', async () => {
      const email = stage.email('control-' + type);
      const created = await createAuthUser(stage, { email, password: secret(), email_confirm: true, app_metadata: { crossfire_stage_fixture: 'control' } });
      if (created.error) return { ok: false, observed: 'fixture create failed: ' + errorSummary(created.error) };
      const flow = await mailFlow(stage, () => send(stage.fresh(), email), email, type);
      if (!flow.message) return { ok: false, observed: 'no message in the test inbox; request ' + errorSummary(flow.ack.error) };
      const user = flow.session ? await stage.fresh().auth.getUser(flow.session.access_token) : null;
      const ok = user?.data?.user?.id === created.data.user.id;
      return { ok, observed: ok ? 'message delivered; redemption opened a working session' : 'message delivered; ' + flow.attempts.join('; ') };
    });
  }
  const controlsOk = report.of('control').every(item => item.status === 'pass');
  const negative = async (id, name, expected, fn) => controlsOk
    ? report.run(id, 'provider', name, expected, fn)
    : report.block(id, 'provider', name, expected, 'inconclusive: a positive control failed (mail, rate limit or provider configuration)');

  // ------------------------------------------------- atomic lock at creation
  const locked = { id: newRequestId(), email: stage.email('locked-subject'), bootstrap: secret(), request: newRequestId() };
  await negative('A-L0', 'Locked subject created at a reserved UUID with the ban in the initial Admin create', 'same UUID; ban effective in the create response and readback; email unconfirmed; marker set', async () => {
    const created = await createAuthUser(stage, { id: locked.id, email: locked.email, password: locked.bootstrap, email_confirm: false, ban_duration: LOCK,
      app_metadata: { crossfire_stage_fixture: 'locked-subject', crossfire_request_id: locked.request } });
    if (created.error || created.data?.user?.id !== locked.id) return { ok: false, observed: 'create at reserved UUID failed: ' + errorSummary(created.error) };
    const readback = await admin.auth.admin.getUserById(locked.id);
    locked.before = await snapshot(stage, locked.id);
    const atCreate = future(created.data.user.banned_until), atRead = future(readback.data?.user?.banned_until);
    const ok = atCreate && atRead && locked.before?.banned && !locked.before.confirmed && !readback.data?.user?.email_confirmed_at
      && locked.before.app?.crossfire_request_id === locked.request;
    fixtures.atomic = ok;
    return { ok, observed: `ban in create response: ${atCreate ? 'yes' : 'NO'}; readback ban: ${atRead ? 'yes' : 'NO'}; unconfirmed: ${!locked.before?.confirmed}; marker: ${locked.before?.app?.crossfire_request_id === locked.request ? 'set' : 'missing'}` };
  });
  await negative('A-L1', 'Locked subject: password grant with the correct bootstrap password', 'no session', async () => {
    const result = await stage.fresh().auth.signInWithPassword({ email: locked.email, password: locked.bootstrap });
    const leaked = await forbid(stage, report, sessionOf(result));
    return { ok: !leaked, observed: leaked ? 'SESSION ISSUED' : 'denied: ' + errorSummary(result.error) };
  });
  await negative('A-L2', 'Locked subject: duplicate public signup with client-controlled metadata', 'no session; password, email, marker and metadata unchanged; any confirmation link yields no session', async () => {
    const flow = await mailFlow(stage, () => stage.fresh().auth.signUp({ email: locked.email, password: secret(), options: { data: { app: 'crossfire', role: 'admin' } } }), locked.email, 'signup');
    const signupLeak = await forbid(stage, report, sessionOf(flow.ack)), linkLeak = await forbid(stage, report, flow.session);
    const leaked = signupLeak || linkLeak;
    const after = await snapshot(stage, locked.id);
    const ok = !leaked && sameIdentity(locked.before, after);
    return { ok, observed: `signup ${errorSummary(flow.ack.error)}; ${flow.message ? 'message sent; ' + flow.attempts.join('; ') : 'no message'}; identity ${sameIdentity(locked.before, after) ? 'unchanged' : 'CHANGED'}${after?.confirmed ? '; email now confirmed' : ''}${leaked ? '; SESSION ISSUED' : ''}` };
  });
  await negative('A-L3', 'Locked subject: magic link / OTP request and redemption', 'no session; identity unchanged', async () => {
    const flow = await mailFlow(stage, () => stage.fresh().auth.signInWithOtp({ email: locked.email, options: { shouldCreateUser: false } }), locked.email, 'magiclink');
    const leaked = await forbid(stage, report, flow.session);
    const after = await snapshot(stage, locked.id);
    return { ok: !leaked && sameIdentity(locked.before, after), observed: `request ${errorSummary(flow.ack.error)}; ${flow.message ? 'message sent; ' + flow.attempts.join('; ') : 'no message'}; identity ${sameIdentity(locked.before, after) ? 'unchanged' : 'CHANGED'}${after?.confirmed ? '; email now confirmed' : ''}${leaked ? '; SESSION ISSUED' : ''}` };
  });
  await negative('A-L4', 'Locked subject: password recovery request and redemption', 'no session; password digest unchanged', async () => {
    const flow = await mailFlow(stage, () => stage.fresh().auth.resetPasswordForEmail(locked.email), locked.email, 'recovery');
    const leaked = await forbid(stage, report, flow.session);
    const after = await snapshot(stage, locked.id);
    return { ok: !leaked && sameIdentity(locked.before, after), observed: `request ${errorSummary(flow.ack.error)}; ${flow.message ? 'message sent; ' + flow.attempts.join('; ') : 'no message'}; identity ${sameIdentity(locked.before, after) ? 'unchanged' : 'CHANGED'}${leaked ? '; SESSION ISSUED' : ''}` };
  });
  await negative('A-L5', 'Locked subject: UUID, email, marker, metadata, password and ban unchanged after all attempts', 'unchanged', async () => {
    const after = await snapshot(stage, locked.id);
    return { ok: sameIdentity(locked.before, after), observed: (sameIdentity(locked.before, after) ? 'unchanged' : 'CHANGED') + (after?.confirmed ? ' (email confirmation flag was set by a redeemed link)' : '; email still unconfirmed') };
  });

  // --------------------------------- ban versus missing email confirmation
  const banned = { email: stage.email('confirmed-banned'), password: secret() };
  await negative('A-L6', 'Confirmed but banned at creation: password grant and magic link', 'no session from either path', async () => {
    const created = await createAuthUser(stage, { email: banned.email, password: banned.password, email_confirm: true, ban_duration: LOCK, app_metadata: { crossfire_stage_fixture: 'confirmed-banned' } });
    if (created.error || !future(created.data?.user?.banned_until)) return { ok: false, observed: 'ban not effective at create: ' + errorSummary(created.error) };
    const signIn = await stage.fresh().auth.signInWithPassword({ email: banned.email, password: banned.password });
    const flow = await mailFlow(stage, () => stage.fresh().auth.signInWithOtp({ email: banned.email, options: { shouldCreateUser: false } }), banned.email, 'magiclink');
    const passwordLeak = await forbid(stage, report, sessionOf(signIn)), linkLeak = await forbid(stage, report, flow.session);
    const leaked = passwordLeak || linkLeak;
    return { ok: !leaked, observed: `password ${sessionOf(signIn) ? 'SESSION ISSUED' : 'denied: ' + errorSummary(signIn.error)}; magic link ${flow.message ? flow.attempts.join('; ') : 'no message'}${flow.session ? '; SESSION ISSUED' : ''}` };
  });

  // ------------------------------------------- sessions obtained before a lock
  const prior = { email: stage.email('locked-after-session'), password: secret() };
  await negative('A-L7', 'Session obtained before a later ban: refresh token', 'refresh denied by Auth', async () => {
    const created = await createAuthUser(stage, { email: prior.email, password: prior.password, email_confirm: true, app_metadata: { crossfire_stage_fixture: 'locked-after-session' } });
    if (created.error) return { ok: false, observed: 'fixture create failed: ' + errorSummary(created.error) };
    const session = sessionOf(await stage.fresh().auth.signInWithPassword({ email: prior.email, password: prior.password }));
    if (!session) return { ok: false, blocked: true, observed: 'could not obtain the pre-lock session' };
    prior.session = session;
    const lock = await admin.auth.admin.updateUserById(created.data.user.id, { ban_duration: LOCK });
    if (lock.error) return { ok: false, blocked: true, observed: 'ban update failed: ' + errorSummary(lock.error) };
    const refreshed = await stage.fresh().auth.refreshSession({ refresh_token: session.refresh_token });
    const leaked = await forbid(stage, report, sessionOf(refreshed));
    return { ok: !leaked, observed: leaked ? 'REFRESH ISSUED A SESSION' : 'refresh denied: ' + errorSummary(refreshed.error) };
  });
  await negative('A-L8', 'Session obtained before a later ban: unexpired access JWT at Auth /user', 'recorded; CrossFire data paths must deny it independently (Part B)', async () => {
    if (!prior.session) return { ok: false, blocked: true, observed: 'no pre-lock session' };
    const user = await stage.fresh().auth.getUser(prior.session.access_token);
    return { ok: true, observed: user.data?.user ? 'access JWT still accepted by Auth /user until expiry' : 'access JWT rejected: ' + errorSummary(user.error) };
  });

  // ------------------------------------------------ positive inverse (control)
  await negative('A-L9', 'Released fixture: new test credential works; the bootstrap secret fails', 'old secret denied while locked; after release new secret signs in and bootstrap fails', async () => {
    const release = { id: newRequestId(), email: stage.email('released'), bootstrap: secret(), next: secret() };
    const created = await createAuthUser(stage, { id: release.id, email: release.email, password: release.bootstrap, email_confirm: false, ban_duration: LOCK, app_metadata: { crossfire_stage_fixture: 'released' } });
    if (created.error || !future(created.data?.user?.banned_until)) return { ok: false, observed: 'locked fixture create failed: ' + errorSummary(created.error) };
    const lockedTry = await stage.fresh().auth.signInWithPassword({ email: release.email, password: release.bootstrap });
    const leaked = await forbid(stage, report, sessionOf(lockedTry));
    const update = await admin.auth.admin.updateUserById(release.id, { password: release.next, email_confirm: true, ban_duration: 'none' });
    if (update.error) return { ok: false, observed: 'release failed: ' + errorSummary(update.error) };
    const fresh = await stage.fresh().auth.signInWithPassword({ email: release.email, password: release.next });
    const old = await stage.fresh().auth.signInWithPassword({ email: release.email, password: release.bootstrap });
    const oldLeaked = await forbid(stage, report, sessionOf(old));
    const ok = !leaked && Boolean(sessionOf(fresh)) && !oldLeaked;
    return { ok, observed: `while locked ${leaked ? 'SESSION ISSUED' : 'denied'}; new credential ${sessionOf(fresh) ? 'signed in' : 'failed: ' + errorSummary(fresh.error)}; bootstrap ${oldLeaked ? 'SESSION ISSUED' : 'denied'}` };
  });
  return fixtures;
}
