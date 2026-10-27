import { prisma } from "./prisma";

/** Announcements visible to a group: college-wide ones plus those targeted at the group. */
export function announcementsFor(groupId: string | null | undefined, take?: number) {
  return prisma.announcement.findMany({
    where: groupId ? { OR: [{ groups: { none: {} } }, { groups: { some: { id: groupId } } }] } : undefined,
    include: { author: true, groups: true },
    orderBy: [{ important: "desc" }, { createdAt: "desc" }],
    take,
  });
}
