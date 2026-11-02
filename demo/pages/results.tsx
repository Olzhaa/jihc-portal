import Link from "next/link";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { FinalResultsTable, StudentFinalResults, type ResultsActions } from "@/components/final-results";
import { ResultsConfigForm } from "@/components/results-config-form";
import { academicYearStart } from "@/lib/assessment";
import { PERIODS, cellsToLock, checkResultsConfig, cleanResultsConfig, parseFinalInput, yearLabel } from "@/lib/results";
import { getDb, mutate, uid, useDb, type Group } from "../store";
import { demoResults, demoYears } from "../queries";
import { navigate, useRoute } from "../router";
import { useMe } from "../hooks";

// Ports of the «Қорытындылар» pages and their server actions onto the in-browser database.

function usePick(groups: Group[], base: string) {
  const { query } = useRoute();
  const db = useDb();
  const current = academicYearStart();
  const years = demoYears(db, current);
  const year = years.includes(Number(query.get("y"))) ? Number(query.get("y")) : current;
  const group = groups.find((g) => g.id === query.get("g")) ?? groups[0];
  const go = (g: string | undefined, y: number) => navigate(`${base}?${g ? `g=${g}&` : ""}y=${y}`);
  const picker = (
    <div className="flex flex-wrap items-end gap-3">
      {groups.length > 1 && (
        <div className="space-y-1">
          <Label>Топ</Label>
          <Select value={group?.id} onChange={(e) => go(e.target.value, year)} className="w-auto">
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.snationCode ? ` · ${g.snationCode}` : ""}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <Label>Оқу жылы</Label>
        <Select value={year} onChange={(e) => go(group?.id, Number(e.target.value))} className="w-auto">
          {years.map((y) => (
            <option key={y} value={y}>{yearLabel(y)}</option>
          ))}
        </Select>
      </div>
    </div>
  );
  return { group, year, picker };
}

function actionsFor(groupId: string, year: number, userId: string): ResultsActions {
  return {
    setFinal: ({ studentId, courseId, period, value }) => {
      if (!PERIODS.some((p) => p.key === period)) return { error: "Кезең дұрыс емес" };
      const v = value === null ? null : parseFinalInput(String(value));
      if (v !== null && typeof v === "object") return v;
      mutate((d) => {
        const same = (f: (typeof d.finalGrades)[number]) => f.studentId === studentId && f.courseId === courseId && f.academicYear === year && f.period === period;
        d.finalGrades = d.finalGrades.filter((f) => !same(f));
        if (v !== null) d.finalGrades.push({ id: uid(), studentId, courseId, academicYear: year, period, value: v, manual: true, setById: userId });
      });
      return { ok: true };
    },
    lock: () => {
      const rows = cellsToLock(demoResults(getDb(), { groupId }, year).results);
      mutate((d) => {
        for (const r of rows) d.finalGrades.push({ ...r, id: uid(), academicYear: year, manual: false, setById: userId });
      });
      return { ok: true };
    },
    unlock: () => {
      mutate((d) => {
        const ids = new Set(d.users.filter((u) => u.groupId === groupId).map((u) => u.id));
        d.finalGrades = d.finalGrades.filter((f) => !(f.academicYear === year && !f.manual && ids.has(f.studentId)));
      });
      return { ok: true };
    },
  };
}

function ResultsCard({ group, year, actions }: { group: Group; year: number; actions?: ResultsActions }) {
  const { results, config } = demoResults(useDb(), { groupId: group.id }, year);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            {group.name} · {yearLabel(year)} оқу жылы
          </CardTitle>
          {group.snationCode && <p className="mt-1 text-sm text-muted-foreground">Smart Nation: {group.snationCode}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <FinalResultsTable key={`${group.id}:${year}`} group={group} results={results} config={config} actions={actions} />
      </CardContent>
    </Card>
  );
}

export function Results() {
  const me = useMe();
  const db = useDb();
  const groups = [...db.groups].sort((a, b) => a.name.localeCompare(b.name));
  const { group, year, picker } = usePick(groups, "/academic-director/results");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Қорытындылар"
        description="Smart Nation «Қорытындылар» сияқты: пәндер бойынша жартыжылдық, жылдық және емтихан бағалары, жіберілген сағаттар"
        actions={
          <Link href="/academic-director/results/settings" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted">
            <Settings2 className="h-4 w-4" /> Формула
          </Link>
        }
      />
      {picker}
      {group && <ResultsCard group={group} year={year} actions={actionsFor(group.id, year, me.id)} />}
    </div>
  );
}

export function Settings() {
  const db = useDb();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Қорытынды баға формуласы"
        description="Smart Nation формуласы жарияланбаған: оқу бөлімі бекіткен ережені осында қойыңыз. Бекітілген бағалар өзгермейді, тек бекітілмегендері қайта есептеледі."
        actions={<Link href="/academic-director/results" className="text-sm text-primary hover:underline">← Қорытындылар</Link>}
      />
      <Card>
        <CardContent className="pt-6">
          <ResultsConfigForm
            config={cleanResultsConfig(db.resultsConfig)}
            onSave={(raw) => {
              const c = cleanResultsConfig(raw);
              const error = checkResultsConfig(c);
              if (error) return { error };
              mutate((d) => {
                d.resultsConfig = c;
              });
              return { ok: true };
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function Curator() {
  const me = useMe();
  const db = useDb();
  const groups = db.groups.filter((g) => g.curatorId === me.id).sort((a, b) => a.name.localeCompare(b.name));
  const { group, year, picker } = usePick(groups, "/teacher/curator/results");
  if (!group) return <PageHeader title="Қорытындылар" description="Сіз әлі ешбір топтың кураторы емессіз." />;
  return (
    <div className="space-y-6">
      <PageHeader title="Қорытындылар" description="Топтың пәндер бойынша жартыжылдық, жылдық және емтихан бағалары, жіберілген сағаттар. Бағаны бекіту мен түзетуді завуч жасайды." />
      {picker}
      <ResultsCard group={group} year={year} />
    </div>
  );
}

/** Student and parent pages: the current year's final grades, if any. */
export function StudentResults({ studentId }: { studentId: string }) {
  const year = academicYearStart();
  const { results, config } = demoResults(useDb(), { studentId }, year);
  if (!results.courses.length) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Қорытынды бағалар · {yearLabel(year)}</h2>
      <StudentFinalResults results={results} passMark={config.passMark} />
    </section>
  );
}
