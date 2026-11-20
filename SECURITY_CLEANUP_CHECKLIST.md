# CrossFire 2026 — Security & Environment Cleanup Checklist
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor Roles:** Security Auditor, DevOps Architect  

---

## 1. Environment Variables Inventory
*Note: In accordance with project security policies, this inventory lists variable names and purposes only. No secret values or credentials are displayed.*

### 1.1 Active Static Build Variables (Non-Secret)
These variables are safe to use in Netlify or local environment files for the static showcase build:

| Variable Name | Purpose | Required in Static Showcase | Publicly Exposed to Client? |
| :--- | :--- | :--- | :--- |
| `VITE_SHOWCASE_MODE` | Flags whether the frontend operates in static showcase mode (`true` by default). | Yes (`true`) | Yes (Non-secret boolean) |
| `VITE_APP_NAME` | Application display title ("CrossFire 2026"). | Optional | Yes (Non-secret text) |
| `VITE_EVENT_DATE` | Event date string ("2026-11-15"). | Optional | Yes (Non-secret text) |
| `NODE_VERSION` | Node.js runtime version for Netlify build environment (`20`). | Yes (in `netlify.toml`) | No (Build environment only) |

---

### 1.2 Obsolete Client Variables in Static Showcase
These variables were previously injected into the client bundle on Vercel. In static showcase mode, they are **no longer required** and should be removed from the active static deployment configuration:

| Variable Name | Previous Purpose | Static Showcase Status | Recommendation |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project API URL. | Obsolete | Remove from Netlify frontend environment variables. |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous JWT key. | Obsolete | Remove from Netlify frontend environment variables. |
| `VITE_EMAIL_AUTH_READY` | Legacy email authentication ready flag. | Obsolete | Remove from Netlify frontend environment variables. |
| `VITE_STUDENT_SIGNIN_PUBLIC` | Public student login tab visibility toggle. | Obsolete | Remove from Netlify frontend environment variables. |

---

### 1.3 Remote Server-Only Secrets
These variables must **never** be prefixed with `VITE_`, never committed to Git, and never configured in frontend build settings. They belong strictly in remote vaults (Supabase Edge Secrets / server environment):

| Variable Name | Purpose | Location | Status |
| :--- | :--- | :--- | :--- |
| `DIRECT_URL` | Direct PostgreSQL connection string for admin scripts. | Local `.env` / CI only | Keep out of Git. Not needed for static hosting. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin service role key for Edge functions. | Supabase Edge Secret | Keep in Supabase vault. Do not commit or expose. |
| `CROSSFIRE_ISSUANCE_SECRET` | HMAC secret for student portal password generation. | Supabase Edge Secret | Keep in Supabase vault. |
| `CROSSFIRE_RESEND_API_KEY` | Resend API key for invitation and notification emails. | Supabase Edge Secret | Keep in Supabase vault. |
| `CROSSFIRE_ALLOWED_ORIGINS` | CORS origin whitelist for Edge functions. | Supabase Edge Secret | Update to Netlify domain upon cutover. |
| `CROSSFIRE_SITE_URL` | Callback and site URL for emails. | Supabase Edge Secret | Update to Netlify domain upon cutover. |

---

## 2. Tracked Files & Git Security Audit
A comprehensive audit of tracked files was performed:
- [x] **Tracked Secrets Check:** No raw API keys, passwords, database URLs, or private keys (`*.pem`, `*.key`) are committed in tracked Git files.
- [x] **Gitignore Verification:** `.gitignore` properly excludes `.env`, `.env.*`, `.env*.local`, `dist/`, `.vercel/`, `.codex-local/`, and local scratch directories.
- [x] **Client Bundle Inspection (`dist`):**
  - Ran `npm run security:bundle`.
  - Checked 45 generated text artifacts.
  - Zero source maps (`.map`) generated (`sourcemap: false` enforced).
  - Zero server credentials, database passwords, or secret tokens detected.
  - Supabase URL domain (`foklyhoplcghivghuebp`) was removed from the active static bundle.

---

## 3. Manual Cleanup Checklist for Platform Operators

### 3.1 Netlify Platform Setup
- [ ] Ensure **no secret variables** (such as `SERVICE_ROLE_KEY`, `DIRECT_URL`, or `RESEND_API_KEY`) are added to the Netlify Site Environment settings.
- [ ] Set `VITE_SHOWCASE_MODE=true` in Netlify environment variables (already defined in `netlify.toml`).

### 3.2 Vercel Platform Cleanup (Post-Verification Only)
*Do not execute until Netlify site has been verified and user approval is granted:*
- [ ] Confirm traffic is successfully routed to Netlify.
- [ ] If custom domain was attached to Vercel, remove domain mapping in Vercel project settings.
- [ ] Delete or archive Vercel project environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.).
- [ ] Decommission only the project associated with CrossFire (`cross-fire-three`). **Do not touch the external True Inspires website at `true-inspires.vercel.app`**.

### 3.3 Remote Credential Rotation & Hygeine
- [ ] If the Supabase anon key or database password was previously shared insecurely outside the team, rotate the database password in the Supabase Dashboard (`Project Settings` &rarr; `Database`).
- [ ] If changing the database password, remember to update `DIRECT_URL` in your private password manager for future restoration.
