import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { collegeStats, weeklyAttendance } from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { BarList, ColumnChart } from "@/components/bar-list";
import { gradeTone } from "@/lib/grades";

export default async function ViceDashboard() {
  await requireUser(MANAGER_ROLES);
  const [stats, weekly, pendingCerts, pendingSyllabi, pendingBookings] = await Promise.all([
    collegeStats(),
    weeklyAttendance(6),
    prisma.medicalCertificate.count({ where: { status: "PENDING" } }),
    prisma.syllabus.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
  ]);
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
          { href: "/academic-director/certificates", label: "Справкалар тексеруді күтуде", n: pendingCerts },
          { href: "/academic-director/syllabi", label: "Силлабус модерацияда", n: pendingSyllabi },
          { href: "/academic-director/bookings", label: "Брондау өтінімдері", n: pendingBookings },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary">
            <span className="text-sm">{x.label}</span>
            <span className={`text-2xl font-bold ${x.n ? "text-amber-600" : "text-muted-foreground"}`}>{x.n}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Топтар бойынша қатысу</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList rows={stats.groups.map((g) => ({ label: g.name, value: g.attendance }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Апталық қатысу динамикасы</CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnChart points={weekly.map((w) => ({ label: w.week.toISOString().slice(5, 10).split("-").reverse().join("."), value: w.rate }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Топтардың үлгерімі</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Топ</Th>
                  <Th>Студент</Th>
                  <Th>Орташа</Th>
                  <Th>GPA</Th>
                  <Th>Қатысу</Th>
                </tr>
              </thead>
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
          <CardHeader>
            <CardTitle>Сабақтан көп қалатындар</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Студент</Th>
                  <Th>Топ</Th>
                  <Th>Себепсіз</Th>
                </tr>
              </thead>
              <tbody>
                {stats.truants.length === 0 && (
                  <tr>
                    <Td colSpan={3} className="text-muted-foreground">
                      Жоқ
                    </Td>
                  </tr>
                )}
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
