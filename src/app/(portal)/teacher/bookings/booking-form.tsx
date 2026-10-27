"use client";

import { useActionState } from "react";
import { createBooking, type BookingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function BookingForm({ rooms, today }: { rooms: { id: string; name: string; kind: string; capacity: number | null; manager: string | null }[]; today: string }) {
  const [state, action, pending] = useActionState<BookingState, FormData>(createBooking, {});
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="roomId">Бөлме</Label>
        <Select id="roomId" name="roomId" required>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.kind}){r.capacity ? ` · ${r.capacity} орын` : ""}{r.manager ? ` · бекітеді: ${r.manager}` : ""}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="date">Күні</Label>
          <Input id="date" name="date" type="date" min={today} defaultValue={today} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="from">Басталуы</Label>
          <Input id="from" name="from" type="time" defaultValue="14:00" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">Аяқталуы</Label>
          <Input id="to" name="to" type="time" defaultValue="15:00" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="reason">Мақсаты</Label>
        <Textarea id="reason" name="reason" required placeholder="мысалы, ата-аналар жиналысы" />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">{state.ok}</p>}
      <Button disabled={pending}>Өтінім беру</Button>
    </form>
  );
}
