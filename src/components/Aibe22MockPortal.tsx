import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  FileDown,
  KeyRound,
  Lock,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type { Aibe22ScheduleInfo, CandidateDetails } from '../../shared/types';

interface Aibe22MockPortalProps {
  schedule: Aibe22ScheduleInfo | null;
  loadingSchedule: boolean;
  candidateDetails: CandidateDetails;
  onChangeDetails: (details: CandidateDetails) => void;
  startingExam: boolean;
  startError: string | null;
  onStartAibe22Exam: (isExaminerPreview?: boolean) => void;
  onBackLobby: () => void;
  examinerToken: string | null;
  onRequestExaminerPin: () => void;
}

function splitCountdown(msRemaining: number) {
  const safe = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { days, hours, minutes, seconds };
}

function formatReadableDate(ymd: string): string {
  try {
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(dt);
  } catch {
    return ymd;
  }
}

export function Aibe22MockPortal({
  schedule,
  loadingSchedule,
  candidateDetails,
  onChangeDetails,
  startingExam,
  startError,
  onStartAibe22Exam,
  onBackLobby,
  examinerToken,
  onRequestExaminerPin,
}: Aibe22MockPortalProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase: 'loading' | 'upcoming' | 'open' | 'closed' = !schedule
    ? 'loading'
    : nowMs < schedule.startTimestampMs
      ? 'upcoming'
      : nowMs < schedule.endTimestampMs
        ? 'open'
        : 'closed';

  const msTarget =
    phase === 'upcoming' && schedule
      ? schedule.startTimestampMs - nowMs
      : phase === 'open' && schedule
        ? schedule.endTimestampMs - nowMs
        : 0;

  const countdown = splitCountdown(msTarget);

  const validateCandidateDetails = (): boolean => {
    const cleanName = candidateDetails.fullName.trim();
    const cleanEmail = (candidateDetails.email || '').trim();
    const cleanPhone = (candidateDetails.phone || '').trim();

    if (cleanName.length < 2) {
      setLocalError('Please enter your Full Name (at least 2 characters).');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLocalError('Please enter a valid Email Address.');
      return false;
    }
    if (cleanPhone.replace(/\D/g, '').length < 7) {
      setLocalError('Please enter a valid Mobile / Phone Number.');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleBeginClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCandidateDetails()) return;
    onStartAibe22Exam(false);
  };

  const handleExaminerPreviewLaunch = () => {
    if (!examinerToken) {
      onRequestExaminerPin();
      return;
    }
    if (!validateCandidateDetails()) return;
    onStartAibe22Exam(true);
  };

  const combinedError = localError || startError;
  const detailsReady =
    candidateDetails.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((candidateDetails.email || '').trim()) &&
    (candidateDetails.phone || '').replace(/\D/g, '').length >= 7;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-5">
        <button
          type="button"
          onClick={onBackLobby}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/80 bg-white px-3.5 py-2 text-xs font-semibold text-amber-950 shadow-2xs transition-colors hover:bg-amber-50"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
          Back to Nash Law Exam Papers
        </button>
      </div>

      {/* Golden Sovereign Hero & Live Countdown Banner */}
      <section className="overflow-hidden rounded-3xl border-2 border-amber-400/90 bg-gradient-to-br from-amber-950 via-yellow-950 to-slate-950 text-white shadow-xl">
        <div
          className="h-2 w-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
          {/* Left Identity */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/15 px-3 py-1.5 text-xs font-bold tracking-wider text-amber-200 uppercase">
              <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <span>Nash Law Golden Edition · Scheduled National Mock</span>
            </div>

            <h1 className="text-balance mt-3 font-serif text-3xl font-bold tracking-tight text-amber-100 sm:text-4xl">
              AIBE XXII Mock Test
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-amber-100/85 sm:text-base">
              Scheduled live examination using the official{' '}
              <strong className="font-bold text-yellow-200">AIBE-XXI (Set Code-A)</strong> 100-MCQ
              question paper. Enter your candidate details below, monitor the live countdown until{' '}
              <strong className="font-bold text-yellow-200">11:30 AM</strong>, and download your
              complete progress &amp; mistake rectification report as a PDF once finished.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-400/35 bg-black/25 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  Exam Date
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {schedule ? formatReadableDate(schedule.examDateYmd) : 'Tomorrow'}
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/35 bg-black/25 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Exam Window
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-yellow-200">
                  11:30 AM – 3:00 PM
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/35 bg-black/25 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Question Paper
                </div>
                <div className="mt-1 text-xs font-bold text-white">AIBE-XXI (Set A · 100 Qs)</div>
              </div>
            </div>
          </div>

          {/* Right Live Countdown Timer */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-b from-amber-900/50 to-black/50 p-5 text-center shadow-inner sm:p-6">
              {loadingSchedule ? (
                <p className="py-6 text-sm text-amber-200">Loading exam schedule...</p>
              ) : phase === 'upcoming' ? (
                <>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-300 uppercase">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Countdown Until Exam Starts (11:30 AM)
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2.5">
                    {[
                      { label: 'Days', val: countdown.days },
                      { label: 'Hours', val: countdown.hours },
                      { label: 'Mins', val: countdown.minutes },
                      { label: 'Secs', val: countdown.seconds },
                    ].map((unit) => (
                      <div
                        key={unit.label}
                        className="rounded-xl border border-amber-400/40 bg-slate-950/75 px-2 py-3"
                      >
                        <div className="font-mono text-2xl font-bold text-yellow-300 tabular-nums sm:text-3xl">
                          {String(unit.val).padStart(2, '0')}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold tracking-wider text-amber-200/80 uppercase">
                          {unit.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3.5 text-xs text-amber-100/85">
                    Exam begins at <strong className="text-yellow-200">11:30 AM</strong> and closes
                    strictly at <strong className="text-yellow-200">3:00 PM</strong>.
                  </p>
                </>
              ) : phase === 'open' ? (
                <>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-300 uppercase">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Live Exam Window Open Now
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {[
                      { label: 'Hours Left', val: countdown.hours },
                      { label: 'Mins Left', val: countdown.minutes },
                      { label: 'Secs Left', val: countdown.seconds },
                    ].map((unit) => (
                      <div
                        key={unit.label}
                        className="rounded-xl border border-emerald-400/50 bg-slate-950/80 px-2 py-3"
                      >
                        <div className="font-mono text-2xl font-bold text-emerald-300 tabular-nums sm:text-3xl">
                          {String(unit.val).padStart(2, '0')}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold tracking-wider text-emerald-200/85 uppercase">
                          {unit.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3.5 text-xs text-emerald-100">
                    Window closes at <strong className="text-yellow-200">3:00 PM</strong>. Auto-submit
                    triggers at closing time.
                  </p>
                </>
              ) : (
                <div className="py-4">
                  <Lock className="mx-auto h-9 w-9 text-amber-300" aria-hidden="true" />
                  <h2 className="mt-2 font-serif text-xl font-bold text-amber-100">
                    Exam Window Closed at 3:00 PM
                  </h2>
                  <p className="mt-1.5 text-xs text-amber-200/85">
                    The scheduled 11:30 AM – 3:00 PM examination window for{' '}
                    {schedule ? formatReadableDate(schedule.examDateYmd) : 'this session'} has
                    concluded.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Candidate Details + Quick PDF Progress Overview */}
      <section className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
        {/* Left: Candidate Details & Launch Exam */}
        <form
          onSubmit={handleBeginClick}
          className="overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-white shadow-md lg:col-span-7"
        >
          <div
            className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-3.5 border-b border-amber-100 pb-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-xs">
                <UserCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  AIBE XXII Candidate Details
                </h2>
                <p className="text-xs font-medium text-slate-600">
                  No roll number needed · Included on your leaderboard record &amp; downloadable PDF
                  progress report
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="aibe22-name" className="block text-xs font-bold text-slate-800">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="aibe22-name"
                  type="text"
                  value={candidateDetails.fullName}
                  onChange={(e) => {
                    setLocalError(null);
                    onChangeDetails({ ...candidateDetails, fullName: e.target.value });
                  }}
                  maxLength={80}
                  placeholder="e.g., Rohan Kulkarni"
                  className="mt-1.5 w-full rounded-xl border border-amber-300/80 bg-amber-50/25 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="aibe22-email" className="block text-xs font-bold text-slate-800">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="aibe22-email"
                    type="email"
                    value={candidateDetails.email || ''}
                    onChange={(e) => {
                      setLocalError(null);
                      onChangeDetails({ ...candidateDetails, email: e.target.value });
                    }}
                    maxLength={120}
                    placeholder="name@example.com"
                    className="mt-1.5 w-full rounded-xl border border-amber-300/80 bg-amber-50/25 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="aibe22-phone" className="block text-xs font-bold text-slate-800">
                    Mobile / Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="aibe22-phone"
                    type="tel"
                    value={candidateDetails.phone || ''}
                    onChange={(e) => {
                      setLocalError(null);
                      onChangeDetails({ ...candidateDetails, phone: e.target.value });
                    }}
                    maxLength={32}
                    placeholder="+91 98765 43210"
                    className="mt-1.5 w-full rounded-xl border border-amber-300/80 bg-amber-50/25 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="aibe22-bar" className="block text-xs font-bold text-slate-800">
                  State / Bar Council / Law College (Optional)
                </label>
                <input
                  id="aibe22-bar"
                  type="text"
                  value={candidateDetails.stateOrBarCouncil || ''}
                  onChange={(e) =>
                    onChangeDetails({ ...candidateDetails, stateOrBarCouncil: e.target.value })
                  }
                  maxLength={100}
                  placeholder="e.g., Bar Council of Karnataka / NLSIU"
                  className="mt-1.5 w-full rounded-xl border border-amber-300/80 bg-amber-50/25 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              {combinedError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                  <span>{combinedError}</span>
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-yellow-50/60 p-4 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold">
                  <Award className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  Exam Rules · AIBE-XXI Set Code-A Paper
                </div>
                <p className="mt-1 leading-relaxed text-amber-900/90">
                  100 official MCQs · Zero negative marking · Window strictly 11:30 AM to 3:00 PM ·
                  Total marks &amp; Bare Act mistake rectification unlock on submission.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-amber-100 bg-amber-50/50 px-6 py-4 sm:px-7">
            <button
              type="submit"
              disabled={phase !== 'open' || startingExam}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500"
            >
              {phase === 'open' ? (
                <>
                  <span>
                    {startingExam ? 'Launching AIBE XXII Mock...' : 'Begin AIBE XXII Mock Test'}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              ) : phase === 'upcoming' ? (
                <>
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Locked Until 11:30 AM ({String(countdown.hours).padStart(2, '0')}:
                    {String(countdown.minutes).padStart(2, '0')}:
                    {String(countdown.seconds).padStart(2, '0')}
                    {countdown.days > 0 ? ` + ${countdown.days}d` : ''})
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>Exam Window Closed at 3:00 PM</span>
                </>
              )}
            </button>

            {phase !== 'open' && (
              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>Fill your candidate details now to be ready when the 11:30 AM window opens.</span>
                <button
                  type="button"
                  onClick={handleExaminerPreviewLaunch}
                  disabled={startingExam}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 font-semibold text-amber-800 hover:underline"
                >
                  <KeyRound className="h-3 w-3" aria-hidden="true" />
                  {examinerToken ? 'Examiner Preview Run' : 'Examiner Preview (PIN)'}
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Right: Quick PDF Report & Readiness Checklist */}
        <aside className="space-y-5 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-amber-300/90 bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/70 shadow-sm">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"
              aria-hidden="true"
            />
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-xs">
                  <FileDown className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Instant PDF Progress Download
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Immediately after submitting your AIBE XXII Mock Test, a one-click{' '}
                    <strong className="text-slate-900">Download Progress as PDF</strong> button lets
                    you save and share your complete score sheet, completion time, subject chart,
                    and Bare Act mistake rectification guide.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 rounded-xl border border-amber-200/80 bg-white/90 p-4 text-xs">
                <div className="font-bold tracking-wide text-amber-900 uppercase">
                  Pre-Exam Readiness
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-600">Candidate Details</span>
                  <span
                    className={`font-semibold ${detailsReady ? 'text-emerald-700' : 'text-amber-700'}`}
                  >
                    {detailsReady ? 'Ready' : 'Enter Name, Email & Phone'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-600">Paper Booklet</span>
                  <span className="font-mono font-semibold text-slate-900">
                    AIBE-XXI (Set A · 100 Qs)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600">Post-Exam Export</span>
                  <span className="font-semibold text-blue-800">1-Click PDF Progress Report</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
