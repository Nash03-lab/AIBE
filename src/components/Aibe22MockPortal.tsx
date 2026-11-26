import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  FileDown,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type { CandidateDetails } from '../../shared/types';

interface Aibe22MockPortalProps {
  candidateDetails: CandidateDetails;
  onChangeDetails: (details: CandidateDetails) => void;
  startingExam: boolean;
  startError: string | null;
  onStartAibe22Exam: () => void;
  onBackLobby: () => void;
}

export function Aibe22MockPortal({
  candidateDetails,
  onChangeDetails,
  startingExam,
  startError,
  onStartAibe22Exam,
  onBackLobby,
}: Aibe22MockPortalProps) {
  const [localError, setLocalError] = useState<string | null>(null);

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
    onStartAibe22Exam();
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
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#0B1437]" aria-hidden="true" />
          Back to Nash Law Exam Papers
        </button>
      </div>

      {/* Golden Sovereign Hero Banner */}
      <section className="overflow-hidden rounded-3xl border border-amber-400/70 bg-gradient-to-br from-[#0B1437] via-[#131C3A] to-[#1D1508] text-white shadow-xl">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
          {/* Left Identity */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-amber-300 uppercase">
              <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <span>Nash Law Golden Edition · Shuffled 6-Paper Mock Exam</span>
            </div>

            <h1 className="text-balance mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AIBE XXII Mock Test
            </h1>

            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Full-length 100-MCQ examination drawing a freshly{' '}
              <strong className="font-bold text-amber-200">
                shuffled mix from all 6 booklets
              </strong>{' '}
              (Mock Tests 1–3 &amp; Past Year Papers AIBE-XXI, XX &amp; XIX). Enter your candidate
              details below to begin anytime and download your PDF Progress &amp; Mistakes Sheet
              upon submission.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Question Mix
                </div>
                <div className="mt-1 text-xs font-bold text-emerald-300">
                  Shuffled 6-Paper Deck
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Exam Duration
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-amber-100">
                  180 Mins (Open Anytime)
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Pool Coverage
                </div>
                <div className="mt-1 text-xs font-bold text-white">Mocks 1–3 &amp; AIBE 19–21</div>
              </div>
            </div>
          </div>

          {/* Right Open Status Summary */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-amber-300/40 bg-black/30 p-5 text-center shadow-inner sm:p-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-300 uppercase">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Shuffled Mock Portal Open
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-950/75 px-2 py-3">
                  <div className="font-mono text-2xl font-bold text-amber-300 tabular-nums">
                    100
                  </div>
                  <div className="mt-1 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                    Shuffled Qs
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/75 px-2 py-3">
                  <div className="font-mono text-2xl font-bold text-amber-300 tabular-nums">6</div>
                  <div className="mt-1 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                    Papers Mixed
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/75 px-2 py-3">
                  <div className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">
                    0
                  </div>
                  <div className="mt-1 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                    Neg. Mark
                  </div>
                </div>
              </div>
              <p className="mt-3.5 text-xs text-slate-300">
                Every launch deals a fresh{' '}
                <strong className="text-amber-200">100-question shuffled deck</strong> calibrated to
                verified Final Answer Keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Candidate Details + Quick PDF Progress Overview */}
      <section className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
        {/* Left: Candidate Details & Launch Exam */}
        <form
          onSubmit={handleBeginClick}
          className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:col-span-7"
        >
          <div
            className="h-1.5 w-full bg-gradient-to-r from-[#0B1437] via-amber-500 to-teal-700"
            aria-hidden="true"
          />

          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1437] to-indigo-900 text-amber-300 shadow-xs">
                <UserCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  AIBE XXII Candidate Details
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  No roll number needed · Included on your leaderboard &amp; downloadable PDF
                  mistakes sheet
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
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1437] focus:bg-white focus:ring-2 focus:ring-indigo-900/15 focus:outline-none"
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
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1437] focus:bg-white focus:ring-2 focus:ring-indigo-900/15 focus:outline-none"
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
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1437] focus:bg-white focus:ring-2 focus:ring-indigo-900/15 focus:outline-none"
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
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B1437] focus:bg-white focus:ring-2 focus:ring-indigo-900/15 focus:outline-none"
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

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold">
                  <Award className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  Exam Rules · Shuffled 6-Paper Mock Deck
                </div>
                <p className="mt-1 leading-relaxed text-amber-900/90">
                  100 freshly shuffled MCQs sampled across Mock Tests 1–3 and Past Year Papers
                  (AIBE-XXI, XX &amp; XIX) · Zero negative marking · 180-minute exam timer.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-7">
            <button
              type="submit"
              disabled={startingExam}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500"
            >
              <span>
                {startingExam ? 'Shuffling 100 Questions...' : 'Begin Shuffled AIBE XXII Mock'}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        {/* Right: Quick PDF Report & Readiness Checklist */}
        <aside className="space-y-5 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"
              aria-hidden="true"
            />
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs">
                  <FileDown className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Instant PDF Mistakes &amp; Progress Report
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    After submitting your attempt, download your complete{' '}
                    <strong className="text-slate-900">Mistakes PDF</strong> and{' '}
                    <strong className="text-slate-900">Progress Report</strong> with exact Bare Act
                    rectification steps for every missed item.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs">
                <div className="font-bold tracking-wide text-[#0B1437] uppercase">
                  Pre-Exam Readiness
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 py-1.5">
                  <span className="text-slate-600">Candidate Details</span>
                  <span
                    className={`font-semibold ${detailsReady ? 'text-emerald-700' : 'text-amber-700'}`}
                  >
                    {detailsReady ? 'Ready' : 'Enter Name, Email & Phone'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/80 py-1.5">
                  <span className="text-slate-600">Question Deck</span>
                  <span className="font-mono font-semibold text-slate-900">
                    100 Shuffled (6 Papers)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600">Post-Exam Export</span>
                  <span className="font-semibold text-[#0B1437]">
                    Mistakes PDF &amp; Progress PDF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
