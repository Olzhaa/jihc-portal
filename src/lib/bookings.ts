import { prisma } from "./prisma";
import { BELLS } from "./bells";

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Conflicts for a room booking: overlapping active bookings and timetable lessons in that room. */
export async function bookingConflicts(roomId: string, start: Date, end: Date, excludeId?: string, includePending = true) {
  const [bookings, lessons] = await Promise.all([
    prisma.booking.findMany({
      where: { roomId, status: { in: includePending ? ["PENDING", "APPROVED"] : ["APPROVED"] }, startTime: { lt: end }, endTime: { gt: start }, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      include: { user: true },
    }),
    prisma.schedule.findMany({ where: { roomId, dayOfWeek: ((start.getDay() + 6) % 7) + 1 }, include: { group: true, course: true } }),
  ]);
  const s = start.getHours() * 60 + start.getMinutes();
  const e = end.getHours() * 60 + end.getMinutes();
  const lessonHits = lessons.filter((l) => minutes(BELLS[l.startPeriod - 1].start) < e && minutes(BELLS[l.endPeriod - 1].end) > s);
  return [
    ...bookings.map((b) => `${b.user.name} брондаған (${b.status === "PENDING" ? "күтуде" : "расталған"})`),
    ...lessonHits.map((l) => `Сабақ: ${l.group.name} · ${l.course.title}`),
  ];
}

export { ROOM_TYPE_LABEL, needsApproval } from "./rooms";
