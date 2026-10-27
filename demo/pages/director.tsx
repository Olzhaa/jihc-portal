import { useState } from "react";
import type { Role } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/widgets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { BarList, ColumnChart } from "@/components/bar-list";
import { BELLS, DAYS } from "@/lib/bells";
import { gradeTone } from "@/lib/grades";
import { ROLE_LABEL } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useDb } from "../store";
import { byId, collegeStats, weeklyAttendance } from "../queries";

export function Dashboard() {
  const db = useDb();
  const stats = collegeStats(db);
  const weekly = weeklyAttendance(db, 8);
  const roleCount = (r: Role) => db.users.filter((u) => u.role === r).length;
  const ranking = [...stats.groups].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const capacity = BELLS.length * DAYS.length;
  const utilization = db.rooms
    .filter((r) => r.type === "CLASSROOM" || r.type === "LAB")
    .map((r) => ({ label: r.name, value: (db.lessons.filter((l) => l.roomId === r.id).reduce((s, l) => s + l.endPeriod - l.startPeriod + 1, 0) / capacity) * 100 }))
    .sort((a, b) => b.value - a.value);
  const trend = weekly.length >= 2 ? weekly[weekly.length - 1].rate - weekly[weekly.length - 2].rate : 0;
  const tally = (rows: { status: string }[]) => [rows.length, rows.filter((r) => r.status === "PENDING").length];

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Dashboard" description={`Колледждің жалпы көрсеткіштері · ${DAYS.length}-күндік оқу аптасы`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Студенттер" value={String(stats.studentCount)} hint={`${stats.groups.length} топ · ${roleCount("PARENT")} ата-ана тіркелген`} />
        <StatCard label="Педагогтар" value={String(roleCount("TEACHER") + roleCount("VICE_PRINCIPAL"))} hint={`оның ішінде ${roleCount("VICE_PRINCIPAL")} завуч`} />
        <StatCard label="Қатысу" value={stats.attendance === null ? "—" : `${stats.attendance.toFixed(1)}%`} hint={`өткен аптамен салыстырғанда ${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`} tone={trend < 0 ? "text-amber-600" : undefined} />
        <StatCard label="Орташа GPA" value={stats.gpa?.toFixed(2) ?? "—"} hint={`орташа балл ${stats.avg?.toFixed(1) ?? "—"}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><div><CardTitle>Сабаққа қатысу динамикасы</CardTitle><CardDescription>Соңғы апталар</CardDescription></div></CardHeader>
          <CardContent><ColumnChart points={weekly.map((w) => ({ label: w.week.toISOString().slice(5, 10).split("-").reverse().join("."), value: w.rate }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Топтар рейтингі</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ranking.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 text-sm">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", i === 0 ? "bg-amber-400 text-white" : "bg-muted")}>{i + 1}</span>
                <span className="flex-1 font-medium">{g.name}</span>
                <span className={cn("font-semibold tabular-nums", g.avg ? gradeTone(g.avg) : "")}>{g.avg?.toFixed(1) ?? "—"}</span>
                <span className="w-12 text-right tabular-nums text-muted-foreground">{g.attendance?.toFixed(0) ?? "—"}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><div><CardTitle>Аудиториялардың жүктемесі</CardTitle><CardDescription>Апталық кесте бойынша</CardDescription></div></CardHeader>
          <CardContent><BarList rows={utilization} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ресурстар мен модерация</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {([["Брондау өтінімдері", tally(db.bookings)], ["Медициналық анықтамалар", tally(db.certificates)], ["Силлабустар", tally(db.syllabi)]] as const).map(([label, [total, pending]]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span>{label}</span>
                <span><b>{total}</b> <span className="text-muted-foreground">· {pending} күтуде</span></span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Назар аудару керек</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {stats.truants.slice(0, 6).map((t) => (
              <div key={t.student.id} className="flex justify-between">
                <span>{t.student.name} <span className="text-muted-foreground">· {t.student.group?.name}</span></span>
                <span className="font-semibold text-red-600">{t.absences} жоқ</span>
              </div>
            ))}
            {stats.truants.length === 0 && <p className="text-muted-foreground">Жоқ</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Users() {
  const db = useDb();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const rows = db.users
    .filter((u) => (!role || u.role === role) && (!q || `${u.name} ${u.email ?? ""}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
  return (
    <div className="space-y-4">
      <PageHeader title="Пайдаланушылар" description="Жүйедегі барлық тіркелгілер" />
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Аты немесе пошта" className="w-60" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-48">
          <option value="">Барлық рөлдер</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <Card>
        <CardContent className="pt-5">
          <Table>
            <thead><tr><Th>Аты-жөні</Th><Th>Пошта / ID</Th><Th>Рөлі</Th><Th>Тобы</Th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium">{u.name}</Td>
                  <Td className="text-muted-foreground">{u.email ?? u.parentId}</Td>
                  <Td><Badge variant={u.role === "STUDENT" ? "default" : "info"}>{ROLE_LABEL[u.role]}</Badge></Td>
                  <Td>{byId(db.groups, u.groupId)?.name}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
