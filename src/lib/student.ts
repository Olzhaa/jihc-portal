import { prisma } from "./prisma";
import { isoWeekday } from "./utils";
import { attendanceRate, gpaFromAverage } from "./grades";
import { academicYearRange, byCategory, weightedAverage } from "./assessment";
import { lessonsForGroup } from "./schedule";
import { announcementsFor } from "./announcements";

/** Everything a student (or their parent) sees on the overview page. */
export async function studentOverview(studentId: string) {
  const student = await prisma.user.findUniqueOrThrow({ where: { id: studentId }, include: { group: true } });
  const [lessons, grades, attendance, announcements] = await Promise.all([
    student.groupId ? lessonsForGroup(student.groupId) : Promise.resolve([]),
    prisma.grade.findMany({ where: { studentId, date: academicYearRange() }, include: { course: true }, orderBy: { date: "desc" } }),
    prisma.attendance.findMany({ where: { studentId, date: academicYearRange() }, select: { status: true } }),
    announcementsFor(student.groupId, 3),
  ]);
  const avg = weightedAverage(grades);
  return {
    student,
    lessons,
    todayLessons: lessons.filter((l) => l.dayOfWeek === isoWeekday(new Date())),
    recentGrades: grades.slice(0, 6).map((g) => ({ id: g.id, value: g.value, course: g.course.title, date: g.date })),
    avg,
    gpa: avg === null ? null : gpaFromAverage(avg),
    attendanceRate: attendanceRate(attendance.map((a) => a.status)),
    absences: attendance.filter((a) => a.status === "ABSENT").length,
    announcements,
  };
}

/** Per-course grade book for the current academic year: grades by EduPage category, weighted average and attendance. */
export async function studentGradebook(studentId: string) {
  const [grades, attendance] = await Promise.all([
    prisma.grade.findMany({ where: { studentId, date: academicYearRange() }, include: { course: true }, orderBy: { date: "asc" } }),
    prisma.attendance.findMany({ where: { studentId, date: academicYearRange() }, include: { course: true }, orderBy: { date: "asc" } }),
  ]);
  const courses = new Map<string, { id: string; title: string; code: string | null; color: string }>();
  for (const r of [...grades, ...attendance]) courses.set(r.course.id, r.course);
  return [...courses.values()]
    .map((course) => {
      const g = grades.filter((x) => x.courseId === course.id);
      const a = attendance.filter((x) => x.courseId === course.id);
      return {
        course,
        categories: byCategory(g),
        avg: weightedAverage(g),
        attendanceRate: attendanceRate(a.map((x) => x.status)),
        absences: a.filter((x) => x.status === "ABSENT").length,
        attendance: a,
      };
    })
    .sort((x, y) => x.course.title.localeCompare(y.course.title));
}
