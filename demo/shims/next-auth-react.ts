import { logout } from "../store";

export function signOut() {
  logout();
  location.hash = "/login";
}

export function signIn() {}
