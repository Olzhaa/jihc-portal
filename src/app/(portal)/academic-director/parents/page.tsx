import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { PinPanel } from "./pin-panel";

export default async function ParentPins({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  await requireUser(MANAGER_ROLES);
  const { group } = await searchParams;
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  const current = groups.find((g) => g.id === group) ?? groups[0];
  const students = current
    ? await prisma.user.findMany({
        where: { groupId: current.id, role: "STUDENT" },
        include: { parents: { include: { parent: true } } },
        orderBy: { name: "asc" },
      })
    : [];
  const loginUrl = `${(process.env.NEXTAUTH_URL ?? "https://my.jihc.edu.kz").replace(/^https?:\/\//, "")}/login`;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader title="Ата-аналарға PIN шығару" description="Ата-ана баланың ЖСН-і немесе Parent ID және PIN арқылы кіреді. PIN бір рет көрсетіледі, жоғалса жаңартыңыз." />
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <Link key={g.id} href={`?group=${g.id}`} className={cn("rounded-full border border-border px-3 py-1 text-sm", g.id === current?.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
              {g.name}
            </Link>
          ))}
        </div>
      </div>
      {current && (
        <PinPanel
          key={current.id}
          groupId={current.id}
          groupName={current.name}
          loginUrl={loginUrl}
          rows={students.map((s) => ({ id: s.id, name: s.name, iin: s.iin, parent: s.parents[0] ? { name: s.parents[0].parent.name, parentId: s.parents[0].parent.parentId } : null }))}
        />
      )}
    </div>
  );
}
