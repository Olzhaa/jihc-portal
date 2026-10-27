import { requireUser } from "@/lib/auth";
import { parentChild } from "@/lib/parent";
import { lessonsForGroup } from "@/lib/schedule";
import { PageHeader } from "@/components/page-header";
import { Timetable } from "@/components/timetable";
import { ChildSwitcher } from "@/components/child-switcher";
import { isoWeekday } from "@/lib/utils";

export default async function ParentSchedule({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const user = await requireUser(["PARENT"]);
  const { children, child } = await parentChild(user.id, (await searchParams).child);
  if (!child) return <PageHeader title="Бала тіркелмеген" />;
  const lessons = child.groupId ? await lessonsForGroup(child.groupId) : [];
  return (
    <div>
      <PageHeader title="Сабақ кестесі" description={`${child.name} · ${child.group?.name ?? ""}`} actions={<ChildSwitcher items={children} current={child.id} />} />
      <Timetable lessons={lessons} today={isoWeekday(new Date())} />
    </div>
  );
}
