"use client";

import { useState, useTransition } from "react";
import type { GradeType } from "@prisma/client";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { CATEGORIES, DEFAULT_WORK_TYPE, WEIGHTS, WORK_TYPES, halfYear, workTypeLabel } from "@/lib/assessment";
import {
  buildGradebook,
  cleanAssignment,
  edupageColor,
  edupageRows,
  parseGradeInput,
  shortDate,
  snationRows,
  type AssignmentDraft,
  type BookAssignment,
  type BookAttendance,
  type BookColumn,
  type BookGrade,
} from "@/lib/gradebook";
import { downloadText, safeName, toCsv } from "@/lib/export";
import { gradeTone } from "@/lib/grades";
import { cn, toISODate } from "@/lib/utils";

type Result = { error?: string } | { ok: true } | void;

/** Saving is supplied by the parent (server actions or the demo store). Without it the table is read-only. */
export type GradebookActions = {
  setGrade: (input: { studentId: string; column: BookColumn; gradeId?: string; value: number | null }) => Promise<Result> | Result;
  saveAssignment: (input: AssignmentDraft & { id?: string }) => Promise<Result> | Result;
  deleteAssignment: (id: string) => Promise<Result> | Result;
};

/**
 * Пән бойынша бағалар кітабы, EduPage «Оценки» бетіндегідей: әр категорияның астында «назначение»
 * бағандары, бағаны ұяшыққа тікелей жазу, EduPage түстері, салмақты орташа, қорытынды баға,
 * жіберілген сағаттар. Екі экспорт: EduPage пішімі және Smart Nation журналы пішімі.
 */
export function GradebookTable({
  title,
  students,
  grades,
  attendance,
  assignments = [],
  actions,
}: {
  /** Used in file names, e.g. "2F-1 Graph Design". */
  title: string;
  students: { id: string; name: string }[];
  grades: BookGrade[];
  attendance: BookAttendance[];
  assignments?: BookAssignment[];
  actions?: GradebookActions;
}) {
  const [half, setHalf] = useState<1 | 2>(() => halfYear(new Date()) as 1 | 2);
  const [editing, setEditing] = useState<"new" | BookColumn | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const book = buildGradebook({ students, grades, attendance, assignments, half });
  const groups = CATEGORIES.map((c) => ({ ...c, columns: book.columns.filter((col) => col.type === c.type) }));

  const report = (r: Result) => setMsg(r && "error" in r && r.error ? r.error : null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2] as const).map((h) => (
          <Button key={h} size="sm" variant={half === h ? "default" : "outline"} onClick={() => setHalf(h)}>
            {h}-жартыжылдық
          </Button>
        ))}
        {actions && (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Жаңа назначение / емтихан
          </Button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadText(`${safeName(title)}_EduPage_${half}.csv`, toCsv(edupageRows(book, half)))}>
            <Download className="h-4 w-4" /> EduPage үлгісі
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadText(`${safeName(title)}_SmartNation_${half}.csv`, toCsv(snationRows(book)))}>
            <Download className="h-4 w-4" /> Smart Nation үлгісі
          </Button>
        </div>
      </div>

      {actions && editing && (
        <AssignmentForm
          key={editing === "new" ? "new" : editing.key}
          column={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={async (d) => {
            const r = await actions.saveAssignment(editing === "new" || !editing.assignmentId ? d : { ...d, id: editing.assignmentId });
            if (!(r && "error" in r && r.error)) setEditing(null);
            return r;
          }}
          onDelete={
            editing !== "new" && editing.assignmentId
              ? async () => {
                  const r = await actions.deleteAssignment(editing.assignmentId!);
                  if (!(r && "error" in r && r.error)) setEditing(null);
                  return r;
                }
              : undefined
          }
        />
      )}
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted text-xs">
            <tr>
              <th rowSpan={2} className="w-8 border-b border-border px-2 py-2 text-left">#</th>
              <th rowSpan={2} className="sticky left-0 z-10 border-b border-border bg-muted px-2 py-2 text-left">Аты-жөні</th>
              {groups.map((g) => (
                <th key={g.type} colSpan={Math.max(1, g.columns.length)} className="border-b border-l border-border px-2 py-1.5 text-left font-semibold">
                  {g.label} {half}
                </th>
              ))}
              <th rowSpan={2} className="border-b border-l border-border px-2 py-2 text-center" title="Σ(баға × коэффициент) / Σ коэффициент">
                Орташа
              </th>
              <th rowSpan={2} className="border-b border-border px-2 py-2 text-center">Қорытынды</th>
              <th rowSpan={2} className="border-b border-border px-2 py-2 text-center" title="Жіберген сағат / оның ішінде себепсіз">
                Жіберген сағ.
              </th>
            </tr>
            <tr>
              {groups.map((g) =>
                g.columns.length === 0 ? (
                  <th key={g.type} className="border-b border-l border-border px-2 py-1 font-normal text-muted-foreground/60">—</th>
                ) : (
                  g.columns.map((col, i) => (
                    <th key={col.key} className={cn("h-24 border-b border-border px-0.5 align-bottom font-normal", i === 0 && "border-l")}>
                      <button
                        type="button"
                        disabled={!actions}
                        onClick={() => setEditing(col)}
                        title={`${col.title} · ${shortDate(col.date)} · ${workTypeLabel(col.workType)} · ×${col.weight}`}
                        className="mx-auto block max-h-24 truncate rounded px-0.5 text-left [writing-mode:vertical-rl] rotate-180 enabled:hover:bg-card"
                      >
                        {col.assignmentId ? <span className="font-medium text-foreground">{col.title}</span> : col.title}
                        {col.weight !== 1 && <span className="text-muted-foreground"> ×{col.weight}</span>}
                      </button>
                    </th>
                  ))
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {book.rows.map((r, row) => (
              <tr key={r.student.id} className="border-t border-border">
                <td className="px-2 py-1 text-muted-foreground">{row + 1}</td>
                <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-1 font-medium">{r.student.name}</td>
                {groups.map((g) =>
                  g.columns.length === 0 ? (
                    <td key={g.type} className="border-l border-border" />
                  ) : (
                    g.columns.map((col, i) => (
                      <td key={col.key} className={cn("p-0.5 text-center", i === 0 && "border-l border-border")}>
                        <GradeCell
                          grade={r.cells[col.key]}
                          cellId={`${col.key}:${row}`}
                          nextId={`${col.key}:${row + 1}`}
                          readOnly={!actions}
                          onCommit={async (value) => {
                            const res = await actions?.setGrade({ studentId: r.student.id, column: col, gradeId: r.cells[col.key]?.id, value });
                            report(res);
                          }}
                          onInvalid={setMsg}
                        />
                      </td>
                    ))
                  ),
                )}
                <td className={cn("border-l border-border px-2 py-1 text-center font-semibold", r.avg !== null && gradeTone(r.avg))}>
                  {r.avg === null ? "—" : r.avg.toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">{r.five === null ? "—" : <Badge variant={r.five <= 2 ? "danger" : "default"}>{r.five}</Badge>}</td>
                <td className="px-2 py-1 text-center text-xs">
                  {r.missed.total}
                  {r.missed.unexcused > 0 && <span className="text-red-600"> / {r.missed.unexcused}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {[
          [30, "0–49 → 2"],
          [60, "50–69 → 3"],
          [80, "70–89 → 4"],
          [95, "90–100 → 5"],
        ].map(([v, label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block h-3 w-5 rounded-sm" style={{ background: edupageColor(v as number) }} /> {label}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {actions && "Бағаны ұяшыққа жазып, Enter басыңыз (келесі студентке өтеді); өшіру үшін ұяшықты тазалаңыз. Баған атауын бассаңыз, назначениені өзгертуге болады. "}
        Орташа балл EduPage-тегідей коэффициентпен есептеледі. Smart Nation үлгісінде әр баған бір сабақ күні: «н» — себепсіз, «с» — себепті, «к» — кешікті, «е» — ерте кетті.
      </p>
    </div>
  );
}

function GradeCell({
  grade,
  cellId,
  nextId,
  readOnly,
  onCommit,
  onInvalid,
}: {
  grade?: BookGrade;
  cellId: string;
  nextId: string;
  readOnly: boolean;
  onCommit: (value: number | null) => Promise<void>;
  onInvalid: (msg: string) => void;
}) {
  const saved = grade ? String(grade.value) : "";
  const [text, setText] = useState(saved);
  const [lastSaved, setLastSaved] = useState(saved);
  const [pending, start] = useTransition();
  // Pick up changes saved elsewhere (another cell's save re-renders the table with fresh data).
  if (saved !== lastSaved) {
    setLastSaved(saved);
    setText(saved);
  }
  const value = text.trim() === "" ? null : Number(text.replace(",", "."));

  const commit = () => {
    if (text.trim() === saved) return;
    const parsed = parseGradeInput(text);
    if (parsed !== null && typeof parsed === "object") {
      onInvalid(parsed.error);
      setText(saved);
      return;
    }
    start(() => onCommit(parsed));
  };

  if (readOnly) {
    return grade ? (
      <span className="inline-block min-w-9 rounded px-1 py-0.5 text-xs font-semibold text-slate-900" style={{ background: edupageColor(grade.value) }}>
        {grade.value}
      </span>
    ) : null;
  }
  return (
    <input
      data-cell={cellId}
      value={text}
      inputMode="decimal"
      aria-label="Баға"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const next = document.querySelector<HTMLInputElement>(`[data-cell="${CSS.escape(nextId)}"]`);
          if (next) next.focus();
          else e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setText(saved);
        }
      }}
      className={cn(
        "h-7 w-11 rounded border border-transparent text-center text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-card dark:focus:text-foreground",
        value === null && "bg-transparent hover:border-border",
        pending && "opacity-50",
      )}
      style={value !== null && Number.isFinite(value) ? { background: edupageColor(value) } : undefined}
    />
  );
}

function AssignmentForm({
  column,
  onSave,
  onDelete,
  onCancel,
}: {
  /** Existing column being edited; null for a new assignment. */
  column: BookColumn | null;
  onSave: (d: AssignmentDraft) => Promise<Result>;
  onDelete?: () => Promise<Result>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<AssignmentDraft>(() =>
    column
      ? { title: column.assignmentId ? column.title : "", type: column.type, weight: column.weight, workType: column.workType, date: toISODate(column.date) }
      : { title: "", type: "CURRENT", weight: 1, workType: DEFAULT_WORK_TYPE.CURRENT, date: toISODate(new Date()) },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fromJournal = column !== null && !column.assignmentId;

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setError(r && "error" in r && r.error ? r.error : null);
    });

  return (
    <form
      className="space-y-3 rounded-xl border border-border bg-muted/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const c = cleanAssignment(d);
        if ("error" in c) return setError(c.error ?? null);
        run(() => onSave(d));
      }}
    >
      <div className="text-sm font-semibold">{column === null ? "Жаңа назначение / емтихан" : fromJournal ? "Журналдан қойылған бағалар" : "Назначениені өзгерту"}</div>
      {fromJournal ? (
        <p className="text-sm text-muted-foreground">
          {shortDate(column.date)} күнгі сабақта журналдан қойылған бағалар ({workTypeLabel(column.workType)}, ×{column.weight}). Оларды журналда өзгертуге болады, ал осы кестеде тек бағаның өзін түзетесіз.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <Label>Атауы</Label>
            <Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="мысалы, Бақылау жұмысы 1" autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Категория</Label>
            <Select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as GradeType, workType: DEFAULT_WORK_TYPE[e.target.value as GradeType] })}>
              {CATEGORIES.map((c) => (
                <option key={c.type} value={c.type}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Коэффициент</Label>
            <Select value={String(d.weight)} onChange={(e) => setD({ ...d, weight: Number(e.target.value) })}>
              {WEIGHTS.map((w) => (
                <option key={w} value={w}>×{w}{w === 1 ? " (стандарт)" : ""}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Күні</Label>
            <Input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <Label>Smart Nation-дағы түрі</Label>
            <Select value={d.workType} onChange={(e) => setD({ ...d, workType: e.target.value })}>
              {WORK_TYPES.map((w) => (
                <option key={w.key} value={w.key}>{w.label}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!fromJournal && (
          <Button type="submit" size="sm" disabled={pending}>
            Сақтау
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          {fromJournal ? "Жабу" : "Болдырмау"}
        </Button>
        {onDelete && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto text-red-600"
            disabled={pending}
            onClick={() => confirm("Назначение мен оның барлық бағалары өшіріледі. Жалғастыру керек пе?") && run(onDelete)}
          >
            Өшіру
          </Button>
        )}
      </div>
    </form>
  );
}
