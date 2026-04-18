"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Locale } from "@/lib/i18n/config";

type Messages = Record<string, unknown>;

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

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

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider is missing");
  return ctx;
}

export function useT() {
  const { messages } = useI18n();

  return useMemo(() => {
    return (key: string) => toText(getMessageValue(messages, key), key);
  }, [messages]);
}
