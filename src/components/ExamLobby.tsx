import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  FileCheck2,
  Lock,
  Quote,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type { Aibe22ScheduleInfo, ExamId, ExamSummary } from '../../shared/types';
import { LOBBY_QUOTES } from '../data/quotes';
import { OrnamentalDivider } from './OrnamentalDivider';

interface ExamLobbyProps {
  exams: ExamSummary[];
  loadingExams: boolean;
  selectedExamId: ExamId;
  candidateName: string;
  startingExam: boolean;
  startError: string | null;
  aibe22Schedule: Aibe22ScheduleInfo | null;
  onSelectExam: (id: ExamId) => void;
  onChangeName: (name: string) => void;
  onStartExam: () => void;
  onOpenAibe22: () => void;
}

const PAPER_PALETTES: Record<
  ExamId,
  {
    topBar: string;
    activeRing: string;
    accentText: string;
    radioBg: string;
    ringStroke: string;
    ringTrack: string;
    mixSegments: string[];
  }
> = {
  'aibe-21': {
    topBar: 'from-blue-700 via-indigo-600 to-cyan-500',
    activeRing:
      'border-blue-700 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 ring-1 ring-blue-700 shadow-sm',
    accentText: 'text-blue-800',
    radioBg: 'border-blue-800 bg-blue-800',
    ringStroke: '#1d4ed8',
    ringTrack: '#dbeafe',
    mixSegments: ['#1e40af', '#0d9488', '#6366f1', '#d97706', '#0284c7'],
  },
  'aibe-20': {
    topBar: 'from-emerald-600 via-teal-600 to-cyan-500',
    activeRing:
      'border-teal-700 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 ring-1 ring-teal-700 shadow-sm',
    accentText: 'text-teal-800',
    radioBg: 'border-teal-700 bg-teal-700',
    ringStroke: '#0f766e',
    ringTrack: '#ccfbf1',
    mixSegments: ['#0f766e', '#059669', '#2563eb', '#f59e0b', '#0891b2'],
  },
  'aibe-19': {
    topBar: 'from-amber-500 via-orange-500 to-rose-500',
    activeRing:
      'border-amber-600 bg-gradient-to-br from-white via-amber-50/45 to-orange-50/45 ring-1 ring-amber-600 shadow-sm',
    accentText: 'text-amber-800',
    radioBg: 'border-amber-600 bg-amber-600',
    ringStroke: '#d97706',
    ringTrack: '#fef3c7',
    mixSegments: ['#d97706', '#ea580c', '#e11d48', '#2563eb', '#0d9488'],
  },
};

function ScoredMiniRing({
  valid,
  total,
  strokeColor,
  trackColor,
}: {
  valid: number;
  total: number;
  strokeColor: string;
  trackColor: string;
}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? valid / total : 1;
  const offset = c - pct * c;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" stroke={trackColor} strokeWidth="4.5" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold text-slate-900 tabular-nums">
        {valid}
      </span>
    </div>
  );
}

export function ExamLobby({
  exams,
  loadingExams,
  selectedExamId,
  candidateName,
  startingExam,
  startError,
  aibe22Schedule,
  onSelectExam,
  onChangeName,
  onStartExam,
  onOpenAibe22,
}: ExamLobbyProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [heroImgError, setHeroImgError] = useState(false);
  const [crestImgError, setCrestImgError] = useState(false);
  const [studyImgError, setStudyImgError] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const selectedExam = exams.find((e) => e.id === selectedExamId) ?? exams[0];
  const trimmedName = candidateName.trim();
  const isNameValid = trimmedName.length >= 2;
  const activeQuote = LOBBY_QUOTES[quoteIdx % LOBBY_QUOTES.length];

  const aibe22Status = !aibe22Schedule
    ? { label: 'Starts Tomorrow · 11:30 AM – 3:00 PM', clock: '' }
    : nowMs < aibe22Schedule.startTimestampMs
      ? (() => {
          const sec = Math.max(0, Math.floor((aibe22Schedule.startTimestampMs - nowMs) / 1000));
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          return {
            label: 'Starts Tomorrow 11:30 AM · Closes 3:00 PM',
            clock: `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`,
          };
        })()
      : nowMs < aibe22Schedule.endTimestampMs
        ? (() => {
            const sec = Math.max(0, Math.floor((aibe22Schedule.endTimestampMs - nowMs) / 1000));
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            return {
              label: 'LIVE NOW · Closes 3:00 PM',
              clock: `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s left`,
            };
          })()
        : { label: 'Exam Window Closed at 3:00 PM', clock: 'Closed' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      nameInputRef.current?.focus();
    }
    onStartExam();
  };

  const handleCycleQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % LOBBY_QUOTES.length);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Separate Golden-Themed Icon Showcase: AIBE XXII mock test */}
      <section className="mb-7">
        <button
          type="button"
          onClick={onOpenAibe22}
          className="group relative flex w-full cursor-pointer flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-950 via-yellow-950 to-slate-950 p-5 text-left text-white shadow-lg transition-all hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-xl sm:flex-row sm:items-center sm:px-7 sm:py-6"
        >
          <div
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200"
            aria-hidden="true"
          />
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Golden Medallion Icon */}
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-yellow-300/80 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-amber-950 shadow-md transition-transform group-hover:scale-105">
              <Crown className="h-8 w-8" aria-hidden="true" />
            </span>

            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-yellow-300 uppercase">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Golden Edition · Scheduled Live Mock Portal</span>
              </div>
              <h2 className="mt-0.5 font-serif text-2xl font-bold text-amber-100 sm:text-3xl">
                AIBE XXII mock test
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-amber-100/90 sm:text-sm">
                <span className="inline-flex items-center gap-1 font-semibold text-yellow-200">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {aibe22Status.label}
                </span>
                <span aria-hidden="true">·</span>
                <span>AIBE-XXI (Set Code-A) Paper</span>
                <span aria-hidden="true">·</span>
                <span>Instant PDF Progress Download</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
            {aibe22Status.clock && (
              <div className="rounded-xl border border-amber-300/45 bg-black/40 px-3.5 py-2 text-right">
                <div className="text-[10px] font-semibold tracking-wider text-amber-300 uppercase">
                  Timer
                </div>
                <div className="font-mono text-sm font-bold text-yellow-200 tabular-nums">
                  {aibe22Status.clock}
                </div>
              </div>
            )}
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm transition-all group-hover:brightness-105 sm:text-sm">
              Enter Mock Portal
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </button>
      </section>

      {/* Grand Illustrated Hero Showcase + Candidate Check-In Split */}
      <section className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Colorful Illustrated Judicial Pavilion Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-300/70 bg-slate-900 shadow-md lg:col-span-7">
          {!heroImgError ? (
            <img
              src="/src/assets/images/hero_bar_pavilion_1795450305022.jpg"
              alt="Sunlit Indian judicial pavilion with brass scales of justice and colourful bound law volumes"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="h-64 w-full object-cover sm:h-80 lg:h-full lg:min-h-[370px]"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-900 to-amber-800 sm:h-80 lg:h-full lg:min-h-[370px]">
              <Scale className="h-20 w-20 text-amber-300/60" aria-hidden="true" />
            </div>
          )}

          {/* Measured contrast scrim */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/55 to-blue-950/20"
            aria-hidden="true"
          />

          {/* Top colorful filigree accent strip */}
          <div
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-teal-400 to-blue-500"
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wider text-amber-300">
              Nash Law Portal · Official Set Code-A Papers
            </p>
            <h1 className="text-balance mt-2 font-serif text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl">
              Official AIBE Mock Examination &amp; Mistake Rectification
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Attempt complete 100-question official papers under realistic 3-hour exam conditions.
              Your total score, exact completion time, and statute-backed rectification guide unlock
              once you submit.
            </p>
          </div>
        </div>

        {/* Right: Ornate Candidate Check-In Card (Name Only) */}
        <aside className="flex lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-md"
          >
            <div>
              <div
                className="h-1.5 w-full bg-gradient-to-r from-blue-800 via-indigo-700 to-amber-500"
                aria-hidden="true"
              />
              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-3.5 border-b border-amber-100 pb-4">
                  {!crestImgError ? (
                    <img
                      src="/src/assets/images/crest_scales_emblem_1795450304802.jpg"
                      alt="Nash Law scales of justice circular crest"
                      referrerPolicy="no-referrer"
                      onError={() => setCrestImgError(true)}
                      className="h-12 w-12 shrink-0 rounded-xl border border-amber-300 object-cover shadow-xs"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-800 to-indigo-900 text-amber-300">
                      <UserCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                  <div>
                    <h2 className="font-serif text-xl font-bold text-slate-900">
                      Candidate Registration
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      Name only · No Roll Number needed
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <label
                      htmlFor="candidate-name"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Candidate Name <span className="text-rose-600">*</span>
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Enter your full name to begin and record your exact completion time.
                    </p>
                    <input
                      ref={nameInputRef}
                      id="candidate-name"
                      type="text"
                      value={candidateName}
                      onChange={(e) => onChangeName(e.target.value)}
                      maxLength={80}
                      autoComplete="name"
                      placeholder="e.g., Ananya Sharma"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-amber-50/30 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-700/20 focus:outline-none"
                    />
                  </div>

                  {selectedExam && (
                    <div className="overflow-hidden rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-amber-50/60 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                        <span>Selected Booklet</span>
                        <span className="font-mono text-amber-800">{selectedExam.setCode}</span>
                      </div>
                      <div className="mt-1 font-serif text-base font-bold text-slate-900">
                        {selectedExam.title}
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-blue-200/60 pt-3 text-xs">
                        <div>
                          <dt className="text-slate-500">Questions</dt>
                          <dd className="mt-0.5 font-mono font-bold text-blue-950 tabular-nums">
                            {selectedExam.totalQuestions} MCQs
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Scored Marks</dt>
                          <dd className="mt-0.5 font-mono font-bold text-emerald-800 tabular-nums">
                            {selectedExam.validQuestions}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Duration</dt>
                          <dd className="mt-0.5 font-mono font-bold text-amber-800 tabular-nums">
                            180 min
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {startError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
                    >
                      <ShieldAlert
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                        aria-hidden="true"
                      />
                      <span>{startError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:px-7">
              <button
                type="submit"
                disabled={startingExam || loadingExams}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600"
              >
                <span>{startingExam ? 'Preparing Question Booklet...' : 'Begin Examination'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </aside>
      </section>

      {/* Motivational Counsel Quote Showcase + Illustrated Judicial Laurel Graphic */}
      <section className="mt-7 overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-sm">
        <div
          className="h-1 w-full bg-gradient-to-r from-amber-400 via-rose-400 to-teal-400"
          aria-hidden="true"
        />
        <div className="grid grid-cols-1 items-center gap-6 p-6 sm:p-7 lg:grid-cols-12">
          <div className="flex items-start gap-4 lg:col-span-9">
            <div className="hidden shrink-0 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 sm:block">
              <svg
                width="52"
                height="52"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M32 10V52M18 52H46M14 22H50"
                  stroke="#FBBF24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="32" cy="10" r="3.5" fill="#FDE68A" />
                <path
                  d="M14 22L8 36C8 39.3137 10.6863 42 14 42C17.3137 42 20 39.3137 20 36L14 22Z"
                  fill="#38BDF8"
                  fillOpacity="0.25"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M50 22L44 36C44 39.3137 46.6863 42 50 42C53.3137 42 56 39.3137 56 36L50 22Z"
                  fill="#34D399"
                  fillOpacity="0.25"
                  stroke="#34D399"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-300 uppercase">
                <Quote className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Nash Law · Counsel Inspiration</span>
              </div>
              <blockquote className="mt-2 font-serif text-lg leading-relaxed font-semibold text-white sm:text-xl">
                &ldquo;{activeQuote.text}&rdquo;
              </blockquote>
              <p className="mt-2 text-xs text-blue-200">
                <strong className="font-semibold text-amber-200">{activeQuote.author}</strong> ·{' '}
                {activeQuote.role}
              </p>
            </div>
          </div>

          <div className="flex justify-start lg:col-span-3 lg:justify-end">
            <button
              type="button"
              onClick={handleCycleQuote}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/50 bg-white/10 px-4 py-2 text-xs font-semibold text-amber-100 transition-colors hover:bg-white/20 whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Inspire Another
            </button>
          </div>
        </div>
      </section>

      {/* Graphical 3-Step Exam Workflow Diagram */}
      <section
        aria-label="Exam Workflow Diagram"
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            How Your Nash Law Attempt Flows
          </h2>
          <span className="font-mono text-xs text-slate-500">
            3 Steps · Blind Exam -&gt; Instant Diagnostics
          </span>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-11">
          {/* Step 1 */}
          <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white p-4 md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-800">01. Check In</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">Enter Name &amp; Pick Set A</p>
            <p className="mt-1 text-xs text-slate-600">
              No roll number needed. Select AIBE-XXI, XX, or XIX.
            </p>
          </div>

          {/* Connector 1 -> 2 */}
          <div className="hidden items-center justify-center md:flex md:col-span-1" aria-hidden="true">
            <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
              <path
                d="M2 10H38M38 10L31 4M38 10L31 16"
                stroke="#1d4ed8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 to-white p-4 md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-800">02. Timed Attempt</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">Answer 100 Blind MCQs</p>
            <p className="mt-1 text-xs text-slate-600">
              Flag questions for review across the 1–100 palette.
            </p>
          </div>

          {/* Connector 2 -> 3 */}
          <div className="hidden items-center justify-center md:flex md:col-span-1" aria-hidden="true">
            <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
              <path
                d="M2 10H38M38 10L31 4M38 10L31 16"
                stroke="#0d9488"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white p-4 md:col-span-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-800">03. Rectify</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Award className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">Result &amp; Bare Act Fixes</p>
            <p className="mt-1 text-xs text-slate-600">
              See final score, completion time &amp; mistake rectification.
            </p>
          </div>
        </div>
      </section>

      <OrnamentalDivider label="Official Question Booklets" />

      {/* 3 Colorful Graphical AIBE Examination Paper Cards */}
      <section aria-labelledby="select-paper-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2
              id="select-paper-heading"
              className="font-serif text-2xl font-bold text-slate-900"
            >
              Select Official Examination Paper
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Choose from the three complete official AIBE papers calibrated to Set Code-A Final
              Answer Keys.
            </p>
          </div>
          <span className="font-mono text-xs font-medium text-slate-600">
            3 Papers · 300 Official Questions · Zero Negative Marking
          </span>
        </div>

        {loadingExams ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
            role="radiogroup"
            aria-label="Select AIBE Question Paper"
          >
            {exams.map((exam) => {
              const isSelected = exam.id === selectedExamId;
              const palette = PAPER_PALETTES[exam.id] ?? PAPER_PALETTES['aibe-21'];
              return (
                <button
                  key={exam.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectExam(exam.id)}
                  className={`flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border text-left transition-all ${
                    isSelected
                      ? palette.activeRing
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="w-full">
                    <div
                      className={`h-1.5 w-full bg-gradient-to-r ${palette.topBar}`}
                      aria-hidden="true"
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected ? `${palette.radioBg} text-white` : 'border-slate-400 bg-white'
                            }`}
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          <div>
                            <span className="font-serif text-lg font-bold text-slate-900">
                              {exam.title}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-slate-600">
                              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                {exam.validQuestions}/{exam.totalQuestions} Scored
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{exam.durationMinutes} min</span>
                              {exam.withdrawnQuestions > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-800">
                                    {exam.withdrawnQuestions} Withdrawn
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <ScoredMiniRing
                          valid={exam.validQuestions}
                          total={exam.totalQuestions}
                          strokeColor={palette.ringStroke}
                          trackColor={palette.ringTrack}
                        />
                      </div>

                      {/* Graphical Subject Distribution Spectrum Bar */}
                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                          <span>{exam.subjects.length} Legal Subjects Covered</span>
                          <span className={`font-mono font-bold ${palette.accentText}`}>
                            {isSelected ? 'Active Booklet' : 'Select Paper'}
                          </span>
                        </div>
                        <div
                          className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
                          aria-hidden="true"
                        >
                          {palette.mixSegments.map((color, segIdx) => (
                            <div
                              key={segIdx}
                              style={{
                                width: `${100 / palette.mixSegments.length}%`,
                                backgroundColor: color,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        {exam.subjects.slice(0, 5).join(' · ')}
                        {exam.subjects.length > 5 ? ` · +${exam.subjects.length - 5} more` : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <OrnamentalDivider label="Evaluation & Study Guide" />

      {/* Format & Evaluation Protocol with Bespoke Editorial Illustration */}
      <section
        id="exam-rules"
        className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
          <div className="relative overflow-hidden bg-amber-50 lg:col-span-5">
            {!studyImgError ? (
              <img
                src="/src/assets/images/rectification_study_art_1795450304916.jpg"
                alt="Editorial illustration of an open Indian Bare Act volume with colorful subject bookmark ribbons and brass fountain pen"
                referrerPolicy="no-referrer"
                onError={() => setStudyImgError(true)}
                className="h-60 w-full object-cover lg:h-full"
              />
            ) : (
              <div className="flex h-60 w-full items-center justify-center bg-gradient-to-br from-amber-100 via-teal-50 to-blue-100 lg:h-full">
                <BookOpen className="h-16 w-16 text-blue-900/50" aria-hidden="true" />
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="font-mono text-xs font-semibold text-amber-300">
                Post-Submission Diagnostics
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold">
                Examination Format &amp; Evaluation Protocol
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:col-span-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs">
                  <Clock className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">3-Hour Timed Session</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  100 MCQs with 1 mark per valid question and zero negative marking. Exact completion
                  time is captured automatically on submission.
                </p>
              </div>

              <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs">
                  <FileCheck2 className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  End-Only Result Disclosure
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Answers remain hidden throughout the test. Total score, subject mastery, and 45%
                  qualifying status unlock at the end.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
                  <Award className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Mistake Rectification Guide
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Every mistake or skipped question reveals the governing Bare Act section, why the
                  error occurs, and how to rectify it.
                </p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-pink-700 text-white shadow-xs">
                  <Lock className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Private Examiner Leaderboard
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Attendee rankings, completion times, and per-candidate mistake inspections are
                  locked exclusively behind your Examiner PIN.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-950">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
              <span>
                Official Final Keys enforced: AIBE-XXI scored out of 100 (dual key Q2: C/D);
                AIBE-XX scored out of 95 (5 withdrawn; dual keys Q54 &amp; Q91); AIBE-XIX scored out
                of 93 (7 withdrawn; dual key Q75: A/C).
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
