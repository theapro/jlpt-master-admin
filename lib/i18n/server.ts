import "server-only";

import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  pickLocaleFromAcceptLanguage,
  type Locale,
  normalizeLocale,
} from "./config";

type Messages = Record<string, unknown>;

const loaders: Record<Locale, () => Promise<Messages>> = {
  en: () => import("@/messages/en.json").then((m) => m.default as Messages),
  ru: () => import("@/messages/ru.json").then((m) => m.default as Messages),
  ja: () => import("@/messages/ja.json").then((m) => m.default as Messages),
  uz: () => import("@/messages/uz.json").then((m) => m.default as Messages),
};

function getMessageValue(messages: Messages, key: string): unknown {
  const parts = key.split(".").filter(Boolean);
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function toText(value: unknown, key: string): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return key;
  return String(value);
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  const accept = (await headers()).get("accept-language");
  return pickLocaleFromAcceptLanguage(accept) ?? DEFAULT_LOCALE;
}

export async function getMessages(locale?: Locale): Promise<Messages> {
  const l = locale ?? (await getRequestLocale());
  const load = loaders[l] ?? loaders[DEFAULT_LOCALE];
  return await load();
}

export async function getServerT(locale?: Locale) {
  const l = locale ?? (await getRequestLocale());
  const messages = await getMessages(l);

  const t = (key: string) => {
    const value = getMessageValue(messages, key);
    return toText(value, key);
  };

  return { locale: l, messages, t };
}
