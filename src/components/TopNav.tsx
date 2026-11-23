import { useState } from 'react';
import { Lock, Scale, ShieldCheck } from 'lucide-react';

export type ActiveRoute = 'lobby' | 'exam' | 'result' | 'leaderboard';

interface TopNavProps {
  activeRoute: ActiveRoute;
  isExaminerUnlocked: boolean;
  onNavigateLobby: () => void;
  onOpenLeaderboard: () => void;
  onStartPrimaryExam?: () => void;
  canStartExam: boolean;
}

export function TopNav({
  activeRoute,
  isExaminerUnlocked,
  onNavigateLobby,
  onOpenLeaderboard,
  onStartPrimaryExam,
  canStartExam,
}: TopNavProps) {
  const isExamActive = activeRoute === 'exam';
  const [emblemError, setEmblemError] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-white/95 backdrop-blur-md">
      {/* Decorative Tricolor Judicial Ribbon */}
      <div
        className="h-1 w-full bg-gradient-to-r from-blue-800 via-teal-600 to-amber-500"
        aria-hidden="true"
      />
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
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
              className="h-9 w-9 shrink-0 rounded-lg border border-amber-300/80 object-cover shadow-xs"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-900 via-indigo-800 to-amber-600 text-white shadow-xs">
              <Scale className="h-4 w-4 text-amber-200" aria-hidden="true" />
            </span>
          )}
          <span className="font-serif text-xl font-bold tracking-tight whitespace-nowrap text-slate-900">
            Nash Law
          </span>
        </button>

        {/* Center Zone: Single-line Nav Links */}
        {!isExamActive && (
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            <button
              type="button"
              onClick={onNavigateLobby}
              className={`shrink-0 cursor-pointer text-sm font-semibold whitespace-nowrap transition-colors ${
                activeRoute === 'lobby'
                  ? 'text-blue-900 underline decoration-amber-500 decoration-2 underline-offset-8'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Exam Papers
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
              className="shrink-0 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors hover:text-teal-700"
            >
              Format &amp; Evaluation
            </a>
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeRoute === 'leaderboard'
                  ? 'text-indigo-900 underline decoration-amber-500 decoration-2 underline-offset-8'
                  : 'text-slate-600 hover:text-indigo-900'
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

        {/* Right Zone: Single Primary Action */}
        <div className="flex shrink-0 items-center gap-3">
          {!isExamActive ? (
            <>
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300/80 bg-amber-50/70 px-3 py-2 text-xs font-semibold whitespace-nowrap text-amber-950 transition-colors hover:bg-amber-100 md:hidden"
              >
                {isExaminerUnlocked ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                )}
                Leaderboard
              </button>
              {onStartPrimaryExam && (
                <button
                  type="button"
                  onClick={onStartPrimaryExam}
                  disabled={!canStartExam}
                  className="shrink-0 cursor-pointer rounded-lg bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-900 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600"
                >
                  Begin Exam
                </button>
              )}
            </>
          ) : (
            <span className="font-mono text-xs font-semibold tracking-wide whitespace-nowrap text-indigo-900 uppercase">
              Examination In Progress
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
