import { cn } from "@/lib/utils";

/** Simple horizontal bars, value 0–max. */
export function BarList({ rows, max = 100, format = (v: number) => `${v.toFixed(0)}%` }: { rows: { label: string; value: number | null; tone?: string }[]; max?: number; format?: (v: number) => string }) {
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[5rem_1fr_3.5rem] items-center gap-3 text-sm">
          <span className="truncate font-medium">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full bg-primary", r.tone)} style={{ width: `${Math.max(0, Math.min(100, ((r.value ?? 0) / max) * 100))}%` }} />
          </div>
          <span className="text-right tabular-nums text-muted-foreground">{r.value === null ? "—" : format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Column chart for a short time series (e.g. weekly attendance). */
export function ColumnChart({ points, min = 60 }: { points: { label: string; value: number }[]; min?: number }) {
  return (
    <div className="flex h-44 items-end gap-2">
      {points.map((p) => (
        <div key={p.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[11px] tabular-nums text-muted-foreground">{p.value.toFixed(0)}%</span>
          <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(4, ((p.value - min) / (100 - min)) * 120)}px` }} />
          <span className="text-[10px] text-muted-foreground">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
