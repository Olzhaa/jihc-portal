import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badges";
import { ReviewButtons } from "@/components/review-buttons";
import { formatDate } from "@/lib/utils";
import { reviewSyllabus } from "../actions";
import { SyllabusExport } from "@/components/syllabus-editor";
import { normalizeTopics } from "@/lib/syllabus";

export default async function SyllabusModeration() {
  await requireUser(MANAGER_ROLES);
  const syllabi = await prisma.syllabus.findMany({
    where: { status: { not: "DRAFT" } },
    include: { course: true, author: true },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Силлабус модерациясы" description="Мұғалімдер жіберген силлабустарды тексеріп, бекітіңіз" />
      {syllabi.map((s) => (
        <Card key={s.id}>
          <CardHeader>
            <div>
              <CardTitle>
                {s.course.code ? `${s.course.code} ` : ""}
                {s.course.title}
              </CardTitle>
              <CardDescription>
                {s.title} · {s.author.name} · {formatDate(s.updatedAt)}
              </CardDescription>
            </div>
            <StatusBadge status={s.status} />
          </CardHeader>
          <CardContent className="space-y-3">
            <details open={s.status === "PENDING"}>
              <summary className="cursor-pointer text-sm text-primary">
                {normalizeTopics(s.topics).length} тақырып · {s.totalHours} сағат
              </summary>
              <div className="mt-2">
                <SyllabusExport title={`${s.course.title} ${s.title}`} topics={normalizeTopics(s.topics)} />
              </div>
            </details>
            {s.status === "PENDING" ? (
              <ReviewButtons action={reviewSyllabus.bind(null, s.id)} />
            ) : (
              s.reviewNote && <p className="text-sm text-muted-foreground">Түсініктеме: {s.reviewNote}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
