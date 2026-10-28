"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { isEntityKey } from "@/lib/admin/entities";
import * as admin from "@/lib/admin/server";
import type { ImportRow } from "@/lib/admin/import";

export async function saveRecord(entity: string, id: string | null, values: Record<string, unknown>) {
  const user = await requireUser(ADMIN_ROLES);
  if (!isEntityKey(entity)) return { error: "Белгісіз кесте" };
  const res = await admin.saveRecord(entity, id, values, user.id);
  revalidatePath("/", "layout");
  return res;
}

export async function deleteRecord(entity: string, id: string) {
  const user = await requireUser(ADMIN_ROLES);
  if (!isEntityKey(entity)) return { error: "Белгісіз кесте" };
  const res = await admin.deleteRecord(entity, id, user.id);
  revalidatePath("/", "layout");
  return res;
}

export async function importUsers(rows: ImportRow[]) {
  const user = await requireUser(ADMIN_ROLES);
  const res = await admin.importUsers(rows, user.id);
  revalidatePath("/", "layout");
  return res;
}
