import { ArrowLeft } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { login, resetDemo, useDb } from "../store";
import { navigate } from "../router";

const DEMO_EMAILS = ["student@jihc.edu.kz", "teacher@jihc.edu.kz", "zavuch@jihc.edu.kz", "director@jihc.edu.kz", "parent@demo.local"];

export function LoginPage() {
  const db = useDb();
  const [tab, setTab] = useState<"staff" | "parent">("staff");
  const [error, setError] = useState<string | null>(null);
  const demoUsers = DEMO_EMAILS.map((e) => db.users.find((u) => u.email === e)).filter((u) => !!u);

  function enter(id: string) {
    const u = db.users.find((x) => x.id === id)!;
    login(u.id);
    navigate(ROLE_HOME[u.role]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1e3d] via-[#1e3a8a] to-[#1d4ed8] p-4">
      <div className="w-full max-w-md">
        <a href={SITE_URL} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-100 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Басты бетке
        </a>
        <div className="rounded-2xl bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">J</div>
          <h1 className="text-2xl font-bold">JIHC Portal</h1>
          <p className="text-sm text-muted-foreground">Жамбыл инновациялық жоғары колледжі</p>
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Демо нұсқа: деректер ойдан құралған және тек осы браузерде сақталады.
          </p>
        </div>
        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</div>}
        <div className="space-y-5">
          <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
            {(["staff", "parent"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-md py-1.5 font-medium ${tab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                {t === "staff" ? "Студент / Қызметкер" : "Ата-ана"}
              </button>
            ))}
          </div>
          {tab === "staff" ? (
            <div className="space-y-2">
              <Button className="w-full" size="lg" variant="outline" disabled>
                @jihc.edu.kz арқылы кіру
              </Button>
              <p className="text-center text-xs text-muted-foreground">Google арқылы кіру нақты серверде қосылады. Демода төмендегі батырмаларды қолданыңыз.</p>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const id = String(fd.get("identifier")).trim();
                const pin = String(fd.get("pin")).trim();
                const child = db.users.find((u) => u.iin === id);
                const parents = db.users.filter(
                  (u) => u.role === "PARENT" && (u.parentId === id || (child && db.parentLinks.some((l) => l.parentId === u.id && l.childId === child.id))),
                );
                const p = parents.find((u) => u.pin === pin);
                if (p) enter(p.id);
                else setError("ЖСН / Parent ID немесе PIN қате.");
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="identifier">Баланың ЖСН-і немесе Parent ID</Label>
                <Input id="identifier" name="identifier" required defaultValue="070512600123" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pin">PIN-код</Label>
                <Input id="pin" name="pin" type="password" required defaultValue="1234" />
              </div>
              <Button className="w-full">Кіру</Button>
            </form>
          )}
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Демо кіру</p>
            <div className="grid gap-2">
              {demoUsers.map((u) => (
                <Button key={u.id} variant="secondary" size="sm" className="justify-between" onClick={() => enter(u.id)}>
                  <span>{ROLE_LABEL[u.role]}</span>
                  <span className="font-normal opacity-70">{u.name}</span>
                </Button>
              ))}
            </div>
            <button className="mt-3 text-xs text-muted-foreground hover:text-primary" onClick={() => confirmReset()}>
              Демо деректерді бастапқы күйге қайтару
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );

  function confirmReset() {
    resetDemo();
    setError(null);
  }
}
