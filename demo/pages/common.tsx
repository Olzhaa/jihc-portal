import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MANAGER_ROLES, STAFF_ROLES } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { mutate, uid, useDb } from "../store";
import { announcementsFor } from "../queries";
import { useMe } from "../hooks";

export function Announcements() {
  const me = useMe();
  const db = useDb();
  const isStaff = STAFF_ROLES.includes(me.role);
  const isManager = MANAGER_ROLES.includes(me.role);
  let groupId: string | null | undefined;
  if (me.role === "STUDENT") groupId = me.groupId ?? "none";
  if (me.role === "PARENT") {
    const link = db.parentLinks.find((l) => l.parentId === me.id);
    groupId = db.users.find((u) => u.id === link?.childId)?.groupId ?? "none";
  }
  const items = announcementsFor(db, groupId);
  const groups = db.groups.filter((g) => isManager || db.lessons.some((l) => l.groupId === g.id && l.teacherId === me.id)).sort((a, b) => a.name.localeCompare(b.name));
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const groupIds = fd.getAll("groups").map(String);
    if (!isManager && !groupIds.length) return setMsg({ text: "Кемінде бір топ таңдаңыз" });
    mutate((d) =>
      d.announcements.push({ id: uid(), title: String(fd.get("title")).trim(), content: String(fd.get("content")).trim(), authorId: me.id, important: isManager && fd.get("important") === "on", groupIds, createdAt: new Date() }),
    );
    form.reset();
    setMsg({ ok: true, text: "Жарияланды" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Хабарландырулар" description="Колледж жаңалықтары мен топтарға арналған хабарламалар" />
      <div className={isStaff ? "grid gap-6 lg:grid-cols-5" : ""}>
        <div className="space-y-3 lg:col-span-3">
          {items.length === 0 && <p className="text-muted-foreground">Хабарландыру жоқ.</p>}
          {items.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.important && <Badge variant="danger">Маңызды</Badge>}
                    {a.groups.length === 0 ? <Badge>Барлығына</Badge> : a.groups.map((g) => <Badge key={g.id} variant="info">{g.name}</Badge>)}
                  </div>
                  <CardTitle className="mt-2 text-lg">{a.title}</CardTitle>
                </div>
                {(isManager || a.authorId === me.id) && (
                  <Button variant="ghost" size="sm" onClick={() => mutate((d) => { d.announcements = d.announcements.filter((x) => x.id !== a.id); })}>Жою</Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{a.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">{a.author?.name} · {formatDate(a.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {isStaff && (
          <Card className="h-fit lg:col-span-2">
            <CardHeader><CardTitle>Жаңа хабарландыру</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1"><Label htmlFor="title">Тақырып</Label><Input id="title" name="title" required /></div>
                <div className="space-y-1"><Label htmlFor="content">Мәтін</Label><Textarea id="content" name="content" required /></div>
                <div className="space-y-1">
                  <Label>Кімге</Label>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm"><input type="checkbox" name="groups" value={g.id} /> {g.name}</label>
                    ))}
                  </div>
                  {isManager && <p className="text-xs text-muted-foreground">Топ таңдалмаса, бүкіл колледжге жарияланады.</p>}
                </div>
                {isManager && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="important" /> Маңызды деп белгілеу</label>}
                {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
                <Button>Жариялау</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function Rules() {
  const me = useMe();
  const db = useDb();
  const canEdit = MANAGER_ROLES.includes(me.role);
  const rules = [...db.rules].sort((a, b) => +a.createdAt - +b.createdAt);

  function save(e: React.FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title")).trim();
    const content = String(fd.get("content")).trim();
    if (!title || !content) return;
    mutate((d) => {
      const r = id && d.rules.find((x) => x.id === id);
      if (r) Object.assign(r, { title, content, updatedAt: new Date() });
      else d.rules.push({ id: uid(), title, content, authorId: me.id, createdAt: new Date(), updatedAt: new Date() });
    });
    if (!id) form.reset();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Колледждің ішкі ережелері" />
      {rules.map((r) => (
        <Card key={r.id}>
          {canEdit ? (
            <CardContent className="space-y-2 pt-5">
              <form onSubmit={(e) => save(e, r.id)} className="space-y-2">
                <Input name="title" defaultValue={r.title} className="font-semibold" />
                <Textarea name="content" defaultValue={r.content} rows={5} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Жаңартылды: {formatDate(r.updatedAt)}</span>
                  <div className="flex gap-2">
                    <Button size="sm">Сақтау</Button>
                    <Button size="sm" variant="ghost" type="button" onClick={() => mutate((d) => { d.rules = d.rules.filter((x) => x.id !== r.id); })}>Жою</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          ) : (
            <>
              <CardHeader><CardTitle className="text-lg">{r.title}</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Жаңа ереже</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => save(e)} className="space-y-2">
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
