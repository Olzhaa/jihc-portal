// Fictional curator records for the demo group, shared by prisma/seed.ts and the in-browser demo.
// Dates are YYYY-MM-DD strings relative to `today`.

import { addDays, semesterLabel, templateTasks } from "./curator";

type Student = { id: string; name: string };
type Row = Record<string, unknown>;

export function demoCuratorData(students: Student[], course: number | null, today: string, rand: () => number) {
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const some = <T,>(a: T[], n: number) => [...a].sort(() => rand() - 0.5).slice(0, n);
  const ago = (d: number) => addDays(today, -d);
  const girl = (name: string) => /(ова|ева|қали)$/.test(name) || /^(Айдана|Әсел|Аружан|Мадина|Томирис|Жансая|Аяулым|Дильназ|Камила|Балнұр)/.test(name);
  const surname = (name: string) => name.split(" ")[1] ?? "";
  const phone = () => `+7 70${Math.floor(rand() * 10)} ${String(100 + Math.floor(rand() * 900))} ${String(10 + Math.floor(rand() * 90))} ${String(10 + Math.floor(rand() * 90))}`;
  const year = Number(today.slice(0, 4)) - 18;

  const profiles: Record<string, Row> = {};
  students.forEach((s, i) => {
    // One birthday falls in the next couple of weeks so the widget has something to show.
    const birth = i === 2 ? `${year}${addDays(today, 9).slice(4)}` : `${year - (rand() < 0.3 ? 1 : 0)}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`;
    profiles[s.id] = {
      birthDate: birth,
      gender: girl(s.name) ? "Қыз" : "Ұл",
      phone: phone(),
      city: pick(["Тараз", "Тараз", "Тараз", "Жамбыл ауданы", "Байзақ ауданы", "Шу"]),
      address: `${pick(["Абай", "Төле би", "Қойгелді", "Жамбыл", "Сүлейменов"])} к-сі, ${1 + Math.floor(rand() * 120)}`,
      siblings: pick(["1 інісі", "2 ағасы, 1 қарындасы", "1 әпкесі", "Жалғыз бала", "3 бауыры"]),
      activity: i === 5 || i === 9 ? "Тұйық — назар керек" : pick(["Белсенді", "Орташа", "Белсенді", "Орташа", "Орташа"]),
      hobbies: some(["Сурет салу", "Фото", "Видео", "Спорт", "Музыка", "Кітап", "Ойын"], 1 + Math.floor(rand() * 3)),
      club: rand() < 0.5 ? pick(["Дизайн клубы", "Волейбол", "Домбыра үйірмесі", "Дебат клубы", "Фото студия"]) : null,
      strongSubjects: pick(["Graph Design", "Web-бағдарламалау", "Кәсіби ағылшын тілі", "Деректер қоры"]),
      weakSubjects: rand() < 0.6 ? pick(["Математика", "Кәсіби ағылшын тілі", "Деректер қоры"]) : null,
      goal: rand() < 0.6 ? pick(["Өз дизайн студиясын ашу", "Халықаралық агенттікте жұмыс істеу", "ЖОО-ға грантпен түсу", "UI/UX маманы болу"]) : null,
      designDirection: pick(["Полиграфия", "UI/веб", "Моушн", "Брендинг", "Иллюстрация", "Әлі таңдамаған"]),
      futurePlan: pick(["ЖОО", "ЖОО", "Жұмыс", "Өз ісі", "Белгісіз"]),
      mbti: rand() < 0.5 ? pick(["INFP", "ENFP", "ISFP", "INTJ", "ESTJ", "ISTJ", "ENTP"]) : null,
      gallup: rand() < 0.4 ? some(["Achiever", "Learner", "Ideation", "Empathy", "Responsibility", "Strategic", "Woo", "Relator"], 5) : [],
      gardner: rand() < 0.4 ? some(["Кеңістіктік", "Тұлғааралық", "Лингвистикалық", "Музыкалық", "Ішкі тұлғалық"], 2) : [],
      studyCountries: [],
      parentConsent: rand() < 0.85,
      homeVisited: i < 3,
      homeVisitDate: i < 3 ? ago(20 + i * 9) : null,
    };
    if (profiles[s.id].futurePlan === "ЖОО") {
      Object.assign(profiles[s.id], {
        targetUniversity: pick(["Satbayev University", "ҚазҰУ", "Astana IT University", "SDU", "Bilkent University"]),
        targetSpecialty: pick(["Графикалық дизайн", "Цифрлық медиа", "UX дизайн"]),
        studyCountries: [pick(["Қазақстан", "Қазақстан", "Түркия", "Оңтүстік Корея"])],
        admissionStatus: pick(["Әлі шешпеген", "Жоспарлауда", "Құжат дайындауда"]),
        ieltsScore: rand() < 0.4 ? pick([5.5, 6, 6.5]) : null,
      });
    }
  });

  const guardians: Row[] = [];
  students.slice(0, 10).forEach((s, i) => {
    const sn = surname(s.name).replace(/а$/, "");
    guardians.push({
      studentId: s.id, name: `${pick(["Гүлнар", "Жанар", "Сәуле", "Айгүл", "Мейрамкүл"])} ${sn}а`, relation: "Ана", phone: phone(),
      workplace: pick(["№12 мектеп", "Емхана", "Жеке кәсіпкер", "Әкімдік", "Банк"]), familyStatus: i === 4 ? "Жартылай отбасы" : "Толық отбасы",
      responsiveness: i === 6 ? "Нашар" : pick(["Өте белсенді", "Белсенді", "Орташа"]),
    });
    if (i % 2 === 0 && i !== 4) {
      guardians.push({ studentId: s.id, name: `${pick(["Ерлан", "Бақыт", "Нұржан", "Асқар", "Мұрат"])} ${sn}`, relation: "Әке", phone: phone(), workplace: pick(["Құрылыс компаниясы", "Жүргізуші", "Фермер", "Зауыт"]), familyStatus: "Толық отбасы", responsiveness: "Орташа" });
    }
  });

  // Recent one-to-ones for most of the group; the last few students have none (→ "Назар керек").
  const contacts: Row[] = [];
  const SUMMARY = ["Сабаққа кешігу", "Логотип жобасының барысы", "Топтағы достық қарым-қатынас", "Аралық бақылауға дайындық", "Үйірме таңдау", "Дизайн бағытын таңдау", "Бейімделу: колледжде өзін қалай сезінеді"];
  students.slice(0, students.length - 4).forEach((s, i) => {
    const d = 1 + ((i * 11) % 50);
    contacts.push({
      studentId: s.id, date: ago(d), withWhom: "Студент", summary: pick(SUMMARY), topics: [pick(["Оқу үлгерімі", "Тәртіп", "Достық қарым-қатынас", "Оқуға түсу"])],
      mood: pick(["Өте жақсы", "Жақсы", "Жақсы", "Орташа"]), durationMin: pick([10, 15, 20]),
      agreedStep: i % 3 === 0 ? pick(["Жұмаға дейін жобаның эскизін көрсету", "Математикадан тәлімгермен 2 рет жұмыс", "Кешікпеу: 2 апта бақылау"]) : null,
      followUpDate: i % 3 === 0 ? addDays(ago(d), 14) : null, agreementDone: i % 6 === 0, notifyParent: false,
    });
  });
  const quiet = students[5];
  if (quiet) contacts.push({ studentId: quiet.id, date: ago(75), withWhom: "Студент", summary: "Танысу кездесуі (7 сұрақ)", topics: ["Басқа"], mood: "Орташа", agreementDone: false, notifyParent: false });
  students.slice(0, 3).forEach((s, i) => {
    contacts.push({
      studentId: s.id, date: ago(6 + i * 13), withWhom: "Ата-ана", summary: i === 1 ? "Сабаққа келмеу себебі" : "Тоқсан қорытындысы бойынша жеке кездесу", topics: ["Оқу үлгерімі", "Отбасы"].slice(0, 1 + i % 2),
      discussed: "✅ Жобаларды уақытында тапсырады\n✏️ Математикадан қосымша жұмыс керек\n🤝 Үйде сабаққа дайындалуға жағдай жасау",
      agreedStep: "2 аптадан кейін қайта хабарласу", followUpDate: addDays(ago(6 + i * 13), 14), agreementDone: false, notifyParent: false,
    });
  });

  const tasks = templateTasks(today).map((t, i) => ({ ...t, done: i % 5 === 1 }));

  const ev = (r: Row) => ({ directions: [], responsibleIds: [], parentPermission: false, parentsAttend: false, ...r });
  const events: Row[] = [
    ev({ title: "Топ ережелерін бірге құрастыру", type: "Сынып сағаты", format: "Топтық жарыс", date: ago(45), status: "Талдау жасалды", directions: ["Рухани-адамгершілік"], goal: "Топтың ортақ ережелерін студенттердің өзі құрастыруы", analysis: "4 сала бойынша 14 ереже ұсынылды, 4-еуі бекітілді. Плакатты 2 студент безендірді.", feedback: "Студенттерге өз ережесін жазу ұнады", responsibleIds: some(students, 2).map((s) => s.id) }),
    ev({ title: "Мұғалімдер күніне дайындық", type: "Кеш / мереке", date: ago(25), status: "Өтті", directions: ["Рухани-адамгершілік", "Көпмәдениетті / көркем-эстетикалық"], goal: "Студенттер ұйымдастыратын мереке, жауапкершілікті бөлу", place: "Акт залы", budget: 15000, responsibleIds: some(students, 3).map((s) => s.id) }),
    ev({ title: "Дизайндағы плагиат және авторлық құқық", type: "Тәрбие сағаты", format: "Дебат", date: addDays(today, 6), status: "Дайындық", directions: ["Зияткерлік", "Патриоттық / азаматтық / құқықтық"], goal: "Академиялық адалдық құндылығын түсіну", considerations: "Екі командаға тең бөлу, тұйық студенттерге рөл беру", expectedResult: "Әр студент өз жұмысына дереккөз көрсетуді үйренеді", responsibleIds: some(students, 2).map((s) => s.id) }),
    ev({ title: "Баспаханаға өндірістік экскурсия", type: "Экскурсия / саяхат", date: addDays(today, 20), status: "Жоспарланды", directions: ["Еңбек / экономикалық / экологиялық"], place: "«Тараз-Принт» баспаханасы", parentPermission: true }),
  ];

  const achievements: Row[] = [
    { studentId: students[0]?.id, title: "«Жас дизайнер» облыстық байқауы", type: "Байқау / конкурс", level: "Облыс", result: "2-орын", date: ago(30), parentNotified: true },
    { studentId: students[1]?.id, title: "Figma негіздері онлайн курсы", type: "Сертификат / курс", level: "Халықаралық", result: "Аяқтады", date: ago(50), parentNotified: false },
    { studentId: students[3]?.id, title: "Колледж спартакиадасы — волейбол", type: "Спорт", level: "Колледж", result: "1-орын / Гран-при", date: ago(18), parentNotified: true },
    { studentId: students[7]?.id, title: "Жергілікті наубайханаға логотип", type: "Нақты клиент жобасы", level: "Қала", result: "Аяқтады", date: ago(12), parentNotified: false },
  ].filter((a) => a.studentId);

  const books: Row[] = [
    { studentId: students[0]?.id, title: "Абай жолы", author: "Мұхтар Әуезов", status: "Оқып жатыр", language: "Қазақша", genres: ["Классика"], startedAt: ago(20) },
    { studentId: students[0]?.id, title: "Steal Like an Artist", author: "Austin Kleon", status: "Оқып бітірді", language: "Ағылшынша", genres: ["Өзін-өзі дамыту"], rating: "5", pages: 160, startedAt: ago(60), finishedAt: ago(35), review: "Шығармашылық идеяны қайдан табуға болатыны туралы. Әр жобаға мудборд жинауды бастадым." },
    { studentId: students[1]?.id, title: "Көшпенділер", author: "Ілияс Есенберлин", status: "Оқып бітірді", language: "Қазақша", genres: ["Тарих", "Көркем әдебиет"], rating: "4", startedAt: ago(80), finishedAt: ago(40) },
    { studentId: students[4]?.id, title: "Атомдық әдеттер", author: "Джеймс Клир", status: "Оқып жатыр", language: "Қазақша", genres: ["Өзін-өзі дамыту"], startedAt: ago(10) },
    { studentId: students[6]?.id, title: "Don't Make Me Think", author: "Steve Krug", status: "Жоспарда", language: "Ағылшынша", genres: ["Ғылыми-көпшілік"] },
  ].filter((b) => b.studentId);

  const tests: Row[] = [
    { studentId: students[0]?.id, test: "Holland RIASEC (кәсіби қызығушылық)", date: ago(28), conductedBy: "Куратор", privacy: "Куратор көреді", result: "AES — көркем, кәсіпкерлік", discussed: true, agreedStep: "Брендинг бағытын таңдау" },
    { studentId: students[1]?.id, test: "Holland RIASEC (кәсіби қызығушылық)", date: ago(28), conductedBy: "Куратор", privacy: "Куратор көреді", result: "AIS", discussed: false },
    { studentId: students[2]?.id, test: "Big Five / IPIP (тұлға)", date: ago(14), conductedBy: "Куратор", privacy: "Куратор көреді", result: "Ашықтық жоғары, экстраверсия орташа", discussed: true },
    { studentId: students[5]?.id, test: "Эмоционалдық жағдай (психолог)", date: ago(40), conductedBy: "Психолог", privacy: "Тек психолог", discussed: false },
  ].filter((t) => t.studentId);

  const semester = semesterLabel(course, new Date(`${today}T00:00:00`));
  const reflections: Row[] = students.slice(1, 4).map((s, i) => ({
    studentId: s.id, semester, createdAt: ago(3 + i),
    pride: ["Алғаш рет нақты клиентке жұмыс жасадым", "Аралық бақылауды жақсы тапсырдым", "Топ ережелерін жазуға қатыстым"][i],
    difficulty: ["Уақытты жоспарлау", "Математика", "Көпшілік алдында сөйлеу"][i],
    helpNeeded: ["Портфолио құрастыруға кеңес", "Математикадан тәлімгер", "Презентация жасауға көмек"][i],
    nextGoal: ["Behance-ке 5 жұмыс жүктеу", "Орташа балды 85-ке көтеру", "Дебатқа қатысу"][i],
    diligence: ["4", "3", "5"][i], responsibility: ["5", "4", "4"][i], selfDevelopment: ["4", "3", "4"][i], designInterest: ["Брендинг", "UI/веб", "Иллюстрация"][i],
  }));

  return { profiles, guardians, contacts, tasks, events, achievements, books, tests, reflections };
}
