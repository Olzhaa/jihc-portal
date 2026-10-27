"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitCertificate, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CertificateForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitCertificate, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="startDate">Қай күннен</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate">Қай күнге дейін</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="file">Анықтама файлы</Label>
        <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required className="py-1.5" />
        <p className="text-xs text-muted-foreground">PDF, PNG немесе JPG, ең көбі 5 МБ</p>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">Анықтама жіберілді. Завуч тексергенше «Күтуде» статусында болады.</p>}
      <Button disabled={pending}>{pending ? "Жіберілуде…" : "Жіберу"}</Button>
    </form>
  );
}
