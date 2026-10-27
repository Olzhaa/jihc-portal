"use client";

import { useState, useTransition } from "react";
import { Printer, KeyRound } from "lucide-react";
import { issuePin, issueForGroup, type Slip } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Row = { id: string; name: string; iin: string | null; parent: { name: string; parentId: string | null } | null };

export function PinPanel({ groupId, groupName, rows, loginUrl }: { groupId: string; groupName: string; rows: Row[]; loginUrl: string }) {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [pending, start] = useTransition();
  const missing = rows.filter((r) => !r.parent).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Button disabled={pending || missing === 0} onClick={() => start(async () => setSlips(await issueForGroup(groupId)))}>
          <KeyRound className="h-4 w-4" /> {groupName}: PIN жоқ {missing} ата-анаға шығару
        </Button>
        {slips.length > 0 && (
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Басып шығару ({slips.length})
          </Button>
        )}
      </div>

      {slips.length > 0 && (
        <div className="print-area grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-amber-700 sm:col-span-2 print:hidden">
            PIN-кодтар тек осы жерде бір рет көрсетіледі. Беттен шықпай тұрып басып шығарыңыз немесе ата-анаға беріңіз.
          </p>
          {slips.map((s) => (
            <div key={s.parentId} className="break-inside-avoid rounded-xl border-2 border-dashed border-border bg-card p-4 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <b>JIHC Portal · ата-ана кіруі</b>
                <span className="text-xs text-muted-foreground">{loginUrl}</span>
              </div>
              <div>
                Студент: <b>{s.student}</b> ({s.group})
              </div>
              <div>Ата-ана: {s.parentName}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted p-2">
                  <div className="text-xs text-muted-foreground">Parent ID (немесе баланың ЖСН-і)</div>
                  <div className="font-mono text-base font-bold">{s.parentId}</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="text-xs text-muted-foreground">PIN-код</div>
                  <div className="font-mono text-base font-bold tracking-widest">{s.pin}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card print:hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Студент</th>
              <th className="px-3 py-2 text-left">ЖСН</th>
              <th className="px-3 py-2 text-left">Ата-ана</th>
              <th className="px-3 py-2 text-left" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.iin}</td>
                <td className="px-3 py-2">
                  {r.parent ? (
                    <span>
                      {r.parent.name} <Badge className="ml-1">{r.parent.parentId}</Badge>
                    </span>
                  ) : (
                    <Badge variant="warning">PIN шығарылмаған</Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  <form
                    className="flex justify-end gap-2"
                    action={(fd) => start(async () => setSlips(await issuePin(r.id, fd)))}
                  >
                    {!r.parent && <Input name="parentName" placeholder="Ата-ананың аты-жөні" className="h-8 w-48" />}
                    <Button size="sm" variant={r.parent ? "outline" : "default"} disabled={pending}>
                      {r.parent ? "PIN жаңарту" : "PIN шығару"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
