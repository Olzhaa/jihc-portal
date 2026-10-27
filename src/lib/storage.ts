import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Local-disk storage for uploaded files. Keys are opaque; files are served only
 * through /api/files/[key], which checks permissions. To move to S3 / Supabase,
 * replace these two functions.
 */
const ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function saveFile(file: File) {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Тек PDF, PNG немесе JPG файлдар қабылданады");
  if (file.size > MAX_FILE_BYTES) throw new Error("Файл көлемі 5 МБ-тан аспауы керек");
  await mkdir(ROOT, { recursive: true });
  const key = `${randomUUID()}.${ext}`;
  await writeFile(path.join(ROOT, key), Buffer.from(await file.arrayBuffer()));
  return key;
}

export async function readStoredFile(key: string) {
  if (!/^[0-9a-f-]{36}\.(pdf|png|jpg)$/.test(key)) throw new Error("bad key");
  return readFile(path.join(ROOT, key));
}

export function contentTypeFor(key: string) {
  return Object.entries(ALLOWED_TYPES).find(([, ext]) => key.endsWith(`.${ext}`))?.[0] ?? "application/octet-stream";
}
