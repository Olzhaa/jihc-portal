import { ArrowLeft } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { redirect } from "next/navigation";
import { getSessionUser, demoLoginEnabled } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { LoginForms } from "./login-forms";

const ERRORS: Record<string, string> = {
  domain: "Тек @jihc.edu.kz корпоративтік поштасымен кіруге болады.",
  unknown: "Бұл пошта жүйеде тіркелмеген. Колледж әкімшілігіне хабарласыңыз.",
  CredentialsSignin: "ЖСН / Parent ID немесе PIN қате.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const { error } = await searchParams;

  const demoUsers = demoLoginEnabled
    ? await prisma.user.findMany({
        where: { email: { in: ["student@jihc.edu.kz", "teacher@jihc.edu.kz", "zavuch@jihc.edu.kz", "director@jihc.edu.kz", "parent@demo.local"] } },
        orderBy: { role: "asc" },
      })
    : [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1e3d] via-[#1e3a8a] to-[#1d4ed8] p-4">
      <div className="w-full max-w-md">
        <a href={SITE_URL} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-100 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Басты бетке
        </a>
        <div className="rounded-2xl bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            J
          </div>
          <h1 className="text-2xl font-bold">JIHC Portal</h1>
          <p className="text-sm text-muted-foreground">Жамбыл инновациялық жоғары колледжі</p>
        </div>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {ERRORS[error] ?? "Кіру кезінде қате шықты."}
          </div>
        )}
        <LoginForms
          googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)}
          demoUsers={demoUsers.map((u) => ({ email: u.email!, name: u.name, role: ROLE_LABEL[u.role] }))}
        />
        </div>
      </div>
    </div>
  );
}
