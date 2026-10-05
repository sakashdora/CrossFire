import { EventItem, LeaderboardEntry, NotificationItem, UserProfile } from '../types';

export const EVENT_METADATA = {
  name: 'CROSSFIRE 2026',
  tagline: 'State Level Competition',
  year: 2026,
  date: '2026-11-15',
  eventDate: 'November 15, 2026',
  targetAudience: '+2 Final Year Students (12th Grade)',
  boards: ['CBSE', 'ICSE', 'CHSE'],
  ageGroup: '16-18 years',
  venue: 'Srusti Campus, Bhubaneswar',
  institution: {
    name: 'Srusti Academy of Graduate Studies',
    abbreviation: 'SAGS',
    affiliation: 'Utkal University',
    website: 'www.sags.ac.in',
    courses: [
      { name: 'BBA', type: 'Honours' },
      { name: 'BCA', type: 'Honours' },
      { name: 'B.Com', type: 'Honours' }
    ]
  },
  organizers: [
    {
      name: 'Mr. N.R. Swain',
      phone: '+91-7008671339',
      role: 'Event Coordinator'
    },
    {
      name: 'Mr. A. Meher',
      phone: '+91-8455090984',
      role: 'Co-coordinator'
    }
  ],
  mediaPartners: ['Prameya News', 'News 7'],
  totalPrizePool: 50000,
  currency: 'INR',
  entryFee: 0,
  rules: [
    'A Student can participate in maximum two competitions (Max 2).',
    'Trophy & Cash Awards for Champion & Runners-ups.',
    'For Quiz, participation in a team of two students.',
    'For Treasure Hunt, participation in a team of 03 students.',
    'For other events (Ramp Walk, Reels, Debate, Poster Making), individual participation.',
    'Six teams shall be selected for final round of quiz event through written round.',
    'Reels to be shot in Srusti Campus on the same day.',
    'Debate Topic shall be communicated through mobile WhatsApp no. / SMS on event morning.',
    'No Entry Fee for any event (100% Free Entry & Hospitality).',
    'The decision of the Judges will be final & binding.'
  ],
  schedule: [
    { time: '09:30 AM', activity: 'Registration & Check-in' },
    { time: '10:00 AM', activity: 'Opening Ceremony' },
    { time: '10:30 AM', activity: 'Quiz Event Starts (Written Round)' },
    { time: '11:30 AM', activity: 'Ramp Walk Event' },
    { time: '12:30 PM', activity: 'Lunch Break & Refreshments' },
    { time: '01:30 PM', activity: 'Debate Event' },
    { time: '02:30 PM', activity: 'Reels Screening & Poster Making Judging' },
    { time: '03:00 PM', activity: 'Treasure Hunt Event' },
    { time: '04:00 PM', activity: 'Results Announcement & Valedictory Ceremony' }
  ]
};

export const INITIAL_EVENTS: EventItem[] = [
  // GROUP A COMPETITIONS
  {
    id: 'quiz',
    name: 'Quiz',
    slug: 'quiz',
    group: 'Group A',
    description: 'Written test preliminary round followed by campus buzzer final round. Top 6 teams qualify for the final round. Trophy & cash awards for Champion & Runners-ups.',
    event_icon: 'Brain',
    event_type: 'team',
    team_size: 2,
    max_participants: 60,
    current_participants: 44,
    prize_pool: 24500,
    prize_distribution: {
      "1st": 6000,
      "2nd": 4000,
      "3rd": 3500,
      "4th": 1500,
      "5th": 1500,
      "6th": 1500
    },
    scoring_rubric: {
      criteria: [
        { name: "Accuracy", weight: 40, max: 40, description: "Correct answers and factual precision in written & buzzer rounds" },
        { name: "Speed", weight: 30, max: 30, description: "Reaction time during direct buzzer questions" },
        { name: "Final Round Answers", weight: 30, max: 30, description: "Performance in high-voltage campus buzzer finals" }
      ]
    },
    start_time: '2026-11-15T10:30:00+05:30',
    end_time: '2026-11-15T12:00:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Srusti Campus - Main Auditorium A',
    status: 'open'
  },
  {
    id: 'debate',
    name: 'Debate',
    slug: 'debate',
    group: 'Group A',
    description: 'Argumentation & public speaking. Debate topic shall be communicated via mobile WhatsApp no. / SMS on event morning. Prep time: 15 mins (Opening: 2 min, Rebuttal: 1 min).',
    event_icon: 'MessageSquareQuote',
    event_type: 'solo',
    team_size: 1,
    max_participants: 40,
    current_participants: 30,
    prize_pool: 7000,
    prize_distribution: {
      "1st": 4000,
      "2nd": 2000,
      "3rd": 1000
    },
    scoring_rubric: {
      criteria: [
        { name: "Argumentation & Logic", weight: 40, max: 40, description: "Structural rigor, logic, and factual backing" },
        { name: "Clarity & Expression", weight: 30, max: 30, description: "Voice modulation, body language, and fluency" },
        { name: "Rebuttal Strength", weight: 30, max: 30, description: "Refutation of opposing arguments and speed of thought" }
      ]
    },
    start_time: '2026-11-15T13:30:00+05:30',
    end_time: '2026-11-15T14:30:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Srusti Campus - Management Seminar Hall B',
    status: 'open'
  },
  {
    id: 'poster-making',
    name: 'Poster Making',
    slug: 'poster-making',
    group: 'Group A',
    description: 'Artistic design & creative expression. Theme announced at event start. Physical artwork created on campus using chart/canvas with acrylics, poster colors, or sketches.',
    event_icon: 'Palette',
    event_type: 'solo',
    team_size: 1,
    max_participants: 60,
    current_participants: 41,
    prize_pool: 7000,
    prize_distribution: {
      "1st": 4000,
      "2nd": 2000,
      "3rd": 1000
    },
    scoring_rubric: {
      criteria: [
        { name: "Design & Aesthetics", weight: 35, max: 35, description: "Visual composition, color balance, and style" },
        { name: "Message Clarity", weight: 35, max: 35, description: "Theme adherence, relevance, and emotional impact" },
        { name: "Creativity & Innovation", weight: 30, max: 30, description: "Originality of concept and creative finesse" }
      ]
    },
    start_time: '2026-11-15T10:00:00+05:30',
    end_time: '2026-11-15T14:30:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Srusti Campus - Creative Art Studio Block C',
    status: 'open'
  },

  // GROUP B COMPETITIONS
  {
    id: 'treasure-hunt',
    name: 'Treasure Hunt',
    slug: 'treasure-hunt',
    group: 'Group B',
    description: 'Physical puzzle solving across campus in teams of 3 students. Multi-station treasure hunt decoding cryptic clues, riddle trails, and racing against time.',
    event_icon: 'Compass',
    event_type: 'team',
    team_size: 3,
    max_participants: 90,
    current_participants: 66,
    prize_pool: 8000,
    prize_distribution: {
      "1st": 3000,
      "2nd": 2000,
      "3rd": 1000
    },
    scoring_rubric: {
      criteria: [
        { name: "Speed (Checkpoint Finish)", weight: 50, max: 50, description: "Overall race completion time across all stations" },
        { name: "Accuracy (Clues & Riddles)", weight: 50, max: 50, description: "Solving riddles and clues without hints or penalties" },
        { name: "Bonus Checkpoint Points", weight: 10, max: 10, description: "Bonus points for first 3 completing teams" }
      ]
    },
    start_time: '2026-11-15T15:00:00+05:30',
    end_time: '2026-11-15T16:00:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Srusti Campus - Central Campus Quadrangle',
    status: 'open'
  },
  {
    id: 'ramp-walk',
    name: 'Ramp Walk',
    slug: 'ramp-walk',
    group: 'Group B',
    description: 'Fashion & personality showcase. Live performance on stage (2 mins per participant). Celebrate confidence, poise, styling, and charismatic stage presence.',
    event_icon: 'Sparkles',
    event_type: 'solo',
    team_size: 1,
    max_participants: 50,
    current_participants: 38,
    prize_pool: 9000,
    prize_distribution: {
      "1st": 3000,
      "2nd": 2000,
      "3rd": 1000
    },
    scoring_rubric: {
      criteria: [
        { name: "Appearance & Confidence", weight: 30, max: 30, description: "Attire elegance, styling, grooming, and self-assurance" },
        { name: "Stage Presence", weight: 30, max: 30, description: "Walk posture, stride confidence, and stage connection" },
        { name: "Personality & Expression", weight: 40, max: 40, description: "Charisma, aura, authenticity, and spontaneous charm" }
      ]
    },
    start_time: '2026-11-15T11:30:00+05:30',
    end_time: '2026-11-15T12:30:00+05:30',
    registration_deadline: '2026-11-14T23:59:59+05:30',
    venue_location: 'Srusti Campus - Central Open Air Amphitheatre',
    status: 'open'
  },
  {
    id: 'reels',
    name: 'Reels',
    slug: 'reels',
    group: 'Group B',
    description: 'Short video content creation (30-60 seconds). Reels to be shot in Srusti Campus on the same day. Showcase creative visual storytelling and youth dynamism.',
    event_icon: 'Video',
    event_type: 'solo',
    team_size: 1,
    max_participants: 80,
    current_participants: 52,
    prize_pool: 9000,
    prize_distribution: {
      "1st": 3000,
      "2nd": 2000,
      "3rd": 1000
    },
    scoring_rubric: {
      criteria: [
        { name: "Creativity", weight: 35, max: 35, description: "Fresh perspective, concept originality, and storytelling" },
        { name: "Content Quality", weight: 35, max: 35, description: "Visual framing, theme resonance, and engagement" },
        { name: "Execution", weight: 30, max: 30, description: "Editing cuts, rhythm, color grading, and audio sync" }
      ]
    },
    start_time: '2026-11-15T10:00:00+05:30',
    end_time: '2026-11-15T14:30:00+05:30',
    registration_deadline: '2026-11-14T18:00:00+05:30',
    venue_location: 'Srusti Campus - Media Lab & Studio Block',
    status: 'open'
  }
];

export const DEMO_USERS: Record<string, UserProfile> = {
  judge: {
    id: 'user-judge-demo',
    email: 'judge@srusti.edu.in',
    first_name: 'Dr. Meera',
    last_name: 'Senapati',
    contact_number: '+91 9823456789',
    whatsapp_number: '+91 9823456789',
    mobile_number: '+91 9823456789',
    date_of_birth: '1985-08-20',
    institute_name: 'Srusti Academy of Graduate Studies',
    school_name: 'Srusti Academy of Graduate Studies',
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
    first_name: 'Mr. N.R.',
    last_name: 'Swain',
    contact_number: '+91 7008671339',
    whatsapp_number: '+91 7008671339',
    mobile_number: '+91 7008671339',
    date_of_birth: '1980-01-01',
    institute_name: 'Srusti Academy of Graduate Studies',
    school_name: 'Srusti Academy of Graduate Studies',
    city_town: 'Bhubaneswar',
    course_stream: '12th Commerce',
    board: 'CHSE',
    food_preference: 'Non-veg',
    role: 'admin',
    parent_consent: true,
    terms_accepted: true,
    created_at: new Date().toISOString()
  },
  volunteer: {
    id: 'user-volunteer-demo',
    email: 'volunteer@srusti.edu.in',
    first_name: 'Subhashree',
    last_name: 'Mohapatra',
    contact_number: '+91 9437198765',
    whatsapp_number: '+91 9437198765',
    mobile_number: '+91 9437198765',
    date_of_birth: '2004-11-15',
    institute_name: 'Srusti Academy of Graduate Studies',
    school_name: 'Srusti Academy of Graduate Studies',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CHSE',
    food_preference: 'Veg',
    role: 'volunteer',
    parent_consent: true,
    terms_accepted: true,
    created_at: new Date().toISOString()
  }
};

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'announcement',
    title: 'Crossfire 2026 Platform Live!',
    message: 'Welcome +2 students! Registration for all 6 competitive events is now open. Compete for ₹50,000 cash prize pool. Max 2 events per student.',
    channel: 'in_app',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-2',
    type: 'debate_topic',
    title: 'Debate Topics Schedule',
    message: 'Debate topics will be released via WhatsApp and SMS to registered participants on event morning. 15 minutes prep time.',
    channel: 'whatsapp',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];
