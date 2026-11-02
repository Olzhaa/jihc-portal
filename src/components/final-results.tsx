"use client";

import { useState, useTransition } from "react";
import type { FinalPeriod } from "@prisma/client";
import { Download, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/widgets";
import { PERIODS, describeConfig, parseFinalInput, yearLabel, type ResultCell, type Results, type ResultsConfig } from "@/lib/results";
import { resultsWorkbook } from "@/lib/results-export";
import { XLSX_MIME } from "@/lib/xlsx";
import { downloadBlob, safeName } from "@/lib/export";
import { edupageColor } from "@/lib/gradebook";
import { cn } from "@/lib/utils";

type Result = { error?: string } | { ok: true } | void;

/** Saving is supplied by the parent (server actions or the demo store). Without it the table is read-only. */
export type ResultsActions = {
  setFinal: (input: { studentId: string; courseId: string; period: FinalPeriod; value: number | null }) => Promise<Result> | Result;
  lock: () => Promise<Result> | Result;
  unlock: () => Promise<Result> | Result;
};

const MISSED: { key: "SEMESTER1" | "SEMESTER2" | "YEAR"; label: string }[] = [
  { key: "SEMESTER1", label: "1-жартыжылдық" },
  { key: "SEMESTER2", label: "2-жартыжылдық" },
  { key: "YEAR", label: "Жыл бойы" },
];

const fmt = (v: number | null) => (v === null ? "" : String(Math.round(v * 10) / 10).replace(".", ","));

/**
 * Smart Nation «Қорытындылар» беті: топтағы әр студенттің пәндер бойынша 1-, 2-жартыжылдық,
 * жылдық және емтихан бағалары, жартыжылдар бойынша жіберілген сағаттар (барлығы / себепсіз).
 * Бағалар журналдан формула бойынша есептеледі; завуч оларды бекітіп, қажет болса қолмен түзетеді.
 */
export function FinalResultsTable({
  group,
  results,
  config,
  actions,
}: {
  group: { name: string; snationCode: string | null };
  results: Results;
  config: ResultsConfig;
  actions?: ResultsActions;
}) {
  const [view, setView] = useState<"all" | FinalPeriod>("all");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const periods = view === "all" ? PERIODS : PERIODS.filter((p) => p.key === view);
  const { rows, courses, summary, locked } = results;
  const report = (r: Result) => setMsg(r && "error" in r && r.error ? r.error : null);
  const run = (fn: () => Promise<Result> | Result) => start(async () => report(await fn()));

  const shownFails = rows.filter((r) => periods.some((p) => r.fails[p.key] > 0)).length;
  const missedTotal = rows.reduce((s, r) => s + r.missed.YEAR.total, 0);
  const missedUnexcused = rows.reduce((s, r) => s + r.missed.YEAR.unexcused, 0);
  const pendingCells = locked.filled - locked.stored;

  const exportXlsx = () => {
    const data = resultsWorkbook(results, { group: group.name, snationCode: group.snationCode, periods: periods.map((p) => p.key) }, config);
    const suffix = view === "all" ? "" : `_${PERIODS.find((p) => p.key === view)!.label}`;
    downloadBlob(`${safeName(group.name)}_Қорытындылар_${yearLabel(results.year)}${safeName(suffix)}.xlsx`, new Blob([data as BlobPart], { type: XLSX_MIME }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Студент" value={String(rows.length)} hint={`${courses.length} пән`} />
        <StatCard
          label="Қанағаттанарлықсыз"
          value={String(shownFails)}
          hint={`${config.passMark}-ден төмен бағасы бар студент`}
          tone={shownFails ? "text-red-600 dark:text-red-400" : undefined}
        />
        <StatCard label="Жіберген сағат" value={String(missedTotal)} hint={`оның ішінде себепсіз ${missedUnexcused}`} tone={missedUnexcused ? "text-amber-600 dark:text-amber-400" : undefined} />
        <StatCard
          label="Бекітілген"
          value={locked.filled ? `${Math.round((Math.min(locked.stored, locked.filled) / locked.filled) * 100)}%` : "—"}
          hint={locked.manual ? `${locked.stored} баға, оның ${locked.manual} қолмен` : `${locked.stored} / ${locked.filled} баға`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={view === "all" ? "default" : "outline"} onClick={() => setView("all")}>
          Барлығы
        </Button>
        {PERIODS.map((p) => (
          <Button key={p.key} size="sm" variant={view === p.key ? "default" : "outline"} onClick={() => setView(p.key)}>
            {p.label}
          </Button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {actions && (
            <>
              <Button
                size="sm"
                variant="success"
                disabled={pending || pendingCells <= 0}
                title="Журналдан есептелген бағаларды сақтап қояды: кейін журнал өзгерсе де, қорытынды өзгермейді"
                onClick={() => confirm(`${pendingCells} есептелген баға бекітіледі. Жалғастыру керек пе?`) && run(actions.lock)}
              >
                <Lock className="h-4 w-4" /> Қорытындыны бекіту
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || locked.stored - locked.manual <= 0}
                title="Бекітуді алып, бағаларды журналдан қайта есептейді. Қолмен енгізілген бағалар сақталады."
                onClick={() => confirm("Бекітілген бағалар журналдан қайта есептеледі (қолмен қойылғандары қалады). Жалғастыру керек пе?") && run(actions.unlock)}
              >
                <LockOpen className="h-4 w-4" /> Қайта есептеу
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={exportXlsx} disabled={!courses.length}>
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {locked.stale > 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Бекітілгеннен кейін журнал өзгерген: {locked.stale} бағаның қазіргі есептелген мәні басқа (сары жиекпен белгіленген). Жаңарту үшін «Қайта есептеу» басыңыз.
        </p>
      )}
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {yearLabel(results.year)} оқу жылында бұл топта әзірге баға жоқ.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted text-xs">
              <tr>
                <th rowSpan={2} className="w-8 border-b border-border px-2 py-2 text-left">№</th>
                <th rowSpan={2} className="sticky left-0 z-10 min-w-48 border-b border-border bg-muted px-2 py-2 text-left">Білім алушының аты-жөні</th>
                {courses.map((c) => (
                  <th key={c.id} colSpan={periods.length} className="max-w-56 border-b border-l border-border px-2 py-1.5 text-center font-semibold" title={c.code ? `${c.code} ${c.title}` : c.title}>
                    <div className="line-clamp-2">{c.title}</div>
                    {c.code && <div className="truncate font-normal text-muted-foreground">{c.code}</div>}
                  </th>
                ))}
                {MISSED.map((m) => (
                  <th key={m.key} colSpan={2} className="border-b border-l border-border px-2 py-1.5 text-center font-semibold">
                    Жіберген сағ.
                    <div className="font-normal text-muted-foreground">{m.label}</div>
                  </th>
                ))}
              </tr>
              <tr>
                {courses.map((c) =>
                  periods.map((p, i) => (
                    <th key={`${c.id}:${p.key}`} title={p.label} className={cn("border-b border-border px-1 py-1 text-center font-normal whitespace-nowrap", i === 0 && "border-l")}>
                      {p.short}
                    </th>
                  )),
                )}
                {MISSED.map((m) => (
                  <th key={m.key} colSpan={2} className="border-b border-l border-border p-0 font-normal">
                    <div className="grid grid-cols-2">
                      <span className="px-1 py-1" title="барлығы">барл.</span>
                      <span className="px-1 py-1 text-red-600" title="оның ішінде себепсіз">себепс.</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, row) => (
                <tr key={r.student.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-2 py-1 text-muted-foreground">{row + 1}</td>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-1 font-medium">{r.student.name}</td>
                  {courses.map((c) =>
                    periods.map((p, i) => (
                      <td key={`${c.id}:${p.key}`} className={cn("p-0.5 text-center", i === 0 && "border-l border-border")}>
                        <FinalCell
                          cell={r.cells[c.id][p.key]}
                          passMark={config.passMark}
                          markManual={!(p.key === "EXAM" && config.examSource === "manual")}
                          cellId={`${c.id}:${p.key}:${row}`}
                          nextId={`${c.id}:${p.key}:${row + 1}`}
                          readOnly={!actions}
                          onInvalid={setMsg}
                          onCommit={async (value) => report(await actions?.setFinal({ studentId: r.student.id, courseId: c.id, period: p.key, value }))}
                        />
                      </td>
                    )),
                  )}
                  {MISSED.map((m) => (
                    <td key={m.key} colSpan={2} className="border-l border-border p-0 text-center text-xs">
                      <div className="grid grid-cols-2">
                        <span className="px-1 py-1">{r.missed[m.key].total || ""}</span>
                        <span className={cn("px-1 py-1", r.missed[m.key].unexcused > 0 && "font-semibold text-red-600")}>{r.missed[m.key].unexcused || ""}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/60 text-xs">
              <tr className="border-t-2 border-border">
                <td />
                <td className="sticky left-0 z-10 bg-muted px-2 py-1.5 font-semibold">Топ бойынша орташа</td>
                {courses.map((c) =>
                  periods.map((p, i) => {
                    const s = summary[c.id][p.key];
                    return (
                      <td
                        key={`${c.id}:${p.key}`}
                        className={cn("px-1 py-1.5 text-center font-semibold", i === 0 && "border-l border-border")}
                        title={s.count ? `${s.count} баға${s.fails ? `, ${s.fails} қанағаттанарлықсыз` : ""}` : undefined}
                      >
                        {s.avg === null ? "" : fmt(Math.round(s.avg * 10) / 10)}
                        {s.fails > 0 && <div className="font-normal text-red-600">{s.fails} ✗</div>}
                      </td>
                    );
                  }),
                )}
                {MISSED.map((m) => (
                  <td key={m.key} colSpan={2} className="border-l border-border p-0 text-center font-semibold">
                    <div className="grid grid-cols-2">
                      <span className="px-1 py-1.5">{rows.reduce((s, r) => s + r.missed[m.key].total, 0) || ""}</span>
                      <span className="px-1 py-1.5 text-red-600">{rows.reduce((s, r) => s + r.missed[m.key].unexcused, 0) || ""}</span>
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {[
          [30, `0–${config.passMark - 1}: қанағаттанарлықсыз`],
          [60, "50–69"],
          [80, "70–89"],
          [95, "90–100"],
        ].map(([v, label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block h-3 w-5 rounded-sm" style={{ background: v === 30 ? "#ef9a9a" : edupageColor(v as number) }} /> {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-5 rounded-sm ring-2 ring-sky-500" /> қолмен енгізілген
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-5 rounded-sm ring-2 ring-amber-500" /> бекітілгеннен кейін журнал өзгерген
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" /> {locked.stored ? `${locked.stored} баға бекітілген` : "әзірге ештеңе бекітілмеген: бағалар журналдан тікелей есептеледі"}
        </span>
      </div>

      <details className="rounded-xl border border-border p-4 text-sm">
        <summary className="cursor-pointer font-medium">Қорытынды баға қалай есептеледі</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {describeConfig(config).map((l) => (
            <li key={l}>{l}</li>
          ))}
          <li>Жіберген сағат: бір қоңырау = 1 академиялық сағат. «Жоқ» — себепсіз, «Себепті» (расталған анықтама) — себепті.</li>
          {actions && <li>Бағаны түзету үшін ұяшыққа жазып Enter басыңыз; ұяшықты тазаласаңыз, баға қайтадан журналдан есептеледі.</li>}
        </ul>
      </details>
    </div>
  );
}

function FinalCell({
  cell,
  passMark,
  markManual,
  cellId,
  nextId,
  readOnly,
  onCommit,
  onInvalid,
}: {
  cell: ResultCell;
  passMark: number;
  /** Емтихан бағасы әрқашан қолмен қойылатын болса, оны бөлек белгілеудің мәні жоқ. */
  markManual: boolean;
  cellId: string;
  nextId: string;
  readOnly: boolean;
  onCommit: (value: number | null) => Promise<void>;
  onInvalid: (msg: string) => void;
}) {
  const saved = cell.value === null ? "" : fmt(cell.value);
  const [text, setText] = useState(saved);
  const [lastSaved, setLastSaved] = useState(saved);
  const [pending, start] = useTransition();
  if (saved !== lastSaved) {
    setLastSaved(saved);
    setText(saved);
  }
  const manual = cell.stored?.manual;
  const stale = cell.stored && !cell.stored.manual && cell.computed !== null && cell.computed !== cell.stored.value;
  const title = [
    manual ? "Қолмен енгізілген" : cell.stored ? "Бекітілген" : "Журналдан есептелген (бекітілмеген)",
    cell.stored && cell.computed !== null && cell.computed !== cell.stored.value ? `журнал бойынша қазір: ${fmt(cell.computed)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const shown = text.trim() === "" ? null : Number(text.replace(",", "."));
  const bg = (v: number) => (v < passMark ? "#ef9a9a" : edupageColor(v));
  const ring = manual && markManual ? "ring-2 ring-sky-500" : stale ? "ring-2 ring-amber-500" : "";

  if (readOnly) {
    return cell.value === null ? null : (
      <span title={title} className={cn("inline-block min-w-9 rounded px-1 py-0.5 text-xs font-semibold text-slate-900", ring)} style={{ background: bg(cell.value) }}>
        {fmt(cell.value)}
      </span>
    );
  }

  const commit = () => {
    if (text.trim() === saved) return;
    const parsed = parseFinalInput(text);
    if (parsed !== null && typeof parsed === "object") {
      onInvalid(parsed.error);
      setText(saved);
      return;
    }
    start(() => onCommit(parsed));
  };

  return (
    <input
      data-cell={cellId}
      value={text}
      title={title}
      inputMode="decimal"
      aria-label="Қорытынды баға"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const next = document.querySelector<HTMLInputElement>(`[data-cell="${CSS.escape(nextId)}"]`);
          if (next) next.focus();
          else e.currentTarget.blur();
        } else if (e.key === "Escape") setText(saved);
      }}
      className={cn(
        "h-7 w-11 rounded border border-transparent text-center text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-card dark:focus:text-foreground",
        shown === null && "bg-transparent hover:border-border",
        ring,
        pending && "opacity-50",
      )}
      style={shown !== null && Number.isFinite(shown) ? { background: bg(shown) } : undefined}
    />
  );
}

/** Студент пен ата-анаға: бір студенттің пәндер бойынша қорытынды бағалары (тек қарау). */
export function StudentFinalResults({ results, passMark }: { results: Results; passMark: number }) {
  const row = results.rows[0];
  if (!row || !results.courses.length) return null;
  const draft = results.courses.some((c) => PERIODS.some((p) => row.cells[c.id][p.key].value !== null && !row.cells[c.id][p.key].stored));
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Пән</th>
            {PERIODS.map((p) => (
              <th key={p.key} className="px-2 py-2 text-center">{p.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.courses.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-3 py-1.5">
                <div className="font-medium">{c.title}</div>
                {c.code && <div className="text-xs text-muted-foreground">{c.code}</div>}
              </td>
              {PERIODS.map((p) => {
                const v = row.cells[c.id][p.key].value;
                return (
                  <td key={p.key} className="px-2 py-1.5 text-center">
                    {v === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="inline-block min-w-9 rounded px-1 py-0.5 text-xs font-semibold text-slate-900" style={{ background: v < passMark ? "#ef9a9a" : edupageColor(v) }}>
                        {fmt(v)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span>
          Жіберген сағат: 1-жартыжылдық {row.missed.SEMESTER1.total} (себепсіз {row.missed.SEMESTER1.unexcused}), 2-жартыжылдық {row.missed.SEMESTER2.total} (себепсіз{" "}
          {row.missed.SEMESTER2.unexcused})
        </span>
        <Badge variant={row.missed.YEAR.unexcused > 0 ? "danger" : "default"}>Жыл бойы {row.missed.YEAR.total} сағ.</Badge>
        {draft && <span className="w-full">Бекітілмеген бағалар журнал бойынша есептелген: оқу бөлімі қорытындыны бекіткенге дейін өзгеруі мүмкін.</span>}
      </div>
    </div>
  );
}
