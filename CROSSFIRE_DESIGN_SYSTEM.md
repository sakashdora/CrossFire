# CROSSFIRE Design System & Component Library

**Version:** 1.0  
**Platform:** Web + Mobile Responsive  
**Design Tool:** Figma (reference)  
**Implementation:** React/TypeScript with Tailwind CSS

---

## 1. COLOR SYSTEM

### 1.1 Core Palette (Usage Rules)

```css
/* PRIMARY NAVY - Use for headers, nav, critical elements */
--color-navy:           #001F3F;
--color-navy-light:     #003D7A;
--color-navy-dark:      #000A1A;

/* ACCENT ORANGE - Use for CTAs, highlights, interactive states */
--color-orange-primary: #FF6B35;
--color-orange-light:   #FFA500;
--color-orange-pale:    #FFE0CC;

/* NEUTRAL GRAYS */
--color-white:          #FFFFFF;
--color-gray-50:        #F9FAFB;
--color-gray-100:       #F3F4F6;
--color-gray-200:       #E5E7EB;
--color-gray-300:       #D1D5DB;
--color-gray-400:       #9CA3AF;
--color-gray-500:       #6B7280;
--color-gray-600:       #4B5563;
--color-gray-700:       #374151;
--color-gray-800:       #1F2937;
--color-gray-900:       #111827;

/* SEMANTIC COLORS */
--color-success:        #10B981;
--color-warning:        #F59E0B;
--color-error:          #EF4444;
--color-info:           #3B82F6;
--color-disabled:       #D1D5DB;
```

### 1.2 Color Application Guide

| Component | Primary | Secondary | Hover |
|-----------|---------|-----------|-------|
| Button (CTA) | Orange (#FF6B35) | White text | Orange-light (#FFA500) |
| Button (Secondary) | Gray (#E5E7EB) | Navy text | Gray-200 (#D1D5DB) |
| Link | Navy (#001F3F) | Underline | Orange (#FF6B35) |
| Badge (Active) | Orange (#FF6B35) | White text | - |
| Badge (Inactive) | Gray (#F3F4F6) | Gray-600 text | - |
| Card Background | White (#FFFFFF) | Border gray-200 | Shadow on hover |
| Input Border | Gray-300 (#D1D5DB) | Focus: Navy | Error: #EF4444 |
| Header | Navy (#001F3F) | - | - |
| Footer | Navy (#001F3F) | White text | - |

### 1.3 Accessibility Compliance

```
WCAG AA Requirements (4.5:1 contrast ratio for normal text):

✅ Navy (#001F3F) on White (#FFFFFF):      15.14:1 ratio ✓
✅ Orange (#FF6B35) on White (#FFFFFF):    5.03:1 ratio ✓
✅ Gray-600 (#4B5563) on White (#FFFFFF):  6.23:1 ratio ✓
❌ Gray-400 (#9CA3AF) on White (#FFFFFF):  3.7:1 ratio ✗ (only for secondary text)
❌ Orange (#FF6B35) on Gray-100 (#F3F4F6): 4.1:1 ratio ✗ (needs white bg)
```

---

## 2. TYPOGRAPHY SYSTEM

### 2.1 Font Stack
```css
/* Primary Font Family */
--font-family-primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Fallback for older browsers */
--font-family-fallback: system-ui, -apple-system, sans-serif;
```

### 2.2 Heading Styles
```css
h1 {
  font-size: 32px;      /* 2rem */
  line-height: 40px;    /* 1.25 */
  font-weight: 900;     /* Bold */
  color: --color-navy;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

h2 {
  font-size: 24px;      /* 1.5rem */
  line-height: 32px;
  font-weight: 700;     /* Bold */
  color: --color-navy;
  margin-bottom: 16px;
}

h3 {
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;     /* Semibold */
  color: --color-navy;
  margin-bottom: 12px;
}

h4 {
  font-size: 18px;
  line-height: 26px;
  font-weight: 600;
  color: --color-navy;
}
```

### 2.3 Body Text Styles
```css
body {
  font-size: 16px;      /* 1rem */
  line-height: 24px;    /* 1.5 */
  font-weight: 400;     /* Regular */
  color: --color-gray-800;
  letter-spacing: 0;
}

.text-sm {
  font-size: 14px;
  line-height: 20px;
  color: --color-gray-700;
}

.text-xs {
  font-size: 12px;
  line-height: 16px;
  color: --color-gray-600;
}

.text-secondary {
  color: --color-gray-600;
  font-weight: 400;
}

.text-disabled {
  color: --color-gray-400;
}

.text-error {
  color: --color-error;
  font-weight: 500;
}

.text-success {
  color: --color-success;
  font-weight: 500;
}
```

### 2.4 Button Text
```css
.btn-text {
  font-size: 16px;
  line-height: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
}

.btn-text-small {
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
}
```

### 2.5 Label & Caption
```css
label {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: --color-gray-600;
}

.caption {
  font-size: 11px;
  line-height: 14px;
  color: --color-gray-500;
}
```

---

## 3. SPACING SYSTEM

```css
/* Base scale (4px grid) */
--space-0:    0px;
--space-1:    4px;
--space-2:    8px;
--space-3:    12px;
--space-4:    16px;      /* Standard padding */
--space-5:    20px;
--space-6:    24px;      /* Standard margin */
--space-7:    28px;
--space-8:    32px;
--space-9:    36px;
--space-10:   40px;
--space-12:   48px;
--space-14:   56px;
--space-16:   64px;
--space-20:   80px;
--space-24:   96px;
```

### Standard Spacings
```
Padding - Components:     space-4 (16px)
Padding - Cards:          space-6 (24px)
Margin - Between sections: space-6 (24px) vertical
Margin - Cards:           space-4 (16px) vertical
Gap - Flex containers:    space-4 (16px)
Line height ratio:        1.5x (16px font = 24px line)
```

---

## 4. COMPONENT LIBRARY

### 4.1 Button Component

```
┌─────────────────────────────────────────┐
│           BUTTON STYLES                 │
├─────────────────────────────────────────┤

PRIMARY (CTA):
  Background:   #FF6B35 (Orange)
  Text:         White
  Border:       None
  Padding:      12px 24px
  Radius:       6px
  Font:         600, 16px
  
  Hover:        Background #FFA500 (lighter orange)
  Active:       Background #E55A24 (darker orange)
  Disabled:     Background #D1D5DB, Text #9CA3AF, opacity 0.5

SECONDARY:
  Background:   #F3F4F6 (Gray)
  Text:         #001F3F (Navy)
  Border:       1px solid #D1D5DB
  Padding:      12px 24px
  Radius:       6px
  
  Hover:        Background #E5E7EB
  Active:       Background #D1D5DB

GHOST (Text only):
  Background:   Transparent
  Text:         #FF6B35 (Orange)
  Border:       None
  
  Hover:        Background #FFE0CC
  
DANGER:
  Background:   #EF4444 (Red)
  Text:         White
  
  Hover:        Background #DC2626

SIZE VARIANTS:
  Large:        16px text, 16px 32px padding, 8px radius
  Standard:     16px text, 12px 24px padding, 6px radius
  Small:        14px text, 8px 16px padding, 6px radius
  Extra Small:  12px text, 6px 12px padding, 4px radius
```

**Usage:**
```jsx
<Button variant="primary" size="large">Register Now</Button>
<Button variant="secondary" size="standard">Cancel</Button>
<Button variant="ghost" size="small">Learn More</Button>
<Button variant="danger" disabled>Delete</Button>
```

### 4.2 Input Component

```
┌─────────────────────────────────────────┐
│         TEXT INPUT FIELD                │
├─────────────────────────────────────────┤

TEXT INPUT:
  Background:   #FFFFFF (White)
  Border:       1px solid #D1D5DB
  Padding:      12px 16px
  Radius:       6px
  Font:         16px, regular
  Min Height:   44px (touch target)
  
  Focus:        Border #001F3F (Navy, 2px)
                Box-shadow: 0 0 0 3px rgba(0,31,63,0.1)
  Error:        Border #EF4444 (Red)
  Disabled:     Background #F3F4F6, opacity 0.5

LABEL:
  Font:         12px, 600 weight, uppercase
  Color:        #4B5563 (Gray-600)
  Margin:       0 0 8px 0
  Required:     Append red asterisk (*)

HELPER TEXT:
  Font:         12px, regular
  Color:        #6B7280 (Gray-500)
  Margin:       4px 0 0 0

ERROR MESSAGE:
  Font:         12px, 500 weight
  Color:        #EF4444 (Red)
  Margin:       4px 0 0 0
```

**Usage:**
```jsx
<Input 
  label="Email Address" 
  placeholder="your@email.com"
  type="email"
  error="Invalid email format"
  required
/>

<TextArea 
  label="Comments"
  placeholder="Enter your feedback..."
  rows={4}
/>

<Select 
  label="Select Event"
  options={eventList}
  defaultValue="quiz"
/>
```

### 4.3 Card Component

```
┌─────────────────────────────────────────┐
│            CARD LAYOUT                  │
├─────────────────────────────────────────┤

STANDARD CARD:
  Background:   #FFFFFF (White)
  Border:       1px solid #E5E7EB
  Padding:      24px
  Radius:       8px
  Box-shadow:   0 1px 3px 0 rgba(0,0,0,0.1)
  
  Hover:        Box-shadow 0 4px 12px 0 rgba(0,0,0,0.15)
  
STRUCTURE:
  Header:       [Title] [Icon/Badge]
  Title:        20px, 600 weight, navy
  Icon:         24x24px, navy or orange
  Badge:        Positioned top-right
  
  Content:      Standard body text (16px)
  Divider:      1px solid #E5E7EB
  Footer:       Secondary action or metadata
  
PADDING GRID:
  Vertical:     24px top & bottom
  Horizontal:   24px left & right
  Internal:     16px between elements
```

**Usage:**
```jsx
<Card>
  <CardHeader>
    <h3>Event Details</h3>
    <Badge variant="active">Registered</Badge>
  </CardHeader>
  <CardContent>
    <p>Team Size: 2 people</p>
    <p>Prize: ₹6,000</p>
  </CardContent>
  <CardFooter>
    <Button variant="secondary">View More</Button>
  </CardFooter>
</Card>
```

### 4.4 Badge Component

```
┌─────────────────────────────────────────┐
│            BADGE STYLES                 │
├─────────────────────────────────────────┤

ACTIVE (Green checkmark):
  Background:   #D1FAE5 (Light green)
  Text:         #065F46 (Dark green)
  Icon:         ✓
  
COMPLETED (Green):
  Background:   #10B981 (Success green)
  Text:         White
  Font:         12px, 600, bold

PENDING (Yellow):
  Background:   #FEF3C7 (Light yellow)
  Text:         #92400E (Dark brown)

INACTIVE (Gray):
  Background:   #F3F4F6 (Light gray)
  Text:         #6B7280 (Medium gray)

REGISTERED (Orange):
  Background:   #FFEDD5 (Light orange)
  Text:         #92400E (Dark brown)

ERROR (Red):
  Background:   #FEE2E2 (Light red)
  Text:         #991B1B (Dark red)
  
SIZES:
  Large:        14px text, 8px 12px padding
  Standard:     12px text, 6px 10px padding
  Small:        10px text, 4px 8px padding
```

### 4.5 Badge (Event Status)

```
Badge Layout:
┌──────────────────────────┐
│ Registered (2/2)         │  ← Orange badge
└──────────────────────────┘

Variations:
✅ Registered    → Green checkmark
⏳ Pending       → Yellow clock
✗ Not registered → Gray X
🏆 Top 10        → Gold star
```

### 4.6 Navigation Component

```
DESKTOP NAV (Top):
┌──────────────────────────────────────────────────┐
│ [LOGO] CROSSFIRE | Home Events Leaderboard       │
│                              [User] [Logout]     │
└──────────────────────────────────────────────────┘

MOBILE NAV (Bottom Tab Bar):
┌────────────────────────────────────┐
│ Home    Events    Profile   Menu    │
└────────────────────────────────────┘

Active Tab:    Orange background, Navy icon
Inactive Tab:  Gray text

Height Desktop: 64px
Height Mobile:  56px
Z-index:        1000 (stays on top of content)
```

### 4.7 Form Layout - Login Page

```
┌─────────────────────────────────────────┐
│         CENTERED FORM (Login)           │
├─────────────────────────────────────────┤

Background:       Navy navy (#001F3F) gradient to dark
Card:             White, 400px width (mobile full)
Padding:          32px

LOGO AREA:
  Logo:           100x100px, centered
  Text:           "CROSSFIRE", 24px, navy
  Subtitle:       "State Level Competition"

FORM:
  Email Input:    Full width, 44px height
  Password Input: Full width, 44px height
  
BUTTONS:
  Login:          Full width, orange (#FF6B35)
  Google:         Full width, gray, white icon
  
FOOTER:
  "New here? Sign up" → Link in orange
  "Forgot password?" → Link in navy
  "Terms & Privacy" → Links at bottom
  
Spacing:
  Between inputs:   16px
  Input to button:  24px
  Buttons:          8px gap
```

---

## 5. RESPONSIVE BREAKPOINTS

```css
/* Mobile-first approach */

/* xs: Extra small (default - phones) */
@media (max-width: 320px) {
  /* iPhone SE */
  font-size: 14px;
  padding: 12px;
}

/* sm: Small (landscape phones, small tablets) */
@media (min-width: 640px) {
  font-size: 16px;
  padding: 16px;
  grid-columns: 2;
}

/* md: Medium (tablets, small laptops) */
@media (min-width: 768px) {
  font-size: 16px;
  padding: 20px;
  grid-columns: 3;
  max-width: 800px;
}

/* lg: Large (laptops, desktops) */
@media (min-width: 1024px) {
  font-size: 18px;
  padding: 24px;
  grid-columns: 4;
  max-width: 1200px;
}

/* xl: Extra large (wide desktops) */
@media (min-width: 1440px) {
  max-width: 1400px;
  display: grid with 6 columns;
}
```

### Responsive Layout Rules:

```
MOBILE (320px - 640px):
  - Single column layout
  - Full-width cards
  - Bottom navigation
  - Hamburger menu

TABLET (768px - 1024px):
  - 2-column layout
  - Top navigation
  - Larger cards
  
DESKTOP (1024px+):
  - 3-4 column grid
  - Sidebar navigation (optional)
  - Full-width content max 1200px
```

---

## 6. SHADOW & ELEVATION

```css
/* Subtle shadows for depth */

--shadow-sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Usage */
.card {
  box-shadow: var(--shadow-md);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.modal {
  box-shadow: var(--shadow-xl);
}
```

---

## 7. ICONS

```
Icon Library: Lucide React (for open-source consistency)
Size:         24px standard, 16px small, 32px large
Color:        Navy (#001F3F) default, Orange on CTA

Common Icons:
  Home         → lucide/home
  Search       → lucide/search
  User         → lucide/user
  Menu         → lucide/menu
  X (Close)    → lucide/x
  Check        → lucide/check
  Edit         → lucide/edit
  Trash        → lucide/trash-2
  Award        → lucide/award
  Trophy       → lucide/trophy
  Clock        → lucide/clock
  MapPin       → lucide/map-pin
  Mail         → lucide/mail
  Phone        → lucide/phone
```

---

## 8. ANIMATION & TRANSITIONS

```css
/* Smooth, snappy interactions */

--transition-fast:    150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base:    200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow:    300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Usage */
.button {
  transition: background-color var(--transition-base),
              box-shadow var(--transition-base);
}

.button:hover {
  background-color: var(--color-orange-light);
  box-shadow: var(--shadow-md);
}

/* Page Transitions */
fade-in:      opacity 0→1 over 300ms
slide-up:     translateY 20px→0 over 300ms
slide-left:   translateX 20px→0 over 300ms
```

---

## 9. FORM VALIDATION STATES

```
INPUT STATES:

DEFAULT:
  Border:      #D1D5DB (Gray-300)
  Text:        #111827 (Gray-900)
  BG:          #FFFFFF (White)

FOCUS:
  Border:      #001F3F (Navy) - 2px
  Shadow:      0 0 0 3px rgba(0,31,63,0.1)
  BG:          #FFFFFF

FILLED:
  Border:      #D1D5DB
  Text:        #001F3F (filled content)

ERROR:
  Border:      #EF4444 (Red) - 2px
  Text:        #EF4444 (error message)
  BG:          #FEF2F2 (light red)
  Icon:        X in red

DISABLED:
  Border:      #E5E7EB
  Text:        #9CA3AF (gray-400)
  BG:          #F9FAFB
  Cursor:      not-allowed

SUCCESS:
  Border:      #10B981 (Green)
  Icon:        ✓ in green
  Message:     "Successfully saved" in green
```

---

## 10. MOBILE-SPECIFIC PATTERNS

```
TOUCH TARGETS:
  Minimum size: 44x44px (accessibility standard)
  Spacing:      8px minimum between targets
  
SWIPE GESTURES:
  Left swipe:   Go to next event
  Right swipe:  Go to previous event
  Pull-to-refresh: Reload leaderboard
  
MOBILE MENU:
  Hamburger:    3-line icon (top-left)
  Drawer:       Slides in from left
  Overlay:      Semi-transparent backdrop
  Close:        X button or back gesture

BOTTOM SHEET:
  Used for:     Event filters, share options
  Height:       50-70% of viewport
  Dismiss:      Swipe down or tap outside

MOBILE KEYBOARD:
  Type hints:   email input → email keyboard
  Phone input   → numeric keyboard
  Auto-hide:    Focus moves input up
```

---

## 11. DARK MODE (Future Consideration)

```css
/* Color inversion for dark theme */

Dark Mode Palette:
  Background:   #111827 (Gray-900)
  Card:         #1F2937 (Gray-800)
  Text:         #F3F4F6 (Gray-100)
  Border:       #374151 (Gray-700)
  Primary:      #FF6B35 (Orange - unchanged)
  
Implementation:
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-primary: var(--color-gray-900);
      --text-primary: var(--color-gray-100);
    }
  }
```

---

## 12. ACCESSIBILITY GUIDELINES

### Keyboard Navigation
```
Tab Order:         Logo → Nav links → Main content → Footer
Enter Key:         Activate buttons, submit forms
Escape:            Close modals, menus
Arrow Keys:        Navigate tabs, select options in dropdown
Space:             Toggle checkboxes
```

### Screen Reader Support
```
Images:            All have descriptive alt text
Buttons:           Describe action (e.g., "Register for Quiz")
Icons:             Paired with text or aria-label
Form Fields:       Always have associated labels
Links:             Never use "click here" (use descriptive text)
Tables:            Proper header markup (<thead>, <th>)
```

### Color Contrast (WCAG AA)
```
Text on Background:    4.5:1 ratio minimum
Large Text (18px+):    3:1 ratio
Icons:                 3:1 ratio
UI Components:         3:1 ratio
```

---

## 13. FILE STRUCTURE FOR DEVELOPERS

```
src/
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Navigation.tsx
│   └── Modal.tsx
├── styles/
│   ├── globals.css
│   ├── tailwind.config.js
│   └── theme.css
├── pages/
│   ├── login.tsx
│   ├── register.tsx
│   ├── dashboard.tsx
│   ├── events.tsx
│   ├── leaderboard.tsx
│   └── admin/
│       ├── panel.tsx
│       ├── scoring.tsx
│       └── analytics.tsx
└── utils/
    ├── colors.ts
    └── spacing.ts
```

---

**Ready for:** Component development  
**Next file:** CROSSFIRE_WIREFRAMES.md

