"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";

export async function reviewCertificate(id: string, approve: boolean, form: FormData) {
  const user = await requireUser(MANAGER_ROLES);
  const note = String(form.get("note") ?? "").trim() || null;
  await prisma.$transaction(async (tx) => {
    const cert = await tx.medicalCertificate.update({
      where: { id },
      data: { status: approve ? "APPROVED" : "REJECTED", reviewerId: user.id, reviewNote: note },
    });
    // An approved certificate turns the covered absences into excused ones.
    if (approve) {
      await tx.attendance.updateMany({
        where: { studentId: cert.studentId, status: "ABSENT", date: { gte: cert.startDate, lte: cert.endDate } },
        data: { status: "EXCUSED" },
      });
    }
  });
  revalidatePath("/academic-director/certificates");
}

export async function reviewSyllabus(id: string, approve: boolean, form: FormData) {
  const user = await requireUser(MANAGER_ROLES);
  await prisma.syllabus.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewerId: user.id, reviewNote: String(form.get("note") ?? "").trim() || null },
  });
  revalidatePath("/academic-director/syllabi");
}
