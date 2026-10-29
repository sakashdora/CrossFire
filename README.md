# CrossFire 2026

Responsive event registration and college operations portal, built with React, TypeScript, Vite and Supabase. Production website: https://cross-fire-three.vercel.app/.

## Release status — 20 October 2026

The reviewed operations/security/intake/invitation database updates and `provision-staff` / `invite-student` Edge functions are deployed to the confirmed CrossFire Supabase project. The updated frontend is prepared locally; publication to Vercel is pending account access. Students submit directly to a private review queue without email verification. Managers can configure official email invitations for reviewed students; actual delivery requires the college sender setup. See [the release checklist](docs/SECURITY_RELEASE.md) for verified results and remaining launch requirements.

## Workflows

Roles (identical in the database `user_role` enum, SQL, Edge functions and TypeScript): `super_admin`, `admin`, `student`, `volunteer`, `vip_guest`, `judge`.

- **Students** register on `#register` while the super admin keeps registration open. The `register-student` Edge function reserves the request in SQL, creates one Supabase Auth login with the student's chosen password, then commits the profile, every event entry and an unpredictable `CF26-…` QR pass in one transaction. Retrying with the same details returns the same receipt; a second registration for the same email is rejected. The success screen shows the details and QR pass (download/print). Students sign in later with email and password, including after registration closes.
- **Closing registration** (super admin, **System settings**) blocks new accounts and new event entries in SQL, including direct API calls. Sign-in, dashboards and passes are unaffected.
- **Staff, judge and VIP guest logins** are created only by admins (volunteer, judge, VIP guest) or super admins (also admin and super admin) through `provision-staff`. The initial password works once: the database blocks every request until the person chooses their own password. VIP guest logins are created from the guest card and see only their own invitation, guest pass and the public schedule.
- Super admins also verify an authenticator (AAL2). Database roles, active state and duty assignments govern every operation; deactivation or a role change ends the account's refresh sessions and applies to its next request.
- **QR scans** resolve one pass on the server (`crossfire_ops_lookup_pass`). Gate and meal volunteers receive no student roster; an on-duty event-room volunteer sees only that room's participants. Gate check-in, meal and room attendance are recorded once each in `crossfire_checkins` with the operator and time; a duplicate scan is reported as already checked in. Admins can issue a new QR pass, which revokes the old one.
- Only a super admin can permanently delete a student (`crossfire_delete_student`, confirmed by pass ID) or an account-less intake record. Both are audited.
- Staff screens poll `crossfire_live_revision()` every 3 seconds and reload only when data changed.
- Judges see assigned candidates, submit validated rubric scores and lock their own evaluation. Public standings include completed events only.
- Guest arrival follows invitation → confirmation → arrival → optional meal → departure → archive. Actions persist with audit records.
- Password recovery for students uses the official email invitation ("Send password reset link" in **Student records**), which requires the configured sender. See [Student invitations](docs/STUDENT_INVITATIONS.md).

The application has no demo route, simulated staff sessions or browser-only data fallback. Static event descriptions and assets are published content; live availability, registrations, scores and operational records come from Supabase.

## Development

Use Node.js 22 or 24 and the committed npm lockfile. Copy `.env.example` to `.env` and supply this project's public Supabase anon/publishable key. Server credentials must never use a `VITE_` prefix.

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 3001
npm run test:security
npm run build
npm run security:bundle
npm run preview -- --host 127.0.0.1 --port 4180 --strictPort
```

The production preview uses the same security headers defined in `vercel.json`. `VITE_EMAIL_AUTH_READY` is no longer read by the app; the one-time-code registration path was retired in favour of `register-student`. Deployment order and migration steps are in [the release checklist](docs/SECURITY_RELEASE.md#30-october-2026-accounts-registration-and-qr-release).

## Structure

| Location | Responsibility |
| --- | --- |
| `src/context` | Real authentication, event and own-registration state |
| `src/operations` | Admin and volunteer workflows, typed clients, responsive screens |
| `src/pages/JudgePanel.tsx` | Assigned judge roster and persistent scoring |
| `src/pages/AccountSecurity.tsx` | Authenticated staff password updates |
| `supabase/migrations` | Ordered, tested database changes |
| `supabase/functions/register-student` | Public student registration: one Auth login, profile, entries and pass |
| `supabase/functions/provision-staff` | Server-only staff, judge and VIP guest account provisioning |
| `src/pages/VipDashboard.tsx` | VIP guest invitation, pass and schedule |
| `src/components/PasswordChangeRequired.tsx` | First sign-in password change for provisioned accounts |
| `supabase/functions/invite-student` | Reviewed student accounts and official email delivery |
| `src/pages/StudentActivation.tsx` | Private setup-link verification and student password setup |
| `scripts/*.test.mjs` | Disposable SQL and Edge-handler tests |
| `docs/OPERATIONS.md` | Wireframes, role matrix and operational pipeline |
| `docs/SECURITY_RELEASE.md` | Deployment, recovery and verification evidence |

Do not rerun the legacy `supabase/schema.sql` on the shared production project. It is a historical baseline for disposable local tests. The release preparer applies the reviewed migrations in order within a transaction. Obsolete credential-seeding, auto-confirm and permissive-view setup scripts were removed. Removing files does not remove credentials from Git history; any previously exposed credentials still require rotation.

Browser HTML and JavaScript remain inspectable. Security is enforced through verified identity, MFA, server-side permissions, private secrets and database policies—not by attempting to hide frontend code.
