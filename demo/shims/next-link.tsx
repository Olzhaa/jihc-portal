import type { AnchorHTMLAttributes } from "react";

/** Demo build: app paths become hash routes so the static site works on GitHub Pages. */
export default function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const target = href.startsWith("?") ? `#${location.hash.slice(1).split("?")[0] || "/"}${href}` : href.startsWith("/") ? `#${href}` : href;
  return <a href={target} {...props} />;
}
