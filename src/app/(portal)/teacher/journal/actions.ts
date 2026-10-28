"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { parseISODate } from "@/lib/utils";
import { validateJournal, type JournalPayload } from "@/lib/journal";

export async function saveJournal(input: JournalPayload & { lessonId: string; date: string }) {
  const user = await requireUser(STAFF_ROLES);
  const lesson = await prisma.schedule.findUniqueOrThrow({ where: { id: input.lessonId }, include: { group: { include: { students: true } } } });
  if (lesson.teacherId !== user.id && !MANAGER_ROLES.includes(user.role)) return { error: "Бұл сабақ сізге бекітілмеген" };

  const date = parseISODate(input.date);
  if (((date.getUTCDay() + 6) % 7) + 1 !== lesson.dayOfWeek) return { error: "Таңдалған күні бұл сабақ кестеде жоқ" };
  const invalid = validateJournal(input, date);
  if (invalid) return { error: invalid };

  const studentIds = new Set(lesson.group.students.map((s) => s.id));
  const rows = input.rows.filter((r) => studentIds.has(r.studentId));
  const topic = input.topic.trim() || null;
  const homework = input.homework.trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.lessonRecord.upsert({
      where: { scheduleId_date: { scheduleId: lesson.id, date } },
      create: { scheduleId: lesson.id, date, topic, homework },
      update: { topic, homework },
    });
    for (const r of rows) {
      await tx.attendance.upsert({
        where: { studentId_scheduleId_date: { studentId: r.studentId, scheduleId: lesson.id, date } },
        create: { studentId: r.studentId, scheduleId: lesson.id, courseId: lesson.courseId, date, status: r.status, markedById: user.id },
        update: { status: r.status, markedById: user.id },
      });
      // One grade per student, lesson, day and category: replace whatever was there.
      await tx.grade.deleteMany({ where: { studentId: r.studentId, scheduleId: lesson.id, date, type: input.gradeType } });
      if (r.grade.trim() !== "") {
        await tx.grade.create({
          data: {
            studentId: r.studentId, scheduleId: lesson.id, courseId: lesson.courseId, givenById: user.id,
            value: Number(r.grade), type: input.gradeType, weight: input.weight, workType: input.workType, date,
          },
        });
      }
    }
  });
  revalidatePath("/teacher/journal");
  revalidatePath("/teacher/gradebook");
  return { ok: true as const };
}
