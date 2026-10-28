import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { CuratorAssign } from "@/components/curator/assign";
import { assignCurator } from "./actions";

export default async function CuratorsPage() {
  await requireUser(MANAGER_ROLES);
  const [groups, teachers] = await Promise.all([
    prisma.group.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { students: { where: { role: "STUDENT", active: true } } } } } }),
    prisma.user.findMany({ where: { role: { in: STAFF_ROLES } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <CuratorAssign
      groups={groups.map((g) => ({ id: g.id, name: g.name, students: g._count.students, curatorId: g.curatorId }))}
      teachers={teachers}
      onAssign={assignCurator}
    />
  );
}
