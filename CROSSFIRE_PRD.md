# CROSSFIRE Event Platform - Product Requirements Document

**Version:** 1.0  
**Date:** October 2026  
**Organization:** Srusti Academy of Graduate Studies  
**Platform:** Web + Mobile Responsive  
**Target Users:** Students (16-18), Organizers, Judges, Admins

---

## 1. EXECUTIVE SUMMARY

CROSSFIRE is a state-level talent hunt platform enabling +2 Final Year students to participate in 6 competitive events (Quiz, Ramp Walk, Reels, Debate, Poster Making, Treasure Hunt). The platform manages registration, real-time scoring, leaderboard management, and post-event analytics.

**Scope:** MVP for November 15, 2026 event at Srusti Campus  
**Scalability:** Designed for future recurring events and multi-institution expansion

---

## 2. BRAND IDENTITY & DESIGN SYSTEM

### 2.1 Color Palette
```
PRIMARY COLORS:
  Navy Blue (Dark):     #001F3F (Logo circle, headers, text)
  Orange (Accent):      #FF6B35 (Call-to-action, highlights)
  Orange (Light):       #FFA500 (Secondary buttons, hover states)
  Yellow/Gold:          #FFC107 (Badges, achievements)

NEUTRAL COLORS:
  White:                #FFFFFF (Background)
  Light Gray:           #F5F5F5 (Card backgrounds, hover)
  Medium Gray:          #999999 (Disabled text, secondary labels)
  Dark Gray:            #333333 (Body text)
  Border Gray:          #E0E0E0 (Dividers, borders)

SEMANTIC COLORS:
  Success (Green):      #4CAF50 (Score accepted, completion)
  Warning (Yellow):     #FF9800 (Pending status)
  Error (Red):          #F44336 (Validation errors)
  Info (Blue):          #2196F3 (Notifications)
```

### 2.2 Typography
```
FONT FAMILY: Inter (web-safe), -apple-system fallback
  
  Heading H1:       32px, bold (900), navy
  Heading H2:       24px, bold (700), navy
  Heading H3:       20px, semibold (600), navy
  Heading H4:       18px, semibold (600), navy
  
  Body Text:        16px, regular (400), dark gray
  Body Small:       14px, regular (400), dark gray
  Label:            12px, semibold (600), medium gray
  
  Button Text:      16px, semibold (600), white on orange/navy
  Badge Text:       11px, bold (700), white
```

### 2.3 Component Spacing
```
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  
  Standard padding: md (16px)
  Standard margin: lg (24px)
  Card radius: 8px
  Button radius: 6px
```

---

## 3. USER ROLES & PERMISSIONS

### 3.1 Student
- ✅ View available events
- ✅ Register for max 2 events
- ✅ Form/join teams
- ✅ Upload media (reels, posters)
- ✅ View live leaderboard
- ✅ Receive notifications
- ❌ Cannot modify rules
- ❌ Cannot access judge panel

### 3.2 Organizer/Event Manager
- ✅ View all registrations
- ✅ Approve/reject registrations
- ✅ Assign judges to events
- ✅ Configure event schedules
- ✅ Send bulk notifications
- ✅ View event analytics
- ✅ Export reports
- ❌ Cannot score events

### 3.3 Judge
- ✅ View assigned events & participants
- ✅ Score participants in real-time
- ✅ Add comments/feedback
- ✅ View current standings
- ✅ Lock scores after submission
- ❌ Cannot modify event rules
- ❌ Cannot see other judges' scoring interface

### 3.4 Admin
- ✅ Full system access
- ✅ User management (create/delete roles)
- ✅ Event template configuration
- ✅ System settings & integrations
- ✅ Security & compliance reports
- ✅ Backup & data export
- ✅ Edit all event data
- ✅ Override any decision

---

## 4. CORE FEATURES

### 4.1 Student Login & Registration

**Workflow:**
```
Landing Page
    ↓
Login/Register (Email + Password / Google OAuth)
    ↓
Profile Completion (Name, School, Board, Contact)
    ↓
Event Discovery & Selection
    ↓
Dashboard
```

**Login Page Elements:**
- Email or Google Sign-in
- Password reset link
- "New here?" signup toggle
- Terms & Conditions checkbox
- College branding (logo, name)

**Registration Form:**
- First Name (required)
- Last Name (required)
- Email (unique validation)
- Mobile Number (required, for SMS)
- School Name (required)
- Board (CBSE/ICSE/CHSE dropdown)
- Date of Birth (age verification: 16-18)
- Password (strength indicator)

**Post-Login: Events Discovery Page**
- Display all 6 events with cards
- Event details: description, team size, prize pool
- "Register Now" button per event
- Already registered badge if applicable
- Event count badge (e.g., "2/2 registered")

### 4.2 Student Dashboard

**Layout (4 sections):**

**Section 1: Profile Widget**
- Student photo placeholder
- Name, school, board
- "Edit Profile" button

**Section 2: Registered Events**
- Card list of 2 max events
- Status: "Active", "Completed"
- Team members (if applicable)
- Submission status (if media required)
- Score (if available)
- Link to event details

**Section 3: Leaderboard**
- Real-time ranking (top 10)
- Student's current position
- Score breakdown per event
- Filter by event dropdown

**Section 4: Notifications**
- Debate topic announcement
- Event schedule reminders
- Score release notifications
- System messages

### 4.3 Admin Dashboard

**Layout (5 sections):**

**Section 1: KPI Cards (Top)**
```
┌──────────────┬──────────────┬──────────────┐
│ Total Reg    │ Today Check  │ Score Ready  │
│ 245/300      │ 89           │ 3/6 events   │
└──────────────┴──────────────┴──────────────┘
```

**Section 2: Event Management**
- Table: Event Name | Team Count | Judge Assigned | Status
- Bulk actions: Assign judges, Send reminders
- Add/edit events
- Event configuration drawer

**Section 3: Judge Management**
- List of judges by event
- Assignment status
- Score submission status
- Re-assign button

**Section 4: Registration Analytics**
- Bar chart: Students per event
- Board distribution pie chart
- School-wise breakdown

**Section 5: Quick Actions**
- Send notification (bulk/individual)
- Download report (Excel)
- View judge scores (real-time dashboard)
- Post results

### 4.4 Judge Panel

**Landing (After Login):**
- List of assigned events
- Submission status per event
- "Start Scoring" button

**Scoring Interface:**
```
EVENT: Quiz | ROUND: Final
┌─────────────────────────────────┐
│ Team: ABC School Team 1          │
│ Members: John Doe, Jane Smith    │
├─────────────────────────────────┤
│ Score: [0-100 slider or input]   │
│ Comments: [Text area]            │
│ Photos: [Upload arena]           │
├─────────────────────────────────┤
│ [Previous] [Submit] [Next]       │
└─────────────────────────────────┘

Bottom: "12 of 45 completed"
```

**After Submit:**
- Score locked (cannot edit)
- Summary card shows all scores entered
- Final leaderboard preview (if all judges done)

---

## 5. EVENT-SPECIFIC WORKFLOWS

### 5.1 Quiz (Written Round + Campus Final)

**Pre-Event:**
- Registration deadline
- Confirm 2-person team
- WhatsApp notification sent

**Event Day:**
- Check-in scanning (QR code)
- Written test (online or paper)
- Top 6 teams advance

**Scoring:**
- Judge enters score (0-100)
- Rubric: Accuracy (60%), Speed (40%)
- Tie-breaker: Judge discretion vote

**Leaderboard Update:**
- Real-time after all judges submit
- Publish to all students

### 5.2 Ramp Walk (Live Performance)

**Registration:**
- Individual only
- Confirm attendance

**Event Day:**
- Check-in at venue
- 2-minute performance window
- Judge scores on-site

**Scoring Rubric:**
```
Appearance & Confidence:    30 points
Stage Presence:             30 points
Personality & Expression:   40 points
Total:                      100 points
```

**Leaderboard:** Instant after event

### 5.3 Reels (Video Submission)

**Pre-Event:**
- Upload video (30-60 sec)
- File validation (MP4, <50MB)
- Submit deadline: Nov 14

**Scoring (On event day or pre-recorded):**
- Creativity:   35 points
- Content:      35 points
- Execution:    30 points

**Gallery:**
- Public or private viewing per college policy

### 5.4 Debate (Live Topic)

**Before Event:**
- Topic sent via WhatsApp on morning of Nov 15
- 15 min prep time

**During Event:**
- Individual speaks 2 min opening, 1 min rebuttal
- Judge tracks argumentation

**Scoring Rubric:**
```
Argumentation & Logic:  40 points
Clarity & Expression:   30 points
Rebuttal Strength:      30 points
Total:                  100 points
```

### 5.5 Poster Making (Digital or Physical)

**Registration:**
- Individual
- Theme provided at event start

**Submission:**
- Physical poster scanned/photographed
- OR digital file uploaded

**Scoring:**
```
Design & Aesthetics:  35 points
Message Clarity:      35 points
Creativity:           30 points
```

### 5.6 Treasure Hunt (Team of 3)

**Registration:**
- 3-person team required
- Confirm all members

**Event Day:**
- Physical clues across campus
- Team must complete all stations
- Time & accuracy scored

**Scoring:**
```
Speed (Time to complete):    50 points
Accuracy (Correct answers):  50 points
Bonus (First 3 teams):       10 points
```

---

## 6. TECHNICAL REQUIREMENTS

### 6.1 Platform Support
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet (iPad, Android tablets)
- ✅ Responsive breakpoints: 320px, 768px, 1024px, 1440px

### 6.2 Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Android browser (latest 2 versions)

### 6.3 Performance Targets
- **Load time:** <3 sec (first paint)
- **LCP (Largest Contentful Paint):** <2.5s
- **CLS (Cumulative Layout Shift):** <0.1
- **Lighthouse score:** 90+ (Performance, Accessibility)

### 6.4 Security Requirements
- ✅ HTTPS/TLS 1.2+
- ✅ Password hashing (bcrypt)
- ✅ CORS properly configured
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Rate limiting (API)
- ✅ Session timeout (30 min)

---

## 7. DATA & INTEGRATIONS

### 7.1 Third-party APIs
- **WhatsApp:** Twilio API (send debate topics)
- **SMS:** AWS SNS (confirmations, reminders)
- **Email:** SendGrid (password reset, certificates)
- **Google Auth:** OAuth 2.0 (sign-in)
- **File Storage:** AWS S3 (media uploads)

### 7.2 Offline Capability
- ✅ Service worker caching (core assets)
- ✅ Offline mode: View profile, cached leaderboard
- ❌ Cannot register or submit scores offline

---

## 8. COMPLIANCE & PRIVACY

### 8.1 Data Protection (Minors <18)
- Parental consent for data collection (optional link)
- No personal data sharing with third parties
- GDPR-like data retention: 90 days post-event
- Student photos in gallery: Opt-in only

### 8.2 Accessibility (WCAG 2.1 AA)
- Color contrast ratio ≥4.5:1 (normal text)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (alt text, ARIA labels)
- Focus indicators visible

### 8.3 Content Moderation
- Reels/posters: Auto-scan for inappropriate content (optional)
- Reporting mechanism for students
- Admin can remove/flag content

---

## 9. FUTURE ROADMAP (Post-MVP)

**Phase 2 (Jan 2027):**
- Mobile native app (iOS/Android)
- QR code ticket system
- Merchandise store integration

**Phase 3 (Jun 2027):**
- Multi-event calendar management
- AI-based scoring suggestions
- Video streaming (live broadcast)

**Phase 4 (Dec 2027):**
- Affiliate partnerships (colleges)
- API for external event organizers
- Analytics dashboard (institution insights)

---

## 10. SUCCESS METRICS

### Launch Day (Nov 15, 2026)
- ✅ 95%+ system uptime
- ✅ Zero score entry errors
- ✅ Leaderboard updates <2 min lag
- ✅ Student satisfaction ≥4/5 NPS

### Post-Event
- ✅ Registrations completed: 250+ students
- ✅ Events completed: 6/6 on schedule
- ✅ Reusable platform: Ready for repeat event

---

## 11. CONSTRAINTS & ASSUMPTIONS

**Constraints:**
- Single-day event (no multi-day functionality initially)
- Limited campus connectivity (backup offline mode)
- Judge tech-literacy varies (simple UI required)

**Assumptions:**
- Students have smartphones with data
- Organizers have 1 week to configure events
- Judges available for 4-6 hours on event day

---

## 12. ACCEPTANCE CRITERIA

- [ ] All 6 events configurable in admin panel
- [ ] Student can register for 2 events max
- [ ] Judge scoring updates leaderboard in real-time
- [ ] Mobile responsive across all screens
- [ ] WhatsApp integration sends debate topics
- [ ] Results published within 30 min of last event
- [ ] System handles 300+ concurrent users
- [ ] All colors match brand palette (navy #001F3F, orange #FF6B35)

---

**Document prepared for:** AI Agent Master Prompt  
**Next steps:** Design System (see CROSSFIRE_DESIGN_SYSTEM.md)
