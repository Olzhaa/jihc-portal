import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  await requireUser(["DIRECTOR"]);
  const { q, role } = await searchParams;
  const users = await prisma.user.findMany({
    where: {
      ...(role && role in ROLE_LABEL ? { role: role as Role } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { group: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 200,
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Пайдаланушылар" description="Жүйедегі барлық тіркелгілер" />
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Аты немесе пошта" className="h-9 rounded-md border border-border bg-card px-3 text-sm" />
        <select name="role" defaultValue={role ?? ""} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">Барлық рөлдер</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground">Іздеу</button>
      </form>
      <Card>
        <CardContent className="pt-5">
          <Table>
            <thead>
              <tr>
                <Th>Аты-жөні</Th>
                <Th>Пошта / ID</Th>
                <Th>Рөлі</Th>
                <Th>Тобы</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium">{u.name}</Td>
                  <Td className="text-muted-foreground">{u.email ?? u.parentId}</Td>
                  <Td>
                    <Badge variant={u.role === "STUDENT" ? "default" : "info"}>{ROLE_LABEL[u.role]}</Badge>
                  </Td>
                  <Td>{u.group?.name}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
