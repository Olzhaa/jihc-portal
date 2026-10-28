/**
 * Силлабус құрылымы колледждің «Оқу жұмыс бағдарламасы» (Word) мен Smart Nation «Оқу бағдарламасы» кестесіне сәйкес:
 * тарау / оқыту нәтижесі (ОН) → тақырып + бағалау өлшемі → сағаттар бөлінісі.
 * Сол тізімнен EduPage-тің «Импортировать из MS Excel» терезесіне қоюға дайын кесте және Word құжаты шығады.
 */
export type SyllabusTopic = {
  chapter: string; // Тарау / ОН, мысалы "ОН 2.1 – АКТ негіздерін меңгеру"
  topic: string;
  criterion: string; // бағалау өлшемі
  theory: number; // теориялық сағат
  practice: number; // З/Т — зертханалық/тәжірибелік
  individual: number; // жеке
  production: number; // өндірістік оқыту және/немесе кәсіптік практика
  sooj: number; // СОӨЖ
  soj: number; // СӨЖ
  lessonType: string; // мысалы "теор., зерт."
};

/** Оқу жұмыс бағдарламасындағы «Оның ішінде» бағандарының реті. */
export const HOUR_FIELDS = [
  { key: "theory", label: "Теория", long: "Теориялық" },
  { key: "practice", label: "З/Т", long: "Зертханалық тәжірибелік" },
  { key: "individual", label: "Жеке", long: "Жеке" },
  { key: "production", label: "Практика", long: "Өндірістік оқыту және/немесе кәсіптік практика" },
  { key: "sooj", label: "СОӨЖ", long: "Студенттің педагогпен өзіндік жұмысы" },
  { key: "soj", label: "СӨЖ", long: "Студенттің өзіндік жұмысы" },
] as const;

export type HourField = (typeof HOUR_FIELDS)[number]["key"];

export const emptyTopic = (chapter = ""): SyllabusTopic => ({ chapter, topic: "", criterion: "", theory: 2, practice: 0, individual: 0, production: 0, sooj: 0, soj: 0, lessonType: "" });

export const topicHours = (t: SyllabusTopic) => HOUR_FIELDS.reduce((s, f) => s + (Number(t[f.key]) || 0), 0);

const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

/** Ескі пішімді ({ week, topic, hours }) де жаңасына айналдырады. */
export function normalizeTopics(raw: unknown): SyllabusTopic[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: Record<string, unknown>) => {
    if ("hours" in r && !("theory" in r)) return { ...emptyTopic(), topic: String(r.topic ?? ""), theory: num(r.hours) };
    return {
      chapter: String(r.chapter ?? "").trim(),
      topic: String(r.topic ?? "").trim(),
      criterion: String(r.criterion ?? "").trim(),
      theory: num(r.theory),
      practice: num(r.practice),
      individual: num(r.individual),
      production: num(r.production),
      sooj: num(r.sooj),
      soj: num(r.soj),
      lessonType: String(r.lessonType ?? "").trim(),
    };
  });
}

/** Тақырыптарды тарау бойынша топтайды, ретін сақтап. */
export function chapters(topics: SyllabusTopic[]) {
  const out: { chapter: string; topics: SyllabusTopic[]; hours: number }[] = [];
  for (const t of topics) {
    const last = out[out.length - 1];
    if (last && last.chapter === t.chapter) last.topics.push(t);
    else out.push({ chapter: t.chapter, topics: [t], hours: 0 });
  }
  for (const c of out) c.hours = c.topics.reduce((s, t) => s + topicHours(t), 0);
  return out;
}

export function totals(topics: SyllabusTopic[]) {
  const sum = Object.fromEntries(HOUR_FIELDS.map((f) => [f.key, topics.reduce((s, t) => s + (Number(t[f.key]) || 0), 0)])) as Record<HourField, number>;
  return { ...sum, all: topics.reduce((s, t) => s + topicHours(t), 0) };
}

const cell = (s: string | number) => String(s).replace(/[\t\r\n]+/g, " ").trim();

/**
 * EduPage «Копировать план из MS Excel» терезесіне қоюға арналған кесте (тақырыпшасыз):
 * тарау | тақырып | сабақ саны | мазмұны | ескертпе. Бір сағат = бір сабақ, EduPage жоспарындағыдай.
 * Қойғаннан кейін EduPage бағандарды сәйкестендіруді сұрайды.
 */
export function toEdupageTsv(topics: SyllabusTopic[]) {
  return topics.map((t) => [t.chapter, t.topic, topicHours(t), t.criterion, t.lessonType].map(cell).join("\t")).join("\n");
}

/** Smart Nation «Оқу бағдарламасының мазмұны» кестесінің бағандары, қолмен енгізуге ыңғайлы. */
export function toSnationRows(topics: SyllabusTopic[]) {
  const header = ["Тараулар/оқыту нәтижелері", "Тақырыптар/бағалау өлшемдері", "Барлық сағат саны", "Теориялық", "З/Т", "Жеке", "СОӨЖ", "СӨЖ", "Сабақ түрі"];
  const rows = topics.map((t) => [t.chapter, t.criterion ? `${t.topic} — ${t.criterion}` : t.topic, topicHours(t), t.theory, t.practice, t.individual, t.sooj, t.soj, t.lessonType]);
  return [header, ...rows];
}

/** СӨЖ тапсырмалары кестесінің бір жолы. */
export type SojTask = { topic: string; task: string; controlForm: string; literature: string; week: string; maxPoints: string };

/** Титул беті мен түсіндірме жазба: Word құжатындағы бағдарламаның қалған бөліктері. */
export type SyllabusDetails = {
  module: string; // Пән/модуль атауы, мысалы «ЖММ 02 - ...»
  specialty: string;
  qualification: string;
  groups: string;
  studyForm: string;
  credits: string;
  courseLabel: string; // «2 курс»
  approver: string; // директордың оқу ісі жөніндегі орынбасары
  authors: string[];
  place: string; // «Тараз 2026 ж»
  description: string;
  competence: string;
  prerequisites: string;
  postrequisites: string;
  tools: string;
  contacts: string;
  sojTasks: SojTask[];
  references: string[];
};

export const DETAIL_FIELDS: { key: Exclude<keyof SyllabusDetails, "authors" | "sojTasks" | "references">; label: string; long?: boolean }[] = [
  { key: "module", label: "Пән/модуль атауы" },
  { key: "specialty", label: "Мамандық (коды және атауы)" },
  { key: "qualification", label: "Біліктілік (коды және атауы)" },
  { key: "groups", label: "Тобы" },
  { key: "studyForm", label: "Оқыту нысаны" },
  { key: "credits", label: "Кредит саны" },
  { key: "courseLabel", label: "Курс" },
  { key: "approver", label: "Бекітетін (оқу ісі жөніндегі орынбасар)" },
  { key: "place", label: "Қала, жыл" },
  { key: "description", label: "Пән/модуль сипаттамасы", long: true },
  { key: "competence", label: "Қалыптастырылатын құзіреттілік", long: true },
  { key: "prerequisites", label: "Пререквизиттер", long: true },
  { key: "postrequisites", label: "Постреквизиттер", long: true },
  { key: "tools", label: "Оқытуға қажетті құралдар, жабдықтар", long: true },
  { key: "contacts", label: "Оқытушының байланыс ақпараты", long: true },
];

export const SOJ_FIELDS: { key: keyof SojTask; label: string }[] = [
  { key: "topic", label: "Бағалау өлшемшарттары және/немесе сабақ тақырыптары" },
  { key: "task", label: "СӨЖ тақырыптары (тапсырма мазмұны)" },
  { key: "controlForm", label: "Бақылау нысаны" },
  { key: "literature", label: "Ұсынылатын әдебиеттер" },
  { key: "week", label: "Тапсыру мерзімі (аптаның №)" },
  { key: "maxPoints", label: "Балл максимум" },
];

export const emptyDetails = (): SyllabusDetails => ({
  module: "", specialty: "", qualification: "", groups: "", studyForm: "", credits: "", courseLabel: "", approver: "", authors: [], place: "",
  description: "", competence: "", prerequisites: "", postrequisites: "", tools: "", contacts: "", sojTasks: [], references: [],
});

const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

export function normalizeDetails(raw: unknown): SyllabusDetails {
  const d = emptyDetails();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  for (const f of DETAIL_FIELDS) d[f.key] = str(r[f.key]);
  d.authors = Array.isArray(r.authors) ? r.authors.map(str).filter(Boolean) : [];
  d.references = Array.isArray(r.references) ? r.references.map(str).filter(Boolean) : [];
  d.sojTasks = Array.isArray(r.sojTasks)
    ? r.sojTasks
        .map((t: Record<string, unknown>) => Object.fromEntries(SOJ_FIELDS.map((f) => [f.key, str(t?.[f.key])])) as SojTask)
        .filter((t) => Object.values(t).some(Boolean))
    : [];
  return d;
}

/** Shared checks before saving (server action and demo store). */
export function cleanSyllabus(input: { title: string; topics: SyllabusTopic[]; details?: unknown }) {
  const topics = normalizeTopics(input.topics).filter((t) => t.topic);
  if (!input.title.trim()) return { error: "Атауын жазыңыз" };
  if (!topics.length) return { error: "Кемінде бір тақырып қосыңыз" };
  return { title: input.title.trim(), topics, totalHours: totals(topics).all, details: normalizeDetails(input.details) };
}
