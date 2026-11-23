import { useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  Clock,
  Eye,
  KeyRound,
  Lock,
  Medal,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type { ExamId, ExamResultReport, LeaderboardEntry } from '../../shared/types';
import { formatDurationVerbose, formatSubmittedAt } from '../utils/format';
import { ResultReportView } from './ResultReportView';

interface ExaminerPinModalProps {
  onClose: () => void;
  onUnlockSuccess: (token: string) => void;
}

export function ExaminerPinModal({ onClose, onUnlockSuccess }: ExaminerPinModalProps) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crestError, setCrestError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();
    if (!trimmed) {
      setError('Please enter your examiner access PIN.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/examiner/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error || 'Invalid examiner PIN.');
        return;
      }
      onUnlockSuccess(data.token);
    } catch {
      setError('Network error while verifying PIN. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300/80 bg-white shadow-2xl">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-blue-800 via-teal-600 to-amber-500"
          aria-hidden="true"
        />
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {!crestError ? (
                <img
                  src="/src/assets/images/crest_scales_emblem_1795450304802.jpg"
                  alt="Nash Law examiner seal"
                  referrerPolicy="no-referrer"
                  onError={() => setCrestError(true)}
                  className="h-10 w-10 rounded-lg border border-amber-300/80 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div>
                <h2 id="pin-modal-title" className="font-serif text-lg font-bold text-white">
                  Nash Law Leaderboard
                </h2>
                <p className="text-xs text-amber-200/90">Private examiner access only</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PIN dialog"
              className="cursor-pointer rounded-md p-1 text-blue-200 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label htmlFor="examiner-pin-input" className="block text-xs font-bold text-slate-700">
              Enter Examiner Access PIN
            </label>
            <input
              id="examiner-pin-input"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={32}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-amber-50/30 px-3.5 py-2.5 font-mono text-base tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-700/20 focus:outline-none"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-gradient-to-r from-blue-800 to-indigo-800 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:bg-slate-400"
            >
              {submitting ? 'Verifying...' : 'Unlock Leaderboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ExaminerLeaderboardViewProps {
  token: string;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  examFilter: 'all' | ExamId;
  onChangeExamFilter: (filter: 'all' | ExamId) => void;
  onRefresh: () => void;
  onLock: () => void;
  onSessionExpired: () => void;
}

export function ExaminerLeaderboardView({
  token,
  entries,
  loading,
  error,
  examFilter,
  onChangeExamFilter,
  onRefresh,
  onLock,
  onSessionExpired,
}: ExaminerLeaderboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingReport, setInspectingReport] = useState<ExamResultReport | null>(null);
  const [loadingInspectId, setLoadingInspectId] = useState<string | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm.trim()) return true;
    return entry.candidateName.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const handleInspectCandidate = async (submissionId: string) => {
    setLoadingInspectId(submissionId);
    setInspectError(null);
    try {
      const res = await fetch(`/api/leaderboard/${encodeURIComponent(submissionId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onSessionExpired();
        return;
      }
      const data = (await res.json()) as { report?: ExamResultReport; error?: string };
      if (!res.ok || !data.report) {
        setInspectError(data.error || 'Could not load candidate mistake details.');
        return;
      }
      setInspectingReport(data.report);
    } catch {
      setInspectError('Failed to fetch candidate answers.');
    } finally {
      setLoadingInspectId(null);
    }
  };

  const handleDeleteEntry = async (submissionId: string) => {
    setDeletingId(submissionId);
    try {
      const res = await fetch(`/api/leaderboard/${encodeURIComponent(submissionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onSessionExpired();
        return;
      }
      setConfirmDeleteId(null);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (inspectingReport) {
    return (
      <ResultReportView
        report={inspectingReport}
        isExaminerInspect
        onBackAction={() => setInspectingReport(null)}
      />
    );
  }

  const avgAccuracy =
    entries.length > 0
      ? Math.round((entries.reduce((sum, e) => sum + e.accuracyPercent, 0) / entries.length) * 10) /
        10
      : 0;
  const fastestSeconds =
    entries.length > 0 ? Math.min(...entries.map((e) => e.durationSeconds)) : null;
  const topScoreEntry = entries.length > 0 ? entries[0] : null;

  const renderRankCell = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-700 tabular-nums">
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
          #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-600 tabular-nums">
          <Medal className="h-4 w-4 text-slate-400" aria-hidden="true" />
          #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-orange-700 tabular-nums">
          <Award className="h-4 w-4 text-orange-500" aria-hidden="true" />
          #3
        </span>
      );
    }
    return <span className="font-mono font-bold text-slate-600 tabular-nums">#{rank}</span>;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Ornate Examiner Console Banner */}
      <section className="overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 text-white shadow-md">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-400"
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Nash Law Private Examiner Console Unlocked</span>
            </div>
            <h1 className="text-balance mt-1.5 font-serif text-2xl font-bold text-white sm:text-3xl">
              Candidate Leaderboard &amp; Mistake Inspector
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">
              Review all test attendees, inspect their exact completion times, and audit every wrong
              or skipped answer.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-400/40 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={onLock}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-110"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Lock Leaderboard
            </button>
          </div>
        </div>
      </section>

      {/* Colorful KPI Summary Strip */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-700" aria-hidden="true" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Total Attendees
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-blue-950 tabular-nums">
              {entries.length}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-teal-200/80 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Average Accuracy
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-teal-900 tabular-nums">
              {avgAccuracy}%
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Top Performer
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              <span className="truncate font-serif text-lg font-bold text-slate-900">
                {topScoreEntry ? topScoreEntry.candidateName : '—'}
              </span>
            </div>
            {topScoreEntry && (
              <p className="mt-1 font-mono text-xs font-semibold text-amber-800 tabular-nums">
                {topScoreEntry.score}/{topScoreEntry.maxScore} ({topScoreEntry.accuracyPercent}%)
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-xs">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600" aria-hidden="true" />
          <div className="p-5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Fastest Completion
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <span className="font-mono text-2xl font-bold text-indigo-950 tabular-nums">
                {fastestSeconds !== null ? formatDurationVerbose(fastestSeconds) : '—'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Graphical Candidate Score & Speed Comparison Chart */}
      {!loading && filteredEntries.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div
            className="h-1 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-500"
            aria-hidden="true"
          />
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-blue-800" aria-hidden="true" />
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  Candidate Score &amp; Completion Speed Comparison
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-500">
                Dashed Marker = 45% Bar Qualifying Threshold
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {filteredEntries.slice(0, 8).map((entry) => {
                const passed = entry.accuracyPercent >= 45;
                const barGradient = passed
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500';

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleInspectCandidate(entry.id)}
                    className="group block w-full cursor-pointer text-left"
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900 group-hover:text-blue-800">
                        #{entry.rank} {entry.candidateName}
                      </span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        <strong className="text-slate-900">
                          {entry.score}/{entry.maxScore}
                        </strong>{' '}
                        ({entry.accuracyPercent}%) · {formatDurationVerbose(entry.durationSeconds)}
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${barGradient}`}
                        style={{ width: `${entry.accuracyPercent}%` }}
                      />
                      <div
                        className="absolute inset-y-0 border-l-2 border-dashed border-slate-700/75"
                        style={{ left: '45%' }}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filter Controls */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'All Papers' },
              { id: 'aibe-21', label: 'AIBE-XXI' },
              { id: 'aibe-20', label: 'AIBE-XX' },
              { id: 'aibe-19', label: 'AIBE-XIX' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeExamFilter(tab.id)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                examFilter === tab.id
                  ? 'border-blue-800 bg-gradient-to-r from-blue-800 to-indigo-800 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by candidate name..."
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {(error || inspectError) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error || inspectError}
        </div>
      )}

      {/* Leaderboard Table */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div
          className="h-1 bg-gradient-to-r from-blue-800 via-teal-600 to-amber-500"
          aria-hidden="true"
        />
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading candidate submissions...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-serif text-lg font-bold text-slate-800">
              No exam submissions recorded yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Once a candidate completes and submits an exam paper, their name, score, completion
              time, and answer mistakes will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-4 py-3.5">Rank</th>
                  <th className="px-4 py-3.5">Candidate Name</th>
                  <th className="px-4 py-3.5">Exam Paper</th>
                  <th className="px-4 py-3.5 text-right">Score</th>
                  <th className="px-4 py-3.5 text-right">Mistakes</th>
                  <th className="px-4 py-3.5 text-right">Completion Time</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Mistake Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-blue-50/35">
                    <td className="px-4 py-3.5">{renderRankCell(entry.rank)}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{entry.candidateName}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-teal-800">
                      {entry.examTitle}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                      <span className="font-bold text-blue-950">
                        {entry.score}/{entry.maxScore}
                      </span>{' '}
                      <span className="text-xs text-slate-500">({entry.accuracyPercent}%)</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      <span className="font-bold text-rose-700">{entry.incorrectCount} wrong</span>
                      {entry.unattemptedCount > 0 && (
                        <span className="text-amber-700"> · {entry.unattemptedCount} skipped</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-800 tabular-nums">
                      {formatDurationVerbose(entry.durationSeconds)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {formatSubmittedAt(entry.submittedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectCandidate(entry.id)}
                          disabled={loadingInspectId === entry.id}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-800 to-indigo-800 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:bg-slate-400"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {loadingInspectId === entry.id ? 'Loading...' : 'Check Mistakes'}
                        </button>

                        {confirmDeleteId === entry.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deletingId === entry.id}
                              className="cursor-pointer rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                            >
                              {deletingId === entry.id ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(entry.id)}
                            aria-label={`Remove ${entry.candidateName} submission`}
                            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
