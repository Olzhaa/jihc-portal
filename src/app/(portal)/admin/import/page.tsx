import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UserImport } from "@/components/admin/user-import";
import { importUsers } from "../actions";

export default async function ImportPage() {
  await requireUser(ADMIN_ROLES);
  const [users, groups] = await Promise.all([
    prisma.user.findMany({ select: { iin: true, email: true } }),
    prisma.group.findMany({ select: { name: true } }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader title="Excel-ден импорт" description="Студенттер, мұғалімдер немесе ата-аналар тізімін бір рет қойып, барлығын қосу немесе жаңарту." />
      <Card>
        <CardContent className="pt-5">
          <UserImport
            known={{ iins: users.flatMap((u) => (u.iin ? [u.iin] : [])), emails: users.flatMap((u) => (u.email ? [u.email] : [])) }}
            groups={groups.map((g) => g.name)}
            onImport={importUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
