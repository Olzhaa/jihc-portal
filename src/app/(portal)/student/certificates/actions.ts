"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { parseISODate } from "@/lib/utils";

export type FormState = { error?: string; ok?: boolean };

export async function submitCertificate(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const start = String(form.get("startDate") ?? "");
  const end = String(form.get("endDate") ?? "");
  const file = form.get("file");
  if (!start || !end) return { error: "Күндерді таңдаңыз" };
  if (end < start) return { error: "Аяқталу күні басталу күнінен кейін болуы керек" };
  if (!(file instanceof File) || file.size === 0) return { error: "Файлды тіркеңіз" };

  let key: string;
  try {
    key = await saveFile(file);
  } catch (e) {
    return { error: (e as Error).message };
  }
  await prisma.medicalCertificate.create({
    data: { studentId: user.id, fileUrl: key, startDate: parseISODate(start), endDate: parseISODate(end) },
  });
  revalidatePath("/student/certificates");
  return { ok: true };
}
