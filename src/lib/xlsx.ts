import { strToU8, zipSync } from "fflate";

/**
 * Кішкентай .xlsx жазушы (Office Open XML), сыртқы кітапханасыз: біріктірілген ұяшықтар,
 * баған ені, қатырылған тақырып жолдары және бірнеше дайын стиль. CSV-дан айырмашылығы —
 * Smart Nation «Экспорттау» файлы сияқты екі жолдық тақырыпты дұрыс көрсетеді.
 */

/** Стиль нөмірлері styles.xml ішіндегі cellXfs ретімен. */
export const XS = { plain: 0, header: 1, cell: 2, fail: 3, text: 4, title: 5, total: 6, totalText: 7, note: 8 } as const;

export type XCell = string | number | null | undefined | { v: string | number | null | undefined; s: number };

export type XSheet = {
  name: string;
  rows: XCell[][];
  /** [бастапқы жол, бастапқы баған, соңғы жол, соңғы баған], 0-ден. */
  merges?: [number, number, number, number][];
  /** Баған ені (таңбамен). */
  widths?: number[];
  /** Жол биіктігі (пунктпен), жол нөмірі 0-ден: біріктірілген ұяшықтағы ұзын мәтін үшін. */
  heights?: Record<number, number>;
  /** Қатырылатын жолдар мен бағандар саны. */
  freeze?: { rows: number; cols: number };
};

const esc = (s: string) =>
  s
    // XML 1.0-де рұқсат етілмеген басқару таңбаларын алып тастау
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function colName(i: number) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const ref = (r: number, c: number) => `${colName(c)}${r + 1}`;

function cellXml(r: number, c: number, cell: XCell) {
  const { v, s } = cell !== null && typeof cell === "object" ? cell : { v: cell, s: XS.plain };
  const st = s ? ` s="${s}"` : "";
  if (v === null || v === undefined || v === "") return s ? `<c r="${ref(r, c)}"${st}/>` : "";
  if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref(r, c)}"${st}><v>${v}</v></c>`;
  return `<c r="${ref(r, c)}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
}

function sheetXml(sh: XSheet) {
  const pane = sh.freeze && (sh.freeze.rows || sh.freeze.cols)
    ? `<sheetViews><sheetView workbookViewId="0"><pane${sh.freeze.cols ? ` xSplit="${sh.freeze.cols}"` : ""}${sh.freeze.rows ? ` ySplit="${sh.freeze.rows}"` : ""} topLeftCell="${ref(sh.freeze.rows, sh.freeze.cols)}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>`
    : "";
  const cols = sh.widths?.length
    ? `<cols>${sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const ht = (r: number) => (sh.heights?.[r] ? ` ht="${sh.heights[r]}" customHeight="1"` : "");
  const rows = sh.rows.map((row, r) => `<row r="${r + 1}"${ht(r)}>${row.map((cell, c) => cellXml(r, c, cell)).join("")}</row>`).join("");
  const merges = sh.merges?.length
    ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(([r1, c1, r2, c2]) => `<mergeCell ref="${ref(r1, c1)}:${ref(r2, c2)}"/>`).join("")}</mergeCells>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}${cols}<sheetData>${rows}</sheetData>${merges}</worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="13"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFCDD2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Excel парағының атауы: 31 таңба, []:*?/\ рұқсат етілмейді, бірегей. */
function sheetNames(sheets: XSheet[]) {
  const seen = new Set<string>();
  return sheets.map((s, i) => {
    let n = s.name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || `Sheet${i + 1}`;
    while (seen.has(n)) n = `${n.slice(0, 28)} ${i + 1}`;
    seen.add(n);
    return n;
  });
}

export function buildXlsx(sheets: XSheet[]): Uint8Array {
  const names = sheetNames(sheets);
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
        .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
        .join("")}</Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names
        .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join("")}</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ),
    "xl/styles.xml": strToU8(STYLES),
  };
  sheets.forEach((s, i) => (files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s))));
  return zipSync(files, { level: 6 });
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
