// Curator (куратор) workspace: shared types, field definitions and rules.
// Used by the Next.js app and the in-browser demo, so it must stay free of server code.

import { z } from "zod";

// --- Option lists (stored as the Kazakh label itself) -------------------------

export const ACTIVITY = ["Белсенді", "Орташа", "Тұйық — назар керек"];
export const QUIET = "Тұйық — назар керек";
export const HOBBIES = ["Сурет салу", "Фото", "Видео", "Спорт", "Музыка", "Кітап", "Ойын"];
export const GENDER = ["Ұл", "Қыз"];
export const DESIGN_DIRECTION = ["Полиграфия", "UI/веб", "Моушн", "Брендинг", "Иллюстрация", "Әлі таңдамаған"];
export const FUTURE_PLAN = ["ЖОО", "Жұмыс", "Өз ісі", "Белгісіз"];
export const ADMISSION_STATUS = ["Әлі шешпеген", "Жоспарлауда", "Құжат дайындауда", "Өтініш берілді", "Қабылданды", "Бас тартылды"];
export const STUDY_COUNTRY = ["Қазақстан", "Түркия", "АҚШ", "Ұлыбритания", "Оңтүстік Корея", "Малайзия", "Еуропа", "Ресей", "Басқа"];
export const SOCIAL_STATUS = ["Қалыпты", "Аз қамтылған", "АСП алады"];
export const MBTI = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
export const GALLUP = [
  "Achiever", "Arranger", "Belief", "Consistency", "Deliberative", "Discipline", "Focus", "Responsibility", "Restorative",
  "Activator", "Command", "Communication", "Competition", "Maximizer", "Self-Assurance", "Significance", "Woo",
  "Adaptability", "Connectedness", "Developer", "Empathy", "Harmony", "Includer", "Individualization", "Positivity", "Relator",
  "Analytical", "Context", "Futuristic", "Ideation", "Input", "Intellection", "Learner", "Strategic",
];
export const GARDNER = ["Лингвистикалық", "Логика-математикалық", "Кеңістіктік", "Дене-кинестетикалық", "Музыкалық", "Тұлғааралық", "Ішкі тұлғалық", "Натуралистік", "Экзистенциалдық"];

export const RELATION = ["Әке", "Ана", "Қамқоршы", "Ата", "Әже", "Аға/Әпке"];
export const FAMILY_STATUS = ["Толық отбасы", "Жартылай отбасы", "Қамқоршыда", "Басқа"];
export const RESPONSIVENESS = ["Өте белсенді", "Белсенді", "Орташа", "Нашар", "Байланысқа шықпайды"];

export const WITH_WHOM = ["Студент", "Ата-ана", "Студент + ата-ана"];
export const TOPICS = ["Оқу үлгерімі", "Тәртіп", "Отбасы", "Оқуға түсу", "Психологиялық жағдай", "Достық қарым-қатынас", "Денсаулық", "Кітап оқу", "Басқа"];
export const MOOD = ["Өте жақсы", "Жақсы", "Орташа", "Нашар", "Алаңдатады"];

export const FREQUENCY = ["Апта сайын", "Ай сайын", "Тоқсан сайын", "Семестр сайын", "Жыл сайын", "Бір рет (осы курста)"];
export const COURSE = ["1 курс", "2 курс", "3 курс"];
export const LOG_IN = ["Байланыс журналы", "Іс-шаралар", "Студенттер профилі", "Тесттер", "Колледж құжаты"];

export const EVENT_TYPE = [
  "Тәрбие сағаты", "Сынып сағаты", "Экскурсия / саяхат", "Табиғат аясына шығу", "Туған күн", "Атаулы күн", "Спорттық / жарыс",
  "Интенсив / лагерь", "Асар / волонтерлік", "Фильм көру", "Кеш / мереке", "Марафон / челлендж", "Кездесу / қонақ", "Тренинг",
  "Ата-аналар жиналысы", "Ата-аналарға арналған",
];
export const EVENT_FORMAT = ["Презентация", "Дебат", "Сайыс", "Топтық жарыс", "Уоркшоп", "Ойтолғау", "Ашық сұхбат", "Интервью", "Қонақпен кездесу"];
export const EVENT_STATUS = ["Идея", "Жоспарланды", "Дайындық", "Өтті", "Талдау жасалды", "Болмай қалды"];
export const DIRECTIONS = [
  "Патриоттық / азаматтық / құқықтық", "Рухани-адамгершілік", "Ұлттық", "Отбасы", "Еңбек / экономикалық / экологиялық",
  "Көпмәдениетті / көркем-эстетикалық", "Зияткерлік", "Дене тәрбиесі / СӨС",
];

export const ACHIEVEMENT_TYPE = ["Байқау / конкурс", "Сертификат / курс", "Алғыс хат", "Спорт", "Еріктілік / қоғамдық жұмыс", "Нақты клиент жобасы"];
export const ACHIEVEMENT_LEVEL = ["Колледж", "Қала", "Облыс", "Республика", "Халықаралық"];
export const ACHIEVEMENT_RESULT = ["Қатысушы", "3-орын", "2-орын", "1-орын / Гран-при", "Аяқтады"];

export const BOOK_STATUS = ["Жоспарда", "Оқып жатыр", "Оқып бітірді", "Тастап кетті"];
export const BOOK_LANGUAGE = ["Қазақша", "Орысша", "Ағылшынша", "Басқа"];
export const BOOK_GENRE = ["Көркем әдебиет", "Классика", "Ғылыми-көпшілік", "Өзін-өзі дамыту", "Тарих", "Биография", "Психология", "Бизнес", "Фантастика"];
export const RATING = ["1", "2", "3", "4", "5"];

export const TEST_NAME = [
  "Климов ДДО (кәсіп типі)", "Holland RIASEC (кәсіби қызығушылық)", "Big Five / IPIP (тұлға)", "Gallup CliftonStrengths", "MBTI",
  "Gardner (интеллект түрлері)", "Эмоционалдық жағдай (психолог)",
];
export const TEST_BY = ["Куратор", "Психолог", "Кәсіби бағдар беруші"];
export const PSYCH_ONLY = "Тек психолог";
export const TEST_PRIVACY = ["Куратор көреді", PSYCH_ONLY];

// --- Field definitions: one list drives the forms, the read views and validation ---

export type FieldType = "text" | "textarea" | "date" | "number" | "select" | "multi" | "checkbox" | "student" | "students" | "url" | "tel";
export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  hint?: string;
  max?: number; // multi: max items; number: max value
  min?: number;
  wide?: boolean; // spans the full form width
  /** Hide the field (and drop its value) unless this returns true. */
  showIf?: (v: Record<string, unknown>) => boolean;
};
export type FieldSection = { title: string; note?: string; fields: FieldDef[] };

export const PROFILE_SECTIONS: FieldSection[] = [
  {
    title: "Негізгі мәлімет",
    fields: [
      { name: "birthDate", label: "Туған күні", type: "date" },
      { name: "gender", label: "Жынысы", type: "select", options: GENDER },
      { name: "phone", label: "Телефон", type: "tel" },
      { name: "city", label: "Қала / аудан", type: "text" },
      { name: "address", label: "Мекенжай", type: "text", wide: true },
      { name: "siblings", label: "Туған бауырлары", type: "text", wide: true },
    ],
  },
  {
    title: "Мінезі мен қызығушылығы",
    fields: [
      { name: "activity", label: "Белсенділігі", type: "select", options: ACTIVITY, hint: "«Тұйық» болса — «Назар керек» тізіміне түседі" },
      { name: "club", label: "Үйірме / клуб", type: "text" },
      { name: "hobbies", label: "Хоббиі", type: "multi", options: HOBBIES, wide: true },
      { name: "strongSubjects", label: "Мықты пәндері", type: "text" },
      { name: "weakSubjects", label: "Қиын пәндері", type: "text" },
      { name: "goal", label: "Мақсаты", type: "textarea", wide: true },
      { name: "psychNote", label: "Психологиялық сипаттама (қысқа түйін)", type: "textarea", wide: true },
    ],
  },
  {
    title: "Тұлғалық тесттер",
    fields: [
      { name: "mbti", label: "MBTI", type: "select", options: MBTI },
      { name: "gallup", label: "Gallup Top-5", type: "multi", options: GALLUP, max: 5, wide: true },
      { name: "gardner", label: "Gardner интеллекті", type: "multi", options: GARDNER, wide: true },
    ],
  },
  {
    title: "Мамандық және болашақ",
    fields: [
      { name: "designDirection", label: "Дизайн бағыты", type: "select", options: DESIGN_DIRECTION },
      { name: "futurePlan", label: "Болашақ жоспары", type: "select", options: FUTURE_PLAN },
      { name: "targetUniversity", label: "Мақсатты университет", type: "text" },
      { name: "targetSpecialty", label: "Мақсатты мамандық", type: "text" },
      { name: "studyCountries", label: "Оқу елі", type: "multi", options: STUDY_COUNTRY, wide: true },
      { name: "admissionStatus", label: "Түсу статусы", type: "select", options: ADMISSION_STATUS },
      { name: "ieltsScore", label: "IELTS балл", type: "number", min: 0, max: 9 },
      { name: "ieltsDate", label: "IELTS күні", type: "date" },
      { name: "portfolioUrl", label: "Портфолио", type: "url" },
      { name: "practicePlace", label: "Практика орны", type: "text" },
      { name: "alumniNow", label: "Түлек: қазір қайда", type: "text", hint: "Бітіргеннен 6 ай кейін толтырылады" },
    ],
  },
  {
    title: "Отбасы және келісім",
    note: "Құпия: тек куратор көреді. Денсаулық, диагноз және тест нәтижелерінің толық мәтіні мұнда жазылмайды.",
    fields: [
      { name: "socialStatus", label: "Әлеуметтік жағдайы", type: "select", options: SOCIAL_STATUS },
      { name: "parentConsent", label: "Ата-ананың жазбаша келісімі алынды (сурет, дербес деректер)", type: "checkbox", wide: true },
      { name: "homeVisited", label: "Үйіне барылды", type: "checkbox" },
      { name: "homeVisitDate", label: "Барған күні", type: "date", showIf: (v) => !!v.homeVisited },
      { name: "note", label: "Ескертпе", type: "textarea", wide: true },
    ],
  },
];
export const PROFILE_FIELDS = PROFILE_SECTIONS.flatMap((s) => s.fields);

export const GUARDIAN_FIELDS: FieldDef[] = [
  { name: "name", label: "Аты-жөні", type: "text", required: true },
  { name: "relation", label: "Кім", type: "select", options: RELATION },
  { name: "phone", label: "Телефон", type: "tel" },
  { name: "phone2", label: "Қосымша телефон", type: "tel" },
  { name: "email", label: "Email", type: "text" },
  { name: "workplace", label: "Жұмыс орны", type: "text" },
  { name: "position", label: "Лауазымы", type: "text" },
  { name: "familyStatus", label: "Отбасы жағдайы", type: "select", options: FAMILY_STATUS },
  { name: "responsiveness", label: "Байланысқа шығуы", type: "select", options: RESPONSIVENESS },
  { name: "note", label: "Ескертпе", type: "textarea", wide: true },
];

export const CONTACT_FIELDS: FieldDef[] = [
  { name: "studentId", label: "Студент", type: "student", required: true },
  { name: "date", label: "Күні", type: "date", required: true },
  { name: "withWhom", label: "Кіммен", type: "select", options: WITH_WHOM, required: true },
  { name: "summary", label: "Қысқаша (не туралы)", type: "text", required: true, wide: true },
  { name: "topics", label: "Тақырып", type: "multi", options: TOPICS, wide: true },
  { name: "mood", label: "Көңіл-күйі", type: "select", options: MOOD, showIf: (v) => v.withWhom !== "Ата-ана" },
  { name: "durationMin", label: "Ұзақтығы (мин)", type: "number", min: 0, max: 600 },
  {
    name: "discussed", label: "Не талқыланды", type: "textarea", wide: true,
    hint: "Ата-анамен: ✅ жетістігі → ✏️ жөндеу керегі → 🤝 ата-анадан қандай қолдау керек",
  },
  { name: "agreedStep", label: "Келісілген қадам", type: "text", wide: true },
  { name: "followUpDate", label: "Келесі тексеру күні", type: "date" },
  { name: "agreementDone", label: "Келісім орындалды", type: "checkbox" },
  { name: "notifyParent", label: "Ата-анаға хабарлау керек", type: "checkbox" },
];

export const TASK_FIELDS: FieldDef[] = [
  { name: "title", label: "Міндет", type: "text", required: true, wide: true },
  { name: "frequency", label: "Жиілігі", type: "select", options: FREQUENCY, required: true },
  { name: "course", label: "Курс", type: "select", options: COURSE, hint: "Бос болса — барлық курсқа ортақ" },
  { name: "logIn", label: "Қайда жазылады", type: "select", options: LOG_IN },
  { name: "source", label: "Дереккөз", type: "text" },
  { name: "nextDue", label: "Келесі мерзім", type: "date" },
  { name: "done", label: "Осы кезеңде орындалды", type: "checkbox" },
];

export const EVENT_FIELDS: FieldDef[] = [
  { name: "title", label: "Атауы", type: "text", required: true, wide: true },
  { name: "type", label: "Түрі", type: "select", options: EVENT_TYPE },
  { name: "format", label: "Формат", type: "select", options: EVENT_FORMAT },
  { name: "date", label: "Күні", type: "date" },
  { name: "place", label: "Орны", type: "text" },
  { name: "status", label: "Статус", type: "select", options: EVENT_STATUS, required: true },
  { name: "budget", label: "Бюджет (₸)", type: "number", min: 0 },
  { name: "directions", label: "Тәрбие бағыттары", type: "multi", options: DIRECTIONS, wide: true },
  { name: "responsibleIds", label: "Жауапты студенттер", type: "students", wide: true },
  { name: "goal", label: "Мақсаты", type: "textarea", wide: true },
  { name: "considerations", label: "Ескерілетін мәселелер", type: "textarea", wide: true },
  { name: "expectedResult", label: "Күтілетін нәтиже", type: "textarea", wide: true },
  { name: "analysis", label: "Талдау: не шықты, не шықпады", type: "textarea", wide: true, showIf: (v) => v.status === "Өтті" || v.status === "Талдау жасалды" },
  { name: "feedback", label: "Студенттер кері байланысы", type: "textarea", wide: true, showIf: (v) => v.status === "Өтті" || v.status === "Талдау жасалды" },
  { name: "parentPermission", label: "Ата-ана рұқсаты керек", type: "checkbox" },
  { name: "parentsAttend", label: "Ата-аналар қатысады", type: "checkbox" },
];

export const ACHIEVEMENT_FIELDS: FieldDef[] = [
  { name: "studentId", label: "Студент", type: "student", required: true },
  { name: "title", label: "Жетістік", type: "text", required: true, wide: true },
  { name: "type", label: "Түрі", type: "select", options: ACHIEVEMENT_TYPE },
  { name: "level", label: "Деңгейі", type: "select", options: ACHIEVEMENT_LEVEL },
  { name: "result", label: "Нәтиже", type: "select", options: ACHIEVEMENT_RESULT },
  { name: "date", label: "Күні", type: "date" },
  { name: "parentNotified", label: "Ата-анаға хабарланды", type: "checkbox" },
];

export const BOOK_FIELDS: FieldDef[] = [
  { name: "studentId", label: "Студент", type: "student", required: true },
  { name: "title", label: "Кітап атауы", type: "text", required: true },
  { name: "author", label: "Автор", type: "text" },
  { name: "status", label: "Статус", type: "select", options: BOOK_STATUS, required: true },
  { name: "language", label: "Тілі", type: "select", options: BOOK_LANGUAGE },
  { name: "genres", label: "Жанр", type: "multi", options: BOOK_GENRE, wide: true },
  { name: "pages", label: "Бет саны", type: "number", min: 1, max: 5000 },
  { name: "rating", label: "Бағасы (1–5)", type: "select", options: RATING },
  { name: "startedAt", label: "Басталған күні", type: "date" },
  { name: "finishedAt", label: "Аяқталған күні", type: "date" },
  { name: "review", label: "Пікірі / қорытындысы", type: "textarea", wide: true },
];

export const TEST_FIELDS: FieldDef[] = [
  { name: "studentId", label: "Студент", type: "student", required: true },
  { name: "test", label: "Тест", type: "select", options: TEST_NAME, required: true },
  { name: "date", label: "Күні", type: "date" },
  { name: "conductedBy", label: "Кім өткізді", type: "select", options: TEST_BY },
  { name: "privacy", label: "Құпиялық", type: "select", options: TEST_PRIVACY, required: true },
  {
    name: "result", label: "Нәтиже (қысқа)", type: "text", wide: true, hint: "Мысалы: Климов — Адам–Көркем бейне; Holland — AES",
    showIf: (v) => v.privacy !== PSYCH_ONLY,
  },
  { name: "discussed", label: "Студентпен талқыланды", type: "checkbox" },
  { name: "agreedStep", label: "Келісілген қадам", type: "text", wide: true },
];

export const REFLECTION_FIELDS: FieldDef[] = [
  { name: "pride", label: "Осы семестрде немен мақтанамын", type: "textarea", required: true, wide: true },
  { name: "difficulty", label: "Маған не қиын болды", type: "textarea", wide: true },
  { name: "helpNeeded", label: "Мұғалімнен қандай көмек керек", type: "textarea", wide: true },
  { name: "nextGoal", label: "Келесі семестрдегі мақсатым", type: "textarea", wide: true },
  { name: "diligence", label: "Еңбекқорлығым (1–5)", type: "select", options: RATING, required: true },
  { name: "responsibility", label: "Жауапкершілігім (1–5)", type: "select", options: RATING, required: true },
  { name: "selfDevelopment", label: "Өзімді дамытуым (1–5)", type: "select", options: RATING, required: true },
  { name: "designInterest", label: "Қазір қызықтыратын дизайн бағыты", type: "select", options: [...DESIGN_DIRECTION.slice(0, -1), "Әлі білмеймін"] },
];

export type RecordKind = "profile" | "guardian" | "contact" | "task" | "event" | "achievement" | "book" | "test";

const STUDENT_FIELD: FieldDef = { name: "studentId", label: "Студент", type: "student", required: true };

export const KIND_FIELDS: Record<RecordKind, FieldDef[]> = {
  profile: [STUDENT_FIELD, ...PROFILE_FIELDS],
  guardian: [STUDENT_FIELD, ...GUARDIAN_FIELDS],
  contact: CONTACT_FIELDS,
  task: TASK_FIELDS,
  event: EVENT_FIELDS,
  achievement: ACHIEVEMENT_FIELDS,
  book: BOOK_FIELDS,
  test: TEST_FIELDS,
};

/** Kinds that belong to one student (the rest belong to the group). */
export const STUDENT_KINDS: RecordKind[] = ["profile", "guardian", "contact", "achievement", "book", "test"];

/** Fields whose value is a YYYY-MM-DD string in the workspace and a @db.Date column in the database. */
export const dateFields = (fields: FieldDef[]) => fields.filter((f) => f.type === "date").map((f) => f.name);

// --- Validation -------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const blank = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function fieldSchema(f: FieldDef): z.ZodType<unknown> {
  const msg = `«${f.label}» өрісі толтырылмаған`;
  const optional = <T extends z.ZodType>(s: T) =>
    z.preprocess((v) => (blank(v) ? null : v), f.required ? s.nullable().refine((x) => x !== null, msg) : s.nullable());
  switch (f.type) {
    case "checkbox":
      return z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());
    case "multi":
    case "students": {
      let arr = z.array(f.options ? z.enum(f.options as [string, ...string[]]) : z.string().min(1));
      if (f.max) arr = arr.max(f.max, `«${f.label}»: ең көбі ${f.max}`);
      return z.preprocess((v) => (Array.isArray(v) ? v : []), arr);
    }
    case "number": {
      let n = z.coerce.number({ message: `«${f.label}» сан болуы керек` });
      if (f.min !== undefined) n = n.min(f.min, `«${f.label}» кемінде ${f.min}`);
      if (f.max !== undefined) n = n.max(f.max, `«${f.label}» ең көбі ${f.max}`);
      return optional(n);
    }
    case "date":
      return optional(z.string().regex(ISO_DATE, `«${f.label}»: күн форматы қате`));
    case "select":
      return optional(z.enum(f.options as [string, ...string[]], { message: `«${f.label}»: тізімнен таңдаңыз` }));
    case "url":
      return optional(z.string().trim().max(500).url(`«${f.label}»: сілтеме қате`));
    case "textarea":
      return optional(z.string().trim().max(5000));
    default:
      return optional(z.string().trim().max(500));
  }
}

/**
 * Validates and normalises a record for the given kind: blanks become null,
 * checkboxes booleans, hidden fields are dropped (set to null / empty).
 */
export function parseRecord(kind: RecordKind, data: Record<string, unknown>): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  return parseFields(KIND_FIELDS[kind], data);
}

export function parseFields(fields: FieldDef[], data: Record<string, unknown>): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const value: Record<string, unknown> = {};
  for (const f of fields) {
    const visible = !f.showIf || f.showIf(data);
    const raw = visible ? data[f.name] : undefined;
    const r = fieldSchema(visible ? f : { ...f, required: false }).safeParse(raw);
    if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? `«${f.label}» қате` };
    value[f.name] = r.data;
  }
  return { ok: true, value };
}

// --- Workspace shape (plain data, dates as YYYY-MM-DD strings) ---------------

type Values = Record<string, unknown>;
export type Profile = Values;
export type CuratorRecord = Values & { id: string };

export type CourseStat = { title: string; avg: number | null; attendance: number | null; absences: number };
export type CuratorStudent = {
  id: string;
  name: string;
  email: string | null;
  iin: string | null;
  profile: Profile;
  avg: number | null;
  attendance: number | null;
  absences: number;
  courses: CourseStat[];
};
export type Reflection = Values & { id: string; studentId: string; semester: string; createdAt: string };

export type Workspace = {
  group: { id: string; name: string; course: number | null };
  groups: { id: string; name: string }[];
  students: CuratorStudent[];
  guardians: CuratorRecord[];
  contacts: CuratorRecord[];
  tasks: CuratorRecord[];
  events: CuratorRecord[];
  achievements: CuratorRecord[];
  books: CuratorRecord[];
  tests: CuratorRecord[];
  reflections: Reflection[];
};

export type Result = { ok?: boolean; error?: string } | undefined | void;
export type CuratorApi = {
  save: (kind: RecordKind, groupId: string, data: Record<string, unknown>) => Promise<Result>;
  remove: (kind: RecordKind, groupId: string, id: string) => Promise<Result>;
  loadTemplate: (groupId: string) => Promise<Result>;
};

// --- Rules -----------------------------------------------------------------

export const ATTENTION_DAYS = 60;

/** "2F-1" → 2, "1P-2" → 1. */
export function groupCourse(name: string) {
  const m = /^(\d)/.exec(name.trim());
  return m ? Number(m[1]) : null;
}

export const isoToday = () => isoOf(new Date());
export function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const fromIso = (s: string) => new Date(`${s}T00:00:00`);
export const daysBetween = (a: string, b: string) => Math.round((+fromIso(b) - +fromIso(a)) / 86400000);

export function addDays(iso: string, n: number) {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
function addMonths(iso: string, n: number) {
  const d = fromIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return isoOf(d);
}

/** Monday–Sunday of the week containing `iso`. */
export function weekOf(iso: string) {
  const d = fromIso(iso);
  const start = addDays(iso, -((d.getDay() + 6) % 7));
  return { start, end: addDays(start, 6) };
}

/** Next due date after a task is done for the current period; null for one-off tasks. */
export function nextDueAfter(frequency: string, from: string) {
  switch (frequency) {
    case "Апта сайын": return addDays(from, 7);
    case "Ай сайын": return addMonths(from, 1);
    case "Тоқсан сайын": return addMonths(from, 3);
    case "Семестр сайын": return addMonths(from, 6);
    case "Жыл сайын": return addMonths(from, 12);
    default: return null;
  }
}

/** Tasks that apply to this group: shared ones plus the ones for its course. */
export function tasksForCourse<T extends Values>(tasks: T[], course: number | null) {
  return tasks.filter((t) => !t.course || t.course === `${course} курс`);
}

export function isDue(t: Values, today: string) {
  if (t.done) return false;
  const { end } = weekOf(today);
  return typeof t.nextDue === "string" ? t.nextDue <= end : t.frequency === "Апта сайын";
}

const meetsStudent = (c: Values) => c.withWhom === "Студент" || c.withWhom === "Студент + ата-ана";

export function lastMeeting(ws: Pick<Workspace, "contacts">, studentId: string) {
  return ws.contacts
    .filter((c) => c.studentId === studentId && meetsStudent(c))
    .map((c) => c.date as string)
    .sort()
    .at(-1) ?? null;
}

export type Flag = { label: string; tone: "danger" | "warning" | "info" };

/** Why a student needs the curator's attention (empty when all is well). */
export function attentionFlags(ws: Pick<Workspace, "contacts">, s: CuratorStudent, today = isoToday()): Flag[] {
  const flags: Flag[] = [];
  const last = lastMeeting(ws, s.id);
  if (!last) flags.push({ label: "Жеке кездесу болмаған", tone: "warning" });
  else if (daysBetween(last, today) > ATTENTION_DAYS) flags.push({ label: `${daysBetween(last, today)} күн сөйлеспеген`, tone: "warning" });
  if (s.profile.activity === QUIET) flags.push({ label: "Тұйық", tone: "danger" });
  if (s.attendance !== null && s.attendance < 80) flags.push({ label: `Қатысу ${Math.round(s.attendance)}%`, tone: "danger" });
  if (s.avg !== null && s.avg < 60) flags.push({ label: `Орташа балл ${Math.round(s.avg)}`, tone: "danger" });
  return flags;
}

/** Students whose birthday falls within the next `days` days, nearest first. */
export function upcomingBirthdays(students: CuratorStudent[], today = isoToday(), days = 30) {
  const year = Number(today.slice(0, 4));
  return students
    .flatMap((s) => {
      const b = s.profile.birthDate;
      if (typeof b !== "string") return [];
      let next = `${year}${b.slice(4)}`;
      if (next < today) next = `${year + 1}${b.slice(4)}`;
      const inDays = daysBetween(today, next);
      return inDays <= days ? [{ student: s, date: next, inDays, age: Number(next.slice(0, 4)) - Number(b.slice(0, 4)) }] : [];
    })
    .sort((a, b) => a.inDays - b.inDays);
}

export function semesterLabel(course: number | null, d = new Date()) {
  const m = d.getMonth() + 1;
  const season = m >= 8 || m === 1 ? "күз" : "көктем";
  return course ? `${course} курс — ${season}` : `${d.getFullYear()} — ${season}`;
}

export const avgOf = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// --- Annual plan: one value per month (college may replace with its own list) ---

export const MONTHLY_VALUES = [
  { month: 9, name: "Қыркүйек", group: "Құрмет", value: "Құрмет, әдептілік", days: "1 қыркүйек — Білім күні; Тілдер мерекесі", event: "Топ ережелерін бірге құрастыру; 1 курстармен танысу кеші" },
  { month: 10, name: "Қазан", group: "Жауапкершілік", value: "Жауапкершілік", days: "Мұғалімдер күні (қазанның 1-жексенбісі); 25 қазан — Республика күні", event: "Студенттер ұйымдастыратын Мұғалімдер күні (жауаптылар бөлінеді)" },
  { month: 11, name: "Қараша", group: "Адалдық", value: "Адалдық, академиялық адалдық", days: "—", event: "Тәрбие сағаты: дизайндағы плагиат және авторлық құқық (дебат)" },
  { month: 12, name: "Желтоқсан", group: "Отансүйгіштік", value: "Отансүйгіштік", days: "16 желтоқсан — Тәуелсіздік күні", event: "Тәуелсіздік күніне плакат/инфографика конкурсы" },
  { month: 1, name: "Қаңтар", group: "Кемелдену", value: "Еңбекқорлық, табандылық", days: "—", event: "30 күндік дизайн-челлендж (күніне 1 шағын жұмыс)" },
  { month: 2, name: "Ақпан", group: "Ынтымақтастық", value: "Ынтымақтастық", days: "—", event: "Курстар арасы топтық дизайн жобасы (3 курс 1 курсқа тәлімгер)" },
  { month: 3, name: "Наурыз", group: "Отансүйгіштік", value: "Ұлттық құндылықтар, алғыс", days: "1 наурыз — Алғыс айту күні; 8 наурыз; 21–23 наурыз — Наурыз", event: "Наурыз дастарханы ата-аналармен; алғыс хаттар" },
  { month: 4, name: "Сәуір", group: "Құрмет", value: "Эмпатия, жомарттық", days: "—", event: "Қайырымдылық жәрмеңкесі немесе ерікті дизайн (жергілікті ұйымға тегін логотип)" },
  { month: 5, name: "Мамыр", group: "Отансүйгіштік", value: "Бірлік, тарихты құрметтеу", days: "1 мамыр — Бірлік күні; 7 мамыр — Отан қорғаушылар күні; 9 мамыр — Жеңіс күні", event: "Спартакиада; тарихи жерге саяхат" },
  { month: 6, name: "Маусым", group: "Кемелдену", value: "Кемелдену (жыл қорытындысы)", days: "Диплом қорғау, бітіру кеші", event: "Портфолио көрмесі (жыл жұмыстары)" },
];

export function monthValue(d = new Date()) {
  const m = d.getMonth() + 1;
  return MONTHLY_VALUES.find((v) => v.month === m) ?? MONTHLY_VALUES[0];
}

// --- Curator cycle template (based on the curator's guide, adapted to the college) ---

/** [task, frequency, course or null (all courses), where it is recorded, source pages] */
export const TASK_TEMPLATE: [string, string, string | null, string, string][] = [
  ["«Назар керек» тізімін қарау, 3–4 студентпен жеке кездесу", "Апта сайын", null, "Байланыс журналы", "38 б. (аптасына 3–4 = топ 2 айда толық қамтылады)"],
  ["Тәрбие / сынып сағатын өткізу", "Апта сайын", null, "Іс-шаралар", "33, 43 б."],
  ["Сабаққа келмеген / кешіккендерді анықтау, себебін білу", "Апта сайын", null, "Байланыс журналы", "33 б."],
  ["Ата-аналар чатына апталық хабар (белгіленген бір күні)", "Апта сайын", null, "Байланыс журналы", "66–67 б."],
  ["Айдың құндылығын таныстыру, келесі айды жоспарлау", "Ай сайын", null, "Іс-шаралар", "40 б."],
  ["Кемінде 2 тәрбие іс-шарасы (сынып сағатынан бөлек)", "Ай сайын", null, "Іс-шаралар", "33 б."],
  ["Топ белсенділерімен жиналыс, жауапкершіліктерді бөлу", "Ай сайын", null, "Іс-шаралар", "33 б."],
  ["Топтың басқа пән сабақтарына қатысу, пән мұғалімдерімен сөйлесу", "Ай сайын", null, "Студенттер профилі", "33, 40 б."],
  ["Психологпен кеңесу (жалпы ақпарат, құпиялық сақталады)", "Ай сайын", null, "Тесттер", "33, 72 б."],
  ["Ата-аналар жиналысы (шаблон бойынша)", "Тоқсан сайын", null, "Байланыс журналы", "33, 66, 69 б."],
  ["Тоқсандық талдау (үлгерім, қатысу, тәрбие жоспары) + келесі тоқсан жоспары", "Тоқсан сайын", null, "Колледж құжаты", "33, 40–41 б."],
  ["Оқу бөліміне тоқсандық үлгерім есебі; кураторлар әдістемелік бірлестігіне қатысу", "Тоқсан сайын", null, "Колледж құжаты", "33 б."],
  ["Студент рефлексиясы формасын тарату және жауаптарды қарау", "Семестр сайын", null, "Студенттер профилі", "29 б."],
  ["Кісілік қасиеттер баллын дәлелмен жаңарту; тест кестесін тексеру", "Семестр сайын", null, "Студенттер профилі", "41 б."],
  ["Ата-ана келісімдерін жинау (сурет, деректер)", "Жыл сайын", null, "Студенттер профилі", "19 б."],
  ["Жеке профильдерді жаңарту, жаңа курстың жоспарын қосу", "Жыл сайын", null, "Студенттер профилі", "33, 61, 68 б."],
  ["Жаңа келген / қиындықтағы студенттің үйіне бару (келісіммен, жалғыз емес)", "Жыл сайын", null, "Байланыс журналы", "69–71 б."],
  ["Жылдық тәрбие жұмысының талдауы және статистикалық есеп", "Жыл сайын", null, "Колледж құжаты", "33 б."],
  ["Әр студентпен танысу кездесуі (7 сұрақ)", "Бір рет (осы курста)", "1 курс", "Байланыс журналы", "38–39 б."],
  ["Топ ережелерін студенттермен бірге құрастыру", "Бір рет (осы курста)", "1 курс", "Іс-шаралар", "38 б."],
  ["Әр студентті үйірмеге / клубқа бағыттау", "Бір рет (осы курста)", "1 курс", "Студенттер профилі", "68 б."],
  ["Климов ДДО тесті (кәсіп типі)", "Бір рет (осы курста)", "1 курс", "Тесттер", "61 б."],
  ["Психологпен бейімделу кезеңіндегі эмоционалдық скрининг", "Бір рет (осы курста)", "1 курс", "Тесттер", "72 б."],
  ["Портфолионы бастау (әр студентте алғашқы 2–3 жұмыс)", "Бір рет (осы курста)", "1 курс", "Студенттер профилі", "61 б."],
  ["Бейімделуді бақылау: достары бар ма, сабаққа қатысуы, өзін қалай сезінеді", "Ай сайын", "1 курс", "Студенттер профилі", "68 б."],
  ["Кітап оқу: Reading time / Book talks", "Ай сайын", "1 курс", "Іс-шаралар", "42–43 б."],
  ["Қиын пәндерге көмек ұйымдастыру (жоғары курс тәлімгерлері арқылы)", "Тоқсан сайын", "1 курс", "Студенттер профилі", "68 б."],
  ["Holland RIASEC тесті + нәтижесін әр студентпен талқылау", "Бір рет (осы курста)", "2 курс", "Тесттер", "62 б."],
  ["Дизайн бағытын таңдау (полиграфия / UI / моушн / брендинг)", "Бір рет (осы курста)", "2 курс", "Студенттер профилі", "62 б."],
  ["Big Five (IPIP) тесті — өзін тану, командада жұмыс", "Бір рет (осы курста)", "2 курс", "Тесттер", "62 б."],
  ["Студент өз жеке даму жоспарын құрады", "Бір рет (осы курста)", "2 курс", "Студенттер профилі", "55 б."],
  ["Ата-аналарға мамандықтың болашағы туралы семинар", "Бір рет (осы курста)", "2 курс", "Байланыс журналы", "62 б."],
  ["Кәсіп иесімен кездесу (студия, баспахана, агенттік)", "Семестр сайын", "2 курс", "Іс-шаралар", "61 б."],
  ["Өндірістік экскурсия", "Жыл сайын", "2 курс", "Іс-шаралар", "61 б."],
  ["Өндірістік практика орны мен жетекшісін бекіту", "Бір рет (осы курста)", "3 курс", "Студенттер профилі", "колледж"],
  ["Дипломдық жоба тақырыбын бекіту", "Бір рет (осы курста)", "3 курс", "Студенттер профилі", "колледж"],
  ["Түйіндеме + портфолио (10–12 үздік жұмыс)", "Бір рет (осы курста)", "3 курс", "Студенттер профилі", "62 б."],
  ["Әр студентпен ЖОО немесе жұмыс жоспарын нақтылау", "Бір рет (осы курста)", "3 курс", "Байланыс журналы", "59, 62 б."],
  ["1 курстарға шеберлік сабағын өткізу (көшбасшылық)", "Бір рет (осы курста)", "3 курс", "Іс-шаралар", "59 б."],
  ["ЖОО-ға түсетіндердің ҰБТ / IELTS / құжат мерзімдерін бақылау", "Ай сайын", "3 курс", "Студенттер профилі", "68 б."],
  ["Түлектер қайда: «Түлек: қазір қайда» өрісін толтыру (бітіргеннен 6 ай кейін)", "Бір рет (осы курста)", "3 курс", "Студенттер профилі", "қосымша"],
];

/** Template tasks as records, with first due dates spread from `today`. */
export function templateTasks(today = isoToday()) {
  const { end } = weekOf(today);
  const firstDue: Record<string, string | null> = {
    "Апта сайын": end, "Ай сайын": addMonths(today, 1).slice(0, 8) + "01", "Тоқсан сайын": addMonths(today, 2),
    "Семестр сайын": addMonths(today, 3), "Жыл сайын": addMonths(today, 6), "Бір рет (осы курста)": null,
  };
  return TASK_TEMPLATE.map(([title, frequency, course, logIn, source], i) => ({
    title, frequency, course, logIn, source, done: false, nextDue: firstDue[frequency] ?? null, order: i,
  }));
}

// --- Guides (templates from the curator workspace) -------------------------

export type Guide = { id: string; icon: string; title: string; intro: string; sections: { heading: string; items: string[]; ordered?: boolean; checklist?: boolean }[] };

export const GUIDES: Guide[] = [
  {
    id: "weekly", icon: "⏱", title: "Апталық тәртіп (жұма, 15 минут)",
    intro: "Күнделікті жұмысқа 3 құрал жеткілікті: Куратор циклы («не істеуім керек?»), Студенттер («бұл студент кім?») және Байланыс журналы («кіммен не келістім?»).",
    sections: [
      { heading: "Әр жұма", ordered: true, items: [
        "Куратор циклын ашып, мерзімі келген міндеттерді көріңіз.",
        "«Назар керек» тізімінен келесі аптада сөйлесетін 3–4 студентті таңдаңыз.",
        "Байланыс журналындағы орындалмаған келісімдерді тексеріп, орындалғандарына белгі қойыңыз.",
        "Орындалған міндеттерді «Келесі мерзім» батырмасымен келесі кезеңге жылжытыңыз.",
      ] },
      { heading: "«Назар керек» деген не?", items: [
        "Соңғы жеке сөйлесуден бері 60 күннен асса немесе мүлде сөйлеспесе.",
        "Белсенділігі «Тұйық» деп белгіленсе — үнсіз студенттерге белсенділерден көбірек назар керек.",
        "Порталдың өз деректері бойынша: қатысу 80%-дан төмен немесе орташа балл 60-тан төмен.",
        "Студентпен сөйлесіп, журналға жазсаңыз — тізімнен өзі шығады.",
      ] },
      { heading: "Бұл жерге жазылмайды 🔒", items: [
        "Денсаулық, диагноздар.",
        "Психологиялық тест нәтижелерінің толық мәтіні («Тек психолог» тесттерінде тек өткізілгені белгіленеді).",
        "Куратор кеңістігі студенттерге де, ата-аналарға да көрінбейді.",
      ] },
    ],
  },
  {
    id: "one-on-one", icon: "🗣", title: "Студентпен жеке кездесу",
    intro: "Жеке сөйлесу — студентке «сен мен үшін маңыздысың» деген белгі. Кездесу алдында түпкі мақсатты анықтаңыз — сұрақтар соған қарай қойылады.",
    sections: [
      { heading: "Танысу кездесуінің 7 сұрағы (1 курс немесе жаңа студент)", ordered: true, items: [
        "Балалық шағың, қай мектептен келдің?", "Бос уақытта немен айналысасың?", "Қай пәндер ұнайды?", "Қай пәндер қиын?",
        "Үйде кімдермен тұрасың, қолдау бар ма? (абайлап, мәжбүрлемей)", "Топта кіммен доссың?", "Колледжден кейін өзіңді қайда көресің?",
      ] },
      { heading: "Ережелер", items: [
        "Қателік туралы — тек жеке, басқалардың алдында емес.",
        "Студенттің сырын басқа студентке ешқашан айтпау.",
        "Үнсіз студенттерге көбірек назар — белсенділерге қарағанда.",
        "Қалжың бен қаталдық тепе-теңдігі.",
        "Жүйелі ауытқу байқалса — психологқа бағыттау, өзіңіз «диагноз» қоймау.",
      ] },
      { heading: "Кейін", items: ["Байланыс журналына жазыңыз (Кіммен: Студент): не талқыланды, келісілген қадам, келесі тексеру күні. «Соңғы кездесу» өздігінен жаңарады."] },
    ],
  },
  {
    id: "rules", icon: "📜", title: "Топ ережелерін бірге құрастыру",
    intro: "Ережені студенттермен бірге жазыңыз — өздері құрған ережені жақсырақ сақтайды. Ереже жазылуы жеткіліксіз, күнделікті қадағалау керек.",
    sections: [
      { heading: "Құрастыру тәртібі (қыркүйек, 1 сынып сағаты)", ordered: true, items: [
        "4 топқа бөлу, әр топқа бір сала беру.", "Әр топ 3–5 ереже ұсынады.", "Барлығы дауыс береді, ең маңызды 3–4 ереже қалады.",
        "Ереже бұзылса не болатынын да бірге келісу.", "Студенттер плакат етіп безендіреді (дизайн тапсырмасы).",
      ] },
      { heading: "Салалар (мысалдар)", items: [
        "Сабақта: сөзді бөлмеу · телефон тек жұмысқа · кешігу туралы алдын ала хабарлау.",
        "Сын айтқанда (дизайн критикасы): адамды емес, жұмысты сынау · алдымен жақсы жағы · ұсыныспен аяқтау.",
        "Спортта: ашу-ызасыз ойнау · қателескенге дауыс көтермеу · жеңгенді құттықтау.",
        "Дастархан басында: үлкеннің бастағанын күту · сөзді бөлмеу · дастарханды жинау.",
      ] },
    ],
  },
  {
    id: "career", icon: "🧭", title: "Кәсіптік бағдар жоспары (1–3 курс)",
    intro: "Колледж студенті мамандығын таңдап қойған, сондықтан сұрақ — «мамандық ішінде қай бағыт және бітіргеннен кейін қайда?».",
    sections: [
      { heading: "1 курс — еңбек тәрбиесі және тану", checklist: true, items: ["Әр студентпен жеке танысу (7 сұрақ), ата-анамен сұхбат", "Климов ДДО тесті", "Үйірме/клубқа бағыттау", "Ағылшын және математикалық сауаттылықты қолдау"] },
      { heading: "2 курс — кәсіптік ақпарат және іріктеу", checklist: true, items: ["Holland RIASEC тесті → дизайн бағытын таңдау", "Кәсіп иелерімен кездесу — жылына кемінде 2", "Өндірістік экскурсия (баспахана, дизайн студиясы)", "Жеке даму жоспарын студент өзі құрады", "Ата-аналарға мамандықтың болашағы туралы семинар", "Big Five (IPIP) — командада жұмыс, өзін тану"] },
      { heading: "3 курс — кәсіптік бейімдеу", checklist: true, items: ["Өндірістік практика орны, жетекшісі, бағасы", "Дипломдық жоба — мүмкін болса нақты клиентпен", "Түйіндеме + Behance/портфолио (10–12 үздік жұмыс)", "ЖОО-ға түсу (ҰБТ, IELTS, қысқартылған бағдарлама) немесе жұмысқа орналасу жоспары", "Сол саладағы ментор іздеу", "Gallup (мүмкін болса)"] },
      { heading: "Бітіргеннен кейін", checklist: true, items: ["«Түлек: қазір қайда» өрісін 6 айдан кейін жаңарту", "Үздік түлектерді 1 курстармен кездесуге шақыру"] },
    ],
  },
  {
    id: "parent-meeting", icon: "👨‍👩‍👧", title: "Ата-аналар жиналысы (тоқсандық)",
    intro: "Жиналыста жеке нәтижелер емес, топтың ортақ көрсеткіштері көрсетіледі. Жеке мәселе — жеке кездесуде. Төмен нәтижені тоқсан соңына дейін күтпеңіз.",
    sections: [
      { heading: "Дайындық (1 апта бұрын)", checklist: true, items: [
        "Күні мен уақытын чатқа жариялау (кем дегенде 7 күн бұрын)", "Ортақ көрсеткіштерді алу (орташа баға, қатысу %)",
        "Өткен іс-шаралардың фотолары (барлық студент көрінетіндей)", "Студенттердің кері байланысынан 2–3 цитата (аноним)",
        "Кабинетті дайындау (порталдан брондау)", "Жиналыстан кейін жеке сөйлесетін ата-аналардың тізімі",
      ] },
      { heading: "Күн тәртібі (40–45 мин)", ordered: true, items: [
        "Сәлемдесу, тоқсанның мақсаты (3 мин)", "Өткен іс-шаралар: мақсаты және нәтижесі (10 мин)", "Топтың ортақ көрсеткіштері (5 мин)",
        "Келесі тоқсан жоспары және ата-анадан күтілетін нақты қолдау (10 мин)", "Қысқа тақырып: психолог немесе сала маманы (5–10 мин)", "Сұрақтар (жеке сұрақтар — жиналыстан кейін)",
      ] },
      { heading: "Кейін", checklist: true, items: ["Хаттаманы колледж құжатына тапсыру", "Келмеген ата-аналарға қысқа қорытынды жіберу", "Әр жеке әңгімені Байланыс журналына жазу (Кіммен: Ата-ана)"] },
    ],
  },
  {
    id: "parent-1on1", icon: "🤝", title: "Ата-анамен жеке кездесу",
    intro: "Реті маңызды: алдымен жетістік, содан кейін жөндеу керек тұстар. Ата-ана — серіктес, клиент, ақылшы және елші.",
    sections: [
      { heading: "Дайындық", checklist: true, items: ["Студент профилін, жетістіктерін, соңғы жеке кездесуді қарау", "Нақты дәлелдер (баға, қатысу, жұмыс үлгілері)", "Кабинет дайын"] },
      { heading: "Әңгіме реті", ordered: true, items: [
        "Жетістіктері — нақты мысалмен", "Студентпен жасалған жұмыс — тест, жоспар, көрсеткіштер", "Жөндеу керек тұстар — сыпайы тілмен, дәлелмен",
        "Студенттен күтілетін нәтиже", "Ата-анадан күтілетін қолдау — нақты", "Ата-ананың сұрағы / талабы — тыңдау", "Келісілген қадам және келесі байланыс күні",
      ] },
      { heading: "Еске салу", items: ["Ата-ана өзін еркін сезінетіндей атмосфера.", "Құзыретіңізге кірмейтін сұраққа — «нақтылап хабарлайын».", "Әдеп пен құрмет шегінен шықпау."] },
    ],
  },
  {
    id: "chat", icon: "💬", title: "Ата-аналар чатының ережелері",
    intro: "Ережені чатқа бекітілген хабарлама етіп қойыңыз. Негізгі міндет — чатқа есеп беру емес, студентпен жұмыс.",
    sections: [
      { heading: "Чатқа қойылатын мәтін", items: ["Құрметті ата-аналар! Бұл чат тек топ өміріне қатысты ақпаратқа арналған. Жаңалықтар аптасына бір рет, [күні] жарияланады. Жеке сұрақтар бойынша маған жеке жазыңыз — жұмыс күндері [сағат]–[сағат] аралығында жауап беремін. Чатта талқылау жүргізілмейді. Рақмет!"] },
      { heading: "Жариялау алдындағы тексеру", checklist: true, items: [
        "Мәтін қатесіз, ықтимал сұрақтарға алдын ала жауап береді", "Тек топ/колледж өміріне қатысты", "Фотода барлық студент бар",
        "Ыңғайсыз сәт түскен фото жоқ", "Фотодағы студенттердің ата-ана келісімі бар", "Фотолар әртүрлі (сабақ, жоба, жетістік)", "Қысқа әрі нұсқа",
      ] },
      { heading: "Бірқалыптылық", items: ["Бір апта үздіксіз фотоесеп, келесі апта үнсіздік — ең жаман сценарий. Аптасына бір рет — белгіленген күні, бірдей көлемде."] },
    ],
  },
  {
    id: "home-visit", icon: "🏠", title: "Студенттің үйіне бару",
    intro: "Мақсат — студенттің отбасылық ортасын түсіну, ата-анамен еркін сөйлесу. Колледж ережесін алдын ала тексеріңіз.",
    sections: [
      { heading: "Барар алдында", checklist: true, items: ["Ата-анамен кемінде 1 апта бұрын келісу", "Жалғыз бармау: психолог, әкімшілік немесе әріптеспен", "Студенттің жетістіктері, пән мұғалімдерінің кері байланысы, қатысу көрсеткіштері", "Студент белсенді болса — алғыс хат", "Құр қол бармау (шағын сыйлық)"] },
      { heading: "Барғанда", items: ["Колледж миссиясын, топтың жылдық жоспарын таныстыру.", "Ата-ананың талабы мен сұранысын тыңдау.", "Студенттің сабаққа дайындалатын ортасын көру.", "Үлкендердің әңгімесінде студент бірге отырмауын ескеру."] },
      { heading: "Кейінгі талдау", ordered: true, items: ["Қызығушылықтары, мінез-құлқы, отбасылық құндылықтары туралы қандай қорытынды?", "Қандай жеке жоспар құруға болады?", "Колледжде қандай әрекеттерді қолға алу керек?", "Ата-ананы колледж өміріне қалай қатыстырамыз?"] },
    ],
  },
  {
    id: "quarter", icon: "📊", title: "Тоқсандық талдау",
    intro: "Әр тоқсан соңында толтырыңыз. Нәтижесі келесі тоқсан жоспарында міндетті түрде ескеріледі. Сандық көрсеткіштердің көбі «Шолу» бетінде дайын тұр.",
    sections: [
      { heading: "1. Сандық көрсеткіштер (өткен тоқсанмен салыстыру)", items: ["Орташа баға", "Қатысу % (себепті / себепсіз)", "Өткен іс-шара саны (жоспар / нақты)", "Жеке кездесу өткен студент саны", "Ата-анамен байланыс саны", "Жетістіктер саны", "«Назар керек» тізіміндегі студент саны"] },
      { heading: "2. Топ ішіндегі жұмыс", items: ["Жекелеген студенттермен жұмыс", "Ата-аналармен жұмыс", "Пән мұғалімдерімен байланыс (түсініспеушілік болды ма?)", "Топ белсенділерінің жұмысы"] },
      { heading: "3. Куратор — студент серіктестігі", items: ["Сенім қалыптасты ма? (студенттер өздері келіп сөйлесе ме?)", "Барлық студентпен байланыс бар ма? Кіммен жоқ?"] },
      { heading: "4. Қауіпсіз орта", items: ["Әр студент өзін топта жайлы сезіне ме? (буллинг белгілері)", "Топ ережелері сақталды ма?"] },
      { heading: "5. Қорытынды", items: ["Не жұмыс істеді", "Не жұмыс істемеді", "Келесі тоқсанда өзгертетін 1–3 нәрсе"] },
    ],
  },
  {
    id: "handover", icon: "🔁", title: "Куратор ауысқанда тапсыру",
    intro: "Жаңа кураторға берілетін пакет. Порталда бұлардың көбі дайын: завуч топқа жаңа кураторды тағайындаса, барлық жазба соған өтеді.",
    sections: [
      { heading: "Тапсырылатындар", checklist: true, items: [
        "Топ белсенділерінің тізімі (Студенттер → Белсенділігі)", "Ерекше назар қажет студенттер («Назар керек»)",
        "Әр студентке мінездеме және жеке жоспарының орындалуы", "Жылдық / тоқсандық жоспар және қай жеріне жеткені (Іс-шаралар)",
        "Академиялық көрсеткіштер (тоқсандық талдаулар)", "Ата-анамен жұмыс тарихы (Байланыс журналы, Кіммен: Ата-ана)", "Ата-ана келісімдерінің түпнұсқасы",
      ] },
      { heading: "Кіру құқығы", checklist: true, items: ["Завуч «Кураторлар» бетінде топқа жаңа кураторды тағайындайды", "«Тек психолог» тесттерін психологпен келісіп беру", "Жаңа куратормен 1 сағаттық тапсыру кездесуі («Назар керек» студенттерден бастау)"] },
    ],
  },
];

/** Average grade, attendance and absences per student (overall and per course). */
export function studentStats(
  studentIds: string[],
  grades: { studentId: string; course: string; value: number }[],
  attendance: { studentId: string; course: string; status: string }[],
) {
  const rate = (xs: { status: string }[]) => (xs.length ? (xs.filter((a) => a.status === "PRESENT" || a.status === "LATE").length / xs.length) * 100 : null);
  return new Map(
    studentIds.map((id) => {
      const g = grades.filter((x) => x.studentId === id);
      const a = attendance.filter((x) => x.studentId === id);
      const titles = [...new Set([...g, ...a].map((x) => x.course))].sort((x, y) => x.localeCompare(y));
      const courses: CourseStat[] = titles.map((title) => {
        const ca = a.filter((x) => x.course === title);
        return { title, avg: avgOf(g.filter((x) => x.course === title).map((x) => x.value)), attendance: rate(ca), absences: ca.filter((x) => x.status === "ABSENT").length };
      });
      return [id, { avg: avgOf(g.map((x) => x.value)), attendance: rate(a), absences: a.filter((x) => x.status === "ABSENT").length, courses }];
    }),
  );
}

/** YYYY-MM-DD → DD.MM.YYYY. Plain string work, so server and browser render the same text. */
export const fmtDate = (iso: unknown) => {
  const s = String(iso ?? "");
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "";
};
