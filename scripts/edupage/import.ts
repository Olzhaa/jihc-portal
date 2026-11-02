// EduPage экспортын нақты дерекқорға жүктейді.
//
//   npm run db:import:edupage -- data/edupage            # импорт
//   npm run db:import:edupage -- data/edupage --dry-run  # тек санын көрсетеді, ештеңе жазбайды
//   npm run db:import:edupage -- data/edupage --prune    # EduPage-те жоқ сабақтарды кестеден өшіреді
//
// Қайта іске қосуға болады: жазбалар edupageId арқылы табылып жаңартылады.
// Порталда өзгертілген өрістер (рөл, пошта, ЖСН, бөлме түрі, куратор, Smart Nation коды) қайта жазылмайды.
// Нақты дерекқор файлдары (data/) git-ке түспейді.
import { PrismaClient } from "@prisma/client";
import { suggestSnationCode } from "../../src/lib/assessment";
import { parseExport } from "./parse";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--")) ?? "data/edupage";
const dryRun = args.includes("--dry-run");
const prune = args.includes("--prune");

const PALETTE = ["#f28b82", "#fbbc04", "#fff475", "#ccff90", "#a7ffeb", "#cbf0f8", "#aecbfa", "#d7aefb", "#fdcfe8", "#e6c9a8"];

async function main() {
  const data = parseExport(dir);
  const counts = {
    мұғалімдер: data.teachers.length,
    топтар: data.groups.length,
    пәндер: data.courses.length,
    кабинеттер: data.rooms.length,
    студенттер: data.students.length,
    сабақтар: data.lessons.length,
  };
  console.table(counts);
  for (const w of data.warnings.slice(0, 30)) console.warn("!", w);
  if (data.warnings.length > 30) console.warn(`! тағы ${data.warnings.length - 30} ескерту`);
  if (dryRun) return;

  const prisma = new PrismaClient();
  try {
    const teacherIds = new Map<string, string>();
    for (const t of data.teachers) {
      const email = t.email?.toLowerCase() ?? null;
      // Әкімші бұрын поштасымен қосқан мұғалім болса, соны EduPage-ке байлаймыз.
      const existing = await prisma.user.findFirst({
        where: { OR: [{ edupageId: t.edupageId }, ...(email ? [{ email }] : [])] },
      });
      const u = existing
        ? await prisma.user.update({ where: { id: existing.id }, data: { edupageId: t.edupageId, name: t.name, email: existing.email ?? email } })
        : await prisma.user.create({ data: { edupageId: t.edupageId, name: t.name, role: "TEACHER", email } });
      teacherIds.set(t.edupageId, u.id);
    }

    const groupIds = new Map<string, string>();
    for (const g of data.groups) {
      // Демо дерекқорда сол атаумен топ болса, соны EduPage-ке байлаймыз.
      const existing = await prisma.group.findFirst({ where: { OR: [{ edupageId: g.edupageId }, { name: g.name }] } });
      const curatorId = g.curatorEdupageId ? teacherIds.get(g.curatorEdupageId) ?? null : null;
      const row = existing
        ? await prisma.group.update({
            where: { id: existing.id },
            data: { edupageId: g.edupageId, name: g.name, curatorId: existing.curatorId ?? curatorId },
          })
        : await prisma.group.create({
            data: { edupageId: g.edupageId, name: g.name, snationCode: suggestSnationCode(g.name), curatorId },
          });
      groupIds.set(g.edupageId, row.id);
    }

    const courseIds = new Map<string, string>();
    for (const [i, c] of data.courses.entries()) {
      const color = c.color && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : PALETTE[i % PALETTE.length];
      const row = await prisma.course.upsert({
        where: { edupageId: c.edupageId },
        update: { code: c.code, title: c.title },
        create: { edupageId: c.edupageId, code: c.code, title: c.title, color },
      });
      courseIds.set(c.edupageId, row.id);
    }

    const roomIds = new Map<string, string>();
    for (const r of data.rooms) {
      const existing = await prisma.room.findFirst({ where: { OR: [{ edupageId: r.edupageId }, { name: r.name }] } });
      const row = existing
        ? await prisma.room.update({ where: { id: existing.id }, data: { edupageId: r.edupageId, name: r.name } })
        : await prisma.room.create({ data: { edupageId: r.edupageId, name: r.name, type: r.type } });
      roomIds.set(r.edupageId, row.id);
    }
    // Кабинеті көрсетілмеген сабақтар (дене шынықтыру, т.б.) үшін.
    const noRoom = await prisma.room.upsert({
      where: { name: "Кабинет көрсетілмеген" },
      update: {},
      create: { name: "Кабинет көрсетілмеген", type: "CLASSROOM" },
    });

    for (const s of data.students) {
      const groupId = s.groupEdupageId ? groupIds.get(s.groupEdupageId) ?? null : null;
      await prisma.user.upsert({
        where: { edupageId: s.edupageId },
        update: { name: s.name, groupId },
        create: { edupageId: s.edupageId, name: s.name, role: "STUDENT", groupId },
      });
    }

    const seen = new Set<string>();
    let skipped = 0;
    for (const l of data.lessons) {
      const groupId = groupIds.get(l.groupEdupageId);
      const courseId = courseIds.get(l.courseEdupageId);
      const teacherId = teacherIds.get(l.teacherEdupageId);
      if (!groupId || !courseId || !teacherId) {
        skipped++;
        continue;
      }
      const fields = {
        groupId,
        courseId,
        teacherId,
        roomId: (l.roomEdupageId && roomIds.get(l.roomEdupageId)) || noRoom.id,
        dayOfWeek: l.dayOfWeek,
        startPeriod: l.startPeriod,
        endPeriod: l.endPeriod,
      };
      await prisma.schedule.upsert({ where: { edupageId: l.edupageId }, update: fields, create: { edupageId: l.edupageId, ...fields } });
      seen.add(l.edupageId);
    }
    if (skipped) console.warn(`! ${skipped} сабақ өткізілді (топ/пән/мұғалім табылмады)`);

    if (prune) {
      const stale = await prisma.schedule.deleteMany({ where: { edupageId: { not: null, notIn: [...seen] } } });
      console.log(`EduPage-те жоқ ${stale.count} сабақ өшірілді`);
    }
    console.log("Импорт аяқталды.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
