import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CourseStream, FoodPreference, EventItem, SchoolBoard } from '../types';
import { escapeHtml } from '../lib/security';
import { isEmailAuthReady } from '../lib/supabase';
import { submitRegistrationRequest } from '../lib/registrationRequests';


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
  Lock,
  Printer,
  ExternalLink
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
  const { user, signUp, requestEmailCode, verifyEmailCode, logout } = useAuth();
  const { events, error: eventsError, isLoading: eventsLoading } = useEvents();

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
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(isExistingStudent && user ? user.food_preference : 'Veg');
  const [consent, setConsent] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState('');
  const [website, setWebsite] = useState('');
  const [registeredWithoutAccount, setRegisteredWithoutAccount] = useState(false);
  const intakeAttempt = useRef<{ id: string; payload: string } | null>(null);

  // Group A & Group B Selections: Choose any two from Group A & any two from Group B
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>(
    isExistingStudent && user ? (user.selected_competitions || []) : []
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmedStudentId, setConfirmedStudentId] = useState<string>('');
  const draftEdited = useRef(false);
  const hydratedUser = useRef(user?.id);
  useEffect(()=>{
    if (!user || user.role !== 'student' || hydratedUser.current === user.id) return;
    hydratedUser.current = user.id;
    if(draftEdited.current) return;
    setStudentName(`${user.first_name} ${user.last_name || ''}`.trim());
    setContactNo(user.contact_number || '');setEmailId(user.email);setWhatsappNo(user.whatsapp_number || '');
    setInstituteName(user.institute_name || '');setCityTown(user.city_town || '');
    setCourseStream(user.course_stream || '12th Science');setBoard(user.board || 'CBSE');setFoodPreference(user.food_preference || 'Veg');
    setSelectedCompetitions(user.selected_competitions || []);
  },[user]);

  const groupAEvents = events.filter(e => e.group === 'Group A');
  const groupBEvents = events.filter(e => e.group === 'Group B');

  const groupASelectedCount = selectedCompetitions.filter(name => groupAEvents.some(e => e.name === name)).length;
  const groupBSelectedCount = selectedCompetitions.filter(name => groupBEvents.some(e => e.name === name)).length;

  const handleCompetitionToggle = (eventName: string, group: 'Group A' | 'Group B') => {
    setErrorMessage(null);
    if (isSubmitting) return;
    if (selectedCompetitions.includes(eventName)) {
      setSelectedCompetitions(prev => prev.filter(name => name !== eventName));
    } else {
      if (group === 'Group A' && groupASelectedCount >= 2) {
        setErrorMessage('Quota Limit: You can select a maximum of 2 competitions from Group A.');
        return;
      }
      if (group === 'Group B' && groupBSelectedCount >= 2) {
        setErrorMessage('Quota Limit: You can select a maximum of 2 competitions from Group B.');
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
    if (isSubmitting) return;
    if (!consent) { setErrorMessage('Please confirm the participation terms and parent/guardian consent.'); return; }
    if (user && user.role !== 'student') { setErrorMessage('Sign out of your staff account before registering a student.'); return; }

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
    if (groupASelectedCount > 2) {
      setErrorMessage('You can select a maximum of 2 competitions from Group A.');
      return;
    }
    if (groupBSelectedCount > 2) {
      setErrorMessage('You can select a maximum of 2 competitions from Group B.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isEmailAuthReady) {
        const profile = {
          student_name: studentName.trim(), email: emailId.trim(), contact_number: contactNo.trim(),
          whatsapp_number: whatsappNo.trim() || contactNo.trim(), institute_name: instituteName.trim(),
          city_town: cityTown.trim(), course_stream: courseStream, board, food_preference: foodPreference,
          selected_competitions: [...selectedCompetitions].sort(), parent_consent: consent, terms_accepted: consent, website,
        };
        const payload = JSON.stringify(profile);
        if (intakeAttempt.current?.payload !== payload) intakeAttempt.current = { id: crypto.randomUUID(), payload };
        const reference = await submitRegistrationRequest(intakeAttempt.current.id, profile);
        setConfirmedStudentId(reference);
        setRegisteredWithoutAccount(true);
        setSubmitted(true);
        return;
      }
      if (user?.email.toLowerCase() !== emailId.trim().toLowerCase()) {
        if (codeSentTo !== emailId.trim().toLowerCase()) {
          const sent = await requestEmailCode(emailId, true);
          if (!sent.success) setErrorMessage(sent.error || 'Unable to send verification code.');
          else setCodeSentTo(emailId.trim().toLowerCase());
          return;
        }
        const verified = await verifyEmailCode(emailId, emailCode);
        if (!verified.success) { setErrorMessage(verified.error || 'Email verification failed.'); return; }
      }
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
        food_preference: foodPreference,
        selected_competitions: selectedCompetitions,
        parent_consent: consent,
        terms_accepted: consent,
      });

      if (res.success) {
        if (!res.passId) { setErrorMessage('Your registration receipt could not be verified. Please review your account.'); return; }
        setConfirmedStudentId(res.passId);
        setEmailCode('');
        setSubmitted(true);
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 }
        });

        const selectedEventObjects = events.filter(e => selectedCompetitions.includes(e.name));
        onSuccess(selectedEventObjects);
      } else {
        setErrorMessage(res.error || 'Failed to submit registration. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    const slipWindow = window.open('', '_blank', 'width=850,height=900');
    if (!slipWindow) {
      alert('Pop-up was blocked. Please enable pop-ups to view/print the acknowledgement slip.');
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CrossFire 2026 - Registration Acknowledgement Slip</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0a192f; padding: 20px; }
    .slip { border: 2px solid #0a192f; border-radius: 16px; padding: 24px; position: relative; }
    .header { text-align: center; border-bottom: 2px solid #ff5722; padding-bottom: 16px; margin-bottom: 20px; }
    .org { font-size: 13px; font-weight: bold; color: #475569; letter-spacing: 0.5px; }
    .title { font-size: 26px; font-weight: 900; color: #ff5722; margin: 4px 0; }
    .subtitle { font-size: 11px; font-weight: 700; color: #0a192f; text-transform: uppercase; }
    .badge-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 12px; }
    .badge-item { font-weight: bold; }
    .badge-value { color: #ff5722; font-weight: 900; font-size: 14px; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0a192f; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 16px 0 10px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
    .field-label { color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; }
    .field-value { font-weight: bold; margin-top: 2px; }
    .notice { margin-top: 24px; background: #fff7ed; border: 1px solid #ffedd5; padding: 12px 16px; border-radius: 10px; font-size: 11px; line-height: 1.5; color: #9a3412; }
    .footer { margin-top: 28px; display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 10px; color: #64748b; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div style="text-align: right; margin-bottom: 10px;" class="no-print">
    <button id="print-slip" style="padding: 8px 16px; background: #ff5722; color: #fff; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
      Print Slip
    </button>
  </div>
  <div class="slip">
    <div class="header">
      <div class="org">SRUSTI ACADEMY OF GRADUATE STUDIES (AUTONOMOUS)</div>
      <div class="title">CROSSFIRE 2026</div>
      <div class="subtitle">STATE-LEVEL TALENT HUNT • OFFICIAL REGISTRATION ACKNOWLEDGEMENT SLIP</div>
    </div>
    <div class="badge-bar">
      <div>${registeredWithoutAccount ? 'Registration reference' : 'Registration ID'}: <span class="badge-value">${escapeHtml(confirmedStudentId)}</span></div>
      <div>Event Date: <span class="badge-item">Nov 15, 2026</span></div>
      <div>Dietary Token: <span class="badge-item">${escapeHtml(foodPreference)}</span></div>
    </div>
    <div class="section-title">Registered Candidate Dossier</div>
    <div class="grid">
      <div><div class="field-label">Student Name</div><div class="field-value">${escapeHtml(studentName)}</div></div>
      <div><div class="field-label">Email Address</div><div class="field-value">${escapeHtml(emailId)}</div></div>
      <div><div class="field-label">Contact Number</div><div class="field-value">${escapeHtml(contactNo)}</div></div>
      <div><div class="field-label">WhatsApp Number</div><div class="field-value">${escapeHtml(whatsappNo || contactNo)}</div></div>
      <div><div class="field-label">Institute / School</div><div class="field-value">${escapeHtml(instituteName)}</div></div>
      <div><div class="field-label">City / Town</div><div class="field-value">${escapeHtml(cityTown)}</div></div>
      <div><div class="field-label">Stream &amp; Board</div><div class="field-value">${escapeHtml(courseStream)} (${escapeHtml(board)})</div></div>
      <div><div class="field-label">Competitions</div><div class="field-value">${selectedCompetitions.map(escapeHtml).join(' &amp; ')}</div></div>
    </div>
    <div class="notice">
      <strong>${registeredWithoutAccount ? 'Registration saved' : 'Important Instructions for Registered Participants'}:</strong><br/>
      1. ${registeredWithoutAccount ? 'Keep this registration reference for enquiries. Entry passes are issued separately.' : 'Keep this official acknowledgement slip saved or printed for physical campus entry on Nov 15, 2026 at Srusti Campus, Chandrasekharpur, Bhubaneswar.'}<br/>
      2. ${registeredWithoutAccount ? 'Your registration details and competition choices are saved. Portal access is provided separately.' : 'Use your registered email and a one-time code to sign in. Your pass ID is not a password. Portal tools open when enabled by the organisers.'}<br/>
      3. For any queries or verification, contact Event Coordinators Mr. N.R. Swain (+91-7008671339) or Mr. A. Meher (+91-8455090984).
    </div>
    <div class="footer">
      <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
      <div>CrossFire 2026 Organizing Committee • SAGS Bhubaneswar</div>
    </div>
  </div>
</body>
</html>`;
    slipWindow.document.open();
    slipWindow.document.write(html);
    slipWindow.document.close();
    slipWindow.document.getElementById('print-slip')?.addEventListener('click',()=>slipWindow.print());
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
      
      {!isEmailAuthReady && <p className="p-4 mb-5 rounded-xl border border-blue-200 bg-blue-50 text-sm text-navy">Register below to save your details and competition choices. Keep your registration reference for enquiries. Portal access and entry passes are provided separately.</p>}
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
                SRUSTI ACADEMY OF GRADUATE STUDIES
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
            Group A (Any Two) • Group B (Any Two)
          </span>
        </div>

        {/* Assistance / Google Form Emergency Backup Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-cyan-50/60 to-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
            <span className="font-semibold text-blue-950">
              Facing any problem with the online registration form?
            </span>
            <span className="text-blue-800 hidden md:inline">
              You can instantly submit your entry using our official Google Form backup.
            </span>
          </div>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfIPctLilosmqJukeZze--Z9MKpcazZ3zJRq1pstA59bcfWzA/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition-all self-start sm:self-auto shrink-0 hover:scale-105"
          >
            <span>Register via Google Form ↗</span>
          </a>
        </div>
      </div>

      {submitted ? (
        /* CONFIRMATION SCREEN */
        <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-white to-orange-50 border-2 border-emerald-400 rounded-3xl text-sm shadow-xl animate-fadeIn space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px] uppercase tracking-wider inline-block mb-1">
                {registeredWithoutAccount ? 'Registration Confirmed' : 'Official Registration Confirmed'}
              </span>
              <h2 className="font-black text-xl sm:text-2xl text-navy">
                Registration Successfully Recorded!
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Your registration has been saved in CrossFire.
              </p>
            </div>
          </div>

          {/* Registration Dossier Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">{registeredWithoutAccount ? 'Registration Reference' : 'Registration Pass ID'}</span>
              <span className="font-black text-lg text-orange-600 font-mono break-all">{confirmedStudentId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Candidate Name</span>
              <span className="font-bold text-navy text-sm block truncate">{studentName}</span>
              <span className="text-[11px] text-gray-500">{emailId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Selected Competitions</span>
              <span className="font-bold text-emerald-700 text-xs block">{selectedCompetitions.join(' & ')}</span>
              <span className="text-[10px] text-gray-500 font-semibold mt-0.5 inline-block">Diet: {foodPreference}</span>
            </div>
          </div>

          {/* Locked Portal Notice & Admin Distribution Explanation */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900 text-xs uppercase tracking-wide">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{registeredWithoutAccount ? 'Next steps: Keep your reference' : 'Next steps: Keep your pass ID'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              {registeredWithoutAccount ? 'Your details and competition choices are saved. No staff approval is required to record your registration. Portal access and entry passes are provided separately. Contact the organisers with your reference if you need to make a correction.' : 'Your registration is saved. Sign in using a one-time code sent to your verified email. No password is needed. Passes and event tools become available when the organisers open the student portal.'}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-navy">
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200">📧 {emailId}</span>
            </div>
          </div>

          {/* Actions: Download Slip, Return Home, Register Another */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="flex-1 py-3.5 px-4 bg-navy hover:bg-navy-dark text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Download / Print Acknowledgement Slip</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('landing')}
              className="py-3.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              Return to Home
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!registeredWithoutAccount) await logout();
                setSubmitted(false);
                setStudentName('');
                setEmailId('');
                setContactNo('');
                setWhatsappNo('');
                setSelectedCompetitions([]);
                setInstituteName('');setCityTown('');setConsent(false);setEmailCode('');setCodeSentTo('');
                setConfirmedStudentId('');draftEdited.current=false;hydratedUser.current=undefined;
                setRegisteredWithoutAccount(false);setWebsite('');intakeAttempt.current=null;
              }}
              className="py-3.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              Register Another Student
            </button>
          </div>
        </div>
      ) : (
        /* Main Registration Form */
        <form onSubmit={handleSubmit} onChange={()=>{draftEdited.current=true;}} className="space-y-6">
          <div className="absolute -left-[10000px]" aria-hidden="true"><label>Website<input type="text" name="website" value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
          
          {/* Error Alerts with Google Form Emergency Link */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-800 block text-xs">{errorMessage}</span>
                  <span className="text-[11px] text-red-600 mt-0.5 block">
                    Experiencing persistent submission issues? You can complete registration directly via Google Form.
                  </span>
                </div>
              </div>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfIPctLilosmqJukeZze--Z9MKpcazZ3zJRq1pstA59bcfWzA/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all hover:scale-105"
              >
                <span>Submit via Google Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
                  {isEmailAuthReady ? 'Use your own email address. We will verify it with a one-time code before saving your registration.' : 'Enter an email address the college team can use to contact you.'}
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
                Keep this number accurate so the college team can contact you about the event.
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
                Select your preferred competitive events: Group A (any two) &amp; Group B (any two).
              </p>
            </div>

            {/* Real-time selection counter badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                groupASelectedCount > 0
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                Group A: {groupASelectedCount}/2 Selected
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                groupBSelectedCount > 0
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                Group B: {groupBSelectedCount}/2 Selected
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-black bg-navy text-white shadow-sm">
                Total: {selectedCompetitions.length} Selected
              </span>
            </div>
          </div>

          {/* 7. Group A Competitions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 block">
                7. Group A Competitions (Choose Any Two)
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {groupASelectedCount} of 2 Selected
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {groupAEvents.map((event) => {
                const isChecked = selectedCompetitions.includes(event.name);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleCompetitionToggle(event.name, 'Group A')}
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 block">
                8. Group B Competitions (Choose Any Two)
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {groupBSelectedCount} of 2 Selected
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {groupBEvents.map((event) => {
                const isChecked = selectedCompetitions.includes(event.name);
                return (
                  <div
                    key={event.id}
                    onClick={() => handleCompetitionToggle(event.name, 'Group B')}
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
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span>I confirm these details are accurate, accept the event rules, and have parent or guardian consent where required.</span>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          {(eventsError || eventsLoading) && <p role="status" className="p-3 mb-3 text-sm text-slate-600">{eventsError || 'Loading available competitions…'}</p>}
          {codeSentTo === emailId.trim().toLowerCase() && codeSentTo && user?.email.toLowerCase() !== codeSentTo && <div className="p-5 mb-4 bg-blue-50 border border-blue-200 rounded-xl"><label className="block text-sm font-bold text-navy">Email verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} value={emailCode} onChange={e=>setEmailCode(e.target.value)} className="w-full mt-2 p-3 border rounded-xl bg-white" /></label><p className="text-xs text-slate-600 mt-2">Check the inbox for {codeSentTo}. Your details are saved only after verification.</p><button type="button" className="text-xs underline mt-3" onClick={()=>{setCodeSentTo('');setEmailCode('');}}>Request a new code</button></div>}
          <button
            type="submit"
            disabled={isSubmitting || submitted || eventsLoading || Boolean(eventsError)}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{!isEmailAuthReady ? 'Register for CrossFire' : user?.email.toLowerCase() === emailId.trim().toLowerCase() ? 'Save CrossFire registration' : codeSentTo === emailId.trim().toLowerCase() && codeSentTo ? 'Verify email and register' : 'Verify email to register'}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-3">
            Srusti Academy of Management & Technology • CrossFire 2026
          </p>

          {/* Alternative Google Form Registration Support Card */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-white to-blue-50/90 border border-blue-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-navy text-xs sm:text-sm">
                  Facing any problem submitting your registration?
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  You can directly submit your registration using our official Google Form backup.
                </p>
              </div>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfIPctLilosmqJukeZze--Z9MKpcazZ3zJRq1pstA59bcfWzA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all hover:scale-105 shadow-md"
            >
              <span>Open Google Form ↗</span>
            </a>
          </div>
        </div>

        </form>
      )}
    </div>
  );
};
