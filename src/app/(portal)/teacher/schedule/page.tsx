import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { lessonsForTeacher } from "@/lib/schedule";
import { PageHeader } from "@/components/page-header";
import { Timetable } from "@/components/timetable";
import { isoWeekday } from "@/lib/utils";

export default async function TeacherSchedule() {
  const user = await requireUser(["TEACHER", "VICE_PRINCIPAL", "DIRECTOR"]);
  const lessons = await lessonsForTeacher(user.id);
  return (
    <div>
      <PageHeader title="Менің кестем" description={user.name ?? ""} />
      <Timetable
        lessons={lessons}
        today={isoWeekday(new Date())}
        renderAction={(l) => (
          <Link href={`/teacher/journal?lesson=${l.id}`} className="shrink-0 rounded bg-white/70 px-1 font-semibold hover:bg-white">
            Журнал
          </Link>
        )}
      />
    </div>
  );
}
