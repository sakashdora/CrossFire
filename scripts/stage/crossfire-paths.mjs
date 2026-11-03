// Part B: CrossFire data paths on the real Postgres and PostgREST of the stage.
// This drives the lower-level registration RPCs that register-student calls; it does
// not test the public register-student endpoint itself.
import { readFile } from 'node:fs/promises';
import { randomInt } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { CREDENTIAL_CUTOVER, STAGE_LOAD_ORDER, stageSchemaParts, sha256, errorSummary } from './guard.mjs';
import { createAuthUser, forbid, secret, newRequestId } from './context.mjs';
import { totp } from './totp.mjs';
import { StageError } from './report.mjs';

const LOCK = '876000h';
const repo = path => new URL('../../' + path, import.meta.url);
const sessionOf = result => result?.data?.session || null;

// Loads the reviewed schema and migrations once per disposable database, in the
// order production applied them, and records each step's checksum in the stage ledger.
async function loadCrossfire(stage, report) {
  const { db } = stage;
  const schema = await readFile(repo('supabase/schema.sql'));
  const parts = stageSchemaParts(schema.toString('utf8'));
  const plan = [
    { name: 'schema.sql#sections-1-12', sql: parts.base },
    { name: 'schema.sql#section-14-settings-only', sql: parts.settings },
    { name: 'schema.sql#sections-15-16', sql: parts.tail },
  ];
  for (const name of STAGE_LOAD_ORDER) plan.push({ name, sql: (await readFile(repo('supabase/migrations/' + name))).toString('utf8') });
  for (const step of plan) step.sha = sha256(step.sql);

  const applied = (await db.query('select name,sha256 from crossfire_stage.applied order by applied_at,name')).rows;
  if (applied.length) {
    const same = applied.length === plan.length && plan.every(step => applied.some(row => row.name === step.name && row.sha256 === step.sha));
    if (!same) throw new StageError('This stage already holds a different CrossFire load. Reset the disposable stage database before rerunning.');
    report.note('CrossFire schema already loaded on this stage with identical checksums; not replayed.');
  } else {
    if ((await db.query("select to_regclass('public.users') is not null as present")).rows[0].present) throw new StageError('The stage already has a public.users table that this harness did not load. Use a fresh stage database.');
    for (const step of plan) {
      try { await db.query(step.sql); } catch (error) { throw new StageError(`Loading ${step.name} failed (${error.code || 'error'}). The stage may need a reset.`); }
      await db.query('insert into crossfire_stage.applied(name,sha256) values($1,$2)', [step.name, step.sha]);
    }
    report.note(`Loaded schema.sql (seed sections 13-14 skipped except the settings row) and ${STAGE_LOAD_ORDER.length} migrations in the reviewed production order.`);
  }
  await db.query("notify pgrst, 'reload schema'");
  for (let attempt = 0; attempt < 30; attempt++) {
    const probe = await stage.fresh().rpc('get_system_setting', { p_key: 'student_registration_open' });
    if (!probe.error) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new StageError('PostgREST did not expose the loaded CrossFire schema.');
}

// Effective definitions on the real provider, checked before interpreting results.
async function definitions(stage, report) {
  const { db } = stage;
  const one = async (sql, args) => Object.values((await db.query(sql, args)).rows[0] || {})[0];
  await report.run('B-D1', 'crossfire', 'Effective signup trigger and neutralised auto-confirm', 'profile trigger active for app=crossfire; auto-confirm is a no-op', async () => {
    const triggers = (await db.query("select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal and tgenabled<>'D'")).rows.map(row => row.tgname);
    const handler = await one("select pg_get_functiondef('public.crossfire_handle_new_user()'::regprocedure)");
    const confirm = await one("select regexp_replace(prosrc,'\\s','','g') from pg_proc where oid='public.crossfire_auto_confirm_user()'::regprocedure");
    const ok = triggers.includes('crossfire_on_auth_user_created') && /'crossfire'/.test(handler) && /insert into public\.users/i.test(handler) && confirm === 'beginreturnnew;end';
    return { ok, observed: `auth.users triggers: ${triggers.filter(name => name.startsWith('crossfire') || name.startsWith('tr_crossfire')).join(', ') || 'none'}; profile trigger ${/'crossfire'/.test(handler) ? 'inserts a student profile for app=crossfire' : 'changed'}; auto-confirm ${confirm === 'beginreturnnew;end' ? 'no-op' : 'ACTIVE'}` };
  });
  await report.run('B-D2', 'crossfire', 'Effective restrictive RLS and role resolver', '9 restrictive crossfire_active_session policies; current_user_role checks confirmation, password change and super-admin AAL2', async () => {
    const restrictive = Number(await one("select count(*) from pg_policies where schemaname='public' and policyname='crossfire_active_session' and permissive='RESTRICTIVE'"));
    const role = await one("select prosrc from pg_proc where oid='public.current_user_role()'::regprocedure");
    const ok = restrictive === 9 && /email_confirmed_at/.test(role) && /must_change_password/.test(role) && /aal2/.test(role) && !/student_portal_open/.test(role);
    return { ok, observed: `${restrictive} restrictive policies; resolver ${ok ? 'matches the 20261030090100 definition' : 'differs'}` };
  });
  await report.run('B-D3', 'crossfire', 'Effective grants on intake and profile bootstrap functions', 'begin/complete service_role only; retired intake and ensure_profile not executable by browsers', async () => {
    const can = (role, fn) => one('select has_function_privilege($1,$2,\'execute\')', [role, fn]);
    const begin = 'public.crossfire_begin_student_registration(uuid,jsonb)', complete = 'public.crossfire_complete_student_registration(uuid)';
    const checks = [
      [await can('service_role', begin), true], [await can('anon', begin), false], [await can('authenticated', begin), false],
      [await can('service_role', complete), true], [await can('authenticated', complete), false],
      [await can('anon', 'public.crossfire_submit_registration_request(uuid,jsonb)'), false],
      [await can('authenticated', 'public.ensure_profile()'), false],
    ];
    const ok = checks.every(([actual, expected]) => actual === expected);
    return { ok, observed: ok ? 'grants as reviewed' : `${checks.filter(([a, e]) => a !== e).length} grant(s) differ` };
  });
}

export async function runCrossfirePaths(stage, report) {
  const { db, admin, service } = stage;
  await loadCrossfire(stage, report);
  await definitions(stage, report);

  // Synthetic events and staff. Staff profiles are inserted as fixtures, the way
  // crossfire_ops_provision would leave them after provisioning.
  const tag = stage.runTag;
  const events = [];
  for (const n of [1, 2]) {
    const name = `Stage Event ${n} ${tag}`;
    await db.query(`insert into public.events(name,slug,event_group,description,event_icon,event_type,team_size,prize_pool,scoring_rubric,start_time,end_time,registration_deadline,venue_location)
      values($1,$2,'Group A','Synthetic stage event','test','solo',1,100,'{"criteria":[]}',now()+interval '2 days',now()+interval '3 days',now()+interval '1 day','Stage Hall')`, [name, `stage-event-${n}-${tag}`]);
    events.push(name);
  }
  const people = {};
  const staff = async (key, role) => {
    const email = stage.email('staff-' + key), password = secret();
    const created = await createAuthUser(stage, { email, password, email_confirm: true, app_metadata: { crossfire_stage_fixture: 'staff-' + key } });
    if (created.error) throw new StageError(`Staff fixture ${key} could not be created: ${errorSummary(created.error)}`);
    await db.query(`insert into public.users(id,email,first_name,role,contact_number) values($1,$2,$3,$4::public.user_role,'9000000000')`, [created.data.user.id, email, 'Stage ' + key, role]);
    people[key] = { id: created.data.user.id, email, password };
  };
  await staff('admin', 'admin'); await staff('super', 'super_admin'); await staff('gate', 'volunteer');
  await db.query(`insert into public.volunteers(user_id,volunteer_id,name,contact_number,email,password,ops_station,attendance_status) values($1,$2,'Stage gate','9000000000',$3,null,'gate','Present / On Duty')`, [people.gate.id, 'VOL-STAGE' + tag.toUpperCase(), people.gate.email]);

  const signIn = async ({ email, password }) => {
    const client = stage.fresh();
    const result = await client.auth.signInWithPassword({ email, password });
    return { client, session: sessionOf(result), error: result.error };
  };
  const asToken = token => createClient(stage.config.apiUrl, stage.config.anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: stage.fetch, headers: { Authorization: 'Bearer ' + token } } });

  // Mirrors register-student: begin -> Auth identity at the reserved UUID -> complete.
  const register = async (label, mode) => {
    const requestId = newRequestId(), password = secret();
    const digits = String(randomInt(100000000, 999999999));
    const profile = { student_name: 'Stage Student ' + label, email: stage.email('student-' + label), contact_number: '9' + digits, whatsapp_number: '9' + digits,
      institute_name: 'Stage School', city_town: 'Stage City', course_stream: '12th Science', board: 'CBSE', food_preference: 'Veg',
      selected_competitions: events, parent_consent: true, terms_accepted: true, website: '' };
    const begin = await service.rpc('crossfire_begin_student_registration', { p_request_id: requestId, p_profile: profile });
    if (begin.error) throw new StageError(`begin (${label}) failed: ${errorSummary(begin.error)}`);
    const created = await createAuthUser(stage, {
      id: begin.data.user_id, email: begin.data.email, password,
      email_confirm: mode !== 'locked', ...(mode === 'locked' ? { ban_duration: LOCK } : {}),
      app_metadata: { crossfire_request_id: requestId, crossfire_stage_fixture: 'student-' + label }, user_metadata: { app: 'crossfire_student_registration' },
    });
    if (created.error) throw new StageError(`Auth identity (${label}) failed: ${errorSummary(created.error)}`);
    const complete = await service.rpc('crossfire_complete_student_registration', { p_request_id: requestId });
    if (complete.error) throw new StageError(`complete (${label}) failed: ${errorSummary(complete.error)}`);
    return { requestId, profile, password, userId: begin.data.user_id, receipt: complete.data };
  };

  // ------------------------------------------------------- positive controls
  let superClient = null;
  await report.run('B-S1', 'crossfire', 'Staff controls: admin, volunteer, super admin at AAL1 and AAL2', 'admin, volunteer, none at AAL1, super_admin at AAL2', async () => {
    const roles = {};
    for (const key of ['admin', 'gate']) {
      const { client, session, error } = await signIn(people[key]);
      if (!session) return { ok: false, observed: `${key} sign-in failed: ${errorSummary(error)}` };
      people[key].client = client;
      roles[key] = (await client.rpc('current_user_role')).data;
    }
    const sup = await signIn(people.super);
    if (!sup.session) return { ok: false, observed: 'super admin sign-in failed: ' + errorSummary(sup.error) };
    roles.superAal1 = (await sup.client.rpc('current_user_role')).data;
    const enroll = await sup.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'stage-' + tag });
    if (enroll.error) return { ok: false, blocked: true, observed: 'TOTP enrolment unavailable: ' + errorSummary(enroll.error) + ' (enable [auth.mfa.totp])' };
    const verify = await sup.client.auth.mfa.challengeAndVerify({ factorId: enroll.data.id, code: totp(enroll.data.totp.secret) });
    if (verify.error) return { ok: false, blocked: true, observed: 'TOTP verification failed: ' + errorSummary(verify.error) };
    roles.superAal2 = (await sup.client.rpc('current_user_role')).data;
    superClient = sup.client;
    const ok = roles.admin === 'admin' && roles.gate === 'volunteer' && roles.superAal1 === null && roles.superAal2 === 'super_admin';
    return { ok, observed: `admin=${roles.admin}; volunteer=${roles.gate}; super AAL1=${roles.superAal1}; super AAL2=${roles.superAal2}` };
  });

  let legacy = null;
  await report.run('B-S2', 'crossfire', 'Legacy student control (current confirmed-login registration)', 'student role; own profile with matching CFS ID; own row via REST', async () => {
    legacy = await register('legacy', 'legacy');
    const { client, session, error } = await signIn({ email: legacy.profile.email, password: legacy.password });
    if (!session) return { ok: false, observed: 'sign-in failed: ' + errorSummary(error) };
    legacy.client = client;
    const role = (await client.rpc('current_user_role')).data;
    const profile = await client.rpc('crossfire_current_profile');
    const rows = await client.from('users').select('id');
    const ok = role === 'student' && profile.data?.student_id === legacy.receipt.student_id && rows.data?.length === 1;
    return { ok, observed: `role=${role}; profile ${profile.data?.student_id === legacy.receipt.student_id ? 'matched' : errorSummary(profile.error)}; own rows=${rows.data?.length ?? errorSummary(rows.error)}` };
  });

  // Register the legacy control on the previous schema, then test the actual cutover.
  const cutover = CREDENTIAL_CUTOVER;
  const sql = await readFile(repo('supabase/migrations/' + cutover), 'utf8');
  await db.query('begin');
  try {
    await db.query(sql);
    await db.query('insert into crossfire_stage.applied(name,sha256) values($1,$2)', [cutover, sha256(sql)]);
    await db.query("notify pgrst, 'reload schema'");
    await db.query('commit');
  } catch (error) {
    await db.query('rollback');
    throw new StageError('Credential migration failed (' + (error.code || 'error') + '). Start with a fresh stage.');
  }
  report.note('Applied the credential migration after the legacy-student control.');
  // ------------------------------------------- new cohort: locked identity
  let fresh = null;
  await report.run('B-R1', 'crossfire', 'Registration with a locked Auth identity commits acknowledgement, CFS ID, CF26 pass and entries', 'one request; CFS-, CFREQ-, CF26- values; 2 event entries', async () => {
    fresh = await register('locked', 'locked');
    const r = fresh.receipt;
    const requests = Number((await db.query('select count(*) from public.crossfire_registration_requests where id=$1 and status=$2', [fresh.requestId, 'registered'])).rows[0].count);
    const entries = Number((await db.query('select count(*) from public.registrations where user_id=$1', [fresh.userId])).rows[0].count);
    const identity = (await db.query('select coalesce(banned_until>now(),false) as banned, email_confirmed_at is null as unconfirmed from auth.users where id=$1', [fresh.userId])).rows[0];
    const ok = /^CFS-\d+$/.test(r.student_id) && /^CF26-[0-9A-F]{32}$/.test(r.pass_id) && /^CFREQ-/.test(r.reference_code)
      && JSON.stringify(r.competitions) === JSON.stringify([...events].sort()) && requests === 1 && entries === 2 && identity.banned && identity.unconfirmed && !/password|token/i.test(JSON.stringify(r));
    return { ok, observed: `receipt ${/^CFS-\d+$/.test(r.student_id) && /^CF26-/.test(r.pass_id) && /^CFREQ-/.test(r.reference_code) ? 'complete' : 'incomplete'}; requests=${requests}; entries=${entries}; identity banned=${identity.banned}, unconfirmed=${identity.unconfirmed}` };
  });
  await report.run('B-R2', 'crossfire', 'Retry of the same submission resolves to the same participant', 'same user and identical receipt; no new rows', async () => {
    if (!fresh) return { ok: false, blocked: true, observed: 'no registration' };
    const begin = await service.rpc('crossfire_begin_student_registration', { p_request_id: fresh.requestId, p_profile: fresh.profile });
    const complete = await service.rpc('crossfire_complete_student_registration', { p_request_id: fresh.requestId });
    const users = Number((await db.query('select count(*) from public.users where lower(email)=$1', [fresh.profile.email])).rows[0].count);
    const ok = begin.data?.user_id === fresh.userId && begin.data?.status === 'registered' && JSON.stringify(complete.data) === JSON.stringify(fresh.receipt) && users === 1;
    return { ok, observed: `begin ${begin.data?.status || errorSummary(begin.error)}; receipt ${JSON.stringify(complete.data) === JSON.stringify(fresh.receipt) ? 'identical' : 'differs'}; profiles=${users}` };
  });
  await report.run('B-R3', 'crossfire', 'Locked new registrant cannot obtain a session with the bootstrap secret', 'no session', async () => {
    if (!fresh) return { ok: false, blocked: true, observed: 'no registration' };
    const attempt = await stage.fresh().auth.signInWithPassword({ email: fresh.profile.email, password: fresh.password });
    const leaked = await forbid(stage, report, sessionOf(attempt));
    return { ok: !leaked, observed: leaked ? 'SESSION ISSUED' : 'denied by Auth: ' + errorSummary(attempt.error) };
  });

  // ------------------------------------------------ gate before any approval
  await report.run('B-G1', 'crossfire', 'On-duty gate volunteer looks up the pass before approval', 'pass resolves to the registrant', async () => {
    if (!fresh || !people.gate.client) return { ok: false, blocked: true, observed: 'missing registrant or gate session' };
    const lookup = await people.gate.client.rpc('crossfire_ops_lookup_pass', { p_code: fresh.receipt.pass_id });
    return { ok: lookup.data?.id === fresh.userId, observed: lookup.data?.id === fresh.userId ? 'resolved to the registrant' : errorSummary(lookup.error) };
  });
  await report.run('B-G2', 'crossfire', 'Gate check-in succeeds once before approval', 'checked in', async () => {
    if (!fresh || !people.gate.client) return { ok: false, blocked: true, observed: 'missing registrant or gate session' };
    const first = await people.gate.client.rpc('staff_set_check_in', { p_user_id: fresh.userId, p_checked_in: true });
    return { ok: !first.error && Boolean(first.data), observed: first.error ? errorSummary(first.error) : 'checked in' };
  });
  await report.run('B-G3', 'crossfire', 'Second gate scan is rejected as already checked in', 'rejected: already checked in', async () => {
    if (!fresh || !people.gate.client) return { ok: false, blocked: true, observed: 'missing registrant or gate session' };
    const second = await people.gate.client.rpc('staff_set_check_in', { p_user_id: fresh.userId, p_checked_in: true });
    return { ok: Boolean(second.error) && /already checked in/i.test(second.error.message), observed: second.error ? 'rejected: ' + errorSummary(second.error) : 'ACCEPTED TWICE' };
  });
  await report.run('B-M1', 'crossfire', 'Admin and AAL2 super admin see exactly one record for the registrant', 'one record in each panel with the same pass', async () => {
    if (!fresh || !people.admin.client || !superClient) return { ok: false, blocked: true, observed: 'missing registrant or manager session' };
    const counts = [];
    for (const client of [people.admin.client, superClient]) {
      const records = await client.rpc('crossfire_student_records');
      counts.push(records.error ? 'error ' + errorSummary(records.error) : records.data.filter(item => item.email === fresh.profile.email && item.pass_code === fresh.receipt.pass_id).length);
    }
    return { ok: counts.every(count => count === 1), observed: `admin=${counts[0]}; super admin=${counts[1]}` };
  });

  // ---------------------------------- known gaps on the current branch
  await report.run('B-X1', 'gap', 'Self-signup with user_metadata.app=crossfire is not a trusted student', 'no student role; profile denied; no own rows', async () => {
    const email = stage.email('self-signup'), since = Date.now();
    const signUp = await stage.fresh().auth.signUp({ email, password: secret(), options: { data: { app: 'crossfire' } } });
    if (await forbid(stage, report, sessionOf(signUp))) return { ok: false, observed: 'signup issued a session without confirmation' };
    if (signUp.data?.user?.id) stage.created.push(signUp.data.user.id);
    const message = await stage.inbox.waitFor(email, since);
    if (!message?.tokens.tokenHash) return { ok: false, blocked: true, observed: 'no confirmation link in the test inbox' };
    const confirmed = await stage.fresh().auth.verifyOtp({ token_hash: message.tokens.tokenHash, type: message.tokens.type || 'signup' });
    const session = sessionOf(confirmed);
    if (!session) return { ok: false, blocked: true, observed: 'confirmation did not open a session: ' + errorSummary(confirmed.error) };
    const client = asToken(session.access_token);
    const role = (await client.rpc('current_user_role')).data;
    const profile = await client.rpc('crossfire_current_profile');
    const own = await client.from('users').select('id').eq('id', session.user.id);
    const others = await client.from('users').select('id').neq('id', session.user.id);
    const entries = await client.from('registrations').select('id');
    const control = await client.from('events').select('id').limit(5);
    const ok = role === null && Boolean(profile.error) && (own.data?.length ?? 0) === 0;
    return { ok, observed: `role=${role} (definer RPC); profile ${profile.error ? 'denied' : 'returned (role ' + profile.data?.role + ')'} (definer RPC); own users rows=${own.data?.length ?? 'error'}, other users rows=${others.data?.length ?? 'error'}, own entries=${entries.data?.length ?? 'error'} (RLS); events positive control=${control.data?.length ?? errorSummary(control.error)}` };
  });

  // Controlled sequence: an identity that obtained a session before it was locked.
  let early = null;
  await report.run('B-P1', 'crossfire', 'Pre-lock session of a pending registrant: refresh after the lock', 'refresh denied by Auth', async () => {
    early = await register('early-session', 'early');
    const { session, error } = await signIn({ email: early.profile.email, password: early.password });
    if (!session) return { ok: false, blocked: true, observed: 'controlled pre-lock session unavailable: ' + errorSummary(error) };
    early.session = session;
    const lock = await admin.auth.admin.updateUserById(early.userId, { ban_duration: LOCK });
    if (lock.error) return { ok: false, blocked: true, observed: 'lock failed: ' + errorSummary(lock.error) };
    const refreshed = await stage.fresh().auth.refreshSession({ refresh_token: session.refresh_token });
    const leaked = await forbid(stage, report, sessionOf(refreshed));
    return { ok: !leaked, observed: leaked ? 'REFRESH ISSUED A SESSION' : 'denied by Auth: ' + errorSummary(refreshed.error) };
  });
  await report.run('B-X2', 'gap', 'Pending registrant with a previously minted access JWT is denied on every data path', 'role none; profile denied; no own users or entries rows', async () => {
    if (!early?.session) return { ok: false, blocked: true, observed: 'no pre-lock access JWT' };
    const client = asToken(early.session.access_token);
    const role = await client.rpc('current_user_role');
    const profile = await client.rpc('crossfire_current_profile');
    const own = await client.from('users').select('id');
    const entries = await client.from('registrations').select('id');
    const control = await client.from('events').select('id').limit(5);
    const ok = role.data === null && Boolean(profile.error) && (own.data?.length ?? 0) === 0 && (entries.data?.length ?? 0) === 0;
    return { ok, observed: `role=${role.data ?? errorSummary(role.error)} (definer RPC); profile ${profile.error ? 'denied: ' + errorSummary(profile.error) : 'returned'} (definer RPC); own users rows=${own.data?.length ?? errorSummary(own.error)}, entries=${entries.data?.length ?? errorSummary(entries.error)} (RLS); events positive control=${control.data?.length ?? errorSummary(control.error)}` };
  });

  // ------------------------------- closing registration keeps active sign-in
  await report.run('B-S3', 'crossfire', 'After registration closes, the legacy student and staff still sign in', 'registration closed; legacy role student; admin role admin; reopened afterwards', async () => {
    if (!superClient || !legacy) return { ok: false, blocked: true, observed: 'missing super admin or legacy student' };
    const close = await superClient.rpc('crossfire_ops_action', { p_action: 'settings.registration', p_payload: { open: false } });
    if (close.error) return { ok: false, observed: 'close failed: ' + errorSummary(close.error) };
    try {
      const student = await signIn({ email: legacy.profile.email, password: legacy.password });
      const studentRole = student.session ? (await student.client.rpc('current_user_role')).data : null;
      const staffer = await signIn(people.admin);
      const staffRole = staffer.session ? (await staffer.client.rpc('current_user_role')).data : null;
      const status = (await stage.fresh().rpc('get_system_setting', { p_key: 'student_registration_open' })).data;
      return { ok: status === false && studentRole === 'student' && staffRole === 'admin', observed: `registration open=${status}; legacy=${studentRole}; admin=${staffRole}` };
    } finally {
      await superClient.rpc('crossfire_ops_action', { p_action: 'settings.registration', p_payload: { open: true } });
    }
  });
}
