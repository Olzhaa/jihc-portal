import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradebookClient } from "./gradebook-client";

export default async function GradebookPage({ searchParams }: { searchParams: Promise<{ lesson?: string; course?: string }> }) {
  const user = await requireUser(STAFF_ROLES);
  const sp = await searchParams;
  const mine = await prisma.schedule.findMany({
    where: user.role === "DIRECTOR" ? {} : { teacherId: user.id },
    include: { course: true, group: true },
  });
  // One entry per group × subject, like EduPage's «Курс» picker.
  const pairs = [...new Map(mine.map((l) => [`${l.groupId}:${l.courseId}`, l])).values()].sort(
    (a, b) => a.group.name.localeCompare(b.group.name) || a.course.title.localeCompare(b.course.title),
  );
  const fromLesson = mine.find((l) => l.id === sp.lesson);
  const key = sp.course ?? (fromLesson ? `${fromLesson.groupId}:${fromLesson.courseId}` : undefined);
  const current = pairs.find((p) => `${p.groupId}:${p.courseId}` === key) ?? pairs[0];

  if (!current) {
    return (
      <div>
        <PageHeader title="Бағалар кітабы" />
        <p className="text-muted-foreground">Сізге бекітілген сабақ жоқ.</p>
      </div>
    );
  }

  const [students, grades, attendance, assignments] = await Promise.all([
    prisma.user.findMany({ where: { groupId: current.groupId, role: "STUDENT" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.grade.findMany({ where: { courseId: current.courseId, student: { groupId: current.groupId } } }),
    prisma.attendance.findMany({ where: { courseId: current.courseId, student: { groupId: current.groupId } }, include: { schedule: true } }),
    prisma.assignment.findMany({ where: { courseId: current.courseId, groupId: current.groupId } }),
  ]);
  const title = `${current.group.name} ${current.course.title}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Бағалар кітабы" description="EduPage «Оценки» сияқты: назначениелер, бағаны ұяшыққа жазу, салмақты орташа балл және EduPage мен Smart Nation-ға экспорт" />
      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Курс</label>
          <select name="course" defaultValue={`${current.groupId}:${current.courseId}`} className="flex h-9 rounded-md border border-border bg-card px-3 text-sm">
            {pairs.map((p) => (
              <option key={`${p.groupId}:${p.courseId}`} value={`${p.groupId}:${p.courseId}`}>
                {p.group.name} · {p.course.code ? `${p.course.code} ` : ""}
                {p.course.title}
              </option>
            ))}
          </select>
        </div>
        <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Ашу</button>
      </form>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {students.length} студент
              {current.group.snationCode && <> · Smart Nation: {current.group.snationCode}</>}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <GradebookClient
            key={title}
            courseId={current.courseId}
            groupId={current.groupId}
            editable={current.teacherId === user.id || MANAGER_ROLES.includes(user.role)}
            title={title}
            students={students}
            grades={grades.map((g) => ({
              id: g.id, studentId: g.studentId, type: g.type, value: g.value, weight: g.weight, workType: g.workType, date: g.date, assignmentId: g.assignmentId,
            }))}
            assignments={assignments.map((a) => ({ id: a.id, title: a.title, type: a.type, weight: a.weight, workType: a.workType, date: a.date }))}
            attendance={attendance.map((a) => ({
              studentId: a.studentId,
              status: a.status,
              date: a.date,
              hours: a.schedule ? a.schedule.endPeriod - a.schedule.startPeriod + 1 : 1,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
