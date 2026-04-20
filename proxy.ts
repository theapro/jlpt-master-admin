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

const getPublicOrigin = (req: NextRequest) => {
  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = req.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || req.headers.get("host")?.trim();

  const fallbackOrigin = new URL(req.url).origin;
  if (!host) return fallbackOrigin;

  const protocol =
    forwardedProto || new URL(fallbackOrigin).protocol.replace(":", "");
  return `${protocol}://${host}`;
};

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  // Keep login always reachable. A stale/invalid token can otherwise cause
  // /dashboard -> (app redirect) /login -> (proxy redirect) /dashboard loops.
  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    const url = new URL("/login", getPublicOrigin(req));
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  if (isProtectedPath(pathname) && !token) {
    const url = new URL("/login", getPublicOrigin(req));
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
