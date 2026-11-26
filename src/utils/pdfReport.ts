import { jsPDF } from 'jspdf';
import type { ExamResultReport } from '../../shared/types';
import { formatDurationVerbose, formatSubmittedAt } from './format';

function toPdfSafeText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/₹/g, 'Rs. ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/·/g, '|')
    .replace(/→/g, '->')
    .replace(/[^\x20-\x7E\n]/g, ' ');
}

export function downloadExamProgressPdf(report: ExamResultReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let y = 14;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Top Header Banner (Navy & Gold)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y, contentWidth, 26, 3, 3, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(marginX, y, contentWidth, 2.2, 'F');

  doc.setTextColor(253, 230, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NASH LAW | OFFICIAL EXAMINATION PROGRESS REPORT', marginX + 5, y + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(toPdfSafeText(report.examTitle), marginX + 5, y + 15.5);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    toPdfSafeText(
      `Submitted: ${formatSubmittedAt(report.submittedAt)} | Completion Time: ${formatDurationVerbose(report.durationSeconds)}`,
    ),
    marginX + 5,
    y + 21.5,
  );

  y += 32;

  // Candidate Details Card
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(252, 211, 77);
  doc.roundedRect(marginX, y, contentWidth, report.candidateDetails ? 24 : 16, 2.5, 2.5, 'FD');

  doc.setTextColor(120, 53, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CANDIDATE DETAILS', marginX + 4, y + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(toPdfSafeText(`Name: ${report.candidateName}`), marginX + 4, y + 11.5);

  if (report.candidateDetails) {
    const extras = [
      report.candidateDetails.email ? `Email: ${report.candidateDetails.email}` : '',
      report.candidateDetails.phone ? `Phone: ${report.candidateDetails.phone}` : '',
      report.candidateDetails.stateOrBarCouncil
        ? `Bar/College: ${report.candidateDetails.stateOrBarCouncil}`
        : '',
    ]
      .filter(Boolean)
      .join('   |   ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(toPdfSafeText(extras || 'Mock Exam Registration Verified'), marginX + 4, y + 18);
    y += 29;
  } else {
    y += 21;
  }

  // Score Summary Grid (4 KPI boxes)
  const boxGap = 3;
  const boxW = (contentWidth - boxGap * 3) / 4;
  const kpis = [
    {
      label: 'TOTAL SCORE',
      value: `${report.score} / ${report.maxScore}`,
      sub: `Accuracy: ${report.accuracyPercent}%`,
      fill: [239, 246, 255] as const,
      border: [147, 197, 253] as const,
      accent: [30, 58, 138] as const,
    },
    {
      label: 'BAR STATUS (45%)',
      value: report.qualifiedGeneral ? 'QUALIFIED' : 'NEEDS REVIEW',
      sub: `Pass Mark: ${Math.ceil(report.maxScore * 0.45)}/${report.maxScore}`,
      fill: report.qualifiedGeneral ? ([236, 253, 245] as const) : ([255, 241, 242] as const),
      border: report.qualifiedGeneral ? ([110, 231, 183] as const) : ([253, 164, 175] as const),
      accent: report.qualifiedGeneral ? ([6, 95, 70] as const) : ([159, 18, 57] as const),
    },
    {
      label: 'CORRECT / MISTAKES',
      value: `${report.correctCount} / ${report.incorrectCount}`,
      sub: `Skipped: ${report.unattemptedCount}`,
      fill: [248, 250, 252] as const,
      border: [203, 213, 225] as const,
      accent: [30, 41, 59] as const,
    },
    {
      label: 'TIME TAKEN',
      value: toPdfSafeText(formatDurationVerbose(report.durationSeconds)),
      sub: report.withdrawnCount > 0 ? `${report.withdrawnCount} Withdrawn` : 'Full Paper Timed',
      fill: [255, 251, 235] as const,
      border: [253, 224, 71] as const,
      accent: [146, 64, 14] as const,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (boxW + boxGap);
    doc.setFillColor(kpi.fill[0], kpi.fill[1], kpi.fill[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(x, y, boxW, 19, 2, 2, 'FD');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(kpi.label, x + 2.8, y + 5);

    doc.setTextColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(kpi.value, x + 2.8, y + 11.5);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(kpi.sub, x + 2.8, y + 16.5);
  });

  y += 26;

  // Subject-Wise Breakdown Table
  ensureSpace(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Subject-Wise Performance Breakdown', marginX, y);
  y += 4;

  // Table header
  doc.setFillColor(30, 58, 138);
  doc.rect(marginX, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Subject', marginX + 3, y + 4.8);
  doc.text('Valid', marginX + 102, y + 4.8, { align: 'right' });
  doc.text('Correct', marginX + 122, y + 4.8, { align: 'right' });
  doc.text('Mistakes', marginX + 143, y + 4.8, { align: 'right' });
  doc.text('Skipped', marginX + 162, y + 4.8, { align: 'right' });
  doc.text('Accuracy', marginX + contentWidth - 3, y + 4.8, { align: 'right' });
  y += 7;

  report.subjectBreakdown.forEach((row, idx) => {
    ensureSpace(7);
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, contentWidth, 6.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y + 6.5, marginX + contentWidth, y + 6.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(toPdfSafeText(row.subject).slice(0, 42), marginX + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(String(row.totalValid), marginX + 102, y + 4.5, { align: 'right' });
    doc.setTextColor(5, 150, 105);
    doc.text(String(row.correct), marginX + 122, y + 4.5, { align: 'right' });
    doc.setTextColor(225, 29, 72);
    doc.text(String(row.incorrect), marginX + 143, y + 4.5, { align: 'right' });
    doc.setTextColor(180, 83, 9);
    doc.text(String(row.unattempted), marginX + 162, y + 4.5, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${row.accuracyPercent}%`, marginX + contentWidth - 3, y + 4.5, { align: 'right' });
    y += 6.5;
  });

  y += 8;

  // Mistakes & How to Rectify Section
  const focusQuestions = report.review.filter(
    (q) => q.status === 'incorrect' || q.status === 'unattempted',
  );

  ensureSpace(16);
  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    `Mistake Audit & How to Rectify (${focusQuestions.length} Questions)`,
    marginX,
    y,
  );
  y += 5;

  if (focusQuestions.length === 0) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(110, 231, 183);
    doc.roundedRect(marginX, y, contentWidth, 12, 2, 2, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(
      'Zero mistakes or skipped questions! Full score achieved on this attempt.',
      marginX + 4,
      y + 7.5,
    );
    y += 16;
  } else {
    focusQuestions.forEach((item) => {
      const qLines = doc.splitTextToSize(
        toPdfSafeText(`Q${item.number}: ${item.question}`),
        contentWidth - 8,
      );
      const whyLines = doc.splitTextToSize(
        toPdfSafeText(`Why This Mistake Happens: ${item.rectification.whyMistakeHappens}`),
        contentWidth - 8,
      );
      const principleLines = doc.splitTextToSize(
        toPdfSafeText(`Legal Principle: ${item.rectification.principle}`),
        contentWidth - 8,
      );
      const rectifyLines = doc.splitTextToSize(
        toPdfSafeText(`How to Rectify: ${item.rectification.howToRectify}`),
        contentWidth - 8,
      );

      const estHeight =
        16 +
        qLines.length * 4 +
        whyLines.length * 3.8 +
        principleLines.length * 3.8 +
        rectifyLines.length * 3.8 +
        8;
      ensureSpace(Math.min(estHeight, pageHeight - 32));

      const isWrong = item.status === 'incorrect';
      doc.setFillColor(isWrong ? 255 : 255, isWrong ? 241 : 251, isWrong ? 242 : 235);
      doc.setDrawColor(isWrong ? 253 : 253, isWrong ? 164 : 224, isWrong ? 175 : 71);
      doc.roundedRect(marginX, y, contentWidth, estHeight, 2, 2, 'FD');

      let cy = y + 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isWrong ? 159 : 146, isWrong ? 18 : 64, isWrong ? 57 : 14);
      const headerLabel = `Q${item.number} | ${item.subject} | ${item.statuteRef} | ${
        isWrong ? 'INCORRECT' : 'UNATTEMPTED'
      }`;
      doc.text(toPdfSafeText(headerLabel).slice(0, 95), marginX + 4, cy);
      cy += 4.8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, marginX + 4, cy);
      cy += qLines.length * 4 + 1.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      const selectedStr = item.selectedOption ? `(${item.selectedOption})` : 'Not Attempted';
      const keyStr = item.correctAnswers.map((a) => `(${a})`).join(' or ');
      doc.text(
        `Your Answer: ${selectedStr}   |   Official Final Key: ${keyStr}`,
        marginX + 4,
        cy,
      );
      cy += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(159, 18, 57);
      doc.text(whyLines, marginX + 4, cy);
      cy += whyLines.length * 3.8 + 1.2;

      doc.setTextColor(51, 65, 85);
      doc.text(principleLines, marginX + 4, cy);
      cy += principleLines.length * 3.8 + 1.5;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      doc.text(rectifyLines, marginX + 4, cy);

      y += estHeight + 4;
    });
  }

  // Page numbers footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Nash Law | ${toPdfSafeText(report.candidateName)} | Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    );
  }

  const slugName = report.candidateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const prefix = report.mockMode === 'aibe-22-mock' ? 'AIBE_XXII_Mock' : report.examId.toUpperCase();
  doc.save(`NashLaw_${prefix}_${slugName || 'candidate'}_Progress.pdf`);
}

export function downloadMistakesPdf(report: ExamResultReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let y = 14;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Top Header Banner (Crimson / Slate & Gold)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y, contentWidth, 26, 3, 3, 'F');
  doc.setFillColor(225, 29, 72);
  doc.rect(marginX, y, contentWidth, 2.2, 'F');

  doc.setTextColor(253, 230, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NASH LAW | EXAM MISTAKES & RECTIFICATION SHEET', marginX + 5, y + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(toPdfSafeText(report.examTitle), marginX + 5, y + 15.5);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    toPdfSafeText(
      `Candidate: ${report.candidateName} | Submitted: ${formatSubmittedAt(report.submittedAt)}`,
    ),
    marginX + 5,
    y + 21.5,
  );

  y += 31;

  // 4-Box Summary Strip
  const boxGap = 3;
  const boxW = (contentWidth - boxGap * 3) / 4;
  const summaryBoxes = [
    {
      label: 'SCORE',
      value: `${report.score} / ${report.maxScore}`,
      sub: `Accuracy: ${report.accuracyPercent}%`,
      fill: [239, 246, 255] as const,
      border: [147, 197, 253] as const,
      accent: [30, 58, 138] as const,
    },
    {
      label: 'INCORRECT MISTAKES',
      value: String(report.incorrectCount),
      sub: 'Wrong Choices',
      fill: [255, 241, 242] as const,
      border: [253, 164, 175] as const,
      accent: [159, 18, 57] as const,
    },
    {
      label: 'UNATTEMPTED',
      value: String(report.unattemptedCount),
      sub: 'Skipped Questions',
      fill: [255, 251, 235] as const,
      border: [253, 224, 71] as const,
      accent: [146, 64, 14] as const,
    },
    {
      label: 'COMPLETION TIME',
      value: toPdfSafeText(formatDurationVerbose(report.durationSeconds)),
      sub: report.qualifiedGeneral ? 'Status: Qualified' : 'Status: Needs Review',
      fill: [248, 250, 252] as const,
      border: [203, 213, 225] as const,
      accent: [15, 23, 42] as const,
    },
  ];

  summaryBoxes.forEach((box, idx) => {
    const x = marginX + idx * (boxW + boxGap);
    doc.setFillColor(box.fill[0], box.fill[1], box.fill[2]);
    doc.setDrawColor(box.border[0], box.border[1], box.border[2]);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'FD');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(box.label, x + 2.8, y + 4.8);

    doc.setTextColor(box.accent[0], box.accent[1], box.accent[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(box.value, x + 2.8, y + 11);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(box.sub, x + 2.8, y + 15.8);
  });

  y += 24;

  const focusQuestions = report.review.filter(
    (q) => q.status === 'incorrect' || q.status === 'unattempted',
  );

  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `Detailed Mistakes & Skipped Questions (${focusQuestions.length} Items)`,
    marginX,
    y,
  );
  y += 5;

  if (focusQuestions.length === 0) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(110, 231, 183);
    doc.roundedRect(marginX, y, contentWidth, 16, 2.5, 2.5, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      'Zero mistakes and zero skipped questions! Congratulations on a spotless attempt.',
      marginX + 5,
      y + 9.5,
    );
  } else {
    focusQuestions.forEach((item) => {
      const qLines = doc.splitTextToSize(
        toPdfSafeText(`Q${item.number}: ${item.question}`),
        contentWidth - 8,
      );

      const optionLinesList = item.options.map((opt) => {
        const isCorrect = item.correctAnswers.includes(opt.label);
        const isPicked = item.selectedOption === opt.label;
        const tags: string[] = [];
        if (isCorrect) tags.push('[Official Key]');
        if (isPicked && !isCorrect) tags.push('[Your Pick]');
        const suffix = tags.length > 0 ? `  ${tags.join(' ')}` : '';
        return {
          isCorrect,
          isWrongPick: isPicked && !isCorrect,
          lines: doc.splitTextToSize(
            toPdfSafeText(`(${opt.label}) ${opt.text}${suffix}`),
            contentWidth - 12,
          ) as string[],
        };
      });

      const principleLines = doc.splitTextToSize(
        toPdfSafeText(`Legal Principle: ${item.rectification.principle}`),
        contentWidth - 8,
      );
      const whyLines = doc.splitTextToSize(
        toPdfSafeText(`Why This Mistake Happens: ${item.rectification.whyMistakeHappens}`),
        contentWidth - 8,
      );
      const rectifyLines = doc.splitTextToSize(
        toPdfSafeText(`How to Rectify: ${item.rectification.howToRectify}`),
        contentWidth - 8,
      );

      const optionsHeight = optionLinesList.reduce((sum, o) => sum + o.lines.length * 3.6 + 0.8, 0);
      const cardHeight =
        16 +
        qLines.length * 4 +
        optionsHeight +
        principleLines.length * 3.8 +
        whyLines.length * 3.8 +
        rectifyLines.length * 3.8 +
        10;

      ensureSpace(Math.min(cardHeight, pageHeight - 32));

      const isWrong = item.status === 'incorrect';
      doc.setFillColor(isWrong ? 255 : 255, isWrong ? 241 : 251, isWrong ? 242 : 235);
      doc.setDrawColor(isWrong ? 253 : 253, isWrong ? 164 : 224, isWrong ? 175 : 71);
      doc.roundedRect(marginX, y, contentWidth, cardHeight, 2, 2, 'FD');

      let cy = y + 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isWrong ? 159 : 146, isWrong ? 18 : 64, isWrong ? 57 : 14);
      const headerLabel = `Q${item.number} | ${item.subject} | ${item.statuteRef} | ${
        isWrong ? 'INCORRECT' : 'UNATTEMPTED'
      }`;
      doc.text(toPdfSafeText(headerLabel).slice(0, 95), marginX + 4, cy);
      cy += 4.8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, marginX + 4, cy);
      cy += qLines.length * 4 + 1.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      const selectedStr = item.selectedOption ? `(${item.selectedOption})` : 'Not Attempted';
      const keyStr = item.correctAnswers.map((a) => `(${a})`).join(' or ');
      doc.text(
        `Your Answer: ${selectedStr}   |   Official Final Key: ${keyStr}`,
        marginX + 4,
        cy,
      );
      cy += 4.5;

      optionLinesList.forEach((optEntry) => {
        doc.setFont('helvetica', optEntry.isCorrect || optEntry.isWrongPick ? 'bold' : 'normal');
        doc.setFontSize(7.8);
        if (optEntry.isCorrect) {
          doc.setTextColor(6, 95, 70);
        } else if (optEntry.isWrongPick) {
          doc.setTextColor(159, 18, 57);
        } else {
          doc.setTextColor(51, 65, 85);
        }
        doc.text(optEntry.lines, marginX + 6, cy);
        cy += optEntry.lines.length * 3.6 + 0.8;
      });

      cy += 1.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(principleLines, marginX + 4, cy);
      cy += principleLines.length * 3.8 + 1.2;

      doc.setTextColor(159, 18, 57);
      doc.text(whyLines, marginX + 4, cy);
      cy += whyLines.length * 3.8 + 1.2;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      doc.text(rectifyLines, marginX + 4, cy);

      y += cardHeight + 4;
    });
  }

  // Page numbers footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Nash Law Mistakes Sheet | ${toPdfSafeText(report.candidateName)} | Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    );
  }

  const slugName = report.candidateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const prefix = report.mockMode === 'aibe-22-mock' ? 'AIBE_XXII_Mock' : report.examId.toUpperCase();
  doc.save(`NashLaw_${prefix}_${slugName || 'candidate'}_Mistakes.pdf`);
}
