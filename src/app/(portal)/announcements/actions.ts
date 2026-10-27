"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";

export type AnnState = { error?: string; ok?: boolean };

export async function createAnnouncement(_: AnnState, form: FormData): Promise<AnnState> {
  const user = await requireUser(STAFF_ROLES);
  const title = String(form.get("title") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();
  const groupIds = form.getAll("groups").map(String);
  const important = form.get("important") === "on" && MANAGER_ROLES.includes(user.role);
  if (!title || !content) return { error: "Тақырып пен мәтінді толтырыңыз" };

  // Teachers may only address their own groups; college-wide posts are for managers.
  if (!MANAGER_ROLES.includes(user.role)) {
    if (!groupIds.length) return { error: "Кемінде бір топ таңдаңыз" };
    const own = await prisma.group.count({ where: { id: { in: groupIds }, schedule: { some: { teacherId: user.id } } } });
    if (own !== groupIds.length) return { error: "Тек өз топтарыңызға жариялай аласыз" };
  }
  await prisma.announcement.create({
    data: { title, content, important, authorId: user.id, groups: { connect: groupIds.map((id) => ({ id })) } },
  });
  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteAnnouncement(id: string) {
  const user = await requireUser(STAFF_ROLES);
  await prisma.announcement.deleteMany({ where: MANAGER_ROLES.includes(user.role) ? { id } : { id, authorId: user.id } });
  revalidatePath("/announcements");
}
