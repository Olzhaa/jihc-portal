"use client";

import { useState, useTransition } from "react";
import type { AttendanceStatus, GradeType } from "@prisma/client";
import { saveJournal, type JournalRow } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ATTENDANCE_LABEL, GRADE_TYPE_LABEL, gradeTone } from "@/lib/grades";
import { cn } from "@/lib/utils";

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
const TONE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-600 text-white",
  ABSENT: "bg-red-600 text-white",
  LATE: "bg-amber-500 text-white",
  EXCUSED: "bg-sky-600 text-white",
};

export function JournalEditor({
  lessonId,
  date,
  students,
  initial,
  excused,
}: {
  lessonId: string;
  date: string;
  students: { id: string; name: string }[];
  initial: Record<string, { status: AttendanceStatus; grade: string }>;
  /** Students with an approved medical certificate covering this date. */
  excused: string[];
}) {
  const [gradeType, setGradeType] = useState<GradeType>("CURRENT");
  const [rows, setRows] = useState<JournalRow[]>(() =>
    students.map((s) => ({
      studentId: s.id,
      status: initial[s.id]?.status ?? (excused.includes(s.id) ? "EXCUSED" : "PRESENT"),
      grade: initial[s.id]?.grade ?? "",
    })),
  );
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<JournalRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Баға түрі:</span>
        <Select value={gradeType} onChange={(e) => setGradeType(e.target.value as GradeType)} className="w-40">
          {(Object.keys(GRADE_TYPE_LABEL) as GradeType[]).map((t) => (
            <option key={t} value={t}>
              {GRADE_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Button variant="outline" size="sm" onClick={() => setRows((r) => r.map((x) => ({ ...x, status: x.status === "EXCUSED" ? x.status : "PRESENT" })))}>
          Барлығы қатысты
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="w-10 px-3 py-2 text-left">№</th>
              <th className="px-3 py-2 text-left">Студент</th>
              <th className="px-3 py-2 text-left">Қатысу</th>
              <th className="w-28 px-3 py-2 text-left">Баға (0–100)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2 font-medium">
                  {s.name}
                  {excused.includes(s.id) && <span className="ml-2 text-xs text-sky-600">анықтама бар</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => update(i, { status: st })}
                        className={cn(
                          "rounded-md border border-border px-2 py-1 text-xs",
                          rows[i].status === st ? TONE[st] : "bg-card hover:bg-muted",
                        )}
                      >
                        {ATTENDANCE_LABEL[st]}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Input
                    inputMode="numeric"
                    value={rows[i].grade}
                    disabled={rows[i].status === "ABSENT" || rows[i].status === "EXCUSED"}
                    onChange={(e) => update(i, { grade: e.target.value.replace(/[^\d.]/g, "") })}
                    className={cn("h-8 w-20 text-center font-semibold", rows[i].grade && gradeTone(Number(rows[i].grade)))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveJournal({ lessonId, date, gradeType, rows });
              setMsg(res.error ? { text: res.error } : { ok: true, text: "Сақталды" });
            })
          }
        >
          {pending ? "Сақталуда…" : "Сақтау"}
        </Button>
        {msg && <span className={cn("text-sm", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span>}
      </div>
    </div>
  );
}
