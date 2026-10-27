import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lessonsForGroup } from "@/lib/schedule";
import { PageHeader } from "@/components/page-header";
import { Timetable } from "@/components/timetable";
import { isoWeekday } from "@/lib/utils";

export default async function StudentSchedule() {
  const user = await requireUser(["STUDENT"]);
  const me = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { group: true } });
  const lessons = me.groupId ? await lessonsForGroup(me.groupId) : [];
  return (
    <div>
      <PageHeader title="Сабақ кестесі" description={`${me.group?.name ?? "Топ тағайындалмаған"} · апталық кесте`} />
      <Timetable lessons={lessons} today={isoWeekday(new Date())} />
    </div>
  );
}
