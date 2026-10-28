"use client";

import { useState } from "react";
import { Check, MessageSquarePlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { fmtDate } from "@/lib/curator";
import { CONTACT_FIELDS, WITH_WHOM, addDays, attentionFlags, lastMeeting, weekOf } from "@/lib/curator";
import { GroupSwitcher, RecordDialog, RecordList, Tabs, useCurator } from "./context";
import { AgreementRow, FlagBadges, StudentLink, openAgreements } from "./overview";

const fmt = fmtDate;
type Tab = "week" | "log" | "agreements";

export function Contacts({ initialTab }: { initialTab?: string | null }) {
  const { ws, today } = useCurator();
  const [tab, setTab] = useState<Tab>(initialTab === "log" || initialTab === "agreements" ? initialTab : "week");
  const [student, setStudent] = useState("");
  const [who, setWho] = useState("");
  const [weekStart, setWeekStart] = useState(weekOf(today).start);
  const [log, setLog] = useState<Record<string, unknown> | null>(null);
  const weekEnd = addDays(weekStart, 6);
  const agreements = openAgreements(ws.contacts);
  const entries = ws.contacts.filter((c) => (!student || c.studentId === student) && (!who || c.withWhom === who));
  const inWeek = ws.contacts.filter((c) => String(c.date) >= weekStart && String(c.date) <= weekEnd);
  const metCount = new Set(inWeek.filter((c) => c.withWhom !== "Ата-ана").map((c) => c.studentId)).size;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Байланыс журналы"
        description="Студентпен де, ата-анамен де әр сөйлесу: кіммен, қашан, не туралы, не келістік"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <GroupSwitcher />
            <Button onClick={() => setLog({ date: today, withWhom: "Студент" })}><MessageSquarePlus className="h-4 w-4" /> Жазу</Button>
          </div>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "week", label: "🗓 Апта кездесулері" },
          { id: "log", label: "Журнал", count: ws.contacts.length },
          { id: "agreements", label: "⏳ Орындалмаған келісімдер", count: agreements.length },
        ]}
      />

      {tab === "week" && (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button size="sm" variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>←</Button>
              <span className="font-medium">{fmt(weekStart)} – {fmt(weekEnd)}</span>
              <Button size="sm" variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>→</Button>
              {weekStart !== weekOf(today).start && <Button size="sm" variant="ghost" onClick={() => setWeekStart(weekOf(today).start)}>Осы апта</Button>}
              <span className="ml-auto text-muted-foreground">Өтті: <b className="text-foreground">{metCount}</b> / {ws.students.length} студент</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr><Th className="w-10" /><Th>Студент</Th><Th>Осы аптада</Th><Th>Соңғы кездесу</Th><Th /></tr></thead>
                <tbody>
                  {ws.students.map((s) => {
                    const mine = inWeek.filter((c) => c.studentId === s.id);
                    const met = mine.some((c) => c.withWhom !== "Ата-ана");
                    const last = lastMeeting(ws, s.id);
                    return (
                      <tr key={s.id}>
                        <Td>{met ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="inline-block h-4 w-4 rounded border border-border" />}</Td>
                        <Td><div className="flex flex-wrap items-center gap-1.5"><StudentLink s={s} /><FlagBadges flags={attentionFlags(ws, s, today)} /></div></Td>
                        <Td className="text-sm text-muted-foreground">{mine.map((c) => `${c.withWhom}: ${c.summary}`).join("; ") || "—"}</Td>
                        <Td className="whitespace-nowrap text-sm">{last ? fmt(last) : "—"}</Td>
                        <Td><Button size="sm" variant="outline" onClick={() => setLog({ date: weekEnd < today ? weekEnd : today, withWhom: "Студент", studentId: s.id })}>Жазу</Button></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "log" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={student} onChange={(e) => setStudent(e.target.value)} className="w-56">
              <option value="">Барлық студент</option>
              {ws.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select value={who} onChange={(e) => setWho(e.target.value)} className="w-48">
              <option value="">Кіммен: барлығы</option>
              {WITH_WHOM.map((w) => <option key={w}>{w}</option>)}
            </Select>
          </div>
          <RecordList
            kind="contact"
            items={entries}
            fields={CONTACT_FIELDS}
            defaults={{ withWhom: "Студент", studentId: student || undefined }}
            addLabel="Сөйлесуді жазу"
            dialogTitle="Байланыс журналына жазу"
            hide={student ? ["studentId"] : []}
            emptyText="Жазба жоқ."
            heading={(r) => `${ws.students.find((s) => s.id === r.studentId)?.name ?? ""} — ${r.summary}`}
            meta={(r) => (
              <>
                <span>{fmt(r.date)}</span>
                <Badge>{String(r.withWhom)}</Badge>
                {((r.topics as string[]) ?? []).map((t) => <Badge key={t} variant="info">{t}</Badge>)}
                {!!r.notifyParent && <Badge variant="warning">Ата-анаға хабарлау керек</Badge>}
              </>
            )}
          />
        </div>
      )}

      {tab === "agreements" && (
        <div className="space-y-2">
          {agreements.length === 0 && <p className="text-sm text-muted-foreground">Орындалмаған келісім жоқ.</p>}
          {agreements.map((c) => <AgreementRow key={c.id} c={c} />)}
        </div>
      )}

      <RecordDialog kind="contact" fields={CONTACT_FIELDS} record={log} title="Байланыс журналына жазу" onClose={() => setLog(null)} />
    </div>
  );
}
