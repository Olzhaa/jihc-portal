import type { TimetableLesson } from "@/components/timetable";
import { BELLS } from "@/lib/bells";
import { ATTENDED, attendanceRate, gpaFromAverage } from "@/lib/grades";
import { byCategory, inAcademicYear, weightedAverage } from "@/lib/assessment";
import { average, isoWeekday } from "@/lib/utils";
import { buildResults, cleanResultsConfig } from "@/lib/results";
import type { Db, Lesson } from "./store";

// Ports of the server-side queries in src/lib, working on the in-browser database.

const byId = <T extends { id: string }>(arr: T[], id: string | null | undefined) => arr.find((x) => x.id === id);

function toTimetable(db: Db, rows: Lesson[], sub: "teacher" | "group"): TimetableLesson[] {
  return rows
    .map((r) => {
      const c = byId(db.courses, r.courseId)!;
      return {
        id: r.id, dayOfWeek: r.dayOfWeek, startPeriod: r.startPeriod, endPeriod: r.endPeriod,
        title: c.title, code: c.code, color: c.color, room: byId(db.rooms, r.roomId)?.name ?? "",
        sub: sub === "teacher" ? byId(db.users, r.teacherId)?.name ?? "" : byId(db.groups, r.groupId)?.name ?? "",
      };
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startPeriod - b.startPeriod);
}

export const lessonsForGroup = (db: Db, groupId: string) => toTimetable(db, db.lessons.filter((l) => l.groupId === groupId), "teacher");
export const lessonsForTeacher = (db: Db, teacherId: string) => toTimetable(db, db.lessons.filter((l) => l.teacherId === teacherId), "group");

export function findConflicts(db: Db, slot: Omit<Lesson, "id">) {
  return db.lessons
    .filter((o) => o.dayOfWeek === slot.dayOfWeek && o.startPeriod <= slot.endPeriod && o.endPeriod >= slot.startPeriod && (o.groupId === slot.groupId || o.teacherId === slot.teacherId || o.roomId === slot.roomId))
    .map((o) => {
      const what = [
        o.groupId === slot.groupId && `${byId(db.groups, o.groupId)?.name} тобы бос емес`,
        o.teacherId === slot.teacherId && `${byId(db.users, o.teacherId)?.name} бос емес`,
        o.roomId === slot.roomId && `${byId(db.rooms, o.roomId)?.name} аудиториясы бос емес`,
      ].filter(Boolean);
      return `${what.join(", ")} (${byId(db.courses, o.courseId)?.title}, ${o.startPeriod}–${o.endPeriod} қоңырау)`;
    });
}

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export function bookingConflicts(db: Db, roomId: string, start: Date, end: Date, excludeId?: string, includePending = true) {
  const bookings = db.bookings.filter(
    (b) => b.roomId === roomId && b.id !== excludeId && (b.status === "APPROVED" || (includePending && b.status === "PENDING")) && b.startTime < end && b.endTime > start,
  );
  const s = start.getHours() * 60 + start.getMinutes();
  const e = end.getHours() * 60 + end.getMinutes();
  const lessons = db.lessons.filter(
    (l) => l.roomId === roomId && l.dayOfWeek === isoWeekday(start) && minutes(BELLS[l.startPeriod - 1].start) < e && minutes(BELLS[l.endPeriod - 1].end) > s,
  );
  return [
    ...bookings.map((b) => `${byId(db.users, b.userId)?.name} брондаған (${b.status === "PENDING" ? "күтуде" : "расталған"})`),
    ...lessons.map((l) => `Сабақ: ${byId(db.groups, l.groupId)?.name} · ${byId(db.courses, l.courseId)?.title}`),
  ];
}

export function announcementsFor(db: Db, groupId: string | null | undefined, take?: number) {
  const rows = db.announcements
    .filter((a) => !groupId || a.groupIds.length === 0 || a.groupIds.includes(groupId))
    .sort((a, b) => Number(b.important) - Number(a.important) || +b.createdAt - +a.createdAt)
    .map((a) => ({ ...a, author: byId(db.users, a.authorId)!, groups: a.groupIds.map((g) => byId(db.groups, g)!).filter(Boolean) }));
  return take ? rows.slice(0, take) : rows;
}

export function studentOverview(db: Db, studentId: string) {
  const student = byId(db.users, studentId)!;
  const group = byId(db.groups, student.groupId);
  const lessons = student.groupId ? lessonsForGroup(db, student.groupId) : [];
  const grades = db.grades.filter((g) => g.studentId === studentId && inAcademicYear(g.date)).sort((a, b) => +b.date - +a.date);
  const attendance = db.attendance.filter((a) => a.studentId === studentId && inAcademicYear(a.date));
  const avg = weightedAverage(grades);
  return {
    student: { ...student, group },
    lessons,
    todayLessons: lessons.filter((l) => l.dayOfWeek === isoWeekday(new Date())),
    recentGrades: grades.slice(0, 6).map((g) => ({ id: g.id, value: g.value, course: byId(db.courses, g.courseId)!.title, date: g.date })),
    avg,
    gpa: avg === null ? null : gpaFromAverage(avg),
    attendanceRate: attendanceRate(attendance.map((a) => a.status)),
    absences: attendance.filter((a) => a.status === "ABSENT").length,
    announcements: announcementsFor(db, student.groupId, 3),
  };
}

export function studentGradebook(db: Db, studentId: string) {
  const grades = db.grades.filter((g) => g.studentId === studentId && inAcademicYear(g.date)).sort((a, b) => +a.date - +b.date);
  const attendance = db.attendance.filter((a) => a.studentId === studentId && inAcademicYear(a.date)).sort((a, b) => +a.date - +b.date);
  const ids = new Set([...grades, ...attendance].map((x) => x.courseId));
  return [...ids]
    .map((id) => {
      const course = byId(db.courses, id)!;
      const g = grades.filter((x) => x.courseId === id);
      const a = attendance.filter((x) => x.courseId === id);
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

export function collegeStats(all: Db) {
  // Current academic year only, like src/lib/analytics.ts.
  const db = { ...all, grades: all.grades.filter((g) => inAcademicYear(g.date)), attendance: all.attendance.filter((a) => inAcademicYear(a.date)) };
  const students = db.users.filter((u) => u.role === "STUDENT");
  const studentGroup = new Map(students.map((s) => [s.id, s.groupId]));
  const avgByStudent = new Map<string, number>();
  for (const s of students) {
    const a = average(db.grades.filter((g) => g.studentId === s.id).map((g) => g.value));
    if (a !== null) avgByStudent.set(s.id, a);
  }
  const groups = [...db.groups]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => {
      const att = db.attendance.filter((a) => studentGroup.get(a.studentId) === g.id);
      const avg = average(students.filter((s) => s.groupId === g.id).map((s) => avgByStudent.get(s.id)).filter((x): x is number => x !== undefined));
      return { id: g.id, name: g.name, students: students.filter((s) => s.groupId === g.id).length, attendance: attendanceRate(att.map((a) => a.status)), avg, gpa: avg === null ? null : gpaFromAverage(avg) };
    });
  const absences = new Map<string, number>();
  for (const a of db.attendance) if (a.status === "ABSENT") absences.set(a.studentId, (absences.get(a.studentId) ?? 0) + 1);
  const truants = [...absences]
    .filter(([, n]) => n >= 5)
    .map(([id, n]) => {
      const s = byId(db.users, id)!;
      return { student: { ...s, group: byId(db.groups, s.groupId) }, absences: n };
    })
    .sort((a, b) => b.absences - a.absences);
  const allAvg = average([...avgByStudent.values()]);
  return {
    groups,
    studentCount: students.length,
    attendance: attendanceRate(db.attendance.map((a) => a.status)),
    avg: allAvg,
    gpa: allAvg === null ? null : gpaFromAverage(allAvg),
    truants,
  };
}

export function weeklyAttendance(db: Db, weeks = 8) {
  const since = Date.now() - weeks * 7 * 86400000;
  const buckets = new Map<number, { t: number; a: number }>();
  for (const r of db.attendance) {
    if (+r.date < since) continue;
    const d = new Date(r.date);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const k = +d;
    const b = buckets.get(k) ?? { t: 0, a: 0 };
    b.t++;
    if (ATTENDED.includes(r.status)) b.a++;
    buckets.set(k, b);
  }
  return [...buckets].sort((a, b) => a[0] - b[0]).map(([k, b]) => ({ week: new Date(k), rate: (b.a / b.t) * 100 }));
}

export { byId };

/** Port of loadResults (src/lib/results-server.ts). */
export function demoResults(db: Db, scope: { groupId: string } | { studentId: string }, year: number) {
  const students = db.users
    .filter((u) => ("groupId" in scope ? u.role === "STUDENT" && u.groupId === scope.groupId : u.id === scope.studentId))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((u) => ({ id: u.id, name: u.name }));
  const ids = new Set(students.map((s) => s.id));
  const config = cleanResultsConfig(db.resultsConfig);
  const results = buildResults({
    year,
    students,
    courses: db.courses,
    grades: db.grades.filter((g) => ids.has(g.studentId)),
    attendance: db.attendance
      .filter((a) => ids.has(a.studentId))
      .map((a) => {
        const l = byId(db.lessons, a.scheduleId);
        return { studentId: a.studentId, status: a.status, date: a.date, hours: l ? l.endPeriod - l.startPeriod + 1 : 1 };
      }),
    stored: db.finalGrades.filter((f) => f.academicYear === year && ids.has(f.studentId)),
    config,
  });
  return { results, config };
}

/** Years that have grades, newest first (at least the current and two before). */
export function demoYears(db: Db, current: number) {
  let first = current;
  for (const g of db.grades) {
    const y = g.date.getUTCMonth() >= 7 ? g.date.getUTCFullYear() : g.date.getUTCFullYear() - 1;
    if (y < first) first = y;
  }
  const from = Math.min(first, current - 2);
  return Array.from({ length: current - from + 1 }, (_, i) => current - i);
}
