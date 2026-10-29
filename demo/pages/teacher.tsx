import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard, AnnouncementList } from "@/components/widgets";
import { Timetable } from "@/components/timetable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Table, Th, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badges";
import { ReviewButtons } from "@/components/review-buttons";
import { DAYS, dayName, periodRange } from "@/lib/bells";
import { ATTENDANCE_SHORT, gradeTone } from "@/lib/grades";
import { JournalForm } from "@/components/journal-form";
import { GradebookTable } from "@/components/gradebook-table";
import { SyllabusEditor, SyllabusExport, type SyllabusDraft } from "@/components/syllabus-editor";
import { journalColumns, pickPlan, validateJournal, type JournalPayload } from "@/lib/journal";
import { cleanAssignment } from "@/lib/gradebook";
import { inAcademicYear } from "@/lib/assessment";
import { cleanSyllabus, normalizeDetails, normalizeTopics } from "@/lib/syllabus";
import { MANAGER_ROLES } from "@/lib/roles";
import { cn, formatDate, isoWeekday, parseISODate, toISODate } from "@/lib/utils";
import { ROOM_TYPE_LABEL, needsApproval } from "@/lib/rooms";
import { mutate, uid, useDb } from "../store";
import { announcementsFor, bookingConflicts, byId, lessonsForTeacher } from "../queries";
import { useRoute, navigate } from "../router";
import { useMe } from "../hooks";

export function Dashboard() {
  const me = useMe();
  const db = useDb();
  const lessons = lessonsForTeacher(db, me.id);
  const today = lessons.filter((l) => l.dayOfWeek === isoWeekday(new Date()));
  const groupIds = [...new Set(db.lessons.filter((l) => l.teacherId === me.id).map((l) => l.groupId))];
  const groups = groupIds.map((id) => byId(db.groups, id)!).sort((a, b) => a.name.localeCompare(b.name));
  const count = (gid: string) => db.users.filter((u) => u.groupId === gid).length;
  const syllabi = db.syllabi.filter((s) => s.authorId === me.id).sort((a, b) => +b.updatedAt - +a.updatedAt).slice(0, 4);
  const bookings = db.bookings.filter((b) => b.userId === me.id && b.endTime >= new Date()).sort((a, b) => +a.startTime - +b.startTime).slice(0, 3);
  const weekly = lessons.reduce((s, l) => s + l.endPeriod - l.startPeriod + 1, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Қайырлы күн, ${me.name.split(" ")[0]}!`} description="Мұғалім кабинеті" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Бүгінгі сабақтар" value={String(today.length)} />
        <StatCard label="Топтарым" value={String(groups.length)} hint={`${groups.reduce((s, g) => s + count(g.id), 0)} студент`} />
        <StatCard label="Апталық жүктеме" value={String(weekly)} hint="академиялық сағат" />
        <StatCard label="Силлабустар" value={String(syllabi.length)} hint={`${syllabi.filter((s) => s.status === "PENDING").length} тексерісте`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Бүгінгі сабақтар</CardTitle>
            <Link href="/teacher/schedule" className="text-xs text-primary hover:underline">Апталық кесте</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {today.length === 0 && <p className="text-sm text-muted-foreground">Бүгін сабақ жоқ.</p>}
            {today.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="h-10 w-1 rounded-full" style={{ background: l.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">{periodRange(l.startPeriod, l.endPeriod)} · {l.room}</div>
                  <div className="truncate font-medium">{l.sub} · {l.title}</div>
                </div>
                <Link href={`/teacher/journal?lesson=${l.id}`} className={buttonVariants({ size: "sm" })}>Журнал</Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Менің топтарым</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm">
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground">{count(g.id)} студент</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Силлабустар</CardTitle>
            <Link href="/teacher/syllabus" className="text-xs text-primary hover:underline">Барлығы</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {syllabi.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{byId(db.courses, s.courseId)?.title}</span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Брондауларым</CardTitle>
            <Link href="/teacher/bookings" className="text-xs text-primary hover:underline">Жаңа өтінім</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings.length === 0 && <p className="text-sm text-muted-foreground">Алдағы брондау жоқ.</p>}
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{byId(db.rooms, b.roomId)?.name} · {b.startTime.toLocaleDateString("kk-KZ")}</span>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <AnnouncementList items={announcementsFor(db, null, 3) as never} />
      </div>
    </div>
  );
}

export function Schedule() {
  const me = useMe();
  return (
    <div>
      <PageHeader title="Менің кестем" description={me.name} />
      <Timetable
        lessons={lessonsForTeacher(useDb(), me.id)}
        today={isoWeekday(new Date())}
        renderAction={(l) => (
          <Link href={`/teacher/journal?lesson=${l.id}`} className="shrink-0 rounded bg-white/70 px-1 font-semibold hover:bg-white">Журнал</Link>
        )}
      />
    </div>
  );
}

function lastDateFor(dayOfWeek: number) {
  const d = new Date();
  while (isoWeekday(d) !== dayOfWeek) d.setDate(d.getDate() - 1);
  return toISODate(d);
}

export function Journal() {
  const me = useMe();
  const db = useDb();
  const { query } = useRoute();
  const mine = db.lessons.filter((l) => me.role === "DIRECTOR" || l.teacherId === me.id).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startPeriod - b.startPeriod);
  const lesson = mine.find((l) => l.id === query.get("lesson")) ?? mine[0];
  if (!lesson) return <PageHeader title="Журнал" description="Сізге бекітілген сабақ жоқ." />;
  const date = query.get("date") ?? lastDateFor(lesson.dayOfWeek);
  const course = byId(db.courses, lesson.courseId)!;
  const group = byId(db.groups, lesson.groupId)!;
  const dayOk = ((parseISODate(date).getUTCDay() + 6) % 7) + 1 === lesson.dayOfWeek;

  return (
    <div className="space-y-6">
      <PageHeader title="Электронды журнал" description="Қатысу мен бағаны бір жерден белгілеңіз" />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate(`/teacher/journal?lesson=${fd.get("lesson")}&date=${fd.get("date")}`);
        }}
      >
        <div className="space-y-1">
          <Label>Сабақ</Label>
          <Select name="lesson" defaultValue={lesson.id} key={lesson.id}>
            {mine.map((l) => (
              <option key={l.id} value={l.id}>
                {DAYS[l.dayOfWeek - 1]?.short} {periodRange(l.startPeriod, l.endPeriod)} · {byId(db.groups, l.groupId)?.name} · {byId(db.courses, l.courseId)?.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Күні</Label>
          <Input type="date" name="date" defaultValue={date} key={date} max={toISODate(new Date())} />
        </div>
        <Button>Ашу</Button>
      </form>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{group.name} · {course.code ? `${course.code} ` : ""}{course.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(parseISODate(date))}, {dayName(lesson.dayOfWeek)} · {periodRange(lesson.startPeriod, lesson.endPeriod)} · {byId(db.rooms, lesson.roomId)?.name}
              {group.snationCode && <> · Smart Nation: {group.snationCode}</>}
            </p>
          </div>
          <Link href={`/teacher/gradebook?lesson=${lesson.id}`} className="text-xs text-primary hover:underline">Бағалар кітабы</Link>
        </CardHeader>
        <CardContent>
          {dayOk ? (
            <JournalEditor key={`${lesson.id}-${date}`} lessonId={lesson.id} date={date} />
          ) : (
            <p className="text-sm text-amber-600">Бұл сабақ {dayName(lesson.dayOfWeek).toLowerCase()} күндері өтеді. Басқа күнді таңдаңыз.</p>
          )}
        </CardContent>
      </Card>
      <JournalHistory lessonId={lesson.id} />
    </div>
  );
}

function JournalEditor({ lessonId, date }: { lessonId: string; date: string }) {
  const me = useMe();
  const db = useDb();
  const lesson = byId(db.lessons, lessonId)!;
  const day = parseISODate(date);
  const students = db.users.filter((u) => u.role === "STUDENT" && u.groupId === lesson.groupId).sort((a, b) => a.name.localeCompare(b.name));
  const excused = db.certificates.filter((c) => c.status === "APPROVED" && c.startDate <= day && c.endDate >= day).map((c) => c.studentId);
  const onDay = <T extends { scheduleId: string | null; date: Date }>(rows: T[]) => rows.filter((x) => x.scheduleId === lessonId && +x.date === +day);
  const record = onDay(db.lessonRecords)[0];
  const plan = pickPlan(db.syllabi.filter((s) => s.courseId === lesson.courseId && s.authorId === lesson.teacherId));

  function save(p: JournalPayload) {
    const invalid = validateJournal(p, day);
    if (invalid) return { error: invalid };
    const ids = new Set(students.map((s) => s.id));
    mutate((d) => {
      const topic = p.topic.trim() || null;
      const homework = p.homework.trim() || null;
      const rec = d.lessonRecords.find((x) => x.scheduleId === lessonId && +x.date === +day);
      if (rec) Object.assign(rec, { topic, homework });
      else d.lessonRecords.push({ id: uid(), scheduleId: lessonId, date: day, topic, homework });
      for (const r of p.rows.filter((x) => ids.has(x.studentId))) {
        const a = d.attendance.find((x) => x.studentId === r.studentId && x.scheduleId === lessonId && +x.date === +day);
        if (a) Object.assign(a, { status: r.status, markedById: me.id });
        else d.attendance.push({ id: uid(), studentId: r.studentId, courseId: lesson.courseId, scheduleId: lessonId, markedById: me.id, date: day, status: r.status });
        d.grades = d.grades.filter((x) => !(x.studentId === r.studentId && x.scheduleId === lessonId && +x.date === +day && x.type === p.gradeType));
        if (r.grade.trim() !== "")
          d.grades.push({ id: uid(), studentId: r.studentId, courseId: lesson.courseId, scheduleId: lessonId, givenById: me.id, value: Number(r.grade), type: p.gradeType, weight: p.weight, workType: p.workType, date: day, assignmentId: null });
      }
    });
    return { ok: true as const };
  }

  return (
    <JournalForm
      students={students.map((s) => ({ id: s.id, name: s.name }))}
      excused={excused}
      status={Object.fromEntries(onDay(db.attendance).map((a) => [a.studentId, a.status]))}
      columns={journalColumns(onDay(db.grades))}
      record={{ topic: record?.topic ?? "", homework: record?.homework ?? "" }}
      planTopics={plan ? plan.topics.map((t) => ({ chapter: t.chapter, topic: t.topic })) : []}
      onSave={save}
    />
  );
}

export function Gradebook() {
  const me = useMe();
  const db = useDb();
  const { query } = useRoute();
  const mine = db.lessons.filter((l) => me.role === "DIRECTOR" || l.teacherId === me.id);
  const pairs = [...new Map(mine.map((l) => [`${l.groupId}:${l.courseId}`, l])).values()].sort(
    (a, b) => byId(db.groups, a.groupId)!.name.localeCompare(byId(db.groups, b.groupId)!.name) || byId(db.courses, a.courseId)!.title.localeCompare(byId(db.courses, b.courseId)!.title),
  );
  const fromLesson = mine.find((l) => l.id === query.get("lesson"));
  const key = query.get("course") ?? (fromLesson ? `${fromLesson.groupId}:${fromLesson.courseId}` : undefined);
  const current = pairs.find((p) => `${p.groupId}:${p.courseId}` === key) ?? pairs[0];
  if (!current) return <PageHeader title="Бағалар кітабы" description="Сізге бекітілген сабақ жоқ." />;
  const group = byId(db.groups, current.groupId)!;
  const course = byId(db.courses, current.courseId)!;
  const students = db.users.filter((u) => u.role === "STUDENT" && u.groupId === group.id).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(students.map((s) => s.id));
  const title = `${group.name} ${course.title}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Бағалар кітабы" description="EduPage «Оценки» сияқты: назначениелер, бағаны ұяшыққа жазу, салмақты орташа балл және EduPage мен Smart Nation-ға экспорт" />
      <div className="space-y-1">
        <Label>Курс</Label>
        <Select value={`${current.groupId}:${current.courseId}`} onChange={(e) => navigate(`/teacher/gradebook?course=${e.target.value}`)} className="w-auto">
          {pairs.map((p) => (
            <option key={`${p.groupId}:${p.courseId}`} value={`${p.groupId}:${p.courseId}`}>
              {byId(db.groups, p.groupId)?.name} · {byId(db.courses, p.courseId)?.title}
            </option>
          ))}
        </Select>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {students.length} студент{group.snationCode && <> · Smart Nation: {group.snationCode}</>}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <GradebookTable
            key={title}
            title={title}
            students={students.map((s) => ({ id: s.id, name: s.name }))}
            grades={db.grades.filter((g) => g.courseId === course.id && ids.has(g.studentId) && inAcademicYear(g.date))}
            assignments={db.assignments.filter((a) => a.courseId === course.id && a.groupId === group.id && inAcademicYear(a.date))}
            actions={{
              setGrade: ({ studentId, column, gradeId, value }) =>
                mutate((d) => {
                  if (gradeId) {
                    d.grades = value === null ? d.grades.filter((g) => g.id !== gradeId) : d.grades.map((g) => (g.id === gradeId ? { ...g, value, givenById: me.id } : g));
                  } else if (value !== null) {
                    d.grades.push({
                      id: uid(), studentId, courseId: course.id, scheduleId: null, givenById: me.id, value, assignmentId: column.assignmentId,
                      type: column.type, weight: column.weight, workType: column.workType, date: column.date,
                    });
                  }
                }),
              saveAssignment: (input) => {
                const data = cleanAssignment(input);
                if ("error" in data) return { error: data.error };
                mutate((d) => {
                  if (input.id) {
                    d.assignments = d.assignments.map((a) => (a.id === input.id ? { ...a, ...data } : a));
                    d.grades = d.grades.map((g) => (g.assignmentId === input.id ? { ...g, type: data.type, weight: data.weight, workType: data.workType, date: data.date } : g));
                  } else {
                    d.assignments.push({ id: uid(), courseId: course.id, groupId: group.id, createdById: me.id, ...data });
                  }
                });
              },
              deleteAssignment: (id) =>
                mutate((d) => {
                  d.assignments = d.assignments.filter((a) => a.id !== id);
                  d.grades = d.grades.filter((g) => g.assignmentId !== id);
                }),
            }}
            attendance={db.attendance
              .filter((a) => a.courseId === course.id && ids.has(a.studentId) && inAcademicYear(a.date))
              .map((a) => {
                const l = byId(db.lessons, a.scheduleId);
                return { studentId: a.studentId, status: a.status, date: a.date, hours: l ? l.endPeriod - l.startPeriod + 1 : 1 };
              })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function JournalHistory({ lessonId }: { lessonId: string }) {
  const db = useDb();
  const lesson = byId(db.lessons, lessonId)!;
  const students = db.users.filter((u) => u.role === "STUDENT" && u.groupId === lesson.groupId).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(students.map((s) => s.id));
  const history = db.attendance.filter((a) => a.courseId === lesson.courseId && ids.has(a.studentId) && inAcademicYear(a.date));
  const grades = db.grades.filter((g) => g.courseId === lesson.courseId && ids.has(g.studentId) && inAcademicYear(g.date));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dates = [...new Set(history.map((h) => iso(h.date)))].sort().slice(-10);
  return (
    <Card>
      <CardHeader><CardTitle>Соңғы сабақтар</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card px-2 py-1 text-left">Студент</th>
                {dates.map((d) => (
                  <th key={d} className="px-1 py-1 text-center font-medium text-muted-foreground">
                    <Link href={`/teacher/journal?lesson=${lessonId}&date=${d}`} className="hover:text-primary">{d.slice(8, 10)}.{d.slice(5, 7)}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="sticky left-0 whitespace-nowrap bg-card px-2 py-1">{s.name}</td>
                  {dates.map((d) => {
                    const a = history.find((h) => h.studentId === s.id && iso(h.date) === d);
                    const g = grades.filter((h) => h.studentId === s.id && iso(h.date) === d);
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
  );
}

export function Syllabus() {
  const me = useMe();
  const db = useDb();
  const courses = db.courses.filter((c) => me.role === "DIRECTOR" || db.lessons.some((l) => l.courseId === c.id && l.teacherId === me.id));
  const mine = db.syllabi.filter((s) => s.authorId === me.id).sort((a, b) => +b.updatedAt - +a.updatedAt);

  function save(d: SyllabusDraft) {
    const clean = cleanSyllabus(d);
    if ("error" in clean) return { error: clean.error };
    mutate((x) => x.syllabi.push({ id: uid(), courseId: d.courseId, authorId: me.id, reviewerId: null, ...clean, status: d.submit ? "PENDING" : "DRAFT", reviewNote: null, updatedAt: new Date() }));
    return { ok: true as const };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Силлабус пен сабақ жоспары"
        description="Оқыту нәтижелері, тақырыптар мен сағаттарды бір рет енгізіңіз: завуч бекітеді, ал EduPage пен Smart Nation-ға дайын кесте ретінде көшіресіз"
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Жаңа силлабус</CardTitle></CardHeader>
          <CardContent>
            <SyllabusEditor courses={courses.map((c) => ({ id: c.id, title: c.title }))} onSave={save} />
          </CardContent>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {mine.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="truncate">{byId(db.courses, s.courseId)?.title}</CardTitle>
                  <CardDescription>{s.title}</CardDescription>
                </div>
                <StatusBadge status={s.status} />
              </CardHeader>
              <CardContent className="text-sm">
                <div className="text-muted-foreground">{s.topics.length} тақырып · {s.totalHours} сағат · {formatDate(s.updatedAt)}</div>
                {s.reviewNote && <div className="mt-2 rounded-md bg-muted p-2">Завуч: {s.reviewNote}</div>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-primary">Тақырыптар мен экспорт</summary>
                  <div className="mt-2">
                    <SyllabusExport title={`${byId(db.courses, s.courseId)?.title} ${s.title}`} courseTitle={byId(db.courses, s.courseId)?.title ?? ""} topics={normalizeTopics(s.topics)} details={normalizeDetails(s.details)} />
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

const fmt = new Intl.DateTimeFormat("kk-KZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Approve/reject for the room's responsible teacher or a manager; shared with the vice principal page. */
export function decideBooking(id: string, approve: boolean, actor: { id: string; role: string }) {
  mutate((d) => {
    const b = d.bookings.find((x) => x.id === id);
    const room = b && d.rooms.find((r) => r.id === b.roomId);
    if (!b || !room || b.status !== "PENDING") return;
    if (room.managerId !== actor.id && !MANAGER_ROLES.includes(actor.role as never)) return;
    if (approve && bookingConflicts(d, b.roomId, b.startTime, b.endTime, b.id, false).length) return;
    b.status = approve ? "APPROVED" : "REJECTED";
  });
}

export function Bookings() {
  const me = useMe();
  const db = useDb();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const rooms = [...db.rooms].sort((a, b) => a.name.localeCompare(b.name));
  const mine = db.bookings.filter((b) => b.userId === me.id).sort((a, b) => +b.startTime - +a.startTime);
  const incoming = db.bookings.filter((b) => b.status === "PENDING" && byId(db.rooms, b.roomId)?.managerId === me.id);
  const upcoming = db.bookings.filter((b) => b.status === "APPROVED" && b.endTime >= new Date()).sort((a, b) => +a.startTime - +b.startTime).slice(0, 8);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const room = byId(db.rooms, String(fd.get("roomId")))!;
    const date = String(fd.get("date"));
    const start = new Date(`${date}T${fd.get("from")}`);
    const end = new Date(`${date}T${fd.get("to")}`);
    const reason = String(fd.get("reason")).trim();
    if (!(end > start)) return setMsg({ text: "Аяқталу уақыты басталудан кейін болуы керек" });
    if (start < new Date()) return setMsg({ text: "Өткен уақытты брондауға болмайды" });
    const conflicts = bookingConflicts(db, room.id, start, end);
    if (conflicts.length) return setMsg({ text: `Бұл уақыт бос емес: ${conflicts.join("; ")}` });
    const auto = MANAGER_ROLES.includes(me.role) || room.managerId === me.id || !needsApproval(room.type);
    mutate((d) => d.bookings.push({ id: uid(), roomId: room.id, userId: me.id, startTime: start, endTime: end, reason, status: auto ? "APPROVED" : "PENDING" }));
    const manager = byId(db.users, room.managerId);
    setMsg({ ok: true, text: auto ? "Брондалды" : `Өтінім ${manager ? `жауапты мұғалімге (${manager.name})` : "завучқа"} жіберілді` });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ресурстарды брондау" description="Акт залы мен бос кабинеттерге өтінім беру" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Жаңа өтінім</CardTitle>
              <CardDescription>Кәдімгі кабинет бос болса бірден расталады. Акт залы, компьютер кабинеттері мен мұғалімдер бөлмесін жауапты мұғалім бекітеді.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="roomId">Бөлме</Label>
                <Select id="roomId" name="roomId" required>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({ROOM_TYPE_LABEL[r.type]}){r.capacity ? ` · ${r.capacity} орын` : ""}{r.type !== "CLASSROOM" ? ` · бекітеді: ${byId(db.users, r.managerId)?.name ?? "завуч"}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1"><Label htmlFor="date">Күні</Label><Input id="date" name="date" type="date" min={toISODate(new Date())} defaultValue={toISODate(new Date())} required /></div>
                <div className="space-y-1"><Label htmlFor="from">Басталуы</Label><Input id="from" name="from" type="time" defaultValue="18:00" required /></div>
                <div className="space-y-1"><Label htmlFor="to">Аяқталуы</Label><Input id="to" name="to" type="time" defaultValue="19:00" required /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="reason">Мақсаты</Label><Textarea id="reason" name="reason" required placeholder="мысалы, ата-аналар жиналысы" /></div>
              {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
              <Button>Өтінім беру</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6 lg:col-span-3">
          {incoming.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader>
                <div>
                  <CardTitle>Маған келген өтінімдер ({incoming.length})</CardTitle>
                  <CardDescription>Сіз жауапты бөлмелерге берілген брондау өтінімдері</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {incoming.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="text-sm">
                      <div className="font-medium">{byId(db.rooms, b.roomId)?.name} · {fmt.format(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}</div>
                      <div className="text-muted-foreground">{byId(db.users, b.userId)?.name}: {b.reason}</div>
                    </div>
                    <ReviewButtons action={async (approve) => decideBooking(b.id, approve, me)} withNote={false} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Менің өтінімдерім</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <thead><tr><Th>Бөлме</Th><Th>Уақыты</Th><Th>Мақсаты</Th><Th>Статус</Th><Th /></tr></thead>
                <tbody>
                  {mine.map((b) => (
                    <tr key={b.id}>
                      <Td className="font-medium">{byId(db.rooms, b.roomId)?.name}</Td>
                      <Td className="whitespace-nowrap">{fmt.format(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}</Td>
                      <Td className="max-w-48 truncate">{b.reason}</Td>
                      <Td><StatusBadge status={b.status} /></Td>
                      <Td>
                        {(b.status === "PENDING" || b.status === "APPROVED") && b.startTime > new Date() && (
                          <Button variant="ghost" size="sm" onClick={() => mutate((d) => { d.bookings.find((x) => x.id === b.id)!.status = "CANCELLED"; })}>Бас тарту</Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Алдағы бос емес уақыттар</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {upcoming.map((b) => (
                <div key={b.id} className="flex justify-between gap-3 rounded-md bg-muted px-3 py-2">
                  <span className="font-medium">{byId(db.rooms, b.roomId)?.name}</span>
                  <span className="text-muted-foreground">{fmt.format(b.startTime)} · {byId(db.users, b.userId)?.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
