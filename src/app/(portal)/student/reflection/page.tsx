import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupCourse, semesterLabel } from "@/lib/curator";
import { ReflectionPage } from "@/components/curator/reflection";
import { submitReflection } from "./actions";

export default async function StudentReflection() {
  const user = await requireUser(["STUDENT"]);
  const me = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { group: { include: { curator: true } } } });
  const items = await prisma.reflection.findMany({ where: { studentId: me.id }, orderBy: { createdAt: "desc" } });
  return (
    <ReflectionPage
      semester={semesterLabel(me.group ? groupCourse(me.group.name) : null)}
      curator={me.group?.curator?.name ?? null}
      items={items.map(({ createdAt, ...r }) => ({ ...r, createdAt: createdAt.toISOString().slice(0, 10) }))}
      onSubmit={submitReflection}
    />
  );
}
