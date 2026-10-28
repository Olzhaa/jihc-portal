// Колледж фотолары (уақытша, olzha жіберген). Нақты фотолар келгенде осы жерде ауыстырылады.
// new URL(...) арқылы: Vite файлдарды бандлға қосады, ал Next-тің .jpg типтерімен қақтығыспайды.
export const photos = {
  football: new URL("./photos/football.jpg", import.meta.url).href,
  lab: new URL("./photos/lab.jpg", import.meta.url).href,
  stage: new URL("./photos/stage.jpg", import.meta.url).href,
};
