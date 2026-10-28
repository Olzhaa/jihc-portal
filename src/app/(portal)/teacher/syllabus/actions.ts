"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";
import { cleanSyllabus } from "@/lib/syllabus";
import type { SyllabusDraft } from "@/components/syllabus-editor";

export async function saveSyllabus(input: SyllabusDraft & { id?: string }) {
  const user = await requireUser(STAFF_ROLES);
  const clean = cleanSyllabus(input);
  if ("error" in clean) return { error: clean.error };
  const data = { courseId: input.courseId, ...clean, status: input.submit ? ("PENDING" as const) : ("DRAFT" as const), reviewNote: null };
  if (input.id) {
    const existing = await prisma.syllabus.findUnique({ where: { id: input.id } });
    if (!existing || existing.authorId !== user.id) return { error: "Силлабус табылмады" };
    if (existing.status === "APPROVED") return { error: "Бекітілген силлабусты өзгертуге болмайды" };
    await prisma.syllabus.update({ where: { id: input.id }, data });
  } else {
    await prisma.syllabus.create({ data: { ...data, authorId: user.id } });
  }
  revalidatePath("/teacher/syllabus");
  return { ok: true as const };
}
