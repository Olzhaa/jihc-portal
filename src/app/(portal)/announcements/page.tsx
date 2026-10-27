import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { announcementsFor } from "@/lib/announcements";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AnnouncementForm } from "./announcement-form";
import { deleteAnnouncement } from "./actions";

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const isStaff = STAFF_ROLES.includes(user.role);
  const isManager = MANAGER_ROLES.includes(user.role);

  // Students see their group's feed; parents see their children's; staff see everything.
  let groupId: string | null | undefined;
  if (user.role === "STUDENT") groupId = (await prisma.user.findUnique({ where: { id: user.id } }))?.groupId ?? "none";
  if (user.role === "PARENT") {
    const link = await prisma.parentLink.findFirst({ where: { parentId: user.id }, include: { child: true } });
    groupId = link?.child.groupId ?? "none";
  }
  const items = await announcementsFor(groupId);
  const groups = isStaff
    ? await prisma.group.findMany({ where: isManager ? {} : { schedule: { some: { teacherId: user.id } } }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Хабарландырулар" description="Колледж жаңалықтары мен топтарға арналған хабарламалар" />
      <div className={isStaff ? "grid gap-6 lg:grid-cols-5" : ""}>
        <div className="space-y-3 lg:col-span-3">
          {items.length === 0 && <p className="text-muted-foreground">Хабарландыру жоқ.</p>}
          {items.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.important && <Badge variant="danger">Маңызды</Badge>}
                    {a.groups.length === 0 ? <Badge>Барлығына</Badge> : a.groups.map((g) => <Badge key={g.id} variant="info">{g.name}</Badge>)}
                  </div>
                  <CardTitle className="mt-2 text-lg">{a.title}</CardTitle>
                </div>
                {(isManager || a.authorId === user.id) && (
                  <form action={deleteAnnouncement.bind(null, a.id)}>
                    <Button variant="ghost" size="sm">
                      Жою
                    </Button>
                  </form>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{a.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {a.author.name} · {formatDate(a.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        {isStaff && (
          <Card className="h-fit lg:col-span-2">
            <CardHeader>
              <CardTitle>Жаңа хабарландыру</CardTitle>
            </CardHeader>
            <CardContent>
              <AnnouncementForm groups={groups.map((g) => ({ id: g.id, name: g.name }))} canBroadcast={isManager} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
