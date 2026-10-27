import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lessonsForTeacher } from "@/lib/schedule";
import { announcementsFor } from "@/lib/announcements";
import { PageHeader } from "@/components/page-header";
import { StatCard, AnnouncementList } from "@/components/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badges";
import { periodRange } from "@/lib/bells";
import { isoWeekday } from "@/lib/utils";

export default async function TeacherDashboard() {
  const user = await requireUser(["TEACHER", "VICE_PRINCIPAL"]);
  const lessons = await lessonsForTeacher(user.id);
  const today = lessons.filter((l) => l.dayOfWeek === isoWeekday(new Date()));
  const [groups, syllabi, bookings, announcements] = await Promise.all([
    prisma.group.findMany({ where: { schedule: { some: { teacherId: user.id } } }, include: { _count: { select: { students: true } } }, orderBy: { name: "asc" } }),
    prisma.syllabus.findMany({ where: { authorId: user.id }, include: { course: true }, orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.booking.findMany({ where: { userId: user.id, endTime: { gte: new Date() } }, include: { room: true }, orderBy: { startTime: "asc" }, take: 3 }),
    announcementsFor(null, 3),
  ]);
  const weeklyPeriods = lessons.reduce((s, l) => s + l.endPeriod - l.startPeriod + 1, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Қайырлы күн, ${user.name?.split(" ")[0] ?? ""}!`} description="Мұғалім кабинеті" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Бүгінгі сабақтар" value={String(today.length)} />
        <StatCard label="Топтарым" value={String(groups.length)} hint={`${groups.reduce((s, g) => s + g._count.students, 0)} студент`} />
        <StatCard label="Апталық жүктеме" value={String(weeklyPeriods)} hint="академиялық сағат" />
        <StatCard label="Силлабустар" value={String(syllabi.length)} hint={`${syllabi.filter((s) => s.status === "PENDING").length} тексерісте`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Бүгінгі сабақтар</CardTitle>
            <Link href="/teacher/schedule" className="text-xs text-primary hover:underline">
              Апталық кесте
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {today.length === 0 && <p className="text-sm text-muted-foreground">Бүгін сабақ жоқ.</p>}
            {today.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="h-10 w-1 rounded-full" style={{ background: l.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">
                    {periodRange(l.startPeriod, l.endPeriod)} · {l.room}
                  </div>
                  <div className="truncate font-medium">
                    {l.sub} · {l.title}
                  </div>
                </div>
                <Link href={`/teacher/journal?lesson=${l.id}`} className={buttonVariants({ size: "sm" })}>
                  Журнал
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Менің топтарым</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm">
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground">{g._count.students} студент</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Силлабустар</CardTitle>
            <Link href="/teacher/syllabus" className="text-xs text-primary hover:underline">
              Барлығы
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {syllabi.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{s.course.title}</span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Брондауларым</CardTitle>
            <Link href="/teacher/bookings" className="text-xs text-primary hover:underline">
              Жаңа өтінім
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings.length === 0 && <p className="text-sm text-muted-foreground">Алдағы брондау жоқ.</p>}
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">
                  {b.room.name} · {b.startTime.toLocaleDateString("kk-KZ")}
                </span>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <AnnouncementList items={announcements} />
      </div>
    </div>
  );
}
