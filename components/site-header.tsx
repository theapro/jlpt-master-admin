"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MoonIcon, SunIcon } from "lucide-react";
import { useI18n, useT } from "@/components/i18n-provider";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLocalePending, startLocaleTransition] = useTransition();

  const { locale } = useI18n();
  const t = useT();

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = useMemo(() => {
    const p = typeof pathname === "string" ? pathname : "/";

    if (p === "/" || p.startsWith("/dashboard")) return t("nav.dashboard");
    if (p.startsWith("/users")) return t("nav.users");
    if (p.startsWith("/admins")) return t("nav.admins");
    if (p.startsWith("/courses")) return t("nav.courses");
    if (p.startsWith("/messages")) return t("nav.messages");
    if (p.startsWith("/goals")) return t("nav.goals");
    if (p.startsWith("/bot-texts")) return t("nav.botTexts");
    if (p.startsWith("/bot-buttons")) return t("nav.botButtons");

    return t("nav.admin");
  }, [pathname, t]);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const setLocale = (value: string | null) => {
    const nextLocale = (SUPPORTED_LOCALES as readonly string[]).includes(
      String(value ?? "").toLowerCase(),
    )
      ? (String(value).toLowerCase() as Locale)
      : null;

    if (!nextLocale || nextLocale === locale) return;

    startLocaleTransition(async () => {
      try {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        });
      } finally {
        router.refresh();
      }
    });
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={locale}
            onValueChange={setLocale}
            items={SUPPORTED_LOCALES.map((value) => ({
              label: t(`language.${value}`),
              value,
            }))}
          >
            <SelectTrigger
              size="sm"
              className="w-28"
              disabled={isLocalePending}
            >
              <SelectValue placeholder={t("language.label")} />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="en">{t("language.en")}</SelectItem>
                <SelectItem value="ru">{t("language.ru")}</SelectItem>
                <SelectItem value="ja">{t("language.ja")}</SelectItem>
                <SelectItem value="uz">{t("language.uz")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={
              isDark ? t("theme.switchToLight") : t("theme.switchToDark")
            }
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  );
}
