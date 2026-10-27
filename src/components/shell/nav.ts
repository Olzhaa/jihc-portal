import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

const teacherGroup: NavGroup = {
  title: "Оқу процесі",
  items: [
    { href: "/teacher", label: "Басты бет", icon: "home" },
    { href: "/teacher/schedule", label: "Менің кестем", icon: "calendar" },
    { href: "/teacher/journal", label: "Журнал", icon: "book" },
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
      ],
    },
    commonGroup,
  ],
  TEACHER: [teacherGroup, commonGroup],
  VICE_PRINCIPAL: [teacherGroup, managementGroup, commonGroup],
  DIRECTOR: [
    { title: "Директор", items: [{ href: "/director", label: "Executive Dashboard", icon: "gauge" }, { href: "/director/users", label: "Пайдаланушылар", icon: "users" }] },
    managementGroup,
    { title: "Оқу процесі", items: teacherGroup.items.filter((i) => i.href !== "/teacher") },
    commonGroup,
  ],
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
