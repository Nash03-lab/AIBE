import { useCallback, useEffect, useState } from 'react';
import type {
  CandidateDetails,
  ExamId,
  ExamMode,
  ExamResultReport,
  ExamSummary,
  LeaderboardEntry,
  OptionLetter,
  PublicExamPaper,
} from '../shared/types';
import { Aibe22MockPortal } from './components/Aibe22MockPortal';
import { ExamLobby } from './components/ExamLobby';
import { ExamWorkspace } from './components/ExamWorkspace';
import {
  ExaminerLeaderboardView,
  ExaminerPinModal,
  type LeaderboardFilter,
} from './components/ExaminerModalAndBoard';
import { ResultReportView } from './components/ResultReportView';
import { TopNav, type ActiveRoute } from './components/TopNav';

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>('lobby');
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<ExamId>('aibe-21');
  const [candidateName, setCandidateName] = useState('');

  // AIBE XXII mock test state
  const [aibe22Details, setAibe22Details] = useState<CandidateDetails>({
    fullName: '',
    email: '',
    phone: '',
    stateOrBarCouncil: '',
  });
  const [activeExamMode, setActiveExamMode] = useState<ExamMode>('standard');

  const [startingExam, setStartingExam] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [aibe22StartError, setAibe22StartError] = useState<string | null>(null);
  const [activePaper, setActivePaper] = useState<PublicExamPaper | null>(null);

  const [submittingExam, setSubmittingExam] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<ExamResultReport | null>(null);

  // Examiner auth token held strictly in memory (never localStorage/sessionStorage)
  const [examinerToken, setExaminerToken] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinReturnTarget, setPinReturnTarget] = useState<'leaderboard' | 'aibe22'>('leaderboard');
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilter>('all');

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
    async (token: string, filter: LeaderboardFilter) => {
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
          setPinReturnTarget('leaderboard');
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
      setActiveExamMode('standard');
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

  const handleStartAibe22Exam = useCallback(async () => {
    const cleanName = aibe22Details.fullName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2) {
      setAibe22StartError('Please enter your Full Name before launching the mock test.');
      return;
    }
    setStartingExam(true);
    setAibe22StartError(null);
    setSubmitError(null);
    try {
      const res = await fetch('/api/exams/aibe-21/paper?mode=aibe-22-mock');
      const data = (await res.json()) as { paper?: PublicExamPaper; error?: string };
      if (!res.ok || !data.paper) {
        setAibe22StartError(data.error || 'Could not load AIBE XXII mock paper.');
        return;
      }
      setAibe22Details((prev) => ({ ...prev, fullName: cleanName }));
      setCandidateName(cleanName);
      setActiveExamMode('aibe-22-mock');
      setActivePaper(data.paper);
      setLatestReport(null);
      setRoute('exam');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setAibe22StartError('Network error while launching AIBE XXII mock test.');
    } finally {
      setStartingExam(false);
    }
  }, [aibe22Details.fullName]);

  const handleSubmitExam = useCallback(
    async (answers: Record<string, OptionLetter>, durationSeconds: number) => {
      if (!activePaper) return;
      setSubmittingExam(true);
      setSubmitError(null);
      const isAibe22 = activeExamMode === 'aibe-22-mock' || activePaper.mockMode === 'aibe-22-mock';
      const activeCandidateName = isAibe22
        ? aibe22Details.fullName.trim() || candidateName.trim()
        : candidateName.trim();

      try {
        const res = await fetch(`/api/exams/${encodeURIComponent(activePaper.id)}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: activeCandidateName,
            mockMode: isAibe22 ? 'aibe-22-mock' : 'standard',
            ...(activePaper.deckToken ? { deckToken: activePaper.deckToken } : {}),
            ...(isAibe22 ? { candidateDetails: aibe22Details } : {}),
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
    [activeExamMode, activePaper, aibe22Details, candidateName],
  );

  const handleOpenLeaderboard = useCallback(() => {
    if (route === 'exam') return;
    if (examinerToken) {
      setRoute('leaderboard');
      fetchLeaderboard(examinerToken, leaderboardFilter);
    } else {
      setPinReturnTarget('leaderboard');
      setShowPinModal(true);
    }
  }, [examinerToken, fetchLeaderboard, leaderboardFilter, route]);

  const handleOpenAibe22 = useCallback(() => {
    if (route === 'exam') return;
    setAibe22StartError(null);
    setRoute('aibe22');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  const handlePinUnlock = useCallback(
    (token: string) => {
      setExaminerToken(token);
      setShowPinModal(false);
      if (pinReturnTarget === 'aibe22') {
        setRoute('aibe22');
      } else {
        setRoute('leaderboard');
        fetchLeaderboard(token, leaderboardFilter);
      }
    },
    [fetchLeaderboard, leaderboardFilter, pinReturnTarget],
  );

  const handleChangeLeaderboardFilter = useCallback(
    (filter: LeaderboardFilter) => {
      setLeaderboardFilter(filter);
      if (examinerToken) {
        fetchLeaderboard(examinerToken, filter);
      }
    },
    [examinerToken, fetchLeaderboard],
  );

  const examCandidateName =
    activeExamMode === 'aibe-22-mock'
      ? aibe22Details.fullName.trim() || candidateName
      : candidateName;

  const jumpToLobbySection = useCallback(
    (sectionId: 'mock-tests-section' | 'past-papers-section') => {
      if (route === 'exam') return;
      if (route !== 'lobby') {
        setRoute('lobby');
        setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [route],
  );

  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <TopNav
        activeRoute={route}
        isExaminerUnlocked={Boolean(examinerToken)}
        onNavigateLobby={() => {
          if (route !== 'exam') setRoute('lobby');
        }}
        onJumpToMockTests={() => jumpToLobbySection('mock-tests-section')}
        onJumpToPastPapers={() => jumpToLobbySection('past-papers-section')}
        onOpenAibe22={handleOpenAibe22}
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
            onOpenAibe22={handleOpenAibe22}
          />
        )}

        {route === 'aibe22' && (
          <Aibe22MockPortal
            candidateDetails={aibe22Details}
            onChangeDetails={(details) => {
              setAibe22Details(details);
              if (aibe22StartError) setAibe22StartError(null);
            }}
            startingExam={startingExam}
            startError={aibe22StartError}
            onStartAibe22Exam={handleStartAibe22Exam}
            onBackLobby={() => setRoute('lobby')}
          />
        )}

        {route === 'exam' && activePaper && (
          <ExamWorkspace
            paper={activePaper}
            candidateName={examCandidateName}
            submitting={submittingExam}
            submitError={submitError}
            onSubmitExam={handleSubmitExam}
          />
        )}

        {route === 'result' && latestReport && (
          <ResultReportView
            report={latestReport}
            onBackAction={() => {
              const wasAibe22 = latestReport.mockMode === 'aibe-22-mock';
              setLatestReport(null);
              setRoute(wasAibe22 ? 'aibe22' : 'lobby');
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
              setPinReturnTarget('leaderboard');
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
