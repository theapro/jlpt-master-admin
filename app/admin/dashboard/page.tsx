import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";

import { backendJson } from "@/lib/server-backend";

type DashboardResponse = {
  stats: {
    totalUsers: number;
    totalCourses: number;
    openSupportRequests: number;
    unreadMessages: number;
    newUsers30d: number;
    newUsers30dDeltaPct: number | null;
    newMessages7d: number;
    newMessages7dDeltaPct: number | null;
    newSupportRequests7d: number;
    newSupportRequests7dDeltaPct: number | null;
  };
  chartData: Array<{ date: string; users: number; messages: number }>;
  tableData: Array<{
    id: number;
    header: string;
    type: string;
    status: string;
    target: string;
    limit: string;
    reviewer: string;
  }>;
};

export default async function Page() {
  let dashboard: DashboardResponse;
  try {
    dashboard = await backendJson<DashboardResponse>("/api/admin/dashboard");
  } catch (err) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-destructive">
            {err instanceof Error ? err.message : "Failed to load dashboard"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={dashboard.stats} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={dashboard.chartData} />
      </div>
    </div>
  );
}
