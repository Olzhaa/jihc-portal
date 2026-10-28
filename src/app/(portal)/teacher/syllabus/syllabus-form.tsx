"use client";

import { SyllabusEditor } from "@/components/syllabus-editor";
import { saveSyllabus } from "./actions";

export function SyllabusForm({ courses }: { courses: { id: string; title: string }[] }) {
  return <SyllabusEditor courses={courses} onSave={(d) => saveSyllabus(d)} />;
}
