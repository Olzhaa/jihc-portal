import type { ComponentType } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { navFor } from "@/components/shell/nav";
import { ROLE_HOME, ROLE_LABEL, SECTION_ROLES } from "@/lib/roles";
import { useRoute } from "./router";
import { useDb, useSessionUser } from "./store";
import { LoginPage } from "./pages/login";
import * as student from "./pages/student";
import * as teacher from "./pages/teacher";
import * as manager from "./pages/manager";
import * as director from "./pages/director";
import * as parent from "./pages/parent";
import * as common from "./pages/common";
import * as curator from "./pages/curator";
import * as admin from "./pages/admin";

const ROUTES: Record<string, ComponentType> = {
  "/student": student.Dashboard,
  "/student/schedule": student.Schedule,
  "/student/grades": student.Grades,
  "/student/certificates": student.Certificates,
  "/student/reflection": curator.Reflection,
  "/teacher": teacher.Dashboard,
  "/teacher/schedule": teacher.Schedule,
  "/teacher/journal": teacher.Journal,
  "/teacher/gradebook": teacher.Gradebook,
  "/teacher/syllabus": teacher.Syllabus,
  "/teacher/bookings": teacher.Bookings,
  "/teacher/curator": curator.Home,
  "/teacher/curator/students": curator.Students,
  "/teacher/curator/students/view": curator.Student,
  "/teacher/curator/contacts": curator.Contacts,
  "/teacher/curator/cycle": curator.Cycle,
  "/teacher/curator/events": curator.Events,
  "/teacher/curator/guides": curator.Guides,
  "/academic-director": manager.Stats,
  "/academic-director/timetable": manager.Timetable,
  "/academic-director/certificates": manager.Certificates,
  "/academic-director/syllabi": manager.Syllabi,
  "/academic-director/bookings": manager.Bookings,
  "/academic-director/parents": manager.ParentPins,
  "/academic-director/groups": manager.Groups,
  "/academic-director/curators": curator.Curators,
  "/director": director.Dashboard,
  "/director/users": director.Users,
  "/admin": admin.Home,
  ...Object.fromEntries(Object.entries(admin.Entities).map(([k, Page]) => [`/admin/${k}`, Page])),
  "/admin/import": admin.Import,
  "/admin/audit": admin.Audit,
  "/parent": parent.Home,
  "/parent/schedule": parent.Schedule,
  "/announcements": common.Announcements,
  "/rules": common.Rules,
};

export function App() {
  const { path } = useRoute();
  const user = useSessionUser();
  const db = useDb();

  if (!user || path === "/login") return <LoginPage />;

  const section = Object.keys(SECTION_ROLES).find((s) => path === s || path.startsWith(`${s}/`));
  const Page = ROUTES[path];
  if (!Page || (section && !SECTION_ROLES[section].includes(user.role))) {
    queueMicrotask(() => (location.hash = ROLE_HOME[user.role]));
    return null;
  }
  return (
    <Sidebar groups={navFor(user.role, curator.isCurator(db, user.id))} userName={user.name} roleLabel={ROLE_LABEL[user.role]}>
      <Page key={path} />
    </Sidebar>
  );
}
