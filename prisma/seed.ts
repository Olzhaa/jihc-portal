import { PrismaClient, type AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { KIND_FIELDS, dateFields, groupCourse, isoToday, type RecordKind } from "../src/lib/curator";
import { demoCuratorData } from "../src/lib/curator-demo";
import { suggestSnationCode } from "../src/lib/assessment";
import { GRAPH_PLAN, IKT_DETAILS, IKT_PLAN } from "../src/lib/demo-plans";
import { totals } from "../src/lib/syllabus";

const prisma = new PrismaClient();

// Deterministic pseudo-random so the demo looks the same on every seed.
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

const MALE = ["Нұрлан", "Дамир", "Ерасыл", "Санжар", "Алихан", "Бекзат", "Темірлан", "Абылай", "Нұрислам", "Арман"];
const FEMALE = ["Айдана", "Әсел", "Аружан", "Мадина", "Томирис", "Жансая", "Аяулым", "Дильназ", "Камила", "Балнұр"];
const SURNAME = ["Омар", "Ахмет", "Тұрсын", "Байжан", "Иса", "Кенжебай", "Мұрат", "Әбдір", "Сейіт", "Жақып", "Нұрғали", "Сапар"];
const fullName = () => {
  const s = pick(SURNAME);
  const vowelEnd = /[аеиоуыіәөүұ]$/i.test(s);
  return rand() < 0.5 ? `${pick(MALE)} ${s}${vowelEnd ? "ев" : "ов"}` : `${pick(FEMALE)} ${s}${vowelEnd ? "ева" : "ова"}`;
};

async function main() {
  await prisma.$transaction([
    prisma.contactLog.deleteMany(), prisma.guardian.deleteMany(), prisma.studentProfile.deleteMany(), prisma.achievement.deleteMany(),
    prisma.bookRead.deleteMany(), prisma.testResult.deleteMany(), prisma.reflection.deleteMany(), prisma.curatorTask.deleteMany(), prisma.classEvent.deleteMany(),
    prisma.attendance.deleteMany(), prisma.grade.deleteMany(), prisma.assignment.deleteMany(), prisma.medicalCertificate.deleteMany(),
    prisma.booking.deleteMany(), prisma.syllabus.deleteMany(), prisma.lessonRecord.deleteMany(), prisma.schedule.deleteMany(),
    prisma.announcement.deleteMany(), prisma.rule.deleteMany(), prisma.parentLink.deleteMany(),
    prisma.user.deleteMany(), prisma.group.deleteMany(), prisma.course.deleteMany(), prisma.room.deleteMany(),
  ]);

  const groups = await Promise.all(["2F-1", "2D-1", "3F-3", "1P-2"].map((name) => prisma.group.create({ data: { name, snationCode: suggestSnationCode(name) } })));
  const [g2F1, g2D1, g3F3, g1P2] = groups;

  const rooms = await Promise.all(
    [
      ["Б 106", "CLASSROOM", 30], ["Б 103", "CLASSROOM", 28], ["204", "CLASSROOM", 30], ["111", "CLASSROOM", 25],
      ["304 Кабинет", "CLASSROOM", 32], ["Компьютер кабинеті 2", "LAB", 20], ["Мұғалімдер бөлмесі", "STAFFROOM", 15], ["Акт залы", "HALL", 250],
    ].map(([name, type, capacity]) => prisma.room.create({ data: { name: name as string, type: type as "HALL" | "CLASSROOM" | "LAB" | "STAFFROOM", capacity: capacity as number } })),
  );
  const [b106, b103, r204, r111, r304, lab2, staffroom] = rooms;

  const c = (code: string | null, title: string, color: string) => prisma.course.create({ data: { code, title, color } });
  const graph = await c("КМ4 ОН 4.1, 4.3", "Graph Design", "#f28b82");
  const ikt = await c("ЖММ 2", "Ақпараттық-коммуникациялық және цифрлық технологияларды қолдану", "#c5c98a");
  const tarbie = await c(null, "Тәрбие сағаты", "#a7e3f5");
  const web = await c("КМ3 ОН 3.2", "Web-бағдарламалау", "#b4d7a8");
  const db = await c("КМ5 ОН 5.1", "Деректер қоры", "#d7b4f3");
  const eng = await c("ЖББП 1", "Кәсіби ағылшын тілі", "#fde68a");
  const math = await c("ЖББП 3", "Математика", "#fdba74");

  const staff = async (email: string, name: string, role: "TEACHER" | "VICE_PRINCIPAL" | "DIRECTOR") =>
    prisma.user.create({ data: { email, name, role } });
  const teacher = await staff("teacher@jihc.edu.kz", "Ғалым Сапаров", "TEACHER");
  const t2 = await staff("a.nurgali@jihc.edu.kz", "Ажар Нұрғали", "TEACHER");
  const t3 = await staff("d.kassym@jihc.edu.kz", "Даурен Қасым", "TEACHER");
  const zavuch = await staff("zavuch@jihc.edu.kz", "Гүлмира Әбілова", "VICE_PRINCIPAL");
  await staff("director@jihc.edu.kz", "Ержан Төлеуов", "DIRECTOR");

  // Responsible teachers approve requests for special rooms.
  const hallRoom = rooms.find((r) => r.type === "HALL")!;
  await prisma.room.update({ where: { id: hallRoom.id }, data: { managerId: t2.id } });
  await prisma.room.update({ where: { id: lab2.id }, data: { managerId: t3.id } });
  await prisma.room.update({ where: { id: staffroom.id }, data: { managerId: teacher.id } });

  // Students: ~14 per group, first one in 2F-1 is the demo student.
  const students: { id: string; name: string; groupId: string }[] = [];
  let n = 0;
  for (const g of groups) {
    for (let i = 0; i < 14; i++) {
      n++;
      const demo = g.id === g2F1.id && i === 0;
      const name = demo ? "Айдана Сейітқали" : fullName();
      const u = await prisma.user.create({
        data: {
          email: demo ? "student@jihc.edu.kz" : `s${String(n).padStart(3, "0")}@jihc.edu.kz`,
          name,
          role: "STUDENT",
          iin: demo ? "070512600123" : `07${String(100000000 + n * 7919).slice(0, 10)}`,
          groupId: g.id,
        },
      });
      students.push({ id: u.id, name, groupId: g.id });
    }
  }
  const demoStudent = students[0];

  await prisma.user.create({
    data: {
      email: "parent@demo.local",
      name: "Бауыржан Сейітқали",
      role: "PARENT",
      parentId: "P-100001",
      parentPinHash: await bcrypt.hash("1234", 10),
      children: { create: { childId: demoStudent.id } },
    },
  });

  // Timetable modelled on the current EduPage layout (periods are bell numbers).
  const L = (groupId: string, courseId: string, teacherId: string, roomId: string, dayOfWeek: number, startPeriod: number, endPeriod: number) =>
    prisma.schedule.create({ data: { groupId, courseId, teacherId, roomId, dayOfWeek, startPeriod, endPeriod } });
  await Promise.all([
    L(g2F1.id, graph.id, teacher.id, b106.id, 2, 7, 11),
    L(g2F1.id, graph.id, teacher.id, b106.id, 3, 3, 6),
    L(g2D1.id, ikt.id, teacher.id, r204.id, 3, 7, 9),
    L(g2F1.id, graph.id, teacher.id, b106.id, 4, 1, 4),
    L(g3F3.id, tarbie.id, teacher.id, b103.id, 4, 6, 6),
    L(g2F1.id, graph.id, teacher.id, b106.id, 4, 7, 11),
    L(g2F1.id, graph.id, teacher.id, b106.id, 5, 3, 6),
    L(g2D1.id, ikt.id, teacher.id, r111.id, 5, 7, 9),
    L(g2F1.id, graph.id, teacher.id, b106.id, 5, 10, 11),
    // Other teachers
    L(g2F1.id, eng.id, t2.id, r304.id, 1, 1, 2),
    L(g2F1.id, web.id, t3.id, lab2.id, 1, 3, 6),
    L(g2F1.id, math.id, t2.id, r304.id, 2, 3, 4),
    L(g2F1.id, db.id, t3.id, lab2.id, 3, 7, 8),
    L(g2D1.id, web.id, t3.id, lab2.id, 2, 1, 4),
    L(g2D1.id, eng.id, t2.id, r304.id, 4, 3, 4),
    L(g3F3.id, db.id, t3.id, lab2.id, 1, 7, 10),
    L(g3F3.id, eng.id, t2.id, r304.id, 3, 1, 2),
    L(g1P2.id, math.id, t2.id, r304.id, 1, 3, 4),
    L(g1P2.id, ikt.id, t3.id, r204.id, 2, 3, 5),
  ]);

  // Four weeks of attendance and grades for every lesson that already happened.
  const lessons = await prisma.schedule.findMany();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const attendance: { studentId: string; courseId: string; scheduleId: string; markedById: string; date: Date; status: AttendanceStatus }[] = [];
  const gradesData: { studentId: string; courseId: string; scheduleId: string | null; assignmentId?: string; givenById: string; value: number; date: Date; type: "CURRENT" | "MIDTERM"; weight: number; workType: string }[] = [];
  const skill = new Map(students.map((st) => [st.id, 55 + rand() * 40]));
  skill.set(demoStudent.id, 84);
  const truant = new Set(students.filter(() => rand() < 0.12).map((st) => st.id));
  const controlWork = new Map<string, string>();

  for (let back = 28; back >= 1; back--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - back);
    const dow = ((date.getUTCDay() + 6) % 7) + 1;
    for (const l of lessons.filter((x) => x.dayOfWeek === dow)) {
      for (const st of students.filter((x) => x.groupId === l.groupId)) {
        const r = rand();
        const absentP = truant.has(st.id) ? 0.3 : 0.06;
        const status: AttendanceStatus =
          r < absentP ? "ABSENT" : r < absentP + 0.05 ? "LATE" : r < absentP + 0.07 ? "EXCUSED" : r < absentP + 0.08 ? "LEFT_EARLY" : "PRESENT";
        attendance.push({ studentId: st.id, courseId: l.courseId, scheduleId: l.id, markedById: l.teacherId, date, status });
        if (status !== "ABSENT" && status !== "EXCUSED" && rand() < 0.45) {
          const value = Math.round(Math.min(100, Math.max(30, skill.get(st.id)! + (rand() - 0.5) * 25)));
          const control = back === 14;
          // The control work is an EduPage-style assignment; everyday grades come from the journal.
          let assignmentId: string | undefined;
          if (control) {
            const key = `${l.groupId}:${l.courseId}:${+date}`;
            if (!controlWork.has(key)) {
              const a = await prisma.assignment.create({
                data: { courseId: l.courseId, groupId: l.groupId, createdById: l.teacherId, title: "Бақылау жұмысы 1", type: "MIDTERM", weight: 2, workType: "examination", date },
              });
              controlWork.set(key, a.id);
            }
            assignmentId = controlWork.get(key);
          }
          gradesData.push({
            studentId: st.id, courseId: l.courseId, scheduleId: control ? null : l.id, assignmentId, givenById: l.teacherId, value, date,
            type: control ? "MIDTERM" : "CURRENT", weight: control ? 2 : 1, workType: control ? "examination" : rand() < 0.3 ? "laboratory" : "simple",
          });
        }
      }
    }
  }
  await prisma.attendance.createMany({ data: attendance });
  await prisma.grade.createMany({ data: gradesData });

  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
  await prisma.medicalCertificate.createMany({
    data: [
      { studentId: demoStudent.id, fileUrl: "demo-placeholder", startDate: daysAgo(20), endDate: daysAgo(18), status: "APPROVED", reviewerId: zavuch.id },
      { studentId: students[3].id, fileUrl: "demo-placeholder", startDate: daysAgo(4), endDate: daysAgo(2), status: "PENDING" },
      { studentId: students[17].id, fileUrl: "demo-placeholder", startDate: daysAgo(6), endDate: daysAgo(5), status: "PENDING" },
      { studentId: students[30].id, fileUrl: "demo-placeholder", startDate: daysAgo(10), endDate: daysAgo(9), status: "REJECTED", reviewNote: "Мөрі анық емес", reviewerId: zavuch.id },
    ],
  });

  await prisma.syllabus.create({
    data: {
      courseId: graph.id, authorId: teacher.id, title: "Graph Design — 2026-2027 оқу жылы, 1-семестр", status: "PENDING",
      topics: GRAPH_PLAN, totalHours: totals(GRAPH_PLAN).all,
    },
  });
  await prisma.syllabus.create({
    data: {
      courseId: ikt.id, authorId: teacher.id, title: "ЖММ 2 — 2D-1, 3-семестр", status: "APPROVED", reviewerId: zavuch.id,
      topics: IKT_PLAN, details: IKT_DETAILS, totalHours: totals(IKT_PLAN).all,
    },
  });
  // Lesson topics for the ЖММ 2 lessons that already happened, taken from the plan in order.
  const iktDays = [...new Set(attendance.filter((a) => a.courseId === ikt.id).map((a) => `${a.scheduleId}|${a.date.toISOString()}`))].sort((a, b) => a.split("|")[1].localeCompare(b.split("|")[1]));
  await prisma.lessonRecord.createMany({
    data: iktDays.map((k, i) => {
      const [scheduleId, date] = k.split("|");
      return { scheduleId, date: new Date(date), topic: IKT_PLAN[i % IKT_PLAN.length].topic, homework: i % 2 ? "Тақырып бойынша практикалық тапсырманы аяқтау" : null };
    }),
  });

  const at = (d: number, h: number) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    x.setHours(h, 0, 0, 0);
    return x;
  };
  const hall = rooms.find((r) => r.type === "HALL")!;
  await prisma.booking.createMany({
    data: [
      { roomId: hall.id, userId: teacher.id, startTime: at(3, 14), endTime: at(3, 16), reason: "Дизайн бөлімінің студенттік көрмесі", status: "PENDING" },
      { roomId: r304.id, userId: t2.id, startTime: at(1, 15), endTime: at(1, 16), reason: "Ағылшын тілі клубы", status: "APPROVED" },
      { roomId: staffroom.id, userId: t3.id, startTime: at(2, 13), endTime: at(2, 14), reason: "Әдістемелік бірлестік отырысы", status: "PENDING" },
    ],
  });

  await prisma.announcement.create({
    data: { authorId: zavuch.id, important: true, title: "Аралық бақылау аптасы", content: "3–7 қараша аралығында барлық топтарда аралық бақылау өтеді. Кесте өзгерістерін порталдан қадағалаңыз." },
  });
  await prisma.announcement.create({
    data: { authorId: teacher.id, title: "2F-1: жоба тапсыру", content: "Логотип жобасын жұмаға дейін PDF түрінде жіберіңіз.", groups: { connect: { id: g2F1.id } } },
  });
  await prisma.announcement.create({
    data: { authorId: zavuch.id, title: "Тәрбие сағаты: Тәуелсіздік күні", content: "Барлық кураторлар желтоқсанның бірінші аптасында тақырыптық тәрбие сағатын өткізеді." },
  });

  await prisma.rule.createMany({
    data: [
      { authorId: zavuch.id, title: "Ішкі тәртіп ережелері", content: "1. Сабаққа кешікпеу.\n2. Іскерлік киім үлгісін сақтау.\n3. Колледж мүлкіне ұқыпты қарау.\n4. Сабақ кезінде телефонды дыбыссыз режимде ұстау." },
      { authorId: zavuch.id, title: "Сабақ босатуды рәсімдеу", content: "Ауырған жағдайда студент 3 жұмыс күні ішінде медициналық анықтаманы порталға жүктеуі тиіс. Завуч растағаннан кейін босатылған күндер «себепті» деп белгіленеді." },
    ],
  });

  // Curators: the demo teacher curates 2F-1 (with a filled-in workspace), Ажар Нұрғали curates 3F-3.
  await prisma.group.update({ where: { id: g2F1.id }, data: { curatorId: teacher.id } });
  await prisma.group.update({ where: { id: g3F3.id }, data: { curatorId: t2.id } });
  const cur = demoCuratorData(students.filter((x) => x.groupId === g2F1.id), groupCourse(g2F1.name), isoToday(), rand);
  const toDb = (kind: RecordKind, r: Record<string, unknown>) => {
    const out = { ...r };
    for (const k of dateFields(KIND_FIELDS[kind])) if (typeof out[k] === "string") out[k] = new Date(`${out[k]}T00:00:00.000Z`);
    return out;
  };
  for (const [studentId, p] of Object.entries(cur.profiles)) await prisma.studentProfile.create({ data: { studentId, ...toDb("profile", p) } as never });
  await prisma.guardian.createMany({ data: cur.guardians as never });
  await prisma.contactLog.createMany({ data: cur.contacts.map((c) => ({ ...toDb("contact", c), authorId: teacher.id })) as never });
  await prisma.curatorTask.createMany({ data: cur.tasks.map((t) => ({ ...toDb("task", t), groupId: g2F1.id })) as never });
  await prisma.classEvent.createMany({ data: cur.events.map((e) => ({ ...toDb("event", e), groupId: g2F1.id })) as never });
  await prisma.achievement.createMany({ data: cur.achievements.map((a) => toDb("achievement", a)) as never });
  await prisma.bookRead.createMany({ data: cur.books.map((b) => toDb("book", b)) as never });
  await prisma.testResult.createMany({ data: cur.tests.map((t) => toDb("test", t)) as never });
  await prisma.reflection.createMany({ data: cur.reflections.map((r) => ({ ...r, createdAt: new Date(`${r.createdAt}T09:00:00.000Z`) })) as never });

  console.log(`Seeded ${students.length} students, ${lessons.length} lessons, ${attendance.length} attendance, ${gradesData.length} grades.`);
}

main().finally(() => prisma.$disconnect());
