# CrossFire security release

Status updated on 20 October 2026; operations security migrations were applied on 19 October and the intake/invitation migrations on 20 October. This is a release checklist and verification record, not a claim of complete security certification.

## Targets and deployed work

- Website: `https://cross-fire-three.vercel.app`.
- Confirmed Supabase project: `foklyhoplcghivghuebp` (`crossfire`). The project is shared; unrelated applications and Auth users must be preserved.
- Applied: access containment, operations, production security, public-event access, staff-helper privilege, student-intake and student-invitation migrations. Their checksums are recorded in `public.crossfire_schema_migrations`, ignored `artifacts/security/applied-release.json` and `artifacts/security/applied-invitations-release.json`. The invitation-only release verified six existing ledger checksums before applying the new migration; earlier files were not replayed or overwritten.
- Deployed: `provision-staff` and `invite-student`, both with JWT verification retained and `CROSSFIRE_ALLOWED_ORIGINS=https://cross-fire-three.vercel.app`. The invitation function was confirmed ACTIVE with `verify_jwt=true`.
- Frontend publication: pending Vercel access. A local build is not evidence that the public website serves it.
- Email sender configuration: still missing. Keep `VITE_EMAIL_AUTH_READY=false` for registration without OTP. The new student tab, sender settings and reviewed invitation/password-setup flow are implemented. Invitations require a verified Resend sender domain, server key, enabled sender settings and an open student portal. See [Student invitations](STUDENT_INVITATIONS.md).
- No live fixture accounts, guests, students, registrations, scores or announcements were created by this release.

## Controls implemented

Browser roles cannot read or write the legacy student/admin/staff views or call the retired plaintext login and account-management endpoints. Account-backed student registration still requires a verified Auth email and consent. Current public intake is separate: unverified contact details create only a private pending request, never an account, verified identity, event entry or pass. Client metadata cannot self-assign a role or confirm an email. Random identifiers are not credentials. Registration, media and scoring mutations enforce ownership and event state in SQL.

Intake validates required fields, consent, contact formats, event availability/deadlines and maximum selections. It rejects unexpected privilege fields, uses idempotent request IDs, and limits saved requests to three per normalized email/phone per 24 hours and 1,000 globally per hour. These bounds and a honeypot reduce abuse but are not proof of bot resistance; an attacker can still consume the shared allowance. Monitor intake volume and configure an appropriate provider challenge or gateway rate limit before broad promotion. All direct browser table access is revoked. Only active MFA-verified admins/super admins can search or review requests. Review writes reject stale updates and produce an audit entry without copying contact data into the audit log.

Staff policies and RPCs require an active profile, verified email and an `aal2` session. On-duty station and assignment checks also apply to older endpoints. Judges receive only assigned candidates and their own evaluations, excluding student contact details. Locked evaluations cannot be silently overwritten. Only completed events contribute to public rankings. Private settings and internal functions are not public APIs.

The provisioning endpoint validates the caller with Auth, checks active admin permissions, MFA and a persistent hourly limit before creating an account. It accepts only the configured browser origin, bounds request bodies, avoids credential responses, and handles uncertain commits without deleting a potentially valid account. The service credential stays in the Edge runtime.

Vercel headers set CSP, frame restrictions, MIME protection, referrer policy, HSTS and camera permissions. The build disables source maps and rejects service keys, wrong projects and unreviewed public environment variables. Private Auth tokens use session storage; the browser still requires protection against XSS. JavaScript is inherently inspectable.

## Verified evidence

| Check | Observed result |
| --- | --- |
| Access containment tests | 15 passed |
| Production SQL security tests | 31 passed, including public-event/draft regression |
| Operations SQL workflow tests | 35 passed |
| Edge handler/type contract tests | 16 passed |
| Public build environment checks | 7 passed |
| Student intake SQL checks | 27 passed: anonymous persistence, retry handling, private access, validation, rate limits and staff review |
| Student invitation SQL checks | 27 passed: role/MFA restrictions, sender validation, closed-portal gate, atomic imports, ownership markers, duplicate/cooldown handling, capacity and uncertain-delivery blocking |
| Student invitation Edge/type checks | 15 passed: origin/session guards, missing configuration, account ownership, provider acceptance/rejection/uncertainty and no credential disclosure |
| Live HTTP checks | 26 passed: public events/rankings, private intake/invitation denials, invalid intake rejection and both deployed Edge origins |
| TypeScript and production build | Passed |
| Public bundle inspection | No source maps, env files, SQL schema, known server secrets or test credentials detected |
| npm production dependency audit | Zero reported vulnerabilities |
| Desktop browser preview (1366 × 900) | Six live events and Quiz criteria rendered; Register Now opened registration without team-entry fields |
| Current login browser controls | Student Login and Staff & Admin tabs verified; closed-portal notice and registration CTA verified on desktop and mobile; activation route shows missing-link guidance; no browser warnings/errors observed |
| Current mobile intake preview (390 × 844) | No horizontal overflow; submit-for-review action fits; no browser warnings/errors observed in the fresh preview tab |
| Anonymous admin browser route | Access denied; no operations data rendered |

SQL tests execute actual functions and RLS in disposable PGlite databases. Edge tests exercise the actual handler with fake Auth/database providers. They do not prove production load capacity, real email delivery, real-user sign-in/MFA, camera scanning or successful privileged hosted mutations. No such outcomes are claimed.

The security checks total 173 passing cases. The complete suite passed before one additional capacity regression was added; the expanded 27-case invitation SQL suite then passed. Intake, review and account conversion were exercised in disposable SQL databases; hosted checks confirmed access denials and public data availability. No test student was submitted through production, no real invitation was sent, and no real staff review session was performed.

Browser checks used the local production build with the configured Vercel security headers, connected to the intended Supabase project. Screenshots are saved under ignored `artifacts/security/`. This does not verify the currently published Vercel frontend or every responsive route.

The compatible PostCSS selector-parser fix was installed. Five high-severity **build dependency** findings remain in the Tailwind 3 → glob/micromatch/braces chain. The braces advisory covers every released version available at this review; npm proposes a Tailwind 4 major upgrade. Do not run untrusted pattern/CSS inputs in the build process. A Tailwind migration requires a separate full visual regression check; do not use `npm audit fix --force` blindly. These packages are not shipped in the production browser runtime.

The database advisor's mutable search-path findings were fixed. Remaining intended `SECURITY DEFINER` RPC warnings require role checks and tests, not blanket removal of RPC access. Public `get_leaderboard` intentionally exposes only published ranking fields. Leaked-password protection remains disabled in the hosted Auth settings; review availability for this project/plan before enabling it. An advisor report without ERROR entries is not proof of zero risk.

## Required before launch

1. **Rotate any previously exposed staff credentials and revoke old sessions.** Removed legacy scripts included embedded credentials and unsafe setup paths. Git history and previous deployments may retain those values. Removing source files and adding MFA do not undo exposure. The verified account owner should reset passwords through trusted Supabase administration, review enrolled MFA factors and revoke sessions. Do not paste passwords, service keys or SMTP credentials into chat. Never change another shared application's account by email-name assumptions.
2. **Configure the official invitation sender.** Follow [Student invitations](STUDENT_INVITATIONS.md): verify the college domain in Resend, add the server-only API key, save the official sender/reply-to in either admin portal, and test with an explicitly approved recipient. The CrossFire-specific integration does not modify shared-project SMTP. Verify expired links, password setup, login, portal closure and recovery. Keep `VITE_EMAIL_AUTH_READY=false`; unverified public intake remains separate from account invitations. The Google Form backup does not populate CrossFire automatically.
3. **Publish the reviewed frontend to the existing Vercel project.** Set only the public URL/key and readiness flag. Build with `npm ci` and `npm run build`. Verify the deployment headers and correct project URL. Do not add service keys or database credentials to frontend variables.
4. **Run staff acceptance tests using authorized accounts.** Verify super-admin/admin differences, MFA, staff suspension from a second session, assigned volunteers, one-time meals, guest lifecycle, actual judge submissions and completed-event publication. Use explicitly approved disposable records, then archive/clean them with approval. Confirm event venues, eligibility, schedules and media submission deadlines with the college: baseline media deadlines currently use registration deadlines, while the published brief describes on-campus creation.
5. **Confirm operational ownership.** The college needs a documented account-recovery contact, backup/restore procedure and retention policy for student and guest records. This repository does not claim that provider backup scheduling or restore drills have been configured.

## Repeatable verification and release

```powershell
npm ci
npm run test:security
npm run build
npm run security:bundle
npm audit --omit=dev
node scripts/prepare-security-release.mjs --only 20261020_student_invitations.sql
```

The preparer only writes ignored `artifacts/security/release.sql` and prints checksums. The incremental command checks the existing ledger against the reviewed deployment history, applies only the selected migration in one transaction and records its checksum. Checked-out historical text has a checksum discrepancy, so this update intentionally did not replay it. Add a new migration for subsequent changes; never overwrite deployed checksums or deploy the old operations migration alone after MFA hardening.

```powershell
supabase db query --linked --file scripts/security-checkpoint.sql --output json
supabase db query --linked --file artifacts/security/release.sql --output json
supabase functions deploy provision-staff --project-ref foklyhoplcghivghuebp --use-api
supabase functions deploy invite-student --project-ref foklyhoplcghivghuebp --use-api
node scripts/security-smoke-live.mjs
```

Save checkpoint output securely before approved live updates. Existing checkpoints in `artifacts/security/checkpoints/` contain definitions, grants and policies, not a full data backup. Restoring permissions from a pre-security checkpoint would reintroduce vulnerabilities; use a reviewed forward fix instead of blindly restoring it. Direct PostgreSQL scripts enforce certificate verification; obtain a trusted project CA if needed, never set `rejectUnauthorized:false`.

Provider references: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [email codes and templates](https://supabase.com/docs/guides/auth/auth-email-passwordless), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [Vercel headers](https://vercel.com/docs/headers), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
