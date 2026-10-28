"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ArrowLeft, BarChart3, BookOpen, CalendarDays, Check, Compass, DoorOpen, FileText, Gauge, Grid3x3, Home, Info, KeyRound, LogOut,
  Megaphone, Menu, MessagesSquare, Moon, PartyPopper, Repeat, Scale, Sparkles, Stethoscope, Sun, UserCheck, Users, X,
} from "lucide-react";
import type { NavGroup } from "./nav";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home, calendar: CalendarDays, book: BookOpen, file: FileText, door: DoorOpen, chart: BarChart3,
  grid: Grid3x3, stethoscope: Stethoscope, check: Check, megaphone: Megaphone, scale: Scale, gauge: Gauge, users: Users, key: KeyRound,
  compass: Compass, message: MessagesSquare, repeat: Repeat, party: PartyPopper, info: Info, sparkles: Sparkles, usercheck: UserCheck,
};

export function Sidebar({
  groups,
  userName,
  roleLabel,
  children,
}: {
  groups: NavGroup[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  // Longest matching prefix wins, so "/teacher/journal" doesn't also light up "/teacher".
  const active = allHrefs
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.theme = dark ? "dark" : "light";
    } catch {}
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">J</div>
          <div className="leading-tight">
            <div className="font-semibold text-white">JIHC Portal</div>
            <div className="text-xs">my.jihc.edu.kz</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Жабу">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.title}</div>
              {g.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Home;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5 hover:text-white",
                      active === item.href && "bg-sidebar-active text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="truncate text-sm font-medium text-white">{userName}</div>
          <div className="text-xs">{roleLabel}</div>
          <div className="mt-3 flex items-center justify-between">
            <a href={SITE_URL} className="flex items-center gap-2 text-xs hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Колледж сайты
            </a>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-2 text-xs hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Шығу
            </button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Мәзір">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-md p-2 hover:bg-muted" aria-label="Тақырып">
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
