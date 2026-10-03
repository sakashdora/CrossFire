import { EventItem, LeaderboardEntry, NotificationItem, UserProfile } from '../types';

export const INITIAL_EVENTS: EventItem[] = [
  // GROUP A COMPETITIONS
  {
    id: 'ev-quiz',
    name: 'Intelect Odyssey (Quiz)',
    slug: 'quiz',
    group: 'Group A',
    description: 'State-level inter-school knowledge battle featuring written preliminary round and high-voltage campus buzzer finals.',
    event_icon: 'Brain',
    event_type: 'team',
    team_size: 2,
    max_participants: 60,
    current_participants: 44,
    prize_pool: 13500,
    prize_distribution: { "1st": 6000, "2nd": 4500, "3rd": 3000 },
    scoring_rubric: {
      criteria: [
        { name: "Accuracy", weight: 60, max: 60, description: "Correct answers and factual precision" },
        { name: "Speed & Buzzer Reflex", weight: 40, max: 40, description: "Reaction time during direct buzzer questions" }
      ]
    },
    start_time: '2026-11-15T09:30:00+05:30',
    end_time: '2026-11-15T11:30:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Srusti Main Auditorium A',
    status: 'open'
  },
  {
    id: 'ev-debate',
    name: 'Spontanity Erena (Extempore/Debate)',
    slug: 'debate',
    group: 'Group A',
    description: 'Sharp rhetoric, intellectual conviction, and quick rebuttal mastery on live surprise contemporary topics.',
    event_icon: 'MessageSquareQuote',
    event_type: 'solo',
    team_size: 1,
    max_participants: 40,
    current_participants: 30,
    prize_pool: 13500,
    prize_distribution: { "1st": 6000, "2nd": 4500, "3rd": 3000 },
    scoring_rubric: {
      criteria: [
        { name: "Argumentation & Logic", weight: 40, max: 40, description: "Structural rigor and evidence quality" },
        { name: "Clarity & Oratory", weight: 30, max: 30, description: "Voice modulation, body language, and fluency" },
        { name: "Rebuttal Strength", weight: 30, max: 30, description: "Refutation of opposing arguments and speed of thought" }
      ]
    },
    start_time: '2026-11-15T13:30:00+05:30',
    end_time: '2026-11-15T15:00:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Management Seminar Hall B',
    status: 'open'
  },
  {
    id: 'ev-poster',
    name: 'Spectrum on Canvas (Poster Making)',
    slug: 'poster-making',
    group: 'Group A',
    description: 'Express persuasive social and technological themes through visual art, typography, and graphic power.',
    event_icon: 'Palette',
    event_type: 'solo',
    team_size: 1,
    max_participants: 60,
    current_participants: 41,
    prize_pool: 13500,
    prize_distribution: { "1st": 6000, "2nd": 4500, "3rd": 3000 },
    scoring_rubric: {
      criteria: [
        { name: "Design & Aesthetics", weight: 35, max: 35, description: "Visual composition, color balance, and style" },
        { name: "Message Clarity & Impact", weight: 35, max: 35, description: "Theme adherence and emotional resonance" },
        { name: "Creativity & Craft", weight: 30, max: 30, description: "Originality of metaphor and execution finesse" }
      ]
    },
    start_time: '2026-11-15T10:00:00+05:30',
    end_time: '2026-11-15T12:30:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Creative Design Studio Block C',
    status: 'open'
  },

  // GROUP B COMPETITIONS
  {
    id: 'ev-treasure-hunt',
    name: 'Hidden Horizon (Treasure Hunt)',
    slug: 'treasure-hunt',
    group: 'Group B',
    description: 'High adrenaline campus exploration decoding cryptic clues, historical riddles, and physical checkpoints.',
    event_icon: 'Compass',
    event_type: 'team',
    team_size: 3,
    max_participants: 90,
    current_participants: 66,
    prize_pool: 13500,
    prize_distribution: { "1st": 6000, "2nd": 4500, "3rd": 3000 },
    scoring_rubric: {
      criteria: [
        { name: "Speed & Checkpoint Finish", weight: 50, max: 50, description: "Overall race completion time" },
        { name: "Clue Accuracy", weight: 50, max: 50, description: "Solving riddles without hints or penalties" }
      ]
    },
    start_time: '2026-11-15T14:00:00+05:30',
    end_time: '2026-11-15T16:30:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Central Campus Quadrangle',
    status: 'open'
  },
  {
    id: 'ev-ramp-walk',
    name: "Glam 'n' Dazzle (Ramp Walk)",
    slug: 'ramp-walk',
    group: 'Group B',
    description: 'Celebrate confidence, poise, styling, and charismatic stage presence on the premier college runway.',
    event_icon: 'Sparkles',
    event_type: 'solo',
    team_size: 1,
    max_participants: 50,
    current_participants: 38,
    prize_pool: 13500,
    prize_distribution: { "1st": 6000, "2nd": 4500, "3rd": 3000 },
    scoring_rubric: {
      criteria: [
        { name: "Appearance & Styling", weight: 30, max: 30, description: "Attire elegance, grooming, and color coordination" },
        { name: "Stage Presence & Walk", weight: 30, max: 30, description: "Posture, stride confidence, and crowd connection" },
        { name: "Personality & Expression", weight: 40, max: 40, description: "Aura, authenticity, and spontaneous charm" }
      ]
    },
    start_time: '2026-11-15T11:30:00+05:30',
    end_time: '2026-11-15T13:00:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Central Open Air Amphitheatre',
    status: 'open'
  },
  {
    id: 'ev-reels',
    name: 'Instaverse (Reels)',
    slug: 'reels',
    group: 'Group B',
    description: 'Showcase creative cinematic vision with high-impact 30-60 second micro-films highlighting youth dynamism.',
    event_icon: 'Video',
    event_type: 'solo',
    team_size: 1,
    max_participants: 80,
    current_participants: 52,
    prize_pool: 13500,
    prize_distribution: { "1st": 6000, "2nd": 4500, "3rd": 3000 },
    scoring_rubric: {
      criteria: [
        { name: "Originality & Creativity", weight: 35, max: 35, description: "Fresh perspective and narrative concept" },
        { name: "Story & Impact", weight: 35, max: 35, description: "Engagement curve and clear messaging" },
        { name: "Technical Execution & Sound", weight: 30, max: 30, description: "Editing cuts, color grading, and audio sync" }
      ]
    },
    start_time: '2026-11-15T10:00:00+05:30',
    end_time: '2026-11-15T14:00:00+05:30',
    registration_deadline: '2026-11-14T18:00:00+05:30',
    venue_location: 'Media Lab & Studio Block',
    status: 'open'
  }
];

export const DEMO_USERS: Record<string, UserProfile> = {
  student: {
    id: 'user-student-demo',
    email: 'imazureakash@gmail.com',
    first_name: 'Akash',
    last_name: 'Pattnaik',
    contact_number: '+91 9876543210',
    whatsapp_number: '+91 9876543210',
    mobile_number: '+91 9876543210',
    date_of_birth: '2008-04-12',
    institute_name: 'DAV Public School, Chandrasekharpur',
    school_name: 'DAV Public School, Chandrasekharpur',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg',
    role: 'student',
    parent_consent: true,
    terms_accepted: true,
    selected_competitions: ['Intelect Odyssey (Quiz)', "Glam 'n' Dazzle (Ramp Walk)"],
    created_at: new Date().toISOString()
  },
  judge: {
    id: 'user-judge-demo',
    email: 'judge@srusti.edu.in',
    first_name: 'Dr. Meera',
    last_name: 'Senapati',
    contact_number: '+91 9823456789',
    whatsapp_number: '+91 9823456789',
    mobile_number: '+91 9823456789',
    date_of_birth: '1985-08-20',
    institute_name: 'Srusti Academy of Management and Technology',
    school_name: 'Srusti Academy of Management and Technology',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CHSE',
    food_preference: 'Veg',
    role: 'judge',
    parent_consent: true,
    terms_accepted: true,
    created_at: new Date().toISOString()
  },
  admin: {
    id: 'user-admin-demo',
    email: 'admin@srusti.edu.in',
    first_name: 'Chief',
    last_name: 'Coordinator',
    contact_number: '+91 9937012345',
    whatsapp_number: '+91 9937012345',
    mobile_number: '+91 9937012345',
    date_of_birth: '1980-01-01',
    institute_name: 'Srusti Academy of Management and Technology',
    school_name: 'Srusti Academy of Management and Technology',
    city_town: 'Bhubaneswar',
    course_stream: '12th Commerce',
    board: 'CHSE',
    food_preference: 'Non-veg',
    role: 'admin',
    parent_consent: true,
    terms_accepted: true,
    created_at: new Date().toISOString()
  }
};

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user_id: 'u-1', participant_name: 'Rohan Mohanty & Team', school_name: 'Buxi Jagabandhu English Medium School', board: 'CBSE', events_count: 2, total_score: 188.5, trend: 'up' },
  { rank: 2, user_id: 'u-2', participant_name: 'Ananya Dash', school_name: 'Mothers Public School', board: 'CBSE', events_count: 2, total_score: 184.0, trend: 'same' },
  { rank: 3, user_id: 'user-student-demo', participant_name: 'Aarav Pattnaik', school_name: 'DAV Public School, Chandrasekharpur', board: 'CBSE', events_count: 2, total_score: 179.5, is_current_user: true, trend: 'up' },
  { rank: 4, user_id: 'u-4', participant_name: 'Debasish Swain', school_name: 'Stewart School, Cuttack', board: 'ICSE', events_count: 2, total_score: 175.0, trend: 'down' },
  { rank: 5, user_id: 'u-5', participant_name: 'Priyanka Tripathy & Team', school_name: 'KIIT International School', board: 'CBSE', events_count: 2, total_score: 172.5, trend: 'same' },
  { rank: 6, user_id: 'u-6', participant_name: 'Siddharth Rout', school_name: 'BJB Higher Secondary School', board: 'CHSE', events_count: 1, total_score: 94.0, trend: 'up' },
  { rank: 7, user_id: 'u-7', participant_name: 'Tanvi Agarwal', school_name: 'SAI International School', board: 'CBSE', events_count: 1, total_score: 91.5, trend: 'down' },
  { rank: 8, user_id: 'u-8', participant_name: 'Ayush Ray & Team', school_name: 'Ravenshaw Higher Secondary School', board: 'CHSE', events_count: 1, total_score: 89.0, trend: 'same' }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'announcement',
    title: 'Crossfire 2026 Platform Live!',
    message: 'Welcome +2 students! Registration for all 6 competitive events is now open. Remember to register for up to 2 events.',
    channel: 'in_app',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-2',
    type: 'debate_topic',
    title: 'Debate Topics Schedule',
    message: 'Debate topics will be released via WhatsApp and in-app prompt 15 minutes before preliminary speech rounds.',
    channel: 'whatsapp',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];
