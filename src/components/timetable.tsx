import { BELLS, DAYS } from "@/lib/bells";
import { cn } from "@/lib/utils";

export type TimetableLesson = {
  id: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  title: string;
  code?: string | null;
  color: string;
  room: string;
  /** Group name for teachers, teacher name for students. */
  sub: string;
  conflict?: boolean;
};

/** Weekly grid in the EduPage layout: days down the side, bell periods across the top. */
export function Timetable({
  lessons,
  days = DAYS.length,
  today,
  renderAction,
}: {
  lessons: TimetableLesson[];
  days?: number;
  today?: number;
  renderAction?: (lesson: TimetableLesson) => React.ReactNode;
}) {
  const cols = `4.5rem repeat(${BELLS.length}, minmax(5.5rem, 1fr))`;
  return (
    <div className="overflow-x-auto rounded-[1.375rem] bg-card bezel">
      <div className="min-w-[900px]">
        <div className="grid border-b border-border" style={{ gridTemplateColumns: cols }}>
          <div />
          {BELLS.map((b) => (
            <div key={b.n} className="border-l border-border px-1 py-2 text-center">
              <div className="text-sm font-semibold">{b.n}</div>
              <div className="text-[10px] text-muted-foreground">
                {b.start}–{b.end}
              </div>
            </div>
          ))}
        </div>
        {DAYS.slice(0, days).map((d) => (
          <div
            key={d.n}
            className={cn("grid min-h-20 border-b border-border last:border-b-0", today === d.n && "bg-primary/5")}
            style={{ gridTemplateColumns: cols }}
          >
            <div className="flex flex-col items-center justify-center text-sm">
              <span className={cn("font-semibold", today === d.n && "text-primary")}>{d.short}</span>
            </div>
            {BELLS.map((b) => (
              <div key={b.n} className="border-l border-border" style={{ gridColumn: b.n + 1, gridRow: 1 }} />
            ))}
            {lessons
              .filter((l) => l.dayOfWeek === d.n)
              .map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    "relative z-10 m-1 flex flex-col justify-between overflow-hidden rounded-xl p-1.5 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(15,23,42,0.08)]",
                    l.conflict && "ring-2 ring-red-600",
                  )}
                  style={{ gridColumn: `${l.startPeriod + 1} / ${l.endPeriod + 2}`, gridRow: 1, background: l.color }}
                  title={`${l.code ? l.code + " " : ""}${l.title} · ${l.room} · ${l.sub}`}
                >
                  <div className="flex justify-between gap-1 text-[10px] font-medium opacity-80">
                    <span className="truncate">{l.code}</span>
                    <span className="shrink-0">{l.room}</span>
                  </div>
                  <div className="line-clamp-2 text-center text-xs font-semibold leading-tight">{l.title}</div>
                  <div className="flex items-end justify-between gap-1 text-[10px] opacity-80">
                    <span className="truncate">{l.sub}</span>
                    {renderAction?.(l)}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
