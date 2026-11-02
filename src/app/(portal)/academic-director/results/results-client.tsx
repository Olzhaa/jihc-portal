"use client";

import { FinalResultsTable } from "@/components/final-results";
import { lockResults, setFinalGrade, unlockResults } from "./actions";

type Props = Omit<React.ComponentProps<typeof FinalResultsTable>, "actions"> & { groupId: string; year: number; editable: boolean };

export function ResultsClient({ groupId, year, editable, ...props }: Props) {
  const scope = { groupId, year };
  return (
    <FinalResultsTable
      {...props}
      actions={
        editable
          ? {
              setFinal: (input) => setFinalGrade(scope, input),
              lock: () => lockResults(scope),
              unlock: () => unlockResults(scope),
            }
          : undefined
      }
    />
  );
}
