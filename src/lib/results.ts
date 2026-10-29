import type { AttendanceStatus, FinalPeriod, GradeType } from "@prisma/client";
import { CATEGORIES, halfYear, inAcademicYear, missedHours, weightedAverage } from "./assessment";

/**
 * Smart Nation «Қорытындылар» (/control/summary/{group}) баламасы: топ бойынша әр пәннің
 * 1- және 2-жартыжылдық, жылдық және емтихан бағалары, жартыжылдар бойынша жіберілген сағаттар.
 *
 * Smart Nation қорытынды бағаны қалай есептейтіні жарияланбаған, сондықтан формула баптауға
 * шығарылған (ResultsConfig). Оны завуч «Қорытынды баға формуласы» бетінде оқу бөлімі бекіткен
 * ережеге сәйкес қояды. Бекітілген немесе қолмен енгізілген мәндер FinalGrade кестесінде сақталады
 * және есептелген мәннің орнына қолданылады.
 */

export const PERIODS: { key: FinalPeriod; label: string; short: string }[] = [
  { key: "SEMESTER1", label: "1-жартыжылдық", short: "1 жж" },
  { key: "SEMESTER2", label: "2-жартыжылдық", short: "2 жж" },
  { key: "YEAR", label: "Жылдық баға", short: "Жыл" },
  { key: "EXAM", label: "Емтихан бағасы", short: "Ем" },
];

export const periodLabel = (p: FinalPeriod) => PERIODS.find((x) => x.key === p)!.label;

export type Rounding = "round" | "ceil" | "floor" | "tenth";

export const ROUNDINGS: { key: Rounding; label: string }[] = [
  { key: "round", label: "Бүтінге дейін (84,5 → 85)" },
  { key: "ceil", label: "Үлкен бүтінге (84,1 → 85)" },
  { key: "floor", label: "Кіші бүтінге (84,9 → 84)" },
  { key: "tenth", label: "Ондық бөлшекке дейін (84,46 → 84,5)" },
];

export type ResultsConfig = {
  /** weighted: EduPage «Среднее» сияқты барлық бағаның коэффициентпен орташасы; categories: категориялардың үлесімен. */
  semesterMethod: "weighted" | "categories";
  /** Категория үлестері, % (semesterMethod = categories болғанда). Бағасы жоқ категория есепке алынбайды. */
  categoryShares: Record<GradeType, number>;
  /** «Емтихан немесе сынақ» категориясындағы бағалар жартыжылдық бағаға кіре ме. */
  examInSemester: boolean;
  /** Жылдық бағадағы 1-жартыжылдықтың үлесі, % (2-жартыжылдыққа 100 − осы). */
  sem1Share: number;
  /** true болса, жылдық баға екі жартыжылдық та қойылғанда ғана шығады; әйтпесе бар жартыжылдықтан. */
  yearNeedsBoth: boolean;
  /** Емтихан бағасының жылдық бағадағы үлесі, %. 0 — жылдық баға тек жартыжылдықтардан. */
  examShare: number;
  /** manual: емтихан бағасын завуч/мұғалім осы бетте қояды; category: жылдағы «Емтихан» категориясының орташасы. */
  examSource: "manual" | "category";
  rounding: Rounding;
  /** Осыдан төмен баға «қанағаттанарлықсыз» (қызылмен белгіленеді). */
  passMark: number;
};

export const DEFAULT_RESULTS_CONFIG: ResultsConfig = {
  semesterMethod: "weighted",
  categoryShares: { CURRENT: 50, MIDTERM: 30, EXAM: 20, ATTENDANCE: 0 },
  examInSemester: true,
  sem1Share: 50,
  yearNeedsBoth: false,
  examShare: 0,
  examSource: "manual",
  rounding: "round",
  passMark: 50,
};

export const RESULTS_CONFIG_KEY = "results.config";

const pct = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
};

/** Сақталған (немесе формадан келген) баптауды тексеріп, жетіспейтін өрістерді әдепкімен толтырады. */
export function cleanResultsConfig(raw: unknown): ResultsConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof ResultsConfig, unknown>>;
  const d = DEFAULT_RESULTS_CONFIG;
  const shares = (r.categoryShares && typeof r.categoryShares === "object" ? r.categoryShares : {}) as Partial<Record<GradeType, unknown>>;
  return {
    semesterMethod: r.semesterMethod === "categories" ? "categories" : "weighted",
    categoryShares: Object.fromEntries(CATEGORIES.map((c) => [c.type, pct(shares[c.type], d.categoryShares[c.type])])) as Record<GradeType, number>,
    examInSemester: typeof r.examInSemester === "boolean" ? r.examInSemester : d.examInSemester,
    sem1Share: pct(r.sem1Share, d.sem1Share),
    yearNeedsBoth: typeof r.yearNeedsBoth === "boolean" ? r.yearNeedsBoth : d.yearNeedsBoth,
    examShare: pct(r.examShare, d.examShare),
    examSource: r.examSource === "category" ? "category" : "manual",
    rounding: ROUNDINGS.some((x) => x.key === r.rounding) ? (r.rounding as Rounding) : d.rounding,
    passMark: pct(r.passMark, d.passMark),
  };
}

/** Формадағы қателер (сақтауға кедергі болатындар). */
export function checkResultsConfig(c: ResultsConfig): string | null {
  if (c.semesterMethod === "categories") {
    const used = CATEGORIES.filter((x) => c.examInSemester || x.type !== "EXAM");
    const sum = used.reduce((s, x) => s + c.categoryShares[x.type], 0);
    if (sum !== 100) return `Категория үлестерінің қосындысы 100% болуы керек (қазір ${sum}%)`;
  }
  return null;
}

export function roundGrade(v: number, mode: Rounding) {
  const x = Math.round(v * 1e6) / 1e6; // 84.49999999 сияқты қалдықтарды тазалау
  if (mode === "ceil") return Math.ceil(x);
  if (mode === "floor") return Math.floor(x);
  if (mode === "tenth") return Math.round(x * 10) / 10;
  return Math.round(x);
}

/** Формуланы адам оқитын түрде (баптау беті мен Excel файлының «Формула» парағы үшін). */
export function describeConfig(c: ResultsConfig): string[] {
  const cats = CATEGORIES.filter((x) => (c.examInSemester || x.type !== "EXAM") && c.categoryShares[x.type] > 0);
  const lines = [
    c.semesterMethod === "weighted"
      ? `Жартыжылдық баға = сол жартыжылдықтағы ${c.examInSemester ? "барлық" : "«Емтихан» категориясынан басқа"} бағалардың коэффициентпен орташасы: Σ(баға × коэффициент) / Σ коэффициент (EduPage «Среднее»).`
      : `Жартыжылдық баға = ${cats.map((x) => `${x.label} × ${c.categoryShares[x.type]}%`).join(" + ")}. Әр категория ішінде коэффициентпен орташа; бағасы жоқ категорияның үлесі қалғандарына бөлінеді.`,
  ];
  const s2 = 100 - c.sem1Share;
  const semPart = c.sem1Share === s2 ? "екі жартыжылдықтың орташасы" : `1-жартыжылдық × ${c.sem1Share}% + 2-жартыжылдық × ${s2}%`;
  lines.push(
    c.examShare > 0
      ? `Жылдық баға = (${semPart}) × ${100 - c.examShare}% + емтихан × ${c.examShare}%. Емтихан бағасы әлі жоқ болса, тек жартыжылдықтардан.`
      : `Жылдық баға = ${semPart}.`,
  );
  lines.push(
    c.yearNeedsBoth
      ? "Жылдық баға екі жартыжылдық бағасы да болғанда ғана шығады."
      : "Пән бір жартыжылдықта ғана өтсе, жылдық баға сол жартыжылдықтың бағасына тең.",
  );
  lines.push(
    c.examSource === "manual"
      ? "Емтихан бағасын завуч «Қорытындылар» бетінде қолмен қояды."
      : "Емтихан бағасы = оқу жылындағы «Емтихан немесе сынақ» категориясы бағаларының коэффициентпен орташасы.",
  );
  lines.push(`Дөңгелектеу: ${ROUNDINGS.find((x) => x.key === c.rounding)!.label.toLowerCase()}. Жылдық баға дөңгелектелген жартыжылдық бағалардан есептеледі.`);
  lines.push(`${c.passMark}-ден төмен баға қанағаттанарлықсыз деп белгіленеді.`);
  return lines;
}

export const yearLabel = (year: number) => `${year}–${year + 1}`;

export type ResultGrade = { studentId: string; courseId: string; type: GradeType; value: number; weight: number; date: Date };
export type ResultAttendance = { studentId: string; status: AttendanceStatus; date: Date; hours: number };
export type StoredFinal = { studentId: string; courseId: string; period: FinalPeriod; value: number; manual: boolean };
export type ResultCourse = { id: string; title: string; code: string | null };

/** Бір жартыжылдықтың бағасы (дөңгелектелмеген), бағасы жоқ болса null. */
export function semesterGrade(grades: { type: GradeType; value: number; weight: number }[], c: ResultsConfig) {
  const used = c.examInSemester ? grades : grades.filter((g) => g.type !== "EXAM");
  if (!used.length) return null;
  if (c.semesterMethod === "weighted") return weightedAverage(used);
  let sum = 0;
  let share = 0;
  for (const cat of CATEGORIES) {
    if (!c.examInSemester && cat.type === "EXAM") continue;
    const k = c.categoryShares[cat.type];
    const avg = weightedAverage(used.filter((g) => g.type === cat.type));
    if (avg === null || k <= 0) continue;
    sum += avg * k;
    share += k;
  }
  // Барлық бағалар үлесі 0 категорияда болса, қарапайым салмақты орташаға түседі.
  return share > 0 ? sum / share : weightedAverage(used);
}

/** Жылдық баға (дөңгелектелмеген) дайын жартыжылдық және емтихан бағаларынан. */
export function yearGrade(s1: number | null, s2: number | null, exam: number | null, c: ResultsConfig) {
  if (c.yearNeedsBoth && (s1 === null || s2 === null)) return null;
  let sem: number | null;
  if (s1 !== null && s2 !== null) sem = (s1 * c.sem1Share + s2 * (100 - c.sem1Share)) / 100;
  else sem = s1 ?? s2;
  if (sem === null) return null;
  if (c.examShare > 0 && exam !== null) return (sem * (100 - c.examShare) + exam * c.examShare) / 100;
  return sem;
}

export type ResultCell = {
  /** Журналдан формула бойынша есептелген мән. */
  computed: number | null;
  /** FinalGrade жазбасы (бекітілген немесе қолмен). */
  stored: { value: number; manual: boolean } | null;
  /** Көрсетілетін мән: жазба болса — сол, әйтпесе есептелгені. */
  value: number | null;
};

export type MissedSplit = { total: number; unexcused: number };

export type ResultsRow = {
  student: { id: string; name: string };
  cells: Record<string, Record<FinalPeriod, ResultCell>>;
  missed: { SEMESTER1: MissedSplit; SEMESTER2: MissedSplit; YEAR: MissedSplit };
  /** Таңдалған кезеңдердегі қанағаттанарлықсыз бағалар саны. */
  fails: Record<FinalPeriod, number>;
};

export type Results = {
  year: number;
  courses: ResultCourse[];
  rows: ResultsRow[];
  /** Пән × кезең бойынша топ орташасы және қанағаттанарлықсыздар саны. */
  summary: Record<string, Record<FinalPeriod, { avg: number | null; count: number; fails: number }>>;
  /** Сақталған мәндер саны мен барлық толтырылған ұяшықтар. */
  locked: { stored: number; manual: number; filled: number; stale: number };
};

const cellOf = (computed: number | null, stored: StoredFinal | undefined): ResultCell => ({
  computed,
  stored: stored ? { value: stored.value, manual: stored.manual } : null,
  value: stored ? stored.value : computed,
});

/**
 * Топтың бір оқу жылындағы қорытындылары. Кіріс деректері кез келген жылдан болуы мүмкін:
 * функция өзі оқу жылына сүзеді.
 */
export function buildResults(input: {
  year: number;
  students: { id: string; name: string }[];
  courses: ResultCourse[];
  grades: ResultGrade[];
  attendance: ResultAttendance[];
  stored: StoredFinal[];
  config: ResultsConfig;
}): Results {
  const { year, config: c } = input;
  const grades = input.grades.filter((g) => inAcademicYear(g.date, year));
  const attendance = input.attendance.filter((a) => inAcademicYear(a.date, year));
  const stored = new Map(input.stored.map((s) => [`${s.studentId}|${s.courseId}|${s.period}`, s]));
  const round = (v: number | null) => (v === null ? null : roundGrade(v, c.rounding));

  // Бағасы немесе сақталған қорытындысы бар пәндер ғана (кестеде бос баған болмас үшін).
  const used = new Set([...grades.map((g) => g.courseId), ...input.stored.map((s) => s.courseId)]);
  const courses = input.courses.filter((x) => used.has(x.id)).sort((a, b) => a.title.localeCompare(b.title, "kk"));

  const byPair = new Map<string, ResultGrade[]>();
  for (const g of grades) {
    const k = `${g.studentId}|${g.courseId}`;
    if (!byPair.has(k)) byPair.set(k, []);
    byPair.get(k)!.push(g);
  }

  const locked = { stored: 0, manual: 0, filled: 0, stale: 0 };
  const rows: ResultsRow[] = input.students.map((s) => {
    const cells: ResultsRow["cells"] = {};
    const fails = { SEMESTER1: 0, SEMESTER2: 0, YEAR: 0, EXAM: 0 } as Record<FinalPeriod, number>;
    for (const course of courses) {
      const g = byPair.get(`${s.id}|${course.id}`) ?? [];
      const get = (p: FinalPeriod) => stored.get(`${s.id}|${course.id}|${p}`);
      const s1 = cellOf(round(semesterGrade(g.filter((x) => halfYear(x.date) === 1), c)), get("SEMESTER1"));
      const s2 = cellOf(round(semesterGrade(g.filter((x) => halfYear(x.date) === 2), c)), get("SEMESTER2"));
      const examGrades = g.filter((x) => x.type === "EXAM");
      const exam = cellOf(c.examSource === "category" ? round(weightedAverage(examGrades)) : null, get("EXAM"));
      const yr = cellOf(round(yearGrade(s1.value, s2.value, exam.value, c)), get("YEAR"));
      const row = { SEMESTER1: s1, SEMESTER2: s2, YEAR: yr, EXAM: exam };
      cells[course.id] = row;
      for (const p of PERIODS) {
        const cell = row[p.key];
        if (cell.value !== null) {
          locked.filled++;
          if (cell.value < c.passMark) fails[p.key]++;
        }
        if (cell.stored) {
          locked.stored++;
          if (cell.stored.manual) locked.manual++;
          else if (cell.computed !== null && cell.computed !== cell.stored.value) locked.stale++;
        }
      }
    }
    const mine = attendance.filter((a) => a.studentId === s.id);
    return {
      student: s,
      cells,
      fails,
      missed: {
        SEMESTER1: missedHours(mine.filter((a) => halfYear(a.date) === 1)),
        SEMESTER2: missedHours(mine.filter((a) => halfYear(a.date) === 2)),
        YEAR: missedHours(mine),
      },
    };
  });

  const summary: Results["summary"] = {};
  for (const course of courses) {
    summary[course.id] = {} as Results["summary"][string];
    for (const p of PERIODS) {
      const values = rows.map((r) => r.cells[course.id][p.key].value).filter((v): v is number => v !== null);
      summary[course.id][p.key] = {
        avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
        count: values.length,
        fails: values.filter((v) => v < c.passMark).length,
      };
    }
  }
  return { year, courses, rows, summary, locked };
}

/** «Бекіту» кезінде жазылатын мәндер: есептелген, бірақ әлі сақталмаған ұяшықтар. */
export function cellsToLock(results: Results) {
  const out: { studentId: string; courseId: string; period: FinalPeriod; value: number }[] = [];
  for (const r of results.rows)
    for (const course of results.courses)
      for (const p of PERIODS) {
        const cell = r.cells[course.id][p.key];
        if (!cell.stored && cell.computed !== null) out.push({ studentId: r.student.id, courseId: course.id, period: p.key, value: cell.computed });
      }
  return out;
}

/** Ұяшыққа енгізілген қорытынды бағаны тексереді: бос — жазбаны өшіру, әйтпесе 0–100. */
export function parseFinalInput(raw: string): number | null | { error: string } {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  if (!Number.isFinite(v) || v < 0 || v > 100) return { error: "Баға 0 мен 100 аралығында болуы керек" };
  return Math.round(v * 10) / 10;
}

const fmt = (v: number | null) => (v === null ? "" : Math.round(v * 10) / 10);

/**
 * Smart Nation «Қорытындылар» кестесінің Excel пішімі: екі жолдық тақырып
 * (пән → 1 жж / 2 жж / Жыл / Ем), соңында жартыжылдар бойынша жіберілген сағаттар.
 */
export function resultsSheet(results: Results, periods: FinalPeriod[] = PERIODS.map((p) => p.key)) {
  const pList = PERIODS.filter((p) => periods.includes(p.key));
  const head1: (string | null)[] = ["№", "Білім алушының аты-жөні"];
  const head2: (string | null)[] = [null, null];
  const merges: [number, number, number, number][] = [
    [0, 0, 1, 0],
    [0, 1, 1, 1],
  ];
  for (const course of results.courses) {
    const col = head1.length;
    head1.push(course.code ? `${course.code} ${course.title}` : course.title, ...Array(pList.length - 1).fill(null));
    head2.push(...pList.map((p) => p.label));
    if (pList.length > 1) merges.push([0, col, 0, col + pList.length - 1]);
  }
  const missedCols: [keyof ResultsRow["missed"], string][] = [
    ["SEMESTER1", "1-жартыжылдық"],
    ["SEMESTER2", "2-жартыжылдық"],
    ["YEAR", "Жыл бойы"],
  ];
  for (const [, label] of missedCols) {
    const col = head1.length;
    head1.push(`Жіберген сағат: ${label}`, null);
    head2.push("барлығы", "оның ішінде себепсіз");
    merges.push([0, col, 0, col + 1]);
  }
  const body = results.rows.map((r, i) => [
    i + 1,
    r.student.name,
    ...results.courses.flatMap((course) => pList.map((p) => fmt(r.cells[course.id][p.key].value))),
    ...missedCols.flatMap(([k]) => [r.missed[k].total, r.missed[k].unexcused]),
  ]);
  const avgRow = [
    null,
    "Топ бойынша орташа",
    ...results.courses.flatMap((course) => pList.map((p) => fmt(results.summary[course.id][p.key].avg))),
    ...missedCols.flatMap(([k]) => {
      const n = results.rows.length || 1;
      return [fmt(results.rows.reduce((s, r) => s + r.missed[k].total, 0) / n), fmt(results.rows.reduce((s, r) => s + r.missed[k].unexcused, 0) / n)];
    }),
  ];
  return { header: [head1, head2], body, avgRow, merges, gradeCols: [2, 2 + results.courses.length * pList.length] as const };
}
