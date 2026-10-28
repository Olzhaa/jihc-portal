"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import type { Result } from "@/lib/curator";

/** Vice principal: who curates which group. */
export function CuratorAssign({
  groups,
  teachers,
  onAssign,
}: {
  groups: { id: string; name: string; students: number; curatorId: string | null }[];
  teachers: { id: string; name: string }[];
  onAssign: (groupId: string, teacherId: string | null) => Promise<Result>;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const load = (id: string) => groups.filter((g) => g.curatorId === id).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Кураторлар" description="Топқа куратор тағайындаңыз. Куратор ауысса, топтың барлық куратор жазбалары жаңа кураторға өтеді." />
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Топ</Th><Th>Студент саны</Th><Th>Куратор</Th></tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <Td className="font-medium">{g.name}</Td>
                  <Td>{g.students}</Td>
                  <Td>
                    <Select
                      className="w-64"
                      disabled={pending}
                      value={g.curatorId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setMsg(null);
                        start(async () => {
                          const r = await onAssign(g.id, v);
                          if (r?.error) setMsg(r.error);
                        });
                      }}
                    >
                      <option value="">— тағайындалмаған —</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}{load(t.id) ? ` (${load(t.id)} топ)` : ""}</option>)}
                    </Select>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
