import { PageHeader } from "@/components/page-header";
import { OverviewStats, OverviewWidgets, GradebookView } from "@/components/student-views";
import { ChildSwitcher } from "@/components/child-switcher";
import { Timetable } from "@/components/timetable";
import { isoWeekday } from "@/lib/utils";
import { useDb } from "../store";
import { byId, lessonsForGroup, studentGradebook, studentOverview } from "../queries";
import { useRoute } from "../router";
import { useMe } from "../hooks";

function useChild() {
  const me = useMe();
  const db = useDb();
  const { query } = useRoute();
  const children = db.parentLinks.filter((l) => l.parentId === me.id).map((l) => byId(db.users, l.childId)!).sort((a, b) => a.name.localeCompare(b.name));
  return { children, child: children.find((c) => c.id === query.get("child")) ?? children[0] };
}

export function Home() {
  const db = useDb();
  const { children, child } = useChild();
  if (!child) return <PageHeader title="Бала тіркелмеген" description="Колледж әкімшілігіне хабарласыңыз." />;
  const o = studentOverview(db, child.id);
  return (
    <div className="space-y-6">
      <PageHeader title={child.name} description={`${o.student.group?.name ?? ""} тобы · тек қарау режимі`} actions={<ChildSwitcher items={children} current={child.id} />} />
      <OverviewStats o={o as never} />
      <OverviewWidgets o={o as never} scheduleHref={`/parent/schedule?child=${child.id}`} gradesHref={`/parent?child=${child.id}`} />
      <div>
        <h2 className="mb-3 text-lg font-semibold">Пәндер бойынша үлгерім</h2>
        <GradebookView book={studentGradebook(db, child.id) as never} />
      </div>
    </div>
  );
}

export function Schedule() {
  const db = useDb();
  const { children, child } = useChild();
  if (!child) return <PageHeader title="Бала тіркелмеген" />;
  return (
    <div>
      <PageHeader title="Сабақ кестесі" description={`${child.name} · ${byId(db.groups, child.groupId)?.name ?? ""}`} actions={<ChildSwitcher items={children} current={child.id} />} />
      <Timetable lessons={child.groupId ? lessonsForGroup(db, child.groupId) : []} today={isoWeekday(new Date())} />
    </div>
  );
}
