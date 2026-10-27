"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnnouncement, type AnnState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function AnnouncementForm({ groups, canBroadcast }: { groups: { id: string; name: string }[]; canBroadcast: boolean }) {
  const [state, action, pending] = useActionState<AnnState, FormData>(createAnnouncement, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="title">Тақырып</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="content">Мәтін</Label>
        <Textarea id="content" name="content" required />
      </div>
      <div className="space-y-1">
        <Label>Кімге</Label>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <label key={g.id} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm">
              <input type="checkbox" name="groups" value={g.id} /> {g.name}
            </label>
          ))}
        </div>
        {canBroadcast && <p className="text-xs text-muted-foreground">Топ таңдалмаса, бүкіл колледжге жарияланады.</p>}
      </div>
      {canBroadcast && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="important" /> Маңызды деп белгілеу
        </label>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">Жарияланды</p>}
      <Button disabled={pending}>Жариялау</Button>
    </form>
  );
}
