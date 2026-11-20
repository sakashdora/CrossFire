# CrossFire 2026 — Backend Restoration Guide
**Document Version:** 1.0.0  
**Context:** Instructions for restoring live backend functionality from showcase mode.  
**Audience:** Principal Backend Engineer, DevOps Architect, Lead Maintainer  

---

## 1. Safety & Preservation Guarantee
During the migration to static showcase mode, **no backend source code, database migrations, or edge functions were deleted**. All backend code remains 100% version-controlled and recoverable in this repository:

- **Edge Functions:** Located in `supabase/functions/`:
  - `register-student/`: Handles student intake, validations, pass issuance, and registration receipt generation.
  - `participant-pass/`: Handles public pass lookup by registered email and phone number.
  - `student-portal/`: Authenticates student IDs and manages one-time HMAC credential issuance.
  - `invite-student/`: Dispatches student invitations with Resend email integration.
  - `provision-staff/`: Provisions roles for coordinators, judges, volunteers, and admins.
- **Database Migrations:** Located in `supabase/migrations/` (19 sequential migrations documenting schema, RLS policies, RPC functions, and indexes).
- **Database Schema:** Located in `supabase/schema.sql`.
- **Operational & Security Scripts:** Located in `scripts/` (admin tooling, DB inspection, audit checkpoints).

---

## 2. Prerequisites for Backend Restoration
Before re-enabling backend functionality, ensure you have:
1. Access to the Supabase CrossFire project (project reference `foklyhoplcghivghuebp` or your newly provisioned Supabase instance).
2. The Supabase CLI installed locally:
   ```bash
   npm install -g supabase
   ```
3. The project's public anon key and service role key (stored securely in your password manager or team vault).
4. The Resend API key for student invitation and password delivery.

---

## 3. Step-by-Step Restoration Procedure

### Step 1: Switch Client Application from Showcase to Live Backend
In your local environment or deployment platform (Netlify/Vercel):

1. Set the environment flag:
   ```env
   VITE_SHOWCASE_MODE=false
   ```
2. Re-supply your Supabase public credentials:
   ```env
   VITE_SUPABASE_URL=https://foklyhoplcghivghuebp.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-public-anon-key>
   ```
3. When `VITE_SHOWCASE_MODE` is `false` and valid credentials are provided:
   - `src/lib/supabase.ts` reactivates `isSupabaseConfigured = true`.
   - `AuthContext` resumes live session checks, MFA evaluation, and role authentication.
   - `EventsContext` resumes live database queries and real-time event updates.
   - `RegistrationPage` enables live form submissions to the `register-student` Edge function.
   - `MyPassPage` enables live participant pass lookups.
   - `useLeaderboard` resumes live RPC scoring queries.

---

### Step 2: Deploy Supabase Database Migrations
If deploying to a fresh database or applying pending changes:

1. Link the local repository to your Supabase project:
   ```bash
   supabase link --project-ref <your-supabase-project-id>
   ```
2. Apply all migrations:
   ```bash
   supabase db push
   ```
   Or apply pending migrations using the project script:
   ```bash
   DIRECT_URL="postgresql://postgres.<project>:<password>@<host>:5432/postgres" node scripts/apply-pending-migrations.mjs
   ```

---

### Step 3: Configure Remote Edge Secrets
Configure the required server-side secrets in Supabase Edge Secrets. **Never prefix these with `VITE_` and never bundle them into client code**:

```bash
# Set CORS allowed origin to the production site domain
supabase secrets set CROSSFIRE_ALLOWED_ORIGINS="https://your-domain.netlify.app"

# Set the production site URL
supabase secrets set CROSSFIRE_SITE_URL="https://your-domain.netlify.app"

# Set high-entropy issuance secret for student portal password derivation
supabase secrets set CROSSFIRE_ISSUANCE_SECRET="<generate-random-32-char-string>"

# Set the email delivery key
supabase secrets set CROSSFIRE_RESEND_API_KEY="<your-resend-api-key>"
```

---

### Step 4: Deploy Edge Functions
Deploy all 5 Edge Functions to the linked Supabase project:

```bash
supabase functions deploy register-student
supabase functions deploy participant-pass
supabase functions deploy student-portal
supabase functions deploy invite-student
supabase functions deploy provision-staff
```

---

### Step 5: Update Content Security Policy (CSP)
If your production site enforces CSP headers (in `netlify.toml` or `vercel.json`), ensure `connect-src` permits the Supabase API and WebSocket endpoints:

```toml
Content-Security-Policy = "... connect-src 'self' https://<your-project>.supabase.co wss://<your-project>.supabase.co; ..."
```

---

### Step 6: Verification & Testing
Run the project's security and operational test suites to verify full-stack functionality:

1. **Build Security Check:**
   ```bash
   node scripts/build-security.test.mjs
   ```
2. **Production Bundle Audit:**
   ```bash
   npm run build
   npm run security:bundle
   ```
3. **Registration & Auth Test Suites (with staging database):**
   ```bash
   npm run test:timetable
   npm run test:registration-notice
   ```
4. Verify student registration, pass issuance, staff login, and QR scanning in a staging environment before opening public access.
