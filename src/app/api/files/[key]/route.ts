import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { contentTypeFor, readStoredFile } from "@/lib/storage";

/** Serves an uploaded certificate to its owner, the owner's parents, and managers. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { key } = await params;
  const cert = await prisma.medicalCertificate.findFirst({
    where: { fileUrl: key },
    include: { student: { include: { parents: true } } },
  });
  if (!cert) return new Response("Not found", { status: 404 });
  const allowed =
    MANAGER_ROLES.includes(user.role) ||
    cert.studentId === user.id ||
    cert.student.parents.some((p) => p.parentId === user.id);
  if (!allowed) return new Response("Forbidden", { status: 403 });
  try {
    const data = await readStoredFile(key);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": contentTypeFor(key), "Content-Disposition": "inline", "Cache-Control": "private, no-store" },
    });
  } catch {
    return new Response("Файл табылмады (демо деректер)", { status: 404 });
  }
}
