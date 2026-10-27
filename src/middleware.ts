import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { ROLE_HOME, SECTION_ROLES } from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as Role | undefined;
    const path = req.nextUrl.pathname;
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    const section = Object.keys(SECTION_ROLES).find((s) => path === s || path.startsWith(`${s}/`));
    if (section && !SECTION_ROLES[section].includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  },
  { pages: { signIn: "/login" } },
);

export const config = {
  matcher: ["/((?!login|api/auth|_next|favicon.ico).*)"],
};
