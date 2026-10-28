"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { parseISODate } from "@/lib/utils";
import { cleanAssignment, parseGradeInput, type AssignmentDraft, type BookColumn } from "@/lib/gradebook";

type Scope = { courseId: string; groupId: string };

/** The teacher must teach this subject to this group; managers may edit any gradebook. */
async function authorize({ courseId, groupId }: Scope) {
  const user = await requireUser(STAFF_ROLES);
  if (MANAGER_ROLES.includes(user.role)) return user;
  const lesson = await prisma.schedule.findFirst({ where: { courseId, groupId, teacherId: user.id } });
  return lesson ? user : null;
}

const done = () => {
  revalidatePath("/teacher/gradebook");
  revalidatePath("/teacher/journal");
  return { ok: true as const };
};

export async function setGrade(scope: Scope, input: { studentId: string; column: BookColumn; gradeId?: string; value: string | number | null }) {
  const user = await authorize(scope);
  if (!user) return { error: "Бұл бағалар кітабы сізге бекітілмеген" };
  const value = input.value === null ? null : parseGradeInput(String(input.value));
  if (value !== null && typeof value === "object") return { error: value.error };
  const student = await prisma.user.findFirst({ where: { id: input.studentId, groupId: scope.groupId, role: "STUDENT" } });
  if (!student) return { error: "Студент бұл топта жоқ" };

  if (input.gradeId) {
    const where = { id: input.gradeId, studentId: student.id, courseId: scope.courseId };
    if (value === null) await prisma.grade.deleteMany({ where });
    else await prisma.grade.updateMany({ where, data: { value, givenById: user.id } });
    return done();
  }
  if (value === null) return done();

  const col = input.column;
  const assignment = col.assignmentId
    ? await prisma.assignment.findFirst({ where: { id: col.assignmentId, courseId: scope.courseId, groupId: scope.groupId } })
    : null;
  if (col.assignmentId && !assignment) return { error: "Назначение табылмады" };
  const src = assignment ?? { type: col.type, weight: col.weight, workType: col.workType, date: parseISODate(new Date(col.date).toISOString().slice(0, 10)) };
  const check = cleanAssignment({ title: "x", type: src.type, weight: src.weight, workType: src.workType, date: src.date.toISOString().slice(0, 10) });
  if ("error" in check) return { error: check.error };
  await prisma.grade.create({
    data: {
      studentId: student.id, courseId: scope.courseId, givenById: user.id, value, assignmentId: assignment?.id ?? null,
      type: check.type, weight: check.weight, workType: check.workType, date: check.date,
    },
  });
  return done();
}

export async function saveAssignment(scope: Scope, input: AssignmentDraft & { id?: string }) {
  const user = await authorize(scope);
  if (!user) return { error: "Бұл бағалар кітабы сізге бекітілмеген" };
  const data = cleanAssignment(input);
  if ("error" in data) return { error: data.error };
  if (input.id) {
    const found = await prisma.assignment.findFirst({ where: { id: input.id, ...scope } });
    if (!found) return { error: "Назначение табылмады" };
    // Grades copy the assignment's category, coefficient and date so averages and exports stay simple.
    await prisma.$transaction([
      prisma.assignment.update({ where: { id: found.id }, data }),
      prisma.grade.updateMany({ where: { assignmentId: found.id }, data: { type: data.type, weight: data.weight, workType: data.workType, date: data.date } }),
    ]);
  } else {
    await prisma.assignment.create({ data: { ...data, ...scope, createdById: user.id } });
  }
  return done();
}

export async function deleteAssignment(scope: Scope, id: string) {
  const user = await authorize(scope);
  if (!user) return { error: "Бұл бағалар кітабы сізге бекітілмеген" };
  await prisma.assignment.deleteMany({ where: { id, ...scope } });
  return done();
}
