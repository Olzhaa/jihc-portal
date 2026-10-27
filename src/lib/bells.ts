/** Колледждің қоңырау кестесі (EduPage-тегі қазіргі кестеден алынды). */
export const BELLS = [
  { n: 1, start: "08:30", end: "09:15" },
  { n: 2, start: "09:20", end: "10:05" },
  { n: 3, start: "10:20", end: "11:05" },
  { n: 4, start: "11:10", end: "11:55" },
  { n: 5, start: "12:00", end: "12:45" },
  { n: 6, start: "12:50", end: "13:35" },
  { n: 7, start: "13:40", end: "14:25" },
  { n: 8, start: "14:35", end: "15:20" },
  { n: 9, start: "15:25", end: "16:10" },
  { n: 10, start: "16:15", end: "17:00" },
  { n: 11, start: "17:05", end: "17:50" },
] as const;

/** Оқу күндері: дүйсенбі–жұма (сенбіде сабақ жоқ). */
export const DAYS = [
  { n: 1, short: "Дс", long: "Дүйсенбі" },
  { n: 2, short: "Сс", long: "Сейсенбі" },
  { n: 3, short: "Ср", long: "Сәрсенбі" },
  { n: 4, short: "Бс", long: "Бейсенбі" },
  { n: 5, short: "Жм", long: "Жұма" },
] as const;

export function periodRange(startPeriod: number, endPeriod: number) {
  const s = BELLS[startPeriod - 1];
  const e = BELLS[endPeriod - 1];
  return s && e ? `${s.start}–${e.end}` : "";
}

export function dayName(n: number) {
  return DAYS.find((d) => d.n === n)?.long ?? "";
}
