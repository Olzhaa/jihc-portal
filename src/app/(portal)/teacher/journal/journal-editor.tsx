"use client";

import type { AttendanceStatus, GradeType } from "@prisma/client";
import { JournalForm } from "@/components/journal-form";
import type { JournalColumn } from "@/lib/journal";
import { saveJournal } from "./actions";

export function JournalEditor({
  lessonId,
  date,
  ...props
}: {
  lessonId: string;
  date: string;
  students: { id: string; name: string }[];
  excused: string[];
  status: Record<string, AttendanceStatus>;
  columns: Partial<Record<GradeType, JournalColumn>>;
  record: { topic: string; homework: string };
  planTopics: { chapter: string; topic: string }[];
}) {
  return <JournalForm {...props} onSave={(p) => saveJournal({ ...p, lessonId, date })} />;
}
