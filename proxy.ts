import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_TOKEN_COOKIE } from "@/lib/backend";

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/users",
  "/admins",
  "/courses",
  "/messages",
  "/goals",
  "/bot-texts",
  "/bot-buttons",
] as const;

const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (pathname === "/admin/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login") {
    if (token) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/users/:path*",
    "/admins/:path*",
    "/courses/:path*",
    "/messages/:path*",
    "/goals/:path*",
    "/bot-texts/:path*",
    "/bot-buttons/:path*",
    "/login",
  ],
};
