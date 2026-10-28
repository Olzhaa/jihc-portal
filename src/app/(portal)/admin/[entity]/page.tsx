import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";
import { ENTITY, isEntityKey } from "@/lib/admin/entities";
import { loadRefs, loadRows } from "@/lib/admin/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminTable } from "@/components/admin/admin-table";
import { deleteRecord, saveRecord } from "../actions";

export default async function AdminEntityPage({ params }: { params: Promise<{ entity: string }> }) {
  await requireUser(ADMIN_ROLES);
  const { entity } = await params;
  if (!isEntityKey(entity)) notFound();
  const e = ENTITY[entity];
  const [rows, refs] = await Promise.all([loadRows(entity), loadRefs()]);
  return (
    <div className="space-y-4">
      <PageHeader title={e.label} description={e.description} />
      <Card>
        <CardContent className="pt-5">
          <AdminTable
            entity={entity}
            rows={rows}
            refs={refs}
            onSave={saveRecord.bind(null, entity)}
            onDelete={deleteRecord.bind(null, entity)}
            note={e.limit && rows.length >= e.limit ? `соңғы ${e.limit} жазба көрсетілді` : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
