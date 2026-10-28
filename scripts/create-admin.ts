/**
 * Алғашқы нақты әкімшіні құру немесе бар қызметкерді әкімші ету.
 *   docker compose exec app npm run admin:create -- it@jihc.edu.kz "Аты-жөні"
 * Әкімші сосын Google (@jihc.edu.kz) арқылы кіреді; қалғанын админ панельде жасайды.
 */
import { PrismaClient } from "@prisma/client";

const [email, ...nameParts] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error('Қолдану: npm run admin:create -- <пошта> "<Аты-жөні>"');
  process.exit(1);
}

const prisma = new PrismaClient();
const name = nameParts.join(" ") || email.split("@")[0];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "ADMIN", active: true },
    create: { email: email.toLowerCase(), name, role: "ADMIN" },
  });
  console.log(`Әкімші дайын: ${user.name} <${user.email}>`);
}

main().finally(() => prisma.$disconnect());
