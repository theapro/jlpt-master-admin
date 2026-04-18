import { NextResponse } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
} from "@/lib/i18n/config";

export async function POST(req: Request) {
  let locale = DEFAULT_LOCALE;

  try {
    const body = (await req.json().catch(() => null)) as unknown;
    const raw =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).locale
        : undefined;
    locale = normalizeLocale(typeof raw === "string" ? raw : undefined);
  } catch {
    // ignore
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
