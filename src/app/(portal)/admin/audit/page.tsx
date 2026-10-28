import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { recentAudit } from "@/lib/admin/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AuditList } from "@/components/admin/admin-home";

export default async function AuditPage() {
  await requireUser(ADMIN_ROLES);
  const entries = await recentAudit(300);
  return (
    <div className="space-y-4">
      <PageHeader title="Өзгерістер журналы" description="Админ панельде кім, қашан, нені өзгертті (соңғы 300 жазба)." />
      <Card>
        <CardContent className="pt-5">
          <AuditList entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
