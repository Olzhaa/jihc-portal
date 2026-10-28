import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAYS, periodRange, dayName } from "@/lib/bells";
import { ATTENDANCE_SHORT, gradeTone } from "@/lib/grades";
import { journalColumns, pickPlan } from "@/lib/journal";
import { normalizeTopics } from "@/lib/syllabus";
import { formatDate, parseISODate, toISODate, cn } from "@/lib/utils";
import { JournalEditor } from "./journal-editor";

/** Most recent date (today or earlier) that falls on the given weekday. */
function lastDateFor(dayOfWeek: number) {
  const d = new Date();
  while (((d.getDay() + 6) % 7) + 1 !== dayOfWeek) d.setDate(d.getDate() - 1);
  return toISODate(d);
}

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ lesson?: string; date?: string }> }) {
  const user = await requireUser(STAFF_ROLES);
  const sp = await searchParams;
  const mine = await prisma.schedule.findMany({
    where: user.role === "DIRECTOR" ? {} : { teacherId: user.id },
    include: { course: true, group: true, room: true },
    orderBy: [{ dayOfWeek: "asc" }, { startPeriod: "asc" }],
  });
  const lesson = mine.find((l) => l.id === sp.lesson) ?? mine[0];

  if (!lesson) {
    return (
      <div>
        <PageHeader title="Журнал" />
        <p className="text-muted-foreground">Сізге бекітілген сабақ жоқ.</p>
      </div>
    );
  }

  const date = sp.date ?? lastDateFor(lesson.dayOfWeek);
  const day = parseISODate(date);
  const students = await prisma.user.findMany({ where: { groupId: lesson.groupId, role: "STUDENT", active: true }, orderBy: { name: "asc" } });
  const [attendance, grades, certs, history, record, syllabi] = await Promise.all([
    prisma.attendance.findMany({ where: { scheduleId: lesson.id, date: day } }),
    prisma.grade.findMany({ where: { scheduleId: lesson.id, date: day } }),
    prisma.medicalCertificate.findMany({ where: { status: "APPROVED", studentId: { in: students.map((s) => s.id) }, startDate: { lte: day }, endDate: { gte: day } } }),
    prisma.attendance.findMany({
      where: { courseId: lesson.courseId, student: { groupId: lesson.groupId } },
      orderBy: { date: "desc" },
      select: { studentId: true, date: true, status: true },
    }),
    prisma.lessonRecord.findUnique({ where: { scheduleId_date: { scheduleId: lesson.id, date: day } } }),
    prisma.syllabus.findMany({ where: { courseId: lesson.courseId, authorId: lesson.teacherId } }),
  ]);
  const plan = pickPlan(syllabi);
  const historyGrades = await prisma.grade.findMany({ where: { courseId: lesson.courseId, student: { groupId: lesson.groupId } } });

  const status = Object.fromEntries(attendance.map((a) => [a.studentId, a.status]));
  const dates = [...new Set(history.map((h) => h.date.toISOString().slice(0, 10)))].slice(0, 10).reverse();
  const sameDays = mine.filter((l) => l.groupId === lesson.groupId && l.courseId === lesson.courseId);

  return (
    <div className="space-y-6">
      <PageHeader title="Электронды журнал" description="Қатысу мен бағаны бір жерден белгілеңіз" />

      <form className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Сабақ</label>
          <select name="lesson" defaultValue={lesson.id} className="flex h-9 rounded-md border border-border bg-card px-3 text-sm">
            {mine.map((l) => (
              <option key={l.id} value={l.id}>
                {DAYS[l.dayOfWeek - 1]?.short} {periodRange(l.startPeriod, l.endPeriod)} · {l.group.name} · {l.course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Күні</label>
          <input type="date" name="date" defaultValue={date} max={toISODate(new Date())} className="flex h-9 rounded-md border border-border bg-card px-3 text-sm" />
        </div>
        <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Ашу</button>
      </form>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {lesson.group.name} · {lesson.course.code ? `${lesson.course.code} ` : ""}
              {lesson.course.title}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(day)}, {dayName(lesson.dayOfWeek)} · {periodRange(lesson.startPeriod, lesson.endPeriod)} · {lesson.room.name}
              {lesson.group.snationCode && <> · Smart Nation: {lesson.group.snationCode}</>}
            </p>
          </div>
          <Link href={`/teacher/gradebook?lesson=${lesson.id}`} className="text-xs text-primary hover:underline">
            Бағалар кітабы
          </Link>
        </CardHeader>
        <CardContent>
          {((day.getUTCDay() + 6) % 7) + 1 !== lesson.dayOfWeek ? (
            <p className="text-sm text-amber-600">
              Бұл сабақ {dayName(lesson.dayOfWeek).toLowerCase()} күндері өтеді. Басқа күнді таңдаңыз.
            </p>
          ) : (
            <JournalEditor
              key={`${lesson.id}-${date}`}
              lessonId={lesson.id}
              date={date}
              students={students.map((s) => ({ id: s.id, name: s.name }))}
              status={status}
              columns={journalColumns(grades)}
              record={{ topic: record?.topic ?? "", homework: record?.homework ?? "" }}
              planTopics={plan ? normalizeTopics(plan.topics).map((t) => ({ chapter: t.chapter, topic: t.topic })) : []}
              excused={certs.map((c) => c.studentId)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Соңғы сабақтар</CardTitle>
          <span className="text-xs text-muted-foreground">{sameDays.length} сабақ аптасына</span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card px-2 py-1 text-left">Студент</th>
                  {dates.map((d) => (
                    <th key={d} className="px-1 py-1 text-center font-medium text-muted-foreground">
                      <Link href={`?lesson=${lesson.id}&date=${d}`} className="hover:text-primary">
                        {d.slice(8, 10)}.{d.slice(5, 7)}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="sticky left-0 whitespace-nowrap bg-card px-2 py-1">{s.name}</td>
                    {dates.map((d) => {
                      const a = history.find((h) => h.studentId === s.id && h.date.toISOString().startsWith(d));
                      const g = historyGrades.filter((h) => h.studentId === s.id && h.date.toISOString().startsWith(d));
                      return (
                        <td key={d} className="px-1 py-1 text-center">
                          {g.length ? (
                            <span className={cn("font-semibold", gradeTone(g[0].value))}>{g.map((x) => x.value).join("/")}</span>
                          ) : a && a.status !== "PRESENT" ? (
                            <span className={a.status === "ABSENT" ? "text-red-600" : "text-muted-foreground"}>{ATTENDANCE_SHORT[a.status]}</span>
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
