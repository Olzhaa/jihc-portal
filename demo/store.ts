import { useSyncExternalStore } from "react";
import { groupCourse, isoOf } from "@/lib/curator";
import { demoCuratorData } from "@/lib/curator-demo";
import type { SyllabusDetails, SyllabusTopic } from "@/lib/syllabus";
import { GRAPH_PLAN, IKT_DETAILS, IKT_PLAN } from "@/lib/demo-plans";
import { totals } from "@/lib/syllabus";
import { suggestSnationCode } from "@/lib/assessment";
import type { AttendanceStatus, BookingStatus, CertificateStatus, GradeType, ResourceType, Role, SyllabusStatus } from "@prisma/client";

/**
 * In-browser stand-in for the PostgreSQL database, so the portal runs as a static
 * demo (GitHub Pages). Data is generated from a fixed seed and saved in localStorage.
 */

export type User = { id: string; email: string | null; name: string; role: Role; iin: string | null; groupId: string | null; parentId: string | null; pin: string | null; active: boolean };
export type Group = { id: string; name: string; snationCode: string | null; curatorId: string | null };
export type Course = { id: string; code: string | null; title: string; color: string };
export type Room = { id: string; name: string; type: ResourceType; capacity: number | null; managerId: string | null };
export type Lesson = { id: string; groupId: string; courseId: string; teacherId: string; roomId: string; dayOfWeek: number; startPeriod: number; endPeriod: number };
export type Attendance = { id: string; studentId: string; courseId: string; scheduleId: string; markedById: string; date: Date; status: AttendanceStatus };
export type Grade = {
  id: string; studentId: string; courseId: string; scheduleId: string | null; givenById: string; type: GradeType; value: number; weight: number; workType: string; date: Date;
  assignmentId: string | null;
};
export type Assignment = { id: string; courseId: string; groupId: string; createdById: string; title: string; type: GradeType; weight: number; workType: string; date: Date };
export type LessonRecord = { id: string; scheduleId: string; date: Date; topic: string | null; homework: string | null };
export type Topic = SyllabusTopic;
export type Syllabus = { id: string; courseId: string; authorId: string; reviewerId: string | null; title: string; topics: Topic[]; details: SyllabusDetails | null; totalHours: number; status: SyllabusStatus; reviewNote: string | null; updatedAt: Date };
export type Booking = { id: string; roomId: string; userId: string; startTime: Date; endTime: Date; reason: string; status: BookingStatus };
export type Certificate = { id: string; studentId: string; reviewerId: string | null; fileName: string; fileData: string | null; startDate: Date; endDate: Date; status: CertificateStatus; reviewNote: string | null; createdAt: Date };
export type Announcement = { id: string; title: string; content: string; authorId: string; important: boolean; groupIds: string[]; createdAt: Date };
export type Rule = { id: string; title: string; content: string; authorId: string; createdAt: Date; updatedAt: Date };
export type ParentLink = { parentId: string; childId: string };
/** Curator workspace records, in the same plain shape the shared curator pages use. */
export type CuratorRow = Record<string, unknown> & { id: string };
export type CuratorData = {
  profiles: Record<string, Record<string, unknown>>;
  guardians: CuratorRow[]; contacts: CuratorRow[]; tasks: CuratorRow[]; events: CuratorRow[];
  achievements: CuratorRow[]; books: CuratorRow[]; tests: CuratorRow[]; reflections: CuratorRow[];
};
/** Админ панельдегі өзгерістер журналы (нақты қосымшадағы AuditLog кестесі). */
export type AuditRow = { id: string; at: string; userId: string | null; action: string; entity: string; summary: string; changes: [string, string | null, string | null][] | null };
export type Slip = { student: string; group: string; parentName: string; parentId: string; pin: string };

export type Db = {
  version: number;
  users: User[]; groups: Group[]; courses: Course[]; rooms: Room[]; lessons: Lesson[];
  attendance: Attendance[]; grades: Grade[]; assignments: Assignment[]; syllabi: Syllabus[]; bookings: Booking[]; lessonRecords: LessonRecord[];
  certificates: Certificate[]; announcements: Announcement[]; rules: Rule[]; parentLinks: ParentLink[];
  curator: CuratorData;
  audit: AuditRow[];
};

const VERSION = 6;
const KEY = "jihc-demo-db";
const SESSION_KEY = "jihc-demo-user";

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** Midnight UTC, matching how the real app stores @db.Date values. */
export const utcDay = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

function generate(): Db {
  let s = 42;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const MALE = ["Нұрлан", "Дамир", "Ерасыл", "Санжар", "Алихан", "Бекзат", "Темірлан", "Абылай", "Нұрислам", "Арман"];
  const FEMALE = ["Айдана", "Әсел", "Аружан", "Мадина", "Томирис", "Жансая", "Аяулым", "Дильназ", "Камила", "Балнұр"];
  const SURNAME = ["Омар", "Ахмет", "Тұрсын", "Байжан", "Иса", "Кенжебай", "Мұрат", "Әбдір", "Сейіт", "Жақып", "Нұрғали", "Сапар"];
  const fullName = () => {
    const sn = pick(SURNAME);
    const v = /[аеиоуыіәөүұ]$/i.test(sn);
    return rand() < 0.5 ? `${pick(MALE)} ${sn}${v ? "ев" : "ов"}` : `${pick(FEMALE)} ${sn}${v ? "ева" : "ова"}`;
  };

  const db: Db = { version: VERSION, users: [], groups: [], courses: [], rooms: [], lessons: [], attendance: [], grades: [], assignments: [], syllabi: [], lessonRecords: [], bookings: [], certificates: [], announcements: [], rules: [], parentLinks: [], audit: [],
    curator: { profiles: {}, guardians: [], contacts: [], tasks: [], events: [], achievements: [], books: [], tests: [], reflections: [] } };
  const groups: Group[] = ["2F-1", "2D-1", "3F-3", "1P-2"].map((name) => ({ id: uid(), name, snationCode: suggestSnationCode(name), curatorId: null }));
  db.groups = groups;
  const [g2F1, g2D1, g3F3, g1P2] = groups;

  const room = (name: string, type: ResourceType, capacity: number): Room => ({ id: uid(), name, type, capacity, managerId: null });
  db.rooms = [room("Б 106", "CLASSROOM", 30), room("Б 103", "CLASSROOM", 28), room("204", "CLASSROOM", 30), room("111", "CLASSROOM", 25), room("304 Кабинет", "CLASSROOM", 32), room("Компьютер кабинеті 2", "LAB", 20), room("Мұғалімдер бөлмесі", "STAFFROOM", 15), room("Акт залы", "HALL", 250)];
  const [b106, b103, r204, r111, r304, lab2, staffroom, hall] = db.rooms;

  const course = (code: string | null, title: string, color: string): Course => ({ id: uid(), code, title, color });
  const graph = course("КМ4 ОН 4.1, 4.3", "Graph Design", "#f28b82");
  const ikt = course("ЖММ 2", "Ақпараттық-коммуникациялық және цифрлық технологияларды қолдану", "#c5c98a");
  const tarbie = course(null, "Тәрбие сағаты", "#a7e3f5");
  const web = course("КМ3 ОН 3.2", "Web-бағдарламалау", "#b4d7a8");
  const dbc = course("КМ5 ОН 5.1", "Деректер қоры", "#d7b4f3");
  const eng = course("ЖББП 1", "Кәсіби ағылшын тілі", "#fde68a");
  const math = course("ЖББП 3", "Математика", "#fdba74");
  db.courses = [graph, ikt, tarbie, web, dbc, eng, math];

  const user = (u: Partial<User> & Pick<User, "name" | "role">): User => {
    const x: User = { id: uid(), email: null, iin: null, groupId: null, parentId: null, pin: null, active: true, ...u };
    db.users.push(x);
    return x;
  };
  const teacher = user({ email: "teacher@jihc.edu.kz", name: "Ғалым Сапаров", role: "TEACHER" });
  const t2 = user({ email: "a.nurgali@jihc.edu.kz", name: "Ажар Нұрғали", role: "TEACHER" });
  const t3 = user({ email: "d.kassym@jihc.edu.kz", name: "Даурен Қасым", role: "TEACHER" });
  const zavuch = user({ email: "zavuch@jihc.edu.kz", name: "Гүлмира Әбілова", role: "VICE_PRINCIPAL" });
  user({ email: "director@jihc.edu.kz", name: "Ержан Төлеуов", role: "DIRECTOR" });
  user({ email: "admin@jihc.edu.kz", name: "Жүйе әкімшісі", role: "ADMIN" });
  hall.managerId = t2.id;
  lab2.managerId = t3.id;
  staffroom.managerId = teacher.id;

  const students: User[] = [];
  let n = 0;
  for (const g of groups) {
    for (let i = 0; i < 14; i++) {
      n++;
      const demo = g.id === g2F1.id && i === 0;
      students.push(
        user({
          email: demo ? "student@jihc.edu.kz" : `s${String(n).padStart(3, "0")}@jihc.edu.kz`,
          name: demo ? "Айдана Сейітқали" : fullName(),
          role: "STUDENT",
          iin: demo ? "070512600123" : `07${String(100000000 + n * 7919).slice(0, 10)}`,
          groupId: g.id,
        }),
      );
    }
  }
  const demoStudent = students[0];
  const parent = user({ email: "parent@demo.local", name: "Бауыржан Сейітқали", role: "PARENT", parentId: "P-100001", pin: "1234" });
  db.parentLinks.push({ parentId: parent.id, childId: demoStudent.id });

  const L = (groupId: string, courseId: string, teacherId: string, roomId: string, dayOfWeek: number, startPeriod: number, endPeriod: number) =>
    db.lessons.push({ id: uid(), groupId, courseId, teacherId, roomId, dayOfWeek, startPeriod, endPeriod });
  L(g2F1.id, graph.id, teacher.id, b106.id, 2, 7, 11); L(g2F1.id, graph.id, teacher.id, b106.id, 3, 3, 6);
  L(g2D1.id, ikt.id, teacher.id, r204.id, 3, 7, 9); L(g2F1.id, graph.id, teacher.id, b106.id, 4, 1, 4);
  L(g3F3.id, tarbie.id, teacher.id, b103.id, 4, 6, 6); L(g2F1.id, graph.id, teacher.id, b106.id, 4, 7, 11);
  L(g2F1.id, graph.id, teacher.id, b106.id, 5, 3, 6); L(g2D1.id, ikt.id, teacher.id, r111.id, 5, 7, 9);
  L(g2F1.id, graph.id, teacher.id, b106.id, 5, 10, 11); L(g2F1.id, eng.id, t2.id, r304.id, 1, 1, 2);
  L(g2F1.id, web.id, t3.id, lab2.id, 1, 3, 6); L(g2F1.id, math.id, t2.id, r304.id, 2, 3, 4);
  L(g2F1.id, dbc.id, t3.id, lab2.id, 3, 7, 8); L(g2D1.id, web.id, t3.id, lab2.id, 2, 1, 4);
  L(g2D1.id, eng.id, t2.id, r304.id, 4, 3, 4); L(g3F3.id, dbc.id, t3.id, lab2.id, 1, 7, 10);
  L(g3F3.id, eng.id, t2.id, r304.id, 3, 1, 2); L(g1P2.id, math.id, t2.id, r304.id, 1, 3, 4);
  L(g1P2.id, ikt.id, t3.id, r204.id, 2, 3, 5);

  const today = utcDay(new Date());
  const skill = new Map(students.map((st) => [st.id, 55 + rand() * 40]));
  skill.set(demoStudent.id, 84);
  const truant = new Set(students.filter(() => rand() < 0.12).map((st) => st.id));
  for (let back = 28; back >= 1; back--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - back);
    const dow = ((date.getUTCDay() + 6) % 7) + 1;
    for (const l of db.lessons.filter((x) => x.dayOfWeek === dow)) {
      for (const st of students.filter((x) => x.groupId === l.groupId)) {
        const r = rand();
        const absentP = truant.has(st.id) ? 0.3 : 0.06;
        const status: AttendanceStatus =
          r < absentP ? "ABSENT" : r < absentP + 0.05 ? "LATE" : r < absentP + 0.07 ? "EXCUSED" : r < absentP + 0.08 ? "LEFT_EARLY" : "PRESENT";
        db.attendance.push({ id: uid(), studentId: st.id, courseId: l.courseId, scheduleId: l.id, markedById: l.teacherId, date, status });
        if (status !== "ABSENT" && status !== "EXCUSED" && rand() < 0.45) {
          const value = Math.round(Math.min(100, Math.max(30, skill.get(st.id)! + (rand() - 0.5) * 25)));
          const control = back === 14;
          // The control work is an EduPage-style assignment; everyday grades come from the journal.
          let assignmentId: string | null = null;
          if (control) {
            let a = db.assignments.find((x) => x.courseId === l.courseId && x.groupId === l.groupId && +x.date === +date);
            if (!a) {
              a = { id: uid(), courseId: l.courseId, groupId: l.groupId, createdById: l.teacherId, title: "Бақылау жұмысы 1", type: "MIDTERM", weight: 2, workType: "examination", date };
              db.assignments.push(a);
            }
            assignmentId = a.id;
          }
          db.grades.push({
            id: uid(), studentId: st.id, courseId: l.courseId, scheduleId: control ? null : l.id, givenById: l.teacherId, value, date, assignmentId,
            type: control ? "MIDTERM" : "CURRENT", weight: control ? 2 : 1, workType: control ? "examination" : rand() < 0.3 ? "laboratory" : "simple",
          });
        }
      }
    }
  }

  const daysAgo = (d: number) => utcDay(new Date(Date.now() - d * 86400000));
  const cert = (studentId: string, a: number, b: number, status: CertificateStatus, reviewNote: string | null = null): Certificate => ({
    id: uid(), studentId, reviewerId: status === "PENDING" ? null : zavuch.id, fileName: "anyqtama.pdf", fileData: null,
    startDate: daysAgo(a), endDate: daysAgo(b), status, reviewNote, createdAt: daysAgo(b - 1 < 0 ? 0 : b - 1),
  });
  db.certificates = [cert(demoStudent.id, 20, 18, "APPROVED"), cert(students[3].id, 4, 2, "PENDING"), cert(students[17].id, 6, 5, "PENDING"), cert(students[30].id, 10, 9, "REJECTED", "Мөрі анық емес")];

  db.syllabi = [
    { id: uid(), courseId: graph.id, authorId: teacher.id, reviewerId: null, title: "Graph Design — 2026-2027 оқу жылы, 1-семестр", topics: GRAPH_PLAN, details: null, totalHours: totals(GRAPH_PLAN).all, status: "PENDING", reviewNote: null, updatedAt: daysAgo(2) },
    { id: uid(), courseId: ikt.id, authorId: teacher.id, reviewerId: zavuch.id, title: "ЖММ 2 — 2D-1, 3-семестр", topics: IKT_PLAN, details: IKT_DETAILS, totalHours: totals(IKT_PLAN).all, status: "APPROVED", reviewNote: null, updatedAt: daysAgo(12) },
  ];
  // Lesson topics for the ЖММ 2 lessons that already happened, taken from the plan in order.
  const iktDays = [...new Set(db.attendance.filter((a) => a.courseId === ikt.id && a.scheduleId).map((a) => `${a.scheduleId}|${a.date.toISOString()}`))].sort((a, b) => a.split("|")[1].localeCompare(b.split("|")[1]));
  db.lessonRecords = iktDays.map((k, i) => {
    const [scheduleId, date] = k.split("|");
    return { id: uid(), scheduleId, date: new Date(date), topic: IKT_PLAN[i % IKT_PLAN.length].topic, homework: i % 2 ? "Тақырып бойынша практикалық тапсырманы аяқтау" : null };
  });

  const at = (d: number, h: number) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    x.setHours(h, 0, 0, 0);
    return x;
  };
  db.bookings = [
    { id: uid(), roomId: hall.id, userId: teacher.id, startTime: at(3, 14), endTime: at(3, 16), reason: "Дизайн бөлімінің студенттік көрмесі", status: "PENDING" },
    { id: uid(), roomId: r304.id, userId: t2.id, startTime: at(1, 15), endTime: at(1, 16), reason: "Ағылшын тілі клубы", status: "APPROVED" },
    { id: uid(), roomId: staffroom.id, userId: t3.id, startTime: at(2, 13), endTime: at(2, 14), reason: "Әдістемелік бірлестік отырысы", status: "PENDING" },
  ];

  const now = new Date();
  db.announcements = [
    { id: uid(), authorId: zavuch.id, important: true, groupIds: [], createdAt: now, title: "Аралық бақылау аптасы", content: "3–7 қараша аралығында барлық топтарда аралық бақылау өтеді. Кесте өзгерістерін порталдан қадағалаңыз." },
    { id: uid(), authorId: teacher.id, important: false, groupIds: [g2F1.id], createdAt: now, title: "2F-1: жоба тапсыру", content: "Логотип жобасын жұмаға дейін PDF түрінде жіберіңіз." },
    { id: uid(), authorId: zavuch.id, important: false, groupIds: [], createdAt: now, title: "Тәрбие сағаты: Тәуелсіздік күні", content: "Барлық кураторлар желтоқсанның бірінші аптасында тақырыптық тәрбие сағатын өткізеді." },
  ];
  db.rules = [
    { id: uid(), authorId: zavuch.id, createdAt: now, updatedAt: now, title: "Ішкі тәртіп ережелері", content: "1. Сабаққа кешікпеу.\n2. Іскерлік киім үлгісін сақтау.\n3. Колледж мүлкіне ұқыпты қарау.\n4. Сабақ кезінде телефонды дыбыссыз режимде ұстау." },
    { id: uid(), authorId: zavuch.id, createdAt: now, updatedAt: now, title: "Сабақ босатуды рәсімдеу", content: "Ауырған жағдайда студент 3 жұмыс күні ішінде медициналық анықтаманы порталға жүктеуі тиіс. Завуч растағаннан кейін босатылған күндер «себепті» деп белгіленеді." },
  ];

  // Curators: the demo teacher curates 2F-1 (filled-in workspace), Ажар Нұрғали curates 3F-3.
  g2F1.curatorId = teacher.id;
  g3F3.curatorId = t2.id;
  const cur = demoCuratorData(students.filter((x) => x.groupId === g2F1.id), groupCourse(g2F1.name), isoOf(new Date()), rand);
  const withId = (r: Record<string, unknown>) => ({ ...r, id: uid() });
  db.curator = {
    profiles: cur.profiles,
    guardians: cur.guardians.map(withId),
    contacts: cur.contacts.map((c) => ({ ...withId(c), authorId: teacher.id })),
    tasks: cur.tasks.map((t) => ({ ...withId(t), groupId: g2F1.id })),
    events: cur.events.map((e) => ({ ...withId(e), groupId: g2F1.id })),
    achievements: cur.achievements.map(withId),
    books: cur.books.map(withId),
    tests: cur.tests.map(withId),
    reflections: cur.reflections.map(withId),
  };
  return db;
}

const DATE_FIELDS = new Set(["date", "startDate", "endDate", "startTime", "endTime", "createdAt", "updatedAt"]);

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw, (k, v) => (DATE_FIELDS.has(k) && typeof v === "string" && v.length > 10 ? new Date(v) : v)) as Db;
      if (parsed.version === VERSION) return parsed;
    }
  } catch {}
  return generate();
}

let db = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Quota or private mode: the demo keeps working in memory.
  }
}

/** Apply a change to the database, persist it and re-render subscribers. */
export function mutate(fn: (d: Db) => void) {
  const next = structuredClone(db);
  fn(next);
  db = next;
  save();
  listeners.forEach((l) => l());
}

export function resetDemo() {
  db = generate();
  save();
  listeners.forEach((l) => l());
}

export function useDb() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => db,
  );
}

export function getDb() {
  return db;
}

// --- Demo session ---------------------------------------------------------

let sessionId: string | null = (() => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
})();
const sessionListeners = new Set<() => void>();

export function login(userId: string) {
  sessionId = userId;
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {}
  sessionListeners.forEach((l) => l());
}

export function logout() {
  sessionId = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  sessionListeners.forEach((l) => l());
}

export function useSessionUser() {
  const id = useSyncExternalStore(
    (cb) => {
      sessionListeners.add(cb);
      return () => sessionListeners.delete(cb);
    },
    () => sessionId,
  );
  const d = useDb();
  return d.users.find((u) => u.id === id) ?? null;
}
