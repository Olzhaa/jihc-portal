import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { GroupMapping } from "@/components/group-mapping";
import { saveSnationCode } from "./actions";

export default async function GroupsPage() {
  await requireUser(MANAGER_ROLES);
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { students: { where: { active: true } } } } } });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Топтар: EduPage ↔ Smart Nation"
        description="Бір топ екі жүйеде әртүрлі аталады (мысалы 2D-1 ↔ D1-2025). Сәйкестік журнал мен экспорттарда көрсетіледі."
      />
      <Card>
        <CardContent className="pt-6">
          <GroupMapping groups={groups.map((g) => ({ id: g.id, name: g.name, snationCode: g.snationCode, students: g._count.students }))} onSave={saveSnationCode} />
        </CardContent>
      </Card>
    </div>
  );
}
