import { prisma } from "./prisma";
import { academicYearRange } from "./assessment";
import { KIND_FIELDS, dateFields, groupCourse, studentStats, type CuratorRecord, type Reflection, type Workspace } from "./curator";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Prisma row → workspace record: @db.Date columns become YYYY-MM-DD strings. */
export function plain(row: Record<string, unknown>, dates: string[]) {
  const out: Record<string, unknown> = { ...row };
  for (const k of dates) if (out[k] instanceof Date) out[k] = iso(out[k] as Date);
  return out;
}

const D = (kind: keyof typeof KIND_FIELDS) => dateFields(KIND_FIELDS[kind]);

/** Groups the user curates, alphabetically. */
export function curatedGroups(userId: string) {
  return prisma.group.findMany({ where: { curatorId: userId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

/** Everything the curator workspace shows for one group, or null if the user curates nothing. */
export async function loadWorkspace(userId: string, groupId?: string): Promise<Workspace | null> {
  const groups = await curatedGroups(userId);
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  if (!group) return null;

  const students = await prisma.user.findMany({
    where: { groupId: group.id, role: "STUDENT" },
    orderBy: { name: "asc" },
    include: { studentProfile: true },
  });
  const ids = students.map((s) => s.id);
  const inGroup = { studentId: { in: ids } };
  const [guardians, contacts, tasks, events, achievements, books, tests, reflections, grades, attendance] = await Promise.all([
    prisma.guardian.findMany({ where: inGroup, orderBy: { name: "asc" } }),
    prisma.contactLog.findMany({ where: inGroup, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.curatorTask.findMany({ where: { groupId: group.id }, orderBy: { order: "asc" } }),
    prisma.classEvent.findMany({ where: { groupId: group.id }, orderBy: { date: "asc" } }),
    prisma.achievement.findMany({ where: inGroup, orderBy: { date: "desc" } }),
    prisma.bookRead.findMany({ where: inGroup, orderBy: { startedAt: "desc" } }),
    prisma.testResult.findMany({ where: inGroup, orderBy: { date: "desc" } }),
    prisma.reflection.findMany({ where: inGroup, orderBy: { createdAt: "desc" } }),
    prisma.grade.findMany({ where: { ...inGroup, date: academicYearRange() }, select: { studentId: true, value: true, course: { select: { title: true } } } }),
    prisma.attendance.findMany({ where: { ...inGroup, date: academicYearRange() }, select: { studentId: true, status: true, course: { select: { title: true } } } }),
  ]);
  const stats = studentStats(
    ids,
    grades.map((g) => ({ studentId: g.studentId, course: g.course.title, value: g.value })),
    attendance.map((a) => ({ studentId: a.studentId, course: a.course.title, status: a.status })),
  );

  return {
    group: { id: group.id, name: group.name, course: groupCourse(group.name) },
    groups,
    students: students.map((s) => {
      const profile: Record<string, unknown> = { ...s.studentProfile };
      delete profile.studentId;
      delete profile.updatedAt;
      return { id: s.id, name: s.name, email: s.email, iin: s.iin, profile: plain(profile, D("profile")), ...stats.get(s.id)! };
    }),
    guardians: guardians as CuratorRecord[],
    contacts: contacts.map((c) => plain(c, D("contact")) as CuratorRecord),
    tasks: tasks.map((t) => plain(t, D("task")) as CuratorRecord),
    events: events.map((e) => plain(e, D("event")) as CuratorRecord),
    achievements: achievements.map((a) => plain(a, D("achievement")) as CuratorRecord),
    books: books.map((b) => plain(b, D("book")) as CuratorRecord),
    tests: tests.map((t) => plain(t, D("test")) as CuratorRecord),
    reflections: reflections.map((r) => ({ ...r, createdAt: iso(r.createdAt) }) as unknown as Reflection),
  };
}
