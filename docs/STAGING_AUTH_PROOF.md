# Staging proof: locked Auth identity with a working gate pass

This proof tests whether a student has a working gate pass from registration while portal access stays locked until a manager issues credentials. Use it when changing admission, authentication or the gate workflow.

The proof uses an isolated, disposable Supabase stack. The harness never reads production environment files and refuses the production project. It applies SQL only to the marked staging database.

## Verified on 3 November 2026

On a fresh private stack (CLI 2.111.0, Auth v2.194.0, Postgres 17.6, PostgREST 14.15), the baseline returned exit 3: the Auth lock worked but B-X1 and B-X2 failed. After the credential migration, a clean replay passed all 29 cases with exit 0 and no forbidden session. The 12 database contract tests passed with no TODOs. No production project or student inbox was used.

The browser journey also passed all six milestones: mobile registration and QR download; a gate volunteer scanning the downloaded PNG and checking in once before issuance; details on desktop admin and mobile MFA super admin; bulk delivery of different temporary passwords; recovery after an inbox outage and overlapping retries; and student ID sign-in with a mandatory password change and continued access after registrations close. Camera hardware and hosted mail delivery were not tested.

## What it proves

| Part | Question | Cases |
| --- | --- | --- |
| A. Provider | Positive controls work: password grant, own user, refresh, magic link and recovery from the test inbox. | A-C1…A-C3 |
| A. Provider | An identity created at a reserved UUID, **unconfirmed and banned in the initial Admin create call**, gets no session through password grant, duplicate signup, magic link/OTP or recovery, even when the test inbox link is redeemed. Its UUID, email, marker, metadata and password stay unchanged. | A-L0…A-L5 |
| A. Provider | A ban alone (confirmed email) blocks password and magic-link sessions. A refresh token obtained before a later ban is denied. The unexpired access JWT outcome is recorded. Releasing a fixture with a new credential works and the bootstrap secret fails. | A-L6…A-L9 |
| B. CrossFire | The effective trigger, restrictive RLS, role resolver and grants on the real provider. | B-D1…B-D3 |
| B. CrossFire | Staff controls (admin, volunteer, super admin AAL1 vs AAL2 via real TOTP) and a legacy confirmed student, including after registration closes. | B-S1…B-S3 |
| B. CrossFire | Registration through `crossfire_begin_student_registration` → locked identity → `crossfire_complete_student_registration`: one acknowledgement, CFS ID, CFREQ reference, CF26 pass, two event entries, identical retry, no session. | B-R1…B-R3 |
| B. CrossFire | An on-duty gate volunteer looks up the pass and checks in once before any approval; a second scan is rejected; admin and AAL2 super admin each see one record. | B-G1…B-G3, B-M1 |
| B. Authorization | Self-signup with client-supplied app metadata cannot create a trusted student. A previously minted access JWT cannot open pending student data. | B-X1, B-X2 (B-P1 checks Auth refresh denial in the same sequence) |

Part B exercises SQL on a real provider. The separate browser journey below exercises the public website, both Edge functions, the volunteer scanner, staff panels and credential delivery.

### Exit codes

- `0`: all required cases passed, including both authorization cases.
- `1`: a required case failed or was skipped, a positive control failed, or a forbidden session was issued.
- `2`: the run was not requested, configuration is missing, or the target was refused.
- `3`: the provider controls and other CrossFire cases passed, but one or both authorization cases failed. Do not release.

The run prints two separate decisions: **Provider lock proven on this version** and **CrossFire authorization fully proven**.

## Runner requirements

- A Docker-enabled Linux machine or disposable runner (preferred), or Windows/macOS with a running Docker-compatible engine. Supabase documents a native runtime on some Linux/macOS versions: [Docker and native runtimes](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes). Verify compatibility before relying on it; it was not verified here.
- Node 24, Supabase CLI 2.111.0, and Playwright with Chromium for the browser journey. A host Deno install is not needed.
- Use a checkout containing this migration and both Edge functions. Transfer only reviewed source files and tests. Do not transfer `.env*`, `.claude/`, `supabase/.temp/` (CLI link state), build artifacts, certificates or local credentials.

## Setup (once per disposable stack)

Use a separate, empty directory that is **never linked** to a Supabase project. Do not run the CLI from the CrossFire checkout: its `supabase/.temp` may link to production.

```bash
mkdir crossfire-stage && cd crossfire-stage
npx supabase@2.111.0 init
```

Edit `supabase/config.toml` so the stage mirrors production Auth and avoids other local stacks:

```toml
project_id = "crossfire-stage-<random suffix>"

[api]
port = 55421
[db]
port = 55422
shadow_port = 55420
[db.pooler]
port = 55429
[studio]
port = 55423
[local_smtp]            # Mailpit test inbox; nothing is delivered externally
port = 55424
[analytics]
port = 55427

[auth]
minimum_password_length = 8

[auth.email]
enable_confirmations = true   # production requires confirmation; the default false would invalidate the proof
max_frequency = "1s"

[auth.rate_limit]
email_sent = 100              # the default of 2 per hour blocks the mail controls

[auth.mfa.totp]
enroll_enabled = true         # needed for the AAL2 super-admin case
verify_enabled = true
```

Start only what the proof needs, and keep the output private, because it contains local keys:

```bash
umask 077
npx supabase@2.111.0 start -x realtime,storage-api,imgproxy,studio,edge-runtime,logflare,vector,supavisor,postgres-meta > start.private.txt
npx supabase@2.111.0 status -o env > status.private.env
chmod 600 start.private.txt status.private.env
npx supabase@2.111.0 --version; cut -d= -f1 status.private.env   # names only, for the report
```

## Configuration names

| Name | Meaning |
| --- | --- |
| `CROSSFIRE_STAGE_RUN` | Must be `1`. |
| `CROSSFIRE_STAGE_ID` | `crossfire-stage-<8–48 lowercase letters, digits or dashes>`; stored as the database marker. |
| `CROSSFIRE_STAGE_API_URL` | Stage API origin, for example the loopback API port. |
| `CROSSFIRE_STAGE_ANON_KEY` | Stage anon or publishable key. |
| `CROSSFIRE_STAGE_SERVICE_ROLE_KEY` | Stage service-role or secret key (fixtures and readback only). |
| `CROSSFIRE_STAGE_DB_URL` | Stage Postgres URL (loopback for a local stack). |
| `CROSSFIRE_STAGE_MAIL_URL` | Mailpit origin (the `local_smtp` port). |
| `CROSSFIRE_STAGE_TARGET` | Optional: `local` (default) or `hosted`. |
| `CROSSFIRE_STAGE_HOSTED_REF`, `CROSSFIRE_STAGE_MAIL_HOST`, `CROSSFIRE_STAGE_DB_CA_FILE` | Hosted stage only: the dedicated test project ref, the exact inbox host and the CA file for verified database TLS. |
| `CROSSFIRE_STAGE_KEEP_FIXTURES` | Optional: `1` keeps synthetic Auth users for inspection. |

Map them from `status.private.env` in a clean environment. The variable names on the right come from `supabase status -o env`; check them with `cut -d= -f1`:

```bash
. ./status.private.env
export CROSSFIRE_STAGE_RUN=1 CROSSFIRE_STAGE_ID="<exact project_id from this disposable config.toml>"
export CROSSFIRE_STAGE_API_URL="$API_URL" CROSSFIRE_STAGE_DB_URL="$DB_URL" \
       CROSSFIRE_STAGE_ANON_KEY="$ANON_KEY" CROSSFIRE_STAGE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
       CROSSFIRE_STAGE_MAIL_URL="${MAILPIT_URL:-$INBUCKET_URL}"
```

## Run

From the CrossFire checkout, in the same shell (no production variables set):

```bash
CROSSFIRE_STAGE_MARK_CONFIRM="$CROSSFIRE_STAGE_ID" npm run stage:mark
npm run stage:auth-proof
```

`stage:mark` designates the freshly started database: it refuses a database that already has Auth users or CrossFire tables. It creates the `crossfire_stage` marker schema and a service-role-only `public.crossfire_stage_identity()` function. Before the first write, `stage:auth-proof` checks:

- the database marker equals `CROSSFIRE_STAGE_ID`;
- the API serves that same marker;
- Auth requires email confirmation and allows signup;
- Auth and the database list the same users;
- the test inbox answers.

The first Auth write is then confirmed to reach the same database.

The proof loads the base schema and 13 historical migrations in reviewed production order, skips the people/password seeds, and records checksums. It registers a legacy student **before** applying `20261103090000_student_credentials.sql`, then exercises the new cohort. Start with a fresh stack for each full proof; an already migrated database cannot reproduce the legacy control.

Output is case names and redacted outcomes only. A JSON copy without secrets is written to the git-ignored `artifacts/stage-auth-proof/`. Synthetic Auth users are deleted at the end unless `CROSSFIRE_STAGE_KEEP_FIXTURES=1`.

## Browser journey

After exit 0, keep that same marked, local stack running. In the separate CLI directory, copy this checkout's `supabase/functions/register-student/` and `supabase/functions/student-portal/` under `supabase/functions/`. Create a mode-600 private Edge env file with `CROSSFIRE_ALLOWED_ORIGINS` and `CROSSFIRE_SITE_URL` both set to `http://127.0.0.1:55480`, a randomly generated server-only `CROSSFIRE_ISSUANCE_SECRET` of at least 32 characters and `CROSSFIRE_STAGE_MAILPIT_URL=http://inbucket:8025`. No real mail provider key belongs on this stack. Serve with `supabase functions serve --no-verify-jwt --env-file <private-file>`. Issuance authenticates the staff bearer token inside the function.

From a clean checkout with `npm ci`, start Vite on loopback with only the stage public API URL and anonymous key mapped to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (`npm run dev -- --host 127.0.0.1 --port 55480 --strictPort`). In a separate clean shell with the same stage variables as above, run `npm run stage:student-journey`. If Playwright is installed separately, set `CROSSFIRE_STAGE_PLAYWRIGHT` to the absolute path of its JS entry point. The test temporarily stops **only this stack's Mailpit container** to exercise failure and retry. It restores the inbox, registration setting and sender settings on normal completion. Both test commands write redacted reports to ignored artifacts. Tear down only this disposable stack from its CLI directory with `supabase stop --no-backup`.

## Known caveats

- The ledger compares raw bytes. Git can check out identical SQL with different line endings. At `66ac0c4`, seven recorded hashes match on the original workstation and one matches on a clean LF checkout. Five later migrations have no recorded production checksum. The stage proves the definitions loaded from its checkout. Inspect any discrepancy before claiming production equivalence.
- Local Auth, PostgREST and Postgres versions and settings (rate limits, leaked-password protection, SMTP) may differ from the hosted project. The run records the versions it observed.
- A ban alone does not revoke an access JWT already issued. B-X2 checks that the application data paths deny pending students independently.

## Production release order

Pushing the frontend alone is unsafe: the previous public registration endpoint requires a password. Use a coordinated release after production authorization.

1. Verify the target, migration ledger and a restorable backup. Count legacy students, open reservations and profiles matching the historical empty-signup quarantine; investigate unexpected matches before applying the migration. Prepare the backend and frontend releases from the same commit.
2. Keep the issuance secret and mail provider key only in the Supabase Edge environment. Set a stable random `CROSSFIRE_ISSUANCE_SECRET`, `CROSSFIRE_RESEND_API_KEY`, `CROSSFIRE_SITE_URL`, and exact HTTPS `CROSSFIRE_ALLOWED_ORIGINS`. Confirm the college sender is enabled and verified with its provider. Never set the staging Mailpit override or put any of these secrets into a Vite variable.
3. Record the current registration-open setting. Temporarily pause new registrations during cutover and drain in-flight submissions. Apply **only** `20261103090000_student_credentials.sql` in a transaction and refresh the API schema. Do not replay historical migrations or seed data.
4. Deploy `student-portal` and the matching `register-student`. Follow the project's public endpoint gateway settings; the portal function verifies the caller for issuance. Verify the anonymous issuance refusal and non-sensitive health responses before releasing the matching frontend. Publish the frontend, verify it is served, then restore the recorded registration setting. Students already registered retain their login and gate pass.
5. Confirm receipt/QR, records, first-password change and sender acceptance with an explicitly authorized test recipient before any bulk issuance. Provider acceptance is not proof of inbox delivery. A failed delivery can be retried for that student. If acceptance is uncertain after 23 hours, inspect the provider's record before manually recovering the job; do not rotate or automatically resend.

If a release step fails, keep new registrations paused. Do not roll the frontend or either function back independently while the new cohort exists. Preserve completed receipts, gate passes, and credential history; investigate against the backup and recover the matching releases together.

## If the provider lock is not proven

Record the failing case and window (for example, a ban that is not applied by the initial create call, or a redemption path that issues a session). Do not build issuance on it. The fallback for review is a request-owned admission identity: the CF26 pass and gate scanning key off the registration request instead of a pre-created Auth user, and the Auth identity is created only when credentials are issued. That changes the scanner and check-in foreign keys, so it needs its own reviewed migration.
