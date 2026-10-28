"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REFLECTION_FIELDS, groupCourse, parseFields, semesterLabel } from "@/lib/curator";

export async function submitReflection(data: Record<string, unknown>) {
  const user = await requireUser(["STUDENT"]);
  const me = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { group: true } });
  const parsed = parseFields(REFLECTION_FIELDS, data);
  if (!parsed.ok) return { error: parsed.error };
  const semester = semesterLabel(me.group ? groupCourse(me.group.name) : null);
  if (await prisma.reflection.findFirst({ where: { studentId: me.id, semester } })) return { error: "Осы семестрдің рефлексиясы бұрын жіберілген" };
  const v = parsed.value as Record<string, string | null>;
  await prisma.reflection.create({
    data: {
      studentId: me.id, semester, pride: v.pride!, difficulty: v.difficulty, helpNeeded: v.helpNeeded, nextGoal: v.nextGoal,
      diligence: v.diligence!, responsibility: v.responsibility!, selfDevelopment: v.selfDevelopment!, designInterest: v.designInterest,
    },
  });
  revalidatePath("/student/reflection");
  return { ok: true };
}
