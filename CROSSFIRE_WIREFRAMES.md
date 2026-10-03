# CROSSFIRE Wireframes & Layout Specifications

**Version:** 1.0  
**Format:** ASCII wireframes + detailed descriptions  
**Responsive Breakpoints:** Mobile (320px) | Tablet (768px) | Desktop (1024px+)

---

## PAGE 1: LOGIN PAGE

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────┐
│ CROSSFIRE - Student Login                                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                          [LOGO 100x100]                            │
│                                                                    │
│                    CROSSFIRE                                      │
│              STATE LEVEL COMPETITION                              │
│                                                                    │
│   ┌──────────────────────────────────────────┐                   │
│   │  EMAIL ADDRESS                           │                   │
│   │  [___________________________________]   │                   │
│   │                                          │                   │
│   │  PASSWORD                                │                   │
│   │  [___________________________________]   │                   │
│   │  Forgot password?                        │                   │
│   │                                          │                   │
│   │  [ LOGIN (Full-width Orange Button) ]   │                   │
│   │  [ Continue with Google (Gray) ]        │                   │
│   │                                          │                   │
│   │  Don't have an account? Sign up          │                   │
│   │  Terms of Service | Privacy Policy       │                   │
│   └──────────────────────────────────────────┘                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

SPECIFICATIONS:
- Card width: 420px, centered on page
- Card background: White (#FFFFFF)
- Card shadow: medium
- Logo size: 100x100px, centered
- Form fields: Full width, 44px height
- Buttons: Full width, 44px height
- Spacing between elements: 16px (vertical), 24px (cards to edges)
- Button hover: Orange changes to lighter shade
```

### Mobile Layout (320px - 640px)

```
┌──────────────────────────┐
│ CROSSFIRE Login          │
├──────────────────────────┤
│                          │
│      [LOGO 80x80]        │
│                          │
│     CROSSFIRE            │
│   TALENT HUNT 2026       │
│                          │
│  ┌──────────────────┐   │
│  │ EMAIL            │   │
│  │ [____________]   │   │
│  │                  │   │
│  │ PASSWORD         │   │
│  │ [____________]   │   │
│  │ Forgot?          │   │
│  │                  │   │
│  │ [LOGIN BUTTON]   │   │
│  │ [GOOGLE BUTTON]  │   │
│  │                  │   │
│  │ New here?        │   │
│  │ Sign up here     │   │
│  │                  │   │
│  │ Terms | Privacy  │   │
│  └──────────────────┘   │
│                          │
└──────────────────────────┘

SPECIFICATIONS:
- Full screen width with 16px padding
- Card width: Full - 32px
- Form elements: Touch-friendly, 44px minimum
- Logo: 80x80px
- Single column layout
```

### State Interactions

**On Focus (Email/Password Field):**
```
┌──────────────────────────────────────┐
│ EMAIL                                │
│ ████████████████████████████████████│  ← Border navy blue (2px)
│                                      │     Focus shadow around
└──────────────────────────────────────┘
```

**On Error:**
```
┌──────────────────────────────────────┐
│ EMAIL                                │
│ ████████████████████████████████████│  ← Border red (2px)
│ ⚠ Invalid email format               │  ← Error message in red
└──────────────────────────────────────┘
```

**Loading State (Button):**
```
[ LOGIN ... ] → Orange background, spinner inside
```

---

## PAGE 2: REGISTRATION PAGE

### Mobile Layout (Primary - 320px)

```
┌──────────────────────────┐
│ < BACK   Sign Up         │ ← Header with back button
├──────────────────────────┤
│                          │
│ Create Your Account      │ ← H2 heading
│ (Takes 2 minutes)        │
│                          │
│ ┌──────────────────┐    │
│ │ FIRST NAME       │    │
│ │ [____________]   │    │
│ │                  │    │
│ │ LAST NAME        │    │
│ │ [____________]   │    │
│ │                  │    │
│ │ EMAIL            │    │
│ │ [____________]   │    │
│ │                  │    │
│ │ MOBILE           │    │
│ │ +91 [__________] │    │
│ │                  │    │
│ │ SCHOOL NAME      │    │
│ │ [____________]   │    │
│ │                  │    │
│ │ BOARD            │    │
│ │ [CBSE ▼]         │    │
│ │                  │    │
│ │ DATE OF BIRTH    │    │
│ │ [DD/MM/YYYY]     │    │
│ │ (Must be 16-18)  │    │
│ │                  │    │
│ │ PASSWORD         │    │
│ │ [____________]   │    │
│ │ ■■■■■■ Strong   │    │ ← Strength indicator
│ │                  │    │
│ │ [REGISTER BUTTON]│    │
│ │                  │    │
│ │ Already have     │    │
│ │ account? Log in  │    │
│ └──────────────────┘    │
│                          │
└──────────────────────────┘

SPECIFICATIONS:
- Single column form
- Progress indicator: "Step 1 of 1" (optional)
- All fields required (marked with *)
- Field validation: Real-time feedback
- Password strength: Visual bar (weak → medium → strong)
- Button: Full width, disabled until form valid
- Spacing: 16px between fields
```

### Tablet/Desktop Layout (768px+)

```
┌─────────────────────────────────────────────────────┐
│ Sign Up                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Create Your Account                               │
│                                                     │
│  ┌──────────────────┬──────────────────┐           │
│  │ FIRST NAME       │ LAST NAME        │           │
│  │ [_____________] │ [_____________] │           │
│  └──────────────────┴──────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ EMAIL                               │           │
│  │ [____________________________]       │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌──────────────────┬──────────────────┐           │
│  │ MOBILE           │ BOARD            │           │
│  │ +91 [_________] │ [CBSE ▼]         │           │
│  └──────────────────┴──────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │ SCHOOL NAME                         │           │
│  │ [____________________________]       │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌──────────────────┬──────────────────┐           │
│  │ DATE OF BIRTH    │ PASSWORD         │           │
│  │ [DD/MM/YYYY]     │ [_____________] │           │
│  └──────────────────┴──────────────────┘           │
│                                                     │
│  [ REGISTER BUTTON ]                               │
│                                                     │
└─────────────────────────────────────────────────────┘

SPECIFICATIONS:
- 2-column grid layout
- Max content width: 600px
- Centered on page
- Same color scheme as login
```

---

## PAGE 3: STUDENT DASHBOARD (Post-Login)

### Mobile Layout (320px - 640px)

```
┌──────────────────────────┐
│ ☰  CROSSFIRE  🔔         │ ← Top nav (navy bg)
├──────────────────────────┤
│                          │
│ Welcome, John! 👋        │ ← Greeting
│ Ready to compete?        │
│                          │
│ ┌──────────────────┐    │
│ │ YOUR REGISTRATIONS     │ ← Section title
│ │ [2/2 Events]           │
│ └──────────────────┘    │
│                          │
│ ┌──────────────────┐    │
│ │ [Quiz Card]      │    │ ← Event card 1
│ │ Team: ABC Sch.   │    │
│ │ Members: You + 1 │    │
│ │                  │    │
│ │ Status: Active   │    │ ← Orange badge
│ │ ┌─────────────┐  │    │
│ │ │ View Details│  │    │
│ │ └─────────────┘  │    │
│ └──────────────────┘    │
│                          │
│ ┌──────────────────┐    │
│ │ [Reels Card]     │    │ ← Event card 2
│ │ Solo Event       │    │
│ │ Status: Active   │    │
│ │ Video Uploaded   │    │
│ │ ┌─────────────┐  │    │
│ │ │ View Details│  │    │
│ │ └─────────────┘  │    │
│ └──────────────────┘    │
│                          │
│ ┌──────────────────┐    │
│ │ LEADERBOARD (TOP 5)   │
│ │ 1. XYZ School - 450   │
│ │ 2. Your School - 345  │ ← Highlighted
│ │ 3. ABC School - 320   │
│ │ [See Full Board ▶]    │
│ └──────────────────┘    │
│                          │
│ ┌──────────────────┐    │
│ │ NOTIFICATIONS (2)     │
│ │ 🔔 Debate topic       │
│ │    sent at 9:00 AM    │
│ │ 🔔 Quiz starts in     │
│ │    2 hours            │
│ └──────────────────┘    │
│                          │
├──────────────────────────┤
│ Home  Events  Board Profile│ ← Bottom nav
└──────────────────────────┘

SPECIFICATIONS:
- Header: Navy background, white text, 56px height
- Greeting section: Large, friendly text
- Event cards: Full width, padding 16px, spacing 12px
- Card border: 1px gray-200
- Badge positioning: Top-right corner
- Leaderboard: Scrollable if >5 items
- Current user: Highlighted with light orange bg
- Notification count: Badge with number
- Bottom nav: 5 items, orange for active
```

### Tablet Layout (768px)

```
┌──────────────────────────────────────────────────┐
│ [LOGO] CROSSFIRE        🔔 [Profile] [Logout]   │ ← Top nav
├──────────────────────────────────────────────────┤
│                                                  │
│  Welcome, John! Ready to compete?                │
│                                                  │
│  ┌────────────────────────┬────────────────────┐ │
│  │                        │                    │ │
│  │  EVENT CARDS           │  LEADERBOARD       │ │
│  │                        │                    │ │
│  │  ┌──────────────────┐  │  ┌──────────────┐ │ │
│  │  │ [Quiz Card]      │  │  │ Top 10       │ │ │
│  │  │ Team: ABC        │  │  │ 1. XYZ - 450 │ │ │
│  │  │ Status: Active   │  │  │ 2. YOU - 345 │ │ │
│  │  │ Members: 2/2     │  │  │ 3. ABC - 320 │ │ │
│  │  │ [View Details]   │  │  │ ...          │ │ │
│  │  └──────────────────┘  │  └──────────────┘ │ │
│  │                        │                    │ │
│  │  ┌──────────────────┐  │  NOTIFICATIONS     │ │
│  │  │ [Reels Card]     │  │                    │ │
│  │  │ Solo Event       │  │  ✓ Debate topic   │ │
│  │  │ Status: Active   │  │    sent           │ │
│  │  │ Video Uploaded ✓ │  │                    │ │
│  │  │ [View Details]   │  │  ✓ Quiz starts    │ │
│  │  └──────────────────┘  │    in 2 hours     │ │
│  │                        │                    │ │
│  └────────────────────────┴────────────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘

SPECIFICATIONS:
- 2-column layout: Left (events) 65%, Right (leaderboard + notifications) 35%
- Sidebar navigation: Vertical (optional)
- Card grid: 2 columns of events
- Max content width: 1200px, centered
```

### Desktop Layout (1024px+)

```
┌───────────────────────────────────────────────────────────────────┐
│ [LOGO] CROSSFIRE          🔔 [User Name ▼] [Logout]              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Welcome, John Doe! Ready to compete? 🎯                          │
│                                                                   │
│  ┌──────────────────────────┬────────────────┬─────────────────┐ │
│  │ YOUR REGISTRATIONS (2/2)  │ LEADERBOARD    │ NOTIFICATIONS   │ │
│  │                          │                │                 │ │
│  │ ┌────────────────────┐   │ ┌────────────┐ │ ┌─────────────┐ │ │
│  │ │ Quiz               │   │ │ Top 10     │ │ │ Recent Msgs │ │ │
│  │ │ Team: XYZ School   │   │ │ 1. XYZ-450 │ │ │             │ │ │
│  │ │ Members: John +1   │   │ │ 2. YOU-345 │ │ │ Debate topic│ │ │
│  │ │ Team Size: 2/2 ✓   │   │ │ 3. ABC-320 │ │ │ sent 9:00AM │ │ │
│  │ │ Status: Active     │   │ │ 4. MNO-310 │ │ │             │ │ │
│  │ │ Score: Pending     │   │ │ 5. PQR-300 │ │ │ Quiz starts │ │ │
│  │ │ [View More ▶]      │   │ │            │ │ │ in 2 hours  │ │ │
│  │ └────────────────────┘   │ └────────────┘ │ └─────────────┘ │ │
│  │                          │                │                 │ │
│  │ ┌────────────────────┐   │ Filter Events: │                 │ │
│  │ │ Reels              │   │ [All ▼]        │                 │ │
│  │ │ Solo Event         │   │                │                 │ │
│  │ │ Status: Active     │   │ [View Full >]  │                 │ │
│  │ │ Video Uploaded ✓   │   │                │                 │ │
│  │ │ Score: Pending     │   │                │                 │ │
│  │ │ [View More ▶]      │   │                │                 │ │
│  │ └────────────────────┘   │                │                 │ │
│  │                          │                │                 │ │
│  └──────────────────────────┴────────────────┴─────────────────┘ │
│                                                                   │
│  RECENT SCORES (if available)                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Event      │ Your Score │ Best Score │ Your Rank │ Status   │ │
│  │ Ramp Walk  │ 85/100     │ 92/100     │ 5th       │ ✓ Done   │ │
│  │ Poster     │ Pending    │ -          │ -         │ ⏳ Soon   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

SPECIFICATIONS:
- 3-column layout: Main (60%) | Leaderboard (20%) | Notifications (20%)
- Cards: 2-column grid for multiple events
- Max width: 1400px, centered with padding
- Sticky header on scroll
- Real-time leaderboard updates
```

---

## PAGE 4: EVENTS DISCOVERY PAGE

### Mobile Layout (320px)

```
┌──────────────────────────┐
│ < All Events             │ ← Header with back/filter
├──────────────────────────┤
│                          │
│ 6 Events • Filter [▼]    │
│                          │
│ ┌──────────────────┐    │
│ │ QUIZ             │    │
│ │ 🎯               │    │ ← Icon
│ │                  │    │
│ │ Team Size: 2     │    │
│ │ Prize: ₹6,000    │    │
│ │ Status: Open     │    │ ← Green badge
│ │                  │    │
│ │ ✓ You registered │    │ ← Checkmark if registered
│ │                  │    │
│ │ [REGISTER] or    │    │
│ │ [VIEW DETAILS]   │    │
│ └──────────────────┘    │
│                          │
│ ┌──────────────────┐    │
│ │ RAMP WALK        │    │
│ │ 👗               │    │
│ │ Solo Event       │    │
│ │ Prize: ₹3,000    │    │
│ │ Status: Open     │    │
│ │ [REGISTER]       │    │
│ └──────────────────┘    │
│                          │
│ ┌──────────────────┐    │
│ │ REELS            │    │
│ │ 📹               │    │
│ │ Solo Event       │    │
│ │ Prize: ₹3,000    │    │
│ │ Status: Open     │    │
│ │ [REGISTER]       │    │
│ └──────────────────┘    │
│                          │
│ ... (other events)       │
│                          │
└──────────────────────────┘

SPECIFICATIONS:
- Card per event, full width - 16px padding
- Icon: 24x24px, navy color
- Spacing between cards: 12px
- "Register" button: Orange (#FF6B35), full width
- "View Details" button: Gray secondary
- Badge positioning: Top-right
- Registered checkmark: Green with checkmark icon
```

### Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────┐
│ CROSSFIRE Events               Filter: [All ▼] Search [X]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 6 Events • November 15, 2026                             │
│                                                          │
│ ┌────────────────┬────────────────┬────────────────┐    │
│ │ QUIZ           │ RAMP WALK      │ REELS          │    │
│ │ 🎯             │ 👗             │ 📹             │    │
│ │                │                │                │    │
│ │ Team: 2        │ Solo           │ Solo           │    │
│ │ Prize: ₹6,000  │ Prize: ₹3,000  │ Prize: ₹3,000  │    │
│ │ Status: Open   │ Status: Open   │ Status: Open   │    │
│ │ ✓ Registered   │                │                │    │
│ │                │                │                │    │
│ │ [REGISTERED]   │ [REGISTER]     │ [REGISTER]     │    │
│ └────────────────┴────────────────┴────────────────┘    │
│                                                          │
│ ┌────────────────┬────────────────┬────────────────┐    │
│ │ DEBATE         │ POSTER MAKING  │ TREASURE HUNT  │    │
│ │ 🎤             │ 🎨             │ 🗺️             │    │
│ │                │                │                │    │
│ │ Solo           │ Solo           │ Team: 3        │    │
│ │ Prize: ₹4,000  │ Prize: ₹4,000  │ Prize: ₹3,000  │    │
│ │ Status: Open   │ Status: Open   │ Status: Open   │    │
│ │                │                │                │    │
│ │ [REGISTER]     │ [REGISTER]     │ [REGISTER]     │    │
│ └────────────────┴────────────────┴────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘

SPECIFICATIONS:
- 3-column grid layout
- Cards: Equal width with consistent spacing (16px)
- Icon size: 32x32px, navy color
- Max content width: 1200px
- Cards have subtle hover effect (shadow increase)
```

---

## PAGE 5: ADMIN PANEL - DASHBOARD

### Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰ CROSSFIRE ADMIN                        🔔 [Admin Name] [Logout]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CROSSFIRE TALENT HUNT 2026 • November 15                        │
│                                                                 │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │ Total Reg    │ Checked In   │ Scores Ready │ Events Comp  │  │
│ │ 245 / 300    │ 89 (36%)     │ 3/6 events   │ 2/6          │  │
│ │              │              │              │              │  │
│ │ 82%          │ ↑ 15 today   │ ⏳ In progress│ ⏳ 4 pending  │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                 │
│ ┌──────────────────────────┬──────────────────────────────────┐ │
│ │ EVENT MANAGEMENT         │ JUDGE ASSIGNMENTS                │ │
│ ├──────────────────────────┼──────────────────────────────────┤ │
│ │ Events   │ Teams │ Judge  │ Event      │ Judge    │ Score   │ │
│ │ Quiz     │ 45    │ ✓ A.P  │ Quiz       │ Judge1   │ ✓ Done  │ │
│ │ Ramp Walk│ 50    │ ✓ R.S  │ Ramp Walk  │ Judge2   │ ⏳ 5/50  │ │
│ │ Reels    │ 48    │ ✓ S.M  │ Reels      │ Judge3   │ ✓ Done  │ │
│ │ Debate   │ 52    │ ✓ M.K  │ Debate     │ Judge4   │ ⏳ 12/52 │ │
│ │ Poster   │ 47    │ ✓ P.J  │ Poster     │ Judge5   │ ⏳ 18/47 │ │
│ │ T. Hunt  │ 38 T  │ ✓ V.P  │ T. Hunt    │ Judge6   │ ⏳ 22/38 │ │
│ │           │       │        │                                │ │
│ │ [Assign   │       │        │ [Reassign Judge]               │ │
│ │  Judges]  │       │        │ [Send Reminder]                │ │
│ │           │       │        │                                │ │
│ └──────────────────────────┴──────────────────────────────────┘ │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ QUICK ACTIONS                                                │ │
│ │ [Send Notification] [Download Report] [Publish Results]     │ │
│ │ [View Judge Dashboard] [Configure Events] [Export Data]     │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

SPECIFICATIONS:
- KPI Cards: 4 cards, 25% width each
- KPI Card height: 120px
- Main content: 2-column layout (50/50)
- Table: Scrollable if >6 rows
- Colors:
  - ✓ Done: Green badge
  - ⏳ In progress: Yellow badge
  - ⚠️ Pending: Red badge
- Action buttons: Small (14px text), orange primary
- Table row hover: Light gray background
```

---

## PAGE 6: JUDGE SCORING INTERFACE

### Scoring Screen (Mobile & Desktop)

```
┌────────────────────────────────────────────────┐
│ Quiz • Final Round  ← Breadcrumb back          │
├────────────────────────────────────────────────┤
│                                                │
│ Progress: 12 of 45 teams                      │ ← Progress bar
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░ 26%         │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ TEAM DETAILS                               │ │
│ ├────────────────────────────────────────────┤ │
│ │ Team: ABC School Team 1                    │ │
│ │ School: ABC Public School                  │ │
│ │ Board: CBSE                                │ │
│ │ Members:                                   │ │
│ │  • John Doe (Roll: 12)                     │ │
│ │  • Jane Smith (Roll: 15)                   │ │
│ │ Submission Time: 10:30 AM                  │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ SCORING                                    │ │
│ ├────────────────────────────────────────────┤ │
│ │                                            │ │
│ │ Total Score: [0 ←─────────●─────→ 100]    │ │ ← Slider
│ │              0          60         100     │ │
│ │                                            │ │
│ │ OR                                         │ │
│ │                                            │ │
│ │ Score: [________]  (0-100)                 │ │ ← Input field
│ │                                            │ │
│ │ ┌────────────────────────────────────────┐ │ │
│ │ │ COMMENTS (Optional)                    │ │ │
│ │ │                                        │ │ │
│ │ │ [Excellent performance, good logic]    │ │ │
│ │ │                                        │ │ │
│ │ └────────────────────────────────────────┘ │ │
│ │                                            │ │
│ │ [Photo Upload] [No issues with this team]  │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ [< PREVIOUS TEAM]  [SUBMIT] [NEXT TEAM >] │ │
│ └────────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘

SPECIFICATIONS:
- Score input: 0-100 range with validation
- Slider for quick scoring (optional dual interface)
- Comments field: Text area, 100-500 chars
- Photo upload: Drag-drop or button
- Submit button: Locked until score entered
- Progress indicator: Visual bar at top
- Previous/Next: Navigate without losing data
- On submit: Score locked, confirmation toast
```

### Post-Submit View

```
┌────────────────────────────────────────────────┐
│ ✓ Score Submitted                              │
├────────────────────────────────────────────────┤
│                                                │
│ ABC School Team 1 • Score: 85                  │ ← Confirmation
│ Status: LOCKED ✓                               │
│                                                │
│ Your scoring progress:                         │
│ 13 of 45 completed (29%)                       │
│                                                │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│                                                │
│ [CONTINUE TO NEXT TEAM] [VIEW YOUR SCORES]    │
│                                                │
└────────────────────────────────────────────────┘
```

---

## PAGE 7: LEADERBOARD (REAL-TIME)

### Mobile Layout (320px)

```
┌──────────────────────────┐
│ Leaderboard    Filter ▼  │ ← Sticky header
├──────────────────────────┤
│ Filter by Event:         │
│ [All ▼] [Quiz ▼]         │
│                          │
│ Last updated: 10:45 AM   │
│ Refresh ⟳                │
│                          │
│ OVERALL RANKINGS         │
│                          │
│ 1 🥇 XYZ School Team    │ ← Team in 1st
│    Score: 450           │
│    • Quiz: 85           │
│    • Ramp: 90           │
│                          │
│ 2 🥈 Your School Team   │ ← Highlighted (you)
│    Score: 345           │
│    • Quiz: 72           │
│    • Ramp: 85           │
│    • Reels: 78          │
│                          │
│ 3 🥉 ABC School Team    │
│    Score: 320           │
│                          │
│ 4    MNO School Team    │
│      Score: 310         │
│                          │
│ 5    PQR School Team    │
│      Score: 300         │
│      ...                │
│                          │
│ [See Full Rankings ▶]   │
│                          │
└──────────────────────────┘

SPECIFICATIONS:
- Sticky header while scrolling
- Rank badges: 🥇🥈🥉 for top 3
- Current user: Light orange highlight
- Expandable details: Tap to see score breakdown
- Refresh button: Pull-to-refresh or button
- Update frequency: Real-time (WebSocket)
```

### Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────┐
│ LEADERBOARD (LIVE)       Filter: [All ▼] [Quiz ▼]       │
│                          Refresh ⟳  Last update: 10:45 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ OVERALL RANKINGS (All Events Combined)                   │
│                                                          │
│ Rank │ School / Team         │ Score │ Events │ Status  │
│─────┼─────────────────────────┼───────┼────────┼────────│
│ 🥇 1 │ XYZ School Team 1     │ 450   │ 4/6    │ ✓ Live │
│      │ Quiz: 85 | Ramp: 90   │       │        │        │
│      │ Poster: 88 | Treasure │       │        │        │
│─────┼─────────────────────────┼───────┼────────┼────────│
│ 🥈 2 │ Your School Team      │ 345   │ 3/6    │ ↑ +15  │ ← Highlighted
│      │ Quiz: 72 | Ramp: 85   │       │        │        │
│      │ Reels: 78             │       │        │        │
│─────┼─────────────────────────┼───────┼────────┼────────│
│ 🥉 3 │ ABC School Team       │ 320   │ 3/6    │ ✓ Live │
│─────┼─────────────────────────┼───────┼────────┼────────│
│  4  │ MNO School Team       │ 310   │ 2/6    │ ↓ -20  │
│  5  │ PQR School Team       │ 300   │ 2/6    │ ↔ Same │
│  6  │ STU School Team       │ 285   │ 2/6    │ ✓ Live │
│  7  │ VWX School Team       │ 275   │ 1/6    │ New    │
│  8  │ YZA School Team       │ 260   │ 1/6    │ ⏳ Soon│
│                                                          │
│ [View Event Breakdown] [View by School] [Export Data]   │
│                                                          │
└──────────────────────────────────────────────────────────┘

SPECIFICATIONS:
- Sortable table (by score, school, status)
- Rank visual: Gold/silver/bronze medals
- Current position: Highlighted with light orange
- Movement indicator: ↑ (climbing), ↓ (dropping), ↔ (stable)
- Status: Live updates every 30 seconds
- Row hover: Slight background color change
- Expandable: Click row to see event breakdown
```

---

## NAVIGATION PATTERNS

### Top Navigation (Desktop)

```
┌────────────────────────────────────────────────────────┐
│ [LOGO] CROSSFIRE     │ Home │ Events │ Leaderboard    │
│                              [User▼] [Logout]         │
└────────────────────────────────────────────────────────┘

Active link: Orange underline, navy text
Inactive link: Gray text
Hover: Light orange background
Dropdown: White bg, navy text, gray divider
```

### Bottom Navigation (Mobile)

```
┌────────────────────────────────────────────┐
│ 🏠        📋        🏆        👤        ☰   │
│ Home    Events   Leaderboard Profile   Menu │
└────────────────────────────────────────────┘

Active: Orange bg with icon + text
Inactive: Gray icon
Height: 56px (touch-friendly)
```

---

## MODAL/DIALOG PATTERNS

### Register Confirmation Modal

```
┌────────────────────────────────────┐
│ Event Registration         [X]     │ ← Close button
├────────────────────────────────────┤
│                                    │
│ Confirm Registration               │
│                                    │
│ Event: Quiz                        │
│ Team Size: 2 people                │
│ Your Partner: Jane Smith ✓         │
│ Prize Pool: ₹6,000                 │
│                                    │
│ ⚠ You can register for only 2      │
│   total events. Current: 1/2       │
│                                    │
│ [ CONFIRM ]  [ CANCEL ]            │
│                                    │
└────────────────────────────────────┘

Specifications:
- Modal width: 400px (mobile full)
- Overlay: Semi-transparent gray (#000000 20%)
- Animation: Fade in + scale up (200ms)
```

---

**Document prepared for:** Wireframe implementation  
**Next file:** CROSSFIRE_API_SCHEMA.md

