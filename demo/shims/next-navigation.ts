import { useRoute } from "../router";

export function usePathname() {
  return useRoute().path;
}

export function redirect(path: string): never {
  location.hash = path;
  throw new Error("redirect");
}
