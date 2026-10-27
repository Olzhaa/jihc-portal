import { useState } from "react";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/widgets";
import { Timetable as Grid } from "@/components/timetable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { BarList, ColumnChart } from "@/components/bar-list";
import { StatusBadge } from "@/components/status-badges";
import { ReviewButtons } from "@/components/review-buttons";
import { BELLS, DAYS } from "@/lib/bells";
import { gradeTone } from "@/lib/grades";
import { cn, formatDate } from "@/lib/utils";
import { mutate, uid, useDb, type Lesson, type Slip } from "../store";
import { bookingConflicts, byId, collegeStats, findConflicts, lessonsForGroup, weeklyAttendance } from "../queries";
import { useRoute } from "../router";
import { useMe } from "../hooks";
import { decideBooking } from "./teacher";
import { FileLink } from "./student";

const weekLabel = (d: Date) => d.toISOString().slice(5, 10).split("-").reverse().join(".");

export function Stats() {
  const db = useDb();
  const stats = collegeStats(db);
  const weekly = weeklyAttendance(db, 6);
  const pending = {
    certs: db.certificates.filter((c) => c.status === "PENDING").length,
    syllabi: db.syllabi.filter((c) => c.status === "PENDING").length,
    bookings: db.bookings.filter((c) => c.status === "PENDING").length,
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Статистика және аналитика" description="Колледж бойынша қатысу мен үлгерім" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Студенттер" value={String(stats.studentCount)} hint={`${stats.groups.length} топ`} />
        <StatCard label="Қатысу" value={stats.attendance === null ? "—" : `${stats.attendance.toFixed(1)}%`} />
        <StatCard label="Орташа балл / GPA" value={stats.avg === null ? "—" : `${stats.avg.toFixed(1)} / ${stats.gpa?.toFixed(2)}`} />
        <StatCard label="Прогул (5+ сабақ)" value={String(stats.truants.length)} tone={stats.truants.length ? "text-red-600" : undefined} hint="студент" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/academic-director/certificates", label: "Справкалар тексеруді күтуде", n: pending.certs },
          { href: "/academic-director/syllabi", label: "Силлабус модерацияда", n: pending.syllabi },
          { href: "/academic-director/bookings", label: "Брондау өтінімдері", n: pending.bookings },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary">
            <span className="text-sm">{x.label}</span>
            <span className={`text-2xl font-bold ${x.n ? "text-amber-600" : "text-muted-foreground"}`}>{x.n}</span>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Топтар бойынша қатысу</CardTitle></CardHeader>
          <CardContent><BarList rows={stats.groups.map((g) => ({ label: g.name, value: g.attendance }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Апталық қатысу динамикасы</CardTitle></CardHeader>
          <CardContent><ColumnChart points={weekly.map((w) => ({ label: weekLabel(w.week), value: w.rate }))} /></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Топтардың үлгерімі</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <thead><tr><Th>Топ</Th><Th>Студент</Th><Th>Орташа</Th><Th>GPA</Th><Th>Қатысу</Th></tr></thead>
              <tbody>
                {stats.groups.map((g) => (
                  <tr key={g.id}>
                    <Td className="font-medium">{g.name}</Td>
                    <Td>{g.students}</Td>
                    <Td className={g.avg ? gradeTone(g.avg) : ""}>{g.avg?.toFixed(1) ?? "—"}</Td>
                    <Td>{g.gpa?.toFixed(2) ?? "—"}</Td>
                    <Td>{g.attendance ? `${g.attendance.toFixed(0)}%` : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Сабақтан көп қалатындар</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <thead><tr><Th>Студент</Th><Th>Топ</Th><Th>Себепсіз</Th></tr></thead>
              <tbody>
                {stats.truants.length === 0 && <tr><Td colSpan={3} className="text-muted-foreground">Жоқ</Td></tr>}
                {stats.truants.slice(0, 10).map((t) => (
                  <tr key={t.student.id}>
                    <Td className="font-medium">{t.student.name}</Td>
                    <Td>{t.student.group?.name}</Td>
                    <Td className="font-semibold text-red-600">{t.absences}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GroupPills({ current }: { current: string }) {
  const db = useDb();
  return (
    <div className="flex flex-wrap gap-2">
      {[...db.groups].sort((a, b) => a.name.localeCompare(b.name)).map((g) => (
        <Link key={g.id} href={`?group=${g.id}`} className={cn("rounded-full border border-border px-3 py-1 text-sm", g.id === current ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{g.name}</Link>
      ))}
    </div>
  );
}

function useGroup() {
  const db = useDb();
  const { query } = useRoute();
  const sorted = [...db.groups].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.find((g) => g.id === query.get("group")) ?? sorted[0];
}

export function Timetable() {
  const db = useDb();
  const group = useGroup();
  const [state, setState] = useState<{ error?: string; conflicts?: string[]; ok?: boolean }>({});
  const [force, setForce] = useState(false);
  const teachers = db.users.filter((u) => u.role === "TEACHER" || u.role === "VICE_PRINCIPAL").sort((a, b) => a.name.localeCompare(b.name));
  const rooms = db.rooms.filter((r) => r.type !== "HALL").sort((a, b) => a.name.localeCompare(b.name));
  const courses = [...db.courses].sort((a, b) => a.title.localeCompare(b.title));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const slot: Omit<Lesson, "id"> = {
      groupId: group.id, courseId: String(fd.get("courseId")), teacherId: String(fd.get("teacherId")), roomId: String(fd.get("roomId")),
      dayOfWeek: Number(fd.get("dayOfWeek")), startPeriod: Number(fd.get("startPeriod")), endPeriod: Number(fd.get("endPeriod")),
    };
    if (slot.endPeriod < slot.startPeriod) return setState({ error: "Қоңырау аралығы дұрыс емес" });
    const conflicts = findConflicts(db, slot);
    if (conflicts.length && !force) return setState({ conflicts });
    mutate((d) => d.lessons.push({ id: uid(), ...slot }));
    setForce(false);
    setState({ ok: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Кесте генераторы" description="Топтың апталық кестесін құрыңыз. Топ, мұғалім және аудитория қақтығыстары автоматты тексеріледі." />
      <GroupPills current={group.id} />
      <Grid
        lessons={lessonsForGroup(db, group.id)}
        renderAction={(l) => (
          <button onClick={() => mutate((d) => { d.lessons = d.lessons.filter((x) => x.id !== l.id); })} className="rounded bg-white/70 px-1 font-semibold text-red-700 hover:bg-white" title="Жою">✕</button>
        )}
      />
      <Card>
        <CardHeader><CardTitle>{group.name} тобына сабақ қосу</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Пән" name="courseId" options={courses.map((c) => ({ id: c.id, name: c.code ? `${c.code} ${c.title}` : c.title }))} />
            <Field label="Мұғалім" name="teacherId" options={teachers} />
            <Field label="Аудитория" name="roomId" options={rooms} />
            <div className="space-y-1">
              <Label>Күні</Label>
              <Select name="dayOfWeek">{DAYS.map((d) => <option key={d.n} value={d.n}>{d.long}</option>)}</Select>
            </div>
            <div className="space-y-1">
              <Label>Басталуы (қоңырау)</Label>
              <Select name="startPeriod">{BELLS.map((b) => <option key={b.n} value={b.n}>{b.n} · {b.start}</option>)}</Select>
            </div>
            <div className="space-y-1">
              <Label>Аяқталуы (қоңырау)</Label>
              <Select name="endPeriod" defaultValue={2}>{BELLS.map((b) => <option key={b.n} value={b.n}>{b.n} · {b.end}</option>)}</Select>
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <Button>Сабақ қосу</Button>
              {state.conflicts && (
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} /> Қақтығысқа қарамай қосу</label>
              )}
            </div>
            {state.error && <p className="text-sm text-red-600 sm:col-span-full">{state.error}</p>}
            {state.conflicts && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300 sm:col-span-full">
                <b>Қақтығыс табылды:</b>
                <ul className="mt-1 list-disc pl-5">{state.conflicts.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
            {state.ok && <p className="text-sm text-emerald-600 sm:col-span-full">Сабақ қосылды</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, name, options }: { label: string; name: string; options: { id: string; name: string }[] }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select name={name} required>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>
    </div>
  );
}

export function Certificates() {
  const me = useMe();
  const db = useDb();
  const certs = [...db.certificates].sort((a, b) => +b.createdAt - +a.createdAt);
  const pending = certs.filter((c) => c.status === "PENDING");
  const done = certs.filter((c) => c.status !== "PENDING");
  const student = (id: string) => byId(db.users, id)!;
  const groupName = (id: string) => byId(db.groups, student(id).groupId)?.name;

  async function review(id: string, approve: boolean, form: FormData) {
    mutate((d) => {
      const c = d.certificates.find((x) => x.id === id)!;
      Object.assign(c, { status: approve ? "APPROVED" : "REJECTED", reviewerId: me.id, reviewNote: String(form.get("note") ?? "").trim() || null });
      // An approved certificate turns the covered absences into excused ones.
      if (approve) for (const a of d.attendance) if (a.studentId === c.studentId && a.status === "ABSENT" && a.date >= c.startDate && a.date <= c.endDate) a.status = "EXCUSED";
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Медициналық анықтамалар" description="Расталған анықтама сол күндердегі «жоқ» белгілерін «себепті» етеді" />
      <Card>
        <CardHeader><CardTitle>Тексеруді күтуде ({pending.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Барлығы тексерілді.</p>}
          {pending.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="font-medium">{student(c.studentId).name} <span className="text-muted-foreground">· {groupName(c.studentId)}</span></div>
                <div className="text-sm text-muted-foreground">{formatDate(c.startDate)} – {formatDate(c.endDate)} · <FileLink name={c.fileName} data={c.fileData} /></div>
              </div>
              <ReviewButtons action={(approve, form) => review(c.id, approve, form)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Тарих</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th>Студент</Th><Th>Кезең</Th><Th>Статус</Th><Th>Тексерген</Th></tr></thead>
            <tbody>
              {done.map((c) => (
                <tr key={c.id}>
                  <Td>{student(c.studentId).name} · {groupName(c.studentId)}</Td>
                  <Td>{formatDate(c.startDate)} – {formatDate(c.endDate)}</Td>
                  <Td><StatusBadge status={c.status} />{c.reviewNote && <div className="text-xs text-muted-foreground">{c.reviewNote}</div>}</Td>
                  <Td>{byId(db.users, c.reviewerId)?.name}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function Syllabi() {
  const me = useMe();
  const db = useDb();
  const rows = db.syllabi.filter((s) => s.status !== "DRAFT").sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING") || +b.updatedAt - +a.updatedAt);
  return (
    <div className="space-y-4">
      <PageHeader title="Силлабус модерациясы" description="Мұғалімдер жіберген силлабустарды тексеріп, бекітіңіз" />
      {rows.map((s) => {
        const c = byId(db.courses, s.courseId)!;
        return (
          <Card key={s.id}>
            <CardHeader>
              <div>
                <CardTitle>{c.code ? `${c.code} ` : ""}{c.title}</CardTitle>
                <CardDescription>{s.title} · {byId(db.users, s.authorId)?.name} · {formatDate(s.updatedAt)}</CardDescription>
              </div>
              <StatusBadge status={s.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <details open={s.status === "PENDING"}>
                <summary className="cursor-pointer text-sm text-primary">{s.topics.length} тақырып · {s.totalHours} сағат</summary>
                <ol className="mt-2 space-y-1 text-sm">
                  {s.topics.map((t) => (
                    <li key={t.week} className="flex justify-between gap-3 border-b border-border py-1">
                      <span><span className="text-muted-foreground">{t.week}.</span> {t.topic}</span>
                      <span className="shrink-0 text-muted-foreground">{t.hours} сағ</span>
                    </li>
                  ))}
                </ol>
              </details>
              {s.status === "PENDING" ? (
                <ReviewButtons
                  action={async (approve, form) =>
                    mutate((d) => {
                      Object.assign(d.syllabi.find((x) => x.id === s.id)!, { status: approve ? "APPROVED" : "REJECTED", reviewerId: me.id, reviewNote: String(form.get("note") ?? "").trim() || null });
                    })
                  }
                />
              ) : (
                s.reviewNote && <p className="text-sm text-muted-foreground">Түсініктеме: {s.reviewNote}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

const fmt = new Intl.DateTimeFormat("kk-KZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function Bookings() {
  const me = useMe();
  const db = useDb();
  const recent = db.bookings.filter((b) => +b.endTime >= Date.now() - 7 * 86400000).sort((a, b) => +a.startTime - +b.startTime);
  const pending = recent.filter((b) => b.status === "PENDING");
  return (
    <div className="space-y-6">
      <PageHeader title="Брондау өтінімдері" description="Жалпы шолу. Әдетте өтінімді бөлменің жауапты мұғалімі бекітеді, завуч кез келгенін бекіте алады." />
      <Card>
        <CardHeader><CardTitle>Бекітуді күтуде ({pending.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Жаңа өтінім жоқ.</p>}
          {pending.map((b) => {
            const room = byId(db.rooms, b.roomId)!;
            const conflicts = bookingConflicts(db, b.roomId, b.startTime, b.endTime, b.id);
            return (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <div className="font-medium">{room.name} · {fmt.format(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}</div>
                  <div className="text-sm text-muted-foreground">{byId(db.users, b.userId)?.name}: {b.reason}</div>
                  <div className="text-xs text-muted-foreground">Жауапты: {byId(db.users, room.managerId)?.name ?? "завуч"}</div>
                  {conflicts.length > 0 && <div className="mt-1 text-xs text-red-600">Қақтығыс: {conflicts.join("; ")}</div>}
                </div>
                <ReviewButtons action={async (approve) => decideBooking(b.id, approve, me)} withNote={false} />
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Барлық брондаулар</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th>Бөлме</Th><Th>Уақыты</Th><Th>Кім</Th><Th>Мақсаты</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <Td className="font-medium">{byId(db.rooms, b.roomId)?.name}</Td>
                  <Td className="whitespace-nowrap">{fmt.format(b.startTime)}</Td>
                  <Td>{byId(db.users, b.userId)?.name}</Td>
                  <Td className="max-w-56 truncate">{b.reason}</Td>
                  <Td><StatusBadge status={b.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function newPin() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1000000).padStart(6, "0");
}

/** Creates the parent account for a student if missing, or resets its PIN, inside a mutate(). */
function issue(d: Parameters<Parameters<typeof mutate>[0]>[0], studentId: string, parentName?: string): Slip {
  const student = d.users.find((u) => u.id === studentId)!;
  const pin = newPin();
  const link = d.parentLinks.find((l) => l.childId === studentId);
  let parent = link && d.users.find((u) => u.id === link.parentId);
  const used = new Set(d.users.map((u) => u.parentId));
  let pid = "";
  do pid = `P-${100000 + Number(newPin()) % 900000}`;
  while (used.has(pid));
  if (parent) {
    parent.pin = pin;
    parent.parentId ??= pid;
    if (parentName) parent.name = parentName;
  } else {
    parent = { id: uid(), email: null, name: parentName || `${student.name} (ата-анасы)`, role: "PARENT", iin: null, groupId: null, parentId: pid, pin };
    d.users.push(parent);
    d.parentLinks.push({ parentId: parent.id, childId: studentId });
  }
  return { student: student.name, group: d.groups.find((g) => g.id === student.groupId)?.name ?? "", parentName: parent.name, parentId: parent.parentId!, pin };
}

export function ParentPins() {
  const db = useDb();
  const group = useGroup();
  const [slips, setSlips] = useState<Slip[]>([]);
  const students = db.users.filter((u) => u.role === "STUDENT" && u.groupId === group.id).sort((a, b) => a.name.localeCompare(b.name));
  const parentOf = (id: string) => {
    const l = db.parentLinks.find((x) => x.childId === id);
    return l ? byId(db.users, l.parentId) : undefined;
  };
  const missing = students.filter((s) => !parentOf(s.id)).length;

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-4">
        <PageHeader title="Ата-аналарға PIN шығару" description="Ата-ана баланың ЖСН-і немесе Parent ID және PIN арқылы кіреді. PIN бір рет көрсетіледі, жоғалса жаңартыңыз." />
        <GroupPills current={group.id} />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={missing === 0}
            onClick={() => {
              const out: Slip[] = [];
              mutate((d) => students.filter((s) => !parentOf(s.id)).forEach((s) => out.push(issue(d, s.id))));
              setSlips(out);
            }}
          >
            <KeyRound className="h-4 w-4" /> {group.name}: PIN жоқ {missing} ата-анаға шығару
          </Button>
          {slips.length > 0 && <Button variant="outline" onClick={() => window.print()}>Басып шығару ({slips.length})</Button>}
        </div>
      </div>
      {slips.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-amber-700 sm:col-span-2 print:hidden">PIN-кодтар тек осы жерде бір рет көрсетіледі. Беттен шықпай тұрып басып шығарыңыз немесе ата-анаға беріңіз.</p>
          {slips.map((s) => (
            <div key={s.parentId} className="break-inside-avoid rounded-xl border-2 border-dashed border-border bg-card p-4 text-sm">
              <div className="mb-2 flex items-center justify-between"><b>JIHC Portal · ата-ана кіруі</b><span className="text-xs text-muted-foreground">my.jihc.edu.kz/login</span></div>
              <div>Студент: <b>{s.student}</b> ({s.group})</div>
              <div>Ата-ана: {s.parentName}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted p-2"><div className="text-xs text-muted-foreground">Parent ID (немесе баланың ЖСН-і)</div><div className="font-mono text-base font-bold">{s.parentId}</div></div>
                <div className="rounded-md bg-muted p-2"><div className="text-xs text-muted-foreground">PIN-код</div><div className="font-mono text-base font-bold tracking-widest">{s.pin}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-card print:hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="px-3 py-2 text-left">Студент</th><th className="px-3 py-2 text-left">ЖСН</th><th className="px-3 py-2 text-left">Ата-ана</th><th /></tr></thead>
          <tbody>
            {students.map((s) => {
              const p = parentOf(s.id);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.iin}</td>
                  <td className="px-3 py-2">{p ? <span>{p.name} <Badge className="ml-1">{p.parentId}</Badge></span> : <Badge variant="warning">PIN шығарылмаған</Badge>}</td>
                  <td className="px-3 py-2">
                    <form
                      className="flex justify-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = String(new FormData(e.currentTarget).get("parentName") ?? "").trim() || undefined;
                        let slip: Slip | undefined;
                        mutate((d) => { slip = issue(d, s.id, name); });
                        setSlips([slip!]);
                      }}
                    >
                      {!p && <Input name="parentName" placeholder="Ата-ананың аты-жөні" className="h-8 w-48" />}
                      <Button size="sm" variant={p ? "outline" : "default"}>{p ? "PIN жаңарту" : "PIN шығару"}</Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
