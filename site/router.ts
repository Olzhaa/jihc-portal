import { useEffect, useSyncExternalStore } from "react";

// Hash маршрутизация: GitHub Pages-те де, кез келген статикалық серверде де жұмыс істейді.
// Пішімі: #/about немесе #/?to=admission (бет ішіндегі бөлімге секіру).

export type Route = { path: string; to: string | null };

function read(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path: path || "/", to: new URLSearchParams(query).get("to") };
}

let current = read();
const listeners = new Set<() => void>();
window.addEventListener("hashchange", () => {
  current = read();
  listeners.forEach((l) => l());
});

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

export function href(path: string, to?: string) {
  return `#${path}${to ? `?to=${to}` : ""}`;
}

// Маршрут ауысқанда бет басына немесе көрсетілген бөлімге айналдырады.
export function useScrollOnRoute(route: Route) {
  useEffect(() => {
    if (route.to) {
      document.getElementById(route.to)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [route]);
}
