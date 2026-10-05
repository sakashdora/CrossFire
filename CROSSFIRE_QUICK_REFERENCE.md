# CROSSFIRE Quick Reference Guide for AI Agent

**Use this as your command reference during implementation**

---

## 📋 DOCUMENT QUICK LINKS

| Need | Document | Section |
|------|----------|---------|
| What to build? | CROSSFIRE_PRD.md | All |
| How should it look? | CROSSFIRE_DESIGN_SYSTEM.md | Color (§1), Typography (§2), Spacing (§3) |
| Page layouts? | CROSSFIRE_WIREFRAMES.md | Pages 1-7 |
| Backend specs? | CROSSFIRE_API_SCHEMA.md | DB Schema (§1), API Endpoints (§2) |
| Implementation plan? | CROSSFIRE_IMPLEMENTATION_GUIDE.md | Phases 0-4 |
| This is the summary | CROSSFIRE_QUICK_REFERENCE.md | You are here ✓ |

---

## 🎨 DESIGN TOKENS (Copy-Paste Ready)

### Colors
```css
--navy:           #001F3F  /* Headers, primary text */
--navy-light:     #003D7A  /* Hover states */
--orange:         #FF6B35  /* CTA buttons, highlights */
--orange-light:   #FFA500  /* Button hover */
--orange-pale:    #FFE0CC  /* Backgrounds */
--success:        #10B981  /* Green badges */
--warning:        #F59E0B  /* Yellow status */
--error:          #EF4444  /* Red errors */
--white:          #FFFFFF  /* Background */
--gray-100:       #F3F4F6  /* Light backgrounds */
--gray-200:       #E5E7EB  /* Borders */
--gray-600:       #4B5563  /* Secondary text */
```

### Typography
```
Headings:     Inter, 32px (H1) / 24px (H2) / 20px (H3), bold
Body:         Inter, 16px, regular (400 weight)
Small text:   12px, 600 weight, gray-600
Buttons:      16px, 600 weight, uppercase letter-spacing
```

### Spacing
```
xs: 4px   |  sm: 8px  |  md: 16px  |  lg: 24px  |  xl: 32px  |  xxl: 48px
Standard padding: 16px (all sides)
Standard gap: 16px (between elements)
Card margin: 24px bottom
```

---

## 🔐 AUTHENTICATION FLOW

### Login Flow
```
User Input Email + Password
    ↓
Backend: Hash password → Compare with DB
    ↓
Match? Generate JWT token (exp: 1 hour)
    ↓
Return token + user object
    ↓
Frontend: Store in localStorage + set Authorization header
    ↓
Redirect to dashboard (/dashboard)
```

### Token Refresh
```
JWT expired? → POST /auth/refresh with refresh_token
    ↓
Return new access_token
    ↓
Continue request with new token
```

### On Every Request
```
Header: Authorization: Bearer <JWT_TOKEN>
Backend: Verify token signature + expiry
Invalid? → 401 Unauthorized → Redirect to login
```

---

## 📱 RESPONSIVE BREAKPOINTS

```
MOBILE (320px - 640px)
  - Single column layout
  - Full-width cards (16px padding)
  - Bottom navigation (56px height)
  - Font: 14-16px

TABLET (768px - 1024px)
  - 2-column grid
  - 20px padding
  - Top navigation (56px height)
  - Font: 16px

DESKTOP (1024px+)
  - 3-4 column grid
  - Max width: 1200px
  - Top navigation (64px height)
  - Sidebar optional
  - Font: 16-18px
```

### Testing Checklist
```
☐ Login page: Looks good at 320px, 768px, 1024px
☐ Dashboard: Cards stack properly on mobile
☐ Tables: Horizontal scroll on mobile
☐ Buttons: Min 44px height (touch-friendly)
☐ Text: Readable on all sizes
☐ Images: Responsive with max-width: 100%
```

---

## 🎯 FEATURE IMPLEMENTATION CHECKLIST

### Phase 1: Auth & Dashboard (MVP)

#### Login Page
```
☐ Email input field
☐ Password input field
☐ Validation (real-time)
☐ "Login" button (orange, full-width)
☐ "Forgot password?" link
☐ "Google Sign-in" button
☐ Error message display
☐ Loading spinner on submit
☐ Responsive (mobile/tablet/desktop)
☐ Accessibility: Keyboard navigation, focus visible
```

#### Registration Page
```
☐ Form fields: First name, Last name, Email, Mobile, School, Board, DOB, Password
☐ Real-time validation
☐ Password strength indicator
☐ Age validation (16-18 years)
☐ Parent consent checkbox
☐ Terms acceptance
☐ Submit button (disabled until valid)
☐ Success message + redirect
☐ Error handling
☐ Responsive design
```

#### Student Dashboard
```
☐ Header: Logo + Greeting + Notifications
☐ Registered Events section (max 2 cards)
  ☐ Event name, icon, team size, prize
  ☐ Status badge (Active/Completed)
  ☐ Team members display
  ☐ "View Details" button
☐ Leaderboard widget (top 10)
  ☐ Rank display
  ☐ Current user highlighted (orange background)
  ☐ Medal icons for top 3
  ☐ "View Full Board" link
  ☐ Auto-refresh every 30 sec
☐ Notifications section
  ☐ Show last 5 messages
  ☐ Mark as read
  ☐ Notification bell (unread count badge)
☐ Responsive grid layout
☐ Mobile: Single column, tablet: 2 col, desktop: 3 col
```

#### Events Discovery Page
```
☐ Event grid (6 events)
☐ Cards with: Icon, Name, Team size, Prize, Status
☐ "Register" button per event
☐ Already registered checkmark
☐ Registration limit warning (max 2)
☐ Filter dropdown (optional)
☐ Responsive: 1 col mobile, 2 col tablet, 3 col desktop
☐ Hover effects (shadow increase, button prominent)
```

### Phase 2: Admin & Judge

#### Admin Dashboard
```
☐ KPI Cards: Total Reg, Check-in, Scores, Events
☐ Event Management table
  ☐ Event name, team count, judge assigned, status
  ☐ Sortable columns
  ☐ Row actions dropdown
☐ Judge Assignments table
  ☐ Event, judge name, completion %
  ☐ Reassign button
☐ Quick Actions: Send notification, Download report, Publish results
☐ Role-based access (admin only)
☐ Responsive: Stack vertical on mobile
```

#### Judge Scoring Interface
```
☐ Event header: Quiz | Final Round
☐ Progress bar: 12 of 45 teams
☐ Team details section
  ☐ Team name, school, board, members
  ☐ Submission timestamp
☐ Scoring form
  ☐ Score input (0-100) with validation
  ☐ OR slider (visual feedback)
  ☐ Comments textarea (optional)
  ☐ Photo upload (drag-drop)
☐ Rubric breakdown (if applicable)
  ☐ Category checkboxes
  ☐ Points per category
  ☐ Auto-calculate total
☐ Navigation: [Previous] [Submit] [Next]
  ☐ Submit disabled until score entered
  ☐ Lock score after submit
☐ Post-submit: Confirmation card + Continue button
☐ Responsive: Full-screen mobile, side-by-side desktop
```

### Phase 3: Real-Time & Integration

#### Leaderboard Real-Time (WebSocket)
```
☐ WebSocket server setup (Socket.io)
☐ Connect: ws://api/leaderboard/:event_id
☐ Subscribe on mount, unsubscribe on unmount
☐ Receive score updates
  ☐ Highlight new entry (flash animation)
  ☐ Update rank + score
  ☐ Show movement indicator (↑↓)
☐ Update frequency: Every 30 sec (avoid spam)
☐ Error handling: Reconnect on connection loss
☐ Show "Live" badge when connected
☐ Fallback: Manual refresh if WebSocket unavailable
```

#### WhatsApp/SMS Integration
```
☐ Twilio account setup
☐ Debate topic delivery (Nov 14, 11:59 PM)
  ☐ Send to all debate registrants
  ☐ Message: "Debate topic: [TOPIC]"
☐ Event reminders (Nov 15)
  ☐ Morning: "Event starts in 2 hours"
  ☐ Start: "Event starts now at [VENUE]"
☐ Score release notification
  ☐ "Your score: XX. View leaderboard: [LINK]"
☐ Admin broadcast feature
  ☐ Select target (all, event-specific, judges)
  ☐ Select channel (SMS, WhatsApp, Email)
  ☐ Message preview
  ☐ Send with tracking
```

---

## 🗄️ DATABASE SCHEMA QUICK REFERENCE

### Core Tables
```
users (id, email, password_hash, first_name, last_name, mobile, school, board, role, created_at)
events (id, name, slug, event_type, team_size, start_time, end_time, prize_pool, status)
registrations (id, user_id, event_id, team_code, team_members, status, score, media_url)
scores (id, registration_id, judge_id, score, comments, rubric_scores, is_final)
judge_assignments (id, judge_id, event_id, status, assigned_at)
notifications (id, user_id, type, message, channel, sent_at, read_at)
audit_logs (id, user_id, action, entity_type, entity_id, timestamp)
```

### Key Constraints
```
- Users: email UNIQUE, mobile UNIQUE
- Registrations: UNIQUE(user_id, event_id), Max 2 per user
- Scores: UNIQUE(registration_id, judge_id)
- Judge Assignments: UNIQUE(judge_id, event_id)
```

---

## 🔌 API ENDPOINTS QUICK REFERENCE

### Auth
```
POST /auth/register          (email, password, first_name, last_name, ...)
POST /auth/login             (email, password)
POST /auth/google            (google_token)
POST /auth/refresh           (refresh_token)
POST /auth/logout            
```

### Events
```
GET  /events                 (status filter, sort)
GET  /events/:event_id       
GET  /events/:event_id/leaderboard
```

### Registrations
```
GET  /registrations          (current user's registrations)
POST /registrations          (event_id, team_members)
POST /registrations/:id/submit-media  (file upload)
DELETE /registrations/:id    (withdraw)
```

### Leaderboard
```
GET  /leaderboard            (limit=10, sort=score)
GET  /leaderboard/events/:event_id
GET  /leaderboard/schools    (by school aggregation)
WS   /ws/leaderboard/:event_id  (real-time updates)
```

### Judge
```
GET  /judge/assignments      (assigned events)
GET  /judge/assignments/:id/participants
POST /judge/assignments/:id/score  (submit score)
GET  /judge/assignments/:id/summary
```

### Admin
```
GET  /admin/dashboard        (KPI stats)
POST /admin/events           (create/update event)
POST /admin/judge-assignments (assign judges)
POST /admin/send-notification (bulk SMS/Email)
GET  /admin/reports/export   (CSV/JSON)
```

---

## 🚀 DEPLOYMENT COMMANDS

### Frontend
```bash
# Build
npm run build

# Deploy to Vercel
vercel deploy --prod

# Deploy to Netlify
netlify deploy --prod --dir=.next/standalone

# Local test
npm run dev  # http://localhost:3000
```

### Backend
```bash
# Setup
npm install
npm run migrate              # Run DB migrations
npm run seed                 # Seed test data

# Development
npm run dev                  # http://localhost:3001

# Production
npm run build
npm start

# Docker
docker build -t crossfire-api .
docker run -p 3001:3001 crossfire-api

# Database
psql -U admin -d crossfire -f schema.sql
```

---

## 🧪 TESTING CHECKLIST

### Frontend
```
☐ Login with valid credentials
☐ Login with invalid email
☐ Password reset flow
☐ Google OAuth login
☐ Register new student (valid + invalid cases)
☐ Age validation (must be 16-18)
☐ Select event (max 2)
☐ View leaderboard (live updates)
☐ Mobile responsiveness (all pages)
☐ Keyboard navigation (Tab, Enter, Escape)
☐ Screen reader compatibility
```

### Backend
```
☐ POST /auth/register → 201 Created + JWT token
☐ POST /auth/login → 200 OK + JWT + Refresh token
☐ Invalid credentials → 401 Unauthorized
☐ Expired token → 401 → Refresh → Success
☐ POST /registrations → 201 Created (max 2 per user)
☐ Duplicate registration → 409 Conflict
☐ POST /judge/score → 201 Created + Locked
☐ GET /leaderboard → Real-time via WebSocket
☐ POST /admin/send-notification → 200 OK + delivery tracked
```

### Load Testing
```
☐ 300 concurrent users dashboard load
☐ Leaderboard update latency <500ms
☐ Score submission under load
☐ WebSocket connection stability
☐ Database query optimization (no N+1)
```

---

## ⚡ OPTIMIZATION TIPS

### Frontend
```
- Use React.memo for event cards (prevent re-renders)
- Lazy load leaderboard (virtual scrolling if >100 rows)
- Image optimization (Next.js Image component)
- Code splitting per route
- Cache API responses with TanStack Query
```

### Backend
```
- Index: event_id, user_id, status (common filters)
- Materialized view for leaderboard (refresh every 30s)
- Redis cache for: Events list, Leaderboard, User profile
- Connection pooling: Min 10, Max 50 connections
- Query timeout: 5 seconds (prevent hanging)
```

### Infrastructure
```
- CDN for static assets (CloudFront, Cloudflare)
- Gzip compression enabled
- HTTP/2 enabled
- Image optimization (WEBP format)
- Minify CSS/JS (webpack/Next.js)
```

---

## 🆘 COMMON ISSUES & FIXES

| Issue | Solution |
|-------|----------|
| Leaderboard not updating | Check WebSocket connection (browser console: `socket.connected`) |
| Registration fails with "Max 2 events" | Check registrations table: `SELECT COUNT(*) FROM registrations WHERE user_id = 'X'` |
| Scores not calculating | Verify rubric_scores JSON in scores table |
| Images not loading (S3) | Check bucket CORS: `aws s3api get-bucket-cors --bucket crossfire-media` |
| Performance slow | Run database query analysis: `EXPLAIN ANALYZE <query>` |
| Mobile buttons unclickable | Ensure min 44px height: `min-h-[44px] w-full` |
| Accessibility issues | Run Lighthouse audit or axe DevTools |

---

## 📅 EVENT DAY TIMELINE

```
Nov 14, 11:59 PM
  → Send debate topic via WhatsApp
  → Final system check: All APIs green

Nov 15, 7:00 AM
  → Deploy final code
  → Health checks: DB, API, WebSocket
  → Monitor start

Nov 15, 9:30 AM
  → Quiz starts (first event)
  → Monitor: Error rate, response times
  → Check-in ongoing (QR codes)

Nov 15, 10:30-11:30 AM
  → Quiz scoring live
  → Judge scores appearing on leaderboard (real-time)
  
Nov 15, 11:30 AM-3:00 PM
  → Ramp Walk, Reels, Debate, Poster, Treasure Hunt
  → Continuous monitoring
  → Real-time leaderboard updates

Nov 15, 3:30 PM
  → All events completed
  → Final scores locked
  → Results published
  → Certificates generated

Nov 15, 4:00 PM
  → Debrief + performance analysis
  → Data export + backup
```

---

## 📊 SUCCESS METRICS DASHBOARD

Track these during event:

```
REAL-TIME MONITORING:
✓ System Uptime:       95%+ target
✓ Error Rate:          <0.1% target
✓ API Response Time:   <1 sec target
✓ Leaderboard Update:  <500ms target
✓ WebSocket Connected: 100% target
✓ Database Health:     No timeouts

POST-EVENT:
✓ Registrations:       250+ students
✓ Events Completed:    6/6 on schedule
✓ Scores Published:    <30 min after last event
✓ Student Satisfaction: ≥4/5 NPS
✓ Mobile Experience:   No crashes
✓ Accessibility Score: 90+ (WCAG 2.1 AA)
```

---

## 🧩 MASTER COMPONENT & SERVICE REGISTRY

| Domain | File / Module | Purpose |
|---|---|---|
| **QR Engine** | [`src/components/StudentQRCode.tsx`](file:///c:/CrossFire/src/components/StudentQRCode.tsx) | SVG QR generator for student digital passes & lunch tokens |
| **Camera Scanner** | [`src/components/LiveQRScanner.tsx`](file:///c:/CrossFire/src/components/LiveQRScanner.tsx) | Real HTML5 live camera barcode/QR scanner with file upload fallback |
| **Student Service** | [`src/services/studentDataService.ts`](file:///c:/CrossFire/src/services/studentDataService.ts) | Real registrations, check-in, score recording, and dynamic leaderboards |
| **Guest & Volunteer** | [`src/services/guestVolunteerService.ts`](file:///c:/CrossFire/src/services/guestVolunteerService.ts) | VIP Guest hospitality & Volunteer crew logistics CRUD |
| **Supabase Client** | [`src/lib/supabase.ts`](file:///c:/CrossFire/src/lib/supabase.ts) | Direct client and `SECURITY DEFINER` RPC caller |
| **Leaderboard Hook** | [`src/hooks/useLeaderboard.ts`](file:///c:/CrossFire/src/hooks/useLeaderboard.ts) | Real-time computed leaderboards synced to custom event bus |
| **Admin Hook** | [`src/hooks/useAdminData.ts`](file:///c:/CrossFire/src/hooks/useAdminData.ts) | Real-time analytics, VIP guest registry, volunteer roster |
| **Notifications** | [`src/hooks/useNotifications.ts`](file:///c:/CrossFire/src/hooks/useNotifications.ts) | Admin broadcast and student alert listener |

---

## 💡 PRODUCTION STANDARDS

1. **Zero Mock Data Policy**: All intake and scoring flows are bound to real state and Supabase RPCs.
2. **Dual-Persistence Sync**: Instant reactive event dispatching coupled with Supabase cloud database sync.
3. **High Accessibility**: 44px min touch targets across all mobile views and screen reader labels.
4. **Clean Builds**: Always verified with `npx tsc --noEmit` (0 errors) and `npm run build`.

---

**Last Updated:** October 2026  
**Status:** Production Ready & Verified (0 TypeScript errors)

