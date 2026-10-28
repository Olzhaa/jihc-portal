"use client";

import { useMemo, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseUserTable, type ImportResult, type ImportRow } from "@/lib/admin/import";
import { ROLE_LABEL } from "@/lib/roles";

const SAMPLE = "Аты-жөні\tЖСН\tТоп\tПошта\nАйдана Омарова\t070512600123\t2F-1\t\nДамир Ахметов\t070314500456\t2F-1\t";

/**
 * EduPage немесе басқа Excel кестесінен пайдаланушыларды жүктеу.
 * Адам ЖСН (студент) немесе пошта (қызметкер) бойынша табылады: бар болса жаңартылады, жоқ болса қосылады.
 */
export function UserImport({
  known,
  groups,
  onImport,
}: {
  known: { iins: string[]; emails: string[] };
  groups: string[];
  onImport: (rows: ImportRow[]) => Promise<ImportResult | { error: string }> | ImportResult | { error: string };
}) {
  const [text, setText] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [result, setResult] = useState<ImportResult | { error: string } | null>(null);
  const [pending, start] = useTransition();

  const rows = useMemo(() => parseUserTable(text, role), [text, role]);
  const iins = useMemo(() => new Set(known.iins), [known]);
  const emails = useMemo(() => new Set(known.emails), [known]);
  const groupSet = useMemo(() => new Set(groups), [groups]);
  const ok = rows.filter((r) => !r.error);
  const newGroups = [...new Set(ok.map((r) => r.group).filter((g): g is string => !!g && !groupSet.has(g)))];
  const exists = (r: ImportRow) => (r.iin && iins.has(r.iin)) || (r.email && emails.has(r.email));

  function run() {
    start(async () => {
      setResult(await onImport(ok));
      setText("");
    });
  }

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>EduPage-тен немесе Excel-ден тізімді ашыңыз (бағандар: Аты-жөні, ЖСН, Топ, Пошта, Рөлі; тақырып жолы болса жақсы).</li>
        <li>Кестені белгілеп көшіріп (Ctrl+C), төмендегі өріске қойыңыз (Ctrl+V). CSV мәтіні де болады.</li>
        <li>Алдын ала қарауды тексеріп, «Импорттау» басыңыз. Жоқ топтар өздігінен құрылады.</li>
      </ol>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="imp-role">Рөл бағаны жоқ болса</Label>
          <Select id="imp-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-48">
            {(["STUDENT", "TEACHER", "PARENT"] as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
          Үлгі қою
        </Button>
      </div>
      <Textarea value={text} onChange={(e) => (setText(e.target.value), setResult(null))} rows={8} placeholder={"Аты-жөні\tЖСН\tТоп\tПошта"} className="font-mono text-xs" />

      {result && ("error" in result ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{result.error}</p>
      ) : (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Дайын: {result.created} жаңа, {result.updated} жаңартылды
          {result.groupsCreated.length > 0 && `, жаңа топтар: ${result.groupsCreated.join(", ")}`}
          {result.skipped > 0 && `, ${result.skipped} өткізілді`}.
        </p>
      ))}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>{rows.length} жол:</span>
            <Badge variant="success">{ok.filter((r) => !exists(r)).length} жаңа</Badge>
            <Badge variant="info">{ok.filter(exists).length} жаңартылады</Badge>
            {rows.length - ok.length > 0 && <Badge variant="danger">{rows.length - ok.length} қате</Badge>}
            {newGroups.length > 0 && <span className="text-muted-foreground">Жаңа топтар: {newGroups.join(", ")}</span>}
            <Button className="ml-auto" disabled={pending || !ok.length} onClick={run}>
              {pending ? "Импортталуда…" : `Импорттау (${ok.length})`}
            </Button>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Аты-жөні</Th>
                <Th>Рөлі</Th>
                <Th>ЖСН</Th>
                <Th>Топ</Th>
                <Th>Пошта</Th>
                <Th>Нәтиже</Th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((r) => (
                <tr key={r.line}>
                  <Td className="text-muted-foreground">{r.line}</Td>
                  <Td className="font-medium">{r.name}</Td>
                  <Td>{ROLE_LABEL[r.role]}</Td>
                  <Td>{r.iin}</Td>
                  <Td>{r.group}</Td>
                  <Td>{r.email}</Td>
                  <Td>{r.error ? <Badge variant="danger">{r.error}</Badge> : exists(r) ? <Badge variant="info">жаңартылады</Badge> : <Badge variant="success">жаңа</Badge>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {rows.length > 300 && <p className="text-xs text-muted-foreground">Алғашқы 300 жол көрсетілді; импортқа бәрі кіреді.</p>}
        </>
      )}
    </div>
  );
}
