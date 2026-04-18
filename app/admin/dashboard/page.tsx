import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type BotMetricsResponse = {
  enabled: boolean;
  now: number;
  retentionSec: number;
  windowSec: number;
  seriesMetric: string;
  series: Array<{ t: number; count: number; avgMs: number; maxMs: number }>;
  summary: Array<{
    metric: string;
    count: number;
    avgMs: number;
    maxMs: number;
  }>;
};

const formatMs = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 10) return value.toFixed(2);
  if (value < 100) return value.toFixed(1);
  return Math.round(value).toString();
};

const formatSecond = (epochSec: number) => {
  const d = new Date(epochSec * 1000);
  if (!Number.isFinite(d.getTime())) return String(epochSec);
  return d.toLocaleTimeString();
};

export default async function Page() {
  let dashboard: DashboardResponse;
  let botMetrics: BotMetricsResponse | null = null;
  let botMetricsError: string | null = null;
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

  try {
    botMetrics = await backendJson<BotMetricsResponse>(
      "/api/admin/bot-metrics?windowSec=60",
    );
  } catch (err) {
    botMetricsError =
      err instanceof Error ? err.message : "Failed to load bot metrics";
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={dashboard.stats} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={dashboard.chartData} />
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Bot performance</CardTitle>
            <CardDescription>
              {botMetrics
                ? `Last ${botMetrics.windowSec}s · Updated ${new Date(botMetrics.now).toLocaleTimeString()}`
                : "Bot metrics"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {botMetricsError ? (
              <p className="text-sm text-destructive">{botMetricsError}</p>
            ) : !botMetrics ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !botMetrics.enabled ? (
              <p className="text-sm text-muted-foreground">
                Metrics are disabled on backend. Set `BOT_METRICS=1` to enable.
              </p>
            ) : (
              <>
                <div className="grid gap-2">
                  <div className="text-sm text-muted-foreground">
                    Per-second ({botMetrics.seriesMetric})
                  </div>
                  {botMetrics.series.every((p) => p.count === 0) ? (
                    <p className="text-sm text-muted-foreground">
                      No data for this metric in the last {botMetrics.windowSec}
                      s. Send a message to the bot and refresh. If it stays
                      empty, the bot may be running on a different backend
                      instance/process.
                    </p>
                  ) : null}
                  <div className="max-h-80 overflow-y-auto rounded-xl ring-1 ring-foreground/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Second</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Avg (ms)</TableHead>
                          <TableHead>Max (ms)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {botMetrics.series.map((p) => (
                          <TableRow key={p.t}>
                            <TableCell>{formatSecond(p.t)}</TableCell>
                            <TableCell>{p.count}</TableCell>
                            <TableCell>{formatMs(p.avgMs)}</TableCell>
                            <TableCell>{formatMs(p.maxMs)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm text-muted-foreground">
                    Top metrics (window summary)
                  </div>
                  <div className="max-h-80 overflow-y-auto rounded-xl ring-1 ring-foreground/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Avg (ms)</TableHead>
                          <TableHead>Max (ms)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {botMetrics.summary.slice(0, 25).map((m) => (
                          <TableRow key={m.metric}>
                            <TableCell>{m.metric}</TableCell>
                            <TableCell>{m.count}</TableCell>
                            <TableCell>{formatMs(m.avgMs)}</TableCell>
                            <TableCell>{formatMs(m.maxMs)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
