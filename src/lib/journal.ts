import type { AttendanceStatus, GradeType } from "@prisma/client";
import { CATEGORIES, WEIGHTS, WORK_TYPES } from "./assessment";

export type JournalRow = { studentId: string; status: AttendanceStatus; grade: string };
export type JournalColumn = { weight: number; workType: string; grades: Record<string, string> };
export type JournalPayload = { gradeType: GradeType; weight: number; workType: string; topic: string; homework: string; rows: JournalRow[] };

/** Shared validation for both the server action and the demo store. */
export function validateJournal(p: JournalPayload, day: Date) {
  if (day.getTime() > Date.now()) return "Болашақ күнге белгі қоюға болмайды";
  if (!CATEGORIES.some((c) => c.type === p.gradeType)) return "Категория дұрыс емес";
  if (!WEIGHTS.includes(p.weight as (typeof WEIGHTS)[number])) return "Коэффициент дұрыс емес";
  if (!WORK_TYPES.some((w) => w.key === p.workType)) return "Баға түрі дұрыс емес";
  for (const r of p.rows) {
    if (r.grade.trim() === "") continue;
    const v = Number(r.grade);
    if (!Number.isFinite(v) || v < 0 || v > 100) return "Баға 0 мен 100 аралығында болуы керек";
  }
  return null;
}

/** Grades already given on one lesson, grouped into the journal's per-category columns. */
export function journalColumns(grades: { studentId: string; type: GradeType; value: number; weight: number; workType: string }[]) {
  const out: Partial<Record<GradeType, JournalColumn>> = {};
  for (const g of grades) {
    const c = (out[g.type] ??= { weight: g.weight, workType: g.workType, grades: {} });
    c.grades[g.studentId] = String(g.value);
  }
  return out;
}

/** Topics for «Жоспардан таңдау»: the approved syllabus if there is one, otherwise the latest. */
export function pickPlan<T extends { status: string; updatedAt: Date }>(syllabi: T[]) {
  return [...syllabi].sort((a, b) => Number(b.status === "APPROVED") - Number(a.status === "APPROVED") || +b.updatedAt - +a.updatedAt)[0];
}
