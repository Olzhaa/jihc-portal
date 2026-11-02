"use server";

import type { FinalPeriod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { PERIODS, RESULTS_CONFIG_KEY, cellsToLock, checkResultsConfig, cleanResultsConfig, parseFinalInput } from "@/lib/results";
import { loadResults } from "@/lib/results-server";

type Scope = { groupId: string; year: number };

const refresh = () => {
  revalidatePath("/academic-director/results");
  revalidatePath("/teacher/curator/results");
  revalidatePath("/student/grades");
  revalidatePath("/parent");
};

/** Бір қорытынды бағаны қолмен қою; null — жазбаны өшіріп, журналдан есептеуге қайтару. */
export async function setFinalGrade(scope: Scope, input: { studentId: string; courseId: string; period: FinalPeriod; value: number | null }) {
  const user = await requireUser(MANAGER_ROLES);
  if (!PERIODS.some((p) => p.key === input.period)) return { error: "Кезең дұрыс емес" };
  const value = input.value === null ? null : parseFinalInput(String(input.value));
  if (value !== null && typeof value === "object") return value;
  const student = await prisma.user.findFirst({ where: { id: input.studentId, groupId: scope.groupId, role: "STUDENT" }, select: { id: true } });
  if (!student) return { error: "Студент бұл топта жоқ" };
  const key = { studentId: input.studentId, courseId: input.courseId, academicYear: scope.year, period: input.period };
  if (value === null) await prisma.finalGrade.deleteMany({ where: key });
  else
    await prisma.finalGrade.upsert({
      where: { studentId_courseId_academicYear_period: key },
      create: { ...key, value, manual: true, setById: user.id },
      update: { value, manual: true, setById: user.id },
    });
  refresh();
  return { ok: true as const };
}

/** «Қорытындыны бекіту»: есептелген, бірақ әлі сақталмаған бағаларды сақтайды. */
export async function lockResults(scope: Scope) {
  const user = await requireUser(MANAGER_ROLES);
  const { results } = await loadResults({ groupId: scope.groupId }, scope.year);
  const rows = cellsToLock(results);
  if (rows.length)
    await prisma.finalGrade.createMany({
      data: rows.map((r) => ({ ...r, academicYear: scope.year, manual: false, setById: user.id })),
      skipDuplicates: true,
    });
  refresh();
  return { ok: true as const };
}

/** «Қайта есептеу»: бекітуді алады; қолмен қойылған бағалар қалады. */
export async function unlockResults(scope: Scope) {
  await requireUser(MANAGER_ROLES);
  await prisma.finalGrade.deleteMany({ where: { academicYear: scope.year, manual: false, student: { groupId: scope.groupId } } });
  refresh();
  return { ok: true as const };
}

export async function saveResultsConfig(raw: unknown) {
  await requireUser(MANAGER_ROLES);
  const config = cleanResultsConfig(raw);
  const error = checkResultsConfig(config);
  if (error) return { error };
  await prisma.setting.upsert({ where: { key: RESULTS_CONFIG_KEY }, create: { key: RESULTS_CONFIG_KEY, value: config }, update: { value: config } });
  refresh();
  revalidatePath("/academic-director/results/settings");
  return { ok: true as const };
}
