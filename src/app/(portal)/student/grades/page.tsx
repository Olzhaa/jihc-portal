import { requireUser } from "@/lib/auth";
import { studentGradebook } from "@/lib/student";
import { PageHeader } from "@/components/page-header";
import { GradebookView } from "@/components/student-views";
import { StudentFinalResults } from "@/components/final-results";
import { academicYearStart } from "@/lib/assessment";
import { yearLabel } from "@/lib/results";
import { loadResults } from "@/lib/results-server";

export default async function StudentGrades() {
  const user = await requireUser(["STUDENT"]);
  const year = academicYearStart();
  const [book, final] = await Promise.all([studentGradebook(user.id), loadResults({ studentId: user.id }, year)]);
  return (
    <div>
      <PageHeader title="Бағалар журналы" description="Ағымдағы, аралық және сессиялық бағалар (100 балдық шкала)" />
      {final.results.courses.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Қорытынды бағалар · {yearLabel(year)}</h2>
          <StudentFinalResults results={final.results} passMark={final.config.passMark} />
        </section>
      )}
      <GradebookView book={book} />
    </div>
  );
}
