import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/roles";
import { loadResultsConfig } from "@/lib/results-server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ResultsConfigForm } from "@/components/results-config-form";
import { saveResultsConfig } from "../actions";

export default async function ResultsSettingsPage() {
  await requireUser(MANAGER_ROLES);
  const config = await loadResultsConfig();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Қорытынды баға формуласы"
        description="Smart Nation формуласы жарияланбаған: оқу бөлімі бекіткен ережені осында қойыңыз. Бекітілген бағалар өзгермейді, тек бекітілмегендері қайта есептеледі."
        actions={<Link href="/academic-director/results" className="text-sm text-primary hover:underline">← Қорытындылар</Link>}
      />
      <Card>
        <CardContent className="pt-6">
          <ResultsConfigForm config={config} onSave={saveResultsConfig} />
        </CardContent>
      </Card>
    </div>
  );
}
