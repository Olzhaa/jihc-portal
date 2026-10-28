"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, halfYear } from "@/lib/assessment";
import { buildGradebook, edupageRows, gradeHint, snationRows, type BookAttendance, type BookGrade } from "@/lib/gradebook";
import { downloadText, safeName, toCsv } from "@/lib/export";
import { gradeTone } from "@/lib/grades";
import { cn } from "@/lib/utils";

/**
 * Пән бойынша бағалар кітабы (EduPage «Оценки» сияқты): категориялар, салмақты орташа,
 * 5 балдық баға, жіберілген сағаттар. Екі экспорт: EduPage пішімі және Smart Nation журналы пішімі.
 */
export function GradebookTable({
  title,
  students,
  grades,
  attendance,
}: {
  /** Used in file names, e.g. "2F-1 Graph Design". */
  title: string;
  students: { id: string; name: string }[];
  grades: BookGrade[];
  attendance: BookAttendance[];
}) {
  const [half, setHalf] = useState<1 | 2>(() => halfYear(new Date()) as 1 | 2);
  const book = buildGradebook({ students, grades, attendance, half });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2] as const).map((h) => (
          <Button key={h} size="sm" variant={half === h ? "default" : "outline"} onClick={() => setHalf(h)}>
            {h}-жартыжылдық
          </Button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadText(`${safeName(title)}_EduPage_${half}.csv`, toCsv(edupageRows(book, half)))}>
            <Download className="h-4 w-4" /> EduPage үлгісі
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadText(`${safeName(title)}_SmartNation_${half}.csv`, toCsv(snationRows(book)))}>
            <Download className="h-4 w-4" /> Smart Nation үлгісі
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs">
            <tr>
              <th className="w-8 px-2 py-2 text-left">№</th>
              <th className="px-2 py-2 text-left">Студент</th>
              {CATEGORIES.map((c) => (
                <th key={c.type} className="px-2 py-2 text-left" title={c.label}>
                  {c.label} {half}
                </th>
              ))}
              <th className="px-2 py-2 text-center" title="Σ(баға × коэффициент) / Σ коэффициент">Орташа</th>
              <th className="px-2 py-2 text-center">Қорытынды</th>
              <th className="px-2 py-2 text-center" title="Жіберген сағат / оның ішінде себепсіз">Жіберген сағ.</th>
            </tr>
          </thead>
          <tbody>
            {book.rows.map((r, i) => (
              <tr key={r.student.id} className="border-t border-border align-top">
                <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                <td className="whitespace-nowrap px-2 py-2 font-medium">{r.student.name}</td>
                {r.categories.map((c) => (
                  <td key={c.type} className="px-2 py-2">
                    <div className="flex max-w-56 flex-wrap gap-1">
                      {c.grades.length === 0 && <span className="text-muted-foreground/50">—</span>}
                      {c.grades.map((g, k) => (
                        <span key={k} title={gradeHint(g)} className={cn("rounded border border-border px-1 text-xs font-semibold", gradeTone(g.value))}>
                          {g.value}
                          {g.weight !== 1 && <sub className="ml-0.5 font-normal text-muted-foreground">×{g.weight}</sub>}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
                <td className={cn("px-2 py-2 text-center font-semibold", r.avg !== null && gradeTone(r.avg))}>{r.avg === null ? "—" : r.avg.toFixed(2)}</td>
                <td className="px-2 py-2 text-center">{r.five === null ? "—" : <Badge variant={r.five <= 2 ? "danger" : "default"}>{r.five}</Badge>}</td>
                <td className="px-2 py-2 text-center text-xs">
                  {r.missed.total}
                  {r.missed.unexcused > 0 && <span className="text-red-600"> / {r.missed.unexcused}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Орташа балл EduPage-тегідей коэффициентпен есептеледі. Қорытынды: 0–49 → 2, 50–69 → 3, 70–89 → 4, 90–100 → 5. Smart Nation үлгісінде әр баған бір сабақ күні: «н» — себепсіз, «с» —
        себепті, «к» — кешікті, «е» — ерте кетті.
      </p>
    </div>
  );
}
