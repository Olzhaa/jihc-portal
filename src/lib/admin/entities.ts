import { ATTENDANCE_LABEL, GRADE_TYPE_LABEL } from "@/lib/grades";
import { ROOM_TYPE_LABEL } from "@/lib/rooms";
import { ROLE_LABEL } from "@/lib/roles";
import { BELLS, DAYS } from "@/lib/bells";

/**
 * Админ панельдің сипаттамасы: әр кесте (entity) және оның өрістері.
 * Бір конфигурация Next.js қосымшасында да (Prisma), демода да (localStorage) қолданылады,
 * сондықтан жаңа өріс қосу үшін тек осы файлды өзгерту жеткілікті.
 */

export type Option = { value: string; label: string };

/** Байланыс өрістерінің таңдау тізімдері (сервер мен демо бірдей толтырады). */
export type RefKind = "user" | "student" | "staff" | "parent" | "group" | "course" | "room";
export type RefOptions = Record<RefKind, Option[]>;

export type FieldType = "text" | "textarea" | "number" | "bool" | "date" | "datetime" | "enum" | "ref" | "refs" | "color";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: Option[]; // enum
  ref?: RefKind; // ref | refs
  required?: boolean;
  min?: number;
  max?: number;
  /** Кестеде баған ретінде көрсетіледі. */
  list?: boolean;
  /** Кесте үстінде сүзгі ретінде шығады (enum, ref, bool). */
  filter?: boolean;
  help?: string;
  /** Формада тек көрсетіледі, өзгертілмейді. */
  readOnly?: boolean;
  /** Өріс тек осы шарт орындалса көрінеді (мысалы, балалар тек ата-анаға). */
  showIf?: (values: Record<string, unknown>) => boolean;
};

export type EntityKey =
  | "users" | "groups" | "courses" | "rooms" | "lessons" | "grades" | "attendance"
  | "syllabi" | "certificates" | "bookings" | "announcements" | "rules";

export type Entity = {
  key: EntityKey;
  label: string;
  singular: string;
  section: string;
  icon: string;
  description: string;
  fields: Field[];
  /** Жазбаның адамға түсінікті атауы (аудит журналы мен өшіру сұрағы үшін). */
  title: (row: Row, ref: RefLabel) => string;
  /** Тек өңдеу/өшіру; жаңасы порталдың өз бетінде жасалады. */
  noCreate?: boolean;
  /** Үлкен кестелер: серверден соңғы N жазба ғана жүктеледі. */
  limit?: number;
  /** Автор өрісі: жаңа жазбада ағымдағы әкімші қойылады. */
  authorField?: string;
};

export type Row = Record<string, unknown> & { id: string };

const opts = (labels: Record<string, string>): Option[] => Object.entries(labels).map(([value, label]) => ({ value, label }));

export const STATUS_LABEL = { PENDING: "Күтуде", APPROVED: "Бекітілді", REJECTED: "Қабылданбады" } as const;
export const SYLLABUS_STATUS_LABEL = { DRAFT: "Жоба", ...STATUS_LABEL } as const;
export const BOOKING_STATUS_LABEL = { ...STATUS_LABEL, CANCELLED: "Бас тартылды" } as const;
export const DAY_OPTIONS: Option[] = DAYS.map((d) => ({ value: String(d.n), label: d.long }));

const roomTypeLabel = Object.fromEntries(Object.entries(ROOM_TYPE_LABEL).map(([k, v]) => [k, v[0].toUpperCase() + v.slice(1)]));

export const ENTITIES: Entity[] = [
  {
    key: "users",
    label: "Пайдаланушылар",
    singular: "Пайдаланушы",
    section: "Адамдар",
    icon: "users",
    description: "Студенттер, мұғалімдер, ата-аналар және әкімшілік. Кеткен адамды өшірмей, «Белсенді» белгісін алып тастаңыз: деректері сақталады, бірақ кіре алмайды.",
    fields: [
      { key: "name", label: "Аты-жөні", type: "text", required: true, list: true },
      { key: "role", label: "Рөлі", type: "enum", options: opts(ROLE_LABEL), required: true, list: true, filter: true },
      { key: "email", label: "Корпоративтік пошта", type: "text", list: true, help: "@jihc.edu.kz: Google арқылы кіру осы поштамен", showIf: (v) => v.role !== "PARENT" },
      { key: "iin", label: "ЖСН", type: "text", list: true, help: "12 сан", showIf: (v) => v.role === "STUDENT" },
      { key: "groupId", label: "Тобы", type: "ref", ref: "group", list: true, filter: true, showIf: (v) => v.role === "STUDENT" },
      { key: "childIds", label: "Балалары", type: "refs", ref: "student", showIf: (v) => v.role === "PARENT", help: "PIN кодты «Ата-ана PIN-кодтары» бетінде завуч береді" },
      { key: "parentId", label: "Parent ID", type: "text", readOnly: true, showIf: (v) => v.role === "PARENT" },
      { key: "active", label: "Белсенді", type: "bool", list: true, filter: true },
    ],
    title: (r) => String(r.name),
  },
  {
    key: "groups",
    label: "Топтар",
    singular: "Топ",
    section: "Оқу процесі",
    icon: "users",
    description: "Топ атауы EduPage-тегідей (2F-1), Smart Nation атауы экспорт үшін (F1-2025).",
    fields: [
      { key: "name", label: "Атауы (EduPage)", type: "text", required: true, list: true },
      { key: "snationCode", label: "Smart Nation атауы", type: "text", list: true },
      { key: "curatorId", label: "Кураторы", type: "ref", ref: "staff", list: true, filter: true },
    ],
    title: (r) => String(r.name),
  },
  {
    key: "courses",
    label: "Пәндер",
    singular: "Пән",
    section: "Оқу процесі",
    icon: "book",
    description: "Пәндер мен модульдер. Түс кестеде көрінеді.",
    fields: [
      { key: "code", label: "Модуль коды", type: "text", list: true, help: "мысалы «КМ4 ОН 4.1, 4.3»" },
      { key: "title", label: "Атауы", type: "text", required: true, list: true },
      { key: "color", label: "Түсі", type: "color", list: true },
    ],
    title: (r) => (r.code ? `${r.code} ${r.title}` : String(r.title)),
  },
  {
    key: "rooms",
    label: "Кабинеттер",
    singular: "Кабинет",
    section: "Оқу процесі",
    icon: "door",
    description: "Кәдімгі кабинет бос болса брондау бірден расталады; арнайы бөлмелерді жауапты мұғалім бекітеді.",
    fields: [
      { key: "name", label: "Атауы", type: "text", required: true, list: true },
      { key: "type", label: "Түрі", type: "enum", options: opts(roomTypeLabel), required: true, list: true, filter: true },
      { key: "capacity", label: "Орын саны", type: "number", min: 1, list: true },
      { key: "managerId", label: "Жауапты мұғалім", type: "ref", ref: "staff", list: true, help: "Арнайы бөлмелердің өтінімдерін бекітеді" },
    ],
    title: (r) => String(r.name),
  },
  {
    key: "lessons",
    label: "Сабақ кестесі",
    singular: "Сабақ",
    section: "Оқу процесі",
    icon: "calendar",
    description: "Апталық кесте. Қақтығыстарды тексеретін көрнекі генератор «Кесте генераторы» бетінде.",
    fields: [
      { key: "groupId", label: "Топ", type: "ref", ref: "group", required: true, list: true, filter: true },
      { key: "courseId", label: "Пән", type: "ref", ref: "course", required: true, list: true, filter: true },
      { key: "teacherId", label: "Мұғалім", type: "ref", ref: "staff", required: true, list: true, filter: true },
      { key: "roomId", label: "Кабинет", type: "ref", ref: "room", required: true, list: true },
      { key: "dayOfWeek", label: "Күні", type: "enum", options: DAY_OPTIONS, required: true, list: true, filter: true },
      { key: "startPeriod", label: "Басталатын қоңырау", type: "number", min: 1, max: BELLS.length, required: true, list: true },
      { key: "endPeriod", label: "Аяқталатын қоңырау", type: "number", min: 1, max: BELLS.length, required: true, list: true },
    ],
    title: (r, ref) => `${ref("group", r.groupId)}: ${ref("course", r.courseId)}`,
  },
  {
    key: "grades",
    label: "Бағалар",
    singular: "Баға",
    section: "Оқу процесі",
    icon: "chart",
    description: "Қате қойылған бағаны түзету үшін. Күнделікті баға қою мұғалімнің журналында.",
    fields: [
      { key: "studentId", label: "Студент", type: "ref", ref: "student", required: true, list: true },
      { key: "courseId", label: "Пән", type: "ref", ref: "course", required: true, list: true, filter: true },
      { key: "type", label: "Түрі", type: "enum", options: opts(GRADE_TYPE_LABEL), required: true, list: true, filter: true },
      { key: "value", label: "Балл (0–100)", type: "number", min: 0, max: 100, required: true, list: true },
      { key: "weight", label: "Коэффициент", type: "number", min: 0, max: 10 },
      { key: "comment", label: "Түсініктеме", type: "text" },
      { key: "date", label: "Күні", type: "datetime", required: true, list: true },
      { key: "givenById", label: "Қойған мұғалім", type: "ref", ref: "staff", required: true, list: true, filter: true },
    ],
    title: (r, ref) => `${ref("student", r.studentId)}, ${ref("course", r.courseId)}: ${r.value}`,
    limit: 2000,
    noCreate: true,
  },
  {
    key: "attendance",
    label: "Қатысу",
    singular: "Қатысу белгісі",
    section: "Оқу процесі",
    icon: "check",
    description: "Қате белгіні түзету үшін. Күнделікті белгілеу мұғалімнің журналында.",
    fields: [
      { key: "studentId", label: "Студент", type: "ref", ref: "student", required: true, list: true },
      { key: "courseId", label: "Пән", type: "ref", ref: "course", required: true, list: true, filter: true },
      { key: "date", label: "Күні", type: "date", required: true, list: true },
      { key: "status", label: "Белгі", type: "enum", options: opts(ATTENDANCE_LABEL), required: true, list: true, filter: true },
      { key: "markedById", label: "Белгілеген", type: "ref", ref: "staff", required: true, list: true },
    ],
    title: (r, ref) => `${ref("student", r.studentId)}, ${ref("course", r.courseId)}`,
    limit: 2000,
    noCreate: true,
  },
  {
    key: "syllabi",
    label: "Силлабустар",
    singular: "Силлабус",
    section: "Өтінімдер",
    icon: "file",
    description: "Мәртебе мен пікірді өзгертуге болады. Мазмұнын мұғалім өз бетінде өңдейді.",
    fields: [
      { key: "title", label: "Атауы", type: "text", required: true, list: true },
      { key: "courseId", label: "Пән", type: "ref", ref: "course", required: true, list: true, filter: true },
      { key: "authorId", label: "Авторы", type: "ref", ref: "staff", required: true, list: true, filter: true },
      { key: "status", label: "Мәртебесі", type: "enum", options: opts(SYLLABUS_STATUS_LABEL), required: true, list: true, filter: true },
      { key: "totalHours", label: "Сағат", type: "number", readOnly: true, list: true },
      { key: "reviewNote", label: "Завуч пікірі", type: "textarea" },
    ],
    title: (r) => String(r.title),
    noCreate: true,
  },
  {
    key: "certificates",
    label: "Анықтамалар",
    singular: "Анықтама",
    section: "Өтінімдер",
    icon: "stethoscope",
    description: "Медициналық анықтамалар. Файлды «Справкалар» бетінен ашыңыз.",
    fields: [
      { key: "studentId", label: "Студент", type: "ref", ref: "student", required: true, list: true },
      { key: "startDate", label: "Басталуы", type: "date", required: true, list: true },
      { key: "endDate", label: "Аяқталуы", type: "date", required: true, list: true },
      { key: "status", label: "Мәртебесі", type: "enum", options: opts(STATUS_LABEL), required: true, list: true, filter: true },
      { key: "reviewNote", label: "Пікір", type: "textarea" },
    ],
    title: (r, ref) => `${ref("student", r.studentId)} анықтамасы`,
    noCreate: true,
  },
  {
    key: "bookings",
    label: "Брондаулар",
    singular: "Брондау",
    section: "Өтінімдер",
    icon: "door",
    description: "Кабинет пен залды брондау. Әкімші енгізгені уақыт қиылысуын тексермейді.",
    fields: [
      { key: "roomId", label: "Бөлме", type: "ref", ref: "room", required: true, list: true, filter: true },
      { key: "userId", label: "Кім брондады", type: "ref", ref: "staff", required: true, list: true },
      { key: "startTime", label: "Басталуы", type: "datetime", required: true, list: true },
      { key: "endTime", label: "Аяқталуы", type: "datetime", required: true, list: true },
      { key: "reason", label: "Мақсаты", type: "text", required: true, list: true },
      { key: "status", label: "Мәртебесі", type: "enum", options: opts(BOOKING_STATUS_LABEL), required: true, list: true, filter: true },
    ],
    title: (r, ref) => `${ref("room", r.roomId)}: ${r.reason}`,
    authorField: "userId",
  },
  {
    key: "announcements",
    label: "Хабарландырулар",
    singular: "Хабарландыру",
    section: "Мазмұн",
    icon: "megaphone",
    description: "Топ таңдалмаса, хабарландыру барлығына көрінеді.",
    fields: [
      { key: "title", label: "Тақырыбы", type: "text", required: true, list: true },
      { key: "content", label: "Мәтіні", type: "textarea", required: true },
      { key: "important", label: "Маңызды", type: "bool", list: true, filter: true },
      { key: "groupIds", label: "Топтар", type: "refs", ref: "group", list: true, help: "Бос қалса — барлығына" },
      { key: "authorId", label: "Авторы", type: "ref", ref: "user", readOnly: true, list: true },
      { key: "createdAt", label: "Жарияланды", type: "datetime", readOnly: true, list: true },
    ],
    title: (r) => String(r.title),
    authorField: "authorId",
  },
  {
    key: "rules",
    label: "Ережелер",
    singular: "Ереже",
    section: "Мазмұн",
    icon: "scale",
    description: "Колледж ережелері: барлық пайдаланушыға «Ережелер» бетінде көрінеді.",
    fields: [
      { key: "title", label: "Атауы", type: "text", required: true, list: true },
      { key: "content", label: "Мәтіні", type: "textarea", required: true },
      { key: "authorId", label: "Авторы", type: "ref", ref: "user", readOnly: true, list: true },
      { key: "updatedAt", label: "Жаңартылды", type: "datetime", readOnly: true, list: true },
    ],
    title: (r) => String(r.title),
    authorField: "authorId",
  },
];

export const ENTITY: Record<EntityKey, Entity> = Object.fromEntries(ENTITIES.map((e) => [e.key, e])) as Record<EntityKey, Entity>;

export const isEntityKey = (k: string): k is EntityKey => k in ENTITY;

export const ADMIN_SECTIONS = [...new Set(ENTITIES.map((e) => e.section))];

/** Формада көрінетін және сақталатын өрістер. */
export const editableFields = (e: Entity, values: Record<string, unknown>) => e.fields.filter((f) => !f.readOnly && (!f.showIf || f.showIf(values)));

const IIN = /^\d{12}$/;

/**
 * Формадан келген мәндерді тексеріп, дерекқорға жазуға дайын түрге келтіреді.
 * Күндер: date → UTC түн ортасы (@db.Date), datetime → ISO (клиент уақыт белдеуін өзі ескереді).
 * Көрінбейтін өрістер (showIf) null болып тазаланады, мысалы студент мұғалімге ауысса тобы өшеді.
 */
export function parseValues(e: Entity, raw: Record<string, unknown>): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {};
  for (const f of e.fields) {
    if (f.readOnly) continue;
    if (f.showIf && !f.showIf(raw)) {
      data[f.key] = f.type === "refs" ? [] : f.type === "bool" ? false : null;
      continue;
    }
    const v = raw[f.key];
    const empty = v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && f.type !== "refs" && v.length === 0);
    if (empty && f.type !== "bool" && f.type !== "refs") {
      if (f.required) return { error: `«${f.label}» толтырылуы керек` };
      data[f.key] = null;
      continue;
    }
    switch (f.type) {
      case "bool":
        data[f.key] = v === true || v === "true" || v === "on";
        break;
      case "number": {
        const n = Number(String(v).replace(",", "."));
        if (!Number.isFinite(n)) return { error: `«${f.label}» сан болуы керек` };
        if (f.min !== undefined && n < f.min) return { error: `«${f.label}» кемінде ${f.min}` };
        if (f.max !== undefined && n > f.max) return { error: `«${f.label}» ең көбі ${f.max}` };
        data[f.key] = n;
        break;
      }
      case "date": {
        const s = String(v).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { error: `«${f.label}» күні дұрыс емес` };
        data[f.key] = new Date(`${s}T00:00:00.000Z`);
        break;
      }
      case "datetime": {
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) return { error: `«${f.label}» уақыты дұрыс емес` };
        data[f.key] = d;
        break;
      }
      case "enum": {
        const s = String(v);
        if (!f.options?.some((o) => o.value === s)) return { error: `«${f.label}» мәні дұрыс емес` };
        data[f.key] = f.key === "dayOfWeek" ? Number(s) : s;
        break;
      }
      case "refs":
        data[f.key] = Array.isArray(v) ? v.map(String).filter(Boolean) : [];
        break;
      default:
        data[f.key] = String(v).trim();
    }
  }

  // Кестеге тән тексерулер
  if (e.key === "users") {
    if (typeof data.email === "string") {
      const email = data.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Пошта дұрыс емес" };
      data.email = email;
    }
    if (data.iin && !IIN.test(String(data.iin))) return { error: "ЖСН 12 саннан тұруы керек" };
    if (data.role !== "PARENT" && !data.email && data.role !== "STUDENT") return { error: "Қызметкерге корпоративтік пошта керек: ол сонымен кіреді" };
  }
  if (e.key === "lessons" && Number(data.endPeriod) < Number(data.startPeriod)) return { error: "Аяқталатын қоңырау басталатыннан кейін болуы керек" };
  if ((e.key === "certificates" && data.endDate! < data.startDate!) || (e.key === "bookings" && data.endTime! <= data.startTime!)) {
    return { error: "Аяқталу уақыты басталудан кейін болуы керек" };
  }
  return { data };
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Колледж уақыты (UTC+5). Intl қолданылмайды: сервер мен браузердің ICU деректері әртүрлі болуы мүмкін. */
const ALMATY_OFFSET = 5 * 60 * 60 * 1000;
export function formatDateTime(v: string | Date) {
  const d = new Date(new Date(v).getTime() + ALMATY_OFFSET);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
const formatDay = (v: string | Date) => {
  const d = new Date(v);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
};

export type RefLabel = (kind: RefKind, id: unknown) => string;

/** Мәнді адамға түсінікті мәтінге айналдыру (кесте, CSV, аудит журналы). */
export function formatValue(f: Field, v: unknown, ref: RefLabel): string {
  if (v === null || v === undefined || v === "") return "";
  switch (f.type) {
    case "enum":
      return f.options?.find((o) => o.value === String(v))?.label ?? String(v);
    case "ref":
      return ref(f.ref!, v);
    case "refs":
      return (v as string[]).map((id) => ref(f.ref!, id)).join(", ");
    case "bool":
      return v ? "Иә" : "Жоқ";
    case "date":
      return formatDay(v as string | Date);
    case "datetime":
      return formatDateTime(v as string | Date);
    default:
      return String(v);
  }
}

/** Аудит журналына: өзгерген өрістер [өріс, бұрынғы, жаңа], мәтін түрінде, форма ретімен. */
export type Change = [field: string, from: string | null, to: string | null];
export function diff(e: Entity, before: Record<string, unknown> | null, after: Record<string, unknown>, ref: RefLabel) {
  const out: Change[] = [];
  for (const f of e.fields) {
    if (!(f.key in after)) continue;
    const a = before ? formatValue(f, before[f.key], ref) : "";
    const b = formatValue(f, after[f.key], ref);
    if (a !== b) out.push([f.label, a || null, b || null]);
  }
  return out;
}

export const ACTION_LABEL: Record<string, string> = { CREATE: "Қосты", UPDATE: "Өзгертті", DELETE: "Өшірді", IMPORT: "Импорттады" };
