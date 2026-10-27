import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, TodayLessons, RecentGrades, AnnouncementList } from "@/components/widgets";
import { ATTENDANCE_LABEL, ATTENDANCE_SHORT, gradeTone, toFivePoint } from "@/lib/grades";
import { formatDate, cn } from "@/lib/utils";
import type { studentOverview, studentGradebook } from "@/lib/student";

type Overview = Awaited<ReturnType<typeof studentOverview>>;
type Gradebook = Awaited<ReturnType<typeof studentGradebook>>;

export function OverviewStats({ o }: { o: Overview }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Орташа балл" value={o.avg === null ? "—" : o.avg.toFixed(1)} hint="100 балдық шкала" tone={o.avg ? gradeTone(o.avg) : undefined} />
      <StatCard label="GPA" value={o.gpa === null ? "—" : o.gpa.toFixed(2)} hint="4.0 шкала" />
      <StatCard label="Қатысу" value={o.attendanceRate === null ? "—" : `${o.attendanceRate.toFixed(0)}%`} hint="Барлық сабақтар бойынша" />
      <StatCard label="Себепсіз қалған" value={String(o.absences)} hint="сабақ" tone={o.absences > 5 ? "text-red-600" : undefined} />
    </div>
  );
}

export function OverviewWidgets({ o, scheduleHref, gradesHref }: { o: Overview; scheduleHref: string; gradesHref: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TodayLessons lessons={o.todayLessons} href={scheduleHref} />
      <RecentGrades grades={o.recentGrades} href={gradesHref} />
      <AnnouncementList items={o.announcements} />
    </div>
  );
}

const ATT_TONE = {
  PRESENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  LATE: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  EXCUSED: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
} as const;

export function GradebookView({ book }: { book: Gradebook }) {
  if (!book.length) return <p className="text-muted-foreground">Әзірге баға жоқ.</p>;
  return (
    <div className="space-y-4">
      {book.map((row) => (
        <Card key={row.course.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full" style={{ background: row.course.color }} />
              <div>
                <CardTitle>{row.course.title}</CardTitle>
                {row.course.code && <div className="text-xs text-muted-foreground">{row.course.code}</div>}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
              {row.avg !== null && (
                <Badge variant="info">
                  Орташа: {row.avg.toFixed(1)} ({toFivePoint(row.avg)})
                </Badge>
              )}
              {row.attendanceRate !== null && <Badge>Қатысу {row.attendanceRate.toFixed(0)}%</Badge>}
              {row.absences > 0 && <Badge variant="danger">{row.absences} жоқ</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Ағымдағы бағалар</div>
              <div className="flex flex-wrap gap-1.5">
                {row.current.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                {row.current.map((g) => (
                  <span
                    key={g.id}
                    title={formatDate(g.date)}
                    className={cn("inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-1.5 text-sm font-semibold", gradeTone(g.value))}
                  >
                    {g.value}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Аралық: </span>
                <b>{row.midterm.map((g) => g.value).join(", ") || "—"}</b>
              </div>
              <div>
                <span className="text-muted-foreground">Сессиялық: </span>
                <b>{row.exam.map((g) => g.value).join(", ") || "—"}</b>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-primary">Қатысу тарихы</summary>
              <div className="mt-2 flex flex-wrap gap-1">
                {row.attendance.map((a) => (
                  <span key={a.id} title={`${formatDate(a.date)} · ${ATTENDANCE_LABEL[a.status]}`} className={cn("rounded px-1.5 py-0.5 text-xs", ATT_TONE[a.status])}>
                    {formatDate(a.date).slice(0, 5)} {ATTENDANCE_SHORT[a.status]}
                  </span>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
