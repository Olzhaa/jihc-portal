import { ArrowLeft } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { redirect } from "next/navigation";
import { getSessionUser, demoLoginEnabled } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { LoginForms } from "./login-forms";
import { JihcLogo } from "@/components/jihc-logo";

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
    <div className="login-stage flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href={SITE_URL} className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-sm font-medium text-blue-100 ring-1 ring-inset ring-white/10 transition-colors duration-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Басты бетке
        </a>
        <div className="rounded-[2rem] bg-white/[0.06] p-1.5 ring-1 ring-inset ring-white/10">
        <div className="rounded-[calc(2rem-0.375rem)] bg-card p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_32px_64px_-24px_rgba(0,0,0,0.6)] md:p-8">
        <div className="mb-6 text-center">
          <JihcLogo className="mx-auto mb-3 h-20 w-20 text-foreground" />
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">JIHC Portal</h1>
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
    </div>
  );
}
