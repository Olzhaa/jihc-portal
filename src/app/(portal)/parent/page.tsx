import { requireUser } from "@/lib/auth";
import { parentChild } from "@/lib/parent";
import { studentOverview, studentGradebook } from "@/lib/student";
import { PageHeader } from "@/components/page-header";
import { OverviewStats, OverviewWidgets, GradebookView } from "@/components/student-views";
import { ChildSwitcher } from "@/components/child-switcher";
import { StudentFinalResults } from "@/components/final-results";
import { academicYearStart } from "@/lib/assessment";
import { yearLabel } from "@/lib/results";
import { loadResults } from "@/lib/results-server";

export default async function ParentHome({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const user = await requireUser(["PARENT"]);
  const { children, child } = await parentChild(user.id, (await searchParams).child);
  if (!child) return <PageHeader title="Бала тіркелмеген" description="Колледж әкімшілігіне хабарласыңыз." />;
  const year = academicYearStart();
  const [o, book, final] = await Promise.all([studentOverview(child.id), studentGradebook(child.id), loadResults({ studentId: child.id }, year)]);
  return (
    <div className="space-y-6">
      <PageHeader title={child.name} description={`${child.group?.name ?? ""} тобы · тек қарау режимі`} actions={<ChildSwitcher items={children} current={child.id} />} />
      <OverviewStats o={o} />
      <OverviewWidgets o={o} scheduleHref={`/parent/schedule?child=${child.id}`} gradesHref="#grades" />
      {final.results.courses.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Қорытынды бағалар · {yearLabel(year)}</h2>
          <StudentFinalResults results={final.results} passMark={final.config.passMark} />
        </div>
      )}
      <div id="grades">
        <h2 className="mb-3 text-lg font-semibold">Пәндер бойынша үлгерім</h2>
        <GradebookView book={book} />
      </div>
    </div>
  );
}
