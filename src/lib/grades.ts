import type { GradeType, AttendanceStatus } from "@prisma/client";

/** Grades are stored on a 100-point scale; this maps to the traditional 5-point mark. */
export function toFivePoint(value: number) {
  if (value >= 90) return 5;
  if (value >= 75) return 4;
  if (value >= 50) return 3;
  return 2;
}

export function gradeTone(value: number) {
  if (value >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 75) return "text-sky-600 dark:text-sky-400";
  if (value >= 50) return "text-amber-600 dark:text-amber-400";
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
  CURRENT: "Ағымдағы",
  MIDTERM: "Аралық",
  EXAM: "Сессиялық",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Қатысты",
  ABSENT: "Жоқ",
  LATE: "Кешікті",
  EXCUSED: "Себепті",
};

export const ATTENDANCE_SHORT: Record<AttendanceStatus, string> = {
  PRESENT: "+",
  ABSENT: "Ж",
  LATE: "К",
  EXCUSED: "С",
};

/** Present and late both count as attended. */
export function attendanceRate(statuses: AttendanceStatus[]) {
  if (!statuses.length) return null;
  return (statuses.filter((s) => s === "PRESENT" || s === "LATE").length / statuses.length) * 100;
}
