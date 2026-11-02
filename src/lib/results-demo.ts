import type { AttendanceStatus, FinalPeriod, GradeType } from "@prisma/client";
import { buildResults, cellsToLock, DEFAULT_RESULTS_CONFIG } from "./results";

/**
 * Демо үшін өткен (жабылған) оқу жылы: екі жартыжылдықтың бағалары, емтихан ведомосінен қойылған
 * емтихан бағалары, бірнеше жіберілген сабақ және бекітілген қорытындылар. Сонда «Қорытындылар»
 * бетінің барлық бағаны толады. prisma/seed.ts пен demo/store.ts екеуі де қолданады.
 * localStorage-ға сыю үшін әр жартыжылдықта бірнеше баға ғана.
 */
export function previousYearDemo(input: {
  year: number;
  students: { id: string; groupId: string | null }[];
  lessons: { id: string; groupId: string; courseId: string; teacherId: string }[];
  /** Пәндер, олар бойынша баға қойылмайды (мысалы тәрбие сағаты). */
  skipCourses: string[];
  skill: Map<string, number>;
  truant: Set<string>;
  rand: () => number;
  setById: string;
}) {
  const { year, rand } = input;
  const weekday = (d: Date) => {
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  };
  const grades: { studentId: string; courseId: string; givenById: string; value: number; date: Date; type: GradeType; weight: number; workType: string }[] = [];
  const attendance: { studentId: string; courseId: string; scheduleId: string; markedById: string; date: Date; status: AttendanceStatus }[] = [];
  const finals: { studentId: string; courseId: string; academicYear: number; period: FinalPeriod; value: number; manual: boolean; setById: string }[] = [];

  const pairs = [...new Map(input.lessons.filter((l) => !input.skipCourses.includes(l.courseId)).map((l) => [`${l.groupId}:${l.courseId}`, l])).values()];
  for (const l of pairs) {
    for (const st of input.students.filter((x) => x.groupId === l.groupId)) {
      const base = input.skill.get(st.id)! + (rand() - 0.5) * 10;
      for (const half of [1, 2] as const) {
        for (let k = 0; k < 6; k++) {
          const date = weekday(half === 1 ? new Date(Date.UTC(year, 8, 8 + k * 16)) : new Date(Date.UTC(year + 1, 0, 19 + k * 20)));
          const control = k === 5;
          grades.push({
            studentId: st.id, courseId: l.courseId, givenById: l.teacherId, date,
            value: Math.round(Math.min(100, Math.max(25, base + (half === 2 ? 3 : 0) + (rand() - 0.5) * 26))),
            type: control ? "MIDTERM" : "CURRENT", weight: control ? 2 : 1, workType: control ? "examination" : "simple",
          });
        }
      }
      finals.push({
        studentId: st.id, courseId: l.courseId, academicYear: year, period: "EXAM", manual: true, setById: input.setById,
        value: Math.round(Math.min(100, Math.max(30, base + (rand() - 0.4) * 22))),
      });
    }
  }
  for (const st of input.students) {
    const lessons = input.lessons.filter((x) => x.groupId === st.groupId);
    if (!lessons.length) continue;
    const misses = Math.floor(rand() * (input.truant.has(st.id) ? 14 : 5));
    for (let i = 0; i < misses; i++) {
      const l = lessons[Math.floor(rand() * lessons.length)];
      const date = weekday(new Date(Date.UTC(year, 8, 2 + Math.floor(rand() * 280))));
      if (attendance.some((x) => x.studentId === st.id && x.scheduleId === l.id && +x.date === +date)) continue;
      attendance.push({ studentId: st.id, courseId: l.courseId, scheduleId: l.id, markedById: l.teacherId, date, status: rand() < 0.6 ? "ABSENT" : "EXCUSED" });
    }
  }
  // Жыл жабылған: қалған қорытындылар бекітілген.
  const results = buildResults({
    year,
    students: input.students.map((s) => ({ id: s.id, name: "" })),
    courses: [...new Set(pairs.map((l) => l.courseId))].map((id) => ({ id, title: id, code: null })),
    grades,
    attendance: [],
    stored: finals,
    config: DEFAULT_RESULTS_CONFIG,
  });
  for (const c of cellsToLock(results)) finals.push({ ...c, academicYear: year, manual: false, setById: input.setById });
  return { grades, attendance, finals };
}
