import { useState } from "react";
import { admissionDocuments, admissionSteps, featuredPrograms, homeNews, stats, testimonial, whyJihc } from "../content";
import { Icon, Rings } from "../icons";
import { href } from "../router";
import { BenefitCard, ButtonOutline, ButtonPrimary, container, Cta, IconBox, NewsCard, SectionTitle, Tag } from "../ui";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <Rings
        sizes={[720, 560, 400]}
        color="#3B82F6"
        dash={{ width: 14, pattern: "4 10" }}
        className="pointer-events-none absolute -top-[180px] left-[calc(50%+180px)] hidden lg:block"
      />
      <div className={`${container} relative flex flex-col gap-14 pb-20 pt-16 lg:flex-row lg:items-center lg:pb-[104px] lg:pt-[88px]`}>
        <div className="flex flex-col items-start gap-7 lg:w-[620px] lg:shrink-0">
          <div className="flex items-center gap-2.5 rounded-full border border-brand-light bg-brand px-4 py-2">
            <Icon name="cap" size={16} className="text-brand-light" />
            <span className="text-xs font-semibold tracking-[0.96px] text-brand-light">SDU UNIVERSITY ҚАМҚОРЛЫҒЫНДАҒЫ КОЛЛЕДЖ</span>
          </div>
          <h1 className="text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-white sm:text-[64px]">
            Болашақ
            <br />
            <span className="text-brand-light">көшбасшыларын</span>
            <br />
            бірге тәрбиелейміз
          </h1>
          <p className="text-[17px] leading-[1.6] text-white sm:text-[19px]">
            1993 жылдан бері ағылшын тілінде кәсіптік және техникалық білім беретін мемлекеттік колледж. «Білім-инновация» халықаралық қоғамдық қорының жүйесінде.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <ButtonPrimary href={href("/programs")}>Мамандықты таңдау</ButtonPrimary>
            <a
              id="tour"
              href={href("/about")}
              className="inline-flex items-center gap-2.5 rounded-xl border-[1.5px] border-white px-[26px] py-4 text-base font-semibold text-white hover:bg-white/10"
            >
              <Icon name="play" size={18} strokeWidth={2} />
              Виртуалды тур
            </a>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {["Ағылшын тілінде оқыту", "Грант және шәкіртақы", "SDU серіктестігі"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-sm font-medium text-white">
                <span className="flex rounded-full bg-brand p-[3px] text-brand-light">
                  <Icon name="check" size={12} strokeWidth={3} />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto h-[420px] w-full max-w-[524px] sm:h-[540px]">
          <div
            className="absolute inset-y-0 right-0 flex w-[84%] flex-col items-center justify-center gap-2.5 rounded-[32px] sm:bottom-5"
            style={{ backgroundImage: "linear-gradient(130deg, #3b82f6 0%, #132b5c 71.4%)" }}
          >
            <Icon name="image" size={40} strokeWidth={2} className="text-brand-soft" />
            <p className="text-sm font-medium text-white">Колледж фотосы</p>
          </div>
          <Rings sizes={[120]} color="#93C5FD" dash={{ width: 10, pattern: "3 7" }} className="absolute -right-9 -top-[30px] hidden sm:block" />
          <FloatCard icon="briefcase" value="95%" label="түлектер жұмысқа орналасады" className="bottom-[60px] left-0 sm:top-[380px] sm:bottom-auto" />
          <FloatCard icon="cap" value="15+" label="білім беру бағдарламасы" className="right-0 top-[60px] sm:-right-[66px] sm:left-auto" />
        </div>
      </div>
    </section>
  );
}

function FloatCard({ icon, value, label, className }: { icon: "briefcase" | "cap"; value: string; label: string; className: string }) {
  return (
    <div className={`absolute flex items-center gap-3.5 rounded-[18px] bg-white px-5 py-4 shadow-[0_16px_40px_rgba(10,20,51,0.22)] ${className}`}>
      <div className="rounded-xl bg-brand-tint p-2.5 text-brand-strong">
        <Icon name={icon} size={22} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[22px] font-extrabold tracking-[-0.22px] text-fg">{value}</span>
        <span className="text-[13px] font-medium text-muted-fg">{label}</span>
      </div>
    </div>
  );
}

function Stats() {
  return (
    <section className="border-b border-border bg-white">
      <div className={`${container} grid grid-cols-2 gap-8 py-12 lg:flex lg:items-center lg:justify-between`}>
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-[66px]">
            {i > 0 && <div className="hidden h-14 w-px bg-border lg:block" />}
            <div className="flex flex-col gap-1.5">
              <span className="text-[36px] font-extrabold tracking-[-0.02em] text-brand-strong sm:text-[44px]">{s.value}</span>
              <span className="text-[15px] font-medium text-muted-fg">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Specialties() {
  return (
    <section className="bg-bg">
      <div className={`${container} flex flex-col gap-12 py-16 lg:py-[112px]`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle eyebrow="МАМАНДЫҚТАР" title="Өз бағытыңды таңда" lead="Барлық бағдарламалар ағылшын тілінде және нақты тәжірибеге бағытталған." />
          <ButtonOutline href={href("/programs")} className="self-start lg:self-auto">
            Барлық бағдарламалар
          </ButtonOutline>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPrograms.map((p) => (
            <div key={p.title} className="flex flex-col gap-[18px] rounded-[20px] border border-border bg-card p-7 drop-shadow-[0_8px_12px_rgba(15,23,41,0.06)]">
              <div className="flex items-center justify-between">
                <IconBox name={p.icon} large />
                <Tag>{p.tag}</Tag>
              </div>
              <h3 className="text-xl font-bold leading-[1.3] text-fg">{p.title}</h3>
              <p className="flex-1 text-[15px] leading-[1.55] text-muted-fg">{p.short}</p>
              <a href={href("/programs")} className="flex items-center gap-2 text-[15px] font-semibold text-brand-strong">
                Толығырақ <Icon name="arrow" size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyJihc() {
  return (
    <section className="bg-white">
      <div className={`${container} flex flex-col gap-16 py-16 lg:flex-row lg:items-center lg:py-[112px]`}>
        <div className="flex flex-col gap-7 lg:w-[500px] lg:shrink-0">
          <div className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold tracking-[1.3px] text-brand-strong">НЕГЕ JIHC?</p>
            <h2 className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg sm:text-[40px]">Білім — тек сабақ емес, болашаққа дайындық</h2>
            <p className="text-[17px] leading-[1.6] text-muted-fg">
              Біз студенттің кәсіби дағдысын ғана емес, мінезін, көшбасшылық қабілетін және өзіне деген сенімін дамытамыз.
            </p>
          </div>
          <div className="relative h-[280px] overflow-hidden rounded-3xl bg-brand-tint">
            <Icon name="image" size={36} strokeWidth={2.4} className="absolute right-11 top-[30px] text-brand-light" />
            <div className="absolute left-6 top-[120px] flex w-[300px] max-w-[calc(100%-48px)] flex-col gap-2.5 rounded-[18px] bg-white p-6 shadow-[0_10px_30px_rgba(10,20,51,0.12)]">
              <span className="text-[32px] font-extrabold leading-[0.6] text-brand">«</span>
              <p className="text-[15px] font-medium leading-normal text-fg">{testimonial.quote}</p>
              <p className="text-[13px] text-muted-fg">{testimonial.author}</p>
            </div>
          </div>
        </div>
        <div className="grid flex-1 gap-6 sm:grid-cols-2">
          {whyJihc.map((b) => (
            <BenefitCard key={b.title} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Admission() {
  const [docsOpen, setDocsOpen] = useState(false);
  return (
    <section id="admission" className="bg-bg">
      <div className={`${container} flex flex-col items-center gap-14 py-16 lg:py-[112px]`}>
        <SectionTitle eyebrow="ТАЛАПКЕРГЕ" title="Қалай түсуге болады?" lead="Төрт қарапайым қадам. Сұрақ туындаса, қабылдау комиссиясы әрдайым көмектеседі." center />
        <div className="grid w-full gap-8 rounded-[28px] border border-border bg-white p-8 shadow-[0_8px_24px_rgba(10,20,51,0.05)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:p-10">
          {admissionSteps.map((s, i) => (
            <div key={s.title} className="flex flex-col gap-3.5">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white">{String(i + 1).padStart(2, "0")}</div>
              <p className="text-lg font-bold leading-[1.35] text-fg">{s.title}</p>
              <p className="text-[15px] leading-[1.55] text-muted-fg">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3.5">
          <ButtonPrimary href={href("/", "lead")}>Құжат тапсыру</ButtonPrimary>
          <button
            onClick={() => setDocsOpen(!docsOpen)}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-brand-soft bg-card px-[26px] py-4 text-base font-semibold text-brand-strong hover:border-brand-light"
          >
            Қажетті құжаттар тізімі
          </button>
        </div>
        {docsOpen && (
          <ul className="w-full max-w-[640px] space-y-2.5 rounded-[20px] border border-border bg-white p-6 text-[15px] text-fg">
            {admissionDocuments.map((d) => (
              <li key={d} className="flex gap-3">
                <Icon name="file" size={20} className="shrink-0 text-brand-strong" />
                {d}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function News() {
  return (
    <section className="bg-white">
      <div className={`${container} flex flex-col gap-12 py-16 lg:py-[112px]`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="ЖАҢАЛЫҚТАР" title="Колледж өмірі" />
          <ButtonOutline href={href("/news")} className="self-start sm:self-auto">
            Барлық жаңалықтар
          </ButtonOutline>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {homeNews.map((n) => (
            <NewsCard key={n.title} item={n} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Specialties />
      <WhyJihc />
      <Admission />
      <News />
      <div id="lead">
        <Cta />
      </div>
    </>
  );
}
