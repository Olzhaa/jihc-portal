"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/curator";
import type { FieldDef, FieldSection, Result } from "@/lib/curator";

type Values = Record<string, unknown>;
export type StudentOption = { id: string; name: string };

const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || v === false || (Array.isArray(v) && v.length === 0);

/** Read-only rendering of one field value. */
export function FieldValue({ f, v, students }: { f: FieldDef; v: unknown; students: StudentOption[] }) {
  const name = (id: unknown) => students.find((s) => s.id === id)?.name ?? "—";
  switch (f.type) {
    case "date":
      return <>{fmtDate(v)}</>;
    case "checkbox":
      return <>{v ? "Иә" : "Жоқ"}</>;
    case "multi":
      return (
        <span className="flex flex-wrap gap-1">
          {(v as string[]).map((x) => <Badge key={x}>{x}</Badge>)}
        </span>
      );
    case "student":
      return <>{name(v)}</>;
    case "students":
      return <>{(v as string[]).map(name).join(", ")}</>;
    case "url":
      return <a href={String(v)} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{String(v)}</a>;
    default:
      return <span className="whitespace-pre-line">{String(v)}</span>;
  }
}

/** Label/value grid of the filled-in fields of a record. */
export function RecordDetails({ fields, values, students = [], skip = [], emptyText }: { fields: FieldDef[]; values: Values; students?: StudentOption[]; skip?: string[]; emptyText?: string }) {
  const shown = fields.filter((f) => !skip.includes(f.name) && !isEmpty(values[f.name]) && (!f.showIf || f.showIf(values)));
  if (!shown.length) return emptyText ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null;
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {shown.map((f) => (
        <div key={f.name} className={cn(f.wide && "sm:col-span-2")}>
          <dt className="text-xs text-muted-foreground">{f.label}</dt>
          <dd><FieldValue f={f} v={values[f.name]} students={students} /></dd>
        </div>
      ))}
    </dl>
  );
}

function Chips({ options, value, onChange, max }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const full = max !== undefined && value.length >= max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            disabled={!on && full}
            onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-40",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function FieldInput({ f, value, set, students }: { f: FieldDef; value: unknown; set: (v: unknown) => void; students: StudentOption[] }) {
  const str = value === null || value === undefined ? "" : String(value);
  switch (f.type) {
    case "textarea":
      return <Textarea className="min-h-20" value={str} onChange={(e) => set(e.target.value)} />;
    case "date":
      return <Input type="date" value={str} onChange={(e) => set(e.target.value)} />;
    case "number":
      return <Input type="number" step="any" min={f.min} max={f.max} value={str} onChange={(e) => set(e.target.value)} />;
    case "select":
      return (
        <Select value={str} onChange={(e) => set(e.target.value)}>
          <option value="">—</option>
          {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      );
    case "student":
      return (
        <Select value={str} onChange={(e) => set(e.target.value)}>
          <option value="">— таңдаңыз —</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      );
    case "multi":
      return <Chips options={f.options!.map((o) => ({ value: o, label: o }))} value={(value as string[]) ?? []} onChange={set} max={f.max} />;
    case "students":
      return <Chips options={students.map((s) => ({ value: s.id, label: s.name }))} value={(value as string[]) ?? []} onChange={set} />;
    case "checkbox":
      return null;
    default:
      return <Input type={f.type === "tel" ? "tel" : f.type === "url" ? "url" : "text"} value={str} onChange={(e) => set(e.target.value)} />;
  }
}

/** Form generated from field definitions. `onSubmit` returns `{ error }` to show a message. */
export function RecordForm({
  sections,
  fields,
  initial = {},
  students = [],
  hide = [],
  submitLabel = "Сақтау",
  onSubmit,
  onCancel,
}: {
  sections?: FieldSection[];
  fields?: FieldDef[];
  initial?: Values;
  students?: StudentOption[];
  /** Fields not shown (their initial value is still submitted). */
  hide?: string[];
  submitLabel?: string;
  onSubmit: (v: Values) => Promise<Result>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const list = sections ?? [{ title: "", fields: fields ?? [] }];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await onSubmit(values);
      if (r && r.error) setError(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {list.map((s) => (
        <fieldset key={s.title} className="space-y-3">
          {s.title && <legend className="mb-1 text-sm font-semibold">{s.title}</legend>}
          {s.note && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{s.note}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {s.fields
              .filter((f) => !hide.includes(f.name) && (!f.showIf || f.showIf(values)))
              .map((f) =>
                f.type === "checkbox" ? (
                  <label key={f.name} className={cn("flex items-center gap-2 text-sm", f.wide && "sm:col-span-2")}>
                    <input type="checkbox" className="h-4 w-4" checked={!!values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))} />
                    {f.label}
                  </label>
                ) : (
                  <div key={f.name} className={cn("space-y-1", f.wide && "sm:col-span-2")}>
                    <Label>
                      {f.label}
                      {f.required && <span className="text-red-600"> *</span>}
                    </Label>
                    <FieldInput f={f} value={values[f.name]} set={(x) => setValues((v) => ({ ...v, [f.name]: x }))} students={students} />
                    {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                  </div>
                ),
              )}
          </div>
        </fieldset>
      ))}
      {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Болдырмау</Button>}
        <Button disabled={pending}>{pending ? "Сақталуда…" : submitLabel}</Button>
      </div>
    </form>
  );
}

export function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-10" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("w-full rounded-xl border border-border bg-card shadow-xl", wide ? "max-w-3xl" : "max-w-xl")}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Жабу" className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
