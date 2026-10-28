import type { Role } from "@prisma/client";

/**
 * Excel-ден көшірілген (немесе CSV) пайдаланушылар тізімін оқу.
 * Бағандар тақырып жолы бойынша анықталады (қазақша, орысша, ағылшынша);
 * тақырып болмаса реті: Аты-жөні, ЖСН, Топ, Пошта, Рөлі.
 */

export type ImportRow = { line: number; name: string; role: Role; iin: string | null; email: string | null; group: string | null; error?: string };

const HEADERS: Record<keyof Omit<ImportRow, "line" | "error">, RegExp> = {
  name: /^(аты|аты-жөні|фио|ф\.и\.о|name|full ?name|студент|оқушы|ученик|учащийся|преподаватель|мұғалім)/i,
  iin: /^(жсн|иин|iin)/i,
  group: /^(топ|группа|класс|group|class)/i,
  email: /^(пошта|почта|e-?mail|email)/i,
  role: /^(рөл|роль|role|тип)/i,
};

const ROLE_WORDS: [RegExp, Role][] = [
  [/^(студент|student|оқушы|ученик|учащийся)/i, "STUDENT"],
  [/^(мұғалім|учитель|преподаватель|оқытушы|teacher)/i, "TEACHER"],
  [/^(ата-ана|родитель|parent)/i, "PARENT"],
  [/^(завуч|vice|орынбасар|заместитель)/i, "VICE_PRINCIPAL"],
  [/^(директор|director)/i, "DIRECTOR"],
  [/^(әкімші|админ|admin)/i, "ADMIN"],
];

function splitLine(line: string, sep: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q && ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      q = !q;
    } else if (!q && ch === sep) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseUserTable(text: string, defaultRole: Role = "STUDENT"): ImportRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  let cells = lines.map((l) => splitLine(l, sep));

  let cols: Partial<Record<keyof typeof HEADERS, number>> = { name: 0, iin: 1, group: 2, email: 3, role: 4 };
  const header = cells[0].map((c) => c.toLowerCase());
  const found = Object.fromEntries(
    Object.entries(HEADERS).map(([k, re]) => [k, header.findIndex((h) => re.test(h))]).filter(([, i]) => (i as number) >= 0),
  );
  if ("name" in found) {
    cols = found;
    cells = cells.slice(1);
  }

  return cells.map((c, i) => {
    const get = (k: keyof typeof HEADERS) => (cols[k] !== undefined ? (c[cols[k]!] ?? "").trim() : "");
    const roleText = get("role");
    const role = roleText ? ROLE_WORDS.find(([re]) => re.test(roleText))?.[1] : defaultRole;
    const iin = get("iin").replace(/\s/g, "") || null;
    const email = get("email").toLowerCase() || null;
    const row: ImportRow = { line: i + 1, name: get("name").replace(/\s+/g, " "), role: role ?? defaultRole, iin, email, group: get("group").toUpperCase() || null };
    if (!row.name) row.error = "Аты-жөні жоқ";
    else if (roleText && !role) row.error = `Рөл танылмады: «${roleText}»`;
    else if (iin && !/^\d{12}$/.test(iin)) row.error = "ЖСН 12 сан болуы керек";
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) row.error = "Пошта дұрыс емес";
    else if (!iin && !email) row.error = "ЖСН немесе пошта керек (қайта импортта адамды табу үшін)";
    else if (row.role === "STUDENT" && !row.group) row.error = "Студенттің тобы көрсетілмеген";
    return row;
  });
}

export type ImportResult = { created: number; updated: number; groupsCreated: string[]; skipped: number };
