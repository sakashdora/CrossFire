# Future changes

## Student identity and portal access — invitation workflow implemented

Updated: 20 October 2026. Registration remains open without email verification. The user subsequently requested a visible, closed Student Login tab and admin-managed official email invitations after review.

- Current intake writes to private `crossfire_registration_requests`; receipt references identify submissions only.
- Admins and super admins can mark requests reviewed or declined, add notes and reopen them for review. This does not create an account, confirm email ownership, reserve an event place or issue a pass.
- Student email-code controls are hidden while `VITE_EMAIL_AUTH_READY=false`. Staff email/password and MFA remain available.
- Admins and super admins now have official sender settings and a separate invitation action for reviewed requests. The invitation action creates an owned Auth identity, full student profile and event entries; it cannot claim an existing unrelated account by email. Student passwords are chosen through a private setup link. Pass IDs are identifiers, not passwords.
- Email delivery still requires a verified Resend sender domain, a server API key and a real delivery acceptance test. No emails are sent by intake or the review-status action. Keep invitations disabled until configured. See [Student invitations](docs/STUDENT_INVITATIONS.md).
- WhatsApp delivery and team formation remain deferred. The website does not promise automatic WhatsApp credentials.

## Team registration — deferred pending college clarification

Recorded: 8 October 2026.

The college has not yet clarified how students should form or join teams. Do not collect a team name or teammate names/roll numbers in an event popup until that process is confirmed.

### Current agreed flow

- Clicking an event opens its existing brief, participation format, prize details and evaluation criteria.
- The popup has a **Register Now** button that opens the existing main student registration page (`#register`).
- The event directory also directs registration to that same page.
- Event popups do not enroll students directly, require sign-in, or collect team details. The main registration form remains the source for student intake.

### Clarify with the college before implementing team intake

- Does every student register individually, or does one team representative register everyone?
- When and where are teams formed or assigned?
- Are team names, teammate names, roll numbers or existing registration IDs required?
- Who can add, replace or approve teammates, and until what deadline?
- Which participation limits apply across groups? The current main form and older direct-event enrollment code use different limits; reconcile these only after confirmation.

After confirmation, implement the approved flow in the main registration process, with matching validation, backend storage and confirmation messages. Existing backend team-related fields/services are retained for that future work, but are not invoked by the event-criteria popup.
