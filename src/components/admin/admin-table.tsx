"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ENTITY, editableFields, formatValue, type EntityKey, type Field, type RefKind, type RefOptions, type Row } from "@/lib/admin/entities";
import { downloadText, toCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

export type AdminResult = { error?: string } | { ok: true };
type Handler<A extends unknown[]> = (...args: A) => Promise<AdminResult> | AdminResult;

const PAGE = 50;
const pad = (n: number) => String(n).padStart(2, "0");
const localDateTime = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Кез келген кестенің тізімі мен өңдеу формасы (src/lib/admin/entities.ts сипаттамасы бойынша). */
export function AdminTable({
  entity: key,
  rows,
  refs,
  onSave,
  onDelete,
  note,
}: {
  entity: EntityKey;
  rows: Row[];
  refs: RefOptions;
  onSave: Handler<[id: string | null, values: Record<string, unknown>]>;
  onDelete: Handler<[id: string]>;
  note?: string;
}) {
  const entity = ENTITY[key];
  const refMaps = useMemo(
    () => Object.fromEntries(Object.entries(refs).map(([k, list]) => [k, new Map(list.map((o) => [o.value, o.label]))])) as Record<RefKind, Map<string, string>>,
    [refs],
  );
  const refLabel = (kind: RefKind, id: unknown) => (id ? (refMaps[kind].get(String(id)) ?? refMaps.user.get(String(id)) ?? "—") : "—");

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const columns = entity.fields.filter((f) => f.list);
  const filterFields = entity.fields.filter((f) => f.filter);

  const text = (f: Field, v: unknown) => formatValue(f, v, refLabel);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      for (const [k, want] of Object.entries(filters)) {
        if (!want) continue;
        const v = r[k];
        if (String(v ?? "") !== want && !(want === "__none" && !v)) return false;
      }
      if (!needle) return true;
      return columns.some((f) => text(f, r[f.key]).toLowerCase().includes(needle));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filters, refMaps]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = filtered.slice(current * PAGE, current * PAGE + PAGE);

  function exportCsv() {
    const all = entity.fields;
    downloadText(`${entity.key}.csv`, toCsv([all.map((f) => f.label), ...filtered.map((r) => all.map((f) => text(f, r[f.key])))]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} placeholder="Іздеу…" className="w-56 pl-8" />
        </div>
        {filterFields.map((f) => (
          <Select key={f.key} value={filters[f.key] ?? ""} onChange={(e) => (setFilters((s) => ({ ...s, [f.key]: e.target.value })), setPage(0))} className="w-auto max-w-52">
            <option value="">{f.label}: барлығы</option>
            {f.type === "bool" ? (
              <>
                <option value="true">Иә</option>
                <option value="false">Жоқ</option>
              </>
            ) : (
              <>
                {f.type === "ref" && <option value="__none">— бос —</option>}
                {(f.type === "ref" ? refs[f.ref!] : f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </>
            )}
          </Select>
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCsv} title="Excel үшін CSV">
            <Download className="h-4 w-4" /> Excel
          </Button>
          {!entity.noCreate && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Қосу
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} жазба{filtered.length !== rows.length && ` (барлығы ${rows.length})`}
        {note && ` · ${note}`}
      </p>

      <Table>
        <thead>
          <tr>
            {columns.map((f) => (
              <Th key={f.key}>{f.label}</Th>
            ))}
            <Th />
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditing(r)}>
              {columns.map((f, i) => (
                <Td key={f.key} className={cn(i === 0 && "font-medium", "max-w-72 truncate")}>
                  <Cell field={f} value={r[f.key]} text={text(f, r[f.key])} />
                </Td>
              ))}
              <Td className="w-10 text-right">
                <Pencil className="inline h-4 w-4 text-muted-foreground" />
              </Td>
            </tr>
          ))}
          {!shown.length && (
            <tr>
              <Td colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                Жазба табылмады
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button size="sm" variant="outline" disabled={current === 0} onClick={() => setPage(current - 1)}>
            ←
          </Button>
          <span className="text-muted-foreground">
            {current + 1} / {pages}
          </span>
          <Button size="sm" variant="outline" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            →
          </Button>
        </div>
      )}

      {editing && (
        <EditPanel
          key={editing === "new" ? "new" : editing.id}
          entityKey={key}
          row={editing === "new" ? null : editing}
          refs={refs}
          text={text}
          refLabel={refLabel}
          onClose={() => setEditing(null)}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function Cell({ field, value, text }: { field: Field; value: unknown; text: string }) {
  if (field.type === "color" && value) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="h-4 w-4 rounded border border-border" style={{ background: String(value) }} />
        {text}
      </span>
    );
  }
  if (field.type === "bool") return value ? <Badge variant="success">Иә</Badge> : <Badge>Жоқ</Badge>;
  if (field.type === "enum") return <Badge variant="info">{text}</Badge>;
  return <>{text || <span className="text-muted-foreground">—</span>}</>;
}

/** Жазбадағы мәнді форма өрісінің мәтініне айналдыру. */
function toForm(f: Field, v: unknown): unknown {
  if (f.type === "bool") return Boolean(v);
  if (f.type === "refs") return Array.isArray(v) ? v : [];
  if (v === null || v === undefined) return "";
  if (f.type === "date") return String(v).slice(0, 10);
  if (f.type === "datetime") return localDateTime(new Date(String(v)));
  return String(v);
}

function EditPanel({
  entityKey,
  row,
  refs,
  text,
  refLabel,
  onClose,
  onSave,
  onDelete,
}: {
  entityKey: EntityKey;
  row: Row | null;
  refs: RefOptions;
  text: (f: Field, v: unknown) => string;
  refLabel: (kind: RefKind, id: unknown) => string;
  onClose: () => void;
  onSave: Handler<[id: string | null, values: Record<string, unknown>]>;
  onDelete: Handler<[id: string]>;
}) {
  const entity = ENTITY[entityKey];
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of entity.fields) init[f.key] = toForm(f, row ? row[f.key] : f.type === "bool" ? f.key === "active" : f.type === "enum" ? f.options?.[0]?.value : null);
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));
  const visible = entity.fields.filter((f) => !f.showIf || f.showIf(values));
  const editable = new Set(editableFields(entity, values).map((f) => f.key));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, unknown> = { ...values };
    // datetime-local браузердің уақыт белдеуінде; серверге ISO түрінде жібереміз.
    for (const f of entity.fields) if (f.type === "datetime" && out[f.key]) out[f.key] = new Date(String(out[f.key])).toISOString();
    start(async () => {
      const res = await onSave(row?.id ?? null, out);
      if ("error" in res && res.error) setError(res.error);
      else onClose();
    });
  }

  function remove() {
    if (!row || !confirm(`«${entity.title(row, refLabel)}» өшірілсін бе? Бұл әрекетті қайтару мүмкін емес.`)) return;
    start(async () => {
      const res = await onDelete(row.id);
      if ("error" in res && res.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{row ? `${entity.singular}: өңдеу` : `Жаңа ${entity.singular.toLowerCase()}`}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted" aria-label="Жабу">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 px-5 py-4">
          {visible.map((f) => (
            <div key={f.key} className="space-y-1.5">
              {f.type !== "bool" && (
                <Label htmlFor={`f-${f.key}`}>
                  {f.label}
                  {f.required && editable.has(f.key) && <span className="text-red-600"> *</span>}
                </Label>
              )}
              {editable.has(f.key) ? (
                <FieldInput field={f} value={values[f.key]} refs={refs} onChange={(v) => set(f.key, v)} />
              ) : (
                <p className="text-sm text-muted-foreground">{text(f, row?.[f.key]) || "—"}</p>
              )}
              {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
            </div>
          ))}
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-border px-5 py-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Сақталуда…" : "Сақтау"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Бас тарту
          </Button>
          {row && (
            <Button type="button" variant="ghost" className="ml-auto text-red-600" disabled={pending} onClick={remove}>
              <Trash2 className="h-4 w-4" /> Өшіру
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function FieldInput({ field: f, value, refs, onChange }: { field: Field; value: unknown; refs: RefOptions; onChange: (v: unknown) => void }) {
  const id = `f-${f.key}`;
  switch (f.type) {
    case "textarea":
      return <Textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={6} />;
    case "bool":
      return (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
          {f.label}
        </label>
      );
    case "enum":
      return (
        <Select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {f.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "ref":
      return (
        <Select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">— таңдаңыз —</option>
          {refs[f.ref!].map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "refs": {
      const selected = (value as string[]) ?? [];
      const all = refs[f.ref!];
      const label = new Map(all.map((o) => [o.value, o.label]));
      return (
        <div className="space-y-2">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                  {label.get(v) ?? v}
                  <button type="button" onClick={() => onChange(selected.filter((x) => x !== v))} aria-label="Алып тастау">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Select id={id} value="" onChange={(e) => e.target.value && onChange([...selected, e.target.value])}>
            <option value="">+ қосу</option>
            {all
              .filter((o) => !selected.includes(o.value))
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </Select>
        </div>
      );
    }
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={String(value || "#93c5fd")} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border border-border" />
          <Input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="w-32" />
        </div>
      );
    default:
      return (
        <Input
          id={id}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text"}
          step={f.type === "number" ? "any" : undefined}
          min={f.min}
          max={f.max}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
