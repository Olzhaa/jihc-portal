import { yearLabel } from "@/lib/results";

/** Топ пен оқу жылын таңдау (GET форма: сервер беттерінде JavaScript-сіз де жұмыс істейді). */
export function ResultsPicker({
  groups,
  groupId,
  years,
  year,
}: {
  groups: { id: string; name: string; snationCode?: string | null }[];
  groupId: string;
  years: number[];
  year: number;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      {groups.length > 1 && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Топ</label>
          <select name="g" defaultValue={groupId} className="flex h-9 rounded-md border border-border bg-card px-3 text-sm">
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.snationCode ? ` · ${g.snationCode}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium">Оқу жылы</label>
        <select name="y" defaultValue={year} className="flex h-9 rounded-md border border-border bg-card px-3 text-sm">
          {years.map((y) => (
            <option key={y} value={y}>{yearLabel(y)}</option>
          ))}
        </select>
      </div>
      <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Ашу</button>
    </form>
  );
}
