"use client";

import { useState, useTransition } from "react";
import { ClipboardCopy, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { HOUR_FIELDS, chapters, emptyTopic, toEdupageTsv, toSnationRows, topicHours, totals, type SyllabusTopic } from "@/lib/syllabus";
import { downloadText, safeName, toCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

export type SyllabusDraft = { courseId: string; title: string; topics: SyllabusTopic[]; submit: boolean };

/**
 * Силлабус редакторы: Smart Nation «Оқу бағдарламасы» бағандары
 * (ОН, тақырып, бағалау өлшемі, теория / З/Т / жеке / СОӨЖ / СӨЖ сағаттары, сабақ түрі).
 */
export function SyllabusEditor({
  courses,
  onSave,
}: {
  courses: { id: string; title: string }[];
  onSave: (d: SyllabusDraft) => Promise<{ error?: string } | { ok: true }> | { error?: string } | { ok: true };
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [topics, setTopics] = useState<SyllabusTopic[]>([emptyTopic()]);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const sum = totals(topics);

  const set = (i: number, patch: Partial<SyllabusTopic>) => setTopics((x) => x.map((y, j) => (j === i ? { ...y, ...patch } : y)));

  function save(submit: boolean) {
    start(async () => {
      const res = await onSave({ courseId, title, topics, submit });
      if ("error" in res && res.error) return setMsg({ text: res.error });
      setMsg({ ok: true, text: submit ? "Модерацияға жіберілді" : "Жоба ретінде сақталды" });
      setTitle("");
      setTopics([emptyTopic()]);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Пән</Label>
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Атауы</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="мысалы, 2026-2027, 1-семестр" />
        </div>
      </div>

      <div className="space-y-3">
        {topics.map((t, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
              <Input value={t.chapter} onChange={(e) => set(i, { chapter: e.target.value })} placeholder="Тарау / ОН, мысалы «ОН 2.1 – АКТ негіздері»" className="h-8 text-xs" />
              <button type="button" onClick={() => setTopics((x) => x.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-600" aria-label="Жою">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 pl-8 sm:grid-cols-2">
              <Input value={t.topic} onChange={(e) => set(i, { topic: e.target.value })} placeholder="Тақырып" />
              <Input value={t.criterion} onChange={(e) => set(i, { criterion: e.target.value })} placeholder="Бағалау өлшемі" />
            </div>
            <div className="flex flex-wrap items-end gap-2 pl-8">
              {HOUR_FIELDS.map((f) => (
                <label key={f.key} className="space-y-0.5 text-xs text-muted-foreground">
                  <span>{f.label}</span>
                  <Input type="number" min={0} value={t[f.key]} onChange={(e) => set(i, { [f.key]: Number(e.target.value) })} className="h-8 w-16" />
                </label>
              ))}
              <label className="space-y-0.5 text-xs text-muted-foreground">
                <span>Сабақ түрі</span>
                <Input value={t.lessonType} onChange={(e) => set(i, { lessonType: e.target.value })} placeholder="теор., зерт." className="h-8 w-32" />
              </label>
              <span className="pb-2 text-xs">
                = <b>{topicHours(t)}</b> сағ
              </span>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setTopics((x) => [...x, emptyTopic(x[x.length - 1]?.chapter ?? "")])}>
            <Plus className="h-4 w-4" /> Тақырып қосу
          </Button>
          <span className="text-sm">
            Барлығы: <b>{sum.all}</b> сағат <span className="text-muted-foreground">({HOUR_FIELDS.map((f) => `${f.label} ${sum[f.key]}`).join(" · ")})</span>
          </span>
        </div>
      </div>
      {msg && <p className={cn("text-sm", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</p>}
      <div className="flex gap-2">
        <Button variant="outline" disabled={pending} onClick={() => save(false)}>
          Жоба ретінде сақтау
        </Button>
        <Button disabled={pending} onClick={() => save(true)}>
          Модерацияға жіберу
        </Button>
      </div>
    </div>
  );
}

/** Силлабустың тараулар бойынша көрінісі және EduPage / Smart Nation-ға көшіру батырмалары. */
export function SyllabusExport({ title, topics }: { title: string; topics: SyllabusTopic[] }) {
  const [copied, setCopied] = useState(false);
  const tsv = toEdupageTsv(topics);

  async function copy() {
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      downloadText(`${safeName(title)}_EduPage.tsv`, tsv, "text/tab-separated-values;charset=utf-8");
    }
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2 text-sm">
        {chapters(topics).map((c, i) => (
          <li key={i}>
            <div className="flex justify-between gap-3 font-medium">
              <span>{c.chapter || "Тарау көрсетілмеген"}</span>
              <span className="shrink-0 text-muted-foreground">{c.hours} сағ</span>
            </div>
            <ul className="mt-1 space-y-0.5 border-l border-border pl-3">
              {c.topics.map((t, j) => (
                <li key={j} className="flex justify-between gap-3 text-muted-foreground">
                  <span>
                    {t.topic}
                    {t.criterion && <span className="text-xs"> — {t.criterion}</span>}
                  </span>
                  <span className="shrink-0">{topicHours(t)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copy} title="EduPage → Планы → Редактировать план → «Импортировать из MS Excel» терезесіне қойыңыз">
          <ClipboardCopy className="h-4 w-4" /> {copied ? "Көшірілді" : "EduPage-ке көшіру"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => downloadText(`${safeName(title)}_SmartNation.csv`, toCsv(toSnationRows(topics)))}>
          <Download className="h-4 w-4" /> Smart Nation кестесі
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        EduPage: «Планы и заготовки» → «Редактировать план» → «Импортировать из MS Excel» терезесіне қойып, «Продолжать» басыңыз, сосын бағандарды сәйкестендіріңіз (тарау, тақырып,
        сабақ саны, мазмұны, ескертпе). Smart Nation-да импорт жоқ: кестені «Оқу бағдарламасы» бетіне қолмен енгізуге ыңғайлы ретпен береді.
      </p>
    </div>
  );
}
