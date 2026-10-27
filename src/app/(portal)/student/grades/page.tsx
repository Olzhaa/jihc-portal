import { requireUser } from "@/lib/auth";
import { studentGradebook } from "@/lib/student";
import { PageHeader } from "@/components/page-header";
import { GradebookView } from "@/components/student-views";

export default async function StudentGrades() {
  const user = await requireUser(["STUDENT"]);
  const book = await studentGradebook(user.id);
  return (
    <div>
      <PageHeader title="Бағалар журналы" description="Ағымдағы, аралық және сессиялық бағалар (100 балдық шкала)" />
      <GradebookView book={book} />
    </div>
  );
}
