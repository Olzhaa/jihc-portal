import Link from "next/link";
import { cn } from "@/lib/utils";

export function ChildSwitcher({ items, current }: { items: { id: string; name: string }[]; current: string }) {
  if (items.length < 2) return null;
  return (
    <div className="flex gap-2">
      {items.map((c) => (
        <Link key={c.id} href={`?child=${c.id}`} className={cn("rounded-full border border-border px-3 py-1 text-sm", c.id === current ? "bg-primary text-primary-foreground" : "bg-card")}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
