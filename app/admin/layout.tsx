import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { backendJson, getAdminTokenFromCookies } from "@/lib/server-backend";

async function requireAdminSession() {
  const token = await getAdminTokenFromCookies();
  if (!token) redirect("/login");

  try {
    await backendJson("/api/admin/me", { token });
  } catch {
    redirect("/login");
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="@container/main flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
