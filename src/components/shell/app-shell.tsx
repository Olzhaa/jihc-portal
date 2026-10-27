import { requireUser } from "@/lib/auth";
import { NAV } from "./nav";
import { Sidebar } from "./sidebar";
import { ROLE_LABEL } from "@/lib/roles";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <Sidebar groups={NAV[user.role]} userName={user.name ?? ""} roleLabel={ROLE_LABEL[user.role]}>
      {children}
    </Sidebar>
  );
}
