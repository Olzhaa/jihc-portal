import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, ROLE_LABEL } from "@/lib/roles";
import { navFor } from "./nav";
import { Sidebar } from "./sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isCurator = STAFF_ROLES.includes(user.role) && (await prisma.group.count({ where: { curatorId: user.id } })) > 0;
  return (
    <Sidebar groups={navFor(user.role, isCurator)} userName={user.name ?? ""} roleLabel={ROLE_LABEL[user.role]}>
      {children}
    </Sidebar>
  );
}
