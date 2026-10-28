import { unzipSync, strFromU8 } from "fflate";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  VerticalMergeType,
  WidthType,
} from "docx";
import { HOUR_FIELDS, SOJ_FIELDS, chapters, emptyDetails, emptyTopic, topicHours, totals, type SyllabusDetails, type SyllabusTopic } from "./syllabus";

/**
 * Колледждің «Оқу жұмыс бағдарламасы» Word құжатын оқу және сол үлгіде қайта жасау.
 * Тек браузерде қолданылады (DOMParser, Blob).
 */

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const kids = (el: Element, name: string) => Array.from(el.children).filter((c) => c.namespaceURI === W && c.localName === name);
const norm = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
const squash = (s: string) => s.replace(/\s+/g, "").toLowerCase();

function paraText(p: Element) {
  let out = "";
  for (const n of Array.from(p.getElementsByTagNameNS(W, "*"))) {
    if (n.localName === "t") out += n.textContent ?? "";
    else if (n.localName === "tab") out += " ";
    else if (n.localName === "br") out += "\n";
  }
  return out;
}

/** Paragraphs directly inside a cell (nested tables are skipped: they are layout noise in these files). */
const cellLines = (tc: Element) => kids(tc, "p").map((p) => norm(paraText(p))).filter(Boolean);

type Cell = { lines: string[]; text: string; continued: boolean };

/** Rows of a table with gridSpan expanded, so every row has one entry per grid column. */
function grid(tbl: Element): Cell[][] {
  return kids(tbl, "tr").map((tr) => {
    const row: Cell[] = [];
    for (const tc of kids(tr, "tc")) {
      const pr = kids(tc, "tcPr")[0];
      const span = Number(pr && kids(pr, "gridSpan")[0]?.getAttributeNS(W, "val")) || 1;
      const vm = pr && kids(pr, "vMerge")[0];
      const continued = !!vm && vm.getAttributeNS(W, "val") !== "restart";
      const lines = cellLines(tc);
      const cell = { lines, text: lines.join(" "), continued };
      for (let i = 0; i < span; i++) row.push(i === 0 ? cell : { lines: [], text: "", continued: true });
    }
    return row;
  });
}

const tableText = (tbl: Element) => squash(Array.from(tbl.getElementsByTagNameNS(W, "t")).map((t) => t.textContent).join(""));

/** Value after "Label:" in a set of lines; the rest of the lines are joined with newlines. */
function labelled(lines: string[], label: RegExp) {
  const i = lines.findIndex((l) => label.test(l));
  if (i < 0) return null;
  const first = lines[i].replace(label, "").replace(/^[\s:]+/, "").trim();
  return [first, ...lines.slice(i + 1)].filter(Boolean).join("\n");
}

const hours = (s: string) => {
  const n = Number(s.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

export type ParsedSyllabus = { topics: SyllabusTopic[]; details: SyllabusDetails; title: string; warnings: string[] };

/** Reads a «Оқу жұмыс бағдарламасы» .docx: title page, explanatory note, content table, СӨЖ table and references. */
export function parseSyllabusDocx(file: ArrayBuffer): ParsedSyllabus {
  let xml: string;
  try {
    xml = strFromU8(unzipSync(new Uint8Array(file), { filter: (f) => f.name === "word/document.xml" })["word/document.xml"]);
  } catch {
    throw new Error("Файл .docx пішімінде емес");
  }
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const body = doc.getElementsByTagNameNS(W, "body")[0];
  if (!body) throw new Error("Құжаттың мазмұны табылмады");

  const details = emptyDetails();
  const warnings: string[] = [];
  const topics: SyllabusTopic[] = [];
  const tables = kids(body, "tbl");
  let totalStated = 0;

  // Title page and explanatory note: label/value lines anywhere in tables or body paragraphs.
  const allLines: string[] = [];
  const collect = (el: Element) => {
    for (const c of Array.from(el.children)) {
      if (c.localName === "p") allLines.push(...paraText(c).split("\n").map(norm).filter(Boolean));
      else if (c.localName === "tbl") for (const tr of kids(c, "tr")) for (const tc of kids(tr, "tc")) collect(tc);
    }
  };
  collect(body);
  const pick = (re: RegExp) => labelled(allLines, re)?.split("\n")[0] ?? "";
  details.module = pick(/^Пән\s*\/\s*модуль атауы\s*:/i);
  details.specialty = pick(/^Мамандық\s*:/i);
  details.qualification = pick(/^Біліктілік\s*:/i);
  details.groups = pick(/^Тобы\s*:/i);
  details.studyForm = pick(/^Оқыту нысаны\s*:/i);
  const hoursLine = allLines.find((l) => /Жалпы сағат саны/i.test(l)) ?? "";
  totalStated = hours(hoursLine.match(/Жалпы сағат саны\s*:\s*([\d.,]+)/i)?.[1] ?? "");
  details.credits = hoursLine.match(/Кредит саны\s*:\s*([\d.,]+)/i)?.[1] ?? "";
  details.approver = allLines.find((l) => /^орынбасары/i.test(l))?.replace(/^орынбасары[\s_]*/i, "").trim() ?? "";
  details.place = [...allLines].reverse().find((l) => /^\S+\s+20\d\d\s*ж\.?$/.test(l)) ?? "";
  // Authors: the name after "Әзірлеуші(лер):" and each following line up to the explanatory note, minus signature hints.
  const ai = allLines.findIndex((l) => /^Әзірлеуші/i.test(l));
  if (ai >= 0) {
    for (let i = ai; i < allLines.length; i++) {
      const l = allLines[i].replace(/^Әзірлеуші\(?лер\)?\s*:?/i, "").trim();
      if (i > ai && (/ТҮСІНДІРМЕ/i.test(l) || /\d{4}\s*ж/.test(l))) break;
      if (l && !/қолы|Т\.А\.Ә/i.test(l)) details.authors.push(l);
    }
  }

  for (const tbl of tables) {
    const text = tableText(tbl);
    const rows = grid(tbl);

    // Explanatory note: one labelled cell per row.
    for (const row of rows) {
      for (const c of row) {
        const take = (re: RegExp) => labelled(c.lines, re);
        details.description ||= take(/^Пән\s*\/\s*модуль сипаттамасы\s*:/i) ?? "";
        details.competence ||= take(/^Қалыптастырылатын құзіреттілік\s*:/i) ?? "";
        details.prerequisites ||= take(/^Пререквизиттер\s*:/i) ?? "";
        details.postrequisites ||= take(/^Постреквизиттер\s*:/i) ?? "";
        details.tools ||= take(/^Оқытуға қажетті құралдар,?\s*(жабдықтар)?\s*:/i) ?? "";
      }
    }
    if (text.includes("оқытушыныңбайланысақпараты")) {
      const contactRows = rows.slice(rows.findIndex((r) => r.some((c) => /байланыс ақпараты/i.test(c.text))) + 1);
      details.contacts = contactRows.map((r) => r.map((c) => c.lines.join(", ")).filter(Boolean).join(" · ")).filter(Boolean).join("\n");
    }

    // Semester distribution: the course label under "Оның ішінде".
    if (text.includes("семестр") || (text.includes("модульдегібарлықсағатсаны") && !text.includes("тараулар"))) {
      const label = rows.flat().find((c) => /^\d\s*курс$/i.test(c.text));
      if (label) details.courseLabel = label.text;
    }

    // Content table.
    if (text.includes("тараулар") && text.includes("барлықсағатсаны")) {
      const head = rows.slice(0, 2);
      const width = Math.max(...rows.map((r) => r.length));
      const col: Partial<Record<keyof SyllabusTopic | "total" | "no", number>> = {};
      for (let i = 0; i < width; i++) {
        const h = squash(head.map((r) => r[i]?.text ?? "").join(" "));
        if (h === "№" || h === "№№") col.no ??= i;
        else if (h.includes("тараулар") || h.includes("нәтижелері")) col.chapter ??= i;
        else if (h.includes("өлшем") || h.includes("тақырып")) col.topic ??= i;
        else if (h.includes("барлықсағат")) col.total ??= i;
        else if (h.includes("теория")) col.theory ??= i;
        else if (h.includes("зертхан") || h.includes("тәжірибе")) col.practice ??= i;
        else if (h.includes("жеке")) col.individual ??= i;
        else if (h.includes("өндірістік") || h.includes("практика")) col.production ??= i;
        else if (h.includes("педагогпен")) col.sooj ??= i;
        else if (h.includes("өзіндікжұмыс")) col.soj ??= i;
        else if (h.includes("сабақтүрі")) col.lessonType ??= i;
      }
      if (col.topic === undefined) {
        warnings.push("Мазмұн кестесінің бағандары танылмады");
        continue;
      }
      const at = (r: Cell[], k: keyof typeof col) => (col[k] === undefined ? "" : r[col[k]!]?.text ?? "");
      let chapter = "";
      for (const r of rows.slice(2)) {
        const topic = at(r, "topic");
        const chap = at(r, "chapter");
        const first = r.find((c) => c.text)?.text ?? "";
        if (/^Барлық сағат саны/i.test(first) || /^Курстық жұмыс/i.test(chap || first)) continue;
        if (/^Барлығы/i.test(topic)) {
          if (chap) chapter = chap;
          continue;
        }
        // Module row (one cell spanning the table) or empty filler rows.
        if (!topic || r.filter((c) => c.text).length < 2) {
          if (chap && !details.module) details.module = chap;
          continue;
        }
        if (chap && !r[col.chapter!]?.continued) chapter = chap;
        const t: SyllabusTopic = { ...emptyTopic(chapter), topic, theory: 0 };
        for (const f of HOUR_FIELDS) t[f.key] = hours(at(r, f.key));
        t.lessonType = r[col.lessonType!]?.lines.join(" ").replace(/\s+/g, " ").trim() ?? "";
        const stated = hours(at(r, "total"));
        if (stated && stated !== topicHours(t)) {
          warnings.push(`«${topic.slice(0, 50)}»: құжатта ${stated} сағат, бөліктерінің қосындысы ${topicHours(t)}`);
        }
        topics.push(t);
      }
    }

    // СӨЖ tasks.
    if (text.includes("сөжтақырыптары")) {
      const head = rows[0].map((c) => squash(c.text));
      const find = (...keys: string[]) => head.findIndex((h) => keys.some((k) => h.includes(k)));
      const idx = {
        topic: find("өлшем", "сабақтақырып"),
        task: find("сөжтақырып", "тапсырма"),
        controlForm: find("бақылау"),
        literature: find("әдебиет"),
        week: find("мерзім", "апта"),
        maxPoints: find("балл"),
      };
      for (const r of rows.slice(1)) {
        const task = Object.fromEntries(SOJ_FIELDS.map((f) => [f.key, idx[f.key] >= 0 ? r[idx[f.key]]?.lines.join("\n") ?? "" : ""]));
        if (Object.values(task).some(Boolean)) details.sojTasks.push(task as SyllabusDetails["sojTasks"][number]);
      }
    }
  }

  // References: body paragraphs after the "References" / "Әдебиеттер" heading.
  const paras = kids(body, "p").map((p) => norm(paraText(p))).filter(Boolean);
  const ri = paras.findIndex((l) => /^(References|Әдебиеттер|Пайдаланылған әдебиеттер)/i.test(l));
  if (ri >= 0) details.references = paras.slice(ri + 1);

  if (!topics.length) warnings.push("Мазмұн кестесінен тақырыптар табылмады");
  const sum = totals(topics).all;
  if (totalStated && sum && totalStated !== sum) warnings.push(`Жалпы сағат саны құжатта ${totalStated}, тақырыптар бойынша ${sum}`);

  return { topics, details, title: [details.groups, details.courseLabel].filter(Boolean).join(", "), warnings };
}

// ---------------------------------------------------------------------------
// Export in the same layout.

const FONT = "Times New Roman";
const run = (text: string, opts: { bold?: boolean; size?: number; italics?: boolean } = {}) =>
  new TextRun({ text, font: FONT, size: opts.size ?? 24, bold: opts.bold, italics: opts.italics });
const para = (text: string | TextRun[], opts: { bold?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number } = {}) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.after ?? 0 },
    children: typeof text === "string" ? text.split("\n").map((l, i) => new TextRun({ text: l, font: FONT, size: opts.size ?? 24, bold: opts.bold, ...(i ? { break: 1 } : {}) })) : text,
  });

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(
  text: string | number,
  opts: { bold?: boolean; size?: number; span?: number; merge?: "restart" | "continue"; align?: "center"; width?: number } = {},
) {
  return new TableCell({
    borders,
    columnSpan: opts.span,
    verticalMerge: opts.merge === "restart" ? VerticalMergeType.RESTART : opts.merge === "continue" ? VerticalMergeType.CONTINUE : undefined,
    verticalAlign: VerticalAlign.CENTER,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [para(text === 0 ? "" : String(text), { bold: opts.bold, size: opts.size ?? 20, align: opts.align === "center" ? AlignmentType.CENTER : undefined })],
  });
}

const table = (rows: TableRow[], widths?: number[]) => new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths });

/** Builds a .docx in the college's «Оқу жұмыс бағдарламасы» layout. */
export async function buildSyllabusDocx(input: { courseTitle: string; topics: SyllabusTopic[]; details: SyllabusDetails }) {
  const d = input.details;
  const moduleName = d.module || input.courseTitle;
  const sum = totals(input.topics);
  const chs = chapters(input.topics);
  const blank = () => para("");

  const titlePage = [
    para("Жамбыл облысы әкімдігінің білім басқармасының", { align: AlignmentType.CENTER }),
    para("«Жамбыл инновациялық жоғары колледжі» МКҚК", { align: AlignmentType.CENTER, bold: true }),
    para("(білім беру ұйымының атауы)", { align: AlignmentType.CENTER, size: 18 }),
    blank(),
    blank(),
    para("БЕКІТЕМІН", { align: AlignmentType.RIGHT, bold: true }),
    para("Директордың оқу ісі жөніндегі", { align: AlignmentType.RIGHT }),
    para(`орынбасары _________ ${d.approver}`, { align: AlignmentType.RIGHT }),
    para("\"____\" ___________ 20___ж.", { align: AlignmentType.RIGHT }),
    blank(),
    blank(),
    para("Пән/модуль/ өндірістік оқыту мен кәсіптік практика бойынша", { align: AlignmentType.CENTER, bold: true }),
    para("ОҚУ ЖҰМЫС БАҒДАРЛАМАСЫ", { align: AlignmentType.CENTER, bold: true, size: 28, after: 240 }),
    para([run("Пән/модуль атауы: ", { bold: true }), run(moduleName)]),
    para("(модуль атауы)", { align: AlignmentType.CENTER, size: 18 }),
    para([run("Мамандық: ", { bold: true }), run(d.specialty)]),
    para("(коды және атауы)", { align: AlignmentType.CENTER, size: 18 }),
    para([run("Біліктілік: ", { bold: true }), run(d.qualification)]),
    para("(коды және атауы)", { align: AlignmentType.CENTER, size: 18 }),
    para([run("Тобы: ", { bold: true }), run(d.groups)]),
    para([run("Оқыту нысаны: ", { bold: true }), run(d.studyForm)]),
    para([run("Жалпы сағат саны: ", { bold: true }), run(`${sum.all}      `), run("Кредит саны: ", { bold: true }), run(d.credits)]),
    ...(d.authors.length ? d.authors : [""]).flatMap((a, i) => [
      para([run(i === 0 ? "Әзірлеуші(лер): " : "", { bold: true }), run(`${a}`)]),
      para("                              (қолы)                    ( Т.А.Ә. )", { size: 18 }),
    ]),
    blank(),
    para(d.place || `Тараз ${new Date().getFullYear()} ж`, { align: AlignmentType.CENTER, after: 240 }),
  ];

  const note = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [para([run(`${label}: `, { bold: true, size: 22 }), run(value.split("\n")[0] ?? "", { size: 22 })]), ...value.split("\n").slice(1).map((l) => para(l, { size: 22 }))],
        }),
      ],
    });

  const explanatory = [
    para("ТҮСІНДІРМЕ ЖАЗБА", { align: AlignmentType.CENTER, bold: true, after: 120 }),
    table([
      note("Пән/модуль сипаттамасы", d.description),
      note("Қалыптастырылатын құзіреттілік", d.competence),
      note("Пререквизиттер", d.prerequisites),
      note("Постреквизиттер", d.postrequisites),
      note("Оқытуға қажетті құралдар, жабдықтар", d.tools),
      note("Оқытушының байланыс ақпараты", d.contacts),
    ]),
  ];

  const structure = [
    para("Оқу жұмыс бағдарламасының құрылымы", { align: AlignmentType.CENTER, bold: true, after: 60 }),
    para("Семестр бойынша сағат санын бөлу", { align: AlignmentType.CENTER, after: 120 }),
    table([
      new TableRow({ children: [cell("Модуль/пән/ коды және атауы", { bold: true, merge: "restart" }), cell("Модульдегі барлық сағат саны", { bold: true, merge: "restart", align: "center" }), cell("Оның ішінде", { bold: true, align: "center" })] }),
      new TableRow({ children: [cell("", { merge: "continue" }), cell("", { merge: "continue" }), cell(d.courseLabel || "курс", { bold: true, align: "center" })] }),
      new TableRow({ children: [cell(moduleName), cell(sum.all, { align: "center" }), cell(sum.all, { align: "center" })] }),
      ...chs.map((c) => new TableRow({ children: [cell(c.chapter), cell(c.hours, { align: "center" }), cell(c.hours, { align: "center" })] })),
      new TableRow({ children: [cell("Барлығы:", { bold: true }), cell(sum.all, { bold: true, align: "center" }), cell(sum.all, { bold: true, align: "center" })] }),
    ], [5200, 2000, 2000]),
  ];

  const hourCells = (h: Pick<SyllabusTopic, (typeof HOUR_FIELDS)[number]["key"]>, total: number, bold = false) => [
    cell(total, { align: "center", bold }),
    ...HOUR_FIELDS.map((f) => cell(h[f.key], { align: "center", bold })),
  ];
  const contentRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        cell("№", { bold: true, merge: "restart", align: "center" }),
        cell("Тараулар/Оқыту нәтижелері", { bold: true, merge: "restart" }),
        cell("Бағалау өлшем шарттары және/немесе сабақ тақырыптары", { bold: true, merge: "restart" }),
        cell("Барлық сағат саны", { bold: true, merge: "restart", align: "center" }),
        cell("Оның ішінде", { bold: true, span: 4, align: "center" }),
        cell(HOUR_FIELDS[4].long, { bold: true, merge: "restart", align: "center" }),
        cell(HOUR_FIELDS[5].long, { bold: true, merge: "restart", align: "center" }),
        cell("Сабақ түрі", { bold: true, merge: "restart", align: "center" }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: [
        cell("", { merge: "continue" }),
        cell("", { merge: "continue" }),
        cell("", { merge: "continue" }),
        cell("", { merge: "continue" }),
        ...HOUR_FIELDS.slice(0, 4).map((f) => cell(f.long, { bold: true, align: "center", size: 18 })),
        cell("", { merge: "continue" }),
        cell("", { merge: "continue" }),
        cell("", { merge: "continue" }),
      ],
    }),
    new TableRow({ children: [cell(""), cell(moduleName, { bold: true, span: 10 })] }),
  ];
  chs.forEach((c, ci) => {
    const t = totals(c.topics);
    contentRows.push(
      new TableRow({
        children: [cell(ci + 1, { merge: "restart", align: "center" }), cell(c.chapter, { merge: "restart", bold: true }), cell("Барлығы:", { bold: true }), ...hourCells(t, t.all, true), cell(c.topics[0]?.lessonType ?? "")],
      }),
    );
    for (const tp of c.topics) {
      contentRows.push(
        new TableRow({
          children: [cell("", { merge: "continue" }), cell("", { merge: "continue" }), cell(tp.criterion ? `${tp.topic} — ${tp.criterion}` : tp.topic), ...hourCells(tp, topicHours(tp)), cell(tp.lessonType)],
        }),
      );
    }
  });
  contentRows.push(
    new TableRow({ children: [cell(""), cell("Курстық жұмыс/жоба (жоспарланған болса)", { span: 2 }), cell("-", { align: "center" }), ...HOUR_FIELDS.map(() => cell("")), cell("")] }),
    new TableRow({ children: [cell(""), cell("Барлық сағат саны:", { span: 2, bold: true }), ...hourCells(sum, sum.all, true), cell("")] }),
  );
  const content = [
    para("Оқу жұмыс бағдарламасының мазмұны", { align: AlignmentType.CENTER, bold: true, after: 120 }),
    table(contentRows, [400, 1700, 3000, 700, 700, 800, 600, 900, 800, 800, 1100]),
  ];

  const soj = d.sojTasks.length
    ? [
        para(""),
        para("Студенттің өзіндік жұмысы (СӨЖ)", { align: AlignmentType.CENTER, bold: true, after: 120 }),
        table([
          new TableRow({ tableHeader: true, children: [cell("№", { bold: true, align: "center" }), ...SOJ_FIELDS.map((f) => cell(f.label, { bold: true, align: "center" }))] }),
          ...d.sojTasks.map((t, i) => new TableRow({ children: [cell(i + 1, { align: "center" }), ...SOJ_FIELDS.map((f) => cell(t[f.key], { align: f.key === "week" || f.key === "maxPoints" ? "center" : undefined }))] })),
        ], [400, 2400, 3600, 1300, 2200, 1000, 800]),
      ]
    : [];

  const refs = d.references.length ? [para(""), para("Әдебиеттер:", { bold: true }), ...d.references.map((r, i) => para(`${i + 1}. ${r}`))] : [];

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: [
      { properties: { page: { margin: { top: 1000, bottom: 1000, left: 1440, right: 1000 } } }, children: [...titlePage] },
      { properties: { page: { margin: { top: 1000, bottom: 1000, left: 1440, right: 1000 } } }, children: [...explanatory, para(""), ...structure] },
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [...content, ...soj, ...refs],
      },
    ],
  });
  return Packer.toBlob(doc);
}
