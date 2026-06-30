"use client";

import * as React from "react";
import {
  PhoneCall,
  TrendingUp,
  CheckCircle2,
  Building2,
  Users,
  CalendarClock,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { trpc } from "@/trpc/react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

type FunnelStatus = "UNALLOCATED" | "IN_PROGRESS" | "COMPLETED";

const FUNNEL_LABELS: Record<FunnelStatus, string> = {
  UNALLOCATED: "Unallocated",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const trendConfig = {
  service: { label: "Service", color: "var(--chart-1)" },
  sales: { label: "Sales", color: "var(--chart-3)" },
} satisfies ChartConfig;

const problemsConfig = {
  value: { label: "Calls", color: "var(--chart-1)" },
} satisfies ChartConfig;

const funnelConfig = {
  count: { label: "Leads", color: "var(--chart-2)" },
} satisfies ChartConfig;

function shortDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function KpiCard({
  icon: Icon,
  value,
  label,
  loading,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 space-y-1">
          {loading ? (
            <Skeleton className="h-7 w-14" />
          ) : (
            <p className="text-2xl font-bold tabular-nums leading-none">
              {value.toLocaleString()}
            </p>
          )}
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsView() {
  const overview = trpc.analytics.overview.useQuery();
  const data = overview.data;
  const loading = overview.isLoading;

  const kpis = data?.kpis;
  const trend = data?.trend ?? [];
  const problems = data?.problems ?? [];
  const funnel = (data?.funnel ?? []).map((f) => ({
    label: FUNNEL_LABELS[f.status as FunnelStatus] ?? f.status,
    count: f.count,
  }));

  const kpiCards: { icon: LucideIcon; label: string; value: number }[] = [
    { icon: PhoneCall, label: "Open Calls", value: kpis?.openServiceCalls ?? 0 },
    { icon: TrendingUp, label: "Open Leads", value: kpis?.openSalesLeads ?? 0 },
    {
      icon: CheckCircle2,
      label: "Closed This Month",
      value: kpis?.completedThisMonth ?? 0,
    },
    { icon: Building2, label: "Customers", value: kpis?.totalCustomers ?? 0 },
    { icon: Users, label: "Team", value: kpis?.totalUsers ?? 0 },
    {
      icon: CalendarClock,
      label: "AMC Companies",
      value: kpis?.amcCompanies ?? 0,
    },
    {
      icon: ClipboardList,
      label: "Open Job Cards",
      value: kpis?.openJobCards ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Operational overview at a glance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <KpiCard
            key={k.label}
            icon={k.icon}
            label={k.label}
            value={k.value}
            loading={loading}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call volume (14 days)</CardTitle>
          <CardDescription>
            Daily service and sales call activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : trend.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Call volume will appear here once tickets are logged."
            />
          ) : (
            <ChartContainer config={trendConfig} className="h-[280px] w-full">
              <AreaChart data={trend} margin={{ left: 4, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="fillService" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-service)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-service)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-sales)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-sales)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={shortDate}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => shortDate(String(value))}
                    />
                  }
                />
                <Area
                  dataKey="service"
                  type="monotone"
                  stroke="var(--color-service)"
                  fill="url(#fillService)"
                  strokeWidth={2}
                  stackId="a"
                />
                <Area
                  dataKey="sales"
                  type="monotone"
                  stroke="var(--color-sales)"
                  fill="url(#fillSales)"
                  strokeWidth={2}
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top problem types</CardTitle>
            <CardDescription>
              Most frequent service call categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : problems.length === 0 ? (
              <EmptyState
                title="No problem data"
                description="Categories will populate as service calls are logged."
              />
            ) : (
              <ChartContainer
                config={problemsConfig}
                className="h-[260px] w-full"
              >
                <BarChart
                  data={problems}
                  layout="vertical"
                  margin={{ left: 8, right: 12 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales pipeline</CardTitle>
            <CardDescription>Leads by current stage.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : funnel.length === 0 ? (
              <EmptyState
                title="No pipeline data"
                description="Leads will appear here once sales activity begins."
              />
            ) : (
              <ChartContainer config={funnelConfig} className="h-[260px] w-full">
                <BarChart data={funnel} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
