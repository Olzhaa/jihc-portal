import { useSessionUser } from "./store";

/** Pages render only behind the App guard, so a session user is always present. */
export function useMe() {
  return useSessionUser()!;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
