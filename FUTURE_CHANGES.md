# Future changes

## Student identity and portal access — deferred

Updated: 20 October 2026. The user chose direct CrossFire registration submissions for staff review, without student email verification or portal access.

- Current intake writes to private `crossfire_registration_requests`; receipt references identify submissions only.
- Admins and super admins can mark requests reviewed or declined, add notes and reopen them for review. This does not create an account, confirm email ownership, reserve an event place or issue a pass.
- Student email-code controls are hidden while `VITE_EMAIL_AUTH_READY=false`. Staff email/password and MFA remain available.
- Before introducing student accounts or converting reviewed requests into event entries, confirm the college's approval/seat-allocation process and identity checks. Do not automatically associate a request with an account merely because an unverified email matches.
- Email sending, verified account activation, student recovery and approval notifications require a later approved setup. No emails are sent by intake or staff review.

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
