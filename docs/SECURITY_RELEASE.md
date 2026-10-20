# CrossFire security release

Status updated on 20 October 2026; operations security migrations were applied on 19 October and the student-intake migration on 20 October. This is a release checklist and verification record, not a claim of complete security certification.

## Targets and deployed work

- Website: `https://cross-fire-three.vercel.app`.
- Confirmed Supabase project: `foklyhoplcghivghuebp` (`crossfire`). The project is shared; unrelated applications and Auth users must be preserved.
- Applied: access containment, operations, production security, public-event access, staff-helper privilege and student-intake migrations. Their checksums are recorded in `public.crossfire_schema_migrations` and ignored `artifacts/security/applied-release.json`.
- Deployed: `provision-staff`, with JWT verification retained and `CROSSFIRE_ALLOWED_ORIGINS=https://cross-fire-three.vercel.app`.
- Frontend publication: pending Vercel access. A local build is not evidence that the public website serves it.
- Email sender configuration: explicitly deferred by the user on 20 October. Keep `VITE_EMAIL_AUTH_READY=false`. Students submit directly to the staff-review queue without OTP; the student portal/account flow remains unavailable.
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
| Live HTTP checks | 14 passed: public events/rankings, private intake/review denials, invalid intake rejection, deployed CORS |
| TypeScript and production build | Passed |
| Public bundle inspection | No source maps, env files, SQL schema, known server secrets or test credentials detected |
| npm production dependency audit | Zero reported vulnerabilities |
| Desktop browser preview (1366 × 900) | Six live events and Quiz criteria rendered; Register Now opened registration without team-entry fields |
| Student intake browser controls | Submit-for-review enabled after live events loaded; no email-code field or verification button; sign-in opens staff credentials only |
| Current mobile intake preview (390 × 844) | No horizontal overflow; submit-for-review action fits; no browser warnings/errors observed in the fresh preview tab |
| Anonymous admin browser route | Access denied; no operations data rendered |

SQL tests execute actual functions and RLS in disposable PGlite databases. Edge tests exercise the actual handler with fake Auth/database providers. They do not prove production load capacity, real email delivery, real-user sign-in/MFA, camera scanning or successful privileged hosted mutations. No such outcomes are claimed.

The complete security suite now has 131 passing checks. Intake persistence and admin-review mutations were exercised in the disposable SQL database; live HTTP checks confirmed private-access denial and invalid-input rejection. No test student was submitted through the production HTTP endpoint, and no real staff review session was performed.

Browser checks used the local production build with the configured Vercel security headers, connected to the intended Supabase project. Screenshots are saved under ignored `artifacts/security/`. This does not verify the currently published Vercel frontend or every responsive route.

The compatible PostCSS selector-parser fix was installed. Five high-severity **build dependency** findings remain in the Tailwind 3 → glob/micromatch/braces chain. The braces advisory covers every released version available at this review; npm proposes a Tailwind 4 major upgrade. Do not run untrusted pattern/CSS inputs in the build process. A Tailwind migration requires a separate full visual regression check; do not use `npm audit fix --force` blindly. These packages are not shipped in the production browser runtime.

The database advisor's mutable search-path findings were fixed. Remaining intended `SECURITY DEFINER` RPC warnings require role checks and tests, not blanket removal of RPC access. Public `get_leaderboard` intentionally exposes only published ranking fields. Leaked-password protection remains disabled in the hosted Auth settings; review availability for this project/plan before enabling it. An advisor report without ERROR entries is not proof of zero risk.

## Required before launch

1. **Rotate any previously exposed staff credentials and revoke old sessions.** Removed legacy scripts included embedded credentials and unsafe setup paths. Git history and previous deployments may retain those values. Removing source files and adding MFA do not undo exposure. The verified account owner should reset passwords through trusted Supabase administration, review enrolled MFA factors and revoke sessions. Do not paste passwords, service keys or SMTP credentials into chat. Never change another shared application's account by email-name assumptions.
2. **Configure a custom email sender.** Supabase's default sender is restricted to project-team addresses. Configure SMTP in Supabase using a verified sender domain, then update the appropriate email templates to show `{{ .Token }}`. Preserve other applications' redirect URLs; add the CrossFire production origin and required CrossFire callback paths. Review Auth rate limits and abuse controls. Test signup, existing-user code login, incorrect/expired codes, resend behavior and recovery using an approved real recipient. Enable `VITE_EMAIL_AUTH_READY=true` in Vercel only after delivery and verification succeed. This step is deferred for the current intake-only release. Keep the readiness flag false: submissions go to staff review and no student account is created. The linked backup Google Form is separate and does not populate the CrossFire queue automatically. Obtain college approval and define safe identity matching for existing intake records before switching to verified-account registration.
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
node scripts/prepare-security-release.mjs
```

The preparer only writes ignored `artifacts/security/release.sql` and prints checksums. It applies the ordered reviewed migration set in one transaction when submitted to the intended project, uses an advisory lock/timeouts, and rejects changes to previously recorded migration checksums. Add a new migration for subsequent changes. Never deploy the operations migration alone after MFA hardening.

```powershell
supabase db query --linked --file scripts/security-checkpoint.sql --output json
supabase db query --linked --file artifacts/security/release.sql --output json
supabase functions deploy provision-staff --project-ref foklyhoplcghivghuebp --use-api
node scripts/security-smoke-live.mjs
```

Save checkpoint output securely before approved live updates. Existing checkpoints in `artifacts/security/checkpoints/` contain definitions, grants and policies, not a full data backup. Restoring permissions from a pre-security checkpoint would reintroduce vulnerabilities; use a reviewed forward fix instead of blindly restoring it. Direct PostgreSQL scripts enforce certificate verification; obtain a trusted project CA if needed, never set `rejectUnauthorized:false`.

Provider references: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [email codes and templates](https://supabase.com/docs/guides/auth/auth-email-passwordless), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [Vercel headers](https://vercel.com/docs/headers), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
