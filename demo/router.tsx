import { useSyncExternalStore } from "react";

function read() {
  const raw = location.hash.slice(1) || "/";
  const [path, qs = ""] = raw.split("?");
  return { path: path || "/", qs };
}

let cache = read();
let key = location.hash;
function snapshot() {
  if (location.hash !== key) {
    key = location.hash;
    cache = read();
  }
  return cache;
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function useRoute() {
  const r = useSyncExternalStore(subscribe, snapshot);
  return { path: r.path, query: new URLSearchParams(r.qs) };
}

export function navigate(path: string) {
  location.hash = path;
}
