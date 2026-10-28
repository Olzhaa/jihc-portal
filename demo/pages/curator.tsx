import { PageHeader } from "@/components/page-header";
import { CuratorRoot } from "@/components/curator/context";
import { Overview } from "@/components/curator/overview";
import { StudentPage, Students as StudentsView } from "@/components/curator/students";
import { Contacts as ContactsView } from "@/components/curator/journal";
import { Cycle as CycleView } from "@/components/curator/cycle";
import { Events as EventsView } from "@/components/curator/events";
import { Guides as GuidesView } from "@/components/curator/guides";
import { CuratorAssign } from "@/components/curator/assign";
import { ReflectionPage } from "@/components/curator/reflection";
import {
  REFLECTION_FIELDS, STUDENT_KINDS, groupCourse, isoToday, parseFields, parseRecord, semesterLabel, studentStats, templateTasks,
  type CuratorApi, type CuratorRecord, type RecordKind, type Reflection, type Workspace,
} from "@/lib/curator";
import { STAFF_ROLES } from "@/lib/roles";
import { getDb, mutate, uid, useDb, type CuratorData, type Db } from "../store";
import { byId } from "../queries";
import { useRoute } from "../router";
import { useMe } from "../hooks";

// Ports of src/lib/curator-server.ts and the curator server actions onto the in-browser database.

const LIST: Record<Exclude<RecordKind, "profile">, Exclude<keyof CuratorData, "profiles">> = {
  guardian: "guardians", contact: "contacts", task: "tasks", event: "events", achievement: "achievements", book: "books", test: "tests",
};

export const isCurator = (db: Db, userId: string) => db.groups.some((g) => g.curatorId === userId);

function workspaceFor(db: Db, userId: string, groupId: string | null): Workspace | null {
  const groups = db.groups.filter((g) => g.curatorId === userId).sort((a, b) => a.name.localeCompare(b.name));
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  if (!group) return null;
  const students = db.users.filter((u) => u.role === "STUDENT" && u.active && u.groupId === group.id).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(students.map((s) => s.id));
  const c = db.curator;
  const mine = (xs: CuratorRecord[]) => xs.filter((x) => ids.has(x.studentId as string));
  const byDate = (k: string) => (a: CuratorRecord, b: CuratorRecord) => String(b[k] ?? "").localeCompare(String(a[k] ?? ""));
  const course = (id: string) => byId(db.courses, id)?.title ?? "";
  const stats = studentStats(
    [...ids],
    db.grades.filter((g) => ids.has(g.studentId)).map((g) => ({ studentId: g.studentId, course: course(g.courseId), value: g.value })),
    db.attendance.filter((a) => ids.has(a.studentId)).map((a) => ({ studentId: a.studentId, course: course(a.courseId), status: a.status })),
  );
  return {
    group: { id: group.id, name: group.name, course: groupCourse(group.name) },
    groups: groups.map((g) => ({ id: g.id, name: g.name })),
    students: students.map((s) => ({ id: s.id, name: s.name, email: s.email, iin: s.iin, profile: c.profiles[s.id] ?? {}, ...stats.get(s.id)! })),
    guardians: mine(c.guardians),
    contacts: mine(c.contacts).sort(byDate("date")),
    tasks: c.tasks.filter((t) => t.groupId === group.id),
    events: c.events.filter((e) => e.groupId === group.id).sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? ""))),
    achievements: mine(c.achievements).sort(byDate("date")),
    books: mine(c.books).sort(byDate("startedAt")),
    tests: mine(c.tests).sort(byDate("date")),
    reflections: mine(c.reflections).sort(byDate("createdAt")) as Reflection[],
  };
}

function curatorApi(userId: string): CuratorApi {
  const check = (groupId: string) => {
    const db = getDb();
    const group = db.groups.find((g) => g.id === groupId);
    if (!group || group.curatorId !== userId) return null;
    return new Set(db.users.filter((u) => u.role === "STUDENT" && u.active && u.groupId === groupId).map((u) => u.id));
  };
  const owns = (kind: RecordKind, row: CuratorRecord | undefined, groupId: string, ids: Set<string>) =>
    !!row && (STUDENT_KINDS.includes(kind) ? ids.has(row.studentId as string) : row.groupId === groupId);

  return {
    async save(kind, groupId, data) {
      const ids = check(groupId);
      if (!ids) return { error: "Сіз бұл топтың кураторы емессіз" };
      const parsed = parseRecord(kind, data);
      if (!parsed.ok) return { error: parsed.error };
      const value = parsed.value;
      if (STUDENT_KINDS.includes(kind) && !ids.has(value.studentId as string)) return { error: "Студент бұл топта емес" };
      if (kind === "event") value.responsibleIds = (value.responsibleIds as string[]).filter((id) => ids.has(id));
      if (kind === "profile") {
        const { studentId, ...rest } = value;
        mutate((d) => void (d.curator.profiles[studentId as string] = rest));
        return { ok: true };
      }
      const list = LIST[kind];
      const id = typeof data.id === "string" && data.id ? data.id : null;
      if (id && !owns(kind, getDb().curator[list].find((r) => r.id === id), groupId, ids)) return { error: "Жазба табылмады" };
      mutate((d) => {
        if (id) d.curator[list] = d.curator[list].map((r) => (r.id === id ? { ...r, ...value } : r));
        else d.curator[list].push({ ...value, id: uid(), ...(kind === "contact" ? { authorId: userId } : {}), ...(STUDENT_KINDS.includes(kind) ? {} : { groupId }) });
      });
      return { ok: true };
    },
    async remove(kind, groupId, id) {
      const ids = check(groupId);
      if (!ids || kind === "profile") return { error: "Рұқсат жоқ" };
      const list = LIST[kind];
      if (!owns(kind, getDb().curator[list].find((r) => r.id === id), groupId, ids)) return { error: "Жазба табылмады" };
      mutate((d) => void (d.curator[list] = d.curator[list].filter((r) => r.id !== id)));
      return { ok: true };
    },
    async loadTemplate(groupId) {
      if (!check(groupId)) return { error: "Сіз бұл топтың кураторы емессіз" };
      if (getDb().curator.tasks.some((t) => t.groupId === groupId)) return { error: "Цикл бос емес" };
      mutate((d) => void d.curator.tasks.push(...templateTasks().map((t) => ({ ...t, id: uid(), groupId }))));
      return { ok: true };
    },
  };
}

function Workspace({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const db = useDb();
  const { query } = useRoute();
  const ws = workspaceFor(db, me.id, query.get("g"));
  if (!ws) return <PageHeader title="Кураторлық" description="Сіз әлі ешбір топтың кураторы емессіз. Топқа куратор тағайындауды завуч жасайды." />;
  return <CuratorRoot ws={ws} api={curatorApi(me.id)}>{children}</CuratorRoot>;
}

export const Home = () => <Workspace><Overview /></Workspace>;
export const Students = () => <Workspace><StudentsView initialFilter={useRoute().query.get("filter")} /></Workspace>;
export const Student = () => <Workspace><StudentPage studentId={useRoute().query.get("id")} /></Workspace>;
export const Contacts = () => <Workspace><ContactsView initialTab={useRoute().query.get("tab")} /></Workspace>;
export const Cycle = () => <Workspace><CycleView /></Workspace>;
export const Events = () => <Workspace><EventsView /></Workspace>;
export const Guides = () => <GuidesView />;

export function Curators() {
  const db = useDb();
  return (
    <CuratorAssign
      groups={[...db.groups].sort((a, b) => a.name.localeCompare(b.name)).map((g) => ({
        id: g.id, name: g.name, curatorId: g.curatorId, students: db.users.filter((u) => u.role === "STUDENT" && u.active && u.groupId === g.id).length,
      }))}
      teachers={db.users.filter((u) => STAFF_ROLES.includes(u.role)).sort((a, b) => a.name.localeCompare(b.name))}
      onAssign={async (groupId, teacherId) => {
        mutate((d) => void (d.groups.find((g) => g.id === groupId)!.curatorId = teacherId));
        return { ok: true };
      }}
    />
  );
}

export function Reflection() {
  const me = useMe();
  const db = useDb();
  const group = byId(db.groups, me.groupId);
  const semester = semesterLabel(group ? groupCourse(group.name) : null);
  const items = db.curator.reflections.filter((r) => r.studentId === me.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return (
    <ReflectionPage
      semester={semester}
      curator={byId(db.users, group?.curatorId)?.name ?? null}
      items={items as Reflection[]}
      onSubmit={async (v) => {
        const parsed = parseFields(REFLECTION_FIELDS, v);
        if (!parsed.ok) return { error: parsed.error };
        if (items.some((r) => r.semester === semester)) return { error: "Осы семестрдің рефлексиясы бұрын жіберілген" };
        mutate((d) => void d.curator.reflections.push({ ...parsed.value, id: uid(), studentId: me.id, semester, createdAt: isoToday() }));
        return { ok: true };
      }}
    />
  );
}
