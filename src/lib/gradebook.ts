import type { AttendanceStatus, GradeType } from "@prisma/client";
import { CATEGORIES, WEIGHTS, WORK_TYPES, halfYear, missedHours, weightedAverage, workTypeLabel } from "./assessment";
import { parseISODate } from "./utils";
import { toFivePoint } from "./grades";

/**
 * Бір топ пен бір пәннің бағалар кітабы (EduPage «Оценки» бетіндегідей) және
 * оны EduPage мен Smart Nation-ға қолмен көшіруге ыңғайлы екі CSV пішімі.
 */
export type BookGrade = {
  id: string;
  studentId: string;
  type: GradeType;
  value: number;
  weight: number;
  workType: string;
  date: Date;
  assignmentId?: string | null;
};
export type BookAttendance = { studentId: string; status: AttendanceStatus; date: Date; hours: number };
export type BookAssignment = { id: string; title: string; type: GradeType; weight: number; workType: string; date: Date };

/**
 * Кестедегі бір баған. EduPage-тегідей әр «назначение» — жеке баған; журналдан қойылған бағалар
 * күні мен категориясы бойынша бір бағанға жиналады (assignmentId жоқ).
 */
export type BookColumn = { key: string; assignmentId: string | null; title: string; type: GradeType; weight: number; workType: string; date: Date };

const day = (d: Date) => d.toISOString().slice(0, 10);
export const shortDate = (d: Date) => `${day(d).slice(8, 10)}.${day(d).slice(5, 7)}`;
const columnKey = (g: BookGrade) => g.assignmentId ?? `${day(g.date)}|${g.type}`;

function buildColumns(grades: BookGrade[], assignments: BookAssignment[]) {
  const cols = new Map<string, BookColumn>();
  for (const a of assignments) cols.set(a.id, { key: a.id, assignmentId: a.id, title: a.title, type: a.type, weight: a.weight, workType: a.workType, date: a.date });
  for (const g of grades) {
    const key = columnKey(g);
    if (!cols.has(key)) cols.set(key, { key, assignmentId: g.assignmentId ?? null, title: shortDate(g.date), type: g.type, weight: g.weight, workType: g.workType, date: g.date });
  }
  const order = (t: GradeType) => CATEGORIES.findIndex((c) => c.type === t);
  return [...cols.values()].sort((a, b) => order(a.type) - order(b.type) || +a.date - +b.date || a.title.localeCompare(b.title));
}

export function buildGradebook(input: {
  students: { id: string; name: string }[];
  grades: BookGrade[];
  attendance: BookAttendance[];
  assignments?: BookAssignment[];
  half: 1 | 2;
}) {
  const inHalf = <T extends { date: Date }>(rows: T[]) => rows.filter((r) => halfYear(r.date) === input.half);
  const grades = inHalf(input.grades).sort((a, b) => +a.date - +b.date);
  const attendance = inHalf(input.attendance);
  const columns = buildColumns(grades, inHalf(input.assignments ?? []));
  const rows = input.students.map((s) => {
    const g = grades.filter((x) => x.studentId === s.id);
    const avg = weightedAverage(g);
    return {
      student: s,
      categories: CATEGORIES.map((c) => ({ ...c, grades: g.filter((x) => x.type === c.type) })),
      cells: Object.fromEntries(g.map((x) => [columnKey(x), x])) as Record<string, BookGrade | undefined>,
      avg,
      five: avg === null ? null : toFivePoint(avg),
      missed: missedHours(attendance.filter((a) => a.studentId === s.id)),
    };
  });
  const dates = [...new Set([...grades, ...attendance].map((x) => day(x.date)))].sort();
  return { rows, columns, dates, grades, attendance };
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
  `${day(g.date)} · ${workTypeLabel(g.workType)}${g.weight !== 1 ? ` · ×${g.weight}` : ""}`;

/** EduPage «Цвета оценок» (JIHC): <49.4 қызыл, <69.4 қызғылт сары, <89.4 сары, қалғаны жасыл. */
export function edupageColor(value: number) {
  if (value < 49.4) return "#ffab91";
  if (value < 69.4) return "#ffcc80";
  if (value < 89.4) return "#fff59d";
  return "#a5d6a7";
}

/** Ұяшыққа енгізілген мәтінді тексереді: бос — бағаны өшіру, әйтпесе 0–100 сан. */
export function parseGradeInput(raw: string): number | null | { error: string } {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  if (!Number.isFinite(v) || v < 0 || v > 100) return { error: "Баға 0 мен 100 аралығында болуы керек" };
  return Math.round(v * 100) / 100;
}

export type AssignmentDraft = { title: string; type: GradeType; weight: number; workType: string; date: string };

/** «Назначение» формасын тексереді (клиентте де, серверде де). */
export function cleanAssignment(d: AssignmentDraft) {
  const title = d.title.trim();
  if (!title) return { error: "Атауын жазыңыз" };
  if (title.length > 80) return { error: "Атауы тым ұзын" };
  if (!CATEGORIES.some((c) => c.type === d.type)) return { error: "Категория дұрыс емес" };
  if (!(WEIGHTS as readonly number[]).includes(d.weight)) return { error: "Коэффициент дұрыс емес" };
  if (!WORK_TYPES.some((w) => w.key === d.workType)) return { error: "Smart Nation түрі дұрыс емес" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return { error: "Күнін таңдаңыз" };
  return { title, type: d.type, weight: d.weight, workType: d.workType, date: parseISODate(d.date) };
}
