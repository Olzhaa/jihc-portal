"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";

export type Topic = { week: number; topic: string; hours: number };

export async function saveSyllabus(input: { id?: string; courseId: string; title: string; topics: Topic[]; submit: boolean }) {
  const user = await requireUser(STAFF_ROLES);
  const topics = input.topics.filter((t) => t.topic.trim()).map((t, i) => ({ week: i + 1, topic: t.topic.trim(), hours: Math.max(0, Math.round(t.hours)) }));
  if (!input.title.trim()) return { error: "Атауын жазыңыз" };
  if (!topics.length) return { error: "Кемінде бір тақырып қосыңыз" };
  const data = {
    courseId: input.courseId,
    title: input.title.trim(),
    topics,
    totalHours: topics.reduce((s, t) => s + t.hours, 0),
    status: input.submit ? ("PENDING" as const) : ("DRAFT" as const),
    reviewNote: null,
  };
  if (input.id) {
    const existing = await prisma.syllabus.findUnique({ where: { id: input.id } });
    if (!existing || existing.authorId !== user.id) return { error: "Силлабус табылмады" };
    if (existing.status === "APPROVED") return { error: "Бекітілген силлабусты өзгертуге болмайды" };
    await prisma.syllabus.update({ where: { id: input.id }, data });
  } else {
    await prisma.syllabus.create({ data: { ...data, authorId: user.id } });
  }
  revalidatePath("/teacher/syllabus");
  return { ok: true };
}
