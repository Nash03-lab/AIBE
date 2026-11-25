import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FileDown,
  Info,
  Quote,
  RefreshCw,
  RotateCcw,
  Search,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import type { ExamResultReport, QuestionReviewItem } from '../../shared/types';
import { RESULT_COMEBACK_QUOTES, RESULT_PASS_QUOTES } from '../data/quotes';
import { formatDurationVerbose, formatSubmittedAt } from '../utils/format';
import { downloadExamProgressPdf } from '../utils/pdfReport';
import { OrnamentalDivider } from './OrnamentalDivider';

interface ResultReportViewProps {
  report: ExamResultReport;
  isExaminerInspect?: boolean;
  onBackAction: () => void;
}

type ReviewFilter = 'incorrect' | 'unattempted' | 'correct' | 'withdrawn' | 'all';

function AccuracyRingGauge({
  percent,
  qualified,
}: {
  percent: number;
  qualified: boolean;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 92 92" aria-hidden="true">
        <circle
          cx="46"
          cy="46"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="8"
        />
        <circle
          cx="46"
          cy="46"
          r={radius}
          fill="none"
          stroke={qualified ? '#34d399' : '#fbbf24'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="font-mono text-lg font-bold tabular-nums">{percent}%</span>
        <span className="text-[10px] font-medium text-blue-100">Accuracy</span>
      </div>
    </div>
  );
}

function ResponseDonutGraphic({ report }: { report: ExamResultReport }) {
  const total = Math.max(1, report.review.length);
  const segments = [
    { label: 'Correct', count: report.correctCount, color: '#059669' },
    { label: 'Mistakes', count: report.incorrectCount, color: '#e11d48' },
    { label: 'Skipped', count: report.unattemptedCount, color: '#d97706' },
    ...(report.withdrawnCount > 0
      ? [{ label: 'Withdrawn', count: report.withdrawnCount, color: '#64748b' }]
      : []),
  ];

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 124 124" aria-hidden="true">
          <circle cx="62" cy="62" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
          {segments.map((seg) => {
            const len = (seg.count / total) * circumference;
            const dashArray = `${len} ${circumference - len}`;
            const dashOffset = -runningOffset;
            runningOffset += len;
            return (
              <circle
                key={seg.label}
                cx="62"
                cy="62"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
            {report.score}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            of {report.maxScore} Scored
          </span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 1000) / 10;
          return (
            <div key={seg.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  <span
                    className="h-2.5 w-2.5 rounded-xs"
                    style={{ backgroundColor: seg.color }}
                    aria-hidden="true"
                  />
                  {seg.label}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {seg.count} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: seg.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResultReportView({
  report,
  isExaminerInspect = false,
  onBackAction,
}: ResultReportViewProps) {
  const defaultFilter: ReviewFilter =
    report.incorrectCount > 0
      ? 'incorrect'
      : report.unattemptedCount > 0
        ? 'unattempted'
        : 'all';

  const [statusFilter, setStatusFilter] = useState<ReviewFilter>(defaultFilter);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [crestError, setCrestError] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const quotePool = report.qualifiedGeneral ? RESULT_PASS_QUOTES : RESULT_COMEBACK_QUOTES;
  const activeQuote = quotePool[quoteIdx % quotePool.length];

  const subjects = useMemo(
    () => Array.from(new Set(report.review.map((r) => r.subject))),
    [report.review],
  );

  const weakestSubjects = useMemo(() => {
    return [...report.subjectBreakdown]
      .filter((s) => s.incorrect > 0 || s.unattempted > 0)
      .sort((a, b) => {
        if (b.incorrect !== a.incorrect) return b.incorrect - a.incorrect;
        return a.accuracyPercent - b.accuracyPercent;
      })
      .slice(0, 3);
  }, [report.subjectBreakdown]);

  const sortedSubjectsForChart = useMemo(() => {
    return [...report.subjectBreakdown].sort((a, b) => a.accuracyPercent - b.accuracyPercent);
  }, [report.subjectBreakdown]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return report.review.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;
      if (q) {
        const hay =
          `${item.number} ${item.subject} ${item.statuteRef} ${item.question} ${item.rectification.principle} ${item.rectification.howToRectify}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [report.review, searchQuery, statusFilter, subjectFilter]);

  const renderStatusLabel = (item: QuestionReviewItem) => {
    if (item.status === 'correct') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Correct
        </span>
      );
    }
    if (item.status === 'incorrect') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Incorrect Mistake
        </span>
      );
    }
    if (item.status === 'unattempted') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Unattempted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
        <Info className="h-4 w-4" aria-hidden="true" />
        Withdrawn by BCI
      </span>
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Decorative Celebratory / Diagnostic Banner */}
      <section className="overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white shadow-md">
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${
            report.qualifiedGeneral
              ? 'from-emerald-400 via-teal-400 to-amber-400'
              : 'from-amber-400 via-orange-500 to-rose-500'
          }`}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {!crestError ? (
              <img
                src="/src/assets/images/crest_scales_emblem_1795450304802.jpg"
                alt="Nash Law judicial crest"
                referrerPolicy="no-referrer"
                onError={() => setCrestError(true)}
                className="hidden h-16 w-16 shrink-0 rounded-xl border border-amber-300/80 object-cover shadow-sm sm:block"
              />
            ) : (
              <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 sm:flex">
                <Award className="h-8 w-8" aria-hidden="true" />
              </span>
            )}

            <div>
              <p className="font-mono text-xs font-semibold tracking-wider text-amber-300 uppercase">
                {isExaminerInspect
                  ? 'Nash Law Examiner Inspection · Candidate Mistake Audit'
                  : 'Nash Law Post-Exam Evaluation & Rectification'}
              </p>
              <h1 className="text-balance mt-1.5 font-serif text-2xl font-bold text-white sm:text-3xl">
                {report.candidateName} — {report.examTitle}
              </h1>
              <p className="mt-1.5 text-sm text-blue-100">
                Completed in{' '}
                <span className="font-mono font-semibold text-amber-200">
                  {formatDurationVerbose(report.durationSeconds)}
                </span>{' '}
                · Submitted {formatSubmittedAt(report.submittedAt)}
              </p>
              {report.candidateDetails && (
                <p className="mt-1 text-xs text-amber-200/90">
                  {[
                    report.candidateDetails.email,
                    report.candidateDetails.phone,
                    report.candidateDetails.stateOrBarCouncil,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <AccuracyRingGauge
              percent={report.accuracyPercent}
              qualified={report.qualifiedGeneral}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => downloadExamProgressPdf(report)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition-all hover:brightness-105"
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Download PDF Progress
              </button>

              <button
                type="button"
                onClick={onBackAction}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
              >
                {isExaminerInspect ? (
                  <>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Leaderboard
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Take Another Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome-Tailored Motivational Quote Strip */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/70 p-4 shadow-xs sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Quote className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-serif text-sm font-semibold text-slate-900 sm:text-base">
                &ldquo;{activeQuote.text}&rdquo;
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                <strong className="text-slate-900">{activeQuote.author}</strong> · {activeQuote.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuoteIdx((prev) => prev + 1)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-50"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Another Quote
          </button>
        </div>
      </section>

      {/* Primary Colorful KPI Strip */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-700" aria-hidden="true" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Total Score
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-blue-950 tabular-nums">
                {report.score}
              </span>
              <span className="font-mono text-base text-slate-500 tabular-nums">
                / {report.maxScore}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              Accuracy:{' '}
              <span className="font-mono font-bold text-blue-800">{report.accuracyPercent}%</span>
              {report.withdrawnCount > 0 && ` · ${report.withdrawnCount} withdrawn excluded`}
            </p>
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-2xl border bg-white shadow-xs ${
            report.qualifiedGeneral ? 'border-emerald-200/90' : 'border-rose-200/90'
          }`}
        >
          <div
            className={`h-1 bg-gradient-to-r ${
              report.qualifiedGeneral
                ? 'from-emerald-500 to-teal-600'
                : 'from-rose-500 to-orange-500'
            }`}
            aria-hidden="true"
          />
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Qualifying Status
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              {report.qualifiedGeneral ? (
                <>
                  <CheckCircle2
                    className="h-6 w-6 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="font-serif text-xl font-bold text-emerald-800">Qualified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" aria-hidden="true" />
                  <span className="font-serif text-xl font-bold text-rose-800">Needs Review</span>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              AIBE general threshold: 45% ({Math.ceil(report.maxScore * 0.45)} / {report.maxScore})
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" aria-hidden="true" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Completion Time
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-amber-950 tabular-nums">
              {formatDurationVerbose(report.durationSeconds)}
            </div>
            <p className="mt-2 text-xs text-slate-600">Out of 3h 00m 00s allotted</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-teal-200/90 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-rose-500" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Response Breakdown
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-sm tabular-nums">
              <div className="rounded-lg bg-emerald-50 px-2 py-1.5 text-center">
                <dt className="font-sans text-[10px] font-semibold text-emerald-800">Correct</dt>
                <dd className="text-base font-bold text-emerald-700">{report.correctCount}</dd>
              </div>
              <div className="rounded-lg bg-rose-50 px-2 py-1.5 text-center">
                <dt className="font-sans text-[10px] font-semibold text-rose-800">Mistakes</dt>
                <dd className="text-base font-bold text-rose-700">{report.incorrectCount}</dd>
              </div>
              <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-center">
                <dt className="font-sans text-[10px] font-semibold text-amber-800">Skipped</dt>
                <dd className="text-base font-bold text-amber-700">{report.unattemptedCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Graphical Performance Analytics Dashboard (Donut + Interactive Subject Accuracy Bar Chart with 45% Benchmark) */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:col-span-5">
          <div
            className="h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-amber-500"
            aria-hidden="true"
          />
          <div className="p-5 sm:p-6">
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Visual Response Distribution
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Exact share of correct, incorrect, skipped &amp; withdrawn marks.
            </p>
            <div className="mt-5">
              <ResponseDonutGraphic report={report} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:col-span-7">
          <div
            className="h-1 bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500"
            aria-hidden="true"
          />
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  Subject Accuracy Chart
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Click any subject bar to filter its rectification notes below. Dashed line marks
                  the 45% Bar threshold.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-blue-800">
                45% Qualifying Line
              </span>
            </div>

            <div className="relative mt-4 space-y-2.5">
              {sortedSubjectsForChart.map((sub) => {
                const barColor =
                  sub.accuracyPercent >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : sub.accuracyPercent >= 45
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-rose-500 to-pink-600';

                return (
                  <button
                    key={sub.subject}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(sub.subject);
                      setStatusFilter(sub.incorrect > 0 ? 'incorrect' : 'all');
                      document
                        .getElementById('rectification-ledger')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group block w-full cursor-pointer text-left"
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-semibold text-slate-800 group-hover:text-blue-800">
                        {sub.subject}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-slate-700 tabular-nums">
                        {sub.correct}/{sub.totalValid} ({sub.accuracyPercent}%)
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${sub.accuracyPercent}%` }}
                      />
                      {/* 45% qualifying benchmark marker */}
                      <div
                        className="absolute inset-y-0 border-l-2 border-dashed border-slate-700/70"
                        style={{ left: '45%' }}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Priority Mistake Areas */}
      {weakestSubjects.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-xs">
          <div
            className="h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500"
            aria-hidden="true"
          />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-amber-600 text-white">
                <Wrench className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  Priority Mistake Areas &amp; How to Rectify
                </h2>
                <p className="text-xs text-slate-600">
                  Subjects ranked by highest errors/gaps. Click a card to inspect its statutory
                  rectification notes below.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
              {weakestSubjects.map((sub) => (
                <button
                  key={sub.subject}
                  type="button"
                  onClick={() => {
                    setSubjectFilter(sub.subject);
                    setStatusFilter(sub.incorrect > 0 ? 'incorrect' : 'unattempted');
                    document
                      .getElementById('rectification-ledger')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="cursor-pointer overflow-hidden rounded-xl border border-rose-200/70 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/40 text-left transition-all hover:-translate-y-0.5 hover:border-blue-700/50 hover:shadow-sm"
                >
                  <div className="h-1 bg-gradient-to-r from-rose-500 to-amber-500" aria-hidden="true" />
                  <div className="p-4">
                    <div className="text-sm font-bold text-slate-900">{sub.subject}</div>
                    <div className="mt-1.5 font-mono text-xs text-slate-600 tabular-nums">
                      <span className="font-bold text-rose-700">{sub.incorrect} wrong</span> ·{' '}
                      <span className="font-bold text-amber-700">{sub.unattempted} skipped</span> ·{' '}
                      <span>{sub.accuracyPercent}% accuracy</span>
                    </div>
                    <div className="mt-2.5 text-xs font-semibold text-blue-800">
                      Inspect {sub.subject} mistakes →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subject-Wise Performance Breakdown with Colorful Mastery Bars */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div
          className="h-1 bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-500"
          aria-hidden="true"
        />
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Subject-Wise Performance Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <th className="px-5 py-3">Subject</th>
                <th className="px-4 py-3 text-right">Valid Qs</th>
                <th className="px-4 py-3 text-right">Correct</th>
                <th className="px-4 py-3 text-right">Mistakes</th>
                <th className="px-4 py-3 text-right">Skipped</th>
                <th className="px-5 py-3 text-right">Mastery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.subjectBreakdown.map((row) => {
                const barColor =
                  row.accuracyPercent >= 70
                    ? 'bg-emerald-500'
                    : row.accuracyPercent >= 45
                      ? 'bg-amber-500'
                      : 'bg-rose-500';
                return (
                  <tr key={row.subject} className="hover:bg-blue-50/30">
                    <td className="px-5 py-3 font-semibold text-slate-900">{row.subject}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums">
                      {row.totalValid}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {row.correct}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                      {row.incorrect}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-amber-700 tabular-nums">
                      {row.unattempted}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${row.accuracyPercent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {row.accuracyPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <OrnamentalDivider label="Detailed Question Audit & Rectification" />

      {/* Question-by-Question Mistake Rectification Ledger */}
      <section id="rectification-ledger">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Answer Review &amp; Mistake Rectification Guide
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Compare every selected choice against the Official Final Key with Bare Act steps to
              rectify each mistake.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter questions">
            {(
              [
                { id: 'incorrect', label: `Mistakes (${report.incorrectCount})` },
                { id: 'unattempted', label: `Unattempted (${report.unattemptedCount})` },
                { id: 'correct', label: `Correct (${report.correctCount})` },
                ...(report.withdrawnCount > 0
                  ? [{ id: 'withdrawn' as const, label: `Withdrawn (${report.withdrawnCount})` }]
                  : []),
                { id: 'all', label: `All (${report.review.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'border-blue-800 bg-gradient-to-r from-blue-800 to-indigo-800 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              aria-label="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search section, Q#, keyword..."
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="mt-5 space-y-5">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No questions match the selected filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSubjectFilter('all');
                  setSearchQuery('');
                }}
                className="mt-3 cursor-pointer text-xs font-semibold text-blue-800 underline"
              >
                Reset filters to view all {report.review.length} questions
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const topStripe =
                item.status === 'incorrect'
                  ? 'from-rose-500 to-orange-500'
                  : item.status === 'unattempted'
                    ? 'from-amber-400 to-orange-500'
                    : item.status === 'correct'
                      ? 'from-emerald-500 to-teal-600'
                      : 'from-slate-400 to-slate-500';

              return (
                <article
                  key={item.number}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
                >
                  <div className={`h-1 w-full bg-gradient-to-r ${topStripe}`} aria-hidden="true" />

                  {/* Question Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:px-6">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-mono text-sm font-bold text-blue-950 tabular-nums">
                        Q{item.number}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs font-bold text-teal-800">{item.subject}</span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-xs text-slate-600">{item.statuteRef}</span>
                    </div>

                    {renderStatusLabel(item)}
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Question Stem */}
                    <div className="space-y-1.5 text-sm leading-relaxed font-medium text-slate-900 sm:text-[15px]">
                      {item.question.split('\n').map((line, i) => (
                        <p key={i} className={line.trim().startsWith('(') ? 'pl-3' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Choice Comparison Strip */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-100 py-2.5 text-xs">
                      <div>
                        <span className="text-slate-500">
                          {isExaminerInspect ? "Candidate's Answer: " : 'Your Answer: '}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            item.status === 'correct'
                              ? 'text-emerald-700'
                              : item.status === 'incorrect'
                                ? 'text-rose-700'
                                : 'text-amber-800'
                          }`}
                        >
                          {item.selectedOption ? `(${item.selectedOption})` : 'Not Attempted'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">Official Final Key: </span>
                        <span className="font-mono font-bold text-emerald-800">
                          {item.withdrawn
                            ? 'Withdrawn (Not Scored)'
                            : item.correctAnswers.map((a) => `(${a})`).join(' or ')}
                        </span>
                      </div>
                    </div>

                    {/* 4 Options with Explicit Icons */}
                    <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      {item.options.map((opt) => {
                        const isCorrectOpt =
                          !item.withdrawn && item.correctAnswers.includes(opt.label);
                        const isUserPicked = item.selectedOption === opt.label;
                        const isWrongPick = isUserPicked && !isCorrectOpt && !item.withdrawn;

                        let boxClass = 'border-slate-200 bg-white text-slate-700';
                        if (isCorrectOpt) {
                          boxClass =
                            'border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50/60 text-emerald-950 font-medium';
                        } else if (isWrongPick) {
                          boxClass =
                            'border-rose-400 bg-gradient-to-r from-rose-50 to-orange-50/50 text-rose-950 font-medium';
                        }

                        return (
                          <div
                            key={opt.label}
                            className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm ${boxClass}`}
                          >
                            <span className="mt-0.5 font-mono font-bold">({opt.label})</span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrectOpt && (
                              <Check
                                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                                aria-label="Official Answer"
                              />
                            )}
                            {isWrongPick && (
                              <X
                                className="mt-0.5 h-4 w-4 shrink-0 text-rose-700"
                                aria-label="Wrong Selection"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Structured Mistake Rectification Panel */}
                    <div className="mt-5 overflow-hidden rounded-xl border border-indigo-200/80 bg-gradient-to-br from-blue-50/60 via-white to-amber-50/50 p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-blue-900 uppercase">
                        <BookOpen className="h-4 w-4 text-indigo-700" aria-hidden="true" />
                        <span>
                          {item.status === 'incorrect' || item.status === 'unattempted'
                            ? 'How to Rectify This Mistake'
                            : 'Governing Principle & Study Note'}
                        </span>
                      </div>

                      <dl className="mt-3 space-y-3 text-sm leading-relaxed">
                        <div>
                          <dt className="text-xs font-bold text-indigo-900 uppercase">
                            Legal Principle
                          </dt>
                          <dd className="mt-0.5 text-slate-800">{item.rectification.principle}</dd>
                        </div>
                        {!item.withdrawn && (
                          <div>
                            <dt className="text-xs font-bold text-rose-800 uppercase">
                              Why This Mistake Happens
                            </dt>
                            <dd className="mt-0.5 text-slate-700">
                              {item.rectification.whyMistakeHappens}
                            </dd>
                          </div>
                        )}
                        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-2.5">
                          <dt className="text-xs font-bold text-emerald-900 uppercase">
                            How to Rectify
                          </dt>
                          <dd className="mt-0.5 font-medium text-emerald-950">
                            {item.rectification.howToRectify}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
