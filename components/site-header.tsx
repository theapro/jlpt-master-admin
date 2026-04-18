"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MoonIcon, SunIcon } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = useMemo(() => {
    const p = typeof pathname === "string" ? pathname : "/";

    if (p === "/" || p.startsWith("/dashboard")) return "Dashboard";
    if (p.startsWith("/users")) return "Users";
    if (p.startsWith("/admins")) return "Admins";
    if (p.startsWith("/courses")) return "Courses";
    if (p.startsWith("/messages")) return "Messages";
    if (p.startsWith("/goals")) return "Goals";
    if (p.startsWith("/bot-texts")) return "Bot · Texts";
    if (p.startsWith("/bot-buttons")) return "Bot · Buttons";

    return "Admin";
  }, [pathname]);

  const isDark = mounted ? resolvedTheme === "dark" : false;

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
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  );
}
