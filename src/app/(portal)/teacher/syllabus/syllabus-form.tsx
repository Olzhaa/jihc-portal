"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveSyllabus, type Topic } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function SyllabusForm({
  courses,
  initial,
  onDone,
}: {
  courses: { id: string; title: string }[];
  initial?: { id: string; courseId: string; title: string; topics: Topic[] };
  onDone?: () => void;
}) {
  const [courseId, setCourseId] = useState(initial?.courseId ?? courses[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [topics, setTopics] = useState<Topic[]>(initial?.topics ?? [{ week: 1, topic: "", hours: 2 }]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const total = topics.reduce((s, t) => s + (Number(t.hours) || 0), 0);

  function submit(send: boolean) {
    start(async () => {
      const res = await saveSyllabus({ id: initial?.id, courseId, title, topics, submit: send });
      if (res.error) setError(res.error);
      else {
        setError(null);
        setSaved(true);
        if (!initial) {
          setTitle("");
          setTopics([{ week: 1, topic: "", hours: 2 }]);
        }
        onDone?.();
      }
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
      <div className="space-y-2">
        <div className="grid grid-cols-[3rem_1fr_5rem_2rem] gap-2 text-xs font-medium text-muted-foreground">
          <span>Апта</span>
          <span>Тақырып</span>
          <span>Сағат</span>
          <span />
        </div>
        {topics.map((t, i) => (
          <div key={i} className="grid grid-cols-[3rem_1fr_5rem_2rem] items-center gap-2">
            <span className="text-center text-sm text-muted-foreground">{i + 1}</span>
            <Input value={t.topic} onChange={(e) => setTopics((x) => x.map((y, j) => (j === i ? { ...y, topic: e.target.value } : y)))} />
            <Input
              type="number"
              min={0}
              value={t.hours}
              onChange={(e) => setTopics((x) => x.map((y, j) => (j === i ? { ...y, hours: Number(e.target.value) } : y)))}
            />
            <button type="button" onClick={() => setTopics((x) => x.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-600" aria-label="Жою">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={() => setTopics((x) => [...x, { week: x.length + 1, topic: "", hours: 2 }])}>
            <Plus className="h-4 w-4" /> Тақырып қосу
          </Button>
          <span className="text-sm">
            Барлығы: <b>{total}</b> сағат
          </span>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-600">Сақталды</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => submit(false)}>
          Жоба ретінде сақтау
        </Button>
        <Button disabled={pending} onClick={() => submit(true)}>
          Модерацияға жіберу
        </Button>
      </div>
    </div>
  );
}
