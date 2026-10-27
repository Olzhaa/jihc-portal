import { prisma } from "./prisma";

/** The parent's linked children; `childId` picks one, defaulting to the first. */
export async function parentChild(parentId: string, childId?: string) {
  const links = await prisma.parentLink.findMany({ where: { parentId }, include: { child: { include: { group: true } } }, orderBy: { child: { name: "asc" } } });
  const children = links.map((l) => l.child);
  return { children, child: children.find((c) => c.id === childId) ?? children[0] ?? null };
}
