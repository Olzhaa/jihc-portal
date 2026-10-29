import type { AttendanceStatus, GradeType } from "@prisma/client";

/**
 * Бағалау ережелері EduPage пен Smart Nation-да қалай жүретініне сәйкес (2026-10-28 зерттеуі).
 * EduPage: бағалар категорияларға жиналады, әр бағаның коэффициенті бар, қорытынды — салмақты орташа.
 * Smart Nation: әр баға күнге қойылады және оның түрі болады (СОӨЖ, СӨЖ, зертханалық т.б.).
 */

/** EduPage-тегі колледж бекіткен категориялар; 1/2 — жартыжылдықтар. */
export const CATEGORIES: { type: GradeType; label: string; short: string }[] = [
  { type: "CURRENT", label: "Ағымдағы бағалар", short: "АБ" },
  { type: "MIDTERM", label: "Ағымдағы бақылау", short: "ББ" },
  { type: "EXAM", label: "Емтихан немесе сынақ", short: "Ем" },
  { type: "ATTENDANCE", label: "Сабаққа қатысуы", short: "СҚ" },
];

/** EduPage «Коэффициент» өрісінің мәндері. */
export const WEIGHTS = [0.25, 0.5, 1, 2, 3] as const;

/** Smart Nation журналындағы баға түрлері (pointTypes). Кілттері Smart Nation-дағыдай. */
export const WORK_TYPES: { key: string; label: string }[] = [
  { key: "simple", label: "Қарапайым бағалау" },
  { key: "examination", label: "Бақылау жұмысы" },
  { key: "laboratory", label: "Зертханалық" },
  { key: "practical", label: "Тәжірибелік" },
  { key: "ind_work_with_teacher", label: "СОӨЖ" },
  { key: "ind_work", label: "СӨЖ" },
  { key: "classroom", label: "Аудиториялық" },
  { key: "test", label: "Сынақ" },
  { key: "course", label: "Курстық жұмыс" },
  { key: "colloquium", label: "Коллоквиум" },
  { key: "education_practice", label: "Оқу практикасы" },
  { key: "production_practice", label: "Өндірістік практика" },
];

export const workTypeLabel = (key: string) => WORK_TYPES.find((w) => w.key === key)?.label ?? key;

/** Әр категорияға әдепкі Smart Nation түрі, мұғалім өзгерте алады. */
export const DEFAULT_WORK_TYPE: Record<GradeType, string> = {
  CURRENT: "simple",
  MIDTERM: "examination",
  EXAM: "test",
  ATTENDANCE: "simple",
};

/** Оқу жылының жартыжылдығы: қыркүйек–желтоқсан — 1, қаңтар–шілде — 2. */
export function halfYear(d: Date) {
  return d.getUTCMonth() >= 7 ? 1 : 2;
}

type Weighted = { value: number; weight?: number | null };

/** EduPage «Среднее число»: Σ(баға × коэффициент) / Σ коэффициент. */
export function weightedAverage(grades: Weighted[]) {
  let sum = 0;
  let w = 0;
  for (const g of grades) {
    const k = g.weight ?? 1;
    sum += g.value * k;
    w += k;
  }
  return w > 0 ? sum / w : null;
}

/** Бағаларды категория бойынша топтайды (бос категориялар да қайтады). */
export function byCategory<T extends { type: GradeType }>(grades: T[]) {
  return CATEGORIES.map((c) => ({ ...c, grades: grades.filter((g) => g.type === c.type) }));
}

/**
 * Жіберілген академиялық сағаттар (Smart Nation «Қорытындылар» бетіндегідей).
 * Бір сабақ бірнеше қоңырауды алса, әр қоңырау — бір сағат.
 */
export function missedHours(rows: { status: AttendanceStatus; hours: number }[]) {
  let total = 0;
  let unexcused = 0;
  for (const r of rows) {
    if (r.status === "ABSENT") {
      total += r.hours;
      unexcused += r.hours;
    } else if (r.status === "EXCUSED") total += r.hours;
  }
  return { total, unexcused };
}

/** Оқу жылы басталған жыл: қыркүйектен бастап ағымдағы жыл. */
export function academicYearStart(today = new Date()) {
  return today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
}

/** Оқу жылының шекаралары, Prisma `date` сүзгісі үшін: 1 тамыз — келесі жылдың 1 тамызы (halfYear-мен сәйкес). */
export function academicYearRange(year = academicYearStart()) {
  return { gte: new Date(Date.UTC(year, 7, 1)), lt: new Date(Date.UTC(year + 1, 7, 1)) };
}

export function inAcademicYear(d: Date, year = academicYearStart()) {
  const r = academicYearRange(year);
  return d >= r.gte && d < r.lt;
}

/**
 * EduPage топ атауынан Smart Nation атауын болжайды:
 * `{курс}{әріп}-{n}` → `{әріп}{n}-{түскен жыл}`, мысалы 2026 жылы 3F-3 → F3-2024.
 * Тек ұсыныс: нақты сәйкестікті завуч «Топтар» бетінде бекітеді.
 */
export function suggestSnationCode(edupageName: string, today = new Date()) {
  const m = edupageName.trim().match(/^(\d)\s*([A-ZА-ЯӘҒҚҢӨҰҮҺІ]+)\s*-\s*(\d+)$/i);
  if (!m) return null;
  const intake = academicYearStart(today) - Number(m[1]) + 1;
  return `${m[2].toUpperCase()}${m[3]}-${intake}`;
}

/** Smart Nation атауын тексереді: бос (сәйкестікті алып тастау) немесе «F3-2024» сияқты. */
export function checkSnationCode(raw: string): string | null | { error: string } {
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-ZА-ЯӘҒҚҢӨҰҮҺІ]+\d*-\d{4}$/.test(code)) return { error: "Пішімі: әріп, нөмір, сызықша, түскен жыл (мысалы F3-2024)" };
  return code;
}
