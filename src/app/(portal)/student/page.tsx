import { requireUser } from "@/lib/auth";
import { studentOverview } from "@/lib/student";
import { PageHeader } from "@/components/page-header";
import { OverviewStats, OverviewWidgets } from "@/components/student-views";

export default async function StudentDashboard() {
  const user = await requireUser(["STUDENT"]);
  const o = await studentOverview(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title={`Сәлем, ${o.student.name.split(" ")[0]}!`} description={`${o.student.group?.name ?? ""} тобы`} />
      <OverviewStats o={o} />
      <OverviewWidgets o={o} scheduleHref="/student/schedule" gradesHref="/student/grades" />
    </div>
  );
}
