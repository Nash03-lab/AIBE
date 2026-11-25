export type ExamId = 'aibe-21' | 'aibe-20' | 'aibe-19';

export type ExamMode = 'standard' | 'aibe-22-mock';

export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface CandidateDetails {
  fullName: string;
  email?: string;
  phone?: string;
  stateOrBarCouncil?: string;
}

export interface Aibe22ScheduleInfo {
  examDateYmd: string;
  utcOffsetMinutes: number;
  startTimestampMs: number;
  endTimestampMs: number;
  startTimeLabel: string;
  endTimeLabel: string;
}

export interface QuestionOption {
  label: OptionLetter;
  text: string;
}

export interface QuestionRectification {
  principle: string;
  whyMistakeHappens: string;
  howToRectify: string;
}

export interface ExamQuestion {
  number: number;
  subject: string;
  statuteRef: string;
  question: string;
  options: QuestionOption[];
  correctAnswers: OptionLetter[];
  withdrawn: boolean;
  rectification: QuestionRectification;
}

export interface ExamPaper {
  id: ExamId;
  title: string;
  shortTitle: string;
  setCode: string;
  examMeta: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

export interface ExamSummary {
  id: ExamId;
  title: string;
  shortTitle: string;
  setCode: string;
  examMeta: string;
  durationMinutes: number;
  totalQuestions: number;
  validQuestions: number;
  withdrawnQuestions: number;
  subjects: string[];
}

export interface PublicQuestion {
  number: number;
  subject: string;
  statuteRef: string;
  question: string;
  options: QuestionOption[];
}

export interface PublicExamPaper {
  id: ExamId;
  title: string;
  shortTitle: string;
  setCode: string;
  examMeta: string;
  durationMinutes: number;
  mockMode?: ExamMode;
  windowClosesAtMs?: number;
  questions: PublicQuestion[];
}

export interface QuestionReviewItem {
  number: number;
  subject: string;
  statuteRef: string;
  question: string;
  options: QuestionOption[];
  selectedOption: OptionLetter | null;
  correctAnswers: OptionLetter[];
  withdrawn: boolean;
  status: 'correct' | 'incorrect' | 'unattempted' | 'withdrawn';
  rectification: QuestionRectification;
}

export interface SubjectBreakdown {
  subject: string;
  totalValid: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracyPercent: number;
}

export interface ExamResultReport {
  submissionId: string;
  candidateName: string;
  candidateDetails?: CandidateDetails;
  examId: ExamId;
  mockMode?: ExamMode;
  examTitle: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  withdrawnCount: number;
  accuracyPercent: number;
  qualifiedGeneral: boolean;
  durationSeconds: number;
  submittedAt: string;
  subjectBreakdown: SubjectBreakdown[];
  review: QuestionReviewItem[];
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  candidateName: string;
  candidateDetails?: CandidateDetails;
  examId: ExamId;
  mockMode?: ExamMode;
  examTitle: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPercent: number;
  durationSeconds: number;
  submittedAt: string;
}
