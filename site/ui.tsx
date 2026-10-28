import { useState, type FormEvent, type ReactNode } from "react";
import { contacts, PORTAL_URL, type NewsItem } from "./content";
import { JihcLogo } from "../src/components/jihc-logo";
import { Icon, Rings, type IconName } from "./icons";
import { href, useRoute } from "./router";

export const container = "mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-[120px]";

const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/* ───────────── Батырмалар ───────────── */

const btnBase = "inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold whitespace-nowrap transition-colors";

export function ButtonPrimary({ href: to, children, arrow = true, className = "" }: { href: string; children: ReactNode; arrow?: boolean; className?: string }) {
  return (
    <a href={to} className={`${btnBase} bg-brand-strong px-[26px] py-4 text-base text-white shadow-[0_8px_20px_rgba(10,20,51,0.25)] hover:bg-[#1d4ed8] ${className}`}>
      {children}
      {arrow && <Icon name="arrow" size={18} strokeWidth={2} />}
    </a>
  );
}

export function ButtonOutline({ href: to, children, arrow = true, className = "" }: { href: string; children: ReactNode; arrow?: boolean; className?: string }) {
  return (
    <a href={to} className={`${btnBase} border-[1.5px] border-brand-soft bg-card px-[26px] py-4 text-base text-brand-strong hover:border-brand-light ${className}`}>
      {children}
      {arrow && <Icon name="arrow" size={18} strokeWidth={2} />}
    </a>
  );
}

/* ───────────── Бөлім тақырыбы ───────────── */

export function Eyebrow({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <p className={`text-[13px] font-semibold tracking-[1.3px] ${muted ? "text-muted-fg" : "text-brand-strong"}`}>{children}</p>;
}

export function SectionTitle({ eyebrow, title, lead, center = false }: { eyebrow: string; title: ReactNode; lead?: string; center?: boolean }) {
  return (
    <div className={`flex flex-col gap-3.5 ${center ? "items-center text-center" : "items-start"}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg sm:text-[44px]">{title}</h2>
      {lead && <p className={`text-[17px] leading-[1.55] text-muted-fg ${center ? "max-w-[640px]" : "max-w-[560px]"}`}>{lead}</p>}
    </div>
  );
}

export function IconBox({ name, large = false }: { name: IconName; large?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center justify-center bg-brand-tint text-brand-strong ${large ? "rounded-2xl p-4" : "rounded-[13px] p-3"}`}>
      <Icon name={name} />
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-brand-tint px-3 py-1.5 text-xs font-semibold tracking-[0.72px] text-brand-strong">{children}</span>;
}

/* ───────────── Карточкалар ───────────── */

export function BenefitCard({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] border border-border bg-card p-7">
      <div className="self-start">
        <IconBox name={icon} />
      </div>
      <p className="text-lg font-bold leading-[1.35] text-fg">{title}</p>
      <p className="text-[15px] leading-[1.55] text-muted-fg">{text}</p>
    </div>
  );
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_8px_24px_rgba(15,23,41,0.06)]">
      <div className="flex h-[216px] flex-col items-center justify-center gap-2 bg-brand-tint text-brand-light">
        <Icon name="image" size={32} strokeWidth={2.2} />
        <p className="text-[13px] font-medium text-brand-strong">Фото</p>
      </div>
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2 text-muted-fg">
          <span className="text-xs font-semibold tracking-[0.72px] text-brand-strong">{item.label}</span>
          <span className="text-xs">•</span>
          <span className="text-[13px]">{formatDate(item.date)}</span>
        </div>
        <h3 className="text-xl font-bold leading-[1.35] text-fg">{item.title}</h3>
        <p className="text-[15px] leading-[1.55] text-muted-fg">{item.excerpt}</p>
      </div>
    </article>
  );
}

export function PersonCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-[20px] border border-border bg-card px-6 py-8 text-center">
      <div className="flex size-[104px] items-center justify-center rounded-full border-4 border-brand-soft bg-brand-tint text-brand-strong">
        <Icon name="users" size={36} />
      </div>
      <p className="text-lg font-bold text-fg">{name}</p>
      <p className="text-sm leading-normal text-muted-fg">{role}</p>
    </div>
  );
}

export function PhotoPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-brand-tint ${className}`}>
      <Icon name="image" size={36} strokeWidth={2.4} className="text-brand-light" />
      <p className="text-[13px] font-medium text-brand-strong">{label}</p>
    </div>
  );
}

/* ───────────── Сүзгі батырмалары ───────────── */

export function Chips<T extends string>({ items, value, onChange, bordered = false }: { items: readonly T[]; value: T; onChange: (v: T) => void; bordered?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onChange(it)}
          className={`rounded-[10px] px-[18px] py-2.5 text-sm font-semibold ${
            it === value ? "bg-brand-strong text-white" : bordered ? "border border-border bg-card text-fg hover:bg-bg" : "bg-bg text-fg hover:bg-brand-tint"
          }`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`flex h-11 items-center gap-2.5 rounded-[10px] border border-border bg-bg px-4 ${className}`}>
      <Icon name="search" size={18} strokeWidth={2} className="shrink-0 text-muted-fg" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted-fg"
      />
    </label>
  );
}

/* ───────────── Жоғарғы жолақ және мәзір ───────────── */

function UtilityBar() {
  return (
    <div className="hidden bg-ink text-[13px] font-medium text-white md:block">
      <div className={`${container} flex items-center justify-between py-2.5`}>
        <div className="flex items-center gap-7">
          <span className="flex items-center gap-2">
            <Icon name="pin" size={15} className="text-brand-light" /> {contacts.address}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="phone" size={15} className="text-brand-light" /> {contacts.phone}
          </span>
          <span className="hidden items-center gap-2 lg:flex">
            <Icon name="mail" size={15} className="text-brand-light" /> {contacts.email}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href={href("/", "tour")} className="hover:text-brand-light">
            Виртуалды тур
          </a>
          <a href={contacts.instagram} target="_blank" rel="noreferrer" className="hover:text-brand-light">
            Instagram
          </a>
          <a href={contacts.telegram} target="_blank" rel="noreferrer" className="hover:text-brand-light">
            Telegram
          </a>
        </div>
      </div>
    </div>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a href={href("/")} className="flex items-center gap-3">
      <JihcLogo className={`size-14 shrink-0 ${light ? "text-white" : "text-fg"}`} />
      <span className="leading-normal">
        <span className={`block text-[22px] font-extrabold tracking-[-0.22px] ${light ? "text-white" : "text-fg"}`}>JIHC</span>
        <span className={`block text-[13px] font-medium ${light ? "text-white" : "text-muted-fg"}`}>College</span>
      </span>
    </a>
  );
}

function useNav() {
  const { path } = useRoute();
  return [
    { label: "Колледж туралы", href: href("/about"), active: path === "/about" || path === "/staff" },
    { label: "Мамандықтар", href: href("/programs"), active: path === "/programs" },
    { label: "Талапкерге", href: href("/", "admission"), active: false },
    { label: "Жаңалықтар", href: href("/news"), active: path === "/news" },
    { label: "Байланыс", href: href(path, "contacts"), active: false },
  ];
}

function LangSwitch() {
  return (
    <div className="flex gap-0.5 rounded-[10px] border border-border bg-bg p-1 text-[13px] font-semibold" title="Орыс және ағылшын нұсқалары кейін қосылады">
      <span className="rounded-[7px] bg-white px-2.5 py-1.5 text-brand-strong shadow-[0_1px_3px_rgba(10,20,51,0.08)]">Қаз</span>
      <span className="px-2.5 py-1.5 text-muted-fg">Рус</span>
      <span className="px-2.5 py-1.5 text-muted-fg">Eng</span>
    </div>
  );
}

export function Header() {
  const nav = useNav();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30">
      <UtilityBar />
      <div className="border-b border-border bg-white">
        <div className={`${container} flex items-center justify-between gap-6 py-[18px]`}>
          <Brand />
          <nav className="hidden items-center gap-6 whitespace-nowrap xl:flex 2xl:gap-8">
            {nav.map((n) => (
              <a key={n.label} href={n.href} className="flex flex-col items-center gap-1.5">
                <span className={`text-[15px] ${n.active ? "font-semibold text-brand-strong" : "font-medium text-fg hover:text-brand-strong"}`}>{n.label}</span>
                <span className={`h-[3px] w-5 rounded-sm ${n.active ? "bg-brand" : "bg-transparent"}`} />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block xl:max-[1399px]:hidden">
              <LangSwitch />
            </div>
            <a
              href={href("/", "admission")}
              className="hidden whitespace-nowrap rounded-xl bg-brand-strong px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(10,20,51,0.25)] hover:bg-[#1d4ed8] sm:block"
            >
              Құжат тапсыру
            </a>
            <a
              href={PORTAL_URL}
              className="hidden whitespace-nowrap rounded-xl border-[1.5px] border-brand-strong bg-white px-5 py-3 text-[15px] font-semibold text-brand-strong hover:bg-brand-tint sm:block"
            >
              Портал
            </a>
            <button
              className="flex size-11 items-center justify-center rounded-xl border border-border xl:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Мәзір"
            >
              <Icon name={open ? "close" : "menu"} size={22} />
            </button>
          </div>
        </div>
        {open && (
          <nav className={`${container} flex flex-col border-t border-border pb-4 xl:hidden`}>
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`py-3 text-[15px] ${n.active ? "font-semibold text-brand-strong" : "font-medium text-fg"}`}
              >
                {n.label}
              </a>
            ))}
            <a href={href("/", "admission")} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-brand-strong py-3 text-center font-semibold text-white sm:hidden">
              Құжат тапсыру
            </a>
            <a href={PORTAL_URL} className="mt-2 rounded-xl border-[1.5px] border-brand-strong py-3 text-center font-semibold text-brand-strong sm:hidden">
              Портал
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

/* ───────────── Ішкі беттердің басы ───────────── */

export function PageHero({ breadcrumb, title, subtitle }: { breadcrumb: string; title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-ink">
      <Rings sizes={[640, 480, 320]} color="#3B82F6" dash={{ width: 14, pattern: "4 10" }} className="pointer-events-none absolute -top-[200px] left-[calc(50%+340px)] hidden lg:block" />
      <div className={`${container} relative flex flex-col gap-5 pb-20 pt-16`}>
        <div className="flex items-center gap-2 text-sm">
          <a href={href("/")} className="font-medium text-white hover:text-brand-light">
            Басты бет
          </a>
          <Icon name="chevronRight" size={14} className="text-brand-light" />
          <span className="font-semibold text-brand-light">{breadcrumb}</span>
        </div>
        <h1 className="max-w-[760px] text-[40px] font-extrabold leading-[1.1] tracking-[-0.025em] text-white sm:text-[56px]">{title}</h1>
        <p className="max-w-[640px] text-[17px] leading-[1.6] text-white sm:text-[19px]">{subtitle}</p>
      </div>
    </section>
  );
}

/* ───────────── «Сұрағың бар ма?» ───────────── */

export function Cta() {
  const [sent, setSent] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }
  return (
    <section className="bg-white">
      <div className={`${container} pb-16 lg:pb-[112px]`}>
        <div
          className="relative flex flex-col gap-8 overflow-hidden rounded-[32px] p-8 lg:flex-row lg:items-center lg:justify-between lg:p-14"
          style={{ backgroundImage: "linear-gradient(142deg, #3b82f6 0%, #2563eb 71.4%)" }}
        >
          <Rings sizes={[420, 300]} color="white" dash={{ width: 12, pattern: "3 9" }} className="pointer-events-none absolute -top-[120px] left-[560px] hidden opacity-100 lg:block" />
          <div className="relative flex max-w-[520px] flex-col gap-3.5 text-white">
            <h2 className="text-[32px] font-extrabold tracking-[-0.02em] sm:text-[40px]">Сұрағың бар ма?</h2>
            <p className="text-[17px] leading-[1.6]">Нөміріңізді қалдырыңыз — қабылдау комиссиясы хабарласып, мамандық таңдауға көмектеседі.</p>
          </div>
          <form onSubmit={submit} className="relative flex w-full flex-col gap-3 rounded-[20px] bg-white p-6 shadow-[0_16px_40px_rgba(10,20,51,0.2)] lg:w-[420px]">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-tint text-brand-strong">
                  <Icon name="check" />
                </span>
                <p className="font-bold text-fg">Өтінішіңіз қабылданды</p>
                <p className="text-sm text-muted-fg">Демо нұсқа: өтінімдер әзірге ешқайда жіберілмейді.</p>
              </div>
            ) : (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-fg">Аты-жөніңіз</span>
                  <input required placeholder="Мысалы, Айгерім" className="rounded-xl border border-border bg-bg px-4 py-3.5 text-[15px] outline-none placeholder:text-muted-fg focus:border-brand" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-fg">Телефон</span>
                  <input required type="tel" placeholder="+7 (___) ___-__-__" className="rounded-xl border border-border bg-bg px-4 py-3.5 text-[15px] outline-none placeholder:text-muted-fg focus:border-brand" />
                </label>
                <button className={`${btnBase} w-full bg-brand-strong px-[26px] py-4 text-base text-white shadow-[0_8px_20px_rgba(10,20,51,0.25)] hover:bg-[#1d4ed8]`}>
                  Өтінім жіберу <Icon name="arrow" size={18} />
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Қара баннер (жазылу, бос орындар) ───────────── */

export function DarkBanner({ title, text, actions }: { title: string; text: string; actions: ReactNode }) {
  return (
    <section className="bg-bg">
      <div className={`${container} pb-16 lg:pb-[112px]`}>
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-ink px-8 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-12">
          <Rings sizes={[360]} color="#3B82F6" dash={{ width: 12, pattern: "3 9" }} className="pointer-events-none absolute -top-[120px] right-[-160px] hidden lg:block" />
          <div className="relative flex flex-col gap-2.5 text-white">
            <h2 className="text-[26px] font-extrabold tracking-[-0.015em] sm:text-[30px]">{title}</h2>
            <p className="text-base">{text}</p>
          </div>
          <div className="relative flex flex-wrap gap-3">{actions}</div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Футер ───────────── */

export function Footer() {
  const cols = [
    {
      title: "Колледж",
      links: [
        ["Біз туралы", href("/about")],
        ["Әкімшілік", href("/about", "leadership")],
        ["Оқытушылар", href("/staff")],
        ["Портал", PORTAL_URL],
      ],
    },
    {
      title: "Талапкерге",
      links: [
        ["Мамандықтар", href("/programs")],
        ["Қабылдау ережесі", href("/", "admission")],
        ["Грант және шәкіртақы", href("/programs", "faq")],
        ["Жиі қойылатын сұрақтар", href("/programs", "faq")],
      ],
    },
  ];
  const socials = [
    ["IG", contacts.instagram],
    ["TG", contacts.telegram],
    ["YT", contacts.youtube],
    ["FB", contacts.facebook],
  ];
  return (
    <footer id="contacts" className="bg-ink text-white">
      <div className={`${container} flex flex-col gap-12 pb-8 pt-[72px]`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:flex lg:justify-between">
          <div className="flex flex-col gap-5">
            <Brand light />
            <p className="max-w-[320px] text-sm leading-[1.65]">«Білім-инновация» ХҚҚ құрамындағы, SDU University қамқорлығындағы мемлекеттік колледж. 1993 жылдан бері.</p>
            <div className="flex gap-2.5">
              {socials.map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-xs font-semibold hover:bg-white/15"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3.5">
              <p className="text-[15px] font-bold">{c.title}</p>
              {c.links.map(([label, url]) => (
                <a key={label} href={url} className="text-sm hover:text-brand-light">
                  {label}
                </a>
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-3.5 text-sm">
            <p className="text-[15px] font-bold">Байланыс</p>
            <span>{contacts.address}</span>
            <span>{contacts.phone}</span>
            <span>{contacts.email}</span>
            <span>{contacts.hours}</span>
          </div>
        </div>
        <div className="h-px bg-white" />
        <div className="flex flex-col gap-2 text-[13px] sm:flex-row sm:justify-between">
          <p>© 2026 JIHC College. Барлық құқықтар қорғалған.</p>
          <p>Құпиялылық саясаты</p>
        </div>
      </div>
    </footer>
  );
}
