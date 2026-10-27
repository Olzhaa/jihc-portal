import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badges";
import { ReviewButtons } from "@/components/review-buttons";
import { formatDate } from "@/lib/utils";
import { reviewCertificate } from "../actions";

export default async function CertificatesModeration() {
  await requireUser(MANAGER_ROLES);
  const certs = await prisma.medicalCertificate.findMany({
    include: { student: { include: { group: true } }, reviewer: true },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
  });
  const pending = certs.filter((c) => c.status === "PENDING");
  const done = certs.filter((c) => c.status !== "PENDING");
  return (
    <div className="space-y-6">
      <PageHeader title="Медициналық анықтамалар" description="Расталған анықтама сол күндердегі «жоқ» белгілерін «себепті» етеді" />
      <Card>
        <CardHeader>
          <CardTitle>Тексеруді күтуде ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Барлығы тексерілді.</p>}
          {pending.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="font-medium">
                  {c.student.name} <span className="text-muted-foreground">· {c.student.group?.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(c.startDate)} – {formatDate(c.endDate)} ·{" "}
                  <a href={`/api/files/${c.fileUrl}`} target="_blank" className="text-primary hover:underline">
                    файлды ашу
                  </a>
                </div>
              </div>
              <ReviewButtons action={reviewCertificate.bind(null, c.id)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Тарих</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Студент</Th>
                <Th>Кезең</Th>
                <Th>Статус</Th>
                <Th>Тексерген</Th>
              </tr>
            </thead>
            <tbody>
              {done.map((c) => (
                <tr key={c.id}>
                  <Td>
                    {c.student.name} · {c.student.group?.name}
                  </Td>
                  <Td>
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                    {c.reviewNote && <div className="text-xs text-muted-foreground">{c.reviewNote}</div>}
                  </Td>
                  <Td>{c.reviewer?.name}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
