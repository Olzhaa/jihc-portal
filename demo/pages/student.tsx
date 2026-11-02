import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { OverviewStats, OverviewWidgets, GradebookView } from "@/components/student-views";
import { Timetable } from "@/components/timetable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badges";
import { formatDate, isoWeekday, parseISODate } from "@/lib/utils";
import { mutate, uid, useDb } from "../store";
import { lessonsForGroup, studentGradebook, studentOverview, byId } from "../queries";
import { readFileAsDataUrl, useMe } from "../hooks";
import { StudentResults } from "./results";

export function Dashboard() {
  const me = useMe();
  const o = studentOverview(useDb(), me.id);
  return (
    <div className="space-y-6">
      <PageHeader title={`Сәлем, ${me.name.split(" ")[0]}!`} description={`${o.student.group?.name ?? ""} тобы`} />
      <OverviewStats o={o as never} />
      <OverviewWidgets o={o as never} scheduleHref="/student/schedule" gradesHref="/student/grades" />
    </div>
  );
}

export function Schedule() {
  const me = useMe();
  const db = useDb();
  return (
    <div>
      <PageHeader title="Сабақ кестесі" description={`${byId(db.groups, me.groupId)?.name ?? ""} · апталық кесте`} />
      <Timetable lessons={me.groupId ? lessonsForGroup(db, me.groupId) : []} today={isoWeekday(new Date())} />
    </div>
  );
}

export function Grades() {
  const me = useMe();
  return (
    <div>
      <PageHeader title="Бағалар журналы" description="Ағымдағы, аралық және сессиялық бағалар (100 балдық шкала)" />
      <StudentResults studentId={me.id} />
      <GradebookView book={studentGradebook(useDb(), me.id) as never} />
    </div>
  );
}

const TYPES = ["application/pdf", "image/png", "image/jpeg"];

export function Certificates() {
  const me = useMe();
  const db = useDb();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const certs = db.certificates.filter((c) => c.studentId === me.id).sort((a, b) => +b.createdAt - +a.createdAt);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const start = String(fd.get("startDate"));
    const end = String(fd.get("endDate"));
    const file = fd.get("file") as File;
    if (end < start) return setMsg({ text: "Аяқталу күні басталу күнінен кейін болуы керек" });
    if (!TYPES.includes(file.type)) return setMsg({ text: "Тек PDF, PNG немесе JPG файлдар қабылданады" });
    if (file.size > 5 * 1024 * 1024) return setMsg({ text: "Файл көлемі 5 МБ-тан аспауы керек" });
    // Small files are kept so the reviewer can open them; large ones only by name.
    const fileData = file.size < 1024 * 1024 ? await readFileAsDataUrl(file) : null;
    mutate((d) =>
      d.certificates.push({ id: uid(), studentId: me.id, reviewerId: null, fileName: file.name, fileData, startDate: parseISODate(start), endDate: parseISODate(end), status: "PENDING", reviewNote: null, createdAt: new Date() }),
    );
    form.reset();
    setMsg({ ok: true, text: "Анықтама жіберілді. Завуч тексергенше «Күтуде» статусында болады." });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Анықтама тапсыру" description="Ауырып қалған күндерге медициналық анықтама жүктеңіз" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Жаңа анықтама</CardTitle>
              <CardDescription>Расталған соң сол күндердегі сабақтар «себепті» болып белгіленеді.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Қай күннен</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">Қай күнге дейін</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="file">Анықтама файлы</Label>
                <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required className="py-1.5" />
                <p className="text-xs text-muted-foreground">PDF, PNG немесе JPG, ең көбі 5 МБ</p>
              </div>
              {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
              <Button>Жіберу</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Менің анықтамаларым</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Кезең</Th>
                  <Th>Жіберілді</Th>
                  <Th>Статус</Th>
                  <Th>Файл</Th>
                </tr>
              </thead>
              <tbody>
                {certs.length === 0 && (
                  <tr>
                    <Td colSpan={4} className="text-muted-foreground">Әзірге анықтама жоқ.</Td>
                  </tr>
                )}
                {certs.map((c) => (
                  <tr key={c.id}>
                    <Td>{formatDate(c.startDate)} – {formatDate(c.endDate)}</Td>
                    <Td>{formatDate(c.createdAt)}</Td>
                    <Td>
                      <StatusBadge status={c.status} />
                      {c.reviewNote && <div className="mt-1 text-xs text-muted-foreground">{c.reviewNote}</div>}
                    </Td>
                    <Td><FileLink name={c.fileName} data={c.fileData} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function FileLink({ name, data }: { name: string; data: string | null }) {
  return data ? (
    <a href={data} target="_blank" rel="noopener" className="text-primary hover:underline">{name}</a>
  ) : (
    <span className="text-muted-foreground">{name}</span>
  );
}
