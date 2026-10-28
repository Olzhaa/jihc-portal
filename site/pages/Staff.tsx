import { useState } from "react";
import { contacts, staff, type StaffGroup } from "../content";
import { Icon } from "../icons";
import { Chips, container, DarkBanner, PageHero, PersonCard, SearchBox } from "../ui";

const FILTERS = ["Барлығы", ...staff.map((g) => g.group)] as ("Барлығы" | StaffGroup)[];

export function StaffPage() {
  const [filter, setFilter] = useState<"Барлығы" | StaffGroup>("Барлығы");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = staff
    .filter((g) => filter === "Барлығы" || g.group === filter)
    .map((g) => ({ ...g, people: g.people.filter((p) => !q || `${p.name} ${p.role}`.toLowerCase().includes(q)) }))
    .filter((g) => g.people.length > 0);

  return (
    <>
      <PageHero breadcrumb="Қызметкерлер" title="Қызметкерлер" subtitle="Колледж басшылығы, оқытушылар мен қызметкерлер — студенттердің табысы үшін жұмыс істейтін команда." />
      <section className="bg-bg">
        <div className={`${container} flex flex-col gap-14 py-16`}>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
            <Chips items={FILTERS} value={filter} onChange={setFilter} />
            <SearchBox value={query} onChange={setQuery} placeholder="Аты-жөні бойынша іздеу…" className="md:w-[300px]" />
          </div>
          {groups.map((g) => (
            <div key={g.group} className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <h2 className="text-[28px] font-extrabold tracking-[-0.28px] text-fg">{g.group}</h2>
                <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[13px] font-semibold text-brand-strong">{g.people.length} адам</span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {g.people.map((p, i) => (
                  <PersonCard key={i} {...p} />
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="py-10 text-center text-muted-fg">Ешкім табылмады.</p>}
        </div>
      </section>
      <DarkBanner
        title="Біздің командаға қосылыңыз"
        text="Ағылшын тілінде сабақ беретін, дамуға ұмтылатын оқытушыларды іздейміз."
        actions={
          <a href={`mailto:${contacts.email}`} className="inline-flex items-center gap-2.5 rounded-xl bg-brand-strong px-[26px] py-4 font-semibold text-white">
            Бос орындар <Icon name="arrow" size={18} />
          </a>
        }
      />
    </>
  );
}
