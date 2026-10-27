import { prisma } from "./prisma";
import type { TimetableLesson } from "@/components/timetable";

const include = { course: true, room: true, group: true, teacher: true } as const;

export async function lessonsForGroup(groupId: string): Promise<TimetableLesson[]> {
  const rows = await prisma.schedule.findMany({ where: { groupId }, include, orderBy: [{ dayOfWeek: "asc" }, { startPeriod: "asc" }] });
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    startPeriod: r.startPeriod,
    endPeriod: r.endPeriod,
    title: r.course.title,
    code: r.course.code,
    color: r.course.color,
    room: r.room.name,
    sub: r.teacher.name,
  }));
}

export async function lessonsForTeacher(teacherId: string): Promise<TimetableLesson[]> {
  const rows = await prisma.schedule.findMany({ where: { teacherId }, include, orderBy: [{ dayOfWeek: "asc" }, { startPeriod: "asc" }] });
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    startPeriod: r.startPeriod,
    endPeriod: r.endPeriod,
    title: r.course.title,
    code: r.course.code,
    color: r.course.color,
    room: r.room.name,
    sub: r.group.name,
  }));
}

type Slot = { id?: string; groupId: string; teacherId: string; roomId: string; dayOfWeek: number; startPeriod: number; endPeriod: number };

/** Returns human-readable conflicts for a proposed lesson (same group, teacher or room in overlapping periods). */
export async function findConflicts(slot: Slot) {
  const overlapping = await prisma.schedule.findMany({
    where: {
      dayOfWeek: slot.dayOfWeek,
      startPeriod: { lte: slot.endPeriod },
      endPeriod: { gte: slot.startPeriod },
      OR: [{ groupId: slot.groupId }, { teacherId: slot.teacherId }, { roomId: slot.roomId }],
      ...(slot.id ? { NOT: { id: slot.id } } : {}),
    },
    include,
  });
  return overlapping.map((o) => {
    const what = [
      o.groupId === slot.groupId && `${o.group.name} тобы бос емес`,
      o.teacherId === slot.teacherId && `${o.teacher.name} бос емес`,
      o.roomId === slot.roomId && `${o.room.name} аудиториясы бос емес`,
    ].filter(Boolean);
    return `${what.join(", ")} (${o.course.title}, ${o.startPeriod}–${o.endPeriod} қоңырау)`;
  });
}
