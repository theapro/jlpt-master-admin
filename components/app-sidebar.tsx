"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  FileTextIcon,
  CommandIcon,
} from "lucide-react";
import { useT } from "@/components/i18n-provider";

type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useT();

  const [user, setUser] = React.useState<SidebarUser>({
    name: t("nav.admin"),
    email: "",
    avatar: "/vercel.svg",
  });

  React.useEffect(() => {
    setUser((prev) => (prev.email ? prev : { ...prev, name: t("nav.admin") }));
  }, [t]);

  const navMain = React.useMemo(
    () => [
      {
        title: t("nav.dashboard"),
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
      },
      {
        title: t("nav.users"),
        url: "/users",
        icon: <ListIcon />,
      },
      {
        title: t("nav.admins"),
        url: "/admins",
        icon: <ChartBarIcon />,
      },
      {
        title: t("nav.courses"),
        url: "/courses",
        icon: <FolderIcon />,
      },
      {
        title: t("nav.messages"),
        url: "/messages",
        icon: <UsersIcon />,
      },
      {
        title: t("nav.goals"),
        url: "/goals",
        icon: <FileTextIcon />,
      },
    ],
    [t],
  );

  const navBot = React.useMemo(
    () => [
      {
        title: t("nav.texts"),
        url: "/bot-texts",
        icon: <FileTextIcon />,
      },
      {
        title: t("nav.buttons"),
        url: "/bot-buttons",
        icon: <FileTextIcon />,
      },
    ],
    [t],
  );

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) return;

        const adminValue =
          data && typeof data === "object"
            ? (data as Record<string, unknown>).admin
            : null;

        const name =
          adminValue && typeof adminValue === "object"
            ? (adminValue as Record<string, unknown>).name
            : undefined;
        const email =
          adminValue && typeof adminValue === "object"
            ? (adminValue as Record<string, unknown>).email
            : undefined;

        if (cancelled) return;

        setUser((prev) => ({
          ...prev,
          name:
            typeof name === "string" && name.trim().length > 0
              ? name
              : prev.name,
          email:
            typeof email === "string" && email.trim().length > 0
              ? email
              : prev.email,
        }));
      } catch {
        // ignore
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">JLPT Master</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.bot")}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {navBot.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={`${t("nav.bot")}: ${item.title}`}
                    render={<a href={item.url} />}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
