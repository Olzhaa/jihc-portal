"use client";

import { useState, useTransition } from "react";
import type { AttendanceStatus, GradeType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ATTENDANCE_LABEL, ATTENDANCE_STATUSES, gradeTone } from "@/lib/grades";
import { CATEGORIES, DEFAULT_WORK_TYPE, WEIGHTS, WORK_TYPES } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import type { JournalColumn, JournalPayload, JournalRow } from "@/lib/journal";

const TONE: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-600 text-white",
  ABSENT: "bg-red-600 text-white",
  LATE: "bg-amber-500 text-white",
  LEFT_EARLY: "bg-orange-500 text-white",
  EXCUSED: "bg-sky-600 text-white",
};

const NO_GRADE: AttendanceStatus[] = ["ABSENT", "EXCUSED"];

/**
 * Бір сабақтың журналы: тақырып пен үй жұмысы (EduPage «Классный журнал»),
 * қатысу (4 күй + анықтамамен себепті) және таңдалған категорияға баға.
 * Деректерді сақтау тәсілін ата-компонент береді (сервер әрекеті немесе демо дерекқоры).
 */
export function JournalForm({
  students,
  excused,
  status,
  columns,
  record,
  planTopics,
  onSave,
}: {
  students: { id: string; name: string }[];
  /** Students with an approved medical certificate covering this date. */
  excused: string[];
  status: Record<string, AttendanceStatus>;
  /** Grades already given on this lesson, per category. */
  columns: Partial<Record<GradeType, JournalColumn>>;
  record: { topic: string; homework: string };
  /** Topics from the teacher's syllabus for this course («Выбрать из плана»). */
  planTopics: { chapter: string; topic: string }[];
  onSave: (p: JournalPayload) => Promise<{ error?: string } | { ok: true }> | { error?: string } | { ok: true };
}) {
  const [gradeType, setGradeType] = useState<GradeType>("CURRENT");
  const col = (t: GradeType) => columns[t] ?? { weight: 1, workType: DEFAULT_WORK_TYPE[t], grades: {} };
  const [weight, setWeight] = useState(col("CURRENT").weight);
  const [workType, setWorkType] = useState(col("CURRENT").workType);
  const [topic, setTopic] = useState(record.topic);
  const [homework, setHomework] = useState(record.homework);
  const [rows, setRows] = useState<JournalRow[]>(() =>
    students.map((s) => ({
      studentId: s.id,
      status: status[s.id] ?? (excused.includes(s.id) ? "EXCUSED" : "PRESENT"),
      grade: col("CURRENT").grades[s.id] ?? "",
    })),
  );
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<JournalRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  function switchCategory(t: GradeType) {
    const c = col(t);
    setGradeType(t);
    setWeight(c.weight);
    setWorkType(c.workType);
    setRows((r) => r.map((x) => ({ ...x, grade: c.grades[x.studentId] ?? "" })));
  }

  function save() {
    start(async () => {
      const res = await onSave({ gradeType, weight, workType, topic, homework, rows });
      setMsg("error" in res && res.error ? { text: res.error } : { ok: true, text: "Сақталды" });
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Сабақтың тақырыбы</Label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Тақырыпты жазыңыз немесе жоспардан таңдаңыз" />
          {planTopics.length > 0 && (
            <Select value="" onChange={(e) => e.target.value && setTopic(e.target.value)} className="h-8 text-xs">
              <option value="">Жоспардан таңдау…</option>
              {planTopics.map((t, i) => (
                <option key={i} value={t.topic}>
                  {t.chapter ? `${t.chapter} · ` : ""}
                  {t.topic}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="space-y-1">
          <Label>Үй жұмысы</Label>
          <Textarea value={homework} onChange={(e) => setHomework(e.target.value)} className="min-h-[4.5rem]" placeholder="Келесі сабаққа тапсырма" />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/60 p-3">
        <div className="space-y-1">
          <Label className="text-xs">Категория (EduPage)</Label>
          <Select value={gradeType} onChange={(e) => switchCategory(e.target.value as GradeType)} className="w-52">
            {CATEGORIES.map((c) => (
              <option key={c.type} value={c.type}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Баға түрі (Smart Nation)</Label>
          <Select value={workType} onChange={(e) => setWorkType(e.target.value)} className="w-48">
            {WORK_TYPES.map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Коэффициент</Label>
          <Select value={String(weight)} onChange={(e) => setWeight(Number(e.target.value))} className="w-24">
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                ×{w}
              </option>
            ))}
          </Select>
        </div>
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
                    {ATTENDANCE_STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => update(i, { status: st })}
                        className={cn("rounded-md border border-border px-2 py-1 text-xs", rows[i].status === st ? TONE[st] : "bg-card hover:bg-muted")}
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
                    disabled={NO_GRADE.includes(rows[i].status) && gradeType !== "ATTENDANCE"}
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
        <Button disabled={pending} onClick={save}>
          {pending ? "Сақталуда…" : "Сақтау"}
        </Button>
        {msg && <span className={cn("text-sm", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span>}
      </div>
    </div>
  );
}
