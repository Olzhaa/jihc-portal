import type { FinalPeriod } from "@prisma/client";
import { describeConfig, resultsSheet, yearLabel, type Results, type ResultsConfig } from "./results";
import { buildXlsx, XS, type XCell, type XSheet } from "./xlsx";

/** «Қорытындылар» Excel файлы: 1-парақ — кесте (Smart Nation пішімі), 2-парақ — қолданылған формула. */
export function resultsWorkbook(
  results: Results,
  meta: { group: string; snationCode?: string | null; periods?: FinalPeriod[] },
  config: ResultsConfig,
) {
  const sheet = resultsSheet(results, meta.periods);
  const [g0, g1] = sheet.gradeCols;
  const styleRow = (row: (string | number | null)[], total = false): XCell[] =>
    row.map((v, c) => {
      if (c === 1) return { v, s: total ? XS.totalText : XS.text };
      if (total) return { v, s: XS.total };
      const fail = c >= g0 && c < g1 && typeof v === "number" && v < config.passMark;
      return { v, s: fail ? XS.fail : XS.cell };
    });
  const title = `${meta.group}${meta.snationCode ? ` (Smart Nation: ${meta.snationCode})` : ""} · ${yearLabel(results.year)} оқу жылының қорытындылары`;
  const width = sheet.header[0].length;
  const top = 2; // тақырып жолы және бос жол
  const main: XSheet = {
    name: "Қорытындылар",
    rows: [
      [{ v: title, s: XS.title }],
      [],
      ...sheet.header.map((r) => r.map((v) => ({ v, s: XS.header }))),
      ...sheet.body.map((r) => styleRow(r)),
      styleRow(sheet.avgRow, true),
    ],
    merges: sheet.merges.map(([r1, c1, r2, c2]) => [r1 + top, c1, r2 + top, c2]),
    widths: [5, 32, ...Array(Math.max(0, width - 2)).fill(14)],
    heights: { [top]: 48, [top + 1]: 32 },
    freeze: { rows: top + 2, cols: 2 },
  };
  const formula: XSheet = {
    name: "Формула",
    rows: [
      [{ v: "Қорытынды бағалар қалай есептелді", s: XS.title }],
      [],
      ...describeConfig(config).map((line) => [line]),
      [],
      [{ v: "Бекітілген және қолмен енгізілген бағалар формуладан бұрын тұрады. Жіберген сағат: бір қоңырау = 1 академиялық сағат; «Себепті» белгісі себепті сағатқа жатады.", s: XS.note }],
    ],
    widths: [120],
  };
  return buildXlsx([main, formula]);
}
