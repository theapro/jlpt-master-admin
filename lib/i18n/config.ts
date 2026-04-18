export const LOCALE_COOKIE = "locale" as const;

export const SUPPORTED_LOCALES = ["en", "ru", "ja", "uz"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function normalizeLocale(value: string | null | undefined): Locale {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  const base = raw.split("-")[0] ?? "";

  return (SUPPORTED_LOCALES as readonly string[]).includes(base)
    ? (base as Locale)
    : DEFAULT_LOCALE;
}

export function pickLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): Locale {
  const raw = typeof acceptLanguage === "string" ? acceptLanguage : "";

  // naive but effective: take the first locale and reduce to base tag.
  const first = raw.split(",")[0]?.trim() ?? "";
  const base = first.split("-")[0]?.trim() ?? "";
  return normalizeLocale(base);
}
