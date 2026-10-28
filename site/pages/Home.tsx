import { admissionDocuments, admissionNotes, admissionSteps, contacts, vacancies, featuredPrograms, homeNews, stats, testimonial, whyJihc } from "../content";
import { Icon, Rings } from "../icons";
import { photos } from "../photos";
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
          <img
            src={photos.stage}
            alt="Колледж студенттері сахнада"
            className="absolute inset-y-0 right-0 h-full w-[84%] rounded-[32px] object-cover sm:bottom-5 sm:h-auto"
          />
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
            <img src={photos.football} alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-[center_70%]" />
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
          <ButtonOutline href={href("/", "documents")} arrow={false}>
            Қажетті құжаттар тізімі
          </ButtonOutline>
        </div>
      </div>
    </section>
  );
}

function Documents() {
  return (
    <section id="documents" className="bg-white">
      <div className={`${container} flex flex-col gap-10 py-16 lg:flex-row lg:gap-16 lg:py-[112px]`}>
        <div className="flex flex-col gap-8 lg:w-[440px] lg:shrink-0">
          <SectionTitle eyebrow="ТАЛАПКЕРГЕ" title="Қажетті құжаттар" lead="Құжаттарды қабылдау комиссиясына өзіңіз немесе ата-анаңызбен бірге әкелесіз." />
          <div className="flex flex-col gap-3">
            {admissionNotes.map((n) => (
              <div key={n.title} className="flex items-center gap-4 rounded-2xl bg-bg px-5 py-4">
                <IconBox name={n.icon} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-muted-fg">{n.title}</span>
                  <span className="text-[15px] font-semibold text-fg">{n.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6 rounded-[28px] border border-border bg-bg p-6 sm:p-10">
          <ol className="flex flex-col gap-3">
            {admissionDocuments.map((d, i) => (
              <li key={d} className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-[15px] font-extrabold text-white">{i + 1}</span>
                <span className="text-[16px] font-medium leading-[1.45] text-fg">{d}</span>
                <Icon name="check" size={20} className="ml-auto shrink-0 text-brand" />
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-fg">Түпнұсқалармен бірге көшірмелерін ала келіңіз.</p>
            <ButtonPrimary href={href("/", "lead")} className="self-start sm:self-auto">
              Өтінім қалдыру
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </section>
  );
}

function Vacancies() {
  return (
    <section id="vacancies" className="bg-bg">
      <div className={`${container} flex flex-col gap-12 py-16 lg:py-[112px]`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="МАНСАП" title="Бос вакансиялар" lead="Ағылшын тілінде сабақ беретін, дамуға ұмтылатын мамандарды командамызға шақырамыз." />
          <ButtonOutline href={href("/staff")} className="self-start sm:self-auto">
            Біздің команда
          </ButtonOutline>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((v) => (
            <article key={v.title} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-7 shadow-[0_8px_24px_rgba(10,20,51,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <IconBox name="briefcase" />
                <Tag>{v.department}</Tag>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold leading-[1.3] text-fg">{v.title}</h3>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-fg">
                  <Icon name="clock" size={16} className="text-brand" /> {v.type}
                </span>
              </div>
              <ul className="flex flex-1 flex-col gap-2.5">
                {v.requirements.map((r) => (
                  <li key={r} className="flex gap-2.5 text-[15px] leading-[1.5] text-muted-fg">
                    <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-strong" />
                    {r}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${contacts.email}?subject=${encodeURIComponent(`Вакансия: ${v.title}`)}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-strong px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Түйіндеме жіберу <Icon name="arrow" size={16} />
              </a>
            </article>
          ))}
        </div>
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
      <Documents />
      <News />
      <Vacancies />
      <div id="lead">
        <Cta />
      </div>
    </>
  );
}
