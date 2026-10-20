# Student invitations and official college mail

The public registration form saves an unverified submission in Supabase. Both admin roles can review it. No Auth account or pass is created merely by submitting or reviewing a form.

The login dialog always offers **Student Login (Email)** and **Staff & Admin**. While the student portal is closed, the student tab shows the registration notice, registration button and Google Form backup. Staff continue using email/password and authenticator verification. A submission reference or Pass ID is never a password.

## Enable official invitations

1. Verify the college's sending domain in Resend, including its required DNS records. Use a sending API key restricted to that domain where available. No sender address has been invented or configured by this release.
2. Set `CROSSFIRE_RESEND_API_KEY` in Supabase Edge secrets for the CrossFire project. Set `CROSSFIRE_SITE_URL=https://cross-fire-three.vercel.app` and retain the same origin in `CROSSFIRE_ALLOWED_ORIGINS`. Do not put the key in Vercel frontend variables or a `VITE_` variable.
3. Deploy `invite-student` with JWT verification enabled. Publish the frontend including `#activate`. This integration does not change the shared project's SMTP or other applications' templates.
4. In **Email & invitations**, an MFA-verified admin or super admin saves the sender name, official email and reply-to inbox. The presence of a server key does not prove the domain is verified. Keep the enable switch off until both are configured.
5. After registration closes, the super admin opens student portal access in **System settings**. Review the intended recipient in **Registration review**, then choose **Invite approved student** and confirm the displayed email.
6. Verify one explicitly approved real recipient before broad use: inbox delivery, setup-link activation, password setup, email/password login, portal closure and recovery. No real invitation has been sent during automated verification.

`VITE_EMAIL_AUTH_READY` stays **false**. It controls the older OTP-at-registration flow, not this reviewed-invitation flow. The Google Form backup is separate and does not automatically import submissions into Supabase.

## Account and entry creation

The Edge handler checks the authenticated caller, active admin role, MFA, configured origin, bounded body and server configuration. SQL verifies review status, sender enablement, portal access and rate limits again. A private account reservation gives each intake request one UUID. New Auth accounts receive a random unknown password and a trusted app-metadata ownership marker; the initial email is unconfirmed.

The SQL provisioning transaction verifies that marker and the exact email, then writes the full profile and all requested event entries together. A submitted request may be imported after the normal registration deadline when the event is open or registration-closed. Draft, in-progress and completed events remain blocked. Maximum group selections and capacity-overflow handling still apply. Team fields remain deferred.

Existing unrelated Auth identities are never adopted or overwritten. If an email is already used by another account/request, staff must resolve the duplicate through the project owner; the app will not merge identities using unverified email input. A failed conversion leaves the request intact and does not delete a possibly valid Auth account.

The email contains a `CFS-…` Student ID, random event Pass ID, login email and an expiring one-time setup link. The student explicitly verifies that link, then chooses a password. The link is removed from the address bar; its token is never returned to the admin browser, stored in the invitation table or written to an audit log. Supabase controls token expiry and password policy. Configure an appropriate Auth password policy before launch.

## Delivery states and recovery

| State | Meaning / next action |
| --- | --- |
| Preparing / ready | Account or link preparation is in progress. A stalled attempt requires operator review. |
| Sending | A single provider request was authorized. Do not blindly resend a stalled attempt. |
| Accepted | Resend returned a message ID and the database saved it. This does **not** mean inbox delivery. |
| Failed | A known preparation error or explicit provider rejection occurred. Correct the cause; retry after the ten-minute cooldown. |
| Uncertain | Delivery could not be confirmed. Check provider logs before any resend. |

Accepted invitations can be replaced with **Send new setup link**, after ten minutes. This supports forgotten passwords and expired invitations while retaining the same student account and entries. Staff should verify the student's identity/contact before initiating recovery. The new link replaces the prior Auth one-time link; never forward it to another address.

Each attempt has a unique provider idempotency key `crossfire-student-<invitation UUID>`. The handler makes one bounded send attempt and does not automatically retry ambiguous outcomes. There is no inbox-delivery webhook in this release.

For a stalled/uncertain attempt, the trusted project owner must inspect `crossfire_student_invitations`, the matching request, Auth ownership marker and provider logs. Record the provider receipt if acceptance is proven, or mark failed only if no email was accepted. Use a reviewed, narrowly targeted SQL correction for that exact invitation UUID; never mass-reset jobs or delete a student account to clear the queue. If the outcome cannot be determined, leave it blocked and contact the student/organiser. Future work may add a provider webhook and audited reconciliation UI.

Private tables have RLS and no browser table grants. Managers use bounded RPCs; students, judges, volunteers, inactive staff and staff without MFA cannot access these controls. Only the server role records provider outcomes. Review changes cannot silently decline an already-provisioned account.

## Staff IDs

The local, Git-ignored `.env.staff-access.local` records existing admin and super-admin login emails, Auth UUIDs and recovery instructions. It contains no password. Existing Supabase passwords cannot be read back; none were reset. This file is not encrypted by the application and must remain on a trusted computer.

## Verification and release

Run `npm run test:invitations`, `npm run test:security`, `npm run build` and `npm run security:bundle`. SQL tests use disposable PGlite databases; actual Edge handlers use mocked Auth/mail providers. These checks do not substitute for real email and staff-MFA acceptance.

For the existing linked project, capture a security checkpoint, then prepare only the new migration:

```powershell
node scripts/prepare-security-release.mjs --only 20261020_student_invitations.sql
supabase db query --linked --file artifacts/security/release.sql --output json
supabase functions deploy invite-student --project-ref foklyhoplcghivghuebp --use-api
node scripts/security-smoke-live.mjs
```

The incremental release checks the existing deployment ledger against `supabase/deployed-migration-history.json`, applies only the new migration, and records its checksum. Do not overwrite historical migration files or their deployed checksums. Current checked-out historical text has a checksum discrepancy; full historical replay is intentionally not used for this update. This deployment history is not a backup of student data.

Provider contracts: [Supabase generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp), [Resend send email](https://resend.com/docs/api-reference/emails/send-email).
