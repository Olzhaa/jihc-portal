import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findConflicts } from "@/lib/schedule";
import { ROLE_LABEL } from "@/lib/roles";
import { ENTITY, ENTITIES, diff, type Change, parseValues, type EntityKey, type RefKind, type RefLabel, type RefOptions, type Row } from "./entities";
import type { ImportResult, ImportRow } from "./import";

/** Әр кестенің Prisma моделі. */
const MODEL: Record<EntityKey, Prisma.ModelName> = {
  users: "User", groups: "Group", courses: "Course", rooms: "Room", lessons: "Schedule", grades: "Grade",
  attendance: "Attendance", syllabi: "Syllabus", certificates: "MedicalCertificate", bookings: "Booking",
  announcements: "Announcement", rules: "Rule",
};

type Delegate = {
  findMany(args: object): Promise<Record<string, unknown>[]>;
  findUnique(args: object): Promise<Record<string, unknown> | null>;
  create(args: object): Promise<Record<string, unknown>>;
  update(args: object): Promise<Record<string, unknown>>;
  delete(args: object): Promise<Record<string, unknown>>;
  count(args?: object): Promise<number>;
};
const delegate = (key: EntityKey) => {
  const name = MODEL[key];
  return (prisma as unknown as Record<string, Delegate>)[name[0].toLowerCase() + name.slice(1)];
};

/** Өріс емес, басқа кестеде сақталатын мәндер. */
const VIRTUAL: Partial<Record<EntityKey, { key: string; include: object; read: (r: Record<string, unknown>) => string[] }>> = {
  users: { key: "childIds", include: { children: { select: { childId: true } } }, read: (r) => ((r.children ?? []) as { childId: string }[]).map((c) => c.childId) },
  announcements: { key: "groupIds", include: { groups: { select: { id: true } } }, read: (r) => ((r.groups ?? []) as { id: string }[]).map((g) => g.id) },
};

const ORDER: Partial<Record<EntityKey, object>> = {
  users: [{ role: "asc" }, { name: "asc" }],
  groups: { name: "asc" },
  courses: { title: "asc" },
  rooms: { name: "asc" },
  lessons: [{ dayOfWeek: "asc" }, { startPeriod: "asc" }],
  grades: { date: "desc" },
  attendance: { date: "desc" },
  syllabi: { updatedAt: "desc" },
  certificates: { createdAt: "desc" },
  bookings: { startTime: "desc" },
  announcements: { createdAt: "desc" },
  rules: { createdAt: "asc" },
};

function serialize(key: EntityKey, r: Record<string, unknown>): Row {
  const v = VIRTUAL[key];
  const out: Record<string, unknown> = { id: r.id };
  for (const f of ENTITY[key].fields) {
    if (v?.key === f.key) continue;
    const x = r[f.key];
    out[f.key] = x instanceof Date ? x.toISOString() : f.key === "dayOfWeek" ? String(x) : x;
  }
  if (v) out[v.key] = v.read(r);
  return out as Row;
}

export async function loadRows(key: EntityKey): Promise<Row[]> {
  const e = ENTITY[key];
  const v = VIRTUAL[key];
  const rows = await delegate(key).findMany({ ...(v ? { include: v.include } : {}), orderBy: ORDER[key], ...(e.limit ? { take: e.limit } : {}) });
  return rows.map((r) => serialize(key, r));
}

export async function loadRefs(): Promise<RefOptions> {
  const [users, groups, courses, rooms] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, role: true, active: true, group: { select: { name: true } } }, orderBy: { name: "asc" } }),
    prisma.group.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.course.findMany({ select: { id: true, code: true, title: true }, orderBy: { title: "asc" } }),
    prisma.room.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const label = (u: (typeof users)[number]) => `${u.name}${u.group ? ` (${u.group.name})` : ""}${u.active ? "" : " — белсенді емес"}`;
  return {
    user: users.map((u) => ({ value: u.id, label: `${u.name} · ${ROLE_LABEL[u.role]}` })),
    student: users.filter((u) => u.role === "STUDENT").map((u) => ({ value: u.id, label: label(u) })),
    staff: users.filter((u) => ["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"].includes(u.role)).map((u) => ({ value: u.id, label: label(u) })),
    parent: users.filter((u) => u.role === "PARENT").map((u) => ({ value: u.id, label: u.name })),
    group: groups.map((g) => ({ value: g.id, label: g.name })),
    course: courses.map((c) => ({ value: c.id, label: c.code ? `${c.code} ${c.title}` : c.title })),
    room: rooms.map((r) => ({ value: r.id, label: r.name })),
  };
}

export function refLabeler(refs: RefOptions): RefLabel {
  const maps = Object.fromEntries(Object.entries(refs).map(([k, l]) => [k, new Map(l.map((o) => [o.value, o.label]))])) as Record<RefKind, Map<string, string>>;
  return (kind, id) => (id ? (maps[kind].get(String(id)) ?? maps.user.get(String(id)) ?? String(id)) : "");
}

export async function counts() {
  const entries = await Promise.all(ENTITIES.map(async (e) => [e.key, await delegate(e.key).count()] as const));
  return Object.fromEntries(entries) as Record<EntityKey, number>;
}

function friendlyError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return `Мұндай мән бұрыннан бар (${[(e.meta?.target as string[] | undefined) ?? []].flat().join(", ")}). Қайталанбауы керек.`;
    if (e.code === "P2003") return "Бұл жазбаға басқа деректер сілтейді (бағалар, кесте т.б.), сондықтан өшіру мүмкін емес. Пайдаланушы болса, «Белсенді» белгісін алып тастаңыз.";
    if (e.code === "P2025") return "Жазба табылмады: басқа біреу өшірген болуы мүмкін. Бетті жаңартыңыз.";
  }
  console.error(e);
  return "Сақтау кезінде қате шықты";
}

export async function saveRecord(key: EntityKey, id: string | null, values: Record<string, unknown>, actorId: string) {
  const e = ENTITY[key];
  const parsed = parseValues(e, values);
  if ("error" in parsed) return { error: parsed.error };
  const data: Record<string, unknown> = { ...parsed.data };
  const v = VIRTUAL[key];
  const virtualIds = v ? (data[v.key] as string[]) : null;
  if (v) delete data[v.key];

  if (key === "lessons") {
    const conflicts = await findConflicts({ id: id ?? undefined, ...(data as { groupId: string; teacherId: string; roomId: string; dayOfWeek: number; startPeriod: number; endPeriod: number }) });
    if (conflicts.length) return { error: `Кесте қақтығысы: ${conflicts.join("; ")}` };
  }
  if (!id && e.authorField && !data[e.authorField]) data[e.authorField] = actorId;
  if (key === "announcements" && virtualIds) data.groups = id ? { set: virtualIds.map((g) => ({ id: g })) } : { connect: virtualIds.map((g) => ({ id: g })) };

  const d = delegate(key);
  const refs = refLabeler(await loadRefs());
  try {
    const before = id ? await d.findUnique({ where: { id }, ...(v ? { include: v.include } : {}) }) : null;
    if (id && !before) return { error: "Жазба табылмады: бетті жаңартыңыз." };
    const saved = await prisma.$transaction(async (tx) => {
      const model = (tx as unknown as Record<string, Delegate>)[MODEL[key][0].toLowerCase() + MODEL[key].slice(1)];
      const rec = id ? await model.update({ where: { id }, data }) : await model.create({ data });
      if (key === "users" && virtualIds) {
        await tx.parentLink.deleteMany({ where: { parentId: String(rec.id) } });
        if (virtualIds.length) await tx.parentLink.createMany({ data: virtualIds.map((childId) => ({ parentId: String(rec.id), childId })) });
      }
      return rec;
    });
    const beforeRow = before ? serialize(key, before) : null;
    const afterRow = { ...parsed.data, ...(v ? { [v.key]: virtualIds } : {}) };
    const changes = diff(e, beforeRow, afterRow, refs);
    if (id && !changes.length) return { ok: true as const };
    await audit(actorId, id ? "UPDATE" : "CREATE", key, String(saved.id), e.title(serialize(key, saved), refs), changes);
    return { ok: true as const };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

export async function deleteRecord(key: EntityKey, id: string, actorId: string) {
  const e = ENTITY[key];
  // User.groupId үнсіз SET NULL болады: студенттер топсыз қалмас үшін алдын ала тоқтатамыз.
  if (key === "groups") {
    const students = await prisma.user.count({ where: { groupId: id } });
    if (students) return { error: `Топта ${students} студент бар. Алдымен оларды басқа топқа ауыстырыңыз немесе белсенді емес етіңіз.` };
  }
  const refs = refLabeler(await loadRefs());
  try {
    const before = await delegate(key).delete({ where: { id } });
    await audit(actorId, "DELETE", key, id, e.title(serialize(key, before), refs), null);
    return { ok: true as const };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

async function audit(userId: string, action: string, entity: string, recordId: string | null, summary: string, changes: object | null) {
  await prisma.auditLog.create({ data: { userId, action, entity, recordId, summary, changes: changes ?? Prisma.JsonNull } });
}

export async function recentAudit(take = 100) {
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take, include: { user: { select: { name: true } } } });
  return rows.map((a) => ({
    id: a.id,
    at: a.createdAt.toISOString(),
    user: a.user?.name ?? null,
    action: a.action,
    entity: a.entity,
    summary: a.summary,
    changes: a.changes as Change[] | null,
  }));
}

/** Импорт: ЖСН немесе пошта бойынша табылса жаңартылады, әйтпесе қосылады. Жоқ топтар құрылады. */
export async function importUsers(rows: ImportRow[], actorId: string): Promise<ImportResult | { error: string }> {
  const valid = rows.filter((r) => !r.error && r.name && (r.iin || r.email));
  try {
    return await prisma.$transaction(
      async (tx) => {
        const groups = new Map((await tx.group.findMany({ select: { id: true, name: true } })).map((g) => [g.name, g.id]));
        const groupsCreated: string[] = [];
        let created = 0;
        let updated = 0;
        for (const r of valid) {
          let groupId: string | null = null;
          if (r.group && r.role === "STUDENT") {
            groupId = groups.get(r.group) ?? null;
            if (!groupId) {
              groupId = (await tx.group.create({ data: { name: r.group } })).id;
              groups.set(r.group, groupId);
              groupsCreated.push(r.group);
            }
          }
          const existing = await tx.user.findFirst({ where: { OR: [...(r.iin ? [{ iin: r.iin }] : []), ...(r.email ? [{ email: r.email }] : [])] } });
          const data = { name: r.name, role: r.role, ...(r.iin ? { iin: r.iin } : {}), ...(r.email ? { email: r.email } : {}), ...(groupId ? { groupId } : {}), active: true };
          if (existing) {
            await tx.user.update({ where: { id: existing.id }, data });
            updated++;
          } else {
            await tx.user.create({ data });
            created++;
          }
        }
        const result = { created, updated, groupsCreated, skipped: rows.length - valid.length };
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: "IMPORT",
            entity: "users",
            summary: `${created} жаңа, ${updated} жаңартылды${groupsCreated.length ? `, топтар: ${groupsCreated.join(", ")}` : ""}`,
            changes: Prisma.JsonNull,
          },
        });
        return result;
      },
      { timeout: 120_000 },
    );
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

/** Дерекқор күйі: көлемі, нұсқасы, соңғы миграция. */
export async function databaseInfo() {
  const [size] = await prisma.$queryRaw<{ size: string; version: string }[]>`select pg_size_pretty(pg_database_size(current_database())) as size, split_part(version(), ' ', 2) as version`;
  const [migration] = await prisma.$queryRaw<{ name: string; at: Date }[]>`select migration_name as name, finished_at as at from _prisma_migrations where finished_at is not null order by finished_at desc limit 1`.catch(() => []);
  return { size: size?.size ?? "?", version: size?.version ?? "?", migration: migration?.name ?? null };
}
