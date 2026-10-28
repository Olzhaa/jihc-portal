import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  Users,
  X,
} from "lucide-react";
import { about, admission, college, contacts, news, portal, PORTAL_URL, specialties } from "./content";

const NAV = [
  { href: "#about", label: "Колледж туралы" },
  { href: "#specialties", label: "Мамандықтар" },
  { href: "#admission", label: "Талапкерлерге" },
  { href: "#news", label: "Жаңалықтар" },
  { href: "#contacts", label: "Байланыс" },
];

const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-extrabold text-white">J</span>
      <span className={`leading-tight ${light ? "text-white" : "text-navy"}`}>
        <span className="block text-sm font-bold">{college.short}</span>
        <span className={`block text-[11px] ${light ? "text-slate-300" : "text-slate-500"}`}>jihc.edu.kz</span>
      </span>
    </a>
  );
}

function PortalButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={PORTAL_URL}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 ${className}`}
    >
      <LogIn className="size-4" />
      Порталға кіру
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-slate-600 hover:text-primary">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <PortalButton />
          </div>
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Мәзір"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium text-slate-700">
              {n.label}
            </a>
          ))}
          <div className="mt-2 sm:hidden">
            <PortalButton className="w-full" />
          </div>
        </nav>
      )}
    </header>
  );
}

function Section({ id, title, lead, children, muted = false }: { id: string; title: string; lead?: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section id={id} className={muted ? "bg-slate-50" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h2>
        {lead && <p className="mt-3 max-w-2xl text-slate-600">{lead}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy text-white">
      <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:py-28 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">Техникалық және кәсіптік білім</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{college.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">{college.tagline}. {college.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#admission" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-blue-50">
              Құжат тапсыру <ArrowRight className="size-4" />
            </a>
            <a href={PORTAL_URL} className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              <LogIn className="size-4" /> my.jihc.edu.kz
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {college.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="mt-1 text-sm text-slate-300">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <Section id="about" title={about.title}>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4 text-slate-700">
          {about.text.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {about.points.map((p) => (
            <div key={p.title} className="rounded-xl border border-slate-200 p-5">
              <div className="font-semibold text-navy">{p.title}</div>
              <p className="mt-1.5 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Specialties() {
  return (
    <Section id="specialties" title="Мамандықтар" lead="Оқу мерзімі 9 сынып / 11 сынып негізінде көрсетілген." muted>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {specialties.map((s) => (
          <article key={s.code} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-primary">{s.group}</span>
              <span className="text-xs text-slate-400">{s.code}</span>
            </div>
            <h3 className="mt-3 font-semibold text-navy">{s.title}</h3>
            <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
              <div className="flex gap-2">
                <GraduationCap className="size-4 shrink-0 text-slate-400" />
                <dd>{s.qualification}</dd>
              </div>
              <div className="flex gap-2">
                <Clock className="size-4 shrink-0 text-slate-400" />
                <dd>{s.duration}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Admission() {
  return (
    <Section id="admission" title={admission.title} lead={admission.text}>
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <ol className="space-y-4">
          {admission.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
              <div>
                <div className="font-semibold text-navy">{s.title}</div>
                <p className="mt-0.5 text-sm text-slate-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-2 font-semibold text-navy">
            <FileText className="size-5 text-primary" /> Қажетті құжаттар
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {admission.documents.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {d}
              </li>
            ))}
          </ul>
          <a href={`tel:${contacts.admissionPhone.replace(/[^+\d]/g, "")}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Phone className="size-4" /> Қабылдау комиссиясы: {contacts.admissionPhone}
          </a>
        </div>
      </div>
    </Section>
  );
}

function News() {
  return (
    <Section id="news" title="Жаңалықтар" muted>
      <div className="grid gap-4 md:grid-cols-3">
        {news.map((n) => (
          <article key={n.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="size-3.5" /> {formatDate(n.date)}
            </div>
            <h3 className="mt-2 font-semibold leading-snug text-navy">{n.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{n.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

const ROLE_ICONS = [GraduationCap, Users, BookOpen];

function Portal() {
  return (
    <section className="bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{portal.title}</h2>
          <p className="mt-3 text-blue-100">{portal.text}</p>
          <a href={PORTAL_URL} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-blue-50">
            <LogIn className="size-4" /> Порталға кіру
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {portal.roles.map((r, i) => {
            const Icon = ROLE_ICONS[i];
            return (
              <div key={r.title} className="rounded-xl bg-white/10 p-5">
                <Icon className="size-6 text-blue-200" />
                <div className="mt-3 font-semibold">{r.title}</div>
                <p className="mt-1 text-sm text-blue-100">{r.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Contacts() {
  const rows = [
    { icon: MapPin, label: "Мекенжай", value: contacts.address },
    { icon: Phone, label: "Телефон", value: contacts.phone, href: `tel:${contacts.phone.replace(/[^+\d]/g, "")}` },
    { icon: Mail, label: "Пошта", value: contacts.email, href: `mailto:${contacts.email}` },
    { icon: Clock, label: "Жұмыс уақыты", value: contacts.hours },
  ];
  return (
    <Section id="contacts" title="Байланыс">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl border border-slate-200 p-5">
            <r.icon className="size-5 text-primary" />
            <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">{r.label}</div>
            {r.href ? (
              <a href={r.href} className="mt-1 block break-words font-medium text-navy hover:text-primary">
                {r.value}
              </a>
            ) : (
              <div className="mt-1 font-medium text-navy">{r.value}</div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo light />
          <p className="mt-3 text-sm">© {new Date().getFullYear()} {college.name}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {contacts.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-white">
              {s.label}
            </a>
          ))}
          <a href={PORTAL_URL} className="font-semibold text-white">
            my.jihc.edu.kz
          </a>
        </div>
      </div>
    </footer>
  );
}

export function Site() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Specialties />
        <Admission />
        <News />
        <Portal />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
