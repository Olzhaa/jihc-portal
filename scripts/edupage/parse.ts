// EduPage экспортын (regulartt.json + userhome.json) порталдың құрылымына аударады.
// Таза функциялар ғана: дерекқорға жазу import.ts ішінде.
//
// regulartt.json  — /timetable/server/regulartt.js?__func=regularttGetData жауабы
//                   (r.dbiAccessorRes.tables: teachers, classes, subjects, classrooms, periods, daysdefs, lessons, cards, groups)
// userhome.json   — /user/ бетіндегі userhome({...}) аргументі (dbi: teachers, students, classes, ...)
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { BELLS } from "../../src/lib/bells";

type Row = Record<string, unknown>;
type RoomType = "CLASSROOM" | "LAB" | "STAFFROOM" | "HALL";

export type EduTeacher = { edupageId: string; name: string; short: string; email: string | null };
export type EduGroup = { edupageId: string; name: string; curatorEdupageId: string | null };
export type EduCourse = { edupageId: string; code: string | null; title: string; color: string | null };
export type EduRoom = { edupageId: string; name: string; type: RoomType };
export type EduStudent = { edupageId: string; name: string; groupEdupageId: string | null };
export type EduLesson = {
  edupageId: string;
  groupEdupageId: string;
  courseEdupageId: string;
  teacherEdupageId: string;
  roomEdupageId: string | null;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
};
export type EduData = {
  teachers: EduTeacher[];
  groups: EduGroup[];
  courses: EduCourse[];
  rooms: EduRoom[];
  students: EduStudent[];
  lessons: EduLesson[];
  warnings: string[];
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : str(v) ? [str(v)] : []);

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** regulartt жауабынан кестелерді id → жолдар картасы ретінде алады. */
function ttTables(raw: unknown): Map<string, Row[]> {
  const root = raw as { r?: { dbiAccessorRes?: { tables?: { id: string; data_rows: Row[] }[] } } };
  const tables = root?.r?.dbiAccessorRes?.tables ?? (raw as { tables?: { id: string; data_rows: Row[] }[] })?.tables;
  if (!Array.isArray(tables)) throw new Error("regulartt.json: r.dbiAccessorRes.tables табылмады");
  return new Map(tables.map((t) => [t.id, t.data_rows ?? []]));
}

/** userhome dbi: { teachers: {id: {...}}, students: {...} } немесе массивтер. */
function dbiTable(dbi: Record<string, unknown> | undefined, name: string): Row[] {
  const t = dbi?.[name];
  if (!t) return [];
  if (Array.isArray(t)) return t as Row[];
  return Object.entries(t as Record<string, Row>).map(([id, row]) => ({ id, ...row }));
}

const personName = (r: Row) => [str(r.firstname), str(r.lastname)].filter(Boolean).join(" ") || str(r.name) || str(r.short);

/** «КМ4 ОН 4.1, 4.3 Graph Design» → code «КМ4 ОН 4.1, 4.3», title «Graph Design». */
export function splitSubject(name: string): { code: string | null; title: string } {
  const m = name.trim().match(/^((?:КМ|ЖММ|ЖББП|БМ|Ф)\s*\d+\.?\s*(?:ОН\s*\d[\d.,\-\s]*\d)?)\.?\s*[-–]?\s+(.+)$/i);
  return m ? { code: m[1].replace(/[.\s]+$/, "").trim(), title: m[2].trim() } : { code: null, title: name.trim() };
}

/** Бөлме түрін атауынан болжайды (кейін әкімші өзгерте алады). */
export function guessRoomType(name: string): RoomType {
  const n = name.toLowerCase();
  if (/акт|актов|assembly/.test(n)) return "HALL";
  if (/мұғалім|учительск|teachers/.test(n)) return "STAFFROOM";
  if (/компьютер|comp|лаб|lab|\bit\b/.test(n)) return "LAB";
  return "CLASSROOM";
}

/** EduPage қоңырауын (периодын) порталдың BELLS нөміріне басталу уақыты арқылы аударады. */
function periodMap(periods: Row[]): Map<string, number> {
  const map = new Map<string, number>();
  const sorted = [...periods].sort((a, b) => str(a.starttime).localeCompare(str(b.starttime)));
  sorted.forEach((p, i) => {
    const start = str(p.starttime).padStart(5, "0");
    const bell = BELLS.find((b) => b.start === start);
    const n = bell?.n ?? i + 1;
    for (const key of [str(p.id), str(p.period)]) if (key && !map.has(key)) map.set(key, n);
  });
  return map;
}

/** «10000» → 1 (дүйсенбі). Сенбі/жексенбі немесе бірнеше күн болса — барлығы. */
const daysFromMask = (mask: string) =>
  [...mask].flatMap((c, i) => (c === "1" ? [i + 1] : [])).filter((d) => d >= 1 && d <= 5);

export function parseExport(dir: string): EduData {
  const warnings: string[] = [];
  // bundle.json = { regulartt, userhome, ttviewer } бір файлда; болмаса бөлек файлдар.
  const bundlePath = join(dir, "bundle.json");
  const bundle = existsSync(bundlePath) ? (readJson(bundlePath) as { regulartt?: unknown; userhome?: unknown }) : {};
  const ttPath = join(dir, "regulartt.json");
  const uhPath = join(dir, "userhome.json");
  const ttRaw = bundle.regulartt ?? (existsSync(ttPath) ? readJson(ttPath) : undefined);
  const tt = ttRaw ? ttTables(ttRaw) : new Map<string, Row[]>();
  const uh = (bundle.userhome ?? (existsSync(uhPath) ? readJson(uhPath) : undefined)) as { dbi?: Record<string, unknown> } | undefined;
  const dbi = uh?.dbi ?? (uh as Record<string, unknown> | undefined);
  if (!tt.size) warnings.push("regulartt.json жоқ: кесте импортталмайды");
  if (!uh) warnings.push("userhome.json жоқ: студенттер импортталмайды, мұғалімдердің толық аты болмауы мүмкін");

  // --- Мұғалімдер: userhome толық аты + кестедегі қысқа аты ---
  const teachers = new Map<string, EduTeacher>();
  for (const r of dbiTable(dbi, "teachers")) {
    const id = str(r.id);
    if (!id || str(r.dateto) || r.isOut === true) continue; // жұмыстан кеткен
    teachers.set(id, { edupageId: id, name: personName(r), short: str(r.short), email: str(r.email) || null });
  }
  const teacherAlias = new Map<string, string>(); // кестедегі id → userhome id (id-лер сәйкес келмесе)
  for (const r of tt.get("teachers") ?? []) {
    const id = str(r.id);
    if (teachers.has(id)) continue;
    const byShort = [...teachers.values()].find((t) => t.short && t.short === str(r.short));
    if (byShort) teacherAlias.set(id, byShort.edupageId);
    else teachers.set(id, { edupageId: id, name: personName(r), short: str(r.short), email: str(r.email) || null });
  }

  // --- Топтар (EduPage «класс») ---
  const groups = new Map<string, EduGroup>();
  for (const r of [...(tt.get("classes") ?? []), ...dbiTable(dbi, "classes")]) {
    const id = str(r.id);
    if (!id) continue;
    const curator = str(r.teacherid);
    const known = groups.get(id);
    if (known) {
      if (!known.curatorEdupageId && curator) known.curatorEdupageId = teacherAlias.get(curator) ?? curator;
      continue;
    }
    groups.set(id, { edupageId: id, name: str(r.short) || str(r.name), curatorEdupageId: str(r.teacherid) ? (teacherAlias.get(str(r.teacherid)) ?? str(r.teacherid)) : null });
  }

  // --- Пәндер ---
  const courses = new Map<string, EduCourse>();
  for (const r of [...(tt.get("subjects") ?? []), ...dbiTable(dbi, "subjects")]) {
    const id = str(r.id);
    if (!id || courses.has(id)) continue;
    const { code, title } = splitSubject(str(r.name) || str(r.short));
    courses.set(id, { edupageId: id, code, title, color: str(r.color) || null });
  }

  // --- Кабинеттер ---
  const rooms = new Map<string, EduRoom>();
  for (const r of [...(tt.get("classrooms") ?? []), ...dbiTable(dbi, "classrooms")]) {
    const id = str(r.id);
    if (!id || rooms.has(id)) continue;
    const name = str(r.short) || str(r.name);
    rooms.set(id, { edupageId: id, name, type: guessRoomType(`${str(r.name)} ${str(r.short)}`) });
  }

  // --- Студенттер ---
  const students: EduStudent[] = [];
  for (const r of dbiTable(dbi, "students")) {
    const id = str(r.id);
    if (!id || str(r.dateto) || r.isOut === true) continue; // оқудан шыққан
    const classId = str(r.classid) || null;
    if (classId && !groups.has(classId)) warnings.push(`студент ${id}: белгісіз класс ${classId}`);
    students.push({ edupageId: id, name: personName(r), groupEdupageId: classId });
  }

  // --- Сабақтар: card (күн + қоңырау) × lesson (пән, мұғалім, топ) ---
  const periods = periodMap(tt.get("periods") ?? []);
  const daysdefs = new Map((tt.get("daysdefs") ?? []).map((d) => [str(d.id), arr(d.vals)]));
  const lessonsById = new Map((tt.get("lessons") ?? []).map((l) => [str(l.id), l]));
  const groupClass = new Map((tt.get("groups") ?? []).map((g) => [str(g.id), str(g.classid)]));
  const lessons: EduLesson[] = [];
  for (const card of tt.get("cards") ?? []) {
    const lesson = lessonsById.get(str(card.lessonid));
    if (!lesson) continue;
    const start = periods.get(str(card.period));
    if (!start) {
      warnings.push(`card ${str(card.id)}: белгісіз қоңырау ${str(card.period)}`);
      continue;
    }
    const duration = Number(lesson.durationperiods) || 1;
    const days = str(card.days)
      ? daysFromMask(str(card.days))
      : (daysdefs.get(str(lesson.daysdefid)) ?? []).flatMap(daysFromMask);
    const classIds = new Set([...arr(lesson.classids), ...arr(lesson.groupids).map((g) => groupClass.get(g) ?? "")].filter(Boolean));
    const teacherIds = arr(lesson.teacherids).map((t) => teacherAlias.get(t) ?? t);
    const courseId = str(lesson.subjectid);
    const roomId = arr(card.classroomids)[0] ?? null;
    if (!teacherIds.length) warnings.push(`lesson ${str(lesson.id)}: мұғалімі жоқ, өткізілді`);
    for (const day of days)
      for (const classId of classIds)
        for (const teacherId of teacherIds)
          lessons.push({
            edupageId: [str(card.id), day, classId, teacherId].join(":"),
            groupEdupageId: classId,
            courseEdupageId: courseId,
            teacherEdupageId: teacherId,
            roomEdupageId: roomId,
            dayOfWeek: day,
            startPeriod: start,
            endPeriod: Math.min(start + duration - 1, BELLS.length),
          });
  }

  // EduPage-те жүздеген ескі пән бар: тек кестеде қолданылатындарын аламыз.
  const usedCourses = new Set(lessons.map((l) => l.courseEdupageId));
  const activeCourses = usedCourses.size ? [...courses.values()].filter((c) => usedCourses.has(c.edupageId)) : [...courses.values()];
  return { teachers: [...teachers.values()], groups: [...groups.values()], courses: activeCourses, rooms: [...rooms.values()], students, lessons, warnings };
}
