import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFmt = new Intl.DateTimeFormat("kk-KZ", { day: "2-digit", month: "2-digit", year: "numeric" });

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

/** YYYY-MM-DD in local time, for <input type="date"> and @db.Date columns. */
export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses YYYY-MM-DD as a UTC midnight date, matching how Prisma stores @db.Date. */
export function parseISODate(s: string) {
  return new Date(`${s}T00:00:00.000Z`);
}

/** 1 = Monday … 7 = Sunday */
export function isoWeekday(d: Date) {
  return ((d.getDay() + 6) % 7) + 1;
}

export function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - (isoWeekday(r) - 1));
  return r;
}

export function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}
