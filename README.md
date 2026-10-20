# CrossFire 2026

Responsive event registration and college operations portal, built with React, TypeScript, Vite and Supabase. Production website: https://cross-fire-three.vercel.app/.

## Release status — 20 October 2026

The reviewed operations/security/intake/invitation database updates and `provision-staff` / `invite-student` Edge functions are deployed to the confirmed CrossFire Supabase project. The updated frontend is prepared locally; publication to Vercel is pending account access. Students submit directly to a private review queue without email verification. Managers can configure official email invitations for reviewed students; actual delivery requires the college sender setup. See [the release checklist](docs/SECURITY_RELEASE.md) for verified results and remaining launch requirements.

## Workflows

- Students submit contact details and competition choices without email verification. PostgreSQL saves a private pending request before returning a submission reference. Admins and super admins review it under **Registration review**. Reviewing alone creates no account or pass. A separate approved invitation creates account/entries and sends a password-setup link once the sender is configured and the portal opens. See [Student invitations](docs/STUDENT_INVITATIONS.md). Team formation remains deferred.
- All staff require Supabase Auth and authenticator verification. Database roles, active state and duty assignments govern every operation.
- Super admins manage elevated staff access and system settings. Admins also manage volunteer/judge access, events, student desks and invited VIP/judge guests.
- Volunteers check in participants, issue one meal, mark room attendance or assist guests within their assigned on-duty station.
- Judges see assigned candidates, submit validated rubric scores and lock their own evaluation. Public standings include completed events only.
- Guest arrival follows invitation → confirmation → arrival → optional meal → departure → archive. Actions persist with audit records.

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

The production preview uses the same security headers defined in `vercel.json`. Keep `VITE_EMAIL_AUTH_READY=false` for the current staff-review intake. Enabling it switches to verified-account registration; do so only after college approval, sender setup, real delivery tests and a reviewed plan for existing intake records.

## Structure

| Location | Responsibility |
| --- | --- |
| `src/context` | Real authentication, event and own-registration state |
| `src/operations` | Admin and volunteer workflows, typed clients, responsive screens |
| `src/pages/JudgePanel.tsx` | Assigned judge roster and persistent scoring |
| `src/pages/AccountSecurity.tsx` | Authenticated staff password updates |
| `supabase/migrations` | Ordered, tested database changes |
| `supabase/functions/provision-staff` | Server-only staff account provisioning |
| `supabase/functions/invite-student` | Reviewed student accounts and official email delivery |
| `src/pages/StudentActivation.tsx` | Private setup-link verification and student password setup |
| `scripts/*.test.mjs` | Disposable SQL and Edge-handler tests |
| `docs/OPERATIONS.md` | Wireframes, role matrix and operational pipeline |
| `docs/SECURITY_RELEASE.md` | Deployment, recovery and verification evidence |

Do not rerun the legacy `supabase/schema.sql` on the shared production project. It is a historical baseline for disposable local tests. The release preparer applies the reviewed migrations in order within a transaction. Obsolete credential-seeding, auto-confirm and permissive-view setup scripts were removed. Removing files does not remove credentials from Git history; any previously exposed credentials still require rotation.

Browser HTML and JavaScript remain inspectable. Security is enforced through verified identity, MFA, server-side permissions, private secrets and database policies—not by attempting to hide frontend code.
