import { useState } from "react";
import { faq, learningFormat, programs, type ProgramGroup } from "../content";
import { Icon } from "../icons";
import { href } from "../router";
import { BenefitCard, Chips, container, Cta, IconBox, PageHero, SearchBox, SectionTitle, Tag } from "../ui";

const FILTERS = ["Барлығы", "IT", "Бизнес", "Дизайн", "Қаржы"] as const;

function ProgramList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Барлығы");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = programs.filter(
    (p) => (filter === "Барлығы" || p.group === (filter as ProgramGroup)) && (!q || `${p.title} ${p.description} ${p.qualification}`.toLowerCase().includes(q)),
  );
  return (
    <section className="bg-bg">
      <div className={`${container} flex flex-col gap-8 pb-16 pt-16 lg:pb-[112px]`}>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
          <Chips items={FILTERS} value={filter} onChange={setFilter} />
          <SearchBox value={query} onChange={setQuery} placeholder="Мамандықты іздеу…" className="md:w-[320px]" />
        </div>
        <p className="text-sm font-medium text-muted-fg">{shown.length} бағдарлама көрсетілген</p>
        <div className="grid gap-6 lg:grid-cols-2">
          {shown.map((p) => (
            <article key={p.title} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 drop-shadow-[0_8px_12px_rgba(10,20,51,0.06)] sm:p-8">
              <div className="flex items-center justify-between">
                <IconBox name={p.icon} large />
                <Tag>{p.tag}</Tag>
              </div>
              <h3 className="text-2xl font-bold leading-[1.25] tracking-[-0.24px] text-fg">{p.title}</h3>
              <p className="flex-1 text-[15px] leading-[1.6] text-muted-fg">{p.description}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Біліктілік", p.qualification],
                  ["Оқу мерзімі", p.duration],
                  ["Оқыту тілі", p.language],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 rounded-xl bg-bg px-3.5 py-3">
                    <span className="text-xs font-medium text-muted-fg">{k}</span>
                    <span className="text-sm font-semibold text-fg">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <a href={href("/programs", "faq")} className="flex items-center gap-2 text-[15px] font-semibold text-brand-strong">
                  Оқу жоспары <Icon name="arrow" size={16} />
                </a>
                <a href={href("/", "admission")} className="rounded-[10px] bg-brand-strong px-[18px] py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]">
                  Құжат тапсыру
                </a>
              </div>
            </article>
          ))}
        </div>
        {shown.length === 0 && <p className="py-10 text-center text-muted-fg">Сұрауыңыз бойынша мамандық табылмады.</p>}
      </div>
    </section>
  );
}

function HowWeLearn() {
  return (
    <section className="bg-white">
      <div className={`${container} flex flex-col items-center gap-12 py-16 lg:py-[112px]`}>
        <SectionTitle eyebrow="ОҚУ ФОРМАТЫ" title="Оқу қалай өтеді?" lead="Теория, практика және нақты кәсіпорындағы тағылымдама — бір жүйеде." center />
        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {learningFormat.map((b) => (
            <BenefitCard key={b.title} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-bg">
      <div className={`${container} flex flex-col gap-10 py-16 lg:flex-row lg:gap-16 lg:py-[112px]`}>
        <div className="flex flex-col gap-5 lg:w-[400px] lg:shrink-0">
          <SectionTitle eyebrow="СҰРАҚ-ЖАУАП" title="Жиі қойылатын сұрақтар" />
          <p className="text-[17px] leading-[1.6] text-muted-fg">Жауабын таппасаңыз, қабылдау комиссиясына жазыңыз.</p>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {faq.map((f, i) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card px-7 py-[22px]">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={open === i}>
                <span className="text-[17px] font-semibold leading-[1.4] text-fg">{f.q}</span>
                <span className={`rounded-lg bg-brand-tint p-1.5 text-brand-strong transition-transform ${open === i ? "rotate-180" : ""}`}>
                  <Icon name="chevronDown" size={18} />
                </span>
              </button>
              {open === i && <p className="mt-3 text-[15px] leading-[1.6] text-muted-fg">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProgramsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Мамандықтар"
        title="Мамандықтар мен бағдарламалар"
        subtitle="IT, бизнес, дизайн және қаржы бағыттары бойынша 15-тен астам бағдарлама. Оқу ағылшын тілінде, тәжірибеге бағытталған."
      />
      <ProgramList />
      <HowWeLearn />
      <Faq />
      <Cta />
    </>
  );
}
