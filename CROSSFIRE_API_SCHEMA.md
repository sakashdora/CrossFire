# CROSSFIRE API Schema & Database Specifications

**Version:** 1.0  
**Format:** RESTful API + WebSocket for real-time  
**Authentication:** JWT Bearer Token  
**Rate Limit:** 100 req/min per user

---

## 1. DATABASE SCHEMA

### 1.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255),
  oauth_provider VARCHAR(50) NULL, -- 'google', 'email'
  oauth_id VARCHAR(255) NULL,
  
  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL, -- Validation: age 16-18
  
  -- Education
  school_name VARCHAR(255) NOT NULL,
  board ENUM('CBSE', 'ICSE', 'CHSE') NOT NULL,
  
  -- Account
  role ENUM('student', 'organizer', 'judge', 'admin') DEFAULT 'student',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE, -- Email verification
  verification_token VARCHAR(255) NULL,
  
  -- Profile Media
  profile_picture_url VARCHAR(255) NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  
  -- Compliance
  parent_consent BOOLEAN DEFAULT FALSE, -- For minors
  terms_accepted BOOLEAN DEFAULT FALSE,
  gdpr_accepted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT age_check CHECK (EXTRACT(YEAR FROM age(date_of_birth)) BETWEEN 16 AND 18)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 1.2 Events Table

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(100) NOT NULL, -- 'Quiz', 'Ramp Walk', etc.
  slug VARCHAR(50) UNIQUE NOT NULL, -- 'quiz', 'ramp-walk'
  description TEXT,
  event_icon VARCHAR(255) NULL, -- Icon URL or emoji
  
  -- Configuration
  event_type ENUM('solo', 'team') NOT NULL,
  team_size INT DEFAULT 1,
  max_participants INT DEFAULT 100,
  current_participants INT DEFAULT 0,
  
  -- Scheduling
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  registration_deadline TIMESTAMP NOT NULL,
  media_submission_deadline TIMESTAMP NULL, -- For reels, posters
  
  -- Venue
  venue_location VARCHAR(255) NOT NULL, -- 'Srusti Campus'
  venue_address TEXT NULL,
  venue_map_url VARCHAR(255) NULL,
  
  -- Scoring
  min_score INT DEFAULT 0,
  max_score INT DEFAULT 100,
  scoring_rubric JSON NULL, -- {criteria: [{name, points}]}
  
  -- Prizes
  prize_pool INT NOT NULL, -- Total prize in rupees
  prize_distribution JSON NOT NULL,
  -- Example: {"1st": 6000, "2nd": 4000, "3rd": 3500}
  
  -- Status
  status ENUM('draft', 'open', 'registration_closed', 'in_progress', 'completed') DEFAULT 'open',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Judge Assignment
  assigned_judges INT DEFAULT 0
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(start_time);
```

### 1.3 Registrations Table

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Team Info
  team_code VARCHAR(50) NULL, -- For team events
  team_members JSONB NULL, -- [{user_id, name, roll_number}]
  
  -- Status
  status ENUM('registered', 'confirmed', 'withdrawn', 'disqualified') DEFAULT 'registered',
  confirmation_date TIMESTAMP NULL,
  
  -- Media Submission (for applicable events)
  media_url VARCHAR(255) NULL, -- URL to uploaded video/image
  media_type ENUM('video', 'image', 'document') NULL,
  media_submission_time TIMESTAMP NULL,
  
  -- Scoring
  score INT NULL, -- Final score
  score_locked BOOLEAN DEFAULT FALSE,
  final_rank INT NULL,
  
  -- Payment (if applicable)
  amount_paid INT DEFAULT 0, -- In rupees
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: One registration per user per event
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_team ON registrations(team_code);
```

### 1.4 Scores Table

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id), -- Judge who scored
  event_id UUID NOT NULL REFERENCES events(id),
  
  -- Scoring
  score INT NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL, -- (score / max_score) * 100
  comments TEXT NULL,
  
  -- Scoring Breakdown (for rubric-based events)
  rubric_scores JSONB NULL, -- {criteria_name: points}
  
  -- Media Evidence
  judge_photos_url VARCHAR(255) NULL, -- Photos from event
  
  -- Audit
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revised_at TIMESTAMP NULL, -- If score was modified
  is_final BOOLEAN DEFAULT FALSE, -- Lock after submission
  
  UNIQUE(registration_id, judge_id) -- One score per judge per participant
);

CREATE INDEX idx_scores_event ON scores(event_id);
CREATE INDEX idx_scores_judge ON scores(judge_id);
```

### 1.5 Leaderboard Table (Materialized View)

```sql
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  r.user_id,
  u.first_name,
  u.last_name,
  u.school_name,
  COUNT(DISTINCT r.event_id) AS events_completed,
  SUM(COALESCE(r.score, 0)) AS total_score,
  RANK() OVER (ORDER BY SUM(COALESCE(r.score, 0)) DESC) AS overall_rank,
  MAX(r.updated_at) AS last_updated
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'confirmed' AND r.score IS NOT NULL
GROUP BY r.user_id, u.first_name, u.last_name, u.school_name
ORDER BY total_score DESC;

CREATE INDEX idx_leaderboard_rank ON leaderboard(overall_rank);
```

### 1.6 Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  type ENUM('registration', 'score', 'event_reminder', 'debate_topic', 'announcement') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Entity
  related_event_id UUID NULL REFERENCES events(id),
  related_registration_id UUID NULL REFERENCES registrations(id),
  
  -- Delivery
  channel ENUM('in_app', 'email', 'sms', 'whatsapp') NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP NULL,
  
  -- Metadata
  data JSONB NULL, -- Extra JSON data
  
  CONSTRAINT notification_delivery CHECK (channel IN ('in_app', 'email', 'sms', 'whatsapp'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);
```

### 1.7 Judges Table

```sql
CREATE TABLE judge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Assignment Status
  status ENUM('assigned', 'accepted', 'completed', 'unavailable') DEFAULT 'assigned',
  
  -- Scoring Progress
  participants_assigned INT DEFAULT 0,
  participants_scored INT DEFAULT 0,
  
  -- Schedule
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  UNIQUE(judge_id, event_id) -- One judge per event
);

CREATE INDEX idx_judge_assignments_event ON judge_assignments(event_id);
```

### 1.8 Audit Log Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action details
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'score_submitted', 'registration_approved', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'registration', 'score', 'event'
  entity_id UUID NOT NULL,
  
  -- Changes
  old_values JSONB NULL,
  new_values JSONB NULL,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

---

## 2. API ENDPOINTS

### 2.1 Authentication Endpoints

```
POST /api/v1/auth/register
Purpose: Register new student
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "mobile_number": "+919876543210",
  "date_of_birth": "2008-05-15",
  "school_name": "ABC Public School",
  "board": "CBSE",
  "terms_accepted": true,
  "parent_consent": true
}
Response: 201 Created
{
  "id": "uuid",
  "email": "john@example.com",
  "access_token": "jwt_token_here",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "role": "student"
  }
}

---

POST /api/v1/auth/login
Purpose: Student login
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
Response: 200 OK
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": {...}
}

---

POST /api/v1/auth/google
Purpose: Google OAuth login
Request:
{
  "google_token": "google_id_token"
}
Response: 200 OK
{
  "access_token": "jwt_token",
  "user": {...}
}

---

POST /api/v1/auth/refresh
Purpose: Refresh access token
Headers: Authorization: Bearer refresh_token
Response: 200 OK
{
  "access_token": "new_jwt_token",
  "expires_in": 3600
}

---

POST /api/v1/auth/logout
Purpose: Logout user
Headers: Authorization: Bearer access_token
Response: 204 No Content
```

### 2.2 Events Endpoints

```
GET /api/v1/events
Purpose: Get all events with filters
Query Params:
  - status: "open" (default), "completed"
  - sort: "date", "prize" (default)
Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "name": "Quiz",
      "slug": "quiz",
      "description": "...",
      "event_type": "team",
      "team_size": 2,
      "max_participants": 100,
      "current_participants": 45,
      "start_time": "2026-11-15T10:00:00Z",
      "end_time": "2026-11-15T11:00:00Z",
      "venue_location": "Srusti Campus",
      "prize_pool": 6000,
      "prize_distribution": {"1st": 6000, "2nd": 4000},
      "status": "open",
      "registered_by_current_user": true
    }
  ],
  "total": 6,
  "page": 1,
  "per_page": 10
}

---

GET /api/v1/events/:event_id
Purpose: Get event details
Response: 200 OK
{
  "id": "uuid",
  "name": "Quiz",
  ...full event object...,
  "judges_assigned": 3,
  "registration_count": 45,
  "scores_submitted": 0,
  "current_user_registration": {
    "id": "uuid",
    "status": "registered",
    "team_members": [...],
    "score": null
  }
}

---

GET /api/v1/events/:event_id/leaderboard
Purpose: Get live leaderboard for specific event
Response: 200 OK
{
  "data": [
    {
      "rank": 1,
      "user_id": "uuid",
      "name": "John Doe",
      "school": "ABC School",
      "score": 85,
      "team_members": ["John", "Jane"],
      "is_current_user": false
    }
  ],
  "total": 45,
  "last_updated": "2026-11-15T10:45:00Z"
}
```

### 2.3 Registration Endpoints

```
POST /api/v1/registrations
Purpose: Register for event
Headers: Authorization: Bearer access_token
Request:
{
  "event_id": "uuid",
  "team_members": ["user_id_1", "user_id_2"] // Optional, for team events
}
Response: 201 Created
{
  "id": "uuid",
  "event_id": "uuid",
  "event_name": "Quiz",
  "status": "registered",
  "team_code": "ABC123",
  "team_members": [...]
}

---

GET /api/v1/registrations
Purpose: Get user's registrations
Headers: Authorization: Bearer access_token
Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "event_name": "Quiz",
      "event_icon": "🎯",
      "status": "registered",
      "team_code": "ABC123",
      "team_members": [...],
      "score": null,
      "rank": null,
      "media_url": null,
      "can_submit_media": true,
      "registration_date": "2026-11-10T10:00:00Z"
    }
  ]
}

---

POST /api/v1/registrations/:registration_id/submit-media
Purpose: Submit media for event (reels, posters)
Headers: Authorization: Bearer access_token
Content-Type: multipart/form-data
Request:
{
  "media_file": <File>,
  "media_type": "video" | "image"
}
Response: 200 OK
{
  "id": "uuid",
  "media_url": "https://s3.amazonaws.com/crossfire/...",
  "media_submission_time": "2026-11-12T15:30:00Z"
}

---

DELETE /api/v1/registrations/:registration_id
Purpose: Withdraw from event
Headers: Authorization: Bearer access_token
Response: 204 No Content
```

### 2.4 Leaderboard Endpoints

```
GET /api/v1/leaderboard
Purpose: Get overall leaderboard
Query Params:
  - event_id: filter by event (optional)
  - sort: "score" (default), "name"
  - limit: 10 (default), max 100
Response: 200 OK
{
  "data": [
    {
      "rank": 1,
      "user_id": "uuid",
      "name": "John Doe",
      "school": "ABC School",
      "total_score": 450,
      "events_completed": 4,
      "movement": "↑15", // Change from last update
      "is_current_user": false,
      "event_scores": {
        "quiz": 85,
        "ramp_walk": 90,
        "poster": 88,
        "treasure": 92
      }
    }
  ],
  "total": 245,
  "current_user_rank": 2,
  "last_updated": "2026-11-15T10:45:00Z"
}

---

GET /api/v1/leaderboard/events/:event_id
Purpose: Get event-specific leaderboard
Response: 200 OK
{
  "data": [...],
  "event_name": "Quiz",
  "total_scores": 45
}

---

GET /api/v1/leaderboard/schools
Purpose: Get school-wise leaderboard
Response: 200 OK
{
  "data": [
    {
      "rank": 1,
      "school_name": "ABC School",
      "board": "CBSE",
      "total_score": 1200,
      "student_count": 8,
      "avg_score": 150
    }
  ]
}
```

### 2.5 Judge Endpoints

```
GET /api/v1/judge/assignments
Purpose: Get assigned events (Judge only)
Headers: Authorization: Bearer access_token
Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "event_name": "Quiz",
      "total_participants": 45,
      "scored_count": 12,
      "status": "in_progress",
      "started_at": "2026-11-15T10:00:00Z"
    }
  ]
}

---

GET /api/v1/judge/assignments/:assignment_id/participants
Purpose: Get list of participants to score
Headers: Authorization: Bearer access_token
Query Params:
  - status: "pending" (default), "scored"
Response: 200 OK
{
  "data": [
    {
      "registration_id": "uuid",
      "user_id": "uuid",
      "name": "John Doe",
      "school": "ABC School",
      "team_members": ["John", "Jane"],
      "media_url": "https://..." // For reels
      "score_status": "pending"
    }
  ],
  "current": 1,
  "total": 45
}

---

POST /api/v1/judge/assignments/:assignment_id/score
Purpose: Submit score for participant
Headers: Authorization: Bearer access_token
Request:
{
  "registration_id": "uuid",
  "score": 85,
  "comments": "Great performance",
  "rubric_scores": {
    "accuracy": 30,
    "speed": 25,
    "presentation": 30
  },
  "photos": ["photo_url_1", "photo_url_2"]
}
Response: 201 Created
{
  "id": "uuid",
  "registration_id": "uuid",
  "score": 85,
  "submitted_at": "2026-11-15T10:30:00Z",
  "is_final": true
}

---

GET /api/v1/judge/assignments/:assignment_id/summary
Purpose: Get scoring progress summary
Response: 200 OK
{
  "total_assigned": 45,
  "completed": 12,
  "progress_percentage": 26.7,
  "average_score_submitted": 82,
  "status": "in_progress"
}
```

### 2.6 Admin Endpoints

```
GET /api/v1/admin/dashboard
Purpose: Get admin dashboard data
Headers: Authorization: Bearer access_token (Admin only)
Response: 200 OK
{
  "stats": {
    "total_registrations": 245,
    "checked_in": 89,
    "events_completed": 2,
    "scores_submitted": 3
  },
  "events": [
    {
      "name": "Quiz",
      "total_teams": 45,
      "judge_assigned": true,
      "scores_submitted": 0,
      "status": "open"
    }
  ],
  "judge_status": [
    {
      "event": "Quiz",
      "judge_name": "Judge A",
      "scores_completed": 0,
      "total": 45
    }
  ]
}

---

POST /api/v1/admin/events
Purpose: Create/update event
Headers: Authorization: Bearer access_token (Admin only)
Request: (same as events schema)
Response: 201 Created / 200 OK

---

POST /api/v1/admin/judge-assignments
Purpose: Assign judges to events
Headers: Authorization: Bearer access_token (Admin only)
Request:
{
  "judge_ids": ["uuid_1", "uuid_2"],
  "event_id": "uuid"
}
Response: 201 Created
{
  "assignments": [...]
}

---

POST /api/v1/admin/send-notification
Purpose: Send bulk notification
Headers: Authorization: Bearer access_token (Admin only)
Request:
{
  "target": "all_students" | "event_participants" | "judges",
  "event_id": "uuid" (optional),
  "channel": "sms" | "whatsapp" | "email" | "in_app",
  "title": "Debate Topic Announcement",
  "message": "Today's debate topic is...",
  "data": {}
}
Response: 200 OK
{
  "sent_count": 245,
  "failed_count": 0,
  "timestamp": "2026-11-15T09:00:00Z"
}

---

GET /api/v1/admin/reports/export
Purpose: Export event data
Headers: Authorization: Bearer access_token (Admin only)
Query Params:
  - format: "csv" | "json" | "excel"
  - event_id: "uuid" (optional)
Response: 200 OK (File download)
```

### 2.7 Real-Time WebSocket Endpoints

```
WebSocket: ws://api.crossfire.com/ws/leaderboard/:event_id
Purpose: Subscribe to real-time leaderboard updates
Message Format (incoming):
{
  "type": "subscribe",
  "event_id": "uuid"
}

Message Format (outgoing):
{
  "type": "leaderboard_update",
  "data": {
    "rank": 2,
    "score": 350,
    "timestamp": "2026-11-15T10:45:30Z"
  }
}

---

WebSocket: ws://api.crossfire.com/ws/scoring/:assignment_id
Purpose: Judge real-time scoring notifications
Message Format (incoming):
{
  "type": "score_submitted",
  "registration_id": "uuid",
  "score": 85
}
```

---

## 3. ERROR HANDLING

```
Standard Error Response:
{
  "error": {
    "code": "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "CONFLICT",
    "message": "Descriptive error message",
    "details": {
      "field": ["Error detail 1", "Error detail 2"]
    },
    "timestamp": "2026-11-15T10:30:00Z",
    "request_id": "req_uuid"
  }
}

HTTP Status Codes:
200 OK - Successful GET/POST
201 Created - Resource created
204 No Content - Successful DELETE
400 Bad Request - Invalid input
401 Unauthorized - Missing/invalid token
403 Forbidden - Permission denied
404 Not Found - Resource not found
409 Conflict - Duplicate registration
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
```

---

## 4. AUTHENTICATION & AUTHORIZATION

### JWT Token Structure
```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user_uuid",
  "email": "john@example.com",
  "role": "student" | "organizer" | "judge" | "admin",
  "iat": 1668520800,
  "exp": 1668524400,
  "iss": "crossfire-api"
}
```

### Role-Based Access Control (RBAC)
```
Student:
  - View own profile
  - Register/withdraw from events
  - View leaderboard
  - Submit media

Judge:
  - View assigned events
  - Score participants
  - Add comments

Organizer:
  - Configure events
  - Manage registrations
  - Send notifications
  - View analytics

Admin:
  - Full system access
  - User management
  - Create/edit events
  - Override decisions
```

---

## 5. RATE LIMITING

```
Global:
  - 100 requests per minute per user
  - 1000 requests per minute per IP

API Specific:
  - POST /auth/login: 5 per minute per IP
  - POST /registrations: 10 per minute per user
  - POST /judge/score: Unlimited during event
  - GET /leaderboard: Unlimited (cached)

Response Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1668520860
```

---

## 6. CACHING STRATEGY

```
Cache Invalidation:
  - Events list: 5 minutes
  - Leaderboard: Real-time (WebSocket) + 30 sec cache
  - Judge assignments: 10 minutes
  - User profile: 1 hour
  - Notifications: No cache (real-time)

Cache Headers:
  GET /events: Cache-Control: public, max-age=300
  GET /leaderboard: Cache-Control: public, max-age=30
  GET /registrations: Cache-Control: private, max-age=3600
```

---

## 7. PAGINATION

```
Standard Pagination:
GET /api/v1/events?page=1&per_page=10&sort=date&order=desc

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 6,
    "total_pages": 1
  }
}

Defaults:
  - page: 1
  - per_page: 10 (max: 100)
  - sort: "created_at"
  - order: "desc"
```

---

**Prepared for:** Backend development  
**Next file:** CROSSFIRE_IMPLEMENTATION_GUIDE.md

