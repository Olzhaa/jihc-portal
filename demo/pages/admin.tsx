import type { ComponentType } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTable, type AdminResult } from "@/components/admin/admin-table";
import { AdminHome, AuditList, type AuditEntry } from "@/components/admin/admin-home";
import { UserImport } from "@/components/admin/user-import";
import { ENTITIES, ENTITY, diff, type Change, parseValues, type EntityKey, type RefKind, type RefLabel, type RefOptions, type Row } from "@/lib/admin/entities";
import type { ImportResult, ImportRow } from "@/lib/admin/import";
import { ROLE_LABEL } from "@/lib/roles";
import { getDb, mutate, uid, useDb, useSessionUser, type Db, type User } from "../store";
import { findConflicts } from "../queries";

/**
 * Демодағы админ панель: нақты қосымшадағыдай компоненттер, деректер браузердің localStorage-інде.
 * Prisma-ның сыртқы кілт шектеулері мұнда қолмен тексеріледі (DEPENDENTS).
 */

type Rec = Record<string, unknown> & { id: string };
const COLLECTION: Record<EntityKey, keyof Db> = {
  users: "users", groups: "groups", courses: "courses", rooms: "rooms", lessons: "lessons", grades: "grades", attendance: "attendance",
  syllabi: "syllabi", certificates: "certificates", bookings: "bookings", announcements: "announcements", rules: "rules",
};
const list = (d: Db, key: EntityKey) => d[COLLECTION[key]] as unknown as Rec[];

const UNIQUE: Partial<Record<EntityKey, string[]>> = { users: ["email", "iin"], groups: ["name"], rooms: ["name"] };

/** Өшіруге кедергі болатын сілтемелер (нақты дерекқордағы RESTRICT кілттер). */
const DEPENDENTS: Partial<Record<EntityKey, [keyof Db, string][]>> = {
  users: [["lessons", "teacherId"], ["grades", "givenById"], ["attendance", "markedById"], ["syllabi", "authorId"], ["bookings", "userId"], ["announcements", "authorId"], ["rules", "authorId"]],
  courses: [["grades", "courseId"], ["attendance", "courseId"], ["syllabi", "courseId"]],
  rooms: [["lessons", "roomId"], ["bookings", "roomId"]],
};

const DEFAULTS: Partial<Record<EntityKey, () => Record<string, unknown>>> = {
  users: () => ({ email: null, iin: null, groupId: null, parentId: null, pin: null, active: true }),
  courses: () => ({ color: "#93c5fd" }),
  announcements: () => ({ groupIds: [], createdAt: new Date() }),
  rules: () => ({ createdAt: new Date(), updatedAt: new Date() }),
};

function serialize(d: Db, key: EntityKey, r: Rec): Row {
  const out: Row = { id: r.id };
  for (const f of ENTITY[key].fields) {
    const v = r[f.key];
    out[f.key] = v instanceof Date ? v.toISOString() : f.key === "dayOfWeek" ? String(v) : v;
  }
  if (key === "users") out.childIds = d.parentLinks.filter((l) => l.parentId === r.id).map((l) => l.childId);
  return out;
}

function refs(d: Db): RefOptions {
  const users = [...d.users].sort((a, b) => a.name.localeCompare(b.name));
  const group = (u: User) => (u.groupId ? ` (${d.groups.find((g) => g.id === u.groupId)?.name})` : "");
  const label = (u: User) => `${u.name}${group(u)}${u.active ? "" : " — белсенді емес"}`;
  return {
    user: users.map((u) => ({ value: u.id, label: `${u.name} · ${ROLE_LABEL[u.role]}` })),
    student: users.filter((u) => u.role === "STUDENT").map((u) => ({ value: u.id, label: label(u) })),
    staff: users.filter((u) => ["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"].includes(u.role)).map((u) => ({ value: u.id, label: label(u) })),
    parent: users.filter((u) => u.role === "PARENT").map((u) => ({ value: u.id, label: u.name })),
    group: [...d.groups].sort((a, b) => a.name.localeCompare(b.name)).map((g) => ({ value: g.id, label: g.name })),
    course: [...d.courses].sort((a, b) => a.title.localeCompare(b.title)).map((c) => ({ value: c.id, label: c.code ? `${c.code} ${c.title}` : c.title })),
    room: [...d.rooms].sort((a, b) => a.name.localeCompare(b.name)).map((r) => ({ value: r.id, label: r.name })),
  };
}

function labeler(r: RefOptions): RefLabel {
  const maps = Object.fromEntries(Object.entries(r).map(([k, l]) => [k, new Map(l.map((o) => [o.value, o.label]))])) as Record<RefKind, Map<string, string>>;
  return (kind, id) => (id ? (maps[kind].get(String(id)) ?? maps.user.get(String(id)) ?? String(id)) : "");
}

function audit(d: Db, actorId: string | null, action: string, entity: string, recordId: string | null, summary: string, changes: Change[] | null) {
  d.audit.unshift({ id: uid(), at: new Date().toISOString(), userId: actorId, action, entity, summary, changes });
  d.audit.length = Math.min(d.audit.length, 500);
}

function save(key: EntityKey, actorId: string, id: string | null, values: Record<string, unknown>): AdminResult {
  const e = ENTITY[key];
  const parsed = parseValues(e, values);
  if ("error" in parsed) return parsed;
  const data = { ...parsed.data };
  const d = getDb();
  const rows = list(d, key);
  const before = id ? rows.find((r) => r.id === id) : null;
  if (id && !before) return { error: "Жазба табылмады: бетті жаңартыңыз." };
  for (const k of UNIQUE[key] ?? []) {
    if (data[k] && rows.some((r) => r.id !== id && r[k] === data[k])) return { error: `Мұндай мән бұрыннан бар (${k}). Қайталанбауы керек.` };
  }
  if (key === "lessons") {
    const conflicts = findConflicts(d, { id: id ?? undefined, ...(data as Omit<Parameters<typeof findConflicts>[1], "id">) });
    if (conflicts.length) return { error: `Кесте қақтығысы: ${conflicts.join("; ")}` };
  }
  const childIds = key === "users" ? (data.childIds as string[]) : null;
  delete data.childIds;
  if (!id && e.authorField && !data[e.authorField]) data[e.authorField] = actorId;
  if (key === "rules") data.updatedAt = new Date();

  const ref = labeler(refs(d));
  const beforeRow = before ? serialize(d, key, before) : null;
  const changes = diff(e, beforeRow, { ...parsed.data }, ref);
  if (id && !changes.length) return { ok: true };
  mutate((next) => {
    const coll = list(next, key);
    let rec: Rec;
    if (id) {
      rec = coll.find((r) => r.id === id)!;
      Object.assign(rec, data);
    } else {
      rec = { id: uid(), ...(DEFAULTS[key]?.() ?? {}), ...data };
      coll.push(rec);
    }
    if (childIds) {
      next.parentLinks = next.parentLinks.filter((l) => l.parentId !== rec.id).concat(childIds.map((childId) => ({ parentId: rec.id, childId })));
    }
    audit(next, actorId, id ? "UPDATE" : "CREATE", key, rec.id, e.title(serialize(next, key, rec), ref), changes);
  });
  return { ok: true };
}

function remove(key: EntityKey, actorId: string, id: string): AdminResult {
  const d = getDb();
  const students = key === "groups" ? d.users.filter((u) => u.groupId === id).length : 0;
  if (students) return { error: `Топта ${students} студент бар. Алдымен оларды басқа топқа ауыстырыңыз немесе белсенді емес етіңіз.` };
  for (const [coll, field] of DEPENDENTS[key] ?? []) {
    if ((d[coll] as unknown as Rec[]).some((r) => r[field] === id)) {
      return { error: "Бұл жазбаға басқа деректер сілтейді (бағалар, кесте т.б.), сондықтан өшіру мүмкін емес. Пайдаланушы болса, «Белсенді» белгісін алып тастаңыз." };
    }
  }
  const ref = labeler(refs(d));
  mutate((next) => {
    const coll = list(next, key);
    const rec = coll.find((r) => r.id === id);
    if (!rec) return;
    coll.splice(coll.indexOf(rec), 1);
    // Нақты дерекқордағы CASCADE / SET NULL әрекеттері
    if (key === "users") {
      next.parentLinks = next.parentLinks.filter((l) => l.parentId !== id && l.childId !== id);
      next.grades = next.grades.filter((g) => g.studentId !== id);
      next.attendance = next.attendance.filter((a) => a.studentId !== id);
      next.certificates = next.certificates.filter((c) => c.studentId !== id);
      next.groups.forEach((g) => g.curatorId === id && (g.curatorId = null));
      next.rooms.forEach((r) => r.managerId === id && (r.managerId = null));
    }
    if (key === "groups") next.lessons = next.lessons.filter((l) => l.groupId !== id);
    if (key === "courses") next.lessons = next.lessons.filter((l) => l.courseId !== id);
    if (key === "lessons") next.lessonRecords = next.lessonRecords.filter((r) => r.scheduleId !== id);
    audit(next, actorId, "DELETE", key, id, ENTITY[key].title(serialize(d, key, rec), ref), null);
  });
  return { ok: true };
}

function importUsers(actorId: string, rows: ImportRow[]): ImportResult {
  const valid = rows.filter((r) => !r.error && r.name && (r.iin || r.email));
  const result: ImportResult = { created: 0, updated: 0, groupsCreated: [], skipped: rows.length - valid.length };
  mutate((d) => {
    for (const r of valid) {
      let groupId: string | null = null;
      if (r.group && r.role === "STUDENT") {
        groupId = d.groups.find((g) => g.name === r.group)?.id ?? null;
        if (!groupId) {
          groupId = uid();
          d.groups.push({ id: groupId, name: r.group, snationCode: null, curatorId: null });
          result.groupsCreated.push(r.group);
        }
      }
      const existing = d.users.find((u) => (r.iin && u.iin === r.iin) || (r.email && u.email === r.email));
      const data = { name: r.name, role: r.role, ...(r.iin ? { iin: r.iin } : {}), ...(r.email ? { email: r.email } : {}), ...(groupId ? { groupId } : {}), active: true };
      if (existing) {
        Object.assign(existing, data);
        result.updated++;
      } else {
        d.users.push({ id: uid(), email: null, iin: null, groupId: null, parentId: null, pin: null, ...data });
        result.created++;
      }
    }
    const g = result.groupsCreated;
    audit(d, actorId, "IMPORT", "users", null, `${result.created} жаңа, ${result.updated} жаңартылды${g.length ? `, топтар: ${g.join(", ")}` : ""}`, null);
  });
  return result;
}

const auditEntries = (d: Db, n: number): AuditEntry[] =>
  d.audit.slice(0, n).map((a) => ({ ...a, user: d.users.find((u) => u.id === a.userId)?.name ?? null }));

export function Home() {
  const d = useDb();
  const counts = Object.fromEntries(ENTITIES.map((e) => [e.key, list(d, e.key).length])) as Record<EntityKey, number>;
  return (
    <div className="space-y-6">
      <PageHeader title="Админ панель" description="Порталдағы барлық деректер: қосу, өзгерту, өшіру. Әр өзгеріс журналға жазылады." />
      <AdminHome
        counts={counts}
        recent={auditEntries(d, 10)}
        extra={
          <Card>
            <CardHeader>
              <CardTitle>Дерекқор</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Демода деректер осы браузерде сақталады.</p>
              <p>Нақты порталда: колледж серверіндегі PostgreSQL, күн сайынғы резервтік көшірмемен.</p>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}

function entityPage(key: EntityKey): ComponentType {
  return function EntityPage() {
    const d = useDb();
    const me = useSessionUser()!;
    const e = ENTITY[key];
    return (
      <div className="space-y-4">
        <PageHeader title={e.label} description={e.description} />
        <Card>
          <CardContent className="pt-5">
            <AdminTable
              entity={key}
              rows={list(d, key).map((r) => serialize(d, key, r))}
              refs={refs(d)}
              onSave={(id, values) => save(key, me.id, id, values)}
              onDelete={(id) => remove(key, me.id, id)}
            />
          </CardContent>
        </Card>
      </div>
    );
  };
}

export const Entities = Object.fromEntries(ENTITIES.map((e) => [e.key, entityPage(e.key)])) as Record<EntityKey, ComponentType>;

export function Import() {
  const d = useDb();
  const me = useSessionUser()!;
  return (
    <div className="space-y-4">
      <PageHeader title="Excel-ден импорт" description="Студенттер, мұғалімдер немесе ата-аналар тізімін бір рет қойып, барлығын қосу немесе жаңарту." />
      <Card>
        <CardContent className="pt-5">
          <UserImport
            known={{ iins: d.users.flatMap((u) => (u.iin ? [u.iin] : [])), emails: d.users.flatMap((u) => (u.email ? [u.email] : [])) }}
            groups={d.groups.map((g) => g.name)}
            onImport={(rows) => importUsers(me.id, rows)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function Audit() {
  const d = useDb();
  return (
    <div className="space-y-4">
      <PageHeader title="Өзгерістер журналы" description="Админ панельде кім, қашан, нені өзгертті." />
      <Card>
        <CardContent className="pt-5">
          <AuditList entries={auditEntries(d, 300)} />
        </CardContent>
      </Card>
    </div>
  );
}
