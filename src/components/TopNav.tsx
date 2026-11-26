import { useState } from 'react';
import { ClipboardCheck, Crown, Lock, Scale, ScrollText, ShieldCheck } from 'lucide-react';

export type ActiveRoute = 'lobby' | 'aibe22' | 'exam' | 'result' | 'leaderboard';

interface TopNavProps {
  activeRoute: ActiveRoute;
  isExaminerUnlocked: boolean;
  onNavigateLobby: () => void;
  onJumpToMockTests?: () => void;
  onJumpToPastPapers?: () => void;
  onOpenAibe22: () => void;
  onOpenLeaderboard: () => void;
  onStartPrimaryExam?: () => void;
  canStartExam: boolean;
}

export function TopNav({
  activeRoute,
  isExaminerUnlocked,
  onNavigateLobby,
  onJumpToMockTests,
  onJumpToPastPapers,
  onOpenAibe22,
  onOpenLeaderboard,
  onStartPrimaryExam,
  canStartExam,
}: TopNavProps) {
  const isExamActive = activeRoute === 'exam';
  const [emblemError, setEmblemError] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/92 backdrop-blur-md">
      {/* Subtle Judicial Ribbon */}
      <div
        className="h-[3px] w-full bg-gradient-to-r from-[#0B1437] via-amber-500 to-teal-700"
        aria-hidden="true"
      />
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        {/* Left Zone: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={isExamActive ? undefined : onNavigateLobby}
          disabled={isExamActive}
          className={`flex shrink-0 items-center gap-2.5 text-left whitespace-nowrap ${
            isExamActive ? 'cursor-default' : 'cursor-pointer transition-opacity hover:opacity-85'
          }`}
        >
          {!emblemError ? (
            <img
              src="/src/assets/images/crest_scales_emblem_1795450304802.jpg"
              alt="Nash Law judicial crest"
              referrerPolicy="no-referrer"
              onError={() => setEmblemError(true)}
              className="h-9 w-9 shrink-0 rounded-lg border border-amber-400/70 object-cover shadow-xs"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B1437] text-amber-300 shadow-xs">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <span className="font-serif text-xl font-bold tracking-tight whitespace-nowrap text-[#0B1437]">
            Nash Law
          </span>
        </button>

        {/* Center Zone: Single-line Nav Links */}
        {!isExamActive && (
          <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
            <button
              type="button"
              onClick={onJumpToMockTests ?? onNavigateLobby}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-slate-700 transition-colors hover:text-[#0B1437]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-800">
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Mock Tests
            </button>
            <button
              type="button"
              onClick={onJumpToPastPapers ?? onNavigateLobby}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-slate-700 transition-colors hover:text-teal-800"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Past Year Papers
            </button>
            <a
              href="#exam-rules"
              onClick={(e) => {
                if (activeRoute !== 'lobby') {
                  e.preventDefault();
                  onNavigateLobby();
                  setTimeout(() => {
                    document.getElementById('exam-rules')?.scrollIntoView({ behavior: 'smooth' });
                  }, 60);
                }
              }}
              className="hidden shrink-0 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors hover:text-[#0B1437] xl:inline-flex"
            >
              Format &amp; Evaluation
            </a>
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeRoute === 'leaderboard'
                  ? 'text-[#0B1437] underline decoration-amber-500 decoration-2 underline-offset-8'
                  : 'text-slate-600 hover:text-[#0B1437]'
              }`}
            >
              {isExaminerUnlocked ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              )}
              Examiner Leaderboard
            </button>
          </nav>
        )}

        {/* Right Zone: Dedicated Golden AIBE XXII Mock Icon + Primary Action */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          {!isExamActive ? (
            <>
              <button
                type="button"
                onClick={onOpenAibe22}
                title="Open AIBE XXII Mock Test (Shuffled 6-Paper Golden Edition)"
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-xs transition-all ${
                  activeRoute === 'aibe22'
                    ? 'border-amber-600 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                    : 'border-amber-300 bg-gradient-to-r from-amber-200/90 via-yellow-100 to-amber-300/90 text-amber-950 hover:brightness-105'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0B1437] text-amber-300 shadow-2xs">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>AIBE XXII mock test</span>
              </button>

              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold whitespace-nowrap text-slate-800 transition-colors hover:bg-slate-100 md:hidden"
              >
                {isExaminerUnlocked ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Leaderboard</span>
              </button>

              {onStartPrimaryExam && (
                <button
                  type="button"
                  onClick={onStartPrimaryExam}
                  disabled={!canStartExam}
                  className="hidden shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-[#0B1437] via-[#162766] to-[#1E3A8A] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600 sm:inline-flex"
                >
                  Begin Exam
                </button>
              )}
            </>
          ) : (
            <span className="font-mono text-xs font-semibold tracking-wide whitespace-nowrap text-[#0B1437] uppercase">
              Examination In Progress
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
