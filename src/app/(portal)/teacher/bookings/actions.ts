"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { bookingConflicts, needsApproval } from "@/lib/bookings";

export type BookingState = { error?: string; ok?: string };

export async function createBooking(_: BookingState, form: FormData): Promise<BookingState> {
  const user = await requireUser(STAFF_ROLES);
  const roomId = String(form.get("roomId") ?? "");
  const date = String(form.get("date") ?? "");
  const from = String(form.get("from") ?? "");
  const to = String(form.get("to") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!roomId || !date || !from || !to || !reason) return { error: "Барлық өрісті толтырыңыз" };

  const start = new Date(`${date}T${from}`);
  const end = new Date(`${date}T${to}`);
  if (!(end > start)) return { error: "Аяқталу уақыты басталудан кейін болуы керек" };
  if (start < new Date()) return { error: "Өткен уақытты брондауға болмайды" };

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return { error: "Бөлме табылмады" };
  const conflicts = await bookingConflicts(roomId, start, end);
  if (conflicts.length) return { error: `Бұл уақыт бос емес: ${conflicts.join("; ")}` };

  // Managers and the room's own responsible teacher are confirmed at once; otherwise
  // special rooms wait for the responsible teacher (or the vice principal if none is set).
  const autoApprove = MANAGER_ROLES.includes(user.role) || room.managerId === user.id || !needsApproval(room.type);
  await prisma.booking.create({
    data: { roomId, userId: user.id, startTime: start, endTime: end, reason, status: autoApprove ? "APPROVED" : "PENDING" },
  });
  revalidatePath("/teacher/bookings");
  if (autoApprove) return { ok: "Брондалды" };
  const manager = room.managerId ? await prisma.user.findUnique({ where: { id: room.managerId } }) : null;
  return { ok: `Өтінім ${manager ? `жауапты мұғалімге (${manager.name})` : "завучқа"} жіберілді` };
}

/** Responsible teacher (or a manager) approves or rejects a pending request for a special room. */
export async function decideBooking(id: string, approve: boolean) {
  const user = await requireUser(STAFF_ROLES);
  const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
  if (!booking || booking.status !== "PENDING") return;
  if (booking.room.managerId !== user.id && !MANAGER_ROLES.includes(user.role)) return;
  if (approve && (await bookingConflicts(booking.roomId, booking.startTime, booking.endTime, booking.id, false)).length) return;
  await prisma.booking.update({ where: { id }, data: { status: approve ? "APPROVED" : "REJECTED" } });
  revalidatePath("/teacher/bookings");
  revalidatePath("/academic-director/bookings");
}

export async function cancelBooking(id: string) {
  const user = await requireUser(STAFF_ROLES);
  await prisma.booking.updateMany({ where: { id, userId: user.id, status: { in: ["PENDING", "APPROVED"] } }, data: { status: "CANCELLED" } });
  revalidatePath("/teacher/bookings");
}
