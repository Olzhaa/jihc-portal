"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { CATEGORIES, weightedAverage } from "@/lib/assessment";
import {
  DEFAULT_RESULTS_CONFIG,
  ROUNDINGS,
  checkResultsConfig,
  describeConfig,
  roundGrade,
  semesterGrade,
  yearGrade,
  type ResultsConfig,
  type Rounding,
} from "@/lib/results";

type Result = { error?: string } | { ok: true } | void;

/** Мысал бағалар: формула өзгергенде нәтиже қалай өзгеретінін бірден көрсету үшін. */
const SAMPLE = {
  s1: [
    { type: "CURRENT" as const, value: 85, weight: 1 },
    { type: "CURRENT" as const, value: 72, weight: 1 },
    { type: "MIDTERM" as const, value: 64, weight: 2 },
    { type: "ATTENDANCE" as const, value: 100, weight: 1 },
  ],
  s2: [
    { type: "CURRENT" as const, value: 90, weight: 1 },
    { type: "MIDTERM" as const, value: 78, weight: 2 },
    { type: "EXAM" as const, value: 70, weight: 3 },
  ],
  exam: 80,
};

function preview(c: ResultsConfig) {
  const r = (v: number | null) => (v === null ? null : roundGrade(v, c.rounding));
  const s1 = r(semesterGrade(SAMPLE.s1, c));
  const s2 = r(semesterGrade(SAMPLE.s2, c));
  const exam = c.examSource === "manual" ? SAMPLE.exam : r(weightedAverage(SAMPLE.s2.filter((g) => g.type === "EXAM")));
  return { s1, s2, exam, year: r(yearGrade(s1, s2, exam, c)) };
}

function Pct({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <Input type="number" min={0} max={100} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-20" />
      <span className="text-sm text-muted-foreground">%</span>
    </div>
  );
}

/** Қорытынды баға формуласын баптау (завуч/директор). */
export function ResultsConfigForm({ config, onSave }: { config: ResultsConfig; onSave: (c: ResultsConfig) => Promise<Result> | Result }) {
  const [c, setC] = useState(config);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<ResultsConfig>) => {
    setC({ ...c, ...patch });
    setMsg(null);
  };
  const error = checkResultsConfig(c);
  const p = preview(c);
  const usedCats = CATEGORIES.filter((x) => c.examInSemester || x.type !== "EXAM");
  const shareSum = usedCats.reduce((s, x) => s + c.categoryShares[x.type], 0);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (error) return setMsg({ ok: false, text: error });
        start(async () => {
          const r = await onSave(c);
          setMsg(r && "error" in r && r.error ? { ok: false, text: r.error } : { ok: true, text: "Сақталды. Бекітілмеген қорытындылар жаңа формуламен есептеледі." });
        });
      }}
    >
      <section className="space-y-3">
        <h3 className="font-semibold">1. Жартыжылдық баға</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["weighted", "Барлық бағалардың салмақты орташасы", "EduPage «Среднее» сияқты: Σ(баға × коэффициент) / Σ коэффициент. Бағалар кітабындағы «Орташа» бағанымен бірдей."],
              ["categories", "Категориялар үлесімен", "Мысалы ағымдағы бағалар 60%, бақылау 40%. Әр категорияның ішінде коэффициентпен орташа."],
            ] as const
          ).map(([key, label, hint]) => (
            <label key={key} className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="semesterMethod" checked={c.semesterMethod === key} onChange={() => set({ semesterMethod: key })} className="mt-1" />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </div>
        {c.semesterMethod === "categories" && (
          <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.type} className="space-y-1">
                <Label className={!c.examInSemester && cat.type === "EXAM" ? "opacity-40" : undefined}>{cat.label}</Label>
                <Pct
                  value={c.categoryShares[cat.type]}
                  disabled={!c.examInSemester && cat.type === "EXAM"}
                  onChange={(v) => set({ categoryShares: { ...c.categoryShares, [cat.type]: v } })}
                />
              </div>
            ))}
            <div className={shareSum === 100 ? "self-end text-sm text-emerald-600" : "self-end text-sm text-red-600"}>Қосындысы: {shareSum}%</div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.examInSemester} onChange={(e) => set({ examInSemester: e.target.checked })} />
          «Емтихан немесе сынақ» категориясындағы бағалар жартыжылдық бағаға кіреді
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">2. Емтихан бағасы</h3>
        <Select value={c.examSource} onChange={(e) => set({ examSource: e.target.value as ResultsConfig["examSource"] })} className="max-w-xl">
          <option value="manual">Завуч «Қорытындылар» бетінде қолмен қояды (емтихан ведомосі бойынша)</option>
          <option value="category">Журналдағы «Емтихан немесе сынақ» категориясының орташасы</option>
        </Select>
        {c.examSource === "category" && c.examInSemester && (
          <p className="text-xs text-amber-700 dark:text-amber-400">Ескерту: емтихан бағалары жартыжылдық бағаға да, жеке емтихан бағасына да кіреді.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">3. Жылдық баға</h3>
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1">
            <Label>1-жартыжылдық үлесі</Label>
            <Pct value={c.sem1Share} onChange={(v) => set({ sem1Share: v })} />
            <div className="text-xs text-muted-foreground">2-жартыжылдық: {100 - c.sem1Share}%</div>
          </div>
          <div className="space-y-1">
            <Label>Емтиханның жылдық бағадағы үлесі</Label>
            <Pct value={c.examShare} onChange={(v) => set({ examShare: v })} />
            <div className="text-xs text-muted-foreground">0% — жылдық баға тек жартыжылдықтардан</div>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.yearNeedsBoth} onChange={(e) => set({ yearNeedsBoth: e.target.checked })} />
          Жылдық баға екі жартыжылдық бағасы да болғанда ғана шығады
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">4. Дөңгелектеу және өту шегі</h3>
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1">
            <Label>Дөңгелектеу</Label>
            <Select value={c.rounding} onChange={(e) => set({ rounding: e.target.value as Rounding })} className="w-72">
              {ROUNDINGS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Қанағаттанарлықсыз: осыдан төмен</Label>
            <Input type="number" min={0} max={100} value={c.passMark} onChange={(e) => set({ passMark: Number(e.target.value) })} className="w-24" />
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <h3 className="font-semibold">Формула</h3>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {describeConfig(c).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <div className="pt-2">
          <div className="font-medium">Мысал</div>
          <div className="text-muted-foreground">
            1-жж: 85, 72, бақылау 64 (×2), қатысу 100 → <b className="text-foreground">{p.s1 ?? "—"}</b> · 2-жж: 90, бақылау 78 (×2), емтихан 70 (×3) →{" "}
            <b className="text-foreground">{p.s2 ?? "—"}</b> · емтихан → <b className="text-foreground">{p.exam ?? "—"}</b> · жылдық → <b className="text-foreground">{p.year ?? "—"}</b>
          </div>
        </div>
      </section>

      {msg && <p className={msg.ok ? "text-sm text-emerald-600" : "text-sm text-red-600"}>{msg.text}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !!error}>Сақтау</Button>
        <Button type="button" variant="outline" onClick={() => set(DEFAULT_RESULTS_CONFIG)}>Әдепкі мәндер</Button>
      </div>
    </form>
  );
}
