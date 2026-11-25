import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Flag,
  Quote,
  RefreshCw,
  Send,
} from 'lucide-react';
import type { OptionLetter, PublicExamPaper } from '../../shared/types';
import { EXAM_FOCUS_QUOTES } from '../data/quotes';
import { formatCountdownClock } from '../utils/format';

interface ExamWorkspaceProps {
  paper: PublicExamPaper;
  candidateName: string;
  submitting: boolean;
  submitError: string | null;
  onSubmitExam: (answers: Record<string, OptionLetter>, durationSeconds: number) => void;
}

type PaletteFilter = 'all' | 'unanswered' | 'marked';

export function ExamWorkspace({
  paper,
  candidateName,
  submitting,
  submitError,
  onSubmitExam,
}: ExamWorkspaceProps) {
  const totalSecondsLimit = paper.durationMinutes * 60;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionLetter>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [paletteFilter, setPaletteFilter] = useState<PaletteFilter>('all');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [quoteOffset, setQuoteOffset] = useState(0);

  const startedAtRef = useRef<number>(Date.now());
  const autoSubmittedRef = useRef(false);
  const effectiveDurationLimit = paper.windowClosesAtMs
    ? Math.max(
        1,
        Math.min(
          totalSecondsLimit,
          Math.floor((paper.windowClosesAtMs - startedAtRef.current) / 1000),
        ),
      )
    : totalSecondsLimit;

  const currentQuestion = paper.questions[currentIndex];
  const currentKey = String(currentQuestion.number);
  const selectedOption = answers[currentKey] ?? null;
  const isCurrentMarked = Boolean(marked[currentQuestion.number]);

  const remainingSeconds = Math.max(0, effectiveDurationLimit - elapsedSeconds);
  const activeFocusQuote =
    EXAM_FOCUS_QUOTES[(Math.floor(currentIndex / 10) + quoteOffset) % EXAM_FOCUS_QUOTES.length];

  const triggerFinalSubmit = useCallback(() => {
    if (submitting) return;
    const actualElapsed = Math.min(
      effectiveDurationLimit,
      Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
    );
    onSubmitExam(answers, actualElapsed);
  }, [answers, effectiveDurationLimit, onSubmitExam, submitting]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(secs);
      if (secs >= effectiveDurationLimit && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        onSubmitExam(answers, effectiveDurationLimit);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [answers, effectiveDurationLimit, onSubmitExam]);

  const handleSelectOption = useCallback(
    (option: OptionLetter) => {
      setAnswers((prev) => ({ ...prev, [currentKey]: option }));
    },
    [currentKey],
  );

  const handleClearOption = useCallback(() => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentKey];
      return next;
    });
  }, [currentKey]);

  const handleToggleMark = useCallback(() => {
    const qNum = currentQuestion.number;
    setMarked((prev) => ({ ...prev, [qNum]: !prev[qNum] }));
  }, [currentQuestion.number]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((idx) => Math.min(paper.questions.length - 1, idx + 1));
  }, [paper.questions.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || submitting) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const map: Record<string, OptionLetter> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        handleSelectOption(map[e.key]);
      } else if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
        handleSelectOption(e.key.toUpperCase() as OptionLetter);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSelectOption, showSubmitModal, submitting]);

  const stats = useMemo(() => {
    let answeredCount = 0;
    let markedCount = 0;
    let markedOnlyCount = 0;
    for (const q of paper.questions) {
      const isAns = Boolean(answers[String(q.number)]);
      const isMrk = Boolean(marked[q.number]);
      if (isAns) answeredCount += 1;
      if (isMrk) markedCount += 1;
      if (isMrk && !isAns) markedOnlyCount += 1;
    }
    const total = paper.questions.length;
    const pureSkipped = Math.max(0, total - answeredCount - markedOnlyCount);
    return {
      answeredCount,
      markedCount,
      unansweredCount: total - answeredCount,
      completionPct: Math.round((answeredCount / total) * 100),
      answeredPct: (answeredCount / total) * 100,
      markedOnlyPct: (markedOnlyCount / total) * 100,
      pureSkippedPct: (pureSkipped / total) * 100,
    };
  }, [answers, marked, paper.questions]);

  const filteredQuestions = useMemo(() => {
    return paper.questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => {
        if (paletteFilter === 'unanswered') return !answers[String(q.number)];
        if (paletteFilter === 'marked') return Boolean(marked[q.number]);
        return true;
      });
  }, [answers, marked, paletteFilter, paper.questions]);

  const isTimeLow = remainingSeconds <= 600;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Royal Sapphire & Gold Examination Control Sub-bar */}
      <div className="border-b border-amber-400/40 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-serif text-base font-bold text-amber-300">{paper.title}</span>
              <span className="text-blue-400" aria-hidden="true">
                ·
              </span>
              <span className="truncate text-sm text-blue-100">
                Candidate: <strong className="font-semibold text-white">{candidateName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-blue-700/70 bg-slate-900/70 px-3 py-1.5">
              <Clock
                className={`h-4 w-4 ${isTimeLow ? 'text-amber-400' : 'text-teal-300'}`}
                aria-hidden="true"
              />
              <div className="text-right">
                <div className="text-[10px] leading-none tracking-wider text-blue-200 uppercase">
                  Remaining
                </div>
                <div
                  className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
                    isTimeLow ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {formatCountdownClock(remainingSeconds)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:brightness-110 disabled:bg-slate-600"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Zone Workspace */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Left/Main Zone: Question Canvas */}
        <section className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm">
            {/* Completion Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100" aria-hidden="true">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${stats.completionPct}%` }}
              />
            </div>

            {/* Question Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-50/60 via-white to-amber-50/40 px-5 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-blue-900 tabular-nums">
                    Question {currentQuestion.number} of {paper.questions.length}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs font-semibold text-teal-800">
                    {currentQuestion.subject}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  1 Mark · No Negative Marking · Answers evaluated upon final submission
                </p>
              </div>

              {isCurrentMarked && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <Flag className="h-3.5 w-3.5 fill-amber-500 text-amber-600" aria-hidden="true" />
                  Marked for Review
                </span>
              )}
            </div>

            {/* Question Stem */}
            <div className="px-5 py-6 sm:px-6">
              <div className="space-y-2.5 text-[15px] leading-relaxed font-medium text-slate-900 sm:text-base">
                {currentQuestion.question.split('\n').map((line, idx) => (
                  <p key={idx} className={line.trim().startsWith('(') ? 'pl-3 text-slate-800' : ''}>
                    {line}
                  </p>
                ))}
              </div>

              {/* Options List */}
              <div
                className="mt-6 space-y-3"
                role="radiogroup"
                aria-label={`Options for question ${currentQuestion.number}`}
              >
                {currentQuestion.options.map((opt) => {
                  const isPicked = selectedOption === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      role="radio"
                      aria-checked={isPicked}
                      onClick={() => handleSelectOption(opt.label)}
                      className={`flex w-full cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                        isPicked
                          ? 'border-blue-800 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-amber-50/40 ring-1 ring-blue-800 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/25'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold transition-colors ${
                          isPicked
                            ? 'border-blue-800 bg-gradient-to-br from-blue-800 to-indigo-800 text-white'
                            : 'border-slate-300 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="flex-1 pt-0.5 text-sm leading-relaxed text-slate-800 sm:text-[15px]">
                        {opt.text}
                      </span>
                      {isPicked && (
                        <Check className="mt-1 h-4 w-4 shrink-0 text-blue-800" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3.5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearOption}
                  disabled={!selectedOption}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleToggleMark}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    isCurrentMarked
                      ? 'border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200/70'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                  {isCurrentMarked ? 'Unmark Review' : 'Mark for Review'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>
                {currentIndex < paper.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-gradient-to-r from-blue-800 to-indigo-800 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                  >
                    Save &amp; Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                  >
                    Review &amp; Submit
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="mt-2.5 text-xs text-slate-500">
            Keyboard shortcuts: Press <span className="font-mono font-semibold">A–D</span> or{' '}
            <span className="font-mono font-semibold">1–4</span> to select an option, and{' '}
            <span className="font-mono font-semibold">Left / Right</span> arrows to navigate.
          </p>
        </section>

        {/* Right Zone: Question Navigator Palette + Visual Telemetry + Focus Quote */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm">
              <div
                className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-blue-700 to-amber-500"
                aria-hidden="true"
              />
              <div className="p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="font-serif text-base font-bold text-slate-900">
                    Question Palette
                  </h2>
                  <span className="font-mono text-xs font-medium text-blue-900 tabular-nums">
                    {stats.completionPct}% Done · {formatCountdownClock(elapsedSeconds)}
                  </span>
                </div>

                {/* SVG Multi-Segment Attempt Distribution Visualizer */}
                <div className="mt-3.5">
                  <svg
                    viewBox="0 0 300 12"
                    className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
                    role="img"
                    aria-label={`${stats.answeredCount} answered, ${stats.markedCount} marked, ${stats.unansweredCount} remaining`}
                  >
                    <rect
                      x="0"
                      y="0"
                      width={stats.answeredPct * 3}
                      height="12"
                      fill="#059669"
                    />
                    <rect
                      x={stats.answeredPct * 3}
                      y="0"
                      width={stats.markedOnlyPct * 3}
                      height="12"
                      fill="#d97706"
                    />
                  </svg>
                </div>

                {/* Dual-coded Status Summary */}
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-2 py-2">
                    <dt className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-800">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Answered
                    </dt>
                    <dd className="mt-0.5 font-mono text-base font-bold text-emerald-900 tabular-nums">
                      {stats.answeredCount}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-2 py-2">
                    <dt className="flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-800">
                      <Flag className="h-3 w-3" aria-hidden="true" />
                      Marked
                    </dt>
                    <dd className="mt-0.5 font-mono text-base font-bold text-amber-900 tabular-nums">
                      {stats.markedCount}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-2 py-2">
                    <dt className="text-[11px] font-semibold text-slate-600">Skipped</dt>
                    <dd className="mt-0.5 font-mono text-base font-bold text-slate-800 tabular-nums">
                      {stats.unansweredCount}
                    </dd>
                  </div>
                </dl>

                {/* Filter Tabs */}
                <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
                  {(
                    [
                      { id: 'all', label: 'All (100)' },
                      { id: 'unanswered', label: 'Skipped' },
                      { id: 'marked', label: 'Marked' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaletteFilter(tab.id)}
                      className={`cursor-pointer rounded-md py-1.5 transition-colors ${
                        paletteFilter === tab.id
                          ? 'bg-white text-blue-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 1-100 Grid */}
                <div className="mt-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredQuestions.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-500">
                      No questions match this filter.
                    </p>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 lg:grid-cols-5 xl:grid-cols-10">
                      {filteredQuestions.map(({ q, index }) => {
                        const isAnswered = Boolean(answers[String(q.number)]);
                        const isMarkedQ = Boolean(marked[q.number]);
                        const isCurrent = index === currentIndex;

                        let cellStyle =
                          'border-slate-200 bg-white text-slate-700 hover:border-blue-400';
                        if (isMarkedQ && isAnswered) {
                          cellStyle = 'border-amber-500 bg-amber-100 text-amber-950 font-bold';
                        } else if (isMarkedQ) {
                          cellStyle = 'border-amber-400 bg-amber-50 text-amber-900 font-semibold';
                        } else if (isAnswered) {
                          cellStyle =
                            'border-emerald-600 bg-emerald-500/15 text-emerald-900 font-bold';
                        }

                        return (
                          <button
                            key={q.number}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`Question ${q.number}${isAnswered ? ', answered' : ''}${
                              isMarkedQ ? ', marked for review' : ''
                            }`}
                            className={`relative flex h-8 cursor-pointer items-center justify-center rounded-md border font-mono text-xs tabular-nums transition-all ${cellStyle} ${
                              isCurrent ? 'ring-2 ring-blue-800 ring-offset-1' : ''
                            }`}
                          >
                            {q.number}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Counsel Focus Motivation Card */}
            <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-blue-50/75 via-white to-amber-50/60 p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-blue-900 uppercase">
                  <Quote className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  Nash Law Focus Note
                </span>
                <button
                  type="button"
                  onClick={() => setQuoteOffset((prev) => prev + 1)}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-indigo-800 hover:text-indigo-950"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Next
                </button>
              </div>
              <p className="mt-2 font-serif text-xs leading-relaxed font-semibold text-slate-800">
                &ldquo;{activeFocusQuote.text}&rdquo;
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">— {activeFocusQuote.author}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirm Submission Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-xl">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-blue-800 via-emerald-600 to-amber-500"
              aria-hidden="true"
            />
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="submit-modal-title"
                    className="font-serif text-xl font-bold text-slate-900"
                  >
                    Submit Final Examination?
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Once submitted, your answers are locked, your completion time is recorded, and
                    your full result &amp; mistake rectification report will be generated.
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs">
                <div>
                  <dt className="text-slate-500">Answered</dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-emerald-700 tabular-nums">
                    {stats.answeredCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Marked</dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-amber-700 tabular-nums">
                    {stats.markedCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Skipped</dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-slate-800 tabular-nums">
                    {stats.unansweredCount}
                  </dd>
                </div>
              </dl>

              {submitError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
                >
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Return to Paper
                </button>
                <button
                  type="button"
                  onClick={triggerFinalSubmit}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:bg-slate-400"
                >
                  {submitting ? 'Grading Answers...' : 'Confirm & View Result'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
