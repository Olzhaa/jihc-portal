import { prisma } from "./prisma";
import { academicYearRange } from "./assessment";
import { RESULTS_CONFIG_KEY, buildResults, cleanResultsConfig } from "./results";

/** Қорытынды баға формуласы; сақталмаған болса, әдепкі. */
export async function loadResultsConfig() {
  const row = await prisma.setting.findUnique({ where: { key: RESULTS_CONFIG_KEY } });
  return cleanResultsConfig(row?.value);
}

/** Бір топтың (немесе бір студенттің) оқу жылындағы қорытындылары. */
export async function loadResults(scope: { groupId: string } | { studentId: string }, year: number) {
  const students = await prisma.user.findMany({
    where: "groupId" in scope ? { groupId: scope.groupId, role: "STUDENT" } : { id: scope.studentId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const inScope = { studentId: { in: students.map((s) => s.id) } };
  const [config, grades, attendance, stored] = await Promise.all([
    loadResultsConfig(),
    prisma.grade.findMany({ where: { ...inScope, date: academicYearRange(year) }, select: { studentId: true, courseId: true, type: true, value: true, weight: true, date: true } }),
    prisma.attendance.findMany({
      where: { ...inScope, date: academicYearRange(year), status: { in: ["ABSENT", "EXCUSED"] } },
      select: { studentId: true, status: true, date: true, schedule: { select: { startPeriod: true, endPeriod: true } } },
    }),
    prisma.finalGrade.findMany({ where: { ...inScope, academicYear: year }, select: { studentId: true, courseId: true, period: true, value: true, manual: true } }),
  ]);
  const courseIds = [...new Set([...grades.map((g) => g.courseId), ...stored.map((s) => s.courseId)])];
  const courses = await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true, code: true } });
  const results = buildResults({
    year,
    students,
    courses,
    grades,
    attendance: attendance.map((a) => ({
      studentId: a.studentId,
      status: a.status,
      date: a.date,
      hours: a.schedule ? a.schedule.endPeriod - a.schedule.startPeriod + 1 : 1,
    })),
    stored,
    config,
  });
  return { results, config };
}

/** Таңдауға болатын оқу жылдары: ағымдағы және дерекқордағы ең ерте бағаға дейін (кемінде 3 жыл). */
export async function academicYears(current: number) {
  const first = await prisma.grade.findFirst({ orderBy: { date: "asc" }, select: { date: true } });
  const firstYear = first ? (first.date.getUTCMonth() >= 7 ? first.date.getUTCFullYear() : first.date.getUTCFullYear() - 1) : current;
  const from = Math.min(firstYear, current - 2);
  return Array.from({ length: current - from + 1 }, (_, i) => current - i);
}
