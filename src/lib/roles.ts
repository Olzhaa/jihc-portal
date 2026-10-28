import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Студент",
  TEACHER: "Мұғалім",
  VICE_PRINCIPAL: "Завуч",
  DIRECTOR: "Директор",
  PARENT: "Ата-ана",
  ADMIN: "Әкімші",
};

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  VICE_PRINCIPAL: "/academic-director",
  DIRECTOR: "/director",
  PARENT: "/parent",
  ADMIN: "/admin",
};

/** Which roles may open each top-level section. Director and the system administrator have full access. */
export const SECTION_ROLES: Record<string, Role[]> = {
  "/student": ["STUDENT"],
  "/teacher": ["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"],
  "/academic-director": ["VICE_PRINCIPAL", "DIRECTOR", "ADMIN"],
  "/director": ["DIRECTOR"],
  "/parent": ["PARENT"],
  "/admin": ["ADMIN", "DIRECTOR"],
};

export const STAFF_ROLES: Role[] = ["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"];
export const MANAGER_ROLES: Role[] = ["VICE_PRINCIPAL", "DIRECTOR", "ADMIN"];
/** Админ панель: барлық кестені өзгерте алады. */
export const ADMIN_ROLES: Role[] = ["ADMIN", "DIRECTOR"];
