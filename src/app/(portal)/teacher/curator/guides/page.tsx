import { requireUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/roles";
import { Guides } from "@/components/curator/guides";

export default async function CuratorGuides() {
  await requireUser(STAFF_ROLES);
  return <Guides />;
}
