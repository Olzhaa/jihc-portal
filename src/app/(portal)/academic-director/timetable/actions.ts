"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { findConflicts } from "@/lib/schedule";
import { BELLS, DAYS } from "@/lib/bells";

export type LessonState = { error?: string; conflicts?: string[]; ok?: boolean; values?: Record<string, string> };

export async function addLesson(_: LessonState, form: FormData): Promise<LessonState> {
  await requireUser(MANAGER_ROLES);
  // Echo the submitted values back so the form keeps them after a rejected attempt.
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const slot = {
    groupId: String(form.get("groupId")),
    courseId: String(form.get("courseId")),
    teacherId: String(form.get("teacherId")),
    roomId: String(form.get("roomId")),
    dayOfWeek: Number(form.get("dayOfWeek")),
    startPeriod: Number(form.get("startPeriod")),
    endPeriod: Number(form.get("endPeriod")),
  };
  if (Object.values(slot).some((v) => v === "" || v === "null" || Number.isNaN(v))) return { error: "Барлық өрісті толтырыңыз", values };
  if (!DAYS.some((d) => d.n === slot.dayOfWeek)) return { error: "Күн дұрыс емес", values };
  if (slot.endPeriod < slot.startPeriod || slot.startPeriod < 1 || slot.endPeriod > BELLS.length) return { error: "Қоңырау аралығы дұрыс емес", values };

  const conflicts = await findConflicts(slot);
  if (conflicts.length && form.get("force") !== "on") return { conflicts, values };
  await prisma.schedule.create({ data: slot });
  revalidatePath("/academic-director/timetable");
  return { ok: true };
}

export async function deleteLesson(id: string) {
  await requireUser(MANAGER_ROLES);
  await prisma.schedule.delete({ where: { id } });
  revalidatePath("/academic-director/timetable");
}
