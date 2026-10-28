/**
 * Силлабус құрылымы Smart Nation «Оқу бағдарламасы» кестесіне сәйкес:
 * тарау / оқыту нәтижесі (ОН) → тақырып + бағалау өлшемі → сағаттар бөлінісі.
 * Сол тізімнен EduPage-тің «Импортировать из MS Excel» терезесіне қоюға дайын кесте шығады.
 */
export type SyllabusTopic = {
  chapter: string; // Тарау / ОН, мысалы "ОН 2.1 – АКТ негіздерін меңгеру"
  topic: string;
  criterion: string; // бағалау өлшемі
  theory: number; // теориялық сағат
  practice: number; // З/Т — зертханалық/тәжірибелік
  individual: number; // жеке
  sooj: number; // СОӨЖ
  soj: number; // СӨЖ
  lessonType: string; // мысалы "теор., зерт."
};

export const HOUR_FIELDS = [
  { key: "theory", label: "Теория" },
  { key: "practice", label: "З/Т" },
  { key: "individual", label: "Жеке" },
  { key: "sooj", label: "СОӨЖ" },
  { key: "soj", label: "СӨЖ" },
] as const;

export type HourField = (typeof HOUR_FIELDS)[number]["key"];

export const emptyTopic = (chapter = ""): SyllabusTopic => ({ chapter, topic: "", criterion: "", theory: 2, practice: 0, individual: 0, sooj: 0, soj: 0, lessonType: "" });

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

/** Shared checks before saving (server action and demo store). */
export function cleanSyllabus(input: { title: string; topics: SyllabusTopic[] }) {
  const topics = normalizeTopics(input.topics).filter((t) => t.topic);
  if (!input.title.trim()) return { error: "Атауын жазыңыз" };
  if (!topics.length) return { error: "Кемінде бір тақырып қосыңыз" };
  return { title: input.title.trim(), topics, totalHours: totals(topics).all };
}
