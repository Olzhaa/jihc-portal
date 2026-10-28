import { useState } from "react";
import { contacts, featuredNews, news, type NewsCategory } from "../content";
import { Icon } from "../icons";
import { Chips, container, DarkBanner, formatDate, NewsCard, PageHero } from "../ui";

const FILTERS = ["Барлығы", "Жетістіктер", "Іс-шаралар", "Серіктестік", "Хабарландырулар"] as const;
const PAGE_SIZE = 9;

function Featured() {
  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_16px_40px_rgba(10,20,51,0.08)] lg:flex-row lg:items-center">
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 bg-brand-tint sm:h-[420px] lg:w-[640px] lg:shrink-0">
        <Icon name="image" size={44} strokeWidth={2.2} className="text-brand-light" />
        <p className="text-sm font-medium text-brand-strong">Басты жаңалық фотосы</p>
      </div>
      <div className="flex flex-col gap-[18px] p-8 lg:px-14 lg:py-12">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-brand-strong px-3 py-1.5 text-xs font-semibold tracking-[0.72px] text-white">{featuredNews.label}</span>
          <span className="text-sm text-muted-fg">{formatDate(featuredNews.date)}</span>
        </div>
        <h2 className="text-[28px] font-extrabold leading-[1.18] tracking-[-0.015em] text-fg sm:text-[34px]">{featuredNews.title}</h2>
        <p className="text-[17px] leading-[1.6] text-muted-fg">{featuredNews.excerpt}</p>
        <span className="flex items-center gap-2 text-base font-semibold text-brand-strong">
          Толық оқу <Icon name="arrow" size={18} />
        </span>
      </div>
    </article>
  );
}

function NewsList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Барлығы");
  const [oldestFirst, setOldestFirst] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = news
    .filter((n) => filter === "Барлығы" || n.category === (filter as NewsCategory))
    .sort((a, b) => (oldestFirst ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function choose(f: (typeof FILTERS)[number]) {
    setFilter(f);
    setPage(1);
  }

  const pageBtn = "flex size-11 items-center justify-center rounded-xl border border-border bg-card text-[15px] font-semibold text-fg disabled:opacity-40";
  return (
    <section className="bg-bg">
      <div className={`${container} flex flex-col gap-10 py-16`}>
        <Featured />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Chips items={FILTERS} value={filter} onChange={choose} bordered />
          <button
            onClick={() => setOldestFirst(!oldestFirst)}
            className="flex items-center gap-2 self-start rounded-[10px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-fg"
          >
            {oldestFirst ? "Алдымен ескілері" : "Алдымен жаңалары"}
            <Icon name="chevronDown" size={16} className="text-muted-fg" />
          </button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((n) => (
            <NewsCard key={n.title} item={n} />
          ))}
        </div>
        <div className="flex justify-center gap-2">
          <button className={pageBtn} disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Алдыңғы бет">
            <Icon name="chevronLeft" size={18} className="text-muted-fg" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === current ? `${pageBtn} border-brand-strong bg-brand-strong text-white` : pageBtn}>
              {p}
            </button>
          ))}
          <button className={pageBtn} disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Келесі бет">
            <Icon name="chevronRight" size={18} className="text-muted-fg" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function NewsPage() {
  return (
    <>
      <PageHero breadcrumb="Жаңалықтар" title="Жаңалықтар мен іс-шаралар" subtitle="Колледж өміріндегі маңызды оқиғалар, студенттердің жетістіктері және алдағы іс-шаралар." />
      <NewsList />
      <DarkBanner
        title="Жаңалықтардан қалыс қалмаңыз"
        text="Колледждің Telegram-арнасына жазылып, хабарландыруларды бірінші алыңыз."
        actions={
          <>
            <a href={contacts.telegram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-xl bg-brand-strong px-[26px] py-4 font-semibold text-white">
              Telegram-ға жазылу <Icon name="arrow" size={18} />
            </a>
            <a href={contacts.instagram} target="_blank" rel="noreferrer" className="rounded-xl border-[1.5px] border-white/35 px-[26px] py-4 font-semibold text-white">
              Instagram
            </a>
          </>
        }
      />
    </>
  );
}
