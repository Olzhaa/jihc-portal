import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ROLES } from "@/lib/roles";
import { bookingConflicts } from "@/lib/bookings";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Th, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badges";
import { ReviewButtons } from "@/components/review-buttons";
import { decideBooking } from "../../teacher/bookings/actions";

const fmt = new Intl.DateTimeFormat("kk-KZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function BookingModeration() {
  await requireUser(MANAGER_ROLES);
  const bookings = await prisma.booking.findMany({
    where: { endTime: { gte: new Date(Date.now() - 7 * 86400000) } },
    include: { room: { include: { manager: true } }, user: true },
    orderBy: { startTime: "asc" },
  });
  const pending = await Promise.all(
    bookings.filter((b) => b.status === "PENDING").map(async (b) => ({ ...b, conflicts: await bookingConflicts(b.roomId, b.startTime, b.endTime, b.id) })),
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Брондау өтінімдері" description="Жалпы шолу. Әдетте өтінімді бөлменің жауапты мұғалімі бекітеді, завуч кез келгенін бекіте алады." />
      <Card>
        <CardHeader>
          <CardTitle>Бекітуді күтуде ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Жаңа өтінім жоқ.</p>}
          {pending.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="font-medium">
                  {b.room.name} · {fmt.format(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {b.user.name}: {b.reason}
                </div>
                <div className="text-xs text-muted-foreground">Жауапты: {b.room.manager?.name ?? "завуч"}</div>
                {b.conflicts.length > 0 && <div className="mt-1 text-xs text-red-600">Қақтығыс: {b.conflicts.join("; ")}</div>}
              </div>
              <ReviewButtons action={decideBooking.bind(null, b.id)} withNote={false} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Барлық брондаулар</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Бөлме</Th>
                <Th>Уақыты</Th>
                <Th>Кім</Th>
                <Th>Мақсаты</Th>
                <Th>Статус</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <Td className="font-medium">{b.room.name}</Td>
                  <Td className="whitespace-nowrap">{fmt.format(b.startTime)}</Td>
                  <Td>{b.user.name}</Td>
                  <Td className="max-w-56 truncate">{b.reason}</Td>
                  <Td>
                    <StatusBadge status={b.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
