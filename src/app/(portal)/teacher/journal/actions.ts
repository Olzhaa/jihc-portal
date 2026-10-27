"use server";

import { revalidatePath } from "next/cache";
import type { AttendanceStatus, GradeType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { parseISODate } from "@/lib/utils";

export type JournalRow = { studentId: string; status: AttendanceStatus; grade: string; comment?: string };

export async function saveJournal(input: { lessonId: string; date: string; gradeType: GradeType; rows: JournalRow[] }) {
  const user = await requireUser(STAFF_ROLES);
  const lesson = await prisma.schedule.findUniqueOrThrow({ where: { id: input.lessonId }, include: { group: { include: { students: true } } } });
  if (lesson.teacherId !== user.id && !MANAGER_ROLES.includes(user.role)) return { error: "Бұл сабақ сізге бекітілмеген" };

  const date = parseISODate(input.date);
  if (((date.getUTCDay() + 6) % 7) + 1 !== lesson.dayOfWeek) return { error: "Таңдалған күні бұл сабақ кестеде жоқ" };
  if (date.getTime() > Date.now()) return { error: "Болашақ күнге белгі қоюға болмайды" };

  const studentIds = new Set(lesson.group.students.map((s) => s.id));
  const rows = input.rows.filter((r) => studentIds.has(r.studentId));
  for (const r of rows) {
    if (r.grade.trim() === "") continue;
    const v = Number(r.grade);
    if (!Number.isFinite(v) || v < 0 || v > 100) return { error: "Баға 0 мен 100 аралығында болуы керек" };
  }

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      await tx.attendance.upsert({
        where: { studentId_scheduleId_date: { studentId: r.studentId, scheduleId: lesson.id, date } },
        create: { studentId: r.studentId, scheduleId: lesson.id, courseId: lesson.courseId, date, status: r.status, markedById: user.id },
        update: { status: r.status, markedById: user.id },
      });
      // One grade per student, lesson, day and type: replace whatever was there.
      await tx.grade.deleteMany({ where: { studentId: r.studentId, scheduleId: lesson.id, date, type: input.gradeType } });
      if (r.grade.trim() !== "") {
        await tx.grade.create({
          data: {
            studentId: r.studentId, scheduleId: lesson.id, courseId: lesson.courseId, givenById: user.id,
            value: Number(r.grade), type: input.gradeType, date, comment: r.comment || null,
          },
        });
      }
    }
  });
  revalidatePath("/teacher/journal");
  return { ok: true };
}
