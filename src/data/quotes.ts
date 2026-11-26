export interface LegalQuote {
  text: string;
  author: string;
  role: string;
}

export const LOBBY_QUOTES: LegalQuote[] = [
  {
    text: 'Law and order exist for the purpose of establishing justice, and when they fail in this purpose they become the dangerously structured dams that block the flow of social progress.',
    author: 'Justice P. N. Bhagwati',
    role: 'Former Chief Justice of India',
  },
  {
    text: 'Constitution is not a mere lawyers document, it is a vehicle of Life, and its spirit is always the spirit of Age.',
    author: 'Dr. B. R. Ambedkar',
    role: 'Chair of the Drafting Committee, Constitution of India',
  },
  {
    text: 'The duty of an advocate is not merely to win a case, but to assist the Court in discovering the truth within the framework of the Bare Act.',
    author: 'Nani Palkhivala',
    role: 'Senior Advocate & Constitutional Jurist',
  },
  {
    text: 'Precision in reading statutory text is half the battle in the Bar Examination; the other half is calm temperament under the clock.',
    author: 'Justice H. R. Khanna',
    role: 'Former Judge, Supreme Court of India',
  },
];

export const EXAM_FOCUS_QUOTES: LegalQuote[] = [
  {
    text: 'Read the statutory proviso twice before selecting an option; exceptions often decide the answer.',
    author: 'Nash Law Counsel Desk',
    role: 'AIBE Strategy Note',
  },
  {
    text: 'With zero negative marking, never leave a valid question unattempted—eliminate two distractors and commit.',
    author: 'Nash Law Counsel Desk',
    role: 'Exam Pacing Rule',
  },
  {
    text: 'Jurisdiction, limitation, and burden of proof are the three pillars of procedural law.',
    author: 'Sir Dinshah Fardunji Mulla',
    role: 'Indian Legal Scholar',
  },
  {
    text: 'Distinguish between "shall" and "may" in procedural provisions—mandatory duties leave no judicial discretion.',
    author: 'Nash Law Counsel Desk',
    role: 'Statutory Interpretation',
  },
];

export const RESULT_PASS_QUOTES: LegalQuote[] = [
  {
    text: 'Excellence at the Bar begins with mastery of fundamentals. Review even your lucky guesses so your command of the Bare Acts becomes unshakeable.',
    author: 'Fali S. Nariman',
    role: 'Senior Advocate, Supreme Court of India',
  },
  {
    text: 'Qualifying the Bar Examination is the threshold; disciplined statutory recall is what sustains a lifelong practice.',
    author: 'Justice V. R. Krishna Iyer',
    role: 'Former Judge, Supreme Court of India',
  },
  {
    text: 'Every statute mastered today becomes an argument ready in Court tomorrow.',
    author: 'Nash Law Editorial Board',
    role: 'Certificate of Practice Advisory',
  },
];

export const RESULT_COMEBACK_QUOTES: LegalQuote[] = [
  {
    text: 'Every mistake caught in a mock paper is one mark saved in the actual All India Bar Examination. Rectify the Bare Act section now and return stronger.',
    author: 'Nash Law Editorial Board',
    role: 'Mistake Rectification Desk',
  },
  {
    text: 'Success in law belongs to those who diagnose their errors without hesitation and return to the primary text.',
    author: 'M. C. Setalvad',
    role: 'First Attorney General of India',
  },
  {
    text: 'Focus first on your highest-weightage subjects—Constitutional Law, Criminal Procedure, Evidence, and CPC—to lift your score past 45% rapidly.',
    author: 'Nash Law Editorial Board',
    role: 'AIBE Score Recovery Plan',
  },
];
