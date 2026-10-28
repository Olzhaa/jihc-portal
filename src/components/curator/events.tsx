"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/curator";
import { EVENT_FIELDS, EVENT_STATUS, MONTHLY_VALUES, monthValue } from "@/lib/curator";
import { GroupSwitcher, RecordList, Tabs, useCurator } from "./context";

const fmt = fmtDate;
const TONE: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  "Идея": "default", "Жоспарланды": "info", "Дайындық": "warning", "Өтті": "success", "Талдау жасалды": "success", "Болмай қалды": "danger",
};

export function Events() {
  const { ws, today } = useCurator();
  const [tab, setTab] = useState<"events" | "plan">("events");
  const [status, setStatus] = useState("");
  const current = monthValue(new Date(`${today}T00:00:00`)).month;
  const items = [...ws.events]
    .filter((e) => !status || e.status === status)
    .sort((a, b) => String(b.date ?? "9999").localeCompare(String(a.date ?? "9999")));

  return (
    <div className="space-y-4">
      <PageHeader title="Іс-шаралар мен тәрбие сағаттары" description="Әр іс-шара: мақсат → ескерілетін мәселелер → күтілетін нәтиже → өткеннен кейін талдау. «15 мақсатсыз іс-шарадан 2 жоспарлы іс-шара артық.»" actions={<GroupSwitcher />} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "events", label: "Іс-шаралар", count: ws.events.length }, { id: "plan", label: "Жылдық тәрбие жоспары" }]} />

      {tab === "plan" ? (
        <Card>
          <CardHeader><CardTitle>Айлық құндылықтар</CardTitle><span className="text-xs text-muted-foreground">Ұсыныс — колледж кеңесі бекіткен тізіммен ауыстыруға болады</span></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Ай</Th><Th>Құндылық</Th><Th>Атаулы күндер</Th><Th>Айдың негізгі іс-шарасы</Th><Th>Өткізілгені</Th></tr></thead>
              <tbody>
                {MONTHLY_VALUES.map((m) => {
                  const done = ws.events.filter((e) => typeof e.date === "string" && Number(e.date.slice(5, 7)) === m.month && (e.status === "Өтті" || e.status === "Талдау жасалды")).length;
                  return (
                    <tr key={m.month} className={cn("align-top", m.month === current && "bg-primary/5")}>
                      <Td className="font-medium">{m.name}</Td>
                      <Td><div>{m.value}</div><Badge className="mt-1">{m.group}</Badge></Td>
                      <Td className="text-sm text-muted-foreground">{m.days}</Td>
                      <Td className="text-sm">{m.event}</Td>
                      <Td>{done || "—"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-52">
            <option value="">Статус: барлығы</option>
            {EVENT_STATUS.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <RecordList
            kind="event"
            items={items}
            fields={EVENT_FIELDS}
            defaults={{ status: "Жоспарланды", type: "Тәрбие сағаты" }}
            addLabel="Іс-шара қосу"
            dialogTitle="Жаңа іс-шара"
            emptyText="Іс-шара әлі жоспарланбаған."
            heading={(r) => String(r.title)}
            meta={(r) => (
              <>
                <Badge variant={TONE[String(r.status)]}>{String(r.status)}</Badge>
                {typeof r.date === "string" && <span>{fmt(r.date)}</span>}
                {typeof r.type === "string" && <span>· {r.type}</span>}
                {typeof r.place === "string" && <span>· {r.place}</span>}
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}
