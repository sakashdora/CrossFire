# Netlify Deployment Guide — CrossFire 2026 Showcase
**Document Version:** 1.0.0  
**Target Platform:** Netlify  
**Target Environment:** Static Production Frontend Showcase  
**Build Command:** `npm run build`  
**Publish Directory:** `dist`  
**Routing Architecture:** Single Page Application (SPA Hash & Fallback)  

---

## 1. Overview
This document provides exact, end-to-end instructions for deploying the **CrossFire 2026** static showcase to Netlify. All backend dependencies, runtime database requirements, and external API calls have been suspended. The website operates as a high-fidelity static frontend showcase with all 7 competition arenas, ₹56,000 prize pool, schedules, rubrics, and the True Inspires partnership announcement.

---

## 2. Netlify Configuration Specification (`netlify.toml`)
The repository includes a production-tested `netlify.toml` at its root with the following settings:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  VITE_SHOWCASE_MODE = "true"

# SPA Fallback for client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security & Performance Headers
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; worker-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' mailto:; upgrade-insecure-requests"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(self), microphone=(), geolocation=(), payment=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 3. Deployment Methods

### Method A: Git-Integrated Deployment via Netlify Web UI (Recommended)
1. **Log in** to your [Netlify Dashboard](https://app.netlify.com/).
2. Click **"Add new site"** &rarr; **"Import an existing project"**.
3. Select your Git provider (GitHub) and authorize access.
4. Select the repository: `sakashdora/CrossFire` (or your forked repository).
5. In the **Site configuration** section:
   - **Branch to deploy:** `chore/netlify-static-migration` (or `main` after merging).
   - **Base directory:** Leave blank if the repository root contains `package.json`, or set to `CrossFire` if deploying from a monorepo parent.
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. In **Environment variables**:
   - `NODE_VERSION`: `20`
   - `VITE_SHOWCASE_MODE`: `true`
   *(No database URLs, secret tokens, or API keys are required).*
7. Click **"Deploy site"**.
8. Netlify will run `npm run build` and publish your site under a `*.netlify.app` subdomain (e.g., `crossfire-showcase.netlify.app`).

---

### Method B: Netlify CLI Manual Deployment
If you prefer deploying from your local workstation or CI pipeline:

1. **Install Netlify CLI** globally:
   ```bash
   npm install -g netlify-cli
   ```
2. **Authenticate with Netlify:**
   ```bash
   netlify login
   ```
3. **Build the production static assets locally:**
   ```bash
   npm run build
   ```
4. **Deploy to a preview environment:**
   ```bash
   netlify deploy --dir=dist
   ```
5. **Inspect the generated Preview URL** and verify navigation, images, and responsiveness.
6. **Deploy to production:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

---

### Method C: Netlify Drag & Drop (Zero-CLI Instant Preview)
1. Run `npm run build` locally to generate the fresh `dist/` directory.
2. In the Netlify dashboard, navigate to **Sites** &rarr; drag and drop the `dist` folder into the upload zone.
3. Your site will instantly go live with an assigned URL.

---

## 4. Post-Deployment Verification Checklist
Once the site is deployed on Netlify, test the following:

- [ ] **Home / Landing View (`/#landing`):**
  - Hero branding, countdown timer, and background starfield animate smoothly.
  - Showcase Mode banner is visible at the top with both CTAs:
    - *Start a Project* (`mailto:info.trueinspire.ac@gmail.com`)
    - *Explore True Inspires* (`https://true-inspires.vercel.app/`)
  - Banner dismiss (`X`) button hides banner without breaking layout.
  - Showcase Mode section on the homepage is visible and responsive.
- [ ] **Events & Arenas View (`/#events`):**
  - All 7 competition arenas (Quiz, Debate, Dance, Poster Making, Treasure Hunt, Ramp Walk, Reels) are displayed.
  - Prize pool shows ₹56,000.
  - Opening competition details modals shows criteria, venue locations, and rules.
- [ ] **Registration Form (`/#register`):**
  - Showcase mode notice is displayed explaining intake is temporarily paused.
  - Form fields can be inspected.
  - Submit button indicates showcase mode and links directly to official Google Form backup.
- [ ] **Leaderboard View (`/#leaderboard`):**
  - Renders graceful awaiting state without endless loading spinners or console errors.
- [ ] **Pass Lookup View (`/#my-pass`):**
  - Displays clear contextual notice that live pass search is paused in showcase mode.
- [ ] **Network & Console Audit:**
  - Open Developer Tools &rarr; Console &rarr; Confirm **0 network errors** and **0 CSP violations**.
  - Developer Tools &rarr; Network &rarr; Confirm **no background polling** or calls to external database hosts.
- [ ] **Deep Links & Refresh:**
  - Navigating to deep links (e.g. `https://<site>.netlify.app/#events`) and refreshing the browser loads correctly with HTTP 200 via Netlify SPA redirects.

---

## 5. Domain Configuration (When Ready)
1. In the Netlify dashboard, navigate to **Site configuration** &rarr; **Domain management**.
2. Click **Add a domain** and enter your desired custom domain.
3. Configure the DNS records at your registrar:
   - For apex domain: `A` record pointing to Netlify's load balancer IP (`75.2.60.5`).
   - For subdomain (`www` or custom): `CNAME` record pointing to `<site-name>.netlify.app`.
4. Allow Netlify to automatically provision a free Let's Encrypt SSL/TLS certificate.
