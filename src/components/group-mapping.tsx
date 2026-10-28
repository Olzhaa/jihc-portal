"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Th, Td } from "@/components/ui/table";
import { suggestSnationCode } from "@/lib/assessment";

/**
 * EduPage мен Smart Nation-дағы топ атауларының сәйкестігі (мысалы 2D-1 ↔ D1-2025).
 * Бос өріске ереже бойынша ұсыныс жазылады; завуч тексеріп сақтайды.
 */
export function GroupMapping({
  groups,
  onSave,
}: {
  groups: { id: string; name: string; snationCode: string | null; students: number }[];
  onSave: (id: string, code: string) => Promise<{ error?: string } | { ok: true }> | { error?: string } | { ok: true };
}) {
  const [codes, setCodes] = useState(() => Object.fromEntries(groups.map((g) => [g.id, g.snationCode ?? ""])));
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  function save(id: string) {
    start(async () => {
      const res = await onSave(id, codes[id]);
      setMsg((m) => ({ ...m, [id]: "error" in res && res.error ? res.error : "Сақталды" }));
    });
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>EduPage</Th>
          <Th>Студент</Th>
          <Th>Smart Nation</Th>
          <Th>Ереже бойынша</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => {
          const hint = suggestSnationCode(g.name);
          return (
            <tr key={g.id}>
              <Td className="font-medium">{g.name}</Td>
              <Td>{g.students}</Td>
              <Td>
                <Input value={codes[g.id]} onChange={(e) => setCodes((c) => ({ ...c, [g.id]: e.target.value.toUpperCase() }))} placeholder={hint ?? "мысалы F3-2024"} className="h-8 w-36" />
              </Td>
              <Td className="text-muted-foreground">
                {hint ?? "—"}
                {hint && hint !== codes[g.id] && (
                  <button type="button" className="ml-2 text-xs text-primary hover:underline" onClick={() => setCodes((c) => ({ ...c, [g.id]: hint }))}>
                    қою
                  </button>
                )}
              </Td>
              <Td className="whitespace-nowrap">
                <Button size="sm" variant="outline" disabled={pending || codes[g.id] === (g.snationCode ?? "")} onClick={() => save(g.id)}>
                  Сақтау
                </Button>
                {msg[g.id] && <span className="ml-2 text-xs text-muted-foreground">{msg[g.id]}</span>}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

