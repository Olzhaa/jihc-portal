"use server";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";

export type Slip = { student: string; group: string; iin: string | null; parentName: string; parentId: string; pin: string };

async function nextParentId() {
  for (;;) {
    const id = `P-${randomInt(100000, 1000000)}`;
    if (!(await prisma.user.findUnique({ where: { parentId: id } }))) return id;
  }
}

/**
 * Creates the parent account for a student if missing, or resets its PIN.
 * The PIN is returned once for printing and only its hash is stored.
 */
async function issue(studentId: string, parentName?: string): Promise<Slip> {
  const student = await prisma.user.findUniqueOrThrow({
    where: { id: studentId },
    include: { group: true, parents: { include: { parent: true } } },
  });
  const pin = String(randomInt(0, 1000000)).padStart(6, "0");
  const parentPinHash = await bcrypt.hash(pin, 10);
  let parent = student.parents[0]?.parent;
  if (parent) {
    parent = await prisma.user.update({
      where: { id: parent.id },
      data: { parentPinHash, parentId: parent.parentId ?? (await nextParentId()), ...(parentName ? { name: parentName } : {}) },
    });
  } else {
    parent = await prisma.user.create({
      data: {
        role: "PARENT",
        name: parentName || `${student.name} (ата-анасы)`,
        parentId: await nextParentId(),
        parentPinHash,
        children: { create: { childId: student.id } },
      },
    });
  }
  return { student: student.name, group: student.group?.name ?? "", iin: student.iin, parentName: parent.name, parentId: parent.parentId!, pin };
}

export async function issuePin(studentId: string, form: FormData): Promise<Slip[]> {
  await requireUser(MANAGER_ROLES);
  const slip = await issue(studentId, String(form.get("parentName") ?? "").trim() || undefined);
  revalidatePath("/academic-director/parents");
  return [slip];
}

/** Issues PINs for every student in the group who doesn't have a parent account yet. */
export async function issueForGroup(groupId: string): Promise<Slip[]> {
  await requireUser(MANAGER_ROLES);
  const students = await prisma.user.findMany({ where: { groupId, role: "STUDENT", parents: { none: {} } }, orderBy: { name: "asc" } });
  const slips: Slip[] = [];
  for (const s of students) slips.push(await issue(s.id));
  revalidatePath("/academic-director/parents");
  return slips;
}
