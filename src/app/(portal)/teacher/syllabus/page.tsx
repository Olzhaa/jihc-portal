import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badges";
import { formatDate } from "@/lib/utils";
import { SyllabusForm } from "./syllabus-form";
import type { Topic } from "./actions";

export default async function SyllabusPage() {
  const user = await requireUser(STAFF_ROLES);
  const [courses, syllabi] = await Promise.all([
    prisma.course.findMany({
      where: user.role === "DIRECTOR" ? {} : { schedule: { some: { teacherId: user.id } } },
      orderBy: { title: "asc" },
    }),
    prisma.syllabus.findMany({ where: { authorId: user.id }, include: { course: true, reviewer: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Силлабус пен сабақ жоспары" description="Тақырыптар мен сағат санын енгізіп, завучқа модерацияға жіберіңіз" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Жаңа силлабус</CardTitle>
          </CardHeader>
          <CardContent>
            <SyllabusForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
          </CardContent>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {syllabi.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="truncate">{s.course.title}</CardTitle>
                  <CardDescription>{s.title}</CardDescription>
                </div>
                <StatusBadge status={s.status} />
              </CardHeader>
              <CardContent className="text-sm">
                <div className="text-muted-foreground">
                  {(s.topics as Topic[]).length} тақырып · {s.totalHours} сағат · {formatDate(s.updatedAt)}
                </div>
                {s.reviewNote && <div className="mt-2 rounded-md bg-muted p-2">Завуч: {s.reviewNote}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
