import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CertificateStatusBadge } from "@/components/status-badges";
import { Table, Th, Td } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { CertificateForm } from "./certificate-form";

export default async function StudentCertificates() {
  const user = await requireUser(["STUDENT"]);
  const certs = await prisma.medicalCertificate.findMany({ where: { studentId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Анықтама тапсыру" description="Ауырып қалған күндерге медициналық анықтама жүктеңіз" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Жаңа анықтама</CardTitle>
              <CardDescription>Расталған соң сол күндердегі сабақтар «себепті» болып белгіленеді.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CertificateForm />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Менің анықтамаларым</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Кезең</Th>
                  <Th>Жіберілді</Th>
                  <Th>Статус</Th>
                  <Th>Файл</Th>
                </tr>
              </thead>
              <tbody>
                {certs.length === 0 && (
                  <tr>
                    <Td colSpan={4} className="text-muted-foreground">
                      Әзірге анықтама жоқ.
                    </Td>
                  </tr>
                )}
                {certs.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </Td>
                    <Td>{formatDate(c.createdAt)}</Td>
                    <Td>
                      <CertificateStatusBadge status={c.status} />
                      {c.reviewNote && <div className="mt-1 text-xs text-muted-foreground">{c.reviewNote}</div>}
                    </Td>
                    <Td>
                      <a href={`/api/files/${c.fileUrl}`} target="_blank" className="text-primary hover:underline">
                        Ашу
                      </a>
                    </Td>
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
