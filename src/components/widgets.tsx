import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { periodRange } from "@/lib/bells";
import { formatDate, cn } from "@/lib/utils";
import { gradeTone } from "@/lib/grades";
import type { TimetableLesson } from "./timetable";

export function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <Card className="p-5 md:p-6">
      <div className="eyebrow text-muted-foreground">{label}</div>
      <div className={cn("mt-3 text-[2.25rem] font-semibold leading-none tracking-[-0.03em] tabular-nums", tone)}>{value}</div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export function TodayLessons({ lessons, href }: { lessons: TimetableLesson[]; href: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Бүгінгі сабақтар</CardTitle>
        <Link href={href} className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors duration-300 hover:bg-primary/8">
          Толық кесте
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {lessons.length === 0 && <p className="text-sm text-muted-foreground">Бүгін сабақ жоқ.</p>}
        {lessons.map((l) => (
          <div key={l.id} className="flex gap-3 rounded-2xl bg-muted/60 p-3">
            <div className="w-1 shrink-0 rounded-full" style={{ background: l.color }} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-muted-foreground">
                {periodRange(l.startPeriod, l.endPeriod)} · {l.startPeriod}–{l.endPeriod} қоңырау
              </div>
              <div className="truncate font-medium">{l.title}</div>
              <div className="text-xs text-muted-foreground">
                {l.room} · {l.sub}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentGrades({ grades, href }: { grades: { id: string; value: number; course: string; date: Date }[]; href: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Соңғы бағалар</CardTitle>
        <Link href={href} className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors duration-300 hover:bg-primary/8">
          Журнал
        </Link>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {grades.length === 0 && <p className="text-sm text-muted-foreground">Баға әлі жоқ.</p>}
        {grades.map((g) => (
          <div key={g.id} className="flex items-center justify-between py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{g.course}</div>
              <div className="text-xs text-muted-foreground">{formatDate(g.date)}</div>
            </div>
            <span className={cn("text-lg font-bold", gradeTone(g.value))}>{g.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AnnouncementList({
  items,
}: {
  items: { id: string; title: string; content: string; important: boolean; createdAt: Date; author: { name: string } }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хабарландырулар</CardTitle>
        <Link href="/announcements" className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors duration-300 hover:bg-primary/8">
          Барлығы
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Хабарландыру жоқ.</p>}
        {items.map((a) => (
          <div key={a.id} className="rounded-2xl bg-muted/60 p-3.5">
            <div className="flex min-w-0 items-center gap-2">
              {a.important && <Badge variant="danger">Маңызды</Badge>}
              <span className="min-w-0 truncate font-medium">{a.title}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
            <div className="mt-1 text-xs text-muted-foreground">
              {a.author.name} · {formatDate(a.createdAt)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
