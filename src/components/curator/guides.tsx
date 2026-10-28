"use client";

import { PageHeader } from "@/components/page-header";
import { GUIDES } from "@/lib/curator";

export function Guides() {
  return (
    <div className="space-y-4">
      <PageHeader title="Нұсқаулықтар мен шаблондар" description="Куратор нұсқаулығы негізінде, колледжге бейімделген. Қажет кезде ашасыз." />
      <div className="grid gap-3 lg:grid-cols-2">
        {GUIDES.map((g, i) => (
          <details key={g.id} open={i === 0} className="group rounded-xl border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              <span className="text-2xl">{g.icon}</span>
              <span className="font-semibold">{g.title}</span>
              <span className="ml-auto text-muted-foreground transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="space-y-4 px-4 pb-4 text-sm">
              <p className="rounded-md bg-muted p-3 text-muted-foreground">{g.intro}</p>
              {g.sections.map((s) => {
                const List = s.ordered ? "ol" : "ul";
                return (
                  <div key={s.heading}>
                    <h4 className="mb-1.5 font-medium">{s.heading}</h4>
                    <List className={s.checklist ? "space-y-1" : s.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
                      {s.items.map((it) => (
                        <li key={it} className={s.checklist ? "flex gap-2" : undefined}>
                          {s.checklist && <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" aria-label={it} />}
                          <span>{it}</span>
                        </li>
                      ))}
                    </List>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
