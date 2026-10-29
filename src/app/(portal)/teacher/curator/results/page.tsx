import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";
import { academicYearStart } from "@/lib/assessment";
import { yearLabel } from "@/lib/results";
import { academicYears, loadResults } from "@/lib/results-server";
import { PageHeader } from "@/components/page-header";
import { ResultsPicker } from "@/components/results-picker";
import { FinalResultsTable } from "@/components/final-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Куратор өз тобының қорытындыларын көреді және Excel-ге шығарады (түзетуді завуч жасайды). */
export default async function CuratorResultsPage({ searchParams }: { searchParams: Promise<{ g?: string; y?: string }> }) {
  const user = await requireUser(STAFF_ROLES);
  const sp = await searchParams;
  const groups = await prisma.group.findMany({ where: { curatorId: user.id }, orderBy: { name: "asc" }, select: { id: true, name: true, snationCode: true } });
  const group = groups.find((g) => g.id === sp.g) ?? groups[0];
  if (!group) return <PageHeader title="Қорытындылар" description="Сіз әлі ешбір топтың кураторы емессіз." />;
  const current = academicYearStart();
  const years = await academicYears(current);
  const year = years.includes(Number(sp.y)) ? Number(sp.y) : current;
  const { results, config } = await loadResults({ groupId: group.id }, year);
  return (
    <div className="space-y-6">
      <PageHeader title="Қорытындылар" description="Топтың пәндер бойынша жартыжылдық, жылдық және емтихан бағалары, жіберілген сағаттар. Бағаны бекіту мен түзетуді завуч жасайды." />
      <ResultsPicker groups={groups} groupId={group.id} years={years} year={year} />
      <Card>
        <CardHeader>
          <CardTitle>
            {group.name} · {yearLabel(year)} оқу жылы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FinalResultsTable group={group} results={results} config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
