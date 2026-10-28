"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { gradeTone } from "@/lib/grades";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/curator";
import {
  ACHIEVEMENT_FIELDS, BOOK_FIELDS, CONTACT_FIELDS, GUARDIAN_FIELDS, PROFILE_SECTIONS, PSYCH_ONLY, REFLECTION_FIELDS, TEST_FIELDS,
  attentionFlags, lastMeeting, type CuratorStudent,
} from "@/lib/curator";
import { GroupSwitcher, RecordList, Tabs, studentOptions, useCurator } from "./context";
import { RecordDetails, RecordForm } from "./fields";
import { FlagBadges } from "./overview";

const fmt = fmtDate;
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");
const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x)}%`);

type Filter = "all" | "attention" | "future";

export function Students({ initialFilter }: { initialFilter?: string | null }) {
  const { ws, today, href } = useCurator();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter === "attention" || initialFilter === "future" ? initialFilter : "all");
  const rows = ws.students
    .map((s) => ({ s, flags: attentionFlags(ws, s, today), last: lastMeeting(ws, s.id) }))
    .filter((r) => r.s.name.toLowerCase().includes(q.trim().toLowerCase()));
  const shown = filter === "attention" ? rows.filter((r) => r.flags.length) : rows;

  return (
    <div className="space-y-4">
      <PageHeader title="Студенттер" description={`${ws.group.name} · әр студентке бір бет`} actions={<GroupSwitcher />} />
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Іздеу…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: "Барлығы", count: rows.length },
            { id: "attention", label: "⚠️ Назар керек", count: rows.filter((r) => r.flags.length).length },
            { id: "future", label: "🎓 Болашақ жоспары" },
          ]}
        />
      </div>

      {filter === "future" ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead>
                <tr><Th>Студент</Th><Th>Жоспар</Th><Th>Бағыт</Th><Th>Университет / мамандық</Th><Th>Ел</Th><Th>IELTS</Th><Th>Түсу статусы</Th></tr>
              </thead>
              <tbody>
                {shown.map(({ s }) => (
                  <tr key={s.id}>
                    <Td><Link href={href("/teacher/curator/students/view", { id: s.id })} className="font-medium hover:text-primary">{s.name}</Link></Td>
                    <Td>{String(s.profile.futurePlan ?? "—")}</Td>
                    <Td>{String(s.profile.designDirection ?? "—")}</Td>
                    <Td>{[s.profile.targetUniversity, s.profile.targetSpecialty].filter(Boolean).join(" · ") || "—"}</Td>
                    <Td>{((s.profile.studyCountries as string[]) ?? []).join(", ") || "—"}</Td>
                    <Td>{s.profile.ieltsScore ? String(s.profile.ieltsScore) : "—"}</Td>
                    <Td>{s.profile.admissionStatus ? <Badge variant={s.profile.admissionStatus === "Қабылданды" ? "success" : "default"}>{String(s.profile.admissionStatus)}</Badge> : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.length === 0 && <p className="text-sm text-muted-foreground">Студент табылмады.</p>}
          {shown.map(({ s, flags, last }) => (
            <Link key={s.id} href={href("/teacher/curator/students/view", { id: s.id })} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{initials(s.name)}</div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.profile.activity ? String(s.profile.activity).replace(" — назар керек", "") : "Белсенділігі белгісіз"}
                    {s.profile.designDirection ? ` · ${s.profile.designDirection}` : ""}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-muted py-1.5"><div className={cn("text-base font-semibold", s.avg !== null && gradeTone(s.avg))}>{s.avg === null ? "—" : Math.round(s.avg)}</div>орташа</div>
                <div className="rounded-md bg-muted py-1.5"><div className="text-base font-semibold">{pct(s.attendance)}</div>қатысу</div>
                <div className="rounded-md bg-muted py-1.5"><div className="text-base font-semibold">{last ? fmt(last).slice(0, 5) : "—"}</div>кездесу</div>
              </div>
              {flags.length > 0 && <div className="mt-3 flex flex-wrap gap-1"><FlagBadges flags={flags} /></div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type Tab = "profile" | "parents" | "contacts" | "achievements" | "books" | "tests" | "reflection" | "grades";

export function StudentPage({ studentId }: { studentId: string | null }) {
  const { ws, today, href } = useCurator();
  const [tab, setTab] = useState<Tab>("profile");
  const s = ws.students.find((x) => x.id === studentId);
  if (!s) {
    return (
      <div>
        <PageHeader title="Студент табылмады" />
        <Link href={href("/teacher/curator/students")} className="text-sm text-primary hover:underline">← Студенттер тізімі</Link>
      </div>
    );
  }
  const mine = <T extends Record<string, unknown>>(xs: T[]) => xs.filter((x) => x.studentId === s.id);
  const contacts = mine(ws.contacts);
  const last = lastMeeting(ws, s.id);
  const p = s.profile;

  return (
    <div className="space-y-5">
      <Link href={href("/teacher/curator/students")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Студенттер
      </Link>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">{initials(s.name)}</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{s.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{ws.group.name}</span>
            {typeof p.phone === "string" && <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3.5 w-3.5" />{p.phone}</a>}
            {typeof p.birthDate === "string" && <span>🎂 {fmt(p.birthDate)}</span>}
            {s.iin && <span>ЖСН {s.iin}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1"><FlagBadges flags={attentionFlags(ws, s, today)} /></div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            ["Орташа", s.avg === null ? "—" : s.avg.toFixed(1)],
            ["Қатысу", pct(s.attendance)],
            ["Жіберген", String(s.absences)],
            ["Соңғы кездесу", last ? fmt(last) : "—"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-border px-3 py-2"><div className="text-sm font-semibold">{v}</div><div className="text-muted-foreground">{l}</div></div>
          ))}
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: "Профиль" },
          { id: "parents", label: "Ата-ана", count: mine(ws.guardians).length },
          { id: "contacts", label: "Байланыс журналы", count: contacts.length },
          { id: "achievements", label: "Жетістіктер", count: mine(ws.achievements).length },
          { id: "books", label: "Кітаптар", count: mine(ws.books).length },
          { id: "tests", label: "Тесттер", count: mine(ws.tests).length },
          { id: "reflection", label: "Рефлексия", count: mine(ws.reflections).length },
          { id: "grades", label: "Үлгерім" },
        ]}
      />

      {tab === "profile" && <ProfileTab s={s} />}
      {tab === "parents" && (
        <RecordList
          kind="guardian"
          items={mine(ws.guardians)}
          fields={GUARDIAN_FIELDS}
          defaults={{ studentId: s.id }}
          hide={["studentId"]}
          addLabel="Ата-ана қосу"
          dialogTitle="Ата-ана қосу"
          emptyText="Ата-ана туралы мәлімет әлі жоқ."
          heading={(r) => `${r.name}${r.relation ? ` · ${r.relation}` : ""}`}
          meta={(r) => r.responsiveness ? <Badge variant={r.responsiveness === "Байланысқа шықпайды" || r.responsiveness === "Нашар" ? "danger" : "default"}>{String(r.responsiveness)}</Badge> : null}
        />
      )}
      {tab === "contacts" && (
        <RecordList
          kind="contact"
          items={contacts}
          fields={CONTACT_FIELDS}
          defaults={{ studentId: s.id, withWhom: "Студент" }}
          hide={["studentId"]}
          addLabel="Сөйлесуді жазу"
          dialogTitle="Байланыс журналына жазу"
          emptyText="Әлі сөйлесу жазылмаған."
          heading={(r) => String(r.summary)}
          meta={(r) => (
            <>
              <span>{fmt(r.date)}</span>
              <Badge>{String(r.withWhom)}</Badge>
              {typeof r.mood === "string" && <Badge variant={r.mood === "Алаңдатады" || r.mood === "Нашар" ? "danger" : "info"}>{r.mood}</Badge>}
              {!!r.agreedStep && <Badge variant={r.agreementDone ? "success" : "warning"}>{r.agreementDone ? "Келісім орындалды" : "Келісім күтуде"}</Badge>}
            </>
          )}
        />
      )}
      {tab === "achievements" && (
        <RecordList
          kind="achievement"
          items={mine(ws.achievements)}
          fields={ACHIEVEMENT_FIELDS}
          defaults={{ studentId: s.id }}
          hide={["studentId"]}
          dialogTitle="Жетістік қосу"
          emptyText="Жетістік әлі жоқ. Ата-анамен кездесуде алдымен осыдан бастаңыз."
          heading={(r) => String(r.title)}
          meta={(r) => <>{[r.level, r.result].filter(Boolean).map((x) => <Badge key={String(x)} variant="success">{String(x)}</Badge>)}{typeof r.date === "string" && <span>{fmt(r.date)}</span>}</>}
        />
      )}
      {tab === "books" && (
        <RecordList
          kind="book"
          items={mine(ws.books)}
          fields={BOOK_FIELDS}
          defaults={{ studentId: s.id, status: "Оқып жатыр" }}
          hide={["studentId"]}
          dialogTitle="Кітап қосу"
          emptyText="Оқыған кітап әлі жазылмаған."
          heading={(r) => `${r.title}${r.author ? ` — ${r.author}` : ""}`}
          meta={(r) => <Badge variant={r.status === "Оқып бітірді" ? "success" : r.status === "Тастап кетті" ? "danger" : "info"}>{String(r.status)}</Badge>}
        />
      )}
      {tab === "tests" && (
        <div className="space-y-2">
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            🔒 «{PSYCH_ONLY}» тесттерінің нәтижесі мұнда сақталмайды — тек өткізілгені белгіленеді. Клиникалық/эмоционалдық нәтижелер психологта қалады.
          </p>
          <RecordList
            kind="test"
            items={mine(ws.tests)}
            fields={TEST_FIELDS}
            defaults={{ studentId: s.id, privacy: "Куратор көреді", conductedBy: "Куратор" }}
            hide={["studentId"]}
            dialogTitle="Тест нәтижесін қосу"
            emptyText="Тест әлі өткізілмеген."
            heading={(r) => String(r.test)}
            meta={(r) => <>{typeof r.date === "string" && <span>{fmt(r.date)}</span>}<Badge variant={r.privacy === PSYCH_ONLY ? "danger" : "default"}>{String(r.privacy)}</Badge></>}
          />
        </div>
      )}
      {tab === "reflection" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Студент өзі семестрде бір рет порталдағы «Рефлексия» бетінде толтырады.</p>
          {mine(ws.reflections).length === 0 && <p className="text-sm text-muted-foreground">Әлі толтырылмаған.</p>}
          {mine(ws.reflections).map((r) => (
            <Card key={r.id}>
              <CardHeader><CardTitle>{r.semester}</CardTitle><span className="text-xs text-muted-foreground">{fmt(r.createdAt)}</span></CardHeader>
              <CardContent><RecordDetails fields={REFLECTION_FIELDS} values={r} /></CardContent>
            </Card>
          ))}
        </div>
      )}
      {tab === "grades" && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Пән</Th><Th>Орташа балл</Th><Th>Қатысу</Th><Th>Себепсіз жіберген</Th></tr></thead>
              <tbody>
                {s.courses.length === 0 && <tr><Td colSpan={4} className="text-muted-foreground">Баға мен қатысу әлі жоқ.</Td></tr>}
                {s.courses.map((c) => (
                  <tr key={c.title}>
                    <Td>{c.title}</Td>
                    <Td className={cn("font-semibold", c.avg !== null && gradeTone(c.avg))}>{c.avg === null ? "—" : c.avg.toFixed(1)}</Td>
                    <Td>{pct(c.attendance)}</Td>
                    <Td className={c.absences >= 3 ? "font-semibold text-red-600" : undefined}>{c.absences}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileTab({ s }: { s: CuratorStudent }) {
  const { ws, save } = useCurator();
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <Card>
        <CardContent className="pt-5">
          <RecordForm
            sections={PROFILE_SECTIONS}
            initial={s.profile}
            students={studentOptions(ws)}
            onCancel={() => setEditing(false)}
            onSubmit={async (v) => {
              const r = await save("profile", { ...v, studentId: s.id });
              if (!r?.error) setEditing(false);
              return r;
            }}
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Профильді өңдеу</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {PROFILE_SECTIONS.map((sec) => (
          <Card key={sec.title}>
            <CardHeader><CardTitle>{sec.title}</CardTitle>{sec.note && <span title={sec.note}>🔒</span>}</CardHeader>
            <CardContent><RecordDetails fields={sec.fields} values={s.profile} emptyText="Толтырылмаған." /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
