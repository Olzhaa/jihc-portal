"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { checkSnationCode } from "@/lib/assessment";

export async function saveSnationCode(groupId: string, code: string) {
  await requireUser(MANAGER_ROLES);
  const checked = checkSnationCode(code);
  if (checked !== null && typeof checked === "object") return checked;
  await prisma.group.update({ where: { id: groupId }, data: { snationCode: checked } });
  revalidatePath("/academic-director/groups");
  return { ok: true as const };
}
