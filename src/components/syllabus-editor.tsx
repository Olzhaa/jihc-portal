"use client";

import { useRef, useState, useTransition } from "react";
import { ClipboardCopy, Download, FileText, FileUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  DETAIL_FIELDS,
  HOUR_FIELDS,
  SOJ_FIELDS,
  chapters,
  emptyDetails,
  emptyTopic,
  toEdupageTsv,
  toSnationRows,
  topicHours,
  totals,
  type SojTask,
  type SyllabusDetails,
  type SyllabusTopic,
} from "@/lib/syllabus";
import { downloadBlob, downloadText, safeName, toCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

export type SyllabusDraft = { courseId: string; title: string; topics: SyllabusTopic[]; details: SyllabusDetails; submit: boolean };

const emptySoj = (): SojTask => ({ topic: "", task: "", controlForm: "", literature: "", week: "", maxPoints: "" });

/**
 * Силлабус редакторы колледждің «Оқу жұмыс бағдарламасы» үлгісі бойынша: титул мен түсіндірме жазба,
 * мазмұн кестесі (ОН, тақырып, теория / зертханалық / жеке / практика / СОӨЖ / СӨЖ сағаттары, сабақ түрі)
 * және СӨЖ тапсырмалары. Дайын Word құжатын жүктесе, бәрі автоматты толтырылады.
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
  const [details, setDetails] = useState<SyllabusDetails>(emptyDetails);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const sum = totals(topics);

  const set = (i: number, patch: Partial<SyllabusTopic>) => setTopics((x) => x.map((y, j) => (j === i ? { ...y, ...patch } : y)));
  const setSoj = (i: number, patch: Partial<SojTask>) => setDetails((d) => ({ ...d, sojTasks: d.sojTasks.map((y, j) => (j === i ? { ...y, ...patch } : y)) }));

  function save(submit: boolean) {
    start(async () => {
      const res = await onSave({ courseId, title, topics, details, submit });
      if ("error" in res && res.error) return setMsg({ text: res.error });
      setMsg({ ok: true, text: submit ? "Модерацияға жіберілді" : "Жоба ретінде сақталды" });
      setTitle("");
      setTopics([emptyTopic()]);
      setDetails(emptyDetails());
      setWarnings([]);
    });
  }

  async function importDocx(file: File) {
    setMsg(null);
    try {
      const { parseSyllabusDocx } = await import("@/lib/syllabus-docx");
      const parsed = parseSyllabusDocx(await file.arrayBuffer());
      if (!parsed.topics.length) {
        setWarnings([]);
        return setMsg({ text: "Құжаттан тақырыптар табылмады. Файл «Оқу жұмыс бағдарламасы» үлгісінде ме?" });
      }
      setTopics(parsed.topics);
      setDetails(parsed.details);
      if (parsed.title) setTitle(parsed.title);
      // Pick the subject whose name appears in the module title, e.g. «ЖММ 02 - Ақпараттық-...».
      const m = parsed.details.module.toLowerCase();
      const match = courses.find((c) => m.includes(c.title.toLowerCase()) || c.title.toLowerCase().includes(m.replace(/^[^-–]*[-–]\s*/, "")));
      if (match) setCourseId(match.id);
      setWarnings(parsed.warnings);
      setMsg({ ok: true, text: `«${file.name}» оқылды: ${parsed.topics.length} тақырып, ${totals(parsed.topics).all} сағат, ${parsed.details.sojTasks.length} СӨЖ тапсырмасы. Тексеріп, сақтаңыз.` });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Файлды оқу мүмкін болмады" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3">
        <FileUp className="h-5 w-5 text-muted-foreground" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">Word файлынан толтыру</div>
          <div className="text-xs text-muted-foreground">«Оқу жұмыс бағдарламасы» (.docx): титул, түсіндірме жазба, сағаттар, СӨЖ тапсырмалары мен әдебиеттер алынады</div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importDocx(f);
            e.target.value = "";
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          Файл таңдау
        </Button>
      </div>
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <div className="mb-1 font-medium">Құжатта тексеру керек жерлер:</div>
          <ul className="list-disc space-y-0.5 pl-4">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
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

      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">Титул және түсіндірме жазба</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {DETAIL_FIELDS.map((f) => (
            <div key={f.key} className={cn("space-y-1", f.long && "sm:col-span-2")}>
              <Label>{f.label}</Label>
              {f.long ? (
                <Textarea rows={2} value={details[f.key]} onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} />
              ) : (
                <Input value={details[f.key]} onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <div className="space-y-1">
            <Label>Әзірлеуші(лер), әр жолға біреуі</Label>
            <Textarea rows={2} value={details.authors.join("\n")} onChange={(e) => setDetails({ ...details, authors: e.target.value.split("\n") })} />
          </div>
          <div className="space-y-1">
            <Label>Әдебиеттер, әр жолға біреуі</Label>
            <Textarea rows={2} value={details.references.join("\n")} onChange={(e) => setDetails({ ...details, references: e.target.value.split("\n") })} />
          </div>
        </div>
      </details>

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
      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">СӨЖ тапсырмалары ({details.sojTasks.length})</summary>
        <div className="mt-3 space-y-3">
          {details.sojTasks.map((t, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-6">
              <span className="text-xs text-muted-foreground sm:col-span-6">
                {i + 1}.
                <button type="button" onClick={() => setDetails((d) => ({ ...d, sojTasks: d.sojTasks.filter((_, j) => j !== i) }))} className="float-right hover:text-red-600" aria-label="Жою">
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
              {SOJ_FIELDS.map((f) => (
                <label key={f.key} className={cn("space-y-0.5 text-xs text-muted-foreground", f.key === "topic" || f.key === "task" ? "sm:col-span-3" : f.key === "literature" ? "sm:col-span-2" : "")}>
                  <span>{f.label}</span>
                  {f.key === "task" || f.key === "topic" ? (
                    <Textarea rows={2} value={t[f.key]} onChange={(e) => setSoj(i, { [f.key]: e.target.value })} className="text-sm text-foreground" />
                  ) : (
                    <Input value={t[f.key]} onChange={(e) => setSoj(i, { [f.key]: e.target.value })} className="h-8 text-foreground" />
                  )}
                </label>
              ))}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setDetails((d) => ({ ...d, sojTasks: [...d.sojTasks, emptySoj()] }))}>
            <Plus className="h-4 w-4" /> СӨЖ тапсырмасын қосу
          </Button>
        </div>
      </details>
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
export function SyllabusExport({ title, courseTitle, topics, details }: { title: string; courseTitle: string; topics: SyllabusTopic[]; details: SyllabusDetails }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function word() {
    setBusy(true);
    try {
      const { buildSyllabusDocx } = await import("@/lib/syllabus-docx");
      downloadBlob(`${safeName(title)}.docx`, await buildSyllabusDocx({ courseTitle, topics, details }));
    } finally {
      setBusy(false);
    }
  }
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
        <Button size="sm" variant="outline" onClick={word} disabled={busy}>
          <FileText className="h-4 w-4" /> Word (.docx)
        </Button>
        <Button size="sm" variant="outline" onClick={copy} title="EduPage → Планы → Редактировать план → «Импортировать из MS Excel» терезесіне қойыңыз">
          <ClipboardCopy className="h-4 w-4" /> {copied ? "Көшірілді" : "EduPage-ке көшіру"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => downloadText(`${safeName(title)}_SmartNation.csv`, toCsv(toSnationRows(topics)))}>
          <Download className="h-4 w-4" /> Smart Nation кестесі
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Word: колледждің «Оқу жұмыс бағдарламасы» үлгісіндегі құжат (титул, түсіндірме жазба, құрылым, мазмұн, СӨЖ). EduPage: «Планы и заготовки» → «Редактировать план» → «Импортировать из MS Excel» терезесіне қойып, «Продолжать» басыңыз, сосын бағандарды сәйкестендіріңіз (тарау, тақырып,
        сабақ саны, мазмұны, ескертпе). Smart Nation-да импорт жоқ: кестені «Оқу бағдарламасы» бетіне қолмен енгізуге ыңғайлы ретпен береді.
      </p>
    </div>
  );
}
