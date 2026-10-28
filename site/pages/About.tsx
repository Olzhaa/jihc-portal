import { about, staff } from "../content";
import { photos } from "../photos";
import { href } from "../router";
import { BenefitCard, ButtonOutline, container, Cta, Eyebrow, PageHero, PersonCard, PhotoPlaceholder, SectionTitle } from "../ui";

function Intro() {
  return (
    <section className="bg-white">
      <div className={`${container} flex flex-col gap-[72px] py-16 lg:flex-row lg:items-center lg:py-[112px]`}>
        <div className="flex flex-col gap-6 lg:w-[560px] lg:shrink-0">
          <SectionTitle eyebrow="БІЗ КІМБІЗ" title="Мемлекеттік колледж, халықаралық стандарт" />
          {about.intro.map((p) => (
            <p key={p} className="text-[17px] leading-[1.65] text-muted-fg">
              {p}
            </p>
          ))}
          <div className="flex items-center gap-3.5 rounded-2xl bg-bg px-5 py-4">
            <div className="size-12 shrink-0 rounded-full bg-brand-soft" />
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-bold text-fg">{about.director.name}</p>
              <p className="text-sm text-muted-fg">{about.director.role}</p>
            </div>
          </div>
        </div>
        <div className="relative mx-auto h-[420px] w-full max-w-[568px] sm:h-[520px]">
          <PhotoPlaceholder label="Кампус" src={photos.lab} className="absolute left-0 top-0 h-[360px] w-[70%] rounded-3xl sm:h-[440px] sm:w-[360px]" />
          <PhotoPlaceholder
            label="Студенттер"
            src={photos.stage}
            className="absolute bottom-0 right-0 h-[240px] w-[50%] rounded-3xl border-8 border-white shadow-[0_16px_40px_rgba(10,20,51,0.15)] sm:h-[300px] sm:w-[260px]"
          />
          <div className="absolute right-0 top-10 flex flex-col gap-0.5 rounded-[18px] bg-brand-strong px-[22px] py-[18px] text-white shadow-[0_12px_30px_rgba(10,20,51,0.25)] sm:left-[330px] sm:right-auto">
            <span className="text-[30px] font-extrabold tracking-[-0.3px]">33 жыл</span>
            <span className="text-[13px] font-medium">білім беру тәжірибесі</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section className="bg-bg">
      <div className={`${container} flex flex-col items-center gap-12 py-16 lg:py-[112px]`}>
        <SectionTitle eyebrow="ҚҰНДЫЛЫҚТАРЫМЫЗ" title="Миссия, пайым және құндылықтар" center />
        <div className="grid w-full gap-6 md:grid-cols-3">
          {about.values.map((v) => (
            <BenefitCard key={v.title} {...v} />
          ))}
        </div>
      </div>
    </section>
  );
}

function History() {
  return (
    <section className="bg-white">
      <div className={`${container} flex flex-col gap-12 py-16 lg:py-[112px]`}>
        <SectionTitle eyebrow="ТАРИХ" title="Біздің жол" />
        <div className="relative grid gap-8 rounded-[28px] border border-border bg-bg p-8 sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
          <div className="absolute left-[49px] right-[49px] top-[47px] hidden h-0.5 bg-brand-soft lg:block" />
          {about.history.map((h) => (
            <div key={h.title} className="relative flex flex-col gap-3.5">
              <span className="flex size-4 items-center justify-center rounded-full bg-brand ring-[6px] ring-brand-soft">
                <span className="size-1.5 rounded-full bg-white" />
              </span>
              <span className="text-[28px] font-extrabold tracking-[-0.28px] text-brand-strong">{h.year}</span>
              <p className="text-[17px] font-bold text-fg">{h.title}</p>
              <p className="text-[15px] leading-[1.55] text-muted-fg">{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DarkStats() {
  return (
    <section className="bg-ink">
      <div className={`${container} grid grid-cols-2 gap-8 py-16 lg:flex lg:justify-between`}>
        {about.stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5">
            <span className="text-[40px] font-extrabold tracking-[-0.02em] text-white sm:text-[48px]">{s.value}</span>
            <span className="text-[15px] font-medium text-brand-light">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Leadership() {
  return (
    <section id="leadership" className="bg-bg">
      <div className={`${container} flex flex-col gap-12 py-16 lg:py-[112px]`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="ӘКІМШІЛІК" title="Колледж басшылығы" />
          <ButtonOutline href={href("/staff")} className="self-start px-[22px] py-3.5 sm:self-auto">
            Барлық оқытушылар
          </ButtonOutline>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {staff[0].people.map((p) => (
            <PersonCard key={p.role} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section className="bg-white">
      <div className={`${container} flex flex-col items-center gap-10 py-16 lg:py-24`}>
        <Eyebrow muted>СЕРІКТЕСТЕРІМІЗ</Eyebrow>
        <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {about.partners.map((p, i) => (
            <div key={i} className="flex items-center justify-center rounded-2xl border border-border bg-bg px-5 py-7 text-center text-base font-bold text-muted-fg">
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <>
      <PageHero breadcrumb="Колледж туралы" title="Колледж туралы" subtitle="1993 жылдан бері ағылшын тілінде сапалы кәсіптік және техникалық білім беріп келеміз." />
      <Intro />
      <Mission />
      <History />
      <DarkStats />
      <Leadership />
      <Partners />
      <Cta />
    </>
  );
}
