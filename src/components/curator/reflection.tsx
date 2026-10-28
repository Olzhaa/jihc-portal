"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate } from "@/lib/curator";
import { REFLECTION_FIELDS, type Result } from "@/lib/curator";
import { RecordDetails, RecordForm } from "./fields";

type Row = Record<string, unknown> & { id: string; semester: string; createdAt: string };

/** Student side: the semester self-assessment that goes to the curator. */
export function ReflectionPage({ semester, curator, items, onSubmit }: { semester: string; curator: string | null; items: Row[]; onSubmit: (v: Record<string, unknown>) => Promise<Result> }) {
  const [sent, setSent] = useState(false);
  const done = items.some((r) => r.semester === semester);
  return (
    <div className="space-y-6">
      <PageHeader title="Рефлексия" description="Семестрдегі өзін-өзі бағалау. Жауабыңызды тек кураторыңыз көреді." />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{semester}</CardTitle>
            <CardDescription>{curator ? `Куратор: ${curator}` : "Тобыңызға куратор әлі тағайындалмаған."}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sent || done ? (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">Рақмет! Осы семестрдің рефлексиясы жіберілді.</p>
          ) : (
            <RecordForm
              fields={REFLECTION_FIELDS}
              submitLabel="Жіберу"
              onSubmit={async (v) => {
                const r = await onSubmit(v);
                if (!r?.error) setSent(true);
                return r;
              }}
            />
          )}
        </CardContent>
      </Card>
      {items.map((r) => (
        <Card key={r.id}>
          <CardHeader><CardTitle>{r.semester}</CardTitle><span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span></CardHeader>
          <CardContent><RecordDetails fields={REFLECTION_FIELDS} values={r} /></CardContent>
        </Card>
      ))}
    </div>
  );
}
