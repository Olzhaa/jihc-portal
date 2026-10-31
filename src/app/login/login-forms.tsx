"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForms({
  googleEnabled,
  demoUsers,
}: {
  googleEnabled: boolean;
  demoUsers: { email: string; name: string; role: string }[];
}) {
  const [tab, setTab] = useState<"staff" | "parent">("staff");
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
        {(["staff", "parent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 font-medium transition-all duration-500 ease-spring ${tab === t ? "bg-card shadow-[0_1px_2px_rgba(15,23,42,0.08),0_4px_12px_-4px_rgba(15,23,42,0.12)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "staff" ? "Студент / Қызметкер" : "Ата-ана"}
          </button>
        ))}
      </div>

      {tab === "staff" ? (
        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            disabled={!googleEnabled}
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <GoogleIcon /> @jihc.edu.kz арқылы кіру
          </Button>
          {!googleEnabled && (
            <p className="text-center text-xs text-muted-foreground">Google OAuth әлі бапталмаған (GOOGLE_CLIENT_ID).</p>
          )}
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setPending(true);
            signIn("parent", { identifier: fd.get("identifier"), pin: fd.get("pin"), callbackUrl: "/parent" });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="identifier">Баланың ЖСН-і немесе Parent ID</Label>
            <Input id="identifier" name="identifier" required inputMode="numeric" autoComplete="username" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pin">PIN-код</Label>
            <Input id="pin" name="pin" type="password" required autoComplete="current-password" />
          </div>
          <Button className="w-full" disabled={pending}>
            Кіру
          </Button>
        </form>
      )}

      {demoUsers.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Демо кіру</p>
          <div className="grid gap-2">
            {demoUsers.map((u) => (
              <Button
                key={u.email}
                variant="secondary"
                size="sm"
                className="justify-between"
                onClick={() => signIn("demo", { email: u.email, callbackUrl: "/" })}
              >
                <span>{u.role}</span>
                <span className="font-normal opacity-70">{u.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
