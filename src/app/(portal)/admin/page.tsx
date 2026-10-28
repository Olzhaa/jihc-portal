import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { counts, databaseInfo, recentAudit } from "@/lib/admin/server";
import { PageHeader } from "@/components/page-header";
import { AdminHome } from "@/components/admin/admin-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  await requireUser(ADMIN_ROLES);
  const [c, recent, db] = await Promise.all([counts(), recentAudit(10), databaseInfo()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Админ панель" description="Порталдағы барлық деректер: қосу, өзгерту, өшіру. Әр өзгеріс журналға жазылады." />
      <AdminHome
        counts={c}
        recent={recent}
        extra={
          <Card>
            <CardHeader>
              <CardTitle>Дерекқор</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>PostgreSQL {db.version}</p>
              <p>Көлемі: {db.size}</p>
              <p className="break-all text-muted-foreground">Соңғы миграция: {db.migration ?? "—"}</p>
              <p className="text-muted-foreground">Резервтік көшірме серверде күн сайын жасалады (docs/DATABASE.md).</p>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
