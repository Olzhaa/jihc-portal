import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { lessonsForGroup } from "@/lib/schedule";
import { PageHeader } from "@/components/page-header";
import { Timetable } from "@/components/timetable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LessonForm } from "./lesson-form";
import { deleteLesson } from "./actions";

export default async function TimetableEditor({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  await requireUser(MANAGER_ROLES);
  const { group } = await searchParams;
  const [groups, courses, teachers, rooms] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
    prisma.user.findMany({ where: { role: { in: ["TEACHER", "VICE_PRINCIPAL"] } }, orderBy: { name: "asc" } }),
    prisma.room.findMany({ where: { type: { not: "HALL" } }, orderBy: { name: "asc" } }),
  ]);
  const current = groups.find((g) => g.id === group) ?? groups[0];
  const lessons = current ? await lessonsForGroup(current.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Кесте генераторы" description="Топтың апталық кестесін құрыңыз. Топ, мұғалім және аудитория қақтығыстары автоматты тексеріледі." />
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`?group=${g.id}`}
            className={cn("rounded-full border border-border px-3 py-1 text-sm", g.id === current?.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
          >
            {g.name}
          </Link>
        ))}
      </div>
      {current && (
        <>
          <Timetable
            lessons={lessons}
            renderAction={(l) => (
              <form action={deleteLesson.bind(null, l.id)}>
                <button className="rounded bg-white/70 px-1 font-semibold text-red-700 hover:bg-white" title="Жою">
                  ✕
                </button>
              </form>
            )}
          />
          <Card>
            <CardHeader>
              <CardTitle>{current.name} тобына сабақ қосу</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonForm
                key={current.id}
                groupId={current.id}
                courses={courses.map((c) => ({ id: c.id, name: c.code ? `${c.code} ${c.title}` : c.title }))}
                teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
                rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
