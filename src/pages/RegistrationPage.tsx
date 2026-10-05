import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CourseStream, FoodPreference, EventItem, SchoolBoard } from '../types';

import { 
  CheckCircle, 
  AlertCircle, 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  Sparkles, 
  Brain, 
  Video, 
  MessageSquareQuote, 
  Palette, 
  Compass, 
  Utensils, 
  BookOpen, 
  User,
  ArrowRight,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEvents } from '../context/EventsContext';

interface RegistrationPageProps {
  onSuccess: (selectedEvents: EventItem[]) => void;
  setCurrentView: (view: string) => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  onSuccess,
  setCurrentView,
}) => {
  const { user, signUp } = useAuth();
  const { events } = useEvents();

  // Form Fields from Google Form - Start empty for new visitors
  const isExistingStudent = Boolean(user && user.role === 'student' && user.email);
  const [studentName, setStudentName] = useState(isExistingStudent && user ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
  const [contactNo, setContactNo] = useState(isExistingStudent && user ? (user.contact_number || user.mobile_number || '') : '');
  const [emailId, setEmailId] = useState(isExistingStudent && user ? user.email : '');
  const [whatsappNo, setWhatsappNo] = useState(isExistingStudent && user ? (user.whatsapp_number || user.mobile_number || '') : '');
  const [sameAsContact, setSameAsContact] = useState(true);
  const [instituteName, setInstituteName] = useState(isExistingStudent && user ? (user.institute_name || user.school_name || '') : '');
  const [cityTown, setCityTown] = useState(isExistingStudent && user ? (user.city_town || '') : '');
  const [courseStream, setCourseStream] = useState<CourseStream>(isExistingStudent && user ? user.course_stream : '12th Science');
  const [board, setBoard] = useState<SchoolBoard>(isExistingStudent && user ? (user.board || 'CBSE') : 'CBSE');
  const [dateOfBirth, setDateOfBirth] = useState(isExistingStudent && user ? (user.date_of_birth || '') : '');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(isExistingStudent && user ? user.food_preference : 'Veg');
  const [sendCopy, setSendCopy] = useState(true);

  // Group A & Group B Selections (Combined Max 2 Limit) - Start empty
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>(
    isExistingStudent && user ? (user.selected_competitions || []) : []
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const groupAEvents = events.filter(e => e.group === 'Group A');
  const groupBEvents = events.filter(e => e.group === 'Group B');

  const handleCompetitionToggle = (eventName: string) => {
    setErrorMessage(null);
    if (selectedCompetitions.includes(eventName)) {
      setSelectedCompetitions(prev => prev.filter(name => name !== eventName));
    } else {
      if (selectedCompetitions.length >= 2) {
        setErrorMessage('Quota Limit: You may select a maximum of 2 competitions across Group A & Group B.');
        return;
      }
      setSelectedCompetitions(prev => [...prev, eventName]);
    }
  };

  const handleContactChange = (val: string) => {
    setContactNo(val);
    if (sameAsContact) {
      setWhatsappNo(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!studentName.trim()) {
      setErrorMessage('Please enter the Name of the Student.');
      return;
    }
    if (!emailId.trim() || !emailId.includes('@')) {
      setErrorMessage('Please enter a valid Email Id.');
      return;
    }
    if (!contactNo.trim()) {
      setErrorMessage('Please enter your Contact Number.');
      return;
    }
    if (!dateOfBirth) {
      setErrorMessage('Please provide your Date of Birth.');
      return;
    }
    if (!instituteName.trim()) {
      setErrorMessage('Please provide the Name of the Institute.');
      return;
    }
    if (!cityTown.trim()) {
      setErrorMessage('Please enter your City / Town.');
      return;
    }
    if (selectedCompetitions.length === 0) {
      setErrorMessage('Please select at least 1 competition to participate.');
      return;
    }
    if (selectedCompetitions.length > 2) {
      setErrorMessage('You can select a maximum of 2 competitions only.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parts = studentName.trim().split(' ');
      const firstName = parts[0] || 'Student';
      const lastName = parts.slice(1).join(' ') || '';

      const res = await signUp({
        email: emailId.trim(),
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNo.trim(),
        whatsapp_number: whatsappNo.trim() || contactNo.trim(),
        institute_name: instituteName.trim(),
        city_town: cityTown.trim(),
        course_stream: courseStream,
        board: board,
        date_of_birth: dateOfBirth,
        food_preference: foodPreference,
        selected_competitions: selectedCompetitions,
        parent_consent: true,
        terms_accepted: true,
      });

      if (res.success) {
        setSubmitted(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        const selectedEventObjects = events.filter(e => selectedCompetitions.includes(e.name));
        onSuccess(selectedEventObjects);

        setTimeout(() => {
          setCurrentView('dashboard');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to submit registration. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-5 h-5 text-orange-500" />;
      case 'MessageSquareQuote': return <MessageSquareQuote className="w-5 h-5 text-orange-500" />;
      case 'Palette': return <Palette className="w-5 h-5 text-orange-500" />;
      case 'Compass': return <Compass className="w-5 h-5 text-orange-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-orange-500" />;
      case 'Video': return <Video className="w-5 h-5 text-orange-500" />;
      default: return <Sparkles className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-16">
      
      {/* Srusti Official Branding Header */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-6 sm:mb-8">
        <div className="bg-navy p-5 sm:p-7 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10 text-center sm:text-left">
            <div className="flex items-center gap-3 shrink-0">
              {/* SAGS Emblem */}
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 p-1.5 rounded-2xl bg-white shadow-2xl flex items-center justify-center border-2 border-white/30 shrink-0">
                <img 
                  src="/sagslogo.png" 
                  alt="SAGS Official Logo" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* CrossFire Event Emblem */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white p-1.5 shadow-2xl flex items-center justify-center border-2 border-orange-500">
                  <img 
                    src="/Logo.png" 
                    alt="CrossFire 2026 Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-full shadow">
                  2026
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="px-3 py-1 rounded-full bg-white/10 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-white/10 inline-block">
                Official Student Registration Form
              </span>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                SRUSTI ACADEMY OF MANAGEMENT AND TECHNOLOGY
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">
                CROSSFIRE 2026 &bull; State-Level Talent Hunt for +2 Final Year Students
              </p>
              <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-4 text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" /> Srusti Campus, Bhubaneswar
                </span>
                <span className="hidden sm:inline">&bull;</span>
                <span className="text-orange-400 font-bold">Nov 15, 2026</span>
                <span className="hidden sm:inline">&bull;</span>
                <span className="text-emerald-400 font-bold">₹50,000 Cash Prizes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 border-t border-b border-amber-200 px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>* Indicates required question. Exclusively for +2 2nd Year (Class 12) students.</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full self-start sm:self-auto shrink-0">
            Max 2 Competitions
          </span>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {submitted && (
          <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-sm text-emerald-900 shadow-md animate-fadeIn space-y-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-black text-base text-emerald-900">Registration Successfully Recorded!</p>
                <p className="text-xs text-emerald-700">Official competitor pass generated and added to Srusti CrossFire Roster.</p>
              </div>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs">
              <p className="font-bold text-navy">
                💡 Student Login Access: <span className="text-orange-600 font-extrabold">{emailId}</span>
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                You can log into your Student Portal anytime from any device using just this email address.
              </p>
            </div>
            <p className="text-xs font-semibold text-emerald-700 animate-pulse">
              Redirecting you to your verified Student Dashboard...
            </p>
          </div>
        )}

        {/* SECTION 1: STUDENT IDENTITY */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-black text-navy flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              <span>Personal & Contact Information</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Please enter your full official name and primary contact coordinates.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Name of Student */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                1. Name of the Student *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy transition-all"
              />
            </div>

            {/* Email and Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 3. Email Id */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  3. Email Id: *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  A verification copy will be dispatched to this email address.
                </span>
              </div>

              {/* 2. Contact No. */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  2. Contact No. *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={contactNo}
                    onChange={(e) => handleContactChange(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 9. WhatsApp Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  9. WhatsApp Number *
                </label>
                <label className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsContact}
                    onChange={(e) => {
                      setSameAsContact(e.target.checked);
                      if (e.target.checked) setWhatsappNo(contactNo);
                    }}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>Same as Contact No.</span>
                </label>
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  disabled={sameAsContact}
                  value={whatsappNo}
                  onChange={(e) => setWhatsappNo(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy disabled:bg-gray-50 transition-all"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                Debate topics and emergency campus alerts will be transmitted directly via WhatsApp.
              </span>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date of Birth (+2 Eligibility: Ages 16–18) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                As per festival regulations, only candidates aged 16 to 18 (+2 Final Year) are eligible to participate.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACADEMIC DETAILS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-black text-navy flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <span>Academic Details (+2 Institution)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your current junior college / higher secondary school details.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4. Name of the Institute */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  4. Name of the Institute *
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    placeholder="e.g. DAV Public School / BJB Junior College"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                  />
                </div>
              </div>

              {/* 5. Name of the City / Town */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  5. Name of the City / Town *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={cityTown}
                    onChange={(e) => setCityTown(e.target.value)}
                    placeholder="e.g. Bhubaneswar, Cuttack, Rourkela"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 6. Course */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                6. Course (+2 Stream) *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['12th Science', '12th Commerce', '12th Arts'] as CourseStream[]).map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => setCourseStream(course)}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold text-center transition-all ${
                      courseStream === course
                        ? 'bg-navy text-white border-navy shadow-md ring-2 ring-navy/10'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Affiliation Board */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                7. Affiliation Board *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['CBSE', 'ICSE', 'CHSE'] as SchoolBoard[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBoard(b)}
                    className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold text-center transition-all ${
                      board === b
                        ? 'bg-navy text-white border-navy shadow-md ring-2 ring-navy/10'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: COMPETITIONS (GROUP A & GROUP B) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-navy flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span>Competitions in Which to Participate</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Select your preferred competitive events from Group A and Group B (Max 2 total).
              </p>
            </div>

            {/* Real-time selection counter badge */}
            <div className={`self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-black border ${
              selectedCompetitions.length === 2
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              {selectedCompetitions.length} of 2 Competitions Chosen
            </div>
          </div>

          {/* 7. Group A Competitions */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-orange-600 block">
              7. Group A Competitions (Choose Any)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {groupAEvents.map((event) => {
                const isChecked = selectedCompetitions.includes(event.name);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleCompetitionToggle(event.name)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isChecked
                        ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                        : 'bg-gray-50 hover:bg-white border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">
                          {getEventIcon(event.event_icon)}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
                        />
                      </div>
                      <h4 className="font-bold text-navy text-xs sm:text-sm">{event.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[10px] font-bold text-gray-600">
                      <span>{event.event_type === 'solo' ? '👤 Solo' : `👥 Team of ${event.team_size}`}</span>
                      <span className="text-navy">₹{event.prize_pool.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. Group B Competitions */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-600 block">
              8. Group B Competitions (Choose Any)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {groupBEvents.map((event) => {
                const isChecked = selectedCompetitions.includes(event.name);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleCompetitionToggle(event.name)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isChecked
                        ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                        : 'bg-gray-50 hover:bg-white border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">
                          {getEventIcon(event.event_icon)}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
                        />
                      </div>
                      <h4 className="font-bold text-navy text-xs sm:text-sm">{event.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[10px] font-bold text-gray-600">
                      <span>{event.event_type === 'solo' ? '👤 Solo' : `👥 Team of ${event.team_size}`}</span>
                      <span className="text-navy">₹{event.prize_pool.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4: FOOD PREFERENCE & LOGISTICS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-black text-navy flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              <span>Campus Catering & Event Preferences</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Complimentary refreshments and lunch are arranged by Srusti Academy for all registered participants.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              10. Food Preference *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(['Veg', 'Non-veg'] as FoodPreference[]).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setFoodPreference(pref)}
                  className={`py-3.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    foodPreference === pref
                      ? 'bg-navy text-white border-navy shadow-md ring-2 ring-navy/10'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{pref === 'Veg' ? '🥗 Vegetarian' : '🍗 Non-Vegetarian'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={sendCopy}
                onChange={(e) => setSendCopy(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span>Send me a copy of my responses to {emailId || 'my email'}.</span>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || submitted}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Srusti CrossFire Registration</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-3">
            Secure submission powered by Supabase Auth & Database • Srusti Academy of Management & Technology
          </p>
        </div>

      </form>
    </div>
  );
};
