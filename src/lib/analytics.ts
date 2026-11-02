import { prisma } from "./prisma";
import { average } from "./utils";
import { gpaFromAverage } from "./grades";
import { academicYearRange } from "./assessment";

/** College-wide numbers for the current academic year, used by the vice principal and director dashboards. */
export async function collegeStats() {
  const year = academicYearRange();
  const [groups, attendanceByGroup, gradesByStudent, students, absencesByStudent] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { students: true } } } }),
    prisma.$queryRaw<{ groupId: string; total: bigint; attended: bigint }[]>`
      SELECT u."groupId", COUNT(*) AS total,
             COUNT(*) FILTER (WHERE a.status IN ('PRESENT','LATE','LEFT_EARLY')) AS attended
      FROM "Attendance" a JOIN "User" u ON u.id = a."studentId"
      WHERE a."date" >= ${year.gte} AND a."date" < ${year.lt}
      GROUP BY u."groupId"`,
    prisma.grade.groupBy({ by: ["studentId"], where: { date: year }, _avg: { value: true } }),
    prisma.user.findMany({ where: { role: "STUDENT" }, include: { group: true } }),
    prisma.attendance.groupBy({ by: ["studentId"], where: { status: "ABSENT", date: year }, _count: { _all: true } }),
  ]);

  const avgByStudent = new Map(gradesByStudent.map((g) => [g.studentId, g._avg.value ?? 0]));
  const groupRows = groups.map((g) => {
    const att = attendanceByGroup.find((a) => a.groupId === g.id);
    const avgs = students.filter((s) => s.groupId === g.id).map((s) => avgByStudent.get(s.id)).filter((x): x is number => x !== undefined);
    const avg = average(avgs);
    return {
      id: g.id,
      name: g.name,
      students: g._count.students,
      attendance: att && Number(att.total) ? (Number(att.attended) / Number(att.total)) * 100 : null,
      avg,
      gpa: avg === null ? null : gpaFromAverage(avg),
    };
  });

  const totals = attendanceByGroup.reduce((s, a) => ({ t: s.t + Number(a.total), a: s.a + Number(a.attended) }), { t: 0, a: 0 });
  const allAvg = average([...avgByStudent.values()]);

  const truants = absencesByStudent
    .map((a) => ({ student: students.find((s) => s.id === a.studentId)!, absences: a._count._all }))
    .filter((x) => x.student && x.absences >= 5)
    .sort((a, b) => b.absences - a.absences);

  return {
    groups: groupRows,
    studentCount: students.length,
    attendance: totals.t ? (totals.a / totals.t) * 100 : null,
    avg: allAvg,
    gpa: allAvg === null ? null : gpaFromAverage(allAvg),
    truants,
  };
}

/** Attendance % per ISO week, oldest first. */
export async function weeklyAttendance(weeks = 8) {
  const rows = await prisma.$queryRaw<{ week: Date; total: bigint; attended: bigint }[]>`
    SELECT date_trunc('week', date) AS week, COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status IN ('PRESENT','LATE','LEFT_EARLY')) AS attended
    FROM "Attendance"
    WHERE date >= now() - make_interval(weeks => ${weeks}::int)
    GROUP BY 1 ORDER BY 1`;
  return rows.map((r) => ({ week: r.week, rate: (Number(r.attended) / Number(r.total)) * 100 }));
}
