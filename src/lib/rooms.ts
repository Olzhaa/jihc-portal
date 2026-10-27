export const ROOM_TYPE_LABEL = {
  CLASSROOM: "кабинет",
  LAB: "компьютер кабинеті",
  STAFFROOM: "мұғалімдер бөлмесі",
  HALL: "акт залы",
} as const;

/** Plain classrooms need no sign-off; special rooms go to their responsible teacher. */
export function needsApproval(type: keyof typeof ROOM_TYPE_LABEL) {
  return type !== "CLASSROOM";
}
