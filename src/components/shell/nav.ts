import type { Role } from "@prisma/client";
import { ENTITIES } from "@/lib/admin/entities";

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

const teacherGroup: NavGroup = {
  title: "Оқу процесі",
  items: [
    { href: "/teacher", label: "Басты бет", icon: "home" },
    { href: "/teacher/schedule", label: "Менің кестем", icon: "calendar" },
    { href: "/teacher/journal", label: "Журнал", icon: "book" },
    { href: "/teacher/gradebook", label: "Бағалар кітабы", icon: "chart" },
    { href: "/teacher/syllabus", label: "Силлабустар", icon: "file" },
    { href: "/teacher/bookings", label: "Брондау", icon: "door" },
  ],
};

const managementGroup: NavGroup = {
  title: "Басқару",
  items: [
    { href: "/academic-director", label: "Статистика", icon: "chart" },
    { href: "/academic-director/timetable", label: "Кесте генераторы", icon: "grid" },
    { href: "/academic-director/certificates", label: "Справкалар", icon: "stethoscope" },
    { href: "/academic-director/syllabi", label: "Силлабус модерациясы", icon: "check" },
    { href: "/academic-director/bookings", label: "Брондау өтінімдері", icon: "door" },
    { href: "/academic-director/parents", label: "Ата-ана PIN-кодтары", icon: "key" },
    { href: "/academic-director/curators", label: "Кураторлар", icon: "usercheck" },
    { href: "/academic-director/groups", label: "Топтар: EduPage ↔ Smart Nation", icon: "users" },
  ],
};

const adminGroup: NavGroup = {
  title: "Админ панель",
  items: [
    { href: "/admin", label: "Шолу", icon: "database" },
    ...ENTITIES.map((e) => ({ href: `/admin/${e.key}`, label: e.label, icon: e.icon })),
    { href: "/admin/import", label: "Excel-ден импорт", icon: "upload" },
    { href: "/admin/audit", label: "Өзгерістер журналы", icon: "history" },
  ],
};

/** Shown only to teachers who curate at least one group. */
export const curatorGroup: NavGroup = {
  title: "Кураторлық",
  items: [
    { href: "/teacher/curator", label: "Шолу", icon: "compass" },
    { href: "/teacher/curator/students", label: "Студенттер", icon: "users" },
    { href: "/teacher/curator/contacts", label: "Байланыс журналы", icon: "message" },
    { href: "/teacher/curator/cycle", label: "Куратор циклы", icon: "repeat" },
    { href: "/teacher/curator/events", label: "Іс-шаралар", icon: "party" },
    { href: "/teacher/curator/guides", label: "Нұсқаулықтар", icon: "info" },
  ],
};

const commonGroup: NavGroup = {
  title: "Ақпарат",
  items: [
    { href: "/announcements", label: "Хабарландырулар", icon: "megaphone" },
    { href: "/rules", label: "Ережелер", icon: "scale" },
  ],
};

export const NAV: Record<Role, NavGroup[]> = {
  STUDENT: [
    {
      title: "Оқу",
      items: [
        { href: "/student", label: "Басты бет", icon: "home" },
        { href: "/student/schedule", label: "Сабақ кестесі", icon: "calendar" },
        { href: "/student/grades", label: "Бағалар журналы", icon: "book" },
        { href: "/student/certificates", label: "Анықтама тапсыру", icon: "stethoscope" },
        { href: "/student/reflection", label: "Рефлексия", icon: "sparkles" },
      ],
    },
    commonGroup,
  ],
  TEACHER: [teacherGroup, commonGroup],
  VICE_PRINCIPAL: [teacherGroup, managementGroup, commonGroup],
  DIRECTOR: [
    { title: "Директор", items: [{ href: "/director", label: "Executive Dashboard", icon: "gauge" }] },
    managementGroup,
    adminGroup,
    { title: "Оқу процесі", items: teacherGroup.items.filter((i) => i.href !== "/teacher") },
    commonGroup,
  ],
  ADMIN: [adminGroup, managementGroup, commonGroup],
  PARENT: [
    {
      title: "Балам",
      items: [
        { href: "/parent", label: "Үлгерім", icon: "home" },
        { href: "/parent/schedule", label: "Сабақ кестесі", icon: "calendar" },
      ],
    },
    { title: "Ақпарат", items: [commonGroup.items[0]] },
  ],
};

/** Role menu, with the curator section after the first group for curators. */
export function navFor(role: Role, isCurator: boolean): NavGroup[] {
  const groups = NAV[role];
  return isCurator ? [groups[0], curatorGroup, ...groups.slice(1)] : groups;
}
