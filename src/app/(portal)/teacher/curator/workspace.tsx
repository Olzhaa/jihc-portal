import { requireUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/roles";
import { loadWorkspace } from "@/lib/curator-server";
import { PageHeader } from "@/components/page-header";
import { CuratorRoot } from "@/components/curator/context";
import { loadCuratorTemplate, removeCuratorRecord, saveCuratorRecord } from "./actions";

const api = { save: saveCuratorRecord, remove: removeCuratorRecord, loadTemplate: loadCuratorTemplate };

/** Loads the curator workspace for the signed-in teacher and renders a page inside it. */
export async function CuratorWorkspace({ groupId, children }: { groupId?: string; children: React.ReactNode }) {
  const user = await requireUser(STAFF_ROLES);
  const ws = await loadWorkspace(user.id, groupId);
  if (!ws) {
    return <PageHeader title="Кураторлық" description="Сіз әлі ешбір топтың кураторы емессіз. Топқа куратор тағайындауды завуч жасайды." />;
  }
  return <CuratorRoot ws={ws} api={api}>{children}</CuratorRoot>;
}
