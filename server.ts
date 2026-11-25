import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import type {
  Aibe22ScheduleInfo,
  CandidateDetails,
  ExamId,
  ExamMode,
  ExamPaper,
  ExamResultReport,
  ExamSummary,
  LeaderboardEntry,
  OptionLetter,
  PublicExamPaper,
  QuestionReviewItem,
  SubjectBreakdown,
} from './shared/types.ts';

const PORT = Number(process.env.PORT || 3000);
const VALID_OPTIONS = new Set<OptionLetter>(['A', 'B', 'C', 'D']);

// Salted scrypt digest for default examiner PIN (overrideable via process.env.LEADERBOARD_PIN)
const DEFAULT_PIN_SALT = 'b71dda244a6d92627aad42b61e1f23e6';
const DEFAULT_PIN_HASH =
  '5c404af463944f9739bb8609b1d9272e90aabb4c0d3ee39d51a7b7cf1c3769453510ab62a57c73fee551bab0ef0497e1f9e7e8ff71f345712f98dd0816c3a4df';

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'aibe22_schedule.json');

interface StoredSubmission {
  submissionId: string;
  candidateName: string;
  candidateDetails?: CandidateDetails;
  examId: ExamId;
  mockMode?: ExamMode;
  durationSeconds: number;
  submittedAt: string;
  answers: Record<string, OptionLetter>;
}

const EXAM_FILES: Record<ExamId, string> = {
  'aibe-21': path.resolve(process.cwd(), 'shared/data/aibe_21.json'),
  'aibe-20': path.resolve(process.cwd(), 'shared/data/aibe_20.json'),
  'aibe-19': path.resolve(process.cwd(), 'shared/data/aibe_19.json'),
};

function loadExamPapers(): Record<ExamId, ExamPaper> {
  const result = {} as Record<ExamId, ExamPaper>;
  (Object.keys(EXAM_FILES) as ExamId[]).forEach((id) => {
    const raw = fs.readFileSync(EXAM_FILES[id], 'utf8');
    result[id] = JSON.parse(raw) as ExamPaper;
  });
  return result;
}

const EXAM_PAPERS = loadExamPapers();

let writeQueue: Promise<void> = Promise.resolve();

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, '[]', 'utf8');
  }
}

function readSubmissions(): StoredSubmission[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredSubmission[]) : [];
  } catch {
    return [];
  }
}

function writeSubmissionsAtomic(items: StoredSubmission[]): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    ensureStorage();
    const tmpFile = `${SUBMISSIONS_FILE}.${crypto.randomUUID()}.tmp`;
    await fs.promises.writeFile(tmpFile, JSON.stringify(items, null, 2), 'utf8');
    await fs.promises.rename(tmpFile, SUBMISSIONS_FILE);
  });
  return writeQueue;
}

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function computeScheduleTimestamps(
  examDateYmd: string,
  utcOffsetMinutes: number,
): Aibe22ScheduleInfo {
  const [y, m, d] = examDateYmd.split('-').map(Number);
  const startTimestampMs = Date.UTC(y, m - 1, d, 11, 30, 0) + utcOffsetMinutes * 60_000;
  const endTimestampMs = Date.UTC(y, m - 1, d, 15, 0, 0) + utcOffsetMinutes * 60_000;
  return {
    examDateYmd,
    utcOffsetMinutes,
    startTimestampMs,
    endTimestampMs,
    startTimeLabel: '11:30 AM',
    endTimeLabel: '3:00 PM',
  };
}

function getOrCreateAibe22Schedule(clientTodayYmd?: string, clientTzOffset?: number): Aibe22ScheduleInfo {
  ensureStorage();
  if (fs.existsSync(SCHEDULE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8')) as {
        examDateYmd?: string;
        utcOffsetMinutes?: number;
      };
      if (
        typeof saved.examDateYmd === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(saved.examDateYmd) &&
        typeof saved.utcOffsetMinutes === 'number' &&
        Number.isFinite(saved.utcOffsetMinutes)
      ) {
        return computeScheduleTimestamps(saved.examDateYmd, saved.utcOffsetMinutes);
      }
    } catch {
      // recreate below
    }
  }

  const validToday =
    clientTodayYmd && /^\d{4}-\d{2}-\d{2}$/.test(clientTodayYmd)
      ? clientTodayYmd
      : new Date().toISOString().slice(0, 10);
  const validOffset =
    typeof clientTzOffset === 'number' &&
    Number.isFinite(clientTzOffset) &&
    clientTzOffset >= -840 &&
    clientTzOffset <= 840
      ? Math.round(clientTzOffset)
      : new Date().getTimezoneOffset();

  const examDateYmd = addDaysToYmd(validToday, 1);
  const info = computeScheduleTimestamps(examDateYmd, validOffset);
  fs.writeFileSync(
    SCHEDULE_FILE,
    JSON.stringify({ examDateYmd, utcOffsetMinutes: validOffset }, null, 2),
    'utf8',
  );
  return info;
}

function evaluateSubmission(sub: StoredSubmission): ExamResultReport {
  const paper = EXAM_PAPERS[sub.examId];
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let withdrawnCount = 0;

  const subjectMap = new Map<
    string,
    { totalValid: number; correct: number; incorrect: number; unattempted: number }
  >();

  const review: QuestionReviewItem[] = paper.questions.map((q) => {
    const rawSelection = sub.answers[String(q.number)] ?? null;
    const selectedOption = rawSelection && VALID_OPTIONS.has(rawSelection) ? rawSelection : null;

    if (q.withdrawn) {
      withdrawnCount += 1;
      return {
        number: q.number,
        subject: q.subject,
        statuteRef: q.statuteRef,
        question: q.question,
        options: q.options,
        selectedOption,
        correctAnswers: q.correctAnswers,
        withdrawn: true,
        status: 'withdrawn',
        rectification: q.rectification,
      };
    }

    const bucket = subjectMap.get(q.subject) ?? {
      totalValid: 0,
      correct: 0,
      incorrect: 0,
      unattempted: 0,
    };
    bucket.totalValid += 1;

    let status: QuestionReviewItem['status'];
    if (!selectedOption) {
      status = 'unattempted';
      unattemptedCount += 1;
      bucket.unattempted += 1;
    } else if (q.correctAnswers.includes(selectedOption)) {
      status = 'correct';
      correctCount += 1;
      bucket.correct += 1;
    } else {
      status = 'incorrect';
      incorrectCount += 1;
      bucket.incorrect += 1;
    }

    subjectMap.set(q.subject, bucket);

    return {
      number: q.number,
      subject: q.subject,
      statuteRef: q.statuteRef,
      question: q.question,
      options: q.options,
      selectedOption,
      correctAnswers: q.correctAnswers,
      withdrawn: false,
      status,
      rectification: q.rectification,
    };
  });

  const maxScore = paper.questions.length - withdrawnCount;
  const accuracyPercent = maxScore > 0 ? Math.round((correctCount / maxScore) * 1000) / 10 : 0;

  const subjectBreakdown: SubjectBreakdown[] = Array.from(subjectMap.entries()).map(
    ([subject, stats]) => ({
      subject,
      totalValid: stats.totalValid,
      correct: stats.correct,
      incorrect: stats.incorrect,
      unattempted: stats.unattempted,
      accuracyPercent:
        stats.totalValid > 0 ? Math.round((stats.correct / stats.totalValid) * 1000) / 10 : 0,
    }),
  );

  const isAibe22Mock = sub.mockMode === 'aibe-22-mock';
  return {
    submissionId: sub.submissionId,
    candidateName: sub.candidateName,
    ...(sub.candidateDetails ? { candidateDetails: sub.candidateDetails } : {}),
    examId: sub.examId,
    mockMode: sub.mockMode ?? 'standard',
    examTitle: isAibe22Mock ? 'AIBE XXII Mock Test (AIBE-XXI Set Code-A)' : paper.title,
    score: correctCount,
    maxScore,
    correctCount,
    incorrectCount,
    unattemptedCount,
    withdrawnCount,
    accuracyPercent,
    qualifiedGeneral: accuracyPercent >= 45,
    durationSeconds: sub.durationSeconds,
    submittedAt: sub.submittedAt,
    subjectBreakdown,
    review,
  };
}

function verifyExaminerPin(inputPin: string): boolean {
  const configuredPin = process.env.LEADERBOARD_PIN?.trim();
  if (configuredPin) {
    const salt = 'env-pin-salt';
    const expected = crypto.scryptSync(configuredPin, salt, 64);
    const candidate = crypto.scryptSync(inputPin, salt, 64);
    return crypto.timingSafeEqual(expected, candidate);
  }
  const expected = Buffer.from(DEFAULT_PIN_HASH, 'hex');
  const candidate = crypto.scryptSync(inputPin, DEFAULT_PIN_SALT, 64);
  return crypto.timingSafeEqual(expected, candidate);
}

function issueExaminerToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ role: 'examiner', exp: expiresAt })).toString(
    'base64url',
  );
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt };
}

function verifyExaminerToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'examiner' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

const unlockAttempts = new Map<string, { count: number; resetAt: number }>();

function checkUnlockRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = unlockAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    unlockAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 12) {
    return false;
  }
  entry.count += 1;
  return true;
}

function requireExaminer(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Examiner PIN authentication required.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!verifyExaminerToken(token)) {
    res.status(401).json({ error: 'Examiner session expired or invalid. Please enter PIN again.' });
    return;
  }
  next();
}

function isValidExamId(id: string): id is ExamId {
  return id === 'aibe-21' || id === 'aibe-20' || id === 'aibe-19';
}

async function startServer(): Promise<void> {
  ensureStorage();
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/aibe22/schedule', (req, res) => {
    const todayYmd = typeof req.query.todayYmd === 'string' ? req.query.todayYmd : undefined;
    const rawOffset = typeof req.query.tzOffset === 'string' ? Number(req.query.tzOffset) : undefined;
    const schedule = getOrCreateAibe22Schedule(todayYmd, rawOffset);
    res.json({ schedule, serverNowMs: Date.now() });
  });

  app.get('/api/exams', (_req, res) => {
    const summaries: ExamSummary[] = (Object.keys(EXAM_PAPERS) as ExamId[]).map((id) => {
      const paper = EXAM_PAPERS[id];
      const withdrawnQuestions = paper.questions.filter((q) => q.withdrawn).length;
      const subjects = Array.from(new Set(paper.questions.map((q) => q.subject)));
      return {
        id: paper.id,
        title: paper.title,
        shortTitle: paper.shortTitle,
        setCode: paper.setCode,
        examMeta: paper.examMeta,
        durationMinutes: paper.durationMinutes,
        totalQuestions: paper.questions.length,
        validQuestions: paper.questions.length - withdrawnQuestions,
        withdrawnQuestions,
        subjects,
      };
    });
    res.json({ exams: summaries });
  });

  app.get('/api/exams/:examId/paper', (req, res) => {
    const { examId } = req.params;
    if (!isValidExamId(examId)) {
      res.status(404).json({ error: 'Exam paper not found.' });
      return;
    }
    const mode = req.query.mode === 'aibe-22-mock' ? 'aibe-22-mock' : 'standard';
    if (mode === 'aibe-22-mock' && examId !== 'aibe-21') {
      res.status(400).json({ error: 'AIBE XXII Mock Test uses the AIBE-XXI Set Code-A paper.' });
      return;
    }

    const paper = EXAM_PAPERS[examId];
    let durationMinutes = paper.durationMinutes;
    let windowClosesAtMs: number | undefined;

    if (mode === 'aibe-22-mock') {
      const authHeader = req.headers.authorization;
      const bearerToken =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.slice('Bearer '.length).trim()
          : '';
      const isExaminerPreview = Boolean(bearerToken && verifyExaminerToken(bearerToken));

      const schedule = getOrCreateAibe22Schedule();
      const now = Date.now();
      const isWindowOpen = now >= schedule.startTimestampMs && now < schedule.endTimestampMs;

      if (!isWindowOpen && !isExaminerPreview) {
        if (now < schedule.startTimestampMs) {
          res.status(403).json({
            error: `AIBE XXII Mock Test opens at ${schedule.startTimeLabel} on ${schedule.examDateYmd} and closes at ${schedule.endTimeLabel}.`,
          });
        } else {
          res.status(403).json({
            error: `The AIBE XXII Mock Test window closed at ${schedule.endTimeLabel}.`,
          });
        }
        return;
      }

      if (isWindowOpen) {
        const minsLeft = Math.max(1, Math.ceil((schedule.endTimestampMs - now) / 60_000));
        durationMinutes = Math.min(210, minsLeft);
        windowClosesAtMs = schedule.endTimestampMs;
      }
    }

    const publicPaper: PublicExamPaper = {
      id: paper.id,
      title: mode === 'aibe-22-mock' ? 'AIBE XXII Mock Test (AIBE-XXI Set Code-A)' : paper.title,
      shortTitle: mode === 'aibe-22-mock' ? 'AIBE XXII Mock' : paper.shortTitle,
      setCode: paper.setCode,
      examMeta:
        mode === 'aibe-22-mock'
          ? 'AIBE XXII Scheduled Mock · 11:30 AM – 3:00 PM · AIBE-XXI Set Code-A (100 MCQs)'
          : paper.examMeta,
      durationMinutes,
      mockMode: mode,
      ...(windowClosesAtMs ? { windowClosesAtMs } : {}),
      questions: paper.questions.map((q) => ({
        number: q.number,
        subject: q.subject,
        statuteRef: q.statuteRef,
        question: q.question,
        options: q.options,
      })),
    };
    res.json({ paper: publicPaper });
  });

  app.post('/api/exams/:examId/submit', async (req, res) => {
    const { examId } = req.params;
    if (!isValidExamId(examId)) {
      res.status(404).json({ error: 'Exam paper not found.' });
      return;
    }

    const body = req.body as {
      candidateName?: unknown;
      candidateDetails?: unknown;
      mockMode?: unknown;
      durationSeconds?: unknown;
      answers?: unknown;
    };

    const mockMode: ExamMode = body?.mockMode === 'aibe-22-mock' ? 'aibe-22-mock' : 'standard';

    if (typeof body?.candidateName !== 'string') {
      res.status(400).json({ error: 'Candidate name is required.' });
      return;
    }
    const candidateName = body.candidateName.trim().replace(/\s+/g, ' ');
    if (candidateName.length < 2 || candidateName.length > 80) {
      res.status(400).json({ error: 'Candidate name must be between 2 and 80 characters.' });
      return;
    }

    let candidateDetails: CandidateDetails | undefined;
    if (body?.candidateDetails && typeof body.candidateDetails === 'object') {
      const rawDetails = body.candidateDetails as Record<string, unknown>;
      const email = typeof rawDetails.email === 'string' ? rawDetails.email.trim().slice(0, 120) : '';
      const phone = typeof rawDetails.phone === 'string' ? rawDetails.phone.trim().slice(0, 32) : '';
      const stateOrBarCouncil =
        typeof rawDetails.stateOrBarCouncil === 'string'
          ? rawDetails.stateOrBarCouncil.trim().slice(0, 100)
          : '';
      candidateDetails = {
        fullName: candidateName,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(stateOrBarCouncil ? { stateOrBarCouncil } : {}),
      };
    }

    const rawDuration = Number(body.durationSeconds);
    if (!Number.isFinite(rawDuration) || rawDuration < 0 || rawDuration > 21600) {
      res.status(400).json({ error: 'Invalid completion time value.' });
      return;
    }
    const durationSeconds = Math.round(rawDuration);

    const sanitizedAnswers: Record<string, OptionLetter> = {};
    if (body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)) {
      for (const [key, val] of Object.entries(body.answers as Record<string, unknown>)) {
        const num = Number(key);
        if (
          Number.isInteger(num) &&
          num >= 1 &&
          num <= 100 &&
          typeof val === 'string' &&
          VALID_OPTIONS.has(val as OptionLetter)
        ) {
          sanitizedAnswers[String(num)] = val as OptionLetter;
        }
      }
    }

    const submission: StoredSubmission = {
      submissionId: crypto.randomUUID(),
      candidateName,
      ...(candidateDetails ? { candidateDetails } : {}),
      examId,
      mockMode,
      durationSeconds,
      submittedAt: new Date().toISOString(),
      answers: sanitizedAnswers,
    };

    const existing = readSubmissions();
    existing.push(submission);
    await writeSubmissionsAtomic(existing);

    const report = evaluateSubmission(submission);
    res.status(201).json({ report });
  });

  app.get('/api/submissions/:submissionId', (req, res) => {
    const { submissionId } = req.params;
    const match = readSubmissions().find((s) => s.submissionId === submissionId);
    if (!match || !isValidExamId(match.examId)) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }
    res.json({ report: evaluateSubmission(match) });
  });

  app.post('/api/examiner/unlock', (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkUnlockRateLimit(clientIp)) {
      res.status(429).json({ error: 'Too many incorrect PIN attempts. Please wait 5 minutes.' });
      return;
    }
    const pin = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';
    if (!pin || pin.length > 32) {
      res.status(400).json({ error: 'Please enter the examiner PIN.' });
      return;
    }
    if (!verifyExaminerPin(pin)) {
      res.status(401).json({ error: 'Invalid examiner PIN.' });
      return;
    }
    const session = issueExaminerToken();
    res.json(session);
  });

  app.get('/api/leaderboard', requireExaminer, (req, res) => {
    const examFilter = typeof req.query.examId === 'string' ? req.query.examId : 'all';
    const all = readSubmissions().filter((s) => isValidExamId(s.examId));
    const filtered =
      examFilter === 'aibe-22-mock'
        ? all.filter((s) => s.mockMode === 'aibe-22-mock')
        : examFilter !== 'all' && isValidExamId(examFilter)
          ? all.filter((s) => s.examId === examFilter && s.mockMode !== 'aibe-22-mock')
          : all;

    const evaluated = filtered.map((s) => evaluateSubmission(s));
    evaluated.sort((a, b) => {
      if (b.accuracyPercent !== a.accuracyPercent) return b.accuracyPercent - a.accuracyPercent;
      if (b.score !== a.score) return b.score - a.score;
      if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    const entries: LeaderboardEntry[] = evaluated.map((r, index) => ({
      id: r.submissionId,
      rank: index + 1,
      candidateName: r.candidateName,
      ...(r.candidateDetails ? { candidateDetails: r.candidateDetails } : {}),
      examId: r.examId,
      mockMode: r.mockMode,
      examTitle: r.examTitle,
      score: r.score,
      maxScore: r.maxScore,
      correctCount: r.correctCount,
      incorrectCount: r.incorrectCount,
      unattemptedCount: r.unattemptedCount,
      accuracyPercent: r.accuracyPercent,
      durationSeconds: r.durationSeconds,
      submittedAt: r.submittedAt,
    }));

    res.json({ entries });
  });

  app.get('/api/leaderboard/:submissionId', requireExaminer, (req, res) => {
    const { submissionId } = req.params;
    const match = readSubmissions().find((s) => s.submissionId === submissionId);
    if (!match || !isValidExamId(match.examId)) {
      res.status(404).json({ error: 'Candidate submission not found.' });
      return;
    }
    res.json({ report: evaluateSubmission(match) });
  });

  app.delete('/api/leaderboard/:submissionId', requireExaminer, async (req, res) => {
    const { submissionId } = req.params;
    const existing = readSubmissions();
    const next = existing.filter((s) => s.submissionId !== submissionId);
    if (next.length === existing.length) {
      res.status(404).json({ error: 'Candidate submission not found.' });
      return;
    }
    await writeSubmissionsAtomic(next);
    res.json({ deleted: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nash Law server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Nash Law server:', err);
  process.exit(1);
});
