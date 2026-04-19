import { NextRequest, NextResponse } from "next/server";

import { ADMIN_TOKEN_COOKIE } from "@/lib/backend";

function getPublicOrigin(request: NextRequest) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();

  const fallbackOrigin = new URL(request.url).origin;
  if (!host) return fallbackOrigin;

  const protocol =
    forwardedProto || new URL(fallbackOrigin).protocol.replace(":", "");
  return `${protocol}://${host}`;
}

export function GET(request: NextRequest) {
  const url = new URL("/login", getPublicOrigin(request));
  const res = NextResponse.redirect(url);
  res.cookies.delete(ADMIN_TOKEN_COOKIE);
  return res;
}
