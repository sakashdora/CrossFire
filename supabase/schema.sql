-- ==============================================================================
-- CROSSFIRE 2026 - Supabase Database Schema & RLS Policies
-- Event Date: November 15, 2026 | Srusti Academy of Graduate Studies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'organizer', 'judge', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE school_board AS ENUM ('CBSE', 'ICSE', 'CHSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_format AS ENUM ('solo', 'team');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'open', 'registration_closed', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('registered', 'confirmed', 'withdrawn', 'disqualified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'whatsapp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    mobile_number VARCHAR(20),
    date_of_birth DATE,
    institute_name VARCHAR(255) NOT NULL,
    school_name VARCHAR(255),
    city_town VARCHAR(100) NOT NULL,
    course_stream VARCHAR(50) NOT NULL DEFAULT '12th Science',
    board school_board NOT NULL DEFAULT 'CBSE',
    food_preference VARCHAR(20) NOT NULL DEFAULT 'Veg',
    role user_role NOT NULL DEFAULT 'student',
    profile_picture_url TEXT,
    parent_consent BOOLEAN DEFAULT FALSE,
    terms_accepted BOOLEAN DEFAULT TRUE,
    selected_competitions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    event_icon VARCHAR(50) NOT NULL,
    event_type event_format NOT NULL DEFAULT 'solo',
    team_size INT NOT NULL DEFAULT 1,
    max_participants INT DEFAULT 100,
    current_participants INT DEFAULT 0,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    venue_location VARCHAR(255) NOT NULL DEFAULT 'Srusti Campus',
    min_score INT DEFAULT 0,
    max_score INT DEFAULT 100,
    prize_pool INT NOT NULL,
    prize_distribution JSONB NOT NULL DEFAULT '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    scoring_rubric JSONB NOT NULL,
    status event_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    team_code VARCHAR(50),
    team_name VARCHAR(100),
    team_members JSONB DEFAULT '[]'::jsonb,
    status registration_status DEFAULT 'registered',
    media_url TEXT,
    media_type VARCHAR(20),
    media_submitted_at TIMESTAMPTZ,
    score NUMERIC(5,2),
    score_locked BOOLEAN DEFAULT FALSE,
    final_rank INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- 6. SCORES TABLE
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    rubric_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    comments TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_registration_judge UNIQUE (registration_id, judge_id)
);

-- 7. JUDGE ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.judge_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_judge_event UNIQUE (judge_id, event_id)
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel notification_channel DEFAULT 'in_app',
    related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. DATABASE TRIGGERS & FUNCTIONS
-- ==============================================================================

-- A. Auto-create public.users profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        mobile_number,
        date_of_birth,
        school_name,
        board,
        role,
        parent_consent
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Student'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
        COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::DATE, '2008-01-01'::DATE),
        COALESCE(NEW.raw_user_meta_data->>'school_name', 'General School'),
        COALESCE((NEW.raw_user_meta_data->>'board')::school_board, 'CBSE'::school_board),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
        COALESCE((NEW.raw_user_meta_data->>'parent_consent')::BOOLEAN, TRUE)
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Enforce Max 2 Events per Student Trigger
CREATE OR REPLACE FUNCTION public.check_max_two_registrations()
RETURNS TRIGGER AS $$
DECLARE
    reg_count INT;
BEGIN
    SELECT COUNT(*) INTO reg_count
    FROM public.registrations
    WHERE user_id = NEW.user_id AND status != 'withdrawn';

    IF reg_count >= 2 THEN
        RAISE EXCEPTION 'A student may register for a maximum of 2 events only.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_two_registrations ON public.registrations;
CREATE TRIGGER enforce_max_two_registrations
    BEFORE INSERT ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.check_max_two_registrations();

-- C. Auto-calculate final score and update registration
CREATE OR REPLACE FUNCTION public.update_registration_final_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.registrations
    SET 
        score = NEW.score,
        score_locked = NEW.is_final,
        updated_at = NOW()
    WHERE id = NEW.registration_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_score_submitted ON public.scores;
CREATE TRIGGER on_score_submitted
    AFTER INSERT OR UPDATE ON public.scores
    FOR EACH ROW EXECUTE FUNCTION public.update_registration_final_score();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Public read user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Everyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'organizer'))
);

-- Registrations policies
CREATE POLICY "Users view own registrations or admin/judge view" ON public.registrations FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'organizer', 'judge'))
);
CREATE POLICY "Students insert own registrations" ON public.registrations FOR INSERT WITH CHECK (
    auth.uid() = user_id
);
CREATE POLICY "Students update own media or admin updates" ON public.registrations FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'organizer', 'judge'))
);

-- Scores policies
CREATE POLICY "Judges and Admins view scores" ON public.scores FOR SELECT USING (
    auth.uid() = judge_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'organizer'))
);
CREATE POLICY "Judges insert or update assigned scores" ON public.scores FOR ALL USING (
    auth.uid() = judge_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin'))
);

-- Notifications policies
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
);

-- ==============================================================================
-- 12. SEED INITIAL 6 EVENTS
-- ==============================================================================
INSERT INTO public.events (name, slug, description, event_icon, event_type, team_size, prize_pool, prize_distribution, scoring_rubric, start_time, end_time, registration_deadline, venue_location)
VALUES 
(
    'Brain Buzz (Quiz)', 
    'quiz', 
    'State-level inter-school knowledge battle featuring written preliminary round and high-voltage campus buzzer finals.',
    'Brain',
    'team',
    2,
    13500,
    '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    '{"criteria": [{"name": "Accuracy", "weight": 60, "max": 60}, {"name": "Speed & Buzzer Reflex", "weight": 40, "max": 40}]}'::jsonb,
    '2026-11-15 09:30:00+05:30',
    '2026-11-15 11:30:00+05:30',
    '2026-11-14 23:59:59+05:30',
    'Srusti Auditorium A'
),
(
    'Glam Walk (Ramp Walk)', 
    'ramp-walk', 
    'Celebrate confidence, poise, styling, and charismatic stage presence on the premier college runway.',
    'Sparkles',
    'solo',
    1,
    13500,
    '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    '{"criteria": [{"name": "Appearance & Styling", "weight": 30, "max": 30}, {"name": "Stage Presence & Walk", "weight": 30, "max": 30}, {"name": "Personality & Expression", "weight": 40, "max": 40}]}'::jsonb,
    '2026-11-15 11:30:00+05:30',
    '2026-11-15 13:00:00+05:30',
    '2026-11-14 23:59:59+05:30',
    'Central Open Air Stage'
),
(
    'Shorts / Reels', 
    'reels', 
    'Showcase creative cinematic vision with high-impact 30-60 second micro-films highlighting youth dynamism.',
    'Video',
    'solo',
    1,
    13500,
    '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    '{"criteria": [{"name": "Originality & Creativity", "weight": 35, "max": 35}, {"name": "Story & Content", "weight": 35, "max": 35}, {"name": "Technical Execution & Sound", "weight": 30, "max": 30}]}'::jsonb,
    '2026-11-15 10:00:00+05:30',
    '2026-11-15 14:00:00+05:30',
    '2026-11-14 18:00:00+05:30',
    'Media Lab & Studio 1'
),
(
    'War of Words (Debate)', 
    'debate', 
    'Sharp rhetoric, intellectual conviction, and quick rebuttal mastery on live surprise contemporary topics.',
    'MessageSquareQuote',
    'solo',
    1,
    13500,
    '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    '{"criteria": [{"name": "Argumentation & Logic", "weight": 40, "max": 40}, {"name": "Clarity & Oratory", "weight": 30, "max": 30}, {"name": "Rebuttal Strength", "weight": 30, "max": 30}]}'::jsonb,
    '2026-11-15 13:30:00+05:30',
    '2026-11-15 15:00:00+05:30',
    '2026-11-14 23:59:59+05:30',
    'Conference Hall B'
),
(
    'Canvas Craft (Poster Making)', 
    'poster-making', 
    'Express persuasive social and technological themes through visual art, typography, and graphic power.',
    'Palette',
    'solo',
    1,
    13500,
    '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    '{"criteria": [{"name": "Design & Aesthetics", "weight": 35, "max": 35}, {"name": "Message Clarity & Impact", "weight": 35, "max": 35}, {"name": "Creativity & Craft", "weight": 30, "max": 30}]}'::jsonb,
    '2026-11-15 10:00:00+05:30',
    '2026-11-15 12:30:00+05:30',
    '2026-11-14 23:59:59+05:30',
    'Design Studio Block C'
),
(
    'Campus Quest (Treasure Hunt)', 
    'treasure-hunt', 
    'High adrenaline campus exploration decoding cryptic clues, historical riddles, and physical checkpoints.',
    'Compass',
    'team',
    3,
    13500,
    '{"1st": 6000, "2nd": 4500, "3rd": 3000}'::jsonb,
    '{"criteria": [{"name": "Speed & Station Completion", "weight": 50, "max": 50}, {"name": "Clue Accuracy", "weight": 50, "max": 50}]}'::jsonb,
    '2026-11-15 14:00:00+05:30',
    '2026-11-15 16:30:00+05:30',
    '2026-11-14 23:59:59+05:30',
    'Entire Srusti Campus Grounds'
)
ON CONFLICT (slug) DO NOTHING;
