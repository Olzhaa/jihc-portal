"use client";

import { useState, useTransition } from "react";
import { ChevronsRight, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/curator";
import { FREQUENCY, TASK_FIELDS, TASK_TEMPLATE, isDue, nextDueAfter, tasksForCourse, type CuratorRecord } from "@/lib/curator";
import { GroupSwitcher, RecordDialog, Tabs, useCurator } from "./context";

const fmt = fmtDate;

export function Cycle() {
  const { ws, today, api, save, remove } = useCurator();
  const [tab, setTab] = useState<"due" | "all">("due");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const tasks = tasksForCourse(ws.tasks, ws.group.course);
  const due = tasks.filter((t) => isDue(t, today));
  const shown = tab === "due" ? due : tasks;

  /** Done for this period → next period: clear the tick and move the due date on. */
  const advance = (t: CuratorRecord) => {
    const from = typeof t.nextDue === "string" && t.nextDue > today ? t.nextDue : today;
    return save("task", { ...t, done: false, nextDue: nextDueAfter(String(t.frequency), from) });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Куратор циклы"
        description={`«Не істеуім керек?» — апта сайын осыдан бастаңыз. ${ws.group.course ? `Көрсетілгені: жалпы міндеттер + ${ws.group.course} курсқа тән міндеттер.` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <GroupSwitcher />
            <Button variant="outline" onClick={() => setEditing({ frequency: "Ай сайын", done: false })}><Plus className="h-4 w-4" /> Міндет қосу</Button>
          </div>
        }
      />

      {ws.tasks.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 pt-5 text-sm">
            <p>Цикл әлі бос. Куратор нұсқаулығы бойынша дайын {TASK_TEMPLATE.length} міндетті жүктеңіз — кейін өзгертуге, өшіруге, өз міндетіңізді қосуға болады.</p>
            {error && <p className="text-red-600">{error}</p>}
            <Button
              disabled={pending}
              onClick={() => start(async () => {
                const r = await api.loadTemplate(ws.group.id);
                if (r?.error) setError(r.error);
              })}
            >
              Шаблонды жүктеу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={tab} onChange={setTab} tabs={[{ id: "due", label: "Мерзімі келгендер", count: due.length }, { id: "all", label: "Барлық міндет", count: tasks.length }]} />
          <p className="text-xs text-muted-foreground">Орындадыңыз → белгі қойыңыз. Кезең біткенде <ChevronsRight className="inline h-3.5 w-3.5" /> батырмасы белгіні алып, келесі мерзімді өзі есептейді.</p>
          {shown.length === 0 && <p className="text-sm text-muted-foreground">Бұл аптаға міндет қалмады. 🎉</p>}
          {FREQUENCY.map((freq) => {
            const rows = shown.filter((t) => t.frequency === freq);
            if (!rows.length) return null;
            return (
              <Card key={freq}>
                <CardHeader><CardTitle>{freq}</CardTitle><span className="text-xs text-muted-foreground">{rows.filter((t) => t.done).length}/{rows.length} орындалды</span></CardHeader>
                <CardContent className="divide-y divide-border">
                  {rows.map((t) => {
                    const late = !t.done && typeof t.nextDue === "string" && t.nextDue < today;
                    return (
                      <div key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                        <input type="checkbox" className="h-4 w-4" checked={!!t.done} onChange={(e) => save("task", { ...t, done: e.target.checked })} aria-label="Орындалды" />
                        <div className="min-w-0 flex-1">
                          <div className={cn("text-sm", !!t.done && "text-muted-foreground line-through")}>{String(t.title)}</div>
                          <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                            {typeof t.course === "string" && <Badge variant="info">{t.course}</Badge>}
                            {typeof t.logIn === "string" && <span>→ {t.logIn}</span>}
                            {typeof t.source === "string" && <span>· нұсқаулық {t.source}</span>}
                          </div>
                        </div>
                        <span className={cn("text-xs", late ? "font-semibold text-red-600" : "text-muted-foreground")}>
                          {typeof t.nextDue === "string" ? fmt(t.nextDue) : freq.startsWith("Бір рет") ? "бір рет" : "мерзімсіз"}
                        </span>
                        {!!t.done && !!nextDueAfter(freq, today) && (
                          <Button size="sm" variant="outline" onClick={() => advance(t)} title="Келесі мерзімге жылжыту"><ChevronsRight className="h-4 w-4" /> Келесі</Button>
                        )}
                        <button onClick={() => setEditing(t)} className="rounded p-1.5 hover:bg-muted" aria-label="Өңдеу"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => confirm("Міндетті өшіру керек пе?") && remove("task", t.id)} className="rounded p-1.5 text-red-600 hover:bg-muted" aria-label="Өшіру"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
      <RecordDialog kind="task" fields={TASK_FIELDS} record={editing} title={editing?.id ? "Міндетті өңдеу" : "Жаңа міндет"} onClose={() => setEditing(null)} />
    </div>
  );
}
