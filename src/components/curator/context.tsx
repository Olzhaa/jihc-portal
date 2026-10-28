"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isoToday, type CuratorApi, type CuratorRecord, type FieldDef, type RecordKind, type Result, type Workspace } from "@/lib/curator";
import { Dialog, RecordDetails, RecordForm } from "./fields";

type Ctx = {
  ws: Workspace;
  api: CuratorApi;
  today: string;
  /** Link inside the workspace that keeps the selected group. */
  href: (path: string, params?: Record<string, string>) => string;
  save: (kind: RecordKind, data: Record<string, unknown>) => Promise<Result>;
  remove: (kind: RecordKind, id: string) => Promise<Result>;
};
const CuratorContext = createContext<Ctx | null>(null);

export function CuratorRoot({ ws, api, children }: { ws: Workspace; api: CuratorApi; children: React.ReactNode }) {
  const href = (path: string, params: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...(ws.groups.length > 1 ? { g: ws.group.id } : {}), ...params }).toString();
    return q ? `${path}?${q}` : path;
  };
  const value: Ctx = {
    ws,
    api,
    today: isoToday(),
    href,
    save: (kind, data) => api.save(kind, ws.group.id, data),
    remove: (kind, id) => api.remove(kind, ws.group.id, id),
  };
  return <CuratorContext.Provider value={value}>{children}</CuratorContext.Provider>;
}

export function useCurator() {
  const c = useContext(CuratorContext);
  if (!c) throw new Error("useCurator outside CuratorRoot");
  return c;
}

export const studentOptions = (ws: Workspace) => ws.students.map((s) => ({ id: s.id, name: s.name }));

export function GroupSwitcher() {
  const { ws } = useCurator();
  if (ws.groups.length < 2) return null;
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
      {ws.groups.map((g) => (
        <Link key={g.id} href={`?g=${g.id}`} className={cn("rounded-md px-3 py-1 font-medium", g.id === ws.group.id ? "bg-card shadow-sm" : "text-muted-foreground")}>
          {g.name}
        </Link>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
            value === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Add / edit dialog for one record kind. `record` null = closed, {} = new. */
export function RecordDialog({
  kind,
  fields,
  record,
  title,
  hide,
  onClose,
}: {
  kind: RecordKind;
  fields: FieldDef[];
  record: Record<string, unknown> | null;
  title: string;
  hide?: string[];
  onClose: () => void;
}) {
  const { ws, save } = useCurator();
  if (!record) return null;
  return (
    <Dialog title={title} onClose={onClose} wide={fields.length > 8}>
      <RecordForm
        fields={fields}
        initial={record}
        hide={hide}
        students={studentOptions(ws)}
        onCancel={onClose}
        onSubmit={async (v) => {
          const r = await save(kind, { ...v, id: record.id });
          if (!r?.error) onClose();
          return r;
        }}
      />
    </Dialog>
  );
}

/** List of records with add, edit and delete. */
export function RecordList({
  kind,
  items,
  fields,
  heading,
  meta,
  defaults = {},
  hide = [],
  addLabel = "Қосу",
  emptyText = "Жазба жоқ.",
  dialogTitle,
}: {
  kind: RecordKind;
  items: CuratorRecord[];
  fields: FieldDef[];
  heading: (r: CuratorRecord) => React.ReactNode;
  meta?: (r: CuratorRecord) => React.ReactNode;
  defaults?: Record<string, unknown>;
  hide?: string[];
  addLabel?: string;
  emptyText?: string;
  dialogTitle: string;
}) {
  const { ws, remove } = useCurator();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const titleField = fields.find((f) => f.required && f.type === "text")?.name;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing({ date: isoToday(), ...defaults })}>
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
      {items.map((r) => (
        <div key={r.id} className="rounded-lg border border-border p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{heading(r)}</div>
              {meta && <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{meta(r)}</div>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => setEditing(r)} className="rounded p-1.5 hover:bg-muted" aria-label="Өңдеу"><Pencil className="h-4 w-4" /></button>
              <button
                onClick={() => confirm("Жазбаны өшіру керек пе?") && remove(kind, r.id)}
                className="rounded p-1.5 text-red-600 hover:bg-muted"
                aria-label="Өшіру"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <RecordDetails fields={fields} values={r} students={studentOptions(ws)} skip={[...hide, ...(titleField ? [titleField] : [])]} />
        </div>
      ))}
      <RecordDialog kind={kind} fields={fields} record={editing} title={editing?.id ? "Өңдеу" : dialogTitle} hide={hide} onClose={() => setEditing(null)} />
    </div>
  );
}
