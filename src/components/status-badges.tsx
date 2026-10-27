import type { BookingStatus, CertificateStatus, SyllabusStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const MAP = {
  PENDING: { label: "Күтуде", variant: "warning" },
  APPROVED: { label: "Расталды", variant: "success" },
  REJECTED: { label: "Қабылданбады", variant: "danger" },
  DRAFT: { label: "Жоба", variant: "default" },
  CANCELLED: { label: "Бас тартылды", variant: "default" },
} as const;

export function CertificateStatusBadge({ status }: { status: CertificateStatus | SyllabusStatus | BookingStatus }) {
  const m = MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export { CertificateStatusBadge as StatusBadge };
