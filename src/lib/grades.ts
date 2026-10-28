import type { GradeType, AttendanceStatus } from "@prisma/client";

/**
 * Grades are stored on a 100-point scale; this maps to the traditional 5-point mark.
 * Bands match EduPage's colours at JIHC (49.4 / 69.4 / 89.4): 0–49 → 2, 50–69 → 3, 70–89 → 4, 90–100 → 5.
 */
export function toFivePoint(value: number) {
  const v = Math.round(value);
  if (v >= 90) return 5;
  if (v >= 70) return 4;
  if (v >= 50) return 3;
  return 2;
}

export function gradeTone(value: number) {
  const five = toFivePoint(value);
  if (five === 5) return "text-emerald-600 dark:text-emerald-400";
  if (five === 4) return "text-sky-600 dark:text-sky-400";
  if (five === 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

/** GPA on a 4.0 scale from a 100-point average (Kazakhstan credit system bands). */
export function gpaFromAverage(avg: number) {
  const bands: [number, number][] = [
    [95, 4.0], [90, 3.67], [85, 3.33], [80, 3.0], [75, 2.67], [70, 2.33], [65, 2.0], [60, 1.67], [55, 1.33], [50, 1.0],
  ];
  return bands.find(([min]) => avg >= min)?.[1] ?? 0;
}

export const GRADE_TYPE_LABEL: Record<GradeType, string> = {
  CURRENT: "Ағымдағы бағалар",
  MIDTERM: "Ағымдағы бақылау",
  EXAM: "Емтихан немесе сынақ",
  ATTENDANCE: "Сабаққа қатысуы",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Қатысты",
  ABSENT: "Жоқ",
  LATE: "Кешікті",
  LEFT_EARLY: "Ерте кетті",
  EXCUSED: "Себепті",
};

export const ATTENDANCE_SHORT: Record<AttendanceStatus, string> = {
  PRESENT: "+",
  ABSENT: "Ж",
  LATE: "К",
  LEFT_EARLY: "Е",
  EXCUSED: "С",
};

/** Order of the status buttons in the journal (EduPage: present, absent, late, left early). */
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEFT_EARLY", "EXCUSED"];

/** Present, late and left early all count as attended. */
export const ATTENDED: AttendanceStatus[] = ["PRESENT", "LATE", "LEFT_EARLY"];

export function attendanceRate(statuses: AttendanceStatus[]) {
  if (!statuses.length) return null;
  return (statuses.filter((s) => ATTENDED.includes(s)).length / statuses.length) * 100;
}
