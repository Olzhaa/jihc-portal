"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";
import { parseISODate } from "@/lib/utils";
import { KIND_FIELDS, STUDENT_KINDS, dateFields, parseRecord, templateTasks, type RecordKind } from "@/lib/curator";

// One generic save/remove for every curator record kind; the field list in
// src/lib/curator.ts decides what is accepted.
type Delegate = {
  findUnique: (a: { where: Record<string, string> }) => Promise<Record<string, unknown> | null>;
  create: (a: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (a: { where: Record<string, string>; data: Record<string, unknown> }) => Promise<unknown>;
  upsert: (a: { where: Record<string, string>; create: Record<string, unknown>; update: Record<string, unknown> }) => Promise<unknown>;
  delete: (a: { where: Record<string, string> }) => Promise<unknown>;
};
const MODEL: Record<RecordKind, string> = {
  profile: "studentProfile", guardian: "guardian", contact: "contactLog", task: "curatorTask",
  event: "classEvent", achievement: "achievement", book: "bookRead", test: "testResult",
};
const delegate = (kind: RecordKind) => (prisma as unknown as Record<string, Delegate>)[MODEL[kind]];

async function curatorOf(groupId: string) {
  const user = await requireUser(STAFF_ROLES);
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { students: { where: { role: "STUDENT", active: true }, select: { id: true } } } });
  if (!group || group.curatorId !== user.id) return { error: "Сіз бұл топтың кураторы емессіз" } as const;
  return { user, group, studentIds: new Set(group.students.map((s) => s.id)) } as const;
}

/** True if an existing record belongs to the curator's group. */
function owns(kind: RecordKind, row: Record<string, unknown> | null, groupId: string, studentIds: Set<string>) {
  if (!row) return false;
  return STUDENT_KINDS.includes(kind) ? studentIds.has(row.studentId as string) : row.groupId === groupId;
}

export async function saveCuratorRecord(kind: RecordKind, groupId: string, data: Record<string, unknown>) {
  if (!(kind in MODEL)) return { error: "Белгісіз жазба түрі" };
  const ctx = await curatorOf(groupId);
  if ("error" in ctx) return { error: ctx.error };
  const parsed = parseRecord(kind, data);
  if (!parsed.ok) return { error: parsed.error };

  const value = { ...parsed.value };
  for (const k of dateFields(KIND_FIELDS[kind])) if (typeof value[k] === "string") value[k] = parseISODate(value[k] as string);
  if (STUDENT_KINDS.includes(kind) && !ctx.studentIds.has(value.studentId as string)) return { error: "Студент бұл топта емес" };
  if (kind === "event") value.responsibleIds = (value.responsibleIds as string[]).filter((id) => ctx.studentIds.has(id));

  const db = delegate(kind);
  if (kind === "profile") {
    const { studentId, ...rest } = value;
    await db.upsert({ where: { studentId: studentId as string }, create: value, update: rest });
  } else {
    const id = typeof data.id === "string" && data.id ? data.id : null;
    if (id) {
      if (!owns(kind, await db.findUnique({ where: { id } }), groupId, ctx.studentIds)) return { error: "Жазба табылмады" };
      await db.update({ where: { id }, data: value });
    } else {
      if (kind === "contact") value.authorId = ctx.user.id;
      if (!STUDENT_KINDS.includes(kind)) value.groupId = groupId;
      await db.create({ data: value });
    }
  }
  revalidatePath("/teacher/curator", "layout");
  return { ok: true };
}

export async function removeCuratorRecord(kind: RecordKind, groupId: string, id: string) {
  if (!(kind in MODEL) || kind === "profile") return { error: "Белгісіз жазба түрі" };
  const ctx = await curatorOf(groupId);
  if ("error" in ctx) return { error: ctx.error };
  const db = delegate(kind);
  if (!owns(kind, await db.findUnique({ where: { id } }), groupId, ctx.studentIds)) return { error: "Жазба табылмады" };
  await db.delete({ where: { id } });
  revalidatePath("/teacher/curator", "layout");
  return { ok: true };
}

/** Fills an empty curator cycle with the standard task list. */
export async function loadCuratorTemplate(groupId: string) {
  const ctx = await curatorOf(groupId);
  if ("error" in ctx) return { error: ctx.error };
  if (await prisma.curatorTask.count({ where: { groupId } })) return { error: "Цикл бос емес" };
  await prisma.curatorTask.createMany({
    data: templateTasks().map((t) => ({ ...t, groupId, nextDue: t.nextDue ? parseISODate(t.nextDue) : null })),
  });
  revalidatePath("/teacher/curator", "layout");
  return { ok: true };
}
