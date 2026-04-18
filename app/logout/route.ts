import { NextRequest, NextResponse } from "next/server";

import { ADMIN_TOKEN_COOKIE } from "@/lib/backend";

export function GET(request: NextRequest) {
  const url = new URL("/login", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.delete(ADMIN_TOKEN_COOKIE);
  return res;
}
