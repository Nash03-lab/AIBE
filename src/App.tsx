import { useCallback, useEffect, useState } from 'react';
import type {
  ExamId,
  ExamResultReport,
  ExamSummary,
  LeaderboardEntry,
  OptionLetter,
  PublicExamPaper,
} from '../shared/types';
import { ExamLobby } from './components/ExamLobby';
import { ExamWorkspace } from './components/ExamWorkspace';
import {
  ExaminerLeaderboardView,
  ExaminerPinModal,
} from './components/ExaminerModalAndBoard';
import { ResultReportView } from './components/ResultReportView';
import { TopNav, type ActiveRoute } from './components/TopNav';

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>('lobby');
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<ExamId>('aibe-21');
  const [candidateName, setCandidateName] = useState('');

  const [startingExam, setStartingExam] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activePaper, setActivePaper] = useState<PublicExamPaper | null>(null);

  const [submittingExam, setSubmittingExam] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<ExamResultReport | null>(null);

  // Examiner auth token held strictly in memory (never localStorage/sessionStorage)
  const [examinerToken, setExaminerToken] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | ExamId>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingExams(true);
      try {
        const res = await fetch('/api/exams');
        const data = (await res.json()) as { exams?: ExamSummary[] };
        if (!cancelled && Array.isArray(data.exams)) {
          setExams(data.exams);
        }
      } catch {
        if (!cancelled) {
          setStartError('Unable to load examination papers. Please refresh the page.');
        }
      } finally {
        if (!cancelled) setLoadingExams(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchLeaderboard = useCallback(
    async (token: string, filter: 'all' | ExamId) => {
      setLoadingLeaderboard(true);
      setLeaderboardError(null);
      try {
        const qs = filter === 'all' ? '' : `?examId=${encodeURIComponent(filter)}`;
        const res = await fetch(`/api/leaderboard${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          setExaminerToken(null);
          setRoute('lobby');
          setShowPinModal(true);
          return;
        }
        const data = (await res.json()) as { entries?: LeaderboardEntry[]; error?: string };
        if (!res.ok || !Array.isArray(data.entries)) {
          setLeaderboardError(data.error || 'Failed to load leaderboard.');
          return;
        }
        setLeaderboardEntries(data.entries);
      } catch {
        setLeaderboardError('Network error while loading leaderboard.');
      } finally {
        setLoadingLeaderboard(false);
      }
    },
    [],
  );

  const handleStartExam = useCallback(async () => {
    const cleanName = candidateName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2) {
      setStartError('Please enter your name (at least 2 characters) before starting.');
      return;
    }
    setStartingExam(true);
    setStartError(null);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/exams/${encodeURIComponent(selectedExamId)}/paper`);
      const data = (await res.json()) as { paper?: PublicExamPaper; error?: string };
      if (!res.ok || !data.paper) {
        setStartError(data.error || 'Could not load question booklet.');
        return;
      }
      setCandidateName(cleanName);
      setActivePaper(data.paper);
      setLatestReport(null);
      setRoute('exam');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setStartError('Network error while starting the examination.');
    } finally {
      setStartingExam(false);
    }
  }, [candidateName, selectedExamId]);

  const handleSubmitExam = useCallback(
    async (answers: Record<string, OptionLetter>, durationSeconds: number) => {
      if (!activePaper) return;
      setSubmittingExam(true);
      setSubmitError(null);
      try {
        const res = await fetch(`/api/exams/${encodeURIComponent(activePaper.id)}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: candidateName.trim(),
            durationSeconds,
            answers,
          }),
        });
        const data = (await res.json()) as { report?: ExamResultReport; error?: string };
        if (!res.ok || !data.report) {
          setSubmitError(data.error || 'Could not evaluate your exam submission.');
          return;
        }
        setLatestReport(data.report);
        setActivePaper(null);
        setRoute('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        setSubmitError('Network error while submitting exam. Your answers are still preserved.');
      } finally {
        setSubmittingExam(false);
      }
    },
    [activePaper, candidateName],
  );

  const handleOpenLeaderboard = useCallback(() => {
    if (route === 'exam') return;
    if (examinerToken) {
      setRoute('leaderboard');
      fetchLeaderboard(examinerToken, leaderboardFilter);
    } else {
      setShowPinModal(true);
    }
  }, [examinerToken, fetchLeaderboard, leaderboardFilter, route]);

  const handlePinUnlock = useCallback(
    (token: string) => {
      setExaminerToken(token);
      setShowPinModal(false);
      setRoute('leaderboard');
      fetchLeaderboard(token, leaderboardFilter);
    },
    [fetchLeaderboard, leaderboardFilter],
  );

  const handleChangeLeaderboardFilter = useCallback(
    (filter: 'all' | ExamId) => {
      setLeaderboardFilter(filter);
      if (examinerToken) {
        fetchLeaderboard(examinerToken, filter);
      }
    },
    [examinerToken, fetchLeaderboard],
  );

  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <TopNav
        activeRoute={route}
        isExaminerUnlocked={Boolean(examinerToken)}
        onNavigateLobby={() => {
          if (route !== 'exam') setRoute('lobby');
        }}
        onOpenLeaderboard={handleOpenLeaderboard}
        onStartPrimaryExam={route === 'lobby' ? handleStartExam : undefined}
        canStartExam={!loadingExams && !startingExam}
      />

      <div className="flex-1">
        {route === 'lobby' && (
          <ExamLobby
            exams={exams}
            loadingExams={loadingExams}
            selectedExamId={selectedExamId}
            candidateName={candidateName}
            startingExam={startingExam}
            startError={startError}
            onSelectExam={(id) => {
              setSelectedExamId(id);
              setStartError(null);
            }}
            onChangeName={(name) => {
              setCandidateName(name);
              if (startError) setStartError(null);
            }}
            onStartExam={handleStartExam}
          />
        )}

        {route === 'exam' && activePaper && (
          <ExamWorkspace
            paper={activePaper}
            candidateName={candidateName}
            submitting={submittingExam}
            submitError={submitError}
            onSubmitExam={handleSubmitExam}
          />
        )}

        {route === 'result' && latestReport && (
          <ResultReportView
            report={latestReport}
            onBackAction={() => {
              setLatestReport(null);
              setRoute('lobby');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {route === 'leaderboard' && examinerToken && (
          <ExaminerLeaderboardView
            token={examinerToken}
            entries={leaderboardEntries}
            loading={loadingLeaderboard}
            error={leaderboardError}
            examFilter={leaderboardFilter}
            onChangeExamFilter={handleChangeLeaderboardFilter}
            onRefresh={() => fetchLeaderboard(examinerToken, leaderboardFilter)}
            onLock={() => {
              setExaminerToken(null);
              setLeaderboardEntries([]);
              setRoute('lobby');
            }}
            onSessionExpired={() => {
              setExaminerToken(null);
              setRoute('lobby');
              setShowPinModal(true);
            }}
          />
        )}
      </div>

      {route !== 'exam' && (
        <footer className="mt-12 border-t border-amber-200/70 bg-white/80 backdrop-blur-xs">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-slate-600 sm:px-6 lg:px-8">
            <span className="font-serif text-sm font-bold text-slate-900">Nash Law</span>
            <span>Official Set Code-A Mock Examination &amp; Mistake Rectification Portal</span>
          </div>
        </footer>
      )}

      {showPinModal && (
        <ExaminerPinModal
          onClose={() => setShowPinModal(false)}
          onUnlockSuccess={handlePinUnlock}
        />
      )}
    </div>
  );
}
