import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Студент",
  TEACHER: "Мұғалім",
  VICE_PRINCIPAL: "Завуч",
  DIRECTOR: "Директор",
  PARENT: "Ата-ана",
};

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  VICE_PRINCIPAL: "/academic-director",
  DIRECTOR: "/director",
  PARENT: "/parent",
};

/** Which roles may open each top-level section. Director has full access. */
export const SECTION_ROLES: Record<string, Role[]> = {
  "/student": ["STUDENT"],
  "/teacher": ["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"],
  "/academic-director": ["VICE_PRINCIPAL", "DIRECTOR"],
  "/director": ["DIRECTOR"],
  "/parent": ["PARENT"],
};

export const STAFF_ROLES: Role[] = ["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"];
export const MANAGER_ROLES: Role[] = ["VICE_PRINCIPAL", "DIRECTOR"];
