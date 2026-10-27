import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { toISODate } from "@/lib/utils";
import { BookingForm } from "./booking-form";
import { cancelBooking, decideBooking } from "./actions";
import { ReviewButtons } from "@/components/review-buttons";
import { ROOM_TYPE_LABEL } from "@/lib/bookings";

const fmt = new Intl.DateTimeFormat("kk-KZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function BookingsPage() {
  const user = await requireUser(STAFF_ROLES);
  const [rooms, mine, upcoming, incoming] = await Promise.all([
    prisma.room.findMany({ include: { manager: true }, orderBy: [{ type: "desc" }, { name: "asc" }] }),
    prisma.booking.findMany({ where: { userId: user.id }, include: { room: true }, orderBy: { startTime: "desc" }, take: 20 }),
    prisma.booking.findMany({
      where: { status: "APPROVED", endTime: { gte: new Date() } },
      include: { room: true, user: true },
      orderBy: { startTime: "asc" },
      take: 8,
    }),
    prisma.booking.findMany({
      where: { status: "PENDING", room: { managerId: user.id } },
      include: { room: true, user: true },
      orderBy: { startTime: "asc" },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Ресурстарды брондау" description="Акт залы мен бос кабинеттерге өтінім беру" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Жаңа өтінім</CardTitle>
              <CardDescription>Кәдімгі кабинет бос болса бірден расталады. Акт залы, компьютер кабинеттері мен мұғалімдер бөлмесін жауапты мұғалім бекітеді.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BookingForm
              rooms={rooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, kind: ROOM_TYPE_LABEL[r.type], manager: r.type === "CLASSROOM" ? null : (r.manager?.name ?? "завуч") }))}
              today={toISODate(new Date())}
            />
          </CardContent>
        </Card>
        <div className="space-y-6 lg:col-span-3">
          {incoming.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader>
                <div>
                  <CardTitle>Маған келген өтінімдер ({incoming.length})</CardTitle>
                  <CardDescription>Сіз жауапты бөлмелерге берілген брондау өтінімдері</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {incoming.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="text-sm">
                      <div className="font-medium">
                        {b.room.name} · {fmt.format(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}
                      </div>
                      <div className="text-muted-foreground">
                        {b.user.name}: {b.reason}
                      </div>
                    </div>
                    <ReviewButtons action={decideBooking.bind(null, b.id)} withNote={false} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Менің өтінімдерім</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <thead>
                  <tr>
                    <Th>Бөлме</Th>
                    <Th>Уақыты</Th>
                    <Th>Мақсаты</Th>
                    <Th>Статус</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {mine.map((b) => (
                    <tr key={b.id}>
                      <Td className="font-medium">{b.room.name}</Td>
                      <Td className="whitespace-nowrap">
                        {fmt.format(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}
                      </Td>
                      <Td className="max-w-48 truncate">{b.reason}</Td>
                      <Td>
                        <StatusBadge status={b.status} />
                      </Td>
                      <Td>
                        {(b.status === "PENDING" || b.status === "APPROVED") && b.startTime > new Date() && (
                          <form action={cancelBooking.bind(null, b.id)}>
                            <Button variant="ghost" size="sm">
                              Бас тарту
                            </Button>
                          </form>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Алдағы бос емес уақыттар</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {upcoming.map((b) => (
                <div key={b.id} className="flex justify-between gap-3 rounded-md bg-muted px-3 py-2">
                  <span className="font-medium">{b.room.name}</span>
                  <span className="text-muted-foreground">
                    {fmt.format(b.startTime)} · {b.user.name}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
