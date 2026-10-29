import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CourseStream, FoodPreference, EventItem, SchoolBoard } from '../types';
import { escapeHtml } from '../lib/security';
import { registerStudent, RegistrationError, type RegistrationReceipt } from '../lib/registrationRequests';
import { dashboardFor } from '../lib/roles';
import { StudentQRCode } from '../components/StudentQRCode';


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
  const { user, login, logout, isRegistrationOpen, isLoading: authLoading } = useAuth();
  const { events, error: eventsError, isLoading: eventsLoading } = useEvents();

  // Form fields from the official Google Form. They start empty for new visitors.
  const [studentName, setStudentName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [emailId, setEmailId] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [sameAsContact, setSameAsContact] = useState(true);
  const [instituteName, setInstituteName] = useState('');
  const [cityTown, setCityTown] = useState('');
  const [courseStream, setCourseStream] = useState<CourseStream>('12th Science');
  const [board, setBoard] = useState<SchoolBoard>('CBSE');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('Veg');
  const [consent, setConsent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [website, setWebsite] = useState('');
  // One request ID per set of details: resubmitting after a lost response
  // returns the saved account instead of creating a second one.
  const intakeAttempt = useRef<{ id: string; payload: string } | null>(null);

  // Group A & Group B Selections: Choose any two from Group A & any two from Group B
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<RegistrationReceipt | null>(null);
  const [signedIn, setSignedIn] = useState(false);

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

  const fail = (message: string, field?: string) => { setErrorMessage(message); setErrorField(field); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); setErrorField(undefined);
    if (isSubmitting) return;
    if (user) return fail(user.role === 'student' ? 'You are already registered and signed in.' : 'Sign out of your staff account before registering a student.');
    if (!isRegistrationOpen) return fail('Student registration is closed. Registered students can still sign in.');
    if (!consent) return fail('Please confirm the participation terms and parent/guardian consent.', 'consent');

    // The server validates everything again; these checks give faster feedback.
    if (studentName.trim().length < 2) return fail('Please enter the Name of the Student.', 'student_name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) return fail('Please enter a valid Email Id.', 'email');
    if (contactNo.replace(/[^0-9]/g, '').length < 10 || contactNo.replace(/[^0-9]/g, '').length > 13) return fail('Enter a contact number with 10 to 13 digits.', 'contact_number');
    if (instituteName.trim().length < 2) return fail('Please provide the Name of the Institute.', 'institute_name');
    if (cityTown.trim().length < 2) return fail('Please enter your City / Town.', 'city_town');
    if (selectedCompetitions.length === 0) return fail('Please select at least 1 competition to participate.');
    if (groupASelectedCount > 2) return fail('You can select a maximum of 2 competitions from Group A.');
    if (groupBSelectedCount > 2) return fail('You can select a maximum of 2 competitions from Group B.');
    if (password.length < 8 || password.length > 72) return fail('Choose a password of 8 to 72 characters.', 'password');
    if (password !== confirmPassword) return fail('The two passwords do not match.', 'password');
    if (password.trim().toLowerCase() === emailId.trim().toLowerCase()) return fail('Do not use your email address as your password.', 'password');

    setIsSubmitting(true);
    try {
      const profile = {
        student_name: studentName.trim(), email: emailId.trim(), contact_number: contactNo.trim(),
        whatsapp_number: whatsappNo.trim() || contactNo.trim(), institute_name: instituteName.trim(),
        city_town: cityTown.trim(), course_stream: courseStream, board, food_preference: foodPreference,
        selected_competitions: [...selectedCompetitions].sort(), parent_consent: consent, terms_accepted: consent, website,
      };
      const payload = JSON.stringify(profile);
      if (intakeAttempt.current?.payload !== payload) intakeAttempt.current = { id: crypto.randomUUID(), payload };
      const saved = await registerStudent(intakeAttempt.current.id, profile, password);
      setReceipt(saved);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      // Sign in with the new account so the student can open their own dashboard.
      const session = await login(saved.email, password, 'student');
      setSignedIn(session.success);
      setPassword(''); setConfirmPassword('');
      onSuccess(events.filter(event => saved.competitions.includes(event.name)));
    } catch (err) {
      if (err instanceof RegistrationError) fail(err.message, err.field);
      else fail('Your registration could not be confirmed. Check your connection and submit again with the same details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = async () => {
    if (signedIn) await logout();
    setReceipt(null); setSignedIn(false);
    setStudentName(''); setEmailId(''); setContactNo(''); setWhatsappNo('');
    setSelectedCompetitions([]); setInstituteName(''); setCityTown(''); setConsent(false);
    setPassword(''); setConfirmPassword(''); setWebsite(''); intakeAttempt.current = null;
  };

  const handlePrintSlip = () => {
    if (!receipt) return;
    const qr = document.querySelector('#registration-qr svg')?.outerHTML || '';
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
      <div>Student ID: <span class="badge-value">${escapeHtml(receipt.student_id)}</span></div>
      <div>Event Date: <span class="badge-item">Nov 15, 2026</span></div>
      <div>Dietary Token: <span class="badge-item">${escapeHtml(receipt.food_preference)}</span></div>
    </div>
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px"><div style="width:150px;height:150px">${qr}</div><div><div class="field-label">Entry pass ID</div><div class="field-value" style="font-family:monospace;word-break:break-all">${escapeHtml(receipt.pass_id)}</div><div class="field-label" style="margin-top:8px">Registration reference</div><div class="field-value">${escapeHtml(receipt.reference_code)}</div></div></div>
    <div class="section-title">Registered Candidate Dossier</div>
    <div class="grid">
      <div><div class="field-label">Student Name</div><div class="field-value">${escapeHtml(receipt.name)}</div></div>
      <div><div class="field-label">Email Address</div><div class="field-value">${escapeHtml(receipt.email)}</div></div>
      <div><div class="field-label">Contact Number</div><div class="field-value">${escapeHtml(receipt.contact_number)}</div></div>
      <div><div class="field-label">WhatsApp Number</div><div class="field-value">${escapeHtml(receipt.whatsapp_number)}</div></div>
      <div><div class="field-label">Institute / School</div><div class="field-value">${escapeHtml(receipt.institute_name)}</div></div>
      <div><div class="field-label">City / Town</div><div class="field-value">${escapeHtml(receipt.city_town)}</div></div>
      <div><div class="field-label">Stream &amp; Board</div><div class="field-value">${escapeHtml(receipt.course_stream)} (${escapeHtml(receipt.board)})</div></div>
      <div><div class="field-label">Competitions</div><div class="field-value">${receipt.competitions.map(escapeHtml).join(' &amp; ')}</div></div>
    </div>
    <div class="notice">
      <strong>Important Instructions for Registered Participants:</strong><br/>
      1. Show this QR pass at the campus gate on Nov 15, 2026 at Srusti Campus, Chandrasekharpur, Bhubaneswar. Staff verify it against the live registration record.<br/>
      2. Sign in with your registered email and the password you chose to view your pass and details. The pass ID is not a password; never share your password.<br/>
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
      
      {!receipt && isRegistrationOpen && !user && <p className="p-4 mb-5 rounded-xl border border-blue-200 bg-blue-50 text-sm text-navy">Register below to create your CrossFire student account. You will receive your entry QR pass immediately and can sign in later with your email and password.</p>}
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

      {receipt ? (
        /* CONFIRMATION SCREEN */
        <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-white to-orange-50 border-2 border-emerald-400 rounded-3xl text-sm shadow-xl animate-fadeIn space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[10px] uppercase tracking-wider inline-block mb-1">
                Registration Confirmed
              </span>
              <h2 className="font-black text-xl sm:text-2xl text-navy">
                Welcome to CrossFire 2026, {receipt.name.split(' ')[0]}!
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Your student account, competition entries and entry pass are saved.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-xs">
            <div id="registration-qr" className="flex flex-col items-center gap-1">
              <StudentQRCode studentId={receipt.pass_id} name={receipt.name} size={170} downloadable />
              <span className="text-[10px] font-black uppercase text-navy/70 tracking-widest">Entry QR pass</span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([['Student ID', receipt.student_id], ['Pass ID', receipt.pass_id], ['Name', receipt.name], ['Email (login)', receipt.email], ['Contact / WhatsApp', `${receipt.contact_number} / ${receipt.whatsapp_number}`], ['Institute', `${receipt.institute_name} · ${receipt.city_town}`], ['Course & board', `${receipt.course_stream} · ${receipt.board}`], ['Meal preference', receipt.food_preference], ['Competitions', receipt.competitions.join(' & ')], ['Reference', receipt.reference_code]] as const).map(([label, value]) => <div key={label} className="min-w-0">
                <dt className="text-[10px] font-bold uppercase text-gray-400">{label}</dt>
                <dd className={`font-bold text-navy break-words ${label === 'Pass ID' || label === 'Student ID' ? 'font-mono text-orange-600' : ''}`}>{value}</dd>
              </div>)}
            </dl>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900 text-xs uppercase tracking-wide">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Next steps</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Save or print your QR pass and show it at the gate. You can sign in at any time with <strong>{receipt.email}</strong> and the password you chose to see this pass and your details again{signedIn ? ' — you are signed in now.' : '.'} The pass ID identifies your registration; it is not a password.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="flex-1 py-3.5 px-4 bg-navy hover:bg-navy-dark text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Print Pass &amp; Acknowledgement Slip</span>
            </button>
            {signedIn && <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="py-3.5 px-5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              Open My Dashboard
            </button>}
            <button
              type="button"
              onClick={() => void resetForm()}
              className="py-3.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              {signedIn ? 'Sign Out & Register Another' : 'Register Another Student'}
            </button>
          </div>
        </div>
      ) : user ? (
        <section className="p-6 sm:p-8 bg-white border border-gray-200 rounded-3xl text-center space-y-4">
          <h2 className="font-black text-xl text-navy">{user.role === 'student' ? 'You are already registered' : 'You are signed in with a staff account'}</h2>
          <p className="text-sm text-gray-600">{user.role === 'student' ? 'Your details, competitions and QR pass are in your dashboard.' : 'Sign out before registering a student. Staff, judge and VIP accounts are created by the organisers.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={() => setCurrentView(dashboardFor(user.role))} className="py-3 px-5 bg-orange-500 text-white font-bold text-sm rounded-xl">Open my dashboard</button>
            <button type="button" onClick={() => void logout()} className="py-3 px-5 bg-gray-100 text-gray-800 font-bold text-sm rounded-xl">Sign out</button>
          </div>
        </section>
      ) : !authLoading && !isRegistrationOpen ? (
        <section className="p-6 sm:p-8 bg-white border border-amber-200 rounded-3xl text-center space-y-4">
          <Lock className="w-8 h-8 text-orange-600 mx-auto" />
          <h2 className="font-black text-xl text-navy">Student registration is closed</h2>
          <p className="text-sm text-gray-600">New registrations are no longer accepted. Registered students can still sign in to view their details and QR pass.</p>
          <button type="button" onClick={() => window.dispatchEvent(new Event('crossfire_open_login'))} className="py-3 px-5 bg-orange-500 text-white font-bold text-sm rounded-xl">Student sign in</button>
        </section>
      ) : (
        /* Main Registration Form */
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                  Use your own email. It becomes your login and the college uses it for updates and password resets.
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
          <fieldset className="p-5 mb-4 bg-white border border-gray-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <legend className="px-1 text-sm font-black text-navy">Create your login password *</legend>
            <label className="block text-xs font-bold text-gray-700">Password<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} aria-invalid={errorField === 'password'} className={`w-full mt-1.5 p-3 border rounded-xl bg-white text-sm ${errorField === 'password' ? 'border-red-400' : 'border-gray-300'}`} /></label>
            <label className="block text-xs font-bold text-gray-700">Confirm password<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} aria-invalid={errorField === 'password'} className={`w-full mt-1.5 p-3 border rounded-xl bg-white text-sm ${errorField === 'password' ? 'border-red-400' : 'border-gray-300'}`} /></label>
            <p className="sm:col-span-2 text-[11px] text-gray-500">8 to 72 characters. You will sign in with your email and this password. The organisers never see it.</p>
          </fieldset>
          {errorMessage && <p role="alert" className="p-3 mb-3 rounded-xl bg-red-50 border border-red-200 text-sm font-bold text-red-800">{errorMessage}</p>}
          <button
            type="submit"
            disabled={isSubmitting || eventsLoading || Boolean(eventsError) || !isRegistrationOpen}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Register &amp; Get My QR Pass</span>
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
