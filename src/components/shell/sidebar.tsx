"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ArrowLeft, BarChart3, BookOpen, CalendarDays, Check, Compass, DoorOpen, FileText, Gauge, Grid3x3, Home, Info, KeyRound, LogOut,
  Megaphone, MessagesSquare, Moon, PartyPopper, Repeat, Scale, Sparkles, Stethoscope, Sun, UserCheck, Users, X,
} from "lucide-react";
import type { NavGroup } from "./nav";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { JihcLogo } from "@/components/jihc-logo";

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
      {/* Floating island sidebar on desktop; a drawer that slides in on phones. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-500 ease-spring lg:inset-y-3 lg:left-3 lg:w-64 lg:translate-x-0 lg:rounded-[1.75rem] lg:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_48px_-24px_rgba(7,15,36,0.6)]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center gap-3 px-5">
          <JihcLogo className="h-10 w-10 shrink-0 text-white" />
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-white">JIHC Portal</div>
            <div className="text-xs text-sidebar-foreground/80">my.jihc.edu.kz</div>
          </div>
          <button className="ml-auto flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 lg:hidden" onClick={() => setOpen(false)} aria-label="Жабу">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-1">
          {groups.map((g, gi) => (
            <div key={g.title}>
              <div className="eyebrow mb-1.5 px-3 text-[10px] text-white/35">{g.title}</div>
              {g.items.map((item, ii) => {
                const Icon = ICONS[item.icon] ?? Home;
                const isActive = active === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    style={open ? { transitionDelay: `${Math.min(gi * 3 + ii, 10) * 25}ms` } : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-[background-color,color,opacity,transform] duration-500 ease-spring hover:bg-white/5 hover:text-white",
                      isActive && "bg-sidebar-active text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                      !open && "max-lg:translate-x-[-8px] max-lg:opacity-0",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-white/55")} />
                    <span className="min-w-0 truncate">{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.9)]" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-[1.25rem] bg-white/[0.04] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/80 to-indigo-500/80 text-sm font-semibold text-white">
              {userName.trim().charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{userName}</div>
              <div className="text-xs">{roleLabel}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <a href={SITE_URL} className="flex min-h-8 items-center gap-1.5 rounded-full px-2 text-xs hover:bg-white/5 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Колледж сайты
            </a>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex min-h-8 items-center gap-1.5 rounded-full px-2 text-xs hover:bg-white/5 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Шығу
            </button>
          </div>
        </div>
      </aside>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-500 ease-spring lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <div className="app-content flex min-w-0 flex-1 flex-col lg:pl-[17.5rem]">
        {/* Floating glass header: blur is fine here because the header is sticky, not scrolling content. */}
        <header className="sticky top-3 z-20 mx-3 mt-3 flex h-14 items-center gap-3 rounded-full bg-card/75 px-2 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl md:mx-6 lg:ml-3 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(0,0,0,0.6)]">
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Мәзір"
            aria-expanded={open}
          >
            {/* Two lines that rotate into an X. */}
            <span className={cn("absolute h-[1.5px] w-[18px] rounded-full bg-foreground transition-transform duration-500 ease-spring", open ? "rotate-45" : "-translate-y-[4px]")} />
            <span className={cn("absolute h-[1.5px] w-[18px] rounded-full bg-foreground transition-transform duration-500 ease-spring", open ? "-rotate-45" : "translate-y-[4px]")} />
          </button>
          <div className="flex min-w-0 items-center gap-2 pl-2 lg:pl-3">
            <span className="truncate text-sm font-medium">{roleLabel}</span>
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">· {userName}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 hover:bg-muted" aria-label="Тақырып">
              <Sun className="hidden h-[18px] w-[18px] dark:block" />
              <Moon className="h-[18px] w-[18px] dark:hidden" />
            </button>
          </div>
        </header>
        <main className="page-enter mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-9">
          {children}
        </main>
      </div>
    </div>
  );
}
