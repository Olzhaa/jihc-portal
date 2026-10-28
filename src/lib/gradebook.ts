import type { AttendanceStatus, GradeType } from "@prisma/client";
import { CATEGORIES, halfYear, missedHours, weightedAverage, workTypeLabel } from "./assessment";
import { toFivePoint } from "./grades";

/**
 * Бір топ пен бір пәннің бағалар кітабы (EduPage «Оценки» бетіндегідей) және
 * оны EduPage мен Smart Nation-ға қолмен көшіруге ыңғайлы екі CSV пішімі.
 */
export type BookGrade = { studentId: string; type: GradeType; value: number; weight: number; workType: string; date: Date };
export type BookAttendance = { studentId: string; status: AttendanceStatus; date: Date; hours: number };

export function buildGradebook(input: {
  students: { id: string; name: string }[];
  grades: BookGrade[];
  attendance: BookAttendance[];
  half: 1 | 2;
}) {
  const inHalf = <T extends { date: Date }>(rows: T[]) => rows.filter((r) => halfYear(r.date) === input.half);
  const grades = inHalf(input.grades).sort((a, b) => +a.date - +b.date);
  const attendance = inHalf(input.attendance);
  const rows = input.students.map((s) => {
    const g = grades.filter((x) => x.studentId === s.id);
    const avg = weightedAverage(g);
    return {
      student: s,
      categories: CATEGORIES.map((c) => ({ ...c, grades: g.filter((x) => x.type === c.type) })),
      avg,
      five: avg === null ? null : toFivePoint(avg),
      missed: missedHours(attendance.filter((a) => a.studentId === s.id)),
    };
  });
  const dates = [...new Set([...grades, ...attendance].map((x) => x.date.toISOString().slice(0, 10)))].sort();
  return { rows, dates, grades, attendance };
}

type Book = ReturnType<typeof buildGradebook>;

const fmt = (n: number | null) => (n === null ? "" : Math.round(n * 100) / 100);

/** EduPage «Оценки» кестесінің пішімі: категория бағандары, салмақты орташа, қорытынды. */
export function edupageRows(book: Book, half: 1 | 2) {
  const header = ["№", "Аты-жөні", ...CATEGORIES.map((c) => `${c.label} ${half}`), "Орташа (салмақты)", "Қорытынды (5 балл)"];
  const rows = book.rows.map((r, i) => [
    i + 1,
    r.student.name,
    ...r.categories.map((c) => c.grades.map((g) => (g.weight !== 1 ? `${g.value}(×${g.weight})` : String(g.value))).join(", ")),
    fmt(r.avg),
    r.five ?? "",
  ]);
  return [header, ...rows];
}

const ABSENCE_MARK: Partial<Record<AttendanceStatus, string>> = { ABSENT: "н", EXCUSED: "с", LATE: "к", LEFT_EARLY: "е" };

/**
 * Smart Nation журналының пішімі: әр баған — сабақ күні, ұяшықта балл және/немесе қатыспау белгісі
 * (н — себепсіз, с — себепті, к — кешікті, е — ерте кетті). Соңында жіберілген сағаттар.
 */
export function snationRows(book: Book) {
  const header = ["№", "Білім алушының аты-жөні", ...book.dates.map((d) => `${d.slice(8, 10)}.${d.slice(5, 7)}`), "Жіберген сағат", "оның ішінде себепсіз"];
  const rows = book.rows.map((r, i) => [
    i + 1,
    r.student.name,
    ...book.dates.map((d) => {
      const g = book.grades.filter((x) => x.studentId === r.student.id && x.date.toISOString().startsWith(d)).map((x) => String(x.value));
      const a = book.attendance.find((x) => x.studentId === r.student.id && x.date.toISOString().startsWith(d));
      const mark = a ? ABSENCE_MARK[a.status] : undefined;
      return [...g, mark].filter(Boolean).join(" ");
    }),
    r.missed.total,
    r.missed.unexcused,
  ]);
  return [header, ...rows];
}

/** Бағаның түрі мен коэффициенті туралы қысқа түсініктеме (ұяшыққа tooltip). */
export const gradeHint = (g: { workType: string; weight: number; date: Date }) =>
  `${g.date.toISOString().slice(0, 10)} · ${workTypeLabel(g.workType)}${g.weight !== 1 ? ` · ×${g.weight}` : ""}`;
