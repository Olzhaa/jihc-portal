"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/curator";
import {
  CONTACT_FIELDS, attentionFlags, avgOf, isDue, lastMeeting, monthValue, semesterLabel, tasksForCourse, upcomingBirthdays, weekOf,
  type CuratorRecord, type CuratorStudent, type Flag,
} from "@/lib/curator";
import { GroupSwitcher, RecordDialog, useCurator } from "./context";

const fmt = fmtDate;

export function FlagBadges({ flags }: { flags: Flag[] }) {
  return (
    <>
      {flags.map((f) => <Badge key={f.label} variant={f.tone}>{f.label}</Badge>)}
    </>
  );
}

export function useAttention() {
  const { ws, today } = useCurator();
  return ws.students.map((s) => ({ student: s, flags: attentionFlags(ws, s, today) })).filter((x) => x.flags.length);
}

/** Open agreements from the contact log, oldest follow-up first. */
export function openAgreements(contacts: CuratorRecord[]) {
  return contacts
    .filter((c) => c.agreedStep && !c.agreementDone)
    .sort((a, b) => String(a.followUpDate ?? "9999").localeCompare(String(b.followUpDate ?? "9999")));
}

export function AgreementRow({ c }: { c: CuratorRecord }) {
  const { ws, today, save, href } = useCurator();
  const s = ws.students.find((x) => x.id === c.studentId);
  const overdue = typeof c.followUpDate === "string" && c.followUpDate < today;
  return (
    <label className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4" checked={false} onChange={() => save("contact", { ...c, agreementDone: true })} />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{String(c.agreedStep)}</div>
        <div className="text-xs text-muted-foreground">
          <Link href={href("/teacher/curator/students/view", { id: String(c.studentId) })} className="hover:text-primary">{s?.name}</Link> · {String(c.withWhom)} · {fmt(String(c.date))}
        </div>
      </div>
      {typeof c.followUpDate === "string" && (
        <span className={cn("shrink-0 text-xs", overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>{fmt(c.followUpDate)}</span>
      )}
    </label>
  );
}

export function StudentLink({ s }: { s: CuratorStudent }) {
  const { href } = useCurator();
  return <Link href={href("/teacher/curator/students/view", { id: s.id })} className="font-medium hover:text-primary">{s.name}</Link>;
}

export function Overview() {
  const { ws, today, save, href } = useCurator();
  const [log, setLog] = useState<Record<string, unknown> | null>(null);
  const attention = useAttention();
  const week = weekOf(today);
  const metThisWeek = new Set(ws.contacts.filter((c) => String(c.date) >= week.start && String(c.date) <= week.end && c.withWhom !== "Ата-ана").map((c) => c.studentId));
  const tasks = tasksForCourse(ws.tasks, ws.group.course);
  const due = tasks.filter((t) => isDue(t, today));
  const agreements = openAgreements(ws.contacts);
  const birthdays = upcomingBirthdays(ws.students, today);
  const value = monthValue(new Date(`${today}T00:00:00`));
  const upcoming = ws.events.filter((e) => typeof e.date === "string" && e.date >= today && e.status !== "Болмай қалды").slice(0, 3);
  const semester = semesterLabel(ws.group.course);
  const reflected = new Set(ws.reflections.filter((r) => r.semester === semester).map((r) => r.studentId));
  const groupAvg = avgOf(ws.students.map((s) => s.avg).filter((x): x is number => x !== null));
  const groupAtt = avgOf(ws.students.map((s) => s.attendance).filter((x): x is number => x !== null));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Кураторлық · ${ws.group.name}`}
        description={`${ws.group.course ? `${ws.group.course} курс · ` : ""}${ws.students.length} студент`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <GroupSwitcher />
            <Button onClick={() => setLog({ date: today, withWhom: "Студент" })}>
              <MessageSquarePlus className="h-4 w-4" /> Сөйлесуді жазу
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Назар керек" value={String(attention.length)} hint="студент" tone={attention.length ? "text-amber-600" : undefined} />
        <StatCard label="Осы аптада сөйлестім" value={`${metThisWeek.size}/${ws.students.length}`} hint="ұсыныс: аптасына 3–4" />
        <StatCard label="Мерзімі келген міндет" value={String(due.length)} hint="осы аптаға дейін" />
        <StatCard label="Орындалмаған келісім" value={String(agreements.length)} />
        <StatCard label="Топ көрсеткіші" value={groupAvg === null ? "—" : groupAvg.toFixed(1)} hint={`қатысу ${groupAtt === null ? "—" : `${Math.round(groupAtt)}%`}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>⚠️ Назар керек</CardTitle>
            <Link href={href("/teacher/curator/students", { filter: "attention" })} className="text-xs text-primary hover:underline">Барлығы</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {attention.length === 0 && <p className="text-sm text-muted-foreground">Барлық студентпен байланыс бар. 👏</p>}
            {attention.slice(0, 8).map(({ student, flags }) => {
              const last = lastMeeting(ws, student.id);
              return (
                <div key={student.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2.5 text-sm">
                  <StudentLink s={student} />
                  <FlagBadges flags={flags} />
                  <span className="ml-auto text-xs text-muted-foreground">{last ? `соңғы: ${fmt(last)}` : ""}</span>
                  <Button size="sm" variant="outline" onClick={() => setLog({ date: today, withWhom: "Студент", studentId: student.id })}>Жазу</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Айдың құндылығы</CardTitle>
            <Link href={href("/teacher/curator/events")} className="text-xs text-primary hover:underline">Жоспар</Link>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{value.name} · {value.group}</div>
              <div className="text-lg font-semibold">{value.value}</div>
              <p className="mt-1 text-muted-foreground">{value.event}</p>
              {value.days !== "—" && <p className="mt-1 text-xs text-muted-foreground">📅 {value.days}</p>}
            </div>
            {upcoming.length > 0 && (
              <div className="space-y-1 border-t border-border pt-3">
                <div className="text-xs font-medium text-muted-foreground">Алдағы іс-шаралар</div>
                {upcoming.map((e) => (
                  <div key={e.id} className="flex justify-between gap-2">
                    <span className="truncate">{String(e.title)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmt(String(e.date))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Осы аптаның міндеттері</CardTitle>
            <Link href={href("/teacher/curator/cycle")} className="text-xs text-primary hover:underline">Куратор циклы</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Цикл әлі бос. <Link href={href("/teacher/curator/cycle")} className="text-primary hover:underline">Шаблонды жүктеу</Link>
              </p>
            )}
            {tasks.length > 0 && due.length === 0 && <p className="text-sm text-muted-foreground">Бұл аптаға міндет қалмады.</p>}
            {due.slice(0, 7).map((t) => (
              <label key={t.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={false} onChange={() => save("task", { ...t, done: true })} />
                <span className="flex-1">{String(t.title)}</span>
                {typeof t.nextDue === "string" && <span className={cn("shrink-0 text-xs", t.nextDue < today ? "text-red-600" : "text-muted-foreground")}>{fmt(t.nextDue)}</span>}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⏳ Орындалмаған келісімдер</CardTitle>
            <Link href={href("/teacher/curator/contacts", { tab: "agreements" })} className="text-xs text-primary hover:underline">Барлығы</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {agreements.length === 0 && <p className="text-sm text-muted-foreground">Ашық келісім жоқ.</p>}
            {agreements.slice(0, 5).map((c) => <AgreementRow key={c.id} c={c} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🎂 Туған күндер</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {birthdays.length === 0 && <p className="text-muted-foreground">Алдағы 30 күнде туған күн жоқ.</p>}
            {birthdays.map((b) => (
              <div key={b.student.id} className="flex items-center justify-between gap-2">
                <StudentLink s={b.student} />
                <span className="text-xs text-muted-foreground">{b.inDays === 0 ? "бүгін! " : `${fmt(b.date).slice(0, 5)} · `}{b.age} жас</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 text-xs text-muted-foreground">
              Рефлексия ({semester}): {reflected.size}/{ws.students.length} студент толтырды
            </div>
          </CardContent>
        </Card>
      </div>

      <RecordDialog kind="contact" fields={CONTACT_FIELDS} record={log} title="Байланыс журналына жазу" onClose={() => setLog(null)} />
    </div>
  );
}
