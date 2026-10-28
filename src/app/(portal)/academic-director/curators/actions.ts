"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";

export async function assignCurator(groupId: string, teacherId: string | null) {
  await requireUser(MANAGER_ROLES);
  if (teacherId) {
    const t = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!t || !STAFF_ROLES.includes(t.role)) return { error: "Куратор тек мұғалім бола алады" };
  }
  await prisma.group.update({ where: { id: groupId }, data: { curatorId: teacherId } });
  revalidatePath("/", "layout");
  return { ok: true };
}
