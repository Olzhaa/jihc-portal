import { requireUser } from "@/lib/auth";
import { parentChild } from "@/lib/parent";
import { studentOverview, studentGradebook } from "@/lib/student";
import { PageHeader } from "@/components/page-header";
import { OverviewStats, OverviewWidgets, GradebookView } from "@/components/student-views";
import { ChildSwitcher } from "@/components/child-switcher";

export default async function ParentHome({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const user = await requireUser(["PARENT"]);
  const { children, child } = await parentChild(user.id, (await searchParams).child);
  if (!child) return <PageHeader title="Бала тіркелмеген" description="Колледж әкімшілігіне хабарласыңыз." />;
  const [o, book] = await Promise.all([studentOverview(child.id), studentGradebook(child.id)]);
  return (
    <div className="space-y-6">
      <PageHeader title={child.name} description={`${child.group?.name ?? ""} тобы · тек қарау режимі`} actions={<ChildSwitcher items={children} current={child.id} />} />
      <OverviewStats o={o} />
      <OverviewWidgets o={o} scheduleHref={`/parent/schedule?child=${child.id}`} gradesHref="#grades" />
      <div id="grades">
        <h2 className="mb-3 text-lg font-semibold">Пәндер бойынша үлгерім</h2>
        <GradebookView book={book} />
      </div>
    </div>
  );
}
