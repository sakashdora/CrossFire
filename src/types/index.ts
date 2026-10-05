export type UserRole = 'student' | 'judge' | 'volunteer' | 'organizer' | 'admin';
export type SchoolBoard = 'CBSE' | 'ICSE' | 'CHSE';
export type CourseStream = '12th Science' | '12th Commerce' | '12th Arts';
export type FoodPreference = 'Veg' | 'Non-veg';
export type EventFormat = 'solo' | 'team';
export type EventGroup = 'Group A' | 'Group B';
export type EventStatus = 'draft' | 'open' | 'registration_closed' | 'in_progress' | 'completed';
export type RegistrationStatus = 'registered' | 'confirmed' | 'withdrawn' | 'disqualified';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  whatsapp_number: string;
  mobile_number?: string;
  date_of_birth?: string;
  institute_name: string;
  school_name?: string;
  city_town: string;
  course_stream: CourseStream;
  board?: SchoolBoard;
  food_preference: FoodPreference;
  role: UserRole;
  profile_picture_url?: string;
  parent_consent?: boolean;
  terms_accepted?: boolean;
  selected_competitions?: string[];
  created_at?: string;
}

export interface RubricCriterion {
  name: string;
  weight: number;
  max: number;
  description?: string;
}

export interface ScoringRubric {
  criteria: RubricCriterion[];
}

export interface PrizeDistribution {
  "1st": number;
  "2nd": number;
  "3rd": number;
  [key: string]: number;
}

export interface EventItem {
  id: string;
  name: string;
  slug: string;
  group: EventGroup;
  description: string;
  event_icon: string;
  event_type: EventFormat;
  team_size: number;
  max_participants: number;
  current_participants?: number;
  prize_pool: number;
  prize_distribution: PrizeDistribution;
  scoring_rubric: ScoringRubric;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  venue_location: string;
  status: EventStatus;
}

export interface TeamMember {
  name: string;
  roll_number?: string;
  email?: string;
  phone?: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  event?: EventItem;
  team_code?: string;
  team_name?: string;
  team_members?: TeamMember[];
  status: RegistrationStatus;
  media_url?: string;
  media_type?: 'video' | 'image' | 'document';
  media_submitted_at?: string;
  score?: number;
  score_locked?: boolean;
  final_rank?: number;
  created_at: string;
}

export interface ScoreSubmission {
  id?: string;
  registration_id: string;
  judge_id: string;
  event_id: string;
  score: number;
  rubric_scores: Record<string, number>;
  comments?: string;
  is_final: boolean;
  submitted_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  participant_name: string;
  school_name: string;
  board: SchoolBoard;
  events_count: number;
  total_score: number;
  is_current_user?: boolean;
  trend?: 'up' | 'down' | 'same';
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  type: 'registration' | 'score' | 'event_reminder' | 'debate_topic' | 'announcement';
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp';
  related_event_id?: string;
  created_at: string;
  read_at?: string;
}

export type GuestCategory = 'Chief Guest' | 'Guest of Honour' | 'Keynote Speaker' | 'VIP Dignitary' | 'Judge' | 'Special Invitee';
export type GuestStatus = 'Invited' | 'Confirmed' | 'Arrived' | 'Departed' | 'Declined';

export interface GuestItem {
  id: string;
  name: string;
  designation: string;
  organization: string;
  category: GuestCategory;
  contact_number: string;
  email: string;
  status: GuestStatus;
  escort_volunteer?: string;
  arrival_time?: string;
  departure_time?: string;
  vehicle_number?: string;
  dietary_preference: FoodPreference;
  notes?: string;
  created_at: string;
}

export type VolunteerStation = 
  | 'Gate 1 Registration & Security' 
  | 'Auditorium A (Quiz)' 
  | 'Amphitheatre (Ramp Walk)' 
  | 'Hall B (Debate)' 
  | 'Art Studio Block C (Poster)' 
  | 'Central Quad (Treasure Hunt)' 
  | 'Media Lab (Reels)' 
  | 'Food & Dining Courtyard' 
  | 'VIP & Guest Escort Protocol' 
  | 'Technical & Audio/Visual Control';

export type VolunteerShift = 'Full Day (08:30 AM - 05:30 PM)' | 'Morning Shift (08:30 AM - 01:30 PM)' | 'Afternoon Shift (01:00 PM - 05:30 PM)';
export type VolunteerAttendance = 'Present / On Duty' | 'On Break' | 'Assigned' | 'Absent';

export interface VolunteerItem {
  id: string;
  user_id?: string;
  name: string;
  contact_number: string;
  email: string;
  assigned_station: VolunteerStation;
  shift: VolunteerShift;
  attendance_status: VolunteerAttendance;
  kit_issued: boolean;
  walkie_channel?: string;
  notes?: string;
  created_at: string;
}
