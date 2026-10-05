# CROSSFIRE 2026 - Master Agent Handoff & Project Tracking

> **Purpose:** This document is the single source of truth for all human developers, project managers, and AI agents collaborating on the **CROSSFIRE 2026** platform. Read this file first to understand project context, system design, architectural standards, phased roadmap, and live progress.

---

## 📌 1. Project Overview

- **Project Name:** CROSSFIRE 2026 Platform
- **Organization:** Srusti Academy of Graduate Studies (Bhubaneswar, Odisha)
- **Event Date:** November 15, 2026
- **Audience:** +2 Final Year students (Ages 16–18), College Organizers, Judges, System Administrators
- **Expected Concurrency:** 300+ concurrent users on event day
- **Core Mission:** An end-to-end talent hunt event management platform handling student registrations, event discovery across 6 competitive tracks, team formation, Supabase-powered authentication, real-time judge scoring rubrics, live leaderboards, and administrative oversight.

---

## 🏆 2. The 6 Competitive Events & Group Distribution

The competitions are officially categorized into **Group A** and **Group B**. Students can select up to **2 competitions total** across both groups:

### **Group A Competitions:**
1. **Intelect Odyssey (Quiz):** Team of 2 • Preliminary round + buzzer final (Accuracy 60%, Speed 40%) • ₹13,500 prize pool
2. **Spontanity Erena (Extempore / Debate):** Solo • Live contemporary topic announced morning-of (Argumentation 40%, Clarity 30%, Rebuttal 30%) • ₹13,500 prize pool
3. **Spectrum on Canvas (Poster Making):** Solo • Digital / hand-drawn scan (Design 35%, Message Clarity 35%, Creativity 30%) • ₹13,500 prize pool

### **Group B Competitions:**
1. **Hidden Horizon (Treasure Hunt):** Team of 3 • Campus checkpoints (Speed 50%, Accuracy 50%, Bonus 10%) • ₹13,500 prize pool
2. **Glam 'n' Dazzle (Ramp Walk):** Solo • Runway showcase (Appearance 30%, Stage Presence 30%, Personality 40%) • ₹13,500 prize pool
3. **Instaverse (Reels):** Solo • 30–60s micro-film upload (<50MB MP4) (Creativity 35%, Content 35%, Execution 30%) • ₹13,500 prize pool

---

## 📋 2.1 Official Google Form Registration Specification

The student intake form strictly mirrors the Srusti Academy of Management & Technology Google Form:
1. **Name of the Student** (Required)
2. **Contact No.** (Required)
3. **Email Id** (Required, e.g. `imazureakash@gmail.com`)
4. **Name of the Institute** (Required)
5. **Name of the City / Town** (Required)
6. **Course Stream** (Required): `12th Science` | `12th Commerce` | `12th Arts`
7. **Group A Competitions (Any)**: Intelect Odyssey, Spontanity Erena, Spectrum on Canvas
8. **Group B Competitions (Any)**: Hidden Horizon, Glam 'n' Dazzle, Instaverse (Max 2 total across A & B)
9. **WhatsApp Number** (Required, with auto-fill toggle from Contact No.)
10. **Food Preference** (Required): `Veg` | `Non-veg`
11. **Send me a copy of my responses** toggle

---

## 🏛️ 3. Role Hierarchy & 4 Dedicated Dashboards Architecture

Following the design alignment, the platform features **4 distinct, dedicated dashboards** tailored for clean, friction-free interaction:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CROSSFIRE 2026 PLATFORM                          │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ 🎓 STUDENT        │ ⚖️ JUDGE          │ 🤝 VOLUNTEER      │ 🛡️ ADMIN        │
│ DASHBOARD         │ DASHBOARD         │ GROUND OPS HUB    │ COMMAND CENTER  │
├───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ • Digital QR Pass │ • Split-view list │ • Gate Check-in   │ • Real-time KPIs│
│ • Room & Venue    │ • Rich candidate  │ • Food Token desk │ • Judge assign  │
│   guide           │   profile cards   │   (Veg / Non-veg) │ • WhatsApp topic│
│ • Event countdown │ • Rubric sliders  │ • Room stage      │   broadcaster   │
│ • Food token badge│ • Lock submission │   reporting check │ • Dispute/unlock│
│ • Live scores     │ • Audit trail     │ • Campus incident │   overrides     │
│ • Media uploader  │   log             │   logger          │ • CSV exports   │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

### 1. Student Dashboard (Simplicity & Guidance):
- **Digital Event Pass (QR Badge):** Unique student QR code with registration ID, school name, and food preference badge (`🥗 Veg` / `🍗 Non-veg`).
- **Live Room & Venue Guide:** Shows the exact room/auditorium for each registered track (e.g. *Auditorium A, Management Seminar Hall B, Media Studio*).
- **Status Timeline:** "Registered" ➔ "Report to Venue" ➔ "Under Scoring" ➔ "Result Announced".
- **Media Upload Desk:** Quick link submit for Reels & Poster Making.

### 2. Judge Dashboard (Clean & Organized Evaluation):
- **Split-View Queue:** Candidate roster on the left with check-in status and search filter; active candidate card on the right.
- **Rich Candidate Dossier:** Displays student name, school, board, stream, team roster, and media preview.
- **Interactive Rubric Engine:** Custom sliders matching each competition's official criteria (Accuracy, Speed, Styling, Argumentation, etc.).
- **Score Lock Mechanism:** Prevents accidental modification post-submission while recording timestamp for audit.

### 3. Volunteer / Organizer Dashboard (Ground Operations Hub):
- **Gate Check-In Scanner:** Rapid search & QR scan to mark attendance when students arrive on campus.
- **Catering & Food Counter Desk:** Tracks lunch/refreshment token redemption based on the student's `Veg` / `Non-veg` preference to eliminate double-claims.
- **Venue Room Stage Coordinator:** Marks whether a student/team has physically reported to their specific venue room so judges know they are ready.
- **Incident Logger:** Quick escalation to Admin for missing members or audio/video issues.

### 4. Admin Command Center (Master Control & Overrides):
- **Executive Analytics:** Live count of registrations (245/300), campus check-ins, food tokens redeemed, and track scoring progress.
- **Judge Assignment Matrix:** Assigns evaluators to the 6 tracks and tracks completion percentages.
- **Instant WhatsApp Broadcast Desk:** Transmits morning debate topics, schedule changes, and general announcements.
- **Dispute & Override Desk:** Capability to unlock a judge's score in case of error or resolve ties.
- **Master Export:** 1-click export of complete student rosters with scores to CSV/Excel.

---

## 🏛️ 4. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (React + Vite + TS)               │
│  - Tailwind CSS Design System (Navy #001F3F + Orange #FF6B35)│
│  - Lucide Icons + Canvas Confetti + Framer Motion-style CSS │
│  - Responsive Mobile-First Layouts                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     SUPABASE AUTH SERVICE    │ │    SUPABASE POSTGRES DB      │
│ - Email/Password & Google    │ │ - Tables: users, events,     │
│ - JWT Session Management     │ │   registrations, scores,     │
│ - Role-Based Access Control  │ │   notifications, audit_logs  │
│   (Student, Judge, Admin)    │ │ - Row Level Security (RLS)   │
│ - Auto-profile sync trigger  │ │ - Realtime WebSocket channels│
└──────────────────────────────┘ └──────────────────────────────┘
```

- **Frontend:** React 18 / Vite / TypeScript
- **Styling:** Tailwind CSS + Vanilla CSS Tokens
- **Icons:** Lucide-React
- **Authentication:** Supabase Auth (`@supabase/supabase-js`) with custom profile sync
- **Database & Realtime:** Supabase PostgreSQL with RLS policies and Realtime channel for Leaderboard & Notifications
- **Storage:** Supabase Storage (or AWS S3) for media submissions (reels, posters, score proof photos)

---

## 🗄️ 5. Supabase Database Schema & RLS

### Schema Architecture
1. `public.users`: Linked to `auth.users.id` via Foreign Key.
   - Fields: `id (UUID)`, `email`, `first_name`, `last_name`, `mobile_number`, `date_of_birth`, `school_name`, `board (CBSE|ICSE|CHSE)`, `role (student|judge|organizer|admin)`, `parent_consent`, `terms_accepted`, `created_at`.
2. `public.events`: The 6 talent hunt events.
   - Fields: `id`, `name`, `slug`, `description`, `event_type (solo|team)`, `team_size`, `max_participants`, `prize_pool`, `prize_distribution (JSONB)`, `scoring_rubric (JSONB)`, `status`.
3. `public.registrations`: Student registrations.
   - Constraint: `UNIQUE(user_id, event_id)`.
   - Business Logic: Max 2 registrations per `user_id`.
   - Fields: `id`, `user_id`, `event_id`, `team_code`, `team_members (JSONB)`, `status`, `score`, `media_url`, `score_locked`.
4. `public.scores`: Judge submissions.
   - Constraint: `UNIQUE(registration_id, judge_id)`.
   - Fields: `id`, `registration_id`, `judge_id`, `event_id`, `score`, `rubric_scores (JSONB)`, `comments`, `is_final`.
5. `public.judge_assignments`: Assignments of judges to events.
6. `public.notifications`: System announcements and individual alerts.
7. `public.audit_logs`: Traceability for score edits and administrative overrides.

---

## 🚦 6. Phased Implementation Roadmap & Protocol

> **Strict Operational Rule:**
> Work proceeds **one phase at a time**.
> Upon completion of a phase, the agent presents a detailed report and testing checklist.
> **The user must test and explicitly approve/accept the phase before advancing to the next phase.**

```
[Phase 0: Architecture & Foundation] 
          │  (User Test & Accept)
          ▼
[Phase 1: Supabase Auth & Profile] 
          │  (User Test & Accept)
          ▼
[Phase 2: Event Discovery & Student Dashboard] 
          │  (User Test & Accept)
          ▼
[Phase 3: Judge Scoring Panel & Rubrics] 
          │  (User Test & Accept)
          ▼
[Phase 4: Real-time Leaderboard, Admin Panel & Polish]
```

### Breakdown of Phases:

### **Phase 0: Architecture, Agent Handoff & Project Scaffolding**
- **Goal:** Set up project structure, Tailwind design system, Supabase client configuration, SQL migrations, and master handoff documentation.
- **Deliverables:**
  - `AGENT_HANDOFF.md` (this file)
  - Supabase Database migration script `supabase/schema.sql`
  - Vite + React + TypeScript initialized with Tailwind CSS matching `#001F3F` and `#FF6B35`
  - Supabase client initialization with fallback mock capabilities for instant testing
  - Core layouts and routing skeleton

### **Phase 1: Supabase Authentication & Profile Management**
- **Goal:** Complete end-to-end authentication system.
- **Deliverables:**
  - Login Page (Email/Password, Google OAuth button, error handling, loading states)
  - Registration Page (16-18 age validation, School, Board CBSE/ICSE/CHSE, Parent consent, Mobile validation)
  - Supabase Auth state listener & Role-Based Routing (`student`, `judge`, `admin`)
  - User Profile view & edit modal
  - Phase 1 Testing Checklist & User Acceptance

### **Phase 2: Event Discovery & Student Dashboard**
- **Goal:** Core student experience.
- **Deliverables:**
  - Event Discovery grid showcasing all 6 events with prizes, criteria, rules, and team requirements
  - Registration modal enforcing max 2 events limit and team code generation/joining
  - Student Dashboard (Active registrations, event schedule, notifications widget, media upload for Reels & Poster Making)
  - Phase 2 Testing Checklist & User Acceptance

### **Phase 3: Judge Scoring Panel & Rubric Engine**
- **Goal:** Real-time scoring interface for on-site judges.
- **Deliverables:**
  - Judge login landing & assigned events overview
  - Participant queue & single-participant scoring workflow
  - Rubric sliders dynamically configured per event (e.g. Accuracy/Speed for Quiz, Argumentation/Clarity/Rebuttal for Debate)
  - Score locking, audit trail, and confirmation summary
  - Phase 3 Testing Checklist & User Acceptance

### **Phase 4: Real-Time Leaderboard, Admin Operations & Final Polish**
- **Goal:** Real-time synchronization, executive management, and launch readiness.
- **Deliverables:**
  - Real-time Leaderboard with top 10 rankings, school leaderboard, medal indicators, and active student highlighting
  - Admin Panel with KPI metric cards, registration management, judge assignment table, and bulk notification trigger
  - Data export (CSV/Excel report)
  - Mobile responsiveness verification, accessibility check, final launch readiness
  - Phase 4 Testing Checklist & User Acceptance

---

## 📊 7. Current Project Progress Tracker

| Phase / Component | Description | Status | Sign-off Date | Notes |
|---|---|---|---|---|
| **Phase 0: Core Architecture & Setup** | Project scaffold, Tailwind tokens, Supabase schema, Git origin setup | **COMPLETED & PUSHED** | Oct 3, 2026 | Synchronized with `https://github.com/sakashdora/CrossFire.git` |
| **Phase 1: Google Form Registration & Branding** | Authentic intake form (10+ fields), dual college & Crossfire logos | **COMPLETED** | Oct 3, 2026 | Srusti Academy logo & Crossfire emblem rendered, 2-event rule enforced |
| **Phase 2: 4 Dedicated Role Dashboards** | Student, Judge, Volunteer Ground Ops, Admin Command Center | **COMPLETED & VERIFIED** | Oct 3, 2026 | 0 TS errors, production build passes, verified all 4 portals |
| **Phase 3: Real-Time Sync & Live Operations** | Supabase RPCs, Dual-Persistence Event Bus, Live Computed Leaderboards | **COMPLETED & VERIFIED** | Oct 5, 2026 | Real-time synchronization across Student, Volunteer, Judge, Admin |
| **Phase 4: Production Hardening & Hardware Integration** | Dynamic SVG QR codes, HTML5 Camera QR Scanner, VIP Guest & Volunteer Crew Consoles | **COMPLETED & PRODUCTION READY** | Oct 5, 2026 | Zero demo data, real database intake, camera scanning, full CSV exports |

---

## 🚀 8. Production Architecture Highlights

1. **Dynamic SVG QR Pass (`qrcode.react`):** Real-time generation of student Admit Cards and Lunch Vouchers encoding student ID, track choices, food preference, and verification signatures.
2. **Live Camera Scanner (`html5-qrcode`):** Hardware camera integration with device selection, image upload decoder, audio feedback, and 1-tap check-in/meal token redemption.
3. **VIP Guest Management Console:** Dedicated hospitality module for Dignitaries, Chief Guests, and Judges with arrival tracking, vehicle permits, dietary preferences, and 1-click CSV exports.
4. **Volunteer Crew Hub:** Duty station assignments (Gate, Stage, Help Desk, Refreshments), shift tracking, walkie-talkie channel allocations, and kit distribution logger.
5. **Dynamic Computed Leaderboard:** Live calculation of candidate and college rolling trophy points directly from judge submissions without mock fallbacks.
6. **Security & RLS:** Complete compliance with PostgreSQL RLS and `SECURITY DEFINER` RPCs (`submit_registration_form`, `register_for_event`, `get_leaderboard`, `admin_overview`).

---

## 🤖 9. Guidelines for Collaborating AI Agents

If you are an AI agent maintaining this project:
1. **Always reference `README.md` and `AGENT_HANDOFF.md`** for architecture standards.
2. Maintain color tokens: Navy `#001F3F`, Orange `#FF6B35`, Light Orange `#FFA500`, Backgrounds `#FFFFFF` and `#F9FAFB`.
3. Ensure all user operations maintain dual-persistence (reactive custom event bus + Supabase RPC backend).
4. Run `npx tsc --noEmit` and `npm run build` after any modifications to verify zero compilation regressions.
