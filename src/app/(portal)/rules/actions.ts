"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";

export async function saveRule(form: FormData) {
  const user = await requireUser(MANAGER_ROLES);
  const id = String(form.get("id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();
  if (!title || !content) return;
  if (id) await prisma.rule.update({ where: { id }, data: { title, content } });
  else await prisma.rule.create({ data: { title, content, authorId: user.id } });
  revalidatePath("/rules");
}

export async function deleteRule(id: string) {
  await requireUser(MANAGER_ROLES);
  await prisma.rule.delete({ where: { id } });
  revalidatePath("/rules");
}
