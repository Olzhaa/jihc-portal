"use client";

import { useActionState } from "react";
import { addLesson, type LessonState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { BELLS, DAYS } from "@/lib/bells";

type Opt = { id: string; name: string };

export function LessonForm({ groupId, courses, teachers, rooms }: { groupId: string; courses: Opt[]; teachers: Opt[]; rooms: Opt[] }) {
  const [state, action, pending] = useActionState<LessonState, FormData>(addLesson, {});
  const v = state.values ?? {};
  return (
    <form key={JSON.stringify(v)} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="groupId" value={groupId} />
      <Field label="Пән" name="courseId" options={courses} value={v.courseId} />
      <Field label="Мұғалім" name="teacherId" options={teachers} value={v.teacherId} />
      <Field label="Аудитория" name="roomId" options={rooms} value={v.roomId} />
      <div className="space-y-1">
        <Label>Күні</Label>
        <Select name="dayOfWeek" defaultValue={v.dayOfWeek}>
          {DAYS.map((d) => (
            <option key={d.n} value={d.n}>
              {d.long}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Басталуы (қоңырау)</Label>
        <Select name="startPeriod" defaultValue={v.startPeriod}>
          {BELLS.map((b) => (
            <option key={b.n} value={b.n}>
              {b.n} · {b.start}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Аяқталуы (қоңырау)</Label>
        <Select name="endPeriod" defaultValue={v.endPeriod ?? 2}>
          {BELLS.map((b) => (
            <option key={b.n} value={b.n}>
              {b.n} · {b.end}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-3 sm:col-span-2">
        <Button disabled={pending}>Сабақ қосу</Button>
        {state.conflicts && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="force" /> Қақтығысқа қарамай қосу
          </label>
        )}
      </div>
      {state.error && <p className="text-sm text-red-600 sm:col-span-full">{state.error}</p>}
      {state.conflicts && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300 sm:col-span-full">
          <b>Қақтығыс табылды:</b>
          <ul className="mt-1 list-disc pl-5">
            {state.conflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {state.ok && <p className="text-sm text-emerald-600 sm:col-span-full">Сабақ қосылды</p>}
    </form>
  );
}

function Field({ label, name, options, value }: { label: string; name: string; options: Opt[]; value?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select name={name} defaultValue={value} required>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
