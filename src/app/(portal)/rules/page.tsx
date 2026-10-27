import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { saveRule, deleteRule } from "./actions";

export default async function RulesPage() {
  const user = await requireUser();
  const canEdit = MANAGER_ROLES.includes(user.role);
  const rules = await prisma.rule.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Колледждің ішкі ережелері" />
      {rules.map((r) => (
        <Card key={r.id}>
          {canEdit ? (
            <CardContent className="space-y-2 pt-5">
              <form action={saveRule} className="space-y-2">
                <input type="hidden" name="id" value={r.id} />
                <Input name="title" defaultValue={r.title} className="font-semibold" />
                <Textarea name="content" defaultValue={r.content} rows={5} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Жаңартылды: {formatDate(r.updatedAt)}</span>
                  <div className="flex gap-2">
                    <Button size="sm">Сақтау</Button>
                    <Button size="sm" variant="ghost" formAction={deleteRule.bind(null, r.id)}>
                      Жою
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-lg">{r.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed">{r.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">Жаңартылды: {formatDate(r.updatedAt)}</p>
              </CardContent>
            </>
          )}
        </Card>
      ))}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Жаңа ереже</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveRule} className="space-y-2">
              <Input name="title" placeholder="Атауы" required />
              <Textarea name="content" placeholder="Мәтіні" rows={5} required />
              <Button size="sm">Қосу</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
