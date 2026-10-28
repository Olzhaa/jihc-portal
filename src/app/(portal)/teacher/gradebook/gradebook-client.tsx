"use client";

import { GradebookTable } from "@/components/gradebook-table";
import { deleteAssignment, saveAssignment, setGrade } from "./actions";

type Props = Omit<React.ComponentProps<typeof GradebookTable>, "actions"> & { courseId: string; groupId: string; editable: boolean };

export function GradebookClient({ courseId, groupId, editable, ...props }: Props) {
  const scope = { courseId, groupId };
  return (
    <GradebookTable
      {...props}
      actions={
        editable
          ? {
              setGrade: (input) => setGrade(scope, input),
              saveAssignment: (input) => saveAssignment(scope, input),
              deleteAssignment: (id) => deleteAssignment(scope, id),
            }
          : undefined
      }
    />
  );
}
