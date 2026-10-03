# CROSSFIRE Platform - Master Implementation Guide

**Version:** 1.0  
**Organization:** Srusti Academy  
**Event:** Talent Hunt 2026  
**Launch Date:** November 15, 2026  
**Prepared for:** AI-Agent Orchestrator Workflow

---

## MASTER PROMPT FOR AI AGENT

### CONTEXT & CONSTRAINTS

You are building a **state-level talent hunt event management platform** for Srusti Academy. The platform must:

1. **Handle:** Student registration → Event participation → Real-time scoring → Results publication
2. **Support:** 300+ concurrent users on event day
3. **Maintain:** Navy (#001F3F) + Orange (#FF6B35) brand identity
4. **Ensure:** Responsive design (mobile-first) and accessibility (WCAG 2.1 AA)
5. **Integrate:** WhatsApp (debate topics), SMS (notifications), AWS S3 (media storage)
6. **Security:** Parental consent for minors, data privacy, POSH compliance

### DOCUMENTATION STRUCTURE

This guide coordinates 4 interconnected documents:

```
CROSSFIRE_PRD.md                    ← What to build
    ├─ User roles & permissions
    ├─ Feature specifications
    ├─ Compliance requirements
    │
CROSSFIRE_DESIGN_SYSTEM.md          ← How it looks
    ├─ Color palette & typography
    ├─ Component library
    ├─ Responsive breakpoints
    │
CROSSFIRE_WIREFRAMES.md             ← Page layouts & interactions
    ├─ Login / Registration
    ├─ Student dashboard
    ├─ Admin panel
    ├─ Judge scoring interface
    │
CROSSFIRE_API_SCHEMA.md             ← How it works (backend)
    ├─ Database schema
    ├─ REST API endpoints
    ├─ WebSocket real-time
    ├─ Error handling
```

---

## IMPLEMENTATION PHASES

### PHASE 0: SETUP (Week 1)
**Owner:** Infrastructure & Project Setup  
**Deliverables:** Development environment, design tokens, database setup

#### Tasks:
- [ ] GitHub repository initialization (branching strategy: main → dev → feature/*)
- [ ] Environment variables setup (.env template)
- [ ] Database creation (PostgreSQL schema from CROSSFIRE_API_SCHEMA.md)
- [ ] Design tokens configuration (Tailwind CSS colors, spacing)
- [ ] API key setup (Google OAuth, Twilio/WhatsApp, AWS S3)
- [ ] CI/CD pipeline (GitHub Actions)

#### Key Outputs:
```
crossfire-platform/
├── backend/
│   ├── src/
│   │   ├── models/ (Database models)
│   │   ├── routes/ (API endpoints)
│   │   ├── controllers/ (Business logic)
│   │   ├── middleware/ (Auth, validation)
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ (Design system)
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── hooks/
│   │   └── utils/
│   ├── tailwind.config.js
│   └── package.json
└── docs/
    ├── CROSSFIRE_PRD.md
    ├── CROSSFIRE_DESIGN_SYSTEM.md
    ├── CROSSFIRE_WIREFRAMES.md
    └── CROSSFIRE_API_SCHEMA.md
```

---

### PHASE 1: CORE FEATURES - MVP (Weeks 2-3)

**Owner:** Full-stack development team

#### 1.1 Authentication & User Management

**Component:** LoginPage, RegisterPage, UserProfile

**Specifications from:**
- CROSSFIRE_PRD.md: Section 4.1, 4.2
- CROSSFIRE_DESIGN_SYSTEM.md: Section 4.2 (Input), 4.1 (Button)
- CROSSFIRE_WIREFRAMES.md: Page 1 (Login), Page 2 (Registration)
- CROSSFIRE_API_SCHEMA.md: Section 2.1 (Auth endpoints)

**Implementation Checklist:**
```
Backend:
  [ ] POST /auth/register endpoint
      - Validate age (16-18 years old)
      - Email uniqueness check
      - Password strength validation
      - Mobile OTP verification (optional)
  
  [ ] POST /auth/login endpoint
      - JWT token generation
      - Password hashing (bcrypt)
      - Refresh token mechanism
  
  [ ] POST /auth/google endpoint
      - Google OAuth 2.0 integration
      - User auto-creation on first login
  
  [ ] Database schema: users, auth_tokens tables
  
  [ ] Password reset flow
      - Email verification token
      - Reset link expiry (1 hour)
  
  [ ] Account verification
      - Email confirmation required
      - Resend email option

Frontend:
  [ ] LoginPage component
      - Email input with validation
      - Password input (hidden)
      - "Forgot password?" link
      - Google Sign-in button
      - Error message display
      - Loading states
      - Style: Navy + Orange (refer DESIGN_SYSTEM.md)
  
  [ ] RegisterPage component
      - Multi-step form (name, school, board, password)
      - Real-time field validation
      - Age verification (birth date input)
      - Terms & conditions checkbox
      - Parent consent checkbox (conditional)
      - Success confirmation page
  
  [ ] ProtectedRoute wrapper
      - Check JWT token on app load
      - Redirect to login if expired
      - Handle token refresh automatically
  
  [ ] Responsive design
      - Mobile (320px): Full width forms
      - Tablet (768px): Centered card layout
      - Desktop (1024px+): Centered on page (420px width)
```

---

#### 1.2 Student Dashboard

**Component:** StudentDashboard, EventCard, Leaderboard

**Specifications from:**
- CROSSFIRE_PRD.md: Section 4.2
- CROSSFIRE_DESIGN_SYSTEM.md: Section 4.3 (Card), 4.5 (Badge)
- CROSSFIRE_WIREFRAMES.md: Page 3 (Dashboard)
- CROSSFIRE_API_SCHEMA.md: Section 2.3 (Registration endpoints), 2.4 (Leaderboard)

**Implementation Checklist:**
```
Backend:
  [ ] GET /registrations endpoint
      - Return user's registered events (max 2)
      - Include team member details
      - Show submission status (for media events)
      - Return scores (if available)
  
  [ ] GET /leaderboard endpoint
      - Real-time score aggregation
      - Rank calculation
      - School grouping (optional)
      - Pagination (10-50 entries)
      - WebSocket integration for live updates
  
  [ ] Database materialized view: leaderboard
      - Auto-refresh every 30 seconds
      - Includes movement indicators (↑↓)

Frontend:
  [ ] StudentDashboard layout
      - Header: Welcome message + notification bell
      - Section 1: Registered events (2 cards max)
        - Event name + icon
        - Team member count
        - Status badge (Active/Completed)
        - "View Details" button
      
      - Section 2: Leaderboard (top 10)
        - Rank + name + score
        - Current user highlighted (orange bg)
        - "View Full Board" link
        - Auto-refresh (optional WebSocket)
      
      - Section 3: Notifications
        - Recent updates (max 5)
        - Mark as read functionality
  
  [ ] EventCard component
      - Responsive: Full width mobile, 2-col tablet, 3-col desktop
      - Hover state: Shadow increase
      - Status badge: Color-coded (Active=green, Pending=yellow)
      - Prize display: ₹XX,XXX format
      - CTA button: "View Details" or "Register"
  
  [ ] Leaderboard widget
      - Scrollable if >10 entries
      - Highlight current user with light orange (#FFEDD5) bg
      - Medal icons (🥇🥈🥉) for top 3
      - Responsive: Horizontal scroll on mobile, table on desktop
  
  [ ] Notification bell
      - Unread count badge (red circle)
      - Click to show dropdown
      - Notifications list: Time, message, action link
```

---

#### 1.3 Events Discovery Page

**Component:** EventsPage, EventGrid, FilterBar

**Specifications from:**
- CROSSFIRE_PRD.md: Section 5 (Event workflows)
- CROSSFIRE_DESIGN_SYSTEM.md: Section 4.6 (Navigation)
- CROSSFIRE_WIREFRAMES.md: Page 4 (Events Discovery)
- CROSSFIRE_API_SCHEMA.md: Section 2.2 (Events endpoints)

**Implementation Checklist:**
```
Backend:
  [ ] GET /events endpoint
      - Return all 6 events
      - Filter: status (open/closed)
      - Sort: date, prize
      - Include registration status for current user
      - Response: 200 OK with pagination
  
  [ ] GET /events/:event_id endpoint
      - Full event details
      - Judge count, participant count
      - Scoring rubric (if applicable)
      - Current user's registration details
  
  [ ] POST /registrations endpoint
      - Create registration record
      - Validate: Max 2 events per student
      - Validate: Team size matches event type
      - Send confirmation SMS/email
      - Return team code

Frontend:
  [ ] EventsPage layout
      - Header: Event count + filter dropdown
      - Grid layout: 1 col (mobile), 2 col (tablet), 3 col (desktop)
      - Card per event with:
        - Event icon (emoji or SVG)
        - Event name (20px, navy)
        - Team size (or "Solo")
        - Prize pool (₹ format)
        - Status badge (Open/Closed)
        - Registered checkmark (if applicable)
        - "Register" or "View Details" button
  
  [ ] Event Card hover effects
      - Shadow increase (from md to lg)
      - Subtle scale (105%)
      - Button becomes more prominent
      - Transition: 200ms ease-in-out
  
  [ ] Filter functionality
      - Dropdown: [All Events] [Open] [Closed]
      - Search: Event name (optional)
      - Apply filters instantly
  
  [ ] Registration flow
      - Click "Register" → Modal appears
      - Confirm details (event, team size, prize)
      - Warning if already registered
      - Submit → Success message → Redirect to dashboard
  
  [ ] Responsive behavior
      - Mobile: Full-width cards, single column
      - Tablet: 2-column grid, larger cards
      - Desktop: 3-column grid, detail panels
```

---

### PHASE 2: ADMIN & JUDGE FEATURES (Week 4)

**Owner:** Admin panel & Judge interface development

#### 2.1 Admin Dashboard

**Component:** AdminPanel, KPICards, EventManagement, JudgeAssignments

**Specifications from:**
- CROSSFIRE_PRD.md: Section 3.2, 4.3
- CROSSFIRE_DESIGN_SYSTEM.md: Tables, modals
- CROSSFIRE_WIREFRAMES.md: Page 5 (Admin Panel)
- CROSSFIRE_API_SCHEMA.md: Section 2.6 (Admin endpoints)

**Implementation Checklist:**
```
Backend:
  [ ] GET /admin/dashboard endpoint
      - KPI stats: registrations, check-ins, scores
      - Event overview table
      - Judge assignment status
      - Response requires admin role check
  
  [ ] POST /admin/judge-assignments endpoint
      - Assign judges to events
      - Send notification to judge
      - Validation: Judge availability
  
  [ ] POST /admin/send-notification endpoint
      - Bulk SMS/Email/WhatsApp
      - Target: all students, event-specific, judges
      - Track delivery status
  
  [ ] Database queries
      - Real-time registration count
      - Check-in tracking (QR scan)
      - Score completion percentage
  
  [ ] Audit logging
      - Log all admin actions
      - Timestamp + user + action + entity

Frontend:
  [ ] Admin layout
      - Top nav: Logo + Admin badge + Logout
      - KPI section: 4 cards (stats)
        - Total Registrations (245/300)
        - Today's Check-in (89)
        - Scores Ready (3/6 events)
        - Events Completed (2/6)
      
      - Main content: 2-column layout
        - Left: Event Management table
          - Columns: Event | Teams | Judge | Status
          - Actions: Assign Judge, Send Reminder
        
        - Right: Judge Assignments
          - Columns: Event | Judge | Completion %
          - Actions: Reassign, Send Reminder
      
      - Quick Actions row
        - Send Notification button
        - Download Report button
        - Publish Results button
  
  [ ] KPI Cards
      - Large number display (82pt)
      - Smaller label below
      - Trend indicator (↑15, ↓5, ↔ same)
      - Color-coded: Green for good, Yellow for warning
      - Hover: Slight lift effect
  
  [ ] Event Management Table
      - Sortable columns
      - Sticky header on scroll
      - Row actions: Dropdown menu
      - Status indicators: ✓ Done, ⏳ In progress, ❌ Pending
      - Responsive: Horizontal scroll on mobile
  
  [ ] Modals
      - Assign Judge modal
        - Judge selection dropdown
        - Event selection
        - Confirm button
      
      - Send Notification modal
        - Target radio: All, Event-specific, Judges
        - Channel radio: SMS, Email, WhatsApp, In-app
        - Message textarea
        - Preview
        - Send button
      
      - Close button (X) on all modals
  
  [ ] Responsive behavior
      - Desktop: 2-column layout
      - Tablet: Stack vertical
      - Mobile: Full screen modals
```

---

#### 2.2 Judge Scoring Interface

**Component:** JudgePanel, ScoringForm, ParticipantList

**Specifications from:**
- CROSSFIRE_PRD.md: Section 5 (Event scoring rubrics)
- CROSSFIRE_DESIGN_SYSTEM.md: Section 4.2 (Input with slider)
- CROSSFIRE_WIREFRAMES.md: Page 6 (Judge Scoring)
- CROSSFIRE_API_SCHEMA.md: Section 2.5 (Judge endpoints)

**Implementation Checklist:**
```
Backend:
  [ ] GET /judge/assignments endpoint
      - List of assigned events
      - Completion status
      - Participant count
  
  [ ] GET /judge/assignments/:assignment_id/participants endpoint
      - List of participants to score
      - Media files (if applicable: reels, posters)
      - Sorted by registration time
      - Pagination: 1 per page (required)
  
  [ ] POST /judge/assignments/:assignment_id/score endpoint
      - Score submission (0-100)
      - Comments (optional)
      - Rubric scores (if applicable)
      - Photo upload
      - Lock score after submission (prevent edits)
      - Return: success + next participant
  
  [ ] Score validation
      - Score range: 0-100
      - Type check: Integer
      - Duplicate prevention: One score per judge per participant
  
  [ ] Audit trail
      - Log every score submission
      - Include judge ID, timestamp, IP
  
  [ ] Final leaderboard calculation
      - Aggregate scores from multiple judges (if applicable)
      - Calculate rankings
      - Publish to students

Frontend:
  [ ] Judge Login
      - Same as student login (via /auth/login)
      - Redirect to /judge/assignments on login
  
  [ ] Judge Landing
      - List of assigned events
      - Click event → Start Scoring
      - Show completion percentage
  
  [ ] Scoring Form
      - Header: Event name + Round
      - Breadcrumb: Back to assignments
      
      - Progress bar: "12 of 45 teams"
      
      - Team Details section
        - Team name, School, Board
        - Member names + roll numbers
        - Submission time
      
      - Scoring section
        - Score input (0-100) OR slider
        - Visual feedback: Red (0) → Yellow (50) → Green (100)
      
      - Rubric breakdown (if applicable)
        - Example: Quiz event
          - Accuracy: [0-60 slider]
          - Speed: [0-40 slider]
          - Total: Auto-calculated
      
      - Comments textarea (optional)
        - 100-500 character limit
        - Character count indicator
      
      - Photo upload
        - Drag-drop zone or file picker
        - Multiple files allowed
        - Max 10MB per file
      
      - Navigation buttons
        - [< PREVIOUS] [SUBMIT] [NEXT >]
        - Previous: Disabled on first participant
        - Submit: Enabled only if score entered
        - Next: Auto-fetch next participant
      
      - Loading state: Spinner while submitting
  
  [ ] Post-Submit View
      - Green checkmark: "✓ Score Submitted"
      - Team name + score confirmation
      - "Locked" status badge
      - Progress update: "13 of 45 completed (29%)"
      - [CONTINUE TO NEXT] button
      - [VIEW YOUR SCORES] link (summary)
  
  [ ] Score Summary Page
      - Table of submitted scores
      - Columns: Team | Score | Time | Status
      - Export option (CSV)
  
  [ ] Responsive design
      - Mobile: Full-screen form, large touch targets
      - Desktop: Wider form, side-by-side layout (optional)
      - All buttons: Min 44px height
```

---

### PHASE 3: INTEGRATION & REAL-TIME (Week 5)

**Owner:** Backend integration + WebSocket implementation

#### 3.1 WhatsApp & SMS Integration

**Specifications from:**
- CROSSFIRE_PRD.md: Section 7 (Data & integrations)
- CROSSFIRE_API_SCHEMA.md: Section 2.6 (Send notification endpoint)

**Implementation Checklist:**
```
Backend:
  [ ] Twilio WhatsApp API setup
      - Account configuration
      - Message template approval
      - Sender phone number setup
  
  [ ] Debate topic broadcast (11:59 PM Nov 14)
      - Scheduled job (cron)
      - Send to all debate registrants
      - Message: "Debate topic: [TOPIC]"
      - Include event link
  
  [ ] SMS reminders
      - Event day morning: "Event starts in 2 hours"
      - Event start: "Your event starts now at [VENUE]"
      - Post-event: "Score published - view leaderboard"
  
  [ ] Email notifications
      - Registration confirmation
      - Password reset
      - Score announcement
      - Certificate ready
  
  [ ] Notification service
      - Queue-based (Bull/RabbitMQ)
      - Retry logic (exponential backoff)
      - Rate limiting per channel
      - Delivery tracking
  
  [ ] Error handling
      - Invalid phone number handling
      - Failed delivery logging
      - Admin notification if bulk send fails
```

---

#### 3.2 Real-Time Leaderboard (WebSocket)

**Specifications from:**
- CROSSFIRE_API_SCHEMA.md: Section 2.7 (WebSocket endpoints)

**Implementation Checklist:**
```
Backend:
  [ ] WebSocket server setup
      - Socket.io or native WebSocket
      - Namespace: /leaderboard/:event_id
  
  [ ] Connection handling
      - Authenticate user via JWT
      - Subscribe user to event room
      - Track active connections
  
  [ ] Score update broadcast
      - When score locked: Emit to all subscribers
      - Include: rank, score, timestamp
      - Limit update frequency: Max 1 per 10 sec (prevent spam)
  
  [ ] Leaderboard refresh
      - Every 30 seconds: Emit full leaderboard
      - Include: Top 10 + current user
      - Calculate movement (↑↓ indicators)
  
  [ ] Connection cleanup
      - Disconnect handling
      - Room cleanup if no subscribers

Frontend:
  [ ] LeaderboardWidget component
      - Initialize WebSocket on mount
      - Connect: ws://api.crossfire.com/ws/leaderboard/:event_id
      - Handle incoming updates
      - Update UI reactively
      - Show "Live" badge if connected
      - Show "Last updated: X seconds ago" if disconnected
      - Auto-reconnect on connection loss
      - Cleanup on unmount (disconnect)
  
  [ ] Update animation
      - New rank arrives → Highlight animation
      - Flash: White bg → Light orange → White (200ms)
      - Update text color + font weight
  
  [ ] Error handling
      - Connection failed: Show "Offline" badge
      - Reconnect attempts: Show spinner
      - Fallback: Manual refresh button
```

---

### PHASE 4: TESTING & DEPLOYMENT (Week 6)

**Owner:** QA + DevOps team

#### 4.1 Testing

**Checklist:**
```
Unit Tests:
  [ ] Authentication logic
      - Valid/invalid email
      - Password validation
      - Token generation/refresh
  
  [ ] Registration logic
      - Age validation
      - Duplicate email check
      - Max 2 events per user
  
  [ ] Scoring logic
      - Score range validation
      - Rank calculation
      - Tie-breaking

Integration Tests:
  [ ] User flow: Register → Select events → View leaderboard
  [ ] Admin flow: Configure events → Assign judges → View results
  [ ] Judge flow: Login → Score participants → Lock scores
  [ ] Notification flow: SMS/Email delivery

E2E Tests:
  [ ] Desktop (Chrome, Firefox, Safari, Edge)
  [ ] Mobile (iOS Safari, Android Chrome)
  [ ] Tablet (iPad, Android tablets)
  [ ] Network conditions: Fast, Slow 3G, Offline

Performance Tests:
  [ ] Load test: 300+ concurrent users
      - Dashboard: <2 sec load
      - Leaderboard update: <500ms
  [ ] Stress test: Spike to 500 users
  [ ] Database query optimization (N+1 queries)

Security Tests:
  [ ] OWASP Top 10 check
  [ ] SQL injection prevention
  [ ] XSS protection
  [ ] CORS configuration
  [ ] Rate limiting effectiveness
  [ ] JWT expiration handling

Accessibility Tests:
  [ ] Keyboard navigation (Tab, Enter, Escape)
  [ ] Screen reader support (NVDA, JAWS)
  [ ] Color contrast ratio (4.5:1)
  [ ] Focus indicators visible
```

#### 4.2 Deployment

**Checklist:**
```
Pre-Launch:
  [ ] Environment variables configured
  [ ] Database backups enabled
  [ ] SSL certificate installed (HTTPS)
  [ ] CDN configured for assets
  [ ] Monitoring alerts setup (DataDog, NewRelic)
  [ ] Error tracking (Sentry)
  [ ] Log aggregation (ELK stack or CloudWatch)
  [ ] Incident response plan documented

Launch Day:
  [ ] Health checks: API, DB, WebSocket
  [ ] Load balancer configured
  [ ] Database connection pool optimized
  [ ] Cache warmed (Redis)
  [ ] On-call engineer assigned
  [ ] Slack notifications enabled
  [ ] Hotline setup (for admin issues)

Post-Event:
  [ ] Performance analysis
  [ ] User feedback collection
  [ ] Bug report triage
  [ ] Data export + archival
  [ ] Certificate generation (if applicable)
```

---

## TECH STACK REFERENCE

### Frontend
```
Framework:    Next.js 14 (React 18) with TypeScript
Styling:      Tailwind CSS + CSS Modules
State:        TanStack Query (data) + Zustand (UI state)
Forms:        React Hook Form + Zod validation
Components:   Shadcn/ui + custom components
Icons:        Lucide React (24px standard)
Charts:       Recharts (for admin analytics)
Testing:      Vitest + React Testing Library
Build:        Next.js built-in (Webpack)
```

### Backend
```
Framework:    Node.js + Express.js OR FastAPI (Python)
Database:     PostgreSQL 14+ with Prisma ORM
Cache:        Redis (for leaderboard, sessions)
Auth:         JWT + bcrypt (password hashing)
File Storage: AWS S3 (media uploads)
SMS/WhatsApp: Twilio SDK
Email:        SendGrid
Real-time:    Socket.io (WebSocket)
Testing:      Jest + Supertest
Deployment:   Docker + Kubernetes (or AWS Lambda)
Monitoring:   DataDog / New Relic
```

### DevOps
```
Version Control: GitHub
CI/CD:           GitHub Actions
Container:       Docker
Orchestration:   Docker Compose (dev), K8s (prod)
Infrastructure:  AWS (EC2, RDS, S3, CloudFront)
               OR Azure App Service + SQL Database
Logging:         CloudWatch / ELK Stack
Monitoring:      Prometheus + Grafana
```

---

## COLOR IMPLEMENTATION

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'navy': {
          '50': '#f5f7ff',
          '100': '#eef2ff',
          '900': '#001F3F',  // Primary
          'light': '#003D7A',
          'dark': '#000A1A',
        },
        'orange': {
          '50': '#fff7ed',
          '100': '#FFE0CC',  // Pale
          '400': '#FFA500',  // Light
          '500': '#FF6B35',  // Primary
          '600': '#E55A24',  // Hover
          '700': '#D84315',  // Active
        },
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
      }
    }
  }
}
```

### CSS Variables (Alternative)
```css
:root {
  --color-navy: #001F3F;
  --color-navy-light: #003D7A;
  --color-orange: #FF6B35;
  --color-orange-light: #FFA500;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-white: #FFFFFF;
  --color-gray-600: #4B5563;
  --color-gray-200: #E5E7EB;
}

/* Usage */
button {
  background-color: var(--color-orange);
  color: var(--color-white);
}
```

---

## AI AGENT WORKFLOW - HOW TO USE THIS GUIDE

### For Frontend Development:
1. Read CROSSFIRE_DESIGN_SYSTEM.md → Component specs
2. Read CROSSFIRE_WIREFRAMES.md → Page layouts
3. Implement with React/TypeScript
4. Use Tailwind CSS with color variables
5. Test responsiveness at breakpoints (320px, 768px, 1024px)

### For Backend Development:
1. Read CROSSFIRE_API_SCHEMA.md → Database + API
2. Create PostgreSQL schema from Section 1
3. Implement REST endpoints from Section 2
4. Set up WebSocket for real-time
5. Add authentication from Section 3

### For Admin/Judge Features:
1. Read CROSSFIRE_WIREFRAMES.md → Page 5 (Admin), Page 6 (Judge)
2. Read CROSSFIRE_API_SCHEMA.md → Section 2.6, 2.5
3. Implement dashboard components
4. Implement scoring interface

### For Integration:
1. Read CROSSFIRE_PRD.md → Section 7 (Integrations)
2. Set up Twilio (WhatsApp/SMS)
3. Configure AWS S3 (media storage)
4. Implement SendGrid (email)
5. Set up WebSocket (Socket.io)

---

## DEPLOYMENT CHECKLIST - EVENT DAY

### 24 Hours Before (Nov 14, 10:00 PM)
- [ ] Final database backup
- [ ] Load test results reviewed
- [ ] All APIs responding 200 OK
- [ ] WebSocket connections stable
- [ ] Admin panel tested
- [ ] Judge accounts created
- [ ] Demo registrations cleared
- [ ] SSL certificate valid
- [ ] On-call engineer assigned

### Event Day Morning (Nov 15, 7:00 AM)
- [ ] System health checks passed
- [ ] Database connections healthy
- [ ] Cache warmed (Redis)
- [ ] Monitoring alerts active
- [ ] Slack notifications enabled
- [ ] Hotline phone available

### During Event (Nov 15, 10:00 AM - 4:00 PM)
- [ ] Monitor error rate (target: <0.1%)
- [ ] Watch API response times (<1 sec)
- [ ] Check WebSocket connections
- [ ] Monitor database load
- [ ] Verify SMS/Email delivery
- [ ] Check leaderboard updates

### Post-Event (Nov 15, 4:00 PM - 5:00 PM)
- [ ] All scores published
- [ ] Certificates generated
- [ ] Results exported
- [ ] Database backed up
- [ ] Performance analysis initiated

---

## SUCCESS METRICS

### Launch Day:
```
✅ 95%+ system uptime
✅ <2 sec page load time (Lighthouse)
✅ 0 critical errors (Sentry)
✅ Leaderboard updates <500ms (WebSocket)
✅ 300+ concurrent users supported
✅ 100% mobile responsive
✅ Accessibility score: 90+ (WCAG 2.1 AA)
```

### User Satisfaction:
```
✅ Student NPS: ≥4/5
✅ Admin task completion: <3 min per action
✅ Judge scoring: <2 min per participant
✅ Leaderboard refresh: Real-time
```

### Event Metrics:
```
✅ Registrations: 250+ students
✅ Events completed: 6/6 on schedule
✅ Media uploaded: 95%+ of participants
✅ Results published: Within 30 min of last event
✅ Certificates issued: 100% of participants
```

---

## TROUBLESHOOTING GUIDE

### Issue: Leaderboard not updating in real-time
**Solution:** Check WebSocket connection
```bash
# Inspect in browser console
console.log(socket.connected) # Should be true
console.log(socket.id)        # Should have value

# Server-side
console.log('Active connections:', io.engine.clientsCount);
```

### Issue: Registration showing "Max events reached" for first event
**Solution:** Check registrations table
```sql
SELECT COUNT(*) FROM registrations 
WHERE user_id = 'UUID' AND status = 'registered';
```

### Issue: Scores not calculating correctly
**Solution:** Verify rubric_scores JSON in scores table
```sql
SELECT registration_id, score, rubric_scores 
FROM scores WHERE event_id = 'event_uuid';
```

### Issue: Images not loading (S3)
**Solution:** Check CORS and bucket permissions
```bash
# Verify S3 bucket CORS config
aws s3api get-bucket-cors --bucket crossfire-media
```

---

## MAINTENANCE POST-EVENT

### Data Archival
```
- Export all registrations, scores, leaderboards (CSV)
- Backup PostgreSQL database
- Store in S3 (separate archive bucket)
- Retention: 1 year
```

### Metrics & Analysis
```
- User engagement metrics
- Performance bottlenecks
- Failed requests analysis
- Feature usage stats
- Feedback compilation
```

### Reusability for Next Event
```
- Convert event to template
- Parameterize dates/prizes
- Test with demo data
- Documentation update
```

---

**DOCUMENT COMPLETED**

**Total Implementation Time: 6 weeks**  
**Team Size: 2-3 frontend + 2-3 backend + 1 DevOps**  
**Post-MVP Roadmap: Mobile app, multi-event federation, AI scoring**

This guide is your master prompt for the AI-agent orchestrator. Reference the section numbers when requesting implementations.

---

**Questions for your team?**
```
Q: Can we skip WebSocket for MVP?
A: Yes, use REST polling (GET /leaderboard every 30 sec) instead.

Q: Do we need offline mode?
A: Only for viewing cached data. Scoring requires online.

Q: Timeline flexible?
A: If tight, defer Phase 3 (real-time) to post-event update.

Q: Budget constraints?
A: Use AWS free tier + open-source tools. Upgrade post-event.
```

**Version History:**
- v1.0: Initial release (Oct 2026)
- Future: Mobile app roadmap, multi-event scaling

