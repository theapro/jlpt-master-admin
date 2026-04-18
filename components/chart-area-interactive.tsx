"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n, useT } from "@/components/i18n-provider";

export const description = "An interactive area chart";

type DashboardChartPoint = {
  date: string;
  users: number;
  messages: number;
};

export function ChartAreaInteractive({
  data,
}: {
  data: DashboardChartPoint[];
}) {
  const t = useT();
  const { locale } = useI18n();
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  const chartConfig = React.useMemo(
    () =>
      ({
        users: {
          label: t("nav.users"),
          color: "var(--chart-1)",
        },
        messages: {
          label: t("nav.messages"),
          color: "var(--chart-2)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const daysToShow = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90;
    return sorted.slice(-daysToShow);
  }, [data, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t("dashboard.usersAndMessages")}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t("dashboard.activityForSelectedRange")}
          </span>
          <span className="@[540px]/card:hidden">
            {t("dashboard.selectedRange")}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d");
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">
              {t("dashboard.last3Months")}
            </ToggleGroupItem>
            <ToggleGroupItem value="30d">
              {t("dashboard.last30Days")}
            </ToggleGroupItem>
            <ToggleGroupItem value="7d">
              {t("dashboard.last7Days")}
            </ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value);
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label={t("dashboard.selectRangeAria")}
            >
              <SelectValue placeholder={t("dashboard.last3Months")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t("dashboard.last3Months")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("dashboard.last30Days")}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t("dashboard.last7Days")}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-users)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-users)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMessages" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-messages)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-messages)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="messages"
              type="natural"
              fill="url(#fillMessages)"
              stroke="var(--color-messages)"
            />
            <Area
              dataKey="users"
              type="natural"
              fill="url(#fillUsers)"
              stroke="var(--color-users)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
