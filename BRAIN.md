# 🧠 CROSSFIRE 2026 — MASTER PROJECT BRAIN & ARCHITECTURE SPECIFICATION

> **Single Source of Truth (SSOT)** for AI Agents and Developers.  
> Read this document first in every chat session to immediately understand the project identity, architectural decisions, completed work, active states, and future roadmap.

---

## 📌 1. EXECUTIVE SUMMARY & EVENT IDENTITY

| Property | Details |
| :--- | :--- |
| **Event Name** | **CROSSFIRE 2026** (State Level Talent Hunt & Competition) |
| **Host Institution** | **Srusti Academy of Graduate Studies (SAGS)**, Bhubaneswar, Odisha |
| **Affiliation** | Utkal University |
| **Date & Timing** | **Sunday, November 15, 2026** (08:30 AM – 05:30 PM IST) |
| **Venue** | Srusti Campus, Chandaka Industrial Estate, Patia, Bhubaneswar, Odisha 751024 |
| **Target Audience** | **+2 Final Year Students** (12th Grade: Science, Commerce, Arts) |
| **Age Eligibility** | 16 – 18 years old (CBSE, ICSE, CHSE Boards) |
| **Total Prize Pool** | **₹50,000 INR** (Cash awards + Trophies + Medals + Certificates) |
| **Entry Fee** | **₹0 (100% Free Entry, Hospitality & Food)** |
| **Core Quota Rule** | **Group A: Choose Any Two • Group B: Choose Any Two** (Max 2 in Group A & Max 2 in Group B) |
| **Coordinators** | Mr. N.R. Swain (+91 7008671339) • Mr. A. Meher (+91 8455090984) |
| **Media Partners** | Prameya News, News 7 |

---

## 🏆 2. THE 6 COMPETITION TRACKS

Students may participate in **up to 2 competitions from Group A** and **up to 2 competitions from Group B**:

```
                          ┌──────────────────────────┐
                          │     CROSSFIRE 2026       │
                          │ Group A: 2 • Group B: 2  │
                          └─────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌──────────────────┐                          ┌──────────────────┐
       │     GROUP A      │                          │     GROUP B      │
       ├──────────────────┤                          ├──────────────────┤
       │ 1. Quiz          │ (Team of 2)              │ 4. Treasure Hunt │ (Team of 3)
       │ 2. Debate        │ (Solo)                   │ 5. Ramp Walk     │ (Solo)
       │ 3. Poster Making │ (Solo)                   │ 6. Reels         │ (Solo)
       └──────────────────┘                          └──────────────────┘
```

### Detailed Track Specifications:
1. **Quiz (Group A - Team of 2)**
   - *Format:* Written test preliminary round; top 6 teams qualify for campus buzzer finals.
   - *Venue:* Main Auditorium A | *Prize:* 1st ₹6k, 2nd ₹4k, 3rd ₹3.5k, 4th-6th ₹1.5k each.
   - *Rubric:* Accuracy (40), Speed (30), Buzzer Round Performance (30).
2. **Debate (Group A - Solo)**
   - *Format:* Argumentation & public speaking. Topic sent via WhatsApp/SMS morning of event.
   - *Venue:* Seminar Hall B | *Prize:* 1st ₹4k, 2nd ₹2k, 3rd ₹1k.
   - *Rubric:* Argumentation & Logic (40), Clarity & Expression (30), Rebuttal Strength (30).
3. **Poster Making (Group A - Solo)**
   - *Format:* Artistic design on chart/canvas. Theme announced at kickoff.
   - *Venue:* Art Studio Block C | *Prize:* 1st ₹4k, 2nd ₹2k, 3rd ₹1k.
   - *Rubric:* Design & Aesthetics (35), Message Clarity (35), Creativity & Innovation (30).
4. **Treasure Hunt (Group B - Team of 3)**
   - *Format:* Multi-station outdoor race solving cryptic riddles across campus.
   - *Venue:* Central Campus Quadrangle | *Prize:* 1st ₹3k, 2nd ₹2k, 3rd ₹1k.
   - *Rubric:* Checkpoint Speed (50), Clue Accuracy (50), Bonus Checkpoint Points (10).
5. **Ramp Walk (Group B - Solo)**
   - *Format:* Fashion, poise, personality showcase on stage (2 mins per participant).
   - *Venue:* Open Air Amphitheatre | *Prize:* 1st ₹3k, 2nd ₹2k, 3rd ₹1k.
   - *Rubric:* Appearance & Styling (30), Stage Presence (30), Personality & Aura (40).
6. **Reels (Group B - Solo)**
   - *Format:* 30–60 second short video shot on Srusti Campus on event morning.
   - *Venue:* Media Lab & Studio Block | *Prize:* 1st ₹3k, 2nd ₹2k, 3rd ₹1k.
   - *Rubric:* Creativity (35), Content Quality (35), Execution & Editing (30).

### Official Prize & Team Size Distribution Matrix:

| Event | Team size | Champion | 1st Runner-up | 2nd Runner-up | 3rd | 4th | 5th | Event total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quiz** | 2 | ₹6,000 | ₹4,000 | ₹3,500 | ₹1,500 | ₹1,500 | ₹1,500 | **₹18,000** |
| **Treasure Hunt** | 3 | ₹3,000 | ₹2,000 | ₹1,000 | – | – | – | **₹6,000** |
| **Ramp Walk** | 1 | ₹3,000 | ₹2,000 | ₹1,000 | – | – | – | **₹6,000** |
| **Reels** | 1 | ₹3,000 | ₹2,000 | ₹1,000 | – | – | – | **₹6,000** |
| **Debate** | 1 | ₹4,000 | ₹2,000 | ₹1,000 | – | – | – | **₹7,000** |
| **Poster Making** | 1 | ₹4,000 | ₹2,000 | ₹1,000 | – | – | – | **₹7,000** |
| **Grand Total** | — | **₹23,000** | **₹14,000** | **₹8,500** | **₹1,500** | **₹1,500** | **₹1,500** | **₹50,000** |

---

## 🛠️ 3. TECHNOLOGY STACK & SYSTEM ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                               │
│  React 18 + Vite 6 + TypeScript 5.7 + TailwindCSS 3.4                  │
│  Motion: Framer Motion, GSAP, Three.js, Canvas Confetti, Lenis         │
│  Hardware: html5-qrcode (Live Scanner), qrcode.react (Gate Pass)       │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
                   ▼                                  ▼
      ┌─────────────────────────┐        ┌─────────────────────────┐
      │  Supabase Cloud (Live)  │        │ Local Service Fallback  │
      │  • PostgreSQL 15        │        │ • localStorage engine   │
      │  • Auth & User Triggers │        │ • studentDataService    │
      │  • Security Definer RPC │        │ • guestVolunteerService │
      │  • RLS Policies         │        │ • Standalone & Demo     │
      └─────────────────────────┘        └─────────────────────────┘
```

### Frontend Dependencies:
- **Core:** `react` 18.3, `react-dom` 18.3, `typescript` 5.7, `vite` 6.1.
- **Styling:** `tailwindcss` 3.4, `lucide-react` (icons).
- **Animations:** `@react-three/fiber` + `@react-three/drei` (3D particles), `framer-motion`, `gsap`, `canvas-confetti`, `lenis`.
- **QR Utilities:** `html5-qrcode` (camera barcode scanner for volunteers), `qrcode.react` (SVG/Canvas student admit card QR).

### Backend & Database (Supabase):
- **PostgreSQL 15+** with `pgcrypto`.
- **Shared Project Guard:** All Crossfire tables and functions use strict lowercase naming (`users`, `events`, `registrations`, `scores`, etc.) to coexist with other apps sharing the same Supabase instance.
- **Atomic Operations:** All critical writes (registration, scoring, check-in) pass through PostgreSQL `SECURITY DEFINER` functions with strict row locking (`FOR UPDATE`).

---

## 🗄️ 4. DATABASE SCHEMA & RPC BLUEPRINT

### Tables Overview:
1. `public.users`: Profiles (1:1 with `auth.users`).
   - Fields: `id`, `email`, `first_name`, `last_name`, `contact_number`, `whatsapp_number`, `institute_name`, `city_town`, `course_stream` (12th Science / Commerce / Arts), `board` (CBSE / ICSE / CHSE), `food_preference` (Veg / Non-veg), `role` (`student`, `volunteer`, `judge`, `admin`), `pass_number` (auto identity e.g. `CF26-1001`), `checked_in_at`, `food_redeemed_at`.
2. `public.events`: 6 tracks with capacities, prize breakdown, rubric schema, and venue.
3. `public.registrations`: Student `<->` Event mapping with team names, member arrays, media links, and final scores.
4. `public.scores`: Individual jury evaluations per registration with criteria breakdowns.
5. `public.judge_assignments`: Evaluator-to-track assignments.
6. `public.notifications`: System and WhatsApp broadcast logs.
7. `public.incidents`: Ground-operations incident logs reported by volunteers.
8. `public.audit_logs`: Immutable security audit logs.

### Dedicated Database Views (Supabase Table Editor):
- `public.students_view`: Clean participant directory showing only students (`role = 'student'`), formatted `student_code`, contact details, `event_count`, and comma-separated `registered_events`.
- `public.admins_view`: Shows Super Admins and College Admins (`role IN ('admin', 'super_admin')`) with friendly `role_description`.
- `public.staff_view`: Shows active field staff (`role IN ('volunteer', 'judge')`).

### Key Database RPC Functions (`SECURITY DEFINER`):
- `submit_registration_form(p_profile jsonb, p_event_slugs text[])`:
  - Validates contact, WhatsApp, school, stream, and food preferences.
  - Ensures **maximum 2 events per group** quota (up to 2 in Group A and up to 2 in Group B, total 1–4).
  - Atomic insert into `users` and `registrations`.
- `staff_set_check_in(p_user_id uuid, p_checked_in boolean)`:
  - Gate check-in timestamping. Protects against food redemption before check-in.
- `staff_set_food_redeemed(p_user_id uuid, p_redeemed boolean)`:
  - Validates student check-in; prevents duplicate meal token redemption.
- `submit_score(p_registration_id uuid, p_rubric_scores jsonb, p_comments text)`:
  - Verifies assigned judge; enforces rubric weights; locks final scores.
- `staff_set_room_reported(p_registration_id uuid, p_reported boolean)`:
  - Room volunteer candidate roll-call tracking.
- `admin_delete_student(p_student_id text)`:
  - Permanently purges student scores, registrations, public.users record, and auth.users identity in a single transaction with audit log.
- `admin_upsert_volunteer(p_data jsonb)` & `admin_delete_volunteer(p_identifier text)`:
  - Full CRUD on public.volunteers with duty station, shift, walkie channel, and password management.
- `admin_upsert_guest(p_data jsonb)` & `admin_delete_guest(p_identifier text)`:
  - Full CRUD on public.guests with category, organization, dietary preferences, and volunteer escort unlinking.

### 🛡️ Critical Pattern: The Isolated Supabase Client
During public registration on kiosk or shared devices, standard `supabase.auth.signUp()` alters the global browser session, potentially corrupting active admin or volunteer sessions.
- In `src/lib/supabase.ts`, we provide `createIsolatedClient()` with:
  ```ts
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
  ```
- After registration, local session scopes are cleared immediately to prevent session hijacking.

---

## 👥 5. USER ROLES & PORTAL ACCESS MATRIX

The app uses hash-based client routing: `#landing`, `#events`, `#register`, `#dashboard`, `#judge`, `#volunteer`, `#admin`, `#leaderboard`.

| Role | Accessible Views | Permissions & Key Responsibilities |
| :--- | :--- | :--- |
| **Visitor / Public** | `landing`, `events`, `register`, `leaderboard` | View event info, download brochure/posters, register for max 2 events, view countdown. |
| **Student** | `dashboard`, `events`, `leaderboard` | View digital admit card, QR gate pass, food token, track status, submit media links (Reels/Poster). *(Note: Student portal login is locked during registration).* |
| **Volunteer** | `volunteer` | Camera QR scanner for Gate 1 Check-in, meal voucher validation, room candidate verification, incident reporting. |
| **Judge** | `judge` | Candidate evaluations per track, interactive rubric grading sliders, lock/finalize scores, add critique notes. |
| **Admin** | `admin` (Full Access) | Master KPI stats, live student roster, CSV/Excel/PDF exports, print admit cards, Guest/VIP escort protocol, Volunteer credential generator, broadcast notices. |

---

## 🚀 6. CURRENT IMPLEMENTATION PROGRESS

### ✅ What is 100% Built and Fully Functional:

1. **Brand Aesthetics & Cinematic Intro:**
   - Full-screen SAGS x CROSSFIRE 2026 intro splash animation with replay button.
   - Dynamic 3D interactive particle background (`HeroParticlesBackground.tsx`).
   - Sticky mobile 5-key bottom navigation bar (Home, Events, Register, Board, Portal).
2. **Student Registration System (`RegistrationPage.tsx`):**
   - Exact replica of the official Srusti Google Form with rich validation.
   - Dual-group quota validator (strictly blocks selecting > 2 competitions).
   - "Same as Contact" WhatsApp auto-sync.
   - Clean slate: 0 fake registrations. Auto-synced with Supabase RPC + `studentDataService`.
   - Post-registration confirmation screen showing digital Admit Card with downloadable pass and QR code.
3. **Volunteer Ground Ops (`VolunteerDashboard.tsx`):**
   - Integrated camera QR scanner (`LiveQRScanner.tsx` via `html5-qrcode`).
   - Gate 1 check-in toggle and instant Admit Card lookup by QR code or ID.
   - Food coupon token redemption logic with timestamp and duplicate protection.
   - Competition room roll-call attendance tracking.
   - Live incident reporting log (e.g., audio/visual issues, hall requests).
4. **Judge Scoring Panel (`JudgePanel.tsx`):**
   - Competition track selector (Quiz, Debate, Poster, Treasure Hunt, Ramp Walk, Reels).
   - Candidate roster filtered by check-in and room reporting status.
   - Interactive rubric evaluation sliders reflecting official event criteria.
   - Score locking mechanism to prevent tampering after submission.
5. **Admin Command Center (`AdminDashboard.tsx`):**
   - Real-time KPI counter cards (Total Registrations, Confirmed, Food Tokens Redeemed, Check-ins).
   - Filterable & searchable live student roster.
   - Student Detail Modal with Print Admit Card capability.
   - Export tools: Full CSV export, Excel-ready roster, PDF print layouts.
   - **VIP Guest Management:** Guest categories (Chief Guest, Guest of Honour, Judge, VIP), escort assignments, vehicle numbers, arrival times, dietary preferences.
   - **Volunteer Coordination:** Create volunteer credentials (ID + Password), assign duty stations (Gate 1, Auditorium, Amphitheatre, Dining), walkie-talkie channels, and shifts.
   - **Broadcast Dispatcher:** Simulate / send in-app and WhatsApp push notifications.
6. **Live Leaderboard (`LeaderboardPage.tsx`):**
   - Pre-Event Standby Mode: Clean slate with zero fake scores before the actual event day.
   - Ready for live evaluations on November 15, 2026.
   - Filter by Board (CBSE / ICSE / CHSE) and candidate search.
   - Confetti celebration effects triggered on final podium reveals.
7. **Public Asset Delivery:**
   - Official downloadable A3 Poster PDF and Event Brochure PDF hosted in `public/`.
   - Food coupons and logos directly linkable.
8. **DevOps & Database Scripts (`scripts/`):**
   - `migrate.mjs`: Idempotent schema migration via `DIRECT_URL`.
   - `audit-registration.mjs`: Server-side forensic verification of auth users and database records.
   - `db-inspect.mjs`, `probe-signup.mjs`, `check-admin.mjs`: Direct verification tools.

---

## ⚡ 7. CURRENT OPERATIONAL STATE & AGENT GOTCHAS

> [!IMPORTANT]
> **Key Rules Every Agent Must Follow:**

1. **NO FAKE DATA IN PRODUCTION LEADERBOARDS OR REGISTRATIONS:**
   - Legacy mock students (`user-student-demo`, `imazureakash@gmail.com`) have been completely purged.
   - Do NOT re-populate dummy students or mock leaderboard scores. The system is live and collecting real student registrations.
2. **TWO-TIER ADMINISTRATIVE ARCHITECTURE (SUPABASE):**
   - **Super Admin (Lead / Tech Team):** `trueinspire@gmail.com` (role: `'super_admin'`). Credentials configured securely via `SUPER_ADMIN_PASSWORD` in `.env`. Full database master authority, portal lock/unlock, system settings, and volunteer/guest credentials management. (Legacy alias: `chandanmahapatra2400@gmail.com`).
   - **College Admin (Srusti Executive):** `crossfire@gmail.com` (role: `'admin'`). Credentials configured securely via `ADMIN_PASSWORD` in `.env`. Master roster inspection, attendance verification, desk check-in sheet generation, and data exports. (Legacy alias: `admin@srusti.edu.in`).
   - **Official Volunteer:** `volunteer@srusti.edu.in` or Volunteer ID (e.g. `VOL-101`). Password configured via `VOLUNTEER_PASSWORD` in `.env`.
   - **Official Judge:** `judge@srusti.edu.in`. Password configured via `JUDGE_PASSWORD` in `.env`.

3. **DYNAMIC STUDENT PORTAL ACCESS CONTROLLER:**
   - Controlled in Supabase via table `public.system_settings (key: 'student_portal_open')` and RPC `admin_set_system_setting`.
   - **Phase 1 (Registration Active):** `student_portal_open = false`. Students can only submit registrations and receive immediate on-screen acknowledgement with Pass ID. Student login in `AuthModal` is locked with instructions.
   - **Phase 2 (Registration Closed):** Toggled via prominent button in `AdminDashboard`. `student_portal_open = true`. Students can log in using their Registered Email and Pass ID (e.g. `CF26-1001`) to view schedules and entry QR passes.

4. **RELATIONAL VOLUNTEER & VIP GUEST MANAGEMENT:**
   - `public.volunteers`: Stores credentials (`volunteer_id`, `name`, `contact_number`, `email`, `password`, `assigned_station`, `shift`).
   - `public.guests`: Stores VIP protocol data with relational foreign key `escort_volunteer_id -> public.volunteers(id)`.
   - RPC functions: `admin_upsert_volunteer`, `admin_delete_volunteer`, `admin_upsert_guest`, `admin_delete_guest`, `verify_volunteer_login`.

5. **AUTO-CONFIRM TRIGGER ON AUTH.USERS:**
   - Trigger `tr_crossfire_auto_confirm` automatically marks student sign-ups as confirmed (`email_confirmed_at = now()`) so email verification never blocks registrations.

6. **HIGH-CONCURRENCY DATABASE ARCHITECTURE & DEADLOCK ELIMINATION:**
   - **Atomic Participant Sync:** `registrations_sync_participants` trigger uses atomic increments (`current_participants = current_participants + 1` / `- 1`) instead of heavy full-table aggregate subqueries (`count(*)`), preventing serialization locks across concurrent registrations.
   - **Deterministic Lock Ordering:** `_sync_student_events` sorts event IDs deterministically (`ORDER BY id` / `ORDER BY ev`) prior to insertion, completely preventing reverse lock-order deadlocks when multiple students register simultaneously for overlapping tracks.
   - **Shared Row-Lock Capacity Checks:** `registrations_before_insert` uses `FOR SHARE` locks on event rows, ensuring accurate real-time quota verification without serializing unrelated concurrent transactions.
   - **High-Concurrency Composite Indexes:** Indexed `(role, created_at DESC)`, `(institute_name)`, `(lower(email))`, `(contact_number)`, `(user_id, status)`, and `(event_id, status)`.

7. **SHARED PARENT / TEACHER CONTACT SUPPORT FOR SIBLINGS & CLASSMATES:**
   - Global unique constraint on `public.users(email)` was replaced with a partial index `users_staff_email_unique` enforcing uniqueness strictly on `admin` and `super_admin`.
   - Students, siblings, or classmates who share a parent's/teacher's email or phone are fully supported:
     - The registration service handles Supabase Auth account creation via transparent sub-addressing (`parent+cfXXXX@gmail.com`) while preserving the parent's actual clean email and mobile in `public.users`.
     - Student login matches by Pass ID (`CF26-XXXX`) so multiple candidates sharing an email each log into their distinct gate pass without multi-row query errors.

8. **SECURITY HARDENING & STATEMENT TIMEOUTS:**
   - Administrative views (`admins_view`, `staff_view`) have public/anon access revoked and are restricted strictly to `authenticated` and `service_role`.
   - `submit_registration_form` has an enforced statement timeout guard (`SET statement_timeout = '8000'`) to prevent runaway transactions under DDoS or heavy load spikes.

---

## 🗺️ 8. ROADMAP: WHAT WE ARE GOING TO BUILD NEXT

The following features represent the planned pipeline and upcoming milestones:

### 🎯 Phase 1: Real-Time & Communications (Immediate Priority)
- [ ] **Supabase Real-Time Subscriptions:** Connect `supabase.channel` listeners in `VolunteerDashboard` and `LeaderboardPage` so check-ins and scores reflect instantly across multiple volunteer devices without manual refresh.
- [ ] **Automated WhatsApp / SMS Notification Gateway:** Connect Twilio, Gupshup, or Fast2SMS API to dispatch instant WhatsApp registration confirmations with PDF Admit Card links.
- [ ] **Automated Debate Topic Morning Broadcast:** Scheduled push at 07:00 AM on November 15, 2026 sending the confidential debate topic directly to registered debate candidates.

### 🎯 Phase 2: Competition Day Modules
- [ ] **Live Campus Quiz Buzzer System:** Real-time buzzer mechanism (WebSocket / Supabase Presence) for the final 6 teams on stage in Auditorium A.
- [ ] **Direct Cloud Media Uploads:** Supabase Storage bucket integration (`reels-submissions/`, `posters/`) allowing students to upload MP4/JPEG files directly instead of third-party URLs.
- [ ] **Dynamic Certificate Generator:** Server-side / Canvas generation of verifiable participation and champion certificates with unique verification QR codes.

### 🎯 Phase 3: Post-Event Analytics & Ceremony
- [ ] **Valedictory Presentation Deck:** Full-screen projector presentation mode showcasing 1st, 2nd, and 3rd place winners per event with institute logos and prize checks.
- [ ] **Post-Event Data Export:** Complete analytical summary (attendance percentage by school/board, stream breakdown, lunch consumption stats) for SAGS management.

---

## 📁 9. REPOSITORY FILE MAP

```
c:\CrossFire\
├── BRAIN.md                         <-- [THIS FILE] Central Knowledge Base & Project Blueprint
├── CROSSFIRE_PRD.md                 <-- Product Requirements Document & Event Guidelines
├── package.json                     <-- Scripts and npm dependencies
├── vite.config.ts                   <-- Vite build configuration
├── tailwind.config.js               <-- Tailwind theme tokens (Navy: #001F3F, Orange: #FF6B35)
├── index.html                       <-- HTML entry point
│
├── public/                          <-- Static public assets
│   ├── A3-Crossfire-2026-Poster.pdf <-- Official downloadable poster
│   ├── crossfire-2026-brochure.pdf  <-- Official downloadable brochure
│   ├── Crossfire-coupon.pdf         <-- Food coupon print asset
│   ├── Logo.png / sagslogo.png      <-- Brand logos
│   └── hero-bg.jpg                  <-- Hero banner background
│
├── src/
│   ├── App.tsx                      <-- Hash router, route protection, mobile navigation bar
│   ├── main.tsx                     <-- React DOM bootstrap
│   ├── index.css                    <-- Custom styles & font configuration
│   │
│   ├── components/                  <-- Reusable UI components
│   │   ├── Navbar.tsx               <-- Top header with logo and navigation links
│   │   ├── Footer.tsx               <-- Site footer with SAGS contact & location details
│   │   ├── CinematicIntro.tsx       <-- Fullscreen opening splash animation
│   │   ├── CountdownTimer.tsx       <-- Live countdown to Nov 15, 2026
│   │   ├── LiveQRScanner.tsx        <-- HTML5 camera barcode/QR scanner
│   │   ├── StudentQRCode.tsx        <-- SVG Admit Card QR generator
│   │   ├── AuthModal.tsx            <-- Staff & Admin authentication modal
│   │   └── HeroParticlesBackground  <-- Three.js particle canvas
│   │
│   ├── context/
│   │   ├── AuthContext.tsx          <-- User authentication, session persistence, role gates
│   │   └── EventsContext.tsx        <-- Event catalog and active registration state
│   │
│   ├── data/
│   │   └── mockData.ts              <-- Event metadata, rules, initial tracks, schedule
│   │
│   ├── hooks/                       <-- Custom React hooks
│   │   ├── useAdminData.ts          <-- Real-time KPI aggregation hook
│   │   ├── useLeaderboard.ts        <-- Leaderboard score listener hook
│   │   └── useNotifications.ts      <-- Notification dispatch hook
│   │
│   ├── lib/
│   │   └── supabase.ts              <-- Supabase client & createIsolatedClient factory
│   │
│   ├── pages/                       <-- Core application pages
│   │   ├── LandingPage.tsx          <-- Main public landing page
│   │   ├── EventsDiscoveryPage.tsx  <-- Track directory with prize and rule cards
│   │   ├── RegistrationPage.tsx     <-- Official Google-form equivalent registration
│   │   ├── StudentDashboard.tsx     <-- Student gate pass, venues, submission portal
│   │   ├── VolunteerDashboard.tsx   <-- QR scanner, gate check-in, meal voucher redeem
│   │   ├── JudgePanel.tsx           <-- Jury rubric grading & score locking
│   │   ├── AdminDashboard.tsx       <-- Central command center, rosters, guests, volunteers
│   │   └── LeaderboardPage.tsx      <-- Real-time scoreboard with pre-event standby
│   │
│   ├── services/
│   │   ├── studentDataService.ts    <-- Dual-tier storage engine (Supabase RPC + local)
│   │   └── guestVolunteerService.ts <-- VIP guests & volunteer management service
│   │
│   └── types/
│       └── index.ts                 <-- TypeScript interfaces (UserProfile, EventItem, etc.)
│
├── supabase/
│   └── schema.sql                   <-- Master PostgreSQL schema, tables, triggers & RLS
│
└── scripts/                         <-- Node.js administrative & maintenance utilities
    ├── migrate.mjs                  <-- Execute schema.sql migration on Supabase
    ├── audit-registration.mjs       <-- Audit auth users vs database tables
    ├── check-admin.mjs              <-- Inspect admin user account status
    └── probe-signup.mjs             <-- Diagnostic signup test runner
```

---

## 💻 10. DEVELOPER & AGENT CHEAT SHEET

### Development Server:
```bash
npm run dev
# App running locally on http://localhost:5173
```

### Database Migration:
```bash
# Applies supabase/schema.sql safely using DIRECT_URL
npm run db:migrate
```

### Database Health Audit:
```bash
node scripts/audit-registration.mjs
```

---

*This document is maintained as the single source of truth for CROSSFIRE 2026. Keep it updated whenever major architecture changes, database schema modifications, or milestones are achieved.*
