import Link from "next/link";
import { Settings2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { academicYearStart } from "@/lib/assessment";
import { yearLabel } from "@/lib/results";
import { academicYears, loadResults } from "@/lib/results-server";
import { PageHeader } from "@/components/page-header";
import { ResultsPicker } from "@/components/results-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsClient } from "./results-client";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ g?: string; y?: string }> }) {
  await requireUser(MANAGER_ROLES);
  const sp = await searchParams;
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, snationCode: true } });
  const current = academicYearStart();
  const years = await academicYears(current);
  const year = years.includes(Number(sp.y)) ? Number(sp.y) : current;
  const group = groups.find((g) => g.id === sp.g) ?? groups[0];

  const header = (
    <PageHeader
      title="Қорытындылар"
      description="Smart Nation «Қорытындылар» сияқты: пәндер бойынша жартыжылдық, жылдық және емтихан бағалары, жіберілген сағаттар"
      actions={
        <Link href="/academic-director/results/settings" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted">
          <Settings2 className="h-4 w-4" /> Формула
        </Link>
      }
    />
  );
  if (!group) return <div>{header}<p className="text-muted-foreground">Топ жоқ.</p></div>;

  const { results, config } = await loadResults({ groupId: group.id }, year);
  return (
    <div className="space-y-6">
      {header}
      <ResultsPicker groups={groups} groupId={group.id} years={years} year={year} />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {group.name} · {yearLabel(year)} оқу жылы
            </CardTitle>
            {group.snationCode && <p className="mt-1 text-sm text-muted-foreground">Smart Nation: {group.snationCode}</p>}
          </div>
        </CardHeader>
        <CardContent>
          <ResultsClient key={`${group.id}:${year}`} groupId={group.id} year={year} editable group={group} results={results} config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
