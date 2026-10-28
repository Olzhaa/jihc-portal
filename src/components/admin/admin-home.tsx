import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACTION_LABEL, ADMIN_SECTIONS, ENTITIES, ENTITY, formatDateTime, isEntityKey, type Change, type EntityKey } from "@/lib/admin/entities";

export type AuditEntry = { id: string; at: string; user: string | null; action: string; entity: string; summary: string; changes: Change[] | null };

const ACTION_TONE: Record<string, "success" | "info" | "danger" | "warning"> = { CREATE: "success", UPDATE: "info", DELETE: "danger", IMPORT: "warning" };

/** Админ панельдің басты беті: барлық бөлім бір жерде, санымен. */
export function AdminHome({ counts, recent, extra }: { counts: Record<EntityKey, number>; recent: AuditEntry[]; extra?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {ADMIN_SECTIONS.map((section) => (
        <div key={section}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ENTITIES.filter((e) => e.section === section).map((e) => (
              <Link key={e.key} href={`/admin/${e.key}`} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted/40">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{e.label}</span>
                  <span className="text-xl font-bold tabular-nums">{counts[e.key]}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{e.description}</p>
              </Link>
            ))}
            {section === "Адамдар" && (
              <Link href="/admin/import" className="rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-muted/40">
                <span className="font-medium">Excel-ден импорт</span>
                <p className="mt-1 text-xs text-muted-foreground">Студенттер мен мұғалімдер тізімін EduPage кестесінен көшіріп қою</p>
              </Link>
            )}
          </div>
        </div>
      ))}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Соңғы өзгерістер</CardTitle>
            <Link href="/admin/audit" className="text-sm text-primary hover:underline">
              Барлығы →
            </Link>
          </CardHeader>
          <CardContent>
            <AuditList entries={recent} compact />
          </CardContent>
        </Card>
        {extra}
      </div>
    </div>
  );
}

export function AuditList({ entries, compact }: { entries: AuditEntry[]; compact?: boolean }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">Әзірге өзгеріс жоқ.</p>;
  return (
    <ul className="divide-y divide-border">
      {entries.map((a) => (
        <li key={a.id} className="py-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={ACTION_TONE[a.action] ?? "info"}>{ACTION_LABEL[a.action] ?? a.action}</Badge>
            <span className="text-muted-foreground">{isEntityKey(a.entity) ? ENTITY[a.entity].label : a.entity}:</span>
            <span className="font-medium">{a.summary}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {a.user ?? "жүйе"} · {formatDateTime(a.at)}
            </span>
          </div>
          {!compact && a.changes && a.changes.length > 0 && (
            <ul className="mt-1 space-y-0.5 pl-2 text-xs text-muted-foreground">
              {a.changes.map(([field, from, to]) => (
                <li key={field}>
                  {field}: <span className="line-through">{from ?? "—"}</span> → <span className="text-foreground">{to ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
